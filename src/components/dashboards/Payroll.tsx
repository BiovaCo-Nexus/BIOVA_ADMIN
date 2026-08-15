import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CreditCard, Plus, Trash2, Edit, CheckCircle2, Clock, Search, Filter,
  DollarSign, Users, Award, Coins, Zap, Download, Send, Eye, X,
  FileText, CheckCircle, RefreshCw, AlertCircle, Building2, User,
  Calendar, Check, Loader2, Sparkles, ArrowUpRight, ChevronRight, HelpCircle
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export interface ActiveMemberDirectory {
  email: string
  name: string
  role: string
  department: string
  is_intern: boolean
  intern_id?: string
  contact?: string
  lifetimeRewardPoints: number
  unclaimedRewardInr: number
  completedTasksCount: number
}

export interface PayrollRecord {
  id: string
  user_email: string
  user_name: string
  employee_id?: string
  intern_id?: string
  role_department: string
  is_intern: boolean
  month: string
  year: number
  basic_salary: number
  reward_points: number
  reward_bonus: number
  allowances: number
  deductions: number
  net_salary: number
  status: 'draft' | 'pending' | 'approved' | 'paid' | 'on_hold'
  payment_method: string
  payment_details: string
  transaction_id?: string
  paid_date?: string
  admin_notes?: string
  created_at: string
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const YEARS = [2025, 2026, 2027, 2028]

const CURRENT_MONTH = MONTHS[new Date().getMonth()]
const CURRENT_YEAR = new Date().getFullYear()

const LOCAL_STORAGE_PAYROLL_KEY = "biovaco_payroll_records_cache"

function readLocalPayroll(): PayrollRecord[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_PAYROLL_KEY) || "[]")
  } catch {
    return []
  }
}

function writeLocalPayroll(data: PayrollRecord[]) {
  localStorage.setItem(LOCAL_STORAGE_PAYROLL_KEY, JSON.stringify(data))
}

export function Payroll() {
  const { toast } = useToast()

  // ─── Filter & Selection State ───────────────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState<string>(CURRENT_MONTH)
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterDepartment, setFilterDepartment] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all") // all, intern, staff

  // ─── Core Data State ───────────────────────────────────────────────────────
  const [payrollList, setPayrollList] = useState<PayrollRecord[]>(readLocalPayroll)
  const [activeDirectory, setActiveDirectory] = useState<ActiveMemberDirectory[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)

  // ─── Modals State ──────────────────────────────────────────────────────────
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false)
  const [editingRecord, setEditingRecord] = useState<Partial<PayrollRecord> | null>(null)
  const [selectedDirectoryMember, setSelectedDirectoryMember] = useState<string>("")

  const [markPaidModalOpen, setMarkPaidModalOpen] = useState<boolean>(false)
  const [markPaidRecord, setMarkPaidRecord] = useState<PayrollRecord | null>(null)
  const [markPaidTxnId, setMarkPaidTxnId] = useState<string>("")
  const [markPaidMode, setMarkPaidMode] = useState<string>("UPI Transfer")
  const [markPaidDate, setMarkPaidDate] = useState<string>("")
  const [markPaidRemarks, setMarkPaidRemarks] = useState<string>("")
  const [sendPayslipEmail, setSendPayslipEmail] = useState<boolean>(true)
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false)

  const [viewPayslipRecord, setViewPayslipRecord] = useState<PayrollRecord | null>(null)

  // ─── 1. Fetch & Harmonize Active Members, Interns & Reward Points ─────────
  const fetchActiveDirectoryAndPoints = async () => {
    setIsSyncing(true)
    try {
      // 1. Fetch active interns from 'interns' table
      const { data: internsData } = await supabase
        .from('interns')
        .select('*')
        .eq('status', 'Active')

      // 2. Fetch active access control users from 'user_page_access'
      const { data: accessData } = await supabase
        .from('user_page_access')
        .select('*')
        .eq('is_active', true)

      // 3. Fetch all validated knowledge tracker items to calculate reward points
      const { data: knowledgeData } = await supabase
        .from('knowledge_items')
        .select('*')

      // 4. Fetch reward withdrawals to calculate claimed / unclaimed rewards
      const { data: withdrawalsData } = await supabase
        .from('reward_withdrawals')
        .select('*')

      // 5. Build Points Map per verified email (lower case)
      const pointsMap = new Map<string, { totalPoints: number; completedCount: number; speedBonusCount: number }>()

      if (knowledgeData) {
        knowledgeData.forEach((item: any) => {
          if (item.status === 'validated' && item.assigned_to) {
            const emails = item.assigned_to.split(',').map((e: string) => e.toLowerCase().trim()).filter(Boolean)
            
            // Base points
            const priPoints: Record<string, number> = { critical: 50, high: 30, medium: 20, low: 10 }
            const base = priPoints[item.priority] || 20
            let speedBonus = 0

            if (item.due_date && item.updated_at) {
              const due = new Date(item.due_date).getTime()
              const completed = new Date(item.updated_at).getTime()
              const hoursEarly = (due - completed) / (1000 * 60 * 60)
              if (hoursEarly >= 24) speedBonus = 15
              else if (hoursEarly >= 0) speedBonus = 5
            } else {
              speedBonus = 5
            }

            const itemPoints = base + speedBonus

            emails.forEach((email: string) => {
              const current = pointsMap.get(email) || { totalPoints: 0, completedCount: 0, speedBonusCount: 0 }
              pointsMap.set(email, {
                totalPoints: current.totalPoints + itemPoints,
                completedCount: current.completedCount + 1,
                speedBonusCount: current.speedBonusCount + (speedBonus > 0 ? 1 : 0)
              })
            })
          }
        })
      }

      // Claimed points map
      const claimedMap = new Map<string, number>()
      if (withdrawalsData) {
        withdrawalsData.forEach((w: any) => {
          if (w.status === 'paid' && w.user_email) {
            const email = w.user_email.toLowerCase().trim()
            claimedMap.set(email, (claimedMap.get(email) || 0) + Number(w.amount || w.points || 0))
          }
        })
      }

      // Unify Directory
      const directoryMap = new Map<string, ActiveMemberDirectory>()

      // Add Standard Core Accounts
      const coreAccounts = [
        { email: "ceo@biovaco.in", name: "CEO & Founder", role: "Chief Executive Officer", department: "Executive Office", is_intern: false },
        { email: "md@biovaco.in", name: "Managing Director", role: "Managing Director", department: "Executive Office", is_intern: false },
        { email: "food@biovaco.in", name: "Food Tech Lead", role: "R&D Lead", department: "Research & Development", is_intern: false },
        { email: "nakul@biovaco.in", name: "Nakul Amundhada", role: "Chief Technical Officer", department: "Technology", is_intern: false },
        { email: "admin@biovaco.in", name: "Operations Admin", role: "Operations Administrator", department: "Operations", is_intern: false }
      ]

      coreAccounts.forEach(c => {
        const stats = pointsMap.get(c.email) || { totalPoints: 0, completedCount: 0, speedBonusCount: 0 }
        const claimed = claimedMap.get(c.email) || 0
        directoryMap.set(c.email, {
          email: c.email,
          name: c.name,
          role: c.role,
          department: c.department,
          is_intern: c.is_intern,
          lifetimeRewardPoints: stats.totalPoints,
          unclaimedRewardInr: Math.max(0, stats.totalPoints - claimed),
          completedTasksCount: stats.completedCount
        })
      })

      // Add Active Access Control Users
      if (accessData) {
        accessData.forEach((u: any) => {
          const email = (u.user_email || u.email || '').toLowerCase().trim()
          if (email && email.includes('@') && !directoryMap.has(email)) {
            const stats = pointsMap.get(email) || { totalPoints: 0, completedCount: 0, speedBonusCount: 0 }
            const claimed = claimedMap.get(email) || 0
            directoryMap.set(email, {
              email,
              name: u.user_label || u.role || email.split('@')[0],
              role: u.role || u.user_type || 'Team Member',
              department: u.department || 'Operations',
              is_intern: (u.user_type || '').toLowerCase().includes('intern'),
              lifetimeRewardPoints: stats.totalPoints,
              unclaimedRewardInr: Math.max(0, stats.totalPoints - claimed),
              completedTasksCount: stats.completedCount
            })
          }
        })
      }

      // Add Active Interns from Interns Management Table
      if (internsData) {
        internsData.forEach((intern: any) => {
          const email = (intern.email || '').toLowerCase().trim()
          if (email && email.includes('@')) {
            const stats = pointsMap.get(email) || { totalPoints: 0, completedCount: 0, speedBonusCount: 0 }
            const claimed = claimedMap.get(email) || 0
            directoryMap.set(email, {
              email,
              name: intern.name || email.split('@')[0],
              role: intern.position || 'Research Intern',
              department: intern.project_department || 'R&D Department',
              is_intern: true,
              intern_id: intern.id,
              contact: intern.contact,
              lifetimeRewardPoints: stats.totalPoints,
              unclaimedRewardInr: Math.max(0, stats.totalPoints - claimed),
              completedTasksCount: stats.completedCount
            })
          }
        })
      }

      const dirList = Array.from(directoryMap.values())
      setActiveDirectory(dirList)

      // Also Fetch from Supabase payroll_records table
      const { data: dbPayroll } = await supabase
        .from('payroll_records')
        .select('*')
        .order('created_at', { ascending: false })

      if (dbPayroll && dbPayroll.length > 0) {
        const local = readLocalPayroll()
        const mergedMap = new Map<string, PayrollRecord>()
        local.forEach(p => mergedMap.set(p.id, p))
        dbPayroll.forEach((p: any) => mergedMap.set(p.id, {
          id: p.id,
          user_email: (p.user_email || '').toLowerCase().trim(),
          user_name: p.user_name || 'Team Member',
          employee_id: p.employee_id,
          intern_id: p.intern_id,
          role_department: p.role_department || 'General',
          is_intern: Boolean(p.is_intern),
          month: p.month || CURRENT_MONTH,
          year: Number(p.year || CURRENT_YEAR),
          basic_salary: Number(p.basic_salary || p.net_salary || 0),
          reward_points: Number(p.reward_points || 0),
          reward_bonus: Number(p.reward_bonus || 0),
          allowances: Number(p.allowances || 0),
          deductions: Number(p.deductions || 0),
          net_salary: Number(p.net_salary || 0),
          status: p.status || 'pending',
          payment_method: p.payment_method || 'UPI',
          payment_details: p.payment_details || '',
          transaction_id: p.transaction_id,
          paid_date: p.paid_date,
          admin_notes: p.admin_notes,
          created_at: p.created_at || new Date().toISOString()
        }))

        const finalPayroll = Array.from(mergedMap.values())
        setPayrollList(finalPayroll)
        writeLocalPayroll(finalPayroll)
      }
    } catch (err) {
      console.warn("Payroll sync error:", err)
    } finally {
      setIsSyncing(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActiveDirectoryAndPoints()
  }, [])

  // ─── 2. Persist Helper (Local Storage + Supabase) ───────────────────────────
  const persistPayrollRecord = async (record: PayrollRecord) => {
    const current = readLocalPayroll()
    const exists = current.some(p => p.id === record.id)
    const updated = exists ? current.map(p => p.id === record.id ? record : p) : [record, ...current]
    setPayrollList(updated)
    writeLocalPayroll(updated)

    try {
      await supabase.from('payroll_records').upsert({
        id: record.id,
        user_email: record.user_email.toLowerCase().trim(),
        user_name: record.user_name,
        role_department: record.role_department,
        is_intern: record.is_intern,
        intern_id: record.intern_id || null,
        month: record.month,
        year: record.year,
        basic_salary: record.basic_salary,
        reward_points: record.reward_points,
        reward_bonus: record.reward_bonus,
        allowances: record.allowances,
        deductions: record.deductions,
        net_salary: record.net_salary,
        status: record.status,
        payment_method: record.payment_method,
        payment_details: record.payment_details,
        transaction_id: record.transaction_id || null,
        paid_date: record.paid_date || null,
        admin_notes: record.admin_notes || null
      })
    } catch (err) {
      console.warn("Supabase payroll upsert error:", err)
    }
  }

  // ─── 3. Auto-Generate Monthly Payroll Sheet ─────────────────────────────────
  const handleAutoGenerateMonth = async () => {
    if (activeDirectory.length === 0) {
      toast({ title: "No active users found in directory", variant: "destructive" })
      return
    }

    let addedCount = 0
    let updatedList = [...payrollList]

    activeDirectory.forEach(member => {
      // Check if entry already exists for this member in selected month & year
      const existing = updatedList.find(
        p => p.user_email.toLowerCase() === member.email.toLowerCase() &&
             p.month === selectedMonth &&
             p.year === selectedYear
      )

      if (!existing) {
        // Default stipend: ₹10,000 for Interns, ₹25,000 for Staff/Leads
        const defaultBase = member.is_intern ? 8000 : 25000
        const rewardBonus = member.unclaimedRewardInr // 1 Point = 1 INR
        const net = defaultBase + rewardBonus

        const newRec: PayrollRecord = {
          id: crypto.randomUUID(),
          user_email: member.email,
          user_name: member.name,
          role_department: `${member.role} • ${member.department}`,
          is_intern: member.is_intern,
          intern_id: member.intern_id,
          month: selectedMonth,
          year: selectedYear,
          basic_salary: defaultBase,
          reward_points: member.lifetimeRewardPoints,
          reward_bonus: rewardBonus,
          allowances: 0,
          deductions: 0,
          net_salary: net,
          status: 'draft',
          payment_method: 'UPI',
          payment_details: member.contact ? `${member.contact}@upi` : `${member.email.split('@')[0]}@okbiovaco`,
          created_at: new Date().toISOString()
        }

        updatedList.push(newRec)
        persistPayrollRecord(newRec)
        addedCount++
      }
    })

    if (addedCount > 0) {
      toast({
        title: `✅ Generated ${addedCount} Payroll Records!`,
        description: `Created monthly payroll sheet for ${selectedMonth} ${selectedYear} linked with live reward points.`
      })
    } else {
      toast({
        title: "All active members already added",
        description: `Payroll records for ${selectedMonth} ${selectedYear} are already generated.`
      })
    }
  }

  // ─── 4. Add / Edit Single Payroll Record ────────────────────────────────────
  const handleOpenNewModal = () => {
    const firstMember = activeDirectory[0]
    setEditingRecord({
      id: crypto.randomUUID(),
      month: selectedMonth,
      year: selectedYear,
      user_email: firstMember?.email || "",
      user_name: firstMember?.name || "",
      role_department: firstMember ? `${firstMember.role} • ${firstMember.department}` : "",
      is_intern: firstMember?.is_intern || false,
      basic_salary: firstMember?.is_intern ? 8000 : 25000,
      reward_points: firstMember?.lifetimeRewardPoints || 0,
      reward_bonus: firstMember?.unclaimedRewardInr || 0,
      allowances: 0,
      deductions: 0,
      net_salary: (firstMember?.is_intern ? 8000 : 25000) + (firstMember?.unclaimedRewardInr || 0),
      status: 'pending',
      payment_method: 'UPI',
      payment_details: firstMember?.contact ? `${firstMember.contact}@upi` : ''
    })
    setSelectedDirectoryMember(firstMember?.email || "")
    setEditModalOpen(true)
  }

  const handleDirectorySelectChange = (email: string) => {
    setSelectedDirectoryMember(email)
    const found = activeDirectory.find(m => m.email.toLowerCase() === email.toLowerCase())
    if (found && editingRecord) {
      const base = editingRecord.basic_salary || (found.is_intern ? 8000 : 25000)
      const reward = found.unclaimedRewardInr
      const allow = editingRecord.allowances || 0
      const ded = editingRecord.deductions || 0
      const net = Math.max(0, base + reward + allow - ded)

      setEditingRecord({
        ...editingRecord,
        user_email: found.email,
        user_name: found.name,
        role_department: `${found.role} • ${found.department}`,
        is_intern: found.is_intern,
        intern_id: found.intern_id,
        reward_points: found.lifetimeRewardPoints,
        reward_bonus: reward,
        basic_salary: base,
        net_salary: net,
        payment_details: found.contact ? `${found.contact}@upi` : editingRecord.payment_details || ''
      })
    }
  }

  const handleEditSalaryChange = (field: 'basic_salary' | 'reward_bonus' | 'allowances' | 'deductions', val: number) => {
    if (!editingRecord) return
    const updated = { ...editingRecord, [field]: isNaN(val) ? 0 : val }
    const base = Number(updated.basic_salary || 0)
    const reward = Number(updated.reward_bonus || 0)
    const allow = Number(updated.allowances || 0)
    const ded = Number(updated.deductions || 0)
    updated.net_salary = Math.max(0, base + reward + allow - ded)
    setEditingRecord(updated)
  }

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRecord || !editingRecord.user_email) {
      toast({ title: "Please select a member", variant: "destructive" }); return
    }

    const fullRecord: PayrollRecord = {
      id: editingRecord.id || crypto.randomUUID(),
      user_email: editingRecord.user_email.toLowerCase().trim(),
      user_name: editingRecord.user_name || editingRecord.user_email.split('@')[0],
      employee_id: editingRecord.employee_id,
      intern_id: editingRecord.intern_id,
      role_department: editingRecord.role_department || 'Team Member',
      is_intern: Boolean(editingRecord.is_intern),
      month: editingRecord.month || selectedMonth,
      year: Number(editingRecord.year || selectedYear),
      basic_salary: Number(editingRecord.basic_salary || 0),
      reward_points: Number(editingRecord.reward_points || 0),
      reward_bonus: Number(editingRecord.reward_bonus || 0),
      allowances: Number(editingRecord.allowances || 0),
      deductions: Number(editingRecord.deductions || 0),
      net_salary: Number(editingRecord.net_salary || 0),
      status: (editingRecord.status as any) || 'pending',
      payment_method: editingRecord.payment_method || 'UPI',
      payment_details: editingRecord.payment_details || '',
      transaction_id: editingRecord.transaction_id,
      paid_date: editingRecord.paid_date,
      admin_notes: editingRecord.admin_notes,
      created_at: editingRecord.created_at || new Date().toISOString()
    }

    await persistPayrollRecord(fullRecord)
    setEditModalOpen(false)
    setEditingRecord(null)

    toast({
      title: "✅ Payroll Record Saved!",
      description: `Saved for ${fullRecord.user_name} (${fullRecord.month} ${fullRecord.year}) — Net: ₹${fullRecord.net_salary}`
    })
  }

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this payroll record?")) return
    const updated = payrollList.filter(p => p.id !== id)
    setPayrollList(updated)
    writeLocalPayroll(updated)

    try {
      await supabase.from('payroll_records').delete().eq('id', id)
    } catch (e) { console.warn('Delete error:', e) }

    toast({ title: "Record Deleted" })
  }

  // ─── 5. Mark as Paid & Disburse with Transaction ID ─────────────────────────
  const handleOpenMarkPaid = (record: PayrollRecord) => {
    setMarkPaidRecord(record)
    setMarkPaidTxnId("")
    setMarkPaidMode(record.payment_method || "UPI Transfer")
    setMarkPaidDate(new Date().toISOString().slice(0, 16))
    setMarkPaidRemarks("")
    setSendPayslipEmail(true)
    setMarkPaidModalOpen(true)
  }

  const sendPayslipBrevoEmail = async (record: PayrollRecord, txnId: string, modeUsed: string, paidDateStr: string) => {
    const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || "xkeysib-brevo-key"
    const recipients = [
      { email: record.user_email, name: record.user_name },
      { email: "ceo@biovaco.in", name: "CEO Office (Salary Copy)" }
    ]

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; max-width: 650px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: 5px solid #4B49AC; border-radius: 8px; margin: 0 auto;">
        <div style="border-bottom: 2px solid #4B49AC; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="color: #1a202c; margin: 0; font-size: 22px; font-weight: 800;">BIOVACO NEXUS</h2>
            <p style="color: #718096; margin: 2px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Official Monthly Salary Slip &amp; Payout Confirmation</p>
          </div>
          <div style="text-align: right;">
            <span style="background-color: #ecfdf5; color: #047857; padding: 5px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block; border: 1px solid #a7f3d0;">
              PAID &amp; DISBURSED
            </span>
          </div>
        </div>

        <p style="color: #2d3748; font-size: 14px; line-height: 1.6;">
          Dear <strong>${record.user_name}</strong>,
        </p>

        <p style="color: #2d3748; font-size: 14px; line-height: 1.6;">
          Your salary and performance reward incentive for <strong>${record.month} ${record.year}</strong> has been successfully processed and transferred to your account.
        </p>

        <!-- Employee Info -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin: 15px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tr>
              <td style="padding: 4px 0; color: #718096; width: 130px;"><strong>Employee / Intern:</strong></td>
              <td style="padding: 4px 0; color: #1a202c; font-weight: bold;">${record.user_name} (${record.user_email})</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #718096;"><strong>Designation / Dept:</strong></td>
              <td style="padding: 4px 0; color: #4a5568;">${record.role_department}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #718096;"><strong>Pay Period:</strong></td>
              <td style="padding: 4px 0; color: #4a5568; font-weight: bold;">${record.month} ${record.year}</td>
            </tr>
          </table>
        </div>

        <!-- Breakdown Table -->
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead style="background-color: #f1f5f9;">
              <tr>
                <th style="padding: 10px 14px; text-align: left; color: #475569; font-size: 11px; text-transform: uppercase;">Salary Component</th>
                <th style="padding: 10px 14px; text-align: right; color: #475569; font-size: 11px; text-transform: uppercase;">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 9px 14px; color: #334155;">Base Salary / Monthly Stipend</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: bold; color: #0f172a;">₹${record.basic_salary}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9; background-color: #fcfdfd;">
                <td style="padding: 9px 14px; color: #047857;">
                  <strong>⚡ Performance Reward Bonus</strong> 
                  <span style="font-size: 11px; color: #059669;">(${record.reward_points} Validated Points)</span>
                </td>
                <td style="padding: 9px 14px; text-align: right; font-weight: bold; color: #047857;">+₹${record.reward_bonus}</td>
              </tr>
              ${record.allowances > 0 ? `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 9px 14px; color: #334155;">Allowances / Other Bonuses</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: bold; color: #0f172a;">+₹${record.allowances}</td>
              </tr>` : ''}
              ${record.deductions > 0 ? `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 9px 14px; color: #dc2626;">Deductions (Leaves/Taxes)</td>
                <td style="padding: 9px 14px; text-align: right; font-weight: bold; color: #dc2626;">-₹${record.deductions}</td>
              </tr>` : ''}
              <tr style="background-color: #f8fafc;">
                <td style="padding: 12px 14px; font-weight: 800; font-size: 14px; color: #1e1b4b;">NET PAYABLE SALARY</td>
                <td style="padding: 12px 14px; text-align: right; font-weight: 800; font-size: 18px; color: #047857;">₹${record.net_salary}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Transaction Details -->
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin: 20px 0; font-size: 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 3px 0; color: #166534; width: 140px;"><strong>Transaction ID / UTR:</strong></td>
              <td style="padding: 3px 0; color: #14532d; font-family: monospace; font-weight: bold; font-size: 13px;">${txnId || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #166534;"><strong>Payment Mode:</strong></td>
              <td style="padding: 3px 0; color: #14532d;">${modeUsed}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #166534;"><strong>Beneficiary A/C / UPI:</strong></td>
              <td style="padding: 3px 0; color: #14532d; font-family: monospace;">${record.payment_details}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #166534;"><strong>Disbursed Date:</strong></td>
              <td style="padding: 3px 0; color: #14532d;">${paidDateStr} IST</td>
            </tr>
          </table>
        </div>

        <p style="text-align: center; margin-top: 25px;">
          <a href="https://admin.biovaco.in" style="background-color: #4B49AC; color: #ffffff; text-decoration: none; padding: 11px 24px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
            Open BiovaCo Portal →
          </a>
        </p>

        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 20px; border-top: 1px solid #edf2f7; padding-top: 15px;">
          BiovaCo Nexus ERP System • Confidential Computer Generated Salary Slip
        </p>
      </div>
    `;

    try {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "accept": "application/json", "content-type": "application/json", "api-key": BREVO_API_KEY },
        body: JSON.stringify({
          sender: { name: "BiovaCo Finance & Payroll", email: "no-reply@biovaco.in" },
          to: recipients,
          subject: `[Salary Slip] ₹${record.net_salary} Disbursed for ${record.month} ${record.year} - ${record.user_name}`,
          htmlContent: emailHtml
        })
      });
    } catch(err) {
      console.warn("Brevo salary slip email error:", err);
    }
  }

  const handleConfirmMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!markPaidRecord) return
    if (!markPaidTxnId.trim()) {
      toast({ title: "Transaction ID / UTR is required", variant: "destructive" }); return
    }

    setIsProcessingPayment(true)
    const paidTimestamp = markPaidDate ? new Date(markPaidDate).toISOString() : new Date().toISOString()
    const paidDateFormatted = new Date(paidTimestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })

    const updatedRecord: PayrollRecord = {
      ...markPaidRecord,
      status: 'paid',
      transaction_id: markPaidTxnId.trim(),
      payment_method: markPaidMode,
      paid_date: paidTimestamp,
      admin_notes: markPaidRemarks.trim() || markPaidRecord.admin_notes
    }

    await persistPayrollRecord(updatedRecord)

    // ─── Auto-sync into Finance Management expense_records table ─────────────
    try {
      await supabase.from('expense_records').insert({
        expense_id: `EXP-PAYROLL-${updatedRecord.id.slice(0, 8).toUpperCase()}`,
        date: paidTimestamp.split('T')[0],
        category: "Salaries & Stipends",
        sub_category: updatedRecord.is_intern ? "Internship Stipend" : "Staff Salary & Rewards",
        description: `Salary & Performance Reward Payout - ${updatedRecord.user_name} (${updatedRecord.month} ${updatedRecord.year})`,
        amount: updatedRecord.net_salary,
        gst_amount: 0,
        total_amount: updatedRecord.net_salary,
        payment_mode: markPaidMode,
        transaction_ref_number: markPaidTxnId.trim(),
        paid_by_role: "Executive Finance",
        paid_by_name: "BiovaCo Payroll Office",
        beneficiary_name: updatedRecord.user_name,
        project_department: updatedRecord.role_department,
        reimbursement_status: "Approved",
        remarks: `Base: ₹${updatedRecord.basic_salary} + Reward Bonus: ₹${updatedRecord.reward_bonus} - Deductions: ₹${updatedRecord.deductions}. ${markPaidRemarks ? `Admin Note: ${markPaidRemarks}` : ''}`
      })
    } catch (expErr) {
      console.warn("Auto-sync to expense_records error:", expErr)
    }

    if (sendPayslipEmail) {
      await sendPayslipBrevoEmail(updatedRecord, markPaidTxnId.trim(), markPaidMode, paidDateFormatted)
    }

    setIsProcessingPayment(false)
    setMarkPaidModalOpen(false)
    setMarkPaidRecord(null)

    toast({
      title: "✅ Salary Disbursed & Marked as PAID!",
      description: `Txn: ${markPaidTxnId} recorded & salary slip sent to ${updatedRecord.user_email}.`
    })
  }

  // ─── 6. Computed Filtered Records & Aggregates ──────────────────────────────
  const filteredRecords = useMemo(() => {
    return payrollList.filter(record => {
      const matchMonth = selectedMonth === "all" || record.month === selectedMonth
      const matchYear = selectedYear === 0 || record.year === selectedYear
      
      const query = searchQuery.toLowerCase().trim()
      const matchSearch = !query ||
        record.user_name.toLowerCase().includes(query) ||
        record.user_email.toLowerCase().includes(query) ||
        record.role_department.toLowerCase().includes(query)

      const matchDept = filterDepartment === "all" ||
        record.role_department.toLowerCase().includes(filterDepartment.toLowerCase())

      const matchStatus = filterStatus === "all" || record.status === filterStatus
      const matchType = filterType === "all" ||
        (filterType === "intern" && record.is_intern) ||
        (filterType === "staff" && !record.is_intern)

      return matchMonth && matchYear && matchSearch && matchDept && matchStatus && matchType
    })
  }, [payrollList, selectedMonth, selectedYear, searchQuery, filterDepartment, filterStatus, filterType])

  // KPIs
  const totalNetPayroll = filteredRecords.reduce((sum, r) => sum + r.net_salary, 0)
  const totalBaseSalary = filteredRecords.reduce((sum, r) => sum + r.basic_salary, 0)
  const totalRewardIncentives = filteredRecords.reduce((sum, r) => sum + r.reward_bonus, 0)
  const totalPaidOut = filteredRecords.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.net_salary, 0)
  const totalPendingPayout = filteredRecords.filter(r => r.status !== 'paid').reduce((sum, r) => sum + r.net_salary, 0)
  const paidCount = filteredRecords.filter(r => r.status === 'paid').length
  const pendingCount = filteredRecords.filter(r => r.status !== 'paid').length

  // ─── 7. CSV Export ──────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      toast({ title: "No records to export", variant: "destructive" }); return
    }

    const headers = ["Employee Name", "Email", "Role / Department", "Type", "Month", "Year", "Base Salary (INR)", "Reward Points", "Reward Bonus (INR)", "Allowances", "Deductions", "Net Salary (INR)", "Status", "Payment Mode", "Payment Details", "Transaction ID / UTR", "Disbursed Date"]
    const rows = filteredRecords.map(r => [
      `"${r.user_name}"`,
      `"${r.user_email}"`,
      `"${r.role_department}"`,
      r.is_intern ? "Intern" : "Core Staff",
      r.month,
      r.year,
      r.basic_salary,
      r.reward_points,
      r.reward_bonus,
      r.allowances,
      r.deductions,
      r.net_salary,
      r.status.toUpperCase(),
      `"${r.payment_method}"`,
      `"${r.payment_details}"`,
      `"${r.transaction_id || ''}"`,
      `"${r.paid_date || ''}"`
    ])

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `BiovaCo_Payroll_${selectedMonth}_${selectedYear}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({ title: "Payroll CSV Exported!" })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* ─── Header Title & Month Control ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4B49AC]/10 text-[#4B49AC] flex items-center justify-center">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                Payroll &amp; Salary Management
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-bold">
                  Live Rewards Linked
                </Badge>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Manage monthly salary disbursements, intern stipends, and performance reward bonuses.
              </p>
            </div>
          </div>
        </div>

        {/* Month, Year & Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[130px] h-9 text-xs font-bold bg-white">
              <Calendar className="h-3.5 w-3.5 mr-1 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[95px] h-9 text-xs font-bold bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={handleAutoGenerateMonth}
            className="bg-[#4B49AC] hover:bg-[#3d3b91] text-white text-xs font-bold h-9 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Auto-Generate Sheet
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenNewModal}
            className="text-xs font-bold h-9 bg-white hover:bg-slate-50 border-gray-300"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Record
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="text-xs font-bold h-9 bg-white hover:bg-slate-50 border-gray-300"
          >
            <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={fetchActiveDirectoryAndPoints}
            disabled={isSyncing}
            className="h-9 w-9 p-0"
            title="Refresh Directory"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-[#4B49AC]' : 'text-gray-500'}`} />
          </Button>
        </div>
      </div>

      {/* ─── Executive KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Net Payroll */}
        <Card className="bg-slate-900 text-white border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Total Net Payroll</p>
            <h3 className="text-2xl font-black mt-1 text-white tracking-tight">₹{totalNetPayroll.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{filteredRecords.length} members for {selectedMonth} {selectedYear}</p>
          </CardContent>
        </Card>

        {/* Base Salaries */}
        <Card className="border-gray-200 bg-white shadow-2xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Base Salaries / Stipends</p>
            <h3 className="text-2xl font-black mt-1 text-gray-900 tracking-tight">₹{totalBaseSalary.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Fixed contract stipend pool</p>
          </CardContent>
        </Card>

        {/* Reward Incentives Linked */}
        <Card className="border-amber-200 bg-amber-50/70 shadow-2xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <Coins className="h-3.5 w-3.5 text-amber-600" /> Reward Points Bonus
            </p>
            <h3 className="text-2xl font-black mt-1 text-amber-950 tracking-tight">+₹{totalRewardIncentives.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-amber-700 mt-0.5">1 Point = ₹1 INR performance pay</p>
          </CardContent>
        </Card>

        {/* Disbursed vs Pending */}
        <Card className="border-emerald-200 bg-emerald-50/70 shadow-2xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Disbursed Payouts
            </p>
            <h3 className="text-2xl font-black mt-1 text-emerald-950 tracking-tight">₹{totalPaidOut.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-emerald-700 mt-0.5">{paidCount} Paid · {pendingCount} Pending (₹{totalPendingPayout})</p>
          </CardContent>
        </Card>

        {/* Active Directory Staff */}
        <Card className="border-blue-200 bg-blue-50/70 shadow-2xs col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-blue-600" /> Active Directory
            </p>
            <h3 className="text-2xl font-black mt-1 text-blue-950 tracking-tight">{activeDirectory.length}</h3>
            <p className="text-[10px] text-blue-700 mt-0.5">
              {activeDirectory.filter(d => d.is_intern).length} Interns · {activeDirectory.filter(d => !d.is_intern).length} Staff
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Search & Filter Bar ────────────────────────────────────────────── */}
      <Card className="border-gray-200">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9 text-xs h-9"
                placeholder="Search member name, verified email, role, department..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[130px] text-xs h-9">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="intern">Interns Only</SelectItem>
                <SelectItem value="staff">Core Staff Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[130px] text-xs h-9">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid (Disbursed)</SelectItem>
                <SelectItem value="pending">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ─── Payroll Table ──────────────────────────────────────────────────── */}
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-bold">Member &amp; Verified Email</th>
                <th className="text-left px-4 py-3 font-bold">Role &amp; Department</th>
                <th className="text-right px-3 py-3 font-bold">Base Stipend</th>
                <th className="text-right px-3 py-3 font-bold">
                  <span className="flex items-center justify-end gap-1 text-amber-700">
                    <Coins className="h-3 w-3" /> Reward Bonus
                  </span>
                </th>
                <th className="text-right px-3 py-3 font-bold">Deductions</th>
                <th className="text-right px-4 py-3 font-extrabold text-[#4B49AC]">Net Payable</th>
                <th className="text-center px-3 py-3 font-bold">Status</th>
                <th className="text-right px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[#4B49AC]" />
                    Loading payroll and active directory...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <CreditCard className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p className="font-semibold text-gray-600">No payroll records found for {selectedMonth} {selectedYear}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Click <strong>"Auto-Generate Sheet"</strong> to automatically create records for all active interns &amp; staff.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map(record => {
                  const isPaid = record.status === 'paid'
                  return (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Member Info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            record.is_intern ? 'bg-amber-100 text-amber-800' : 'bg-[#4B49AC]/10 text-[#4B49AC]'
                          }`}>
                            {record.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-1.5">
                              {record.user_name}
                              {record.is_intern && (
                                <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[9px] px-1 py-0 font-semibold">
                                  Intern
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 font-mono">{record.user_email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role & Dept */}
                      <td className="px-4 py-3">
                        <p className="text-gray-900 font-medium">{record.role_department.split('•')[0] || record.role_department}</p>
                        <p className="text-[10px] text-gray-400">{record.role_department.split('•')[1] || ''}</p>
                      </td>

                      {/* Base Salary */}
                      <td className="px-3 py-3 text-right font-semibold text-gray-800">
                        ₹{record.basic_salary.toLocaleString('en-IN')}
                      </td>

                      {/* Reward Bonus */}
                      <td className="px-3 py-3 text-right">
                        <span className="font-bold text-emerald-700">
                          +₹{record.reward_bonus.toLocaleString('en-IN')}
                        </span>
                        {record.reward_points > 0 && (
                          <span className="text-[10px] text-gray-400 block font-normal">
                            ({record.reward_points} Pts)
                          </span>
                        )}
                      </td>

                      {/* Deductions */}
                      <td className="px-3 py-3 text-right text-red-600 font-medium">
                        {record.deductions > 0 ? `-₹${record.deductions.toLocaleString('en-IN')}` : '—'}
                      </td>

                      {/* Net Payable */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-extrabold text-gray-900">
                          ₹{record.net_salary.toLocaleString('en-IN')}
                        </span>
                        {record.payment_details && (
                          <span className="text-[10px] text-gray-400 font-mono block truncate max-w-[130px] ml-auto">
                            {record.payment_details}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 text-center">
                        <Badge
                          className={`text-[10px] font-bold ${
                            record.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            record.status === 'approved' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            record.status === 'on_hold' ? 'bg-red-100 text-red-800 border-red-300' :
                            record.status === 'draft' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                            'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {record.status.toUpperCase()}
                        </Badge>
                        {record.transaction_id && (
                          <p className="text-[9px] font-mono text-blue-700 mt-0.5 truncate max-w-[100px] mx-auto">
                            Txn: {record.transaction_id}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isPaid && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenMarkPaid(record)}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 shadow-2xs"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Disburse / Pay
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-500 hover:text-gray-900"
                            onClick={() => setViewPayslipRecord(record)}
                            title="View Salary Slip"
                          >
                            <FileText className="h-3.5 w-3.5 text-[#4B49AC]" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-500 hover:text-gray-900"
                            onClick={() => {
                              setEditingRecord(record)
                              setSelectedDirectoryMember(record.user_email)
                              setEditModalOpen(true)
                            }}
                            title="Edit Record"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteRecord(record.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ═══════════════ MODAL 1: ADD / EDIT PAYROLL RECORD ═══════════════ */}
      {editModalOpen && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4B49AC]/10 text-[#4B49AC] flex items-center justify-center font-bold">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {editingRecord.id ? 'Edit Payroll & Salary Record' : 'Add Member to Payroll'}
                  </h3>
                  <p className="text-xs text-gray-500">Pay Period: {editingRecord.month} {editingRecord.year}</p>
                </div>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="p-6 space-y-4">
              {/* Member Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase">Select Active Member / Intern *</label>
                <Select value={selectedDirectoryMember} onValueChange={handleDirectorySelectChange}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Choose active member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeDirectory.map(m => (
                      <SelectItem key={m.email} value={m.email}>
                        {m.name} ({m.email}) {m.is_intern ? '• Intern' : '• Staff'} · {m.unclaimedRewardInr} Pts
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Linked Member Summary */}
              {selectedDirectoryMember && (
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-900">{editingRecord.user_name}</p>
                    <p className="text-[11px] text-gray-500">{editingRecord.role_department}</p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-xs flex items-center gap-1">
                    <Coins className="h-3 w-3 text-amber-600" />
                    {editingRecord.reward_points || 0} Validated Points
                  </Badge>
                </div>
              )}

              {/* Salary Breakdown Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase">Base Salary / Stipend (₹) *</label>
                  <Input
                    type="number"
                    required
                    value={editingRecord.basic_salary ?? 0}
                    onChange={e => handleEditSalaryChange('basic_salary', parseFloat(e.target.value))}
                    className="h-10 text-sm font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-amber-800 uppercase flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5 text-amber-600" /> Reward Points Bonus (₹)
                  </label>
                  <Input
                    type="number"
                    value={editingRecord.reward_bonus ?? 0}
                    onChange={e => handleEditSalaryChange('reward_bonus', parseFloat(e.target.value))}
                    className="h-10 text-sm font-bold text-amber-900 bg-amber-50/50 border-amber-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase">Allowances / Bonus (₹)</label>
                  <Input
                    type="number"
                    value={editingRecord.allowances ?? 0}
                    onChange={e => handleEditSalaryChange('allowances', parseFloat(e.target.value))}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-red-700 uppercase">Deductions / Leaves (₹)</label>
                  <Input
                    type="number"
                    value={editingRecord.deductions ?? 0}
                    onChange={e => handleEditSalaryChange('deductions', parseFloat(e.target.value))}
                    className="h-10 text-sm text-red-700"
                  />
                </div>
              </div>

              {/* Net Payable Highlight */}
              <div className="bg-[#4B49AC]/10 border border-[#4B49AC]/30 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-[#4B49AC] uppercase">Net Payable Salary</p>
                  <p className="text-xs text-gray-500">Base + Reward Bonus + Allowances - Deductions</p>
                </div>
                <div className="text-2xl font-black text-[#4B49AC]">
                  ₹{(editingRecord.net_salary ?? 0).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Status & Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase">Payment Status *</label>
                  <Select value={editingRecord.status || 'pending'} onValueChange={v => setEditingRecord({ ...editingRecord, status: v as any })}>
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending Approval</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid (Disbursed)</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase">Payment Method</label>
                  <Select value={editingRecord.payment_method || 'UPI'} onValueChange={v => setEditingRecord({ ...editingRecord, payment_method: v })}>
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI">UPI (GooglePay/PhonePe/Paytm)</SelectItem>
                      <SelectItem value="Bank IMPS Transfer">Bank IMPS Transfer</SelectItem>
                      <SelectItem value="Bank NEFT">Bank NEFT Transfer</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase">Beneficiary UPI ID or Bank Details</label>
                <Input
                  value={editingRecord.payment_details || ""}
                  onChange={e => setEditingRecord({ ...editingRecord, payment_details: e.target.value })}
                  placeholder="e.g. 9876543210@paytm or HDFC A/C: 50100..."
                  className="h-10 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase">Admin / Finance Notes</label>
                <Textarea
                  value={editingRecord.admin_notes || ""}
                  onChange={e => setEditingRecord({ ...editingRecord, admin_notes: e.target.value })}
                  placeholder="Optional remarks..."
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#4B49AC] hover:bg-[#3d3b91] text-white font-bold px-6">
                  Save Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL 2: DISBURSE SALARY & MARK AS PAID ═══════════════ */}
      {markPaidModalOpen && markPaidRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Disburse Salary &amp; Mark as Paid</h3>
                  <p className="text-xs text-gray-500">Record bank UTR / reference ID &amp; generate salary slip</p>
                </div>
              </div>
              <button onClick={() => setMarkPaidModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmMarkPaid} className="p-6 space-y-4">
              {/* Summary */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold uppercase">Net Payable Amount</span>
                  <span className="text-xl font-extrabold text-emerald-700">₹{markPaidRecord.net_salary.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-gray-500">Beneficiary:</span>
                  <span className="font-bold text-gray-900">{markPaidRecord.user_name} &lt;{markPaidRecord.user_email}&gt;</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Payment Period:</span>
                  <span className="font-semibold text-gray-800">{markPaidRecord.month} {markPaidRecord.year}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Beneficiary Details:</span>
                  <span className="font-mono font-bold text-[#4B49AC]">{markPaidRecord.payment_details || 'UPI / Bank Transfer'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase">
                  Transaction ID / UTR / Reference Number *
                </label>
                <Input
                  required
                  value={markPaidTxnId}
                  onChange={e => setMarkPaidTxnId(e.target.value)}
                  placeholder="e.g. UPI UTR 423589123456 or IMPS98765432"
                  className="h-10 text-sm font-mono font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase">Payment Mode Used *</label>
                  <Select value={markPaidMode} onValueChange={setMarkPaidMode}>
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI Transfer (GPay/PhonePe)">UPI Transfer (GPay/PhonePe)</SelectItem>
                      <SelectItem value="Bank IMPS Transfer">Bank IMPS Transfer</SelectItem>
                      <SelectItem value="Bank NEFT Transfer">Bank NEFT Transfer</SelectItem>
                      <SelectItem value="Company Account Transfer">Company Account Transfer</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 uppercase">Disbursed Date &amp; Time *</label>
                  <Input
                    type="datetime-local"
                    required
                    value={markPaidDate}
                    onChange={e => setMarkPaidDate(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase">Finance / Admin Remarks</label>
                <Textarea
                  value={markPaidRemarks}
                  onChange={e => setMarkPaidRemarks(e.target.value)}
                  placeholder="Any payment notes..."
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sendPayslipCheck"
                  checked={sendPayslipEmail}
                  onChange={e => setSendPayslipEmail(e.target.checked)}
                  className="rounded border-gray-300 text-[#4B49AC] focus:ring-[#4B49AC]"
                />
                <label htmlFor="sendPayslipCheck" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Send official Salary Slip email to <strong>{markPaidRecord.user_email}</strong> via Brevo
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setMarkPaidModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
                >
                  {isProcessingPayment ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Recording Disbursement...</>
                  ) : (
                    <><Check className="h-4 w-4 mr-2" /> Confirm Payout &amp; Disburse</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL 3: VIEW & PRINT SALARY SLIP ═══════════════ */}
      {viewPayslipRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4B49AC]/10 text-[#4B49AC] flex items-center justify-center font-bold">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">BiovaCo Salary Slip (Payslip)</h3>
                  <p className="text-xs text-gray-500">Pay Period: {viewPayslipRecord.month} {viewPayslipRecord.year}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="h-8 text-xs font-bold"
                >
                  Print / PDF
                </Button>
                <button onClick={() => setViewPayslipRecord(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Slip Header */}
              <div className="border-b-2 border-[#4B49AC] pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">BIOVACO NEXUS</h2>
                  <p className="text-xs text-gray-500">BiovaCo Enterprise ERP &bull; Confidential</p>
                  <p className="text-xs text-gray-400 mt-0.5">contact@biovaco.in &bull; www.biovaco.in</p>
                </div>
                <div className="text-right">
                  <Badge className={`text-xs font-bold ${
                    viewPayslipRecord.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {viewPayslipRecord.status.toUpperCase()}
                  </Badge>
                  <p className="text-xs font-bold text-gray-700 mt-1">{viewPayslipRecord.month} {viewPayslipRecord.year}</p>
                </div>
              </div>

              {/* Member Details */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
                <div>
                  <p className="text-gray-400 font-semibold uppercase">Employee / Member Name</p>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">{viewPayslipRecord.user_name}</p>
                  <p className="text-gray-500 font-mono mt-0.5">{viewPayslipRecord.user_email}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold uppercase">Designation &amp; Department</p>
                  <p className="font-bold text-gray-900 mt-0.5">{viewPayslipRecord.role_department}</p>
                  <p className="text-gray-500 mt-0.5">Type: {viewPayslipRecord.is_intern ? 'Internship' : 'Regular Team'}</p>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-gray-700 border-b">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-bold uppercase">Earnings &amp; Incentives</th>
                      <th className="text-right px-4 py-2.5 font-bold uppercase">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-4 py-2.5 text-gray-800">Basic Salary / Monthly Stipend</td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-900">₹{viewPayslipRecord.basic_salary.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-emerald-50/40">
                      <td className="px-4 py-2.5 text-emerald-800 font-semibold flex items-center gap-1.5">
                        <Coins className="h-3.5 w-3.5 text-emerald-600" />
                        Performance Reward Bonus ({viewPayslipRecord.reward_points} Validated Points)
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-emerald-700">+₹{viewPayslipRecord.reward_bonus.toLocaleString('en-IN')}</td>
                    </tr>
                    {viewPayslipRecord.allowances > 0 && (
                      <tr>
                        <td className="px-4 py-2.5 text-gray-800">Allowances &amp; Other Bonuses</td>
                        <td className="px-4 py-2.5 text-right font-bold text-gray-900">+₹{viewPayslipRecord.allowances.toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                    {viewPayslipRecord.deductions > 0 && (
                      <tr>
                        <td className="px-4 py-2.5 text-red-600">Deductions (Unpaid Leaves / TDS)</td>
                        <td className="px-4 py-2.5 text-right font-bold text-red-600">-₹{viewPayslipRecord.deductions.toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                    <tr className="bg-slate-50 text-sm font-extrabold border-t-2 border-slate-200">
                      <td className="px-4 py-3 text-gray-900 uppercase">NET PAYABLE AMOUNT</td>
                      <td className="px-4 py-3 text-right text-emerald-700 text-base">₹{viewPayslipRecord.net_salary.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Details if Paid */}
              {viewPayslipRecord.status === 'paid' && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-emerald-900 uppercase">Payment Settlement Confirmation</p>
                  <p className="text-emerald-800">
                    <strong>Transaction ID / UTR:</strong> <span className="font-mono font-bold">{viewPayslipRecord.transaction_id || 'N/A'}</span>
                  </p>
                  <p className="text-emerald-800">
                    <strong>Payment Mode:</strong> {viewPayslipRecord.payment_method} &bull; <strong>Beneficiary:</strong> {viewPayslipRecord.payment_details}
                  </p>
                  {viewPayslipRecord.paid_date && (
                    <p className="text-emerald-700 text-[11px]">
                      Disbursed on: {new Date(viewPayslipRecord.paid_date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} IST
                    </p>
                  )}
                </div>
              )}

              <div className="text-center pt-2">
                <p className="text-[11px] text-gray-400">This is a system generated salary receipt authorized by BiovaCo Nexus Finance Office.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
