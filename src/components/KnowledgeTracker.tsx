import { useState, useMemo, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useOfflineSync } from "@/hooks/useOfflineSync"
import type { KnowledgeItem } from "@/hooks/useOfflineSync"
import {
  Plus, Trash2, X, Check, CheckCircle2, Circle, Clock,
  AlertTriangle, BookOpen, TrendingUp, Server, Search,
  Filter, ChevronDown, ChevronUp, Edit, Loader2,
  BarChart3, Target, Lightbulb, ShieldCheck, XCircle,
  Wifi, WifiOff, RefreshCw, CloudOff, User, Lock, UserCheck,
  Upload, Users, ListChecks, ChevronRight, Download, FileText,
  Send, ArrowLeft, Trophy, Coins, Zap, Sparkles, Award,
  Gift, Info, HelpCircle, Flame, ArrowUpRight, CreditCard,
  Wallet, Receipt, CheckCircle, AlertCircle, Bell, BellRing
} from "lucide-react"

type Priority = "critical" | "high" | "medium" | "low"
type Status = "pending" | "in_progress" | "pending_review" | "validated" | "rejected"
type Category = "system" | "market" | "competitor" | "regulation" | "technology" | "customer"

const CATEGORIES: { value: Category; label: string; icon: any; color: string }[] = [
  { value: "system", label: "System", icon: Server, color: "bg-[#4B49AC]/10 text-[#4B49AC] border-[#4B49AC]/20" },
  { value: "market", label: "Market", icon: TrendingUp, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "competitor", label: "Competitor", icon: Target, color: "bg-[#4B49AC]/10 text-[#4B49AC] border-[#4B49AC]/20" },
  { value: "regulation", label: "Regulation", icon: ShieldCheck, color: "bg-[#4B49AC]/10 text-[#4B49AC] border-[#4B49AC]/20" },
  { value: "technology", label: "Technology", icon: Lightbulb, color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  { value: "customer", label: "Customer", icon: BookOpen, color: "bg-pink-100 text-pink-800 border-pink-200" },
]
const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: "critical", label: "Critical", color: "bg-red-100 text-red-800 border-red-300" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-800 border-orange-300" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-700 border-gray-300" },
]
const STATUSES: { value: Status; label: string; icon: any; color: string }[] = [
  { value: "pending", label: "Pending", icon: Circle, color: "bg-slate-100 text-slate-700 border-slate-300" },
  { value: "in_progress", label: "In Progress", icon: Clock, color: "bg-blue-50 text-blue-700 border-blue-300" },
  { value: "pending_review", label: "Under Review", icon: AlertTriangle, color: "bg-amber-50 text-amber-800 border-amber-300" },
  { value: "validated", label: "Validated (Approved)", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-800 border-emerald-300" },
  { value: "rejected", label: "Changes Needed", icon: XCircle, color: "bg-red-50 text-red-700 border-red-300" },
]

const emptyForm = () => ({
  title: "", description: "", category: "system" as Category, priority: "medium" as Priority,
  status: "pending" as Status, source: "", validation_notes: "", due_date: "", assigned_to: ""
})

// ─── Bulk Todo Types ──────────────────────────────────────────────────────────
type BulkTask = {
  title: string
  description: string
  category: Category
  priority: Priority
  due_date: string
  source: string
  validation_notes: string
  _error?: string
}

const BULK_CSV_TEMPLATE = `title,description,category,priority,due_date,source
Analyze competitor pricing,Check competitor X new pricing strategy,market,high,2026-09-01,Internal Research
Update system documentation,Review and update all SOPs for Q3,system,medium,2026-09-15,Management`

function parseBulkCSV(raw: string): BulkTask[] {
  const lines = raw.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  return lines.slice(1).map(line => {
    // Handle quoted CSVs
    const cols: string[] = []
    let cur = '', inQuote = false
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuote = !inQuote }
      else if (line[i] === ',' && !inQuote) { cols.push(cur.trim()); cur = '' }
      else cur += line[i]
    }
    cols.push(cur.trim())
    const get = (field: string) => cols[headers.indexOf(field)] || ''
    const cat = get('category') as Category
    const pri = get('priority') as Priority
    const validCats: Category[] = ['system','market','competitor','regulation','technology','customer']
    const validPris: Priority[] = ['critical','high','medium','low']
    const task: BulkTask = {
      title: get('title'),
      description: get('description'),
      category: validCats.includes(cat) ? cat : 'system',
      priority: validPris.includes(pri) ? pri : 'medium',
      due_date: get('due_date'),
      source: get('source'),
      validation_notes: get('validation_notes') || '',
    }
    if (!task.title.trim()) task._error = 'Title is required'
    return task
  }).filter(t => t.title.trim())
}

// ─── Gamification & Rewards Helper (1 Point = ₹1 INR) ──────────────────────────
export interface TaskRewardInfo {
  basePoints: number
  speedBonus: number
  totalPoints: number
  inrValue: number
  bonusType: 'super_fast' | 'on_time' | 'none'
  bonusLabel: string
  breakdown: string
}

export function calculateTaskPoints(item: KnowledgeItem): TaskRewardInfo {
  let base = 20
  if (item.priority === 'critical') base = 50
  else if (item.priority === 'high') base = 30
  else if (item.priority === 'medium') base = 20
  else if (item.priority === 'low') base = 10

  let speedBonus = 0
  let bonusType: 'super_fast' | 'on_time' | 'none' = 'none'
  let bonusLabel = ''
  let breakdown = `Base: ${base} Pts`

  if (item.status === 'validated') {
    if (item.due_date) {
      const dueTime = new Date(item.due_date).getTime() + (23 * 3600 + 59 * 60) * 1000 // End of due day
      const completedTime = new Date(item.updated_at).getTime()
      const diffHours = (dueTime - completedTime) / (1000 * 3600)

      if (diffHours >= 24) {
        speedBonus = 15
        bonusType = 'super_fast'
        bonusLabel = '⚡ Super Fast (+15 Pts)'
        breakdown = `Base: ${base} Pts + ⚡ Super Early Bonus: 15 Pts (₹15)`
      } else if (diffHours >= 0) {
        speedBonus = 5
        bonusType = 'on_time'
        bonusLabel = '🎯 On-Time (+5 Pts)'
        breakdown = `Base: ${base} Pts + 🎯 On-Time Bonus: 5 Pts (₹5)`
      } else {
        bonusType = 'none'
        bonusLabel = 'Completed Overdue'
        breakdown = `Base: ${base} Pts (Completed Overdue - No speed bonus)`
      }
    } else {
      speedBonus = 5
      bonusType = 'on_time'
      bonusLabel = '🎯 Completed (+5 Pts)'
      breakdown = `Base: ${base} Pts + 🎯 Fast Action Bonus: 5 Pts (₹5)`
    }
  } else {
    // For pending/in progress potential
    speedBonus = 15 // potential max bonus
    bonusLabel = 'Potential up to +15 Pts Speed Bonus'
    breakdown = `Potential Earn: Base ${base} Pts + up to 15 Pts Speed Bonus = ${base + 15} Pts (₹${base + 15})`
  }

  const totalPoints = item.status === 'validated' ? (base + speedBonus) : (base + speedBonus)
  return {
    basePoints: base,
    speedBonus,
    totalPoints: item.status === 'validated' ? (base + speedBonus) : base,
    inrValue: item.status === 'validated' ? (base + speedBonus) : base,
    bonusType,
    bonusLabel,
    breakdown
  }
}

export function getMemberTier(points: number): {
  name: string
  icon: string
  color: string
  bg: string
  border: string
  min: number
  max: number
  nextName: string
  nextPoints: number
  progress: number
} {
  if (points >= 700) {
    return { name: 'Diamond Champion', icon: '💎', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', min: 700, max: 1000, nextName: 'Max Tier', nextPoints: 0, progress: 100 }
  }
  if (points >= 300) {
    return { name: 'Gold Star', icon: '🥇', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', min: 300, max: 700, nextName: 'Diamond Champion', nextPoints: 700 - points, progress: Math.min(100, Math.round(((points - 300) / 400) * 100)) }
  }
  if (points >= 100) {
    return { name: 'Silver Performer', icon: '🥈', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300', min: 100, max: 300, nextName: 'Gold Star', nextPoints: 300 - points, progress: Math.min(100, Math.round(((points - 100) / 200) * 100)) }
  }
  return { name: 'Bronze Achiever', icon: '🥉', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', min: 0, max: 100, nextName: 'Silver Performer', nextPoints: 100 - points, progress: Math.min(100, Math.round((points / 100) * 100)) }
}

// ─── Withdrawal & Claim Types ────────────────────────────────────────────────
// ─── Withdrawal & Claim Types ────────────────────────────────────────────────
export interface WithdrawalClaim {
  id: string
  user_email: string
  user_name: string
  amount: number
  points: number
  payment_method: 'UPI' | 'Bank Transfer' | 'Other'
  payment_details: string
  notes?: string
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  created_at: string
  processed_at?: string
  transaction_id?: string
  payment_mode_used?: string
  admin_notes?: string
  last_reminded_at?: string
  reminder_count?: number
}

const WITHDRAWALS_KEY = "biovaco_reward_withdrawals"

function readWithdrawals(): WithdrawalClaim[] {
  try {
    return JSON.parse(localStorage.getItem(WITHDRAWALS_KEY) || "[]")
  } catch {
    return []
  }
}

function writeWithdrawals(data: WithdrawalClaim[]) {
  localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(data))
}

export function KnowledgeTracker() {
  const { toast } = useToast()
  const { items, isOnline, isLoading, isSyncing, pendingCount, addItem, updateItem, deleteItem, forceSync } = useOfflineSync()
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterAssignee, setFilterAssignee] = useState<string>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // ─── Gamification, Wallet & Withdrawal State ─────────────────────────────────
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false)
  const [rulesModalOpen, setRulesModalOpen] = useState(false)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [executivePayoutsModalOpen, setExecutivePayoutsModalOpen] = useState(false)
  const [withdrawals, setWithdrawals] = useState<WithdrawalClaim[]>(readWithdrawals)
  const [claimAmountInput, setClaimAmountInput] = useState<string>("")
  const [claimPaymentMethod, setClaimPaymentMethod] = useState<'UPI' | 'Bank Transfer' | 'Other'>('UPI')
  const [claimPaymentDetails, setClaimPaymentDetails] = useState<string>("")
  const [claimNotes, setClaimNotes] = useState<string>("")
  const [isClaimSubmitting, setIsClaimSubmitting] = useState(false)
  const [payoutsFilterStatus, setPayoutsFilterStatus] = useState<string>('all')

  // ─── Mark Paid with Transaction ID Modal State ──────────────────────────────
  const [markPaidModalClaim, setMarkPaidModalClaim] = useState<WithdrawalClaim | null>(null)
  const [markPaidTxnId, setMarkPaidTxnId] = useState<string>("")
  const [markPaidMode, setMarkPaidMode] = useState<string>("UPI Transfer")
  const [markPaidTime, setMarkPaidTime] = useState<string>("")
  const [markPaidRemarks, setMarkPaidRemarks] = useState<string>("")
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)

  // ─── 2-Step Work QA & CEO Validation State ─────────────────────────────────
  const [submitReviewModalItem, setSubmitReviewModalItem] = useState<KnowledgeItem | null>(null)
  const [submitReviewProofNotes, setSubmitReviewProofNotes] = useState<string>("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [ceoReviewModalItem, setCeoReviewModalItem] = useState<KnowledgeItem | null>(null)
  const [ceoReviewFeedback, setCeoReviewFeedback] = useState<string>("")
  const [isCeoValidating, setIsCeoValidating] = useState(false)

  // ─── Bulk Todo State ─────────────────────────────────────────────────────────
  const [bulkStep, setBulkStep] = useState<0|1|2|3>(0)   // 0=closed, 1=select users, 2=upload tasks, 3=preview
  const [bulkSelectedEmails, setBulkSelectedEmails] = useState<string[]>([])
  const [bulkRawCSV, setBulkRawCSV] = useState(BULK_CSV_TEMPLATE)
  const [bulkParsedTasks, setBulkParsedTasks] = useState<BulkTask[]>([])
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false)
  const [bulkDefaultPriority, setBulkDefaultPriority] = useState<Priority>('medium')
  const [bulkDefaultDueDate, setBulkDefaultDueDate] = useState('')

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [interns, setInterns] = useState<{name: string, email: string}[]>([])
  const [accessUsers, setAccessUsers] = useState<{ label: string; email: string; type: string }[]>([])
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email || null
      setUserEmail(email)
      
      // Fetch active interns
      supabase.from('interns').select('name, email').eq('status', 'Active')
        .then(({ data: internData }) => {
          if (internData) setInterns(internData)
        })

      // Fetch active Access Control users from user_page_access
      supabase.from('user_page_access')
        .select('*')
        .eq('is_active', true)
        .then(({ data: accessData }) => {
          if (accessData) {
            const mapped = accessData.map((u: any) => ({
              label: u.user_label || u.role || (u.user_email || u.email || 'User'),
              email: (u.user_email || u.email || '').toLowerCase().trim(),
              type: u.user_type || 'Team Member'
            })).filter(u => u.email.includes('@'))
            setAccessUsers(mapped)
          }
        })

      // Fetch / Sync Reward Withdrawals from Supabase table
      supabase.from('reward_withdrawals')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data: dbWithdrawals, error }) => {
          if (!error && dbWithdrawals && dbWithdrawals.length > 0) {
            const local = readWithdrawals()
            const map = new Map<string, WithdrawalClaim>()
            local.forEach(w => map.set(w.id, w))
            dbWithdrawals.forEach((w: any) => map.set(w.id, {
              id: w.id,
              user_email: (w.user_email || '').toLowerCase().trim(),
              user_name: w.user_name || 'Member',
              amount: Number(w.amount),
              points: Number(w.points || w.amount),
              payment_method: w.payment_method || 'UPI',
              payment_details: w.payment_details || '',
              notes: w.notes,
              status: w.status || 'pending',
              created_at: w.created_at || new Date().toISOString(),
              processed_at: w.processed_at,
              transaction_id: w.transaction_id,
              payment_mode_used: w.payment_mode_used,
              admin_notes: w.admin_notes,
              last_reminded_at: w.last_reminded_at,
              reminder_count: w.reminder_count
            }))
            const merged = Array.from(map.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            setWithdrawals(merged)
            writeWithdrawals(merged)
          }
        })
    })
  }, [])
  
  const isExecutive = userEmail === "ceo@biovaco.in" || userEmail === "md@biovaco.in"

  const assignableUsers = useMemo(() => {
    const list: { label: string; email: string; type: string }[] = [
      { label: "CEO", email: "ceo@biovaco.in", type: "Executive" },
      { label: "MD", email: "md@biovaco.in", type: "Executive" },
    ];

    // Add Access Control Users (user_page_access)
    accessUsers.forEach(u => {
      if (u.email && !list.some(existing => existing.email === u.email)) {
        list.push({
          label: u.label,
          email: u.email,
          type: u.type
        });
      }
    });

    // Add Interns table users
    interns.forEach(i => {
      const cleanEmail = (i.email || '').toLowerCase().trim();
      if (cleanEmail && !list.some(existing => existing.email === cleanEmail)) {
        list.push({
          label: `${i.name} (Intern)`,
          email: cleanEmail,
          type: "Intern"
        });
      }
    });

    return list;
  }, [accessUsers, interns]);

  // ─── STRICT SECURITY & ROLE FILTERING ─────────────────────────────────────────
  // Non-executive staff/interns can ONLY see tasks assigned to them or created by them.
  // Executive (CEO & MD) can see all company tasks or filter by assignee.
  const userAccessibleItems = useMemo(() => {
    if (!userEmail) return []

    const normUserEmail = userEmail.toLowerCase().trim()

    if (isExecutive) {
      if (filterAssignee === "mine") {
        return items.filter(item => {
          const assignees = (item.assigned_to || '').split(',').map(e => e.toLowerCase().trim())
          return assignees.includes(normUserEmail) || item.created_by?.toLowerCase().trim() === normUserEmail
        })
      }
      if (filterAssignee !== "all") {
        const normTarget = filterAssignee.toLowerCase().trim()
        return items.filter(item => {
          const assignees = (item.assigned_to || '').split(',').map(e => e.toLowerCase().trim())
          return assignees.includes(normTarget) || item.created_by?.toLowerCase().trim() === normTarget
        })
      }
      return items
    }

    // STRICT NON-EXECUTIVE SECURITY RULE:
    // Only return tasks explicitly assigned to or created by this non-executive user.
    // Tasks assigned to CEO, MD, or other staff members are COMPLETELY EXCLUDED.
    return items.filter(item => {
      const assignees = (item.assigned_to || '').split(',').map(e => e.toLowerCase().trim())
      const isAssigned = assignees.includes(normUserEmail)
      const isCreator = item.created_by?.toLowerCase().trim() === normUserEmail
      return isAssigned || isCreator
    })
  }, [items, userEmail, isExecutive, filterAssignee])

  const sendAssignmentEmail = async (
    targetEmails: string[],
    title: string,
    desc: string,
    prio: string,
    category: string,
    dueDate: string | null,
    creatorEmail: string | null
  ) => {
    const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || "xkeysib-brevo-key"
    
    const cleanAssignees = Array.from(new Set(targetEmails.map(e => e.toLowerCase().trim()).filter(e => e.includes("@"))));
    if (cleanAssignees.length === 0) return;

    // Always include ceo@biovaco.in for confirmation copy if not already in list
    const ceoEmail = "ceo@biovaco.in";
    const allRecipients = Array.from(new Set([...cleanAssignees, ceoEmail]));

    const formattedRecipients = allRecipients.map(email => {
      const foundUser = assignableUsers.find(u => u.email === email);
      return {
        email,
        name: foundUser ? foundUser.label : (email === ceoEmail ? "CEO Office (Confirmation Copy)" : email)
      };
    });

    const assigneeNamesStr = cleanAssignees.map(email => {
      const found = assignableUsers.find(u => u.email === email);
      return found ? found.label : email;
    }).join(", ");

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; max-width: 650px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: 5px solid #4B49AC; border-radius: 8px; margin: 0 auto;">
        <div style="border-bottom: 1px solid #edf2f7; pb-15px; margin-bottom: 20px;">
          <h2 style="color: #4B49AC; margin: 0; font-size: 20px;">BiovaCo Nexus — Task Assignment Notice</h2>
          <span style="background-color: #f2f6ff; color: #4B49AC; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block; margin-top: 6px;">AUTOMATED BREVO DISPATCH</span>
        </div>

        <p style="color: #2d3748; font-size: 14px; line-height: 1.6;">
          Hello Team,
        </p>

        <p style="color: #2d3748; font-size: 14px; line-height: 1.6;">
          A task has been assigned in the <strong>BiovaCo Nexus Knowledge Tracker</strong> by <strong>${creatorEmail || "Management"}</strong>.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; color: #718096; width: 140px;"><strong>Task Title:</strong></td>
              <td style="padding: 8px 0; color: #1a202c; font-weight: bold; font-size: 14px;">${title}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Assigned To:</strong></td>
              <td style="padding: 8px 0; color: #4B49AC; font-weight: bold;">${assigneeNamesStr}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Priority:</strong></td>
              <td style="padding: 8px 0;"><span style="background-color: #fff5f5; color: #c53030; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">${prio.toUpperCase()}</span></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Category:</strong></td>
              <td style="padding: 8px 0; color: #2d3748;">${category.toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Due Date:</strong></td>
              <td style="padding: 8px 0; color: #2d3748;">${dueDate || "As soon as possible"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; vertical-align: top;"><strong>Description:</strong></td>
              <td style="padding: 8px 0; color: #4a5568; line-height: 1.5;">${desc || "No description provided."}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #ebf8ff; border-left: 4px solid #3182ce; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
          <p style="margin: 0; color: #2b6cb0; font-size: 12px;">
            ℹ️ <strong>Confirmation Copy:</strong> This notification email was dispatched via Brevo SMTP to selected assignees and copy-sent to Executive Office (ceo@biovaco.in) for verification.
          </p>
        </div>

        <p style="text-align: center; margin-top: 25px;">
          <a href="https://admin.biovaco.in" style="background-color: #4B49AC; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
            Open BiovaCo Nexus Portal →
          </a>
        </p>

        <p style="color: #a0aec0; font-size: 11px; text-align: center; margin-top: 20px; border-top: 1px solid #edf2f7; pt: 15px;">
          BiovaCo Nexus Enterprise ERP System • Automated Task & Knowledge Tracking Notice
        </p>
      </div>
    `;

    const payload = {
      sender: { name: "BiovaCo Executive Office", email: "no-reply@biovaco.in" },
      to: formattedRecipients,
      subject: `[Task Assigned] ${title} (${prio.toUpperCase()})`,
      htmlContent: emailHtml
    };

    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "accept": "application/json", "content-type": "application/json", "api-key": BREVO_API_KEY },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast({
          title: "✉️ Assignment Email Sent!",
          description: `Dispatched to ${cleanAssignees.length} assignee(s) + CEO confirmation copy (ceo@biovaco.in).`
        });
      } else {
        toast({
          title: "Task Saved & Dispatched",
          description: `Assignment notification processed for ${cleanAssignees.join(", ")} & CEO.`
        });
      }
    } catch (err: any) {
      console.warn("Brevo assignment email dispatch error:", err);
    }
  }

  // Calculate statistics ONLY based on user-accessible items
  const stats = useMemo(() => {
    const total = userAccessibleItems.length
    const validated = userAccessibleItems.filter(i => i.status === "validated").length
    const pending = userAccessibleItems.filter(i => i.status === "pending").length
    const inProgress = userAccessibleItems.filter(i => i.status === "in_progress").length
    const critical = userAccessibleItems.filter(i => i.priority === "critical" && i.status !== "validated").length
    const overdue = userAccessibleItems.filter(i => i.due_date && new Date(i.due_date) < new Date() && i.status !== "validated" && i.status !== "rejected").length
    return { total, validated, pending, inProgress, critical, overdue }
  }, [userAccessibleItems])

  // ─── Gamification & Wallet Stats (1 Point = ₹1 INR) ──────────────────────────
  const userRewardStats = useMemo(() => {
    const normUserEmail = (userEmail || '').toLowerCase().trim()
    // Find all validated tasks belonging to this user
    const validatedTasks = items.filter(item => {
      if (item.status !== 'validated') return false
      const assignees = (item.assigned_to || '').split(',').map(e => e.toLowerCase().trim())
      return assignees.includes(normUserEmail) || (item.created_by || '').toLowerCase().trim() === normUserEmail
    })

    let totalPoints = 0
    let basePoints = 0
    let speedBonusPoints = 0
    let superFastCount = 0
    let onTimeCount = 0

    const taskRewards = validatedTasks.map(task => {
      const reward = calculateTaskPoints(task)
      totalPoints += reward.totalPoints
      basePoints += reward.basePoints
      speedBonusPoints += reward.speedBonus
      if (reward.bonusType === 'super_fast') superFastCount++
      if (reward.bonusType === 'on_time') onTimeCount++
      return { task, reward }
    })

    const tier = getMemberTier(totalPoints)

    // Calculate Claims & Withdrawn stats (Ledger Architecture)
    const myWithdrawals = withdrawals.filter(w => w.user_email.toLowerCase().trim() === normUserEmail)
    const totalPaidInr = myWithdrawals
      .filter(w => w.status === 'paid')
      .reduce((sum, w) => sum + w.amount, 0)
    const pendingClaimInr = myWithdrawals
      .filter(w => w.status === 'pending' || w.status === 'approved')
      .reduce((sum, w) => sum + w.amount, 0)
    // Account balance remains with member until CEO actually marks it paid:
    const currentAccountBalanceInr = Math.max(0, totalPoints - totalPaidInr)
    // Available to make a new claim request:
    const availableBalanceInr = Math.max(0, totalPoints - totalPaidInr - pendingClaimInr)

    return {
      totalPoints,
      totalInr: totalPoints, // Total lifetime earned
      currentAccountBalanceInr, // Account balance holding (only decreases when CEO marks paid)
      availableBalanceInr,   // Available to submit new claim
      totalClaimedInr: totalPaidInr + pendingClaimInr,
      totalPaidInr,          // Money disbursed by CEO
      pendingClaimInr,       // Money currently waiting for CEO action
      myWithdrawals,
      basePoints,
      speedBonusPoints,
      validatedCount: validatedTasks.length,
      superFastCount,
      onTimeCount,
      speedBonusCount: superFastCount + onTimeCount,
      tier,
      taskRewards
    }
  }, [items, userEmail, withdrawals])

  const teamLeaderboard = useMemo(() => {
    const memberPointsMap: Record<string, { email: string; label: string; type: string; totalPoints: number; completedCount: number; speedBonusCount: number; claimedInr: number; paidInr: number; pendingInr: number; availableInr: number }> = {}

    // Initialize with assignableUsers
    assignableUsers.forEach(u => {
      const cleanEmail = u.email.toLowerCase().trim()
      memberPointsMap[cleanEmail] = {
        email: cleanEmail,
        label: u.label,
        type: u.type,
        totalPoints: 0,
        completedCount: 0,
        speedBonusCount: 0,
        claimedInr: 0,
        paidInr: 0,
        pendingInr: 0,
        availableInr: 0
      }
    })

    items.filter(i => i.status === 'validated').forEach(item => {
      const reward = calculateTaskPoints(item)
      const assignees = (item.assigned_to || item.created_by || '').split(',').map(e => e.toLowerCase().trim()).filter(Boolean)
      
      assignees.forEach(email => {
        if (!memberPointsMap[email]) {
          memberPointsMap[email] = {
            email,
            label: email.split('@')[0],
            type: 'Team Member',
            totalPoints: 0,
            completedCount: 0,
            speedBonusCount: 0,
            claimedInr: 0,
            paidInr: 0,
            pendingInr: 0,
            availableInr: 0
          }
        }
        memberPointsMap[email].totalPoints += reward.totalPoints
        memberPointsMap[email].completedCount += 1
        if (reward.bonusType === 'super_fast' || reward.bonusType === 'on_time') {
          memberPointsMap[email].speedBonusCount += 1
        }
      })
    })

    // Compute withdrawal amounts per member
    withdrawals.forEach(w => {
      const cleanEmail = w.user_email.toLowerCase().trim()
      if (memberPointsMap[cleanEmail]) {
        if (w.status !== 'rejected') {
          memberPointsMap[cleanEmail].claimedInr += w.amount
        }
        if (w.status === 'paid') {
          memberPointsMap[cleanEmail].paidInr += w.amount
        }
        if (w.status === 'pending' || w.status === 'approved') {
          memberPointsMap[cleanEmail].pendingInr += w.amount
        }
      }
    })

    return Object.values(memberPointsMap)
      .map(m => ({
        ...m,
        availableInr: Math.max(0, m.totalPoints - m.claimedInr)
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        tier: getMemberTier(entry.totalPoints)
      }))
  }, [items, assignableUsers, withdrawals])

  const pendingWithdrawalsCount = useMemo(() => {
    return withdrawals.filter(w => w.status === 'pending').length
  }, [withdrawals])

  const sendWithdrawalEmailToCEO = async (
    claim: WithdrawalClaim,
    currentBalance: number
  ) => {
    const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || "xkeysib-brevo-key"
    const requestedAtStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })

    const recipients = [
      { email: "ceo@biovaco.in", name: "CEO Office (BiovaCo)" },
      { email: "md@biovaco.in", name: "MD Office (BiovaCo)" }
    ]

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; max-width: 650px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: 5px solid #4B49AC; border-radius: 8px; margin: 0 auto;">
        <div style="border-bottom: 1px solid #edf2f7; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #4B49AC; margin: 0; font-size: 20px;">💰 Reward Wallet Withdrawal Claim</h2>
          <span style="background-color: #f2f6ff; color: #4B49AC; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block; margin-top: 6px; border: 1px solid #c7d2fe;">
            EXECUTIVE PAYOUT ACTION REQUIRED
          </span>
        </div>

        <p style="color: #2d3748; font-size: 14px; line-height: 1.6;">
          Dear CEO &amp; Management,
        </p>

        <p style="color: #2d3748; font-size: 14px; line-height: 1.6;">
          <strong>${claim.user_name}</strong> (<code>${claim.user_email}</code>) has submitted a <strong>Claim / Withdrawal Request</strong> for their performance rewards on the Knowledge Tracker:
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; color: #718096; width: 150px;"><strong>Claim Amount:</strong></td>
              <td style="padding: 8px 0; color: #047857; font-weight: 800; font-size: 18px;">₹${claim.amount} (${claim.points} Points)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Claimed By:</strong></td>
              <td style="padding: 8px 0; color: #1a202c; font-weight: bold;">${claim.user_name} &lt;${claim.user_email}&gt;</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Payment Method:</strong></td>
              <td style="padding: 8px 0; color: #2d3748; font-weight: 600;">${claim.payment_method}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>UPI / Account Info:</strong></td>
              <td style="padding: 8px 0; color: #4B49AC; font-weight: bold; font-family: monospace; font-size: 14px;">${claim.payment_details}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Requested Time:</strong></td>
              <td style="padding: 8px 0; color: #2d3748;">${requestedAtStr} IST</td>
            </tr>
            ${claim.notes ? `
            <tr>
              <td style="padding: 8px 0; color: #718096; vertical-align: top;"><strong>Member Note:</strong></td>
              <td style="padding: 8px 0; color: #4a5568;">${claim.notes}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Remaining Balance:</strong></td>
              <td style="padding: 8px 0; color: #4a5568;">₹${Math.max(0, currentBalance - claim.amount)}</td>
            </tr>
          </table>
        </div>

        <p style="text-align: center; margin-top: 25px;">
          <a href="https://admin.biovaco.in" style="background-color: #4B49AC; color: #ffffff; text-decoration: none; padding: 11px 22px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
            Open Executive Payouts Dashboard →
          </a>
        </p>

        <p style="color: #a0aec0; font-size: 11px; text-align: center; margin-top: 20px; border-top: 1px solid #edf2f7; padding-top: 15px;">
          BiovaCo Nexus ERP System • Automated Reward Payout Notice
        </p>
      </div>
    `;

    const payload = {
      sender: { name: "BiovaCo Reward Wallet", email: "no-reply@biovaco.in" },
      to: recipients,
      subject: `[Payout Claim] ${claim.user_name} requested ₹${claim.amount} (${claim.points} Pts)`,
      htmlContent: emailHtml
    };

    try {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "accept": "application/json", "content-type": "application/json", "api-key": BREVO_API_KEY },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn("Brevo withdrawal email error:", err);
    }
  }

  const persistWithdrawalClaim = async (claim: WithdrawalClaim) => {
    // 1. Update localStorage
    const current = readWithdrawals()
    const exists = current.some(w => w.id === claim.id)
    const updated = exists ? current.map(w => w.id === claim.id ? claim : w) : [claim, ...current]
    setWithdrawals(updated)
    writeWithdrawals(updated)

    // 2. Push to Supabase Cloud Database (guaranteed sync even after refresh or glitch)
    try {
      await supabase.from('reward_withdrawals').upsert({
        id: claim.id,
        user_email: (claim.user_email || '').toLowerCase().trim(),
        user_name: claim.user_name || 'Member',
        amount: claim.amount,
        points: claim.points || claim.amount,
        payment_method: claim.payment_method,
        payment_details: claim.payment_details,
        notes: claim.notes || null,
        status: claim.status,
        transaction_id: claim.transaction_id || null,
        payment_mode_used: claim.payment_mode_used || null,
        admin_notes: claim.admin_notes || null,
        processed_at: claim.processed_at || null,
        last_reminded_at: claim.last_reminded_at || null,
        reminder_count: claim.reminder_count || 0,
        created_at: claim.created_at
      })
    } catch (e) {
      console.warn("Supabase reward_withdrawals upsert error:", e)
    }
  }

  const sendPayoutReminderEmailToCEO = async (claim: WithdrawalClaim) => {
    const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || "xkeysib-brevo-key"
    const reminderTimeStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
    const claimCreatedStr = new Date(claim.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })

    const recipients = [
      { email: "ceo@biovaco.in", name: "CEO BiovaCo" },
      { email: "md@biovaco.in", name: "MD BiovaCo" }
    ]

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; max-width: 650px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: 5px solid #f59e0b; border-radius: 8px; margin: 0 auto;">
        <div style="border-bottom: 1px solid #edf2f7; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #b45309; margin: 0; font-size: 20px;">🔔 Payout Follow-Up &amp; Member Reminder</h2>
          <span style="background-color: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block; margin-top: 6px; border: 1px solid #fde68a;">
            ACTION REQUIRED • PENDING REWARD CLAIM
          </span>
        </div>

        <p style="color: #2d3748; font-size: 14px; line-height: 1.6;">
          Executive Office,
        </p>

        <p style="color: #2d3748; font-size: 14px; line-height: 1.6;">
          Team member <strong>${claim.user_name}</strong> (<code>${claim.user_email}</code>) has sent a reminder regarding their pending reward payout of <strong>₹${claim.amount}</strong>.
        </p>

        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; color: #718096; width: 140px;"><strong>Member:</strong></td>
              <td style="padding: 8px 0; color: #1a202c; font-weight: bold;">${claim.user_name} (${claim.user_email})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Claim Amount:</strong></td>
              <td style="padding: 8px 0; color: #b45309; font-weight: 800; font-size: 16px;">₹${claim.amount} (${claim.points} Points)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Payment Mode &amp; A/C:</strong></td>
              <td style="padding: 8px 0; color: #4B49AC; font-family: monospace; font-weight: bold;">${claim.payment_method}: ${claim.payment_details}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Original Claim Date:</strong></td>
              <td style="padding: 8px 0; color: #2d3748;">${claimCreatedStr} IST</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Reminder Sent:</strong></td>
              <td style="padding: 8px 0; color: #b45309; font-weight: 700;">${reminderTimeStr} IST (Reminder #${(claim.reminder_count || 0) + 1})</td>
            </tr>
            ${claim.notes ? `
            <tr>
              <td style="padding: 8px 0; color: #718096; vertical-align: top;"><strong>Member Notes:</strong></td>
              <td style="padding: 8px 0; color: #2d3748; font-style: italic;">"${claim.notes}"</td>
            </tr>` : ''}
          </table>
        </div>

        <p style="text-align: center; margin-top: 25px;">
          <a href="https://admin.biovaco.in" style="background-color: #4B49AC; color: #ffffff; text-decoration: none; padding: 11px 22px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
            Open Executive Payouts &amp; Claims Center →
          </a>
        </p>

        <p style="color: #a0aec0; font-size: 11px; text-align: center; margin-top: 20px; border-top: 1px solid #edf2f7; padding-top: 15px;">
          BiovaCo Nexus ERP System • Real-Time Payout Reminder Service
        </p>
      </div>
    `;

    try {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "accept": "application/json", "content-type": "application/json", "api-key": BREVO_API_KEY },
        body: JSON.stringify({
          sender: { name: "BiovaCo Rewards Bot", email: "no-reply@biovaco.in" },
          to: recipients,
          subject: `🔔 [Payout Reminder] ${claim.user_name} requested update on ₹${claim.amount} claim`,
          htmlContent: emailHtml
        })
      });
    } catch (err) {
      console.warn("Brevo reminder email error:", err);
    }
  }

  const handleSendPayoutReminder = async (claimId: string) => {
    const claim = withdrawals.find(w => w.id === claimId)
    if (!claim) return

    const updatedClaim: WithdrawalClaim = {
      ...claim,
      last_reminded_at: new Date().toISOString(),
      reminder_count: (claim.reminder_count || 0) + 1
    }

    // Re-persist to both local and Supabase (restores to CEO board if previously missing)
    await persistWithdrawalClaim(updatedClaim)
    
    // Dispatches high-priority email to CEO
    await sendPayoutReminderEmailToCEO(updatedClaim)

    toast({
      title: "🔔 Reminder Sent to CEO!",
      description: `Notification sent to ceo@biovaco.in and claim re-synced to Executive Center.`
    })
  }

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(claimAmountInput)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" }); return
    }
    if (amountNum > userRewardStats.availableBalanceInr) {
      toast({
        title: "Insufficient available balance",
        description: `You have ₹${userRewardStats.availableBalanceInr} available to claim.`,
        variant: "destructive"
      }); return
    }
    if (!claimPaymentDetails.trim()) {
      toast({ title: "Payment details (UPI / Bank) required", variant: "destructive" }); return
    }

    setIsClaimSubmitting(true)
    const normUserEmail = (userEmail || '').toLowerCase().trim()
    const foundUser = assignableUsers.find(u => u.email === normUserEmail)
    const userName = foundUser ? foundUser.label : (userEmail?.split('@')[0] || "Team Member")

    const newClaim: WithdrawalClaim = {
      id: crypto.randomUUID(),
      user_email: normUserEmail,
      user_name: userName,
      amount: amountNum,
      points: amountNum, // 1 Point = 1 INR
      payment_method: claimPaymentMethod,
      payment_details: claimPaymentDetails.trim(),
      notes: claimNotes.trim() || undefined,
      status: 'pending',
      created_at: new Date().toISOString()
    }

    await persistWithdrawalClaim(newClaim)

    // Send email to CEO
    await sendWithdrawalEmailToCEO(newClaim, userRewardStats.availableBalanceInr)

    setIsClaimSubmitting(false)
    setWithdrawModalOpen(false)
    setClaimAmountInput("")
    setClaimPaymentDetails("")
    setClaimNotes("")

    toast({
      title: `🎉 Claim Submitted for ₹${amountNum}!`,
      description: `Request sent to ceo@biovaco.in for payout processing.`
    })
  }

  const sendPayoutCompletedEmailToMember = async (claim: WithdrawalClaim) => {
    const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || "xkeysib-brevo-key"
    const completedAtStr = claim.processed_at 
      ? new Date(claim.processed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
      : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })

    const recipients = [
      { email: claim.user_email, name: claim.user_name },
      { email: "ceo@biovaco.in", name: "CEO Office (Confirmation Copy)" }
    ]

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; max-width: 650px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: 5px solid #10b981; border-radius: 8px; margin: 0 auto;">
        <div style="border-bottom: 1px solid #edf2f7; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #065f46; margin: 0; font-size: 20px;">✅ Reward Payout Processed &amp; Paid</h2>
          <span style="background-color: #ecfdf5; color: #047857; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block; margin-top: 6px; border: 1px solid #a7f3d0;">
            OFFICIALLY DISBURSED BY CEO OFFICE
          </span>
        </div>

        <p style="color: #2d3748; font-size: 14px; line-height: 1.6;">
          Hello <strong>${claim.user_name}</strong>,
        </p>

        <p style="color: #2d3748; font-size: 14px; line-height: 1.6;">
          Your reward withdrawal claim of <strong>₹${claim.amount}</strong> (${claim.points} Points) has been approved and successfully disbursed to your provided account.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; color: #718096; width: 150px;"><strong>Amount Disbursed:</strong></td>
              <td style="padding: 8px 0; color: #047857; font-weight: 800; font-size: 18px;">₹${claim.amount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Transaction / UTR ID:</strong></td>
              <td style="padding: 8px 0; color: #1e3a8a; font-family: monospace; font-weight: bold; font-size: 14px;">${claim.transaction_id || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Payment Mode:</strong></td>
              <td style="padding: 8px 0; color: #2d3748; font-weight: 600;">${claim.payment_mode_used || claim.payment_method}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Beneficiary Details:</strong></td>
              <td style="padding: 8px 0; color: #4B49AC; font-family: monospace; font-weight: bold;">${claim.payment_details}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Disbursed Time:</strong></td>
              <td style="padding: 8px 0; color: #2d3748;">${completedAtStr} IST</td>
            </tr>
            ${claim.admin_notes ? `
            <tr>
              <td style="padding: 8px 0; color: #718096; vertical-align: top;"><strong>Admin Notes:</strong></td>
              <td style="padding: 8px 0; color: #2d3748;">${claim.admin_notes}</td>
            </tr>` : ''}
          </table>
        </div>

        <p style="text-align: center; margin-top: 25px;">
          <a href="https://admin.biovaco.in" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 11px 22px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
            Open Your Rewards Wallet →
          </a>
        </p>

        <p style="color: #a0aec0; font-size: 11px; text-align: center; margin-top: 20px; border-top: 1px solid #edf2f7; padding-top: 15px;">
          BiovaCo Nexus ERP System • Official Real-Time Payout Receipt
        </p>
      </div>
    `;

    try {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "accept": "application/json", "content-type": "application/json", "api-key": BREVO_API_KEY },
        body: JSON.stringify({
          sender: { name: "BiovaCo Executive Office", email: "no-reply@biovaco.in" },
          to: recipients,
          subject: `[Payout Paid] ₹${claim.amount} Disbursed (Txn: ${claim.transaction_id || 'Approved'})`,
          htmlContent: emailHtml
        })
      });
    } catch(err) {
      console.warn("Brevo payout paid email error:", err);
    }
  }

  const handleConfirmMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!markPaidModalClaim) return
    if (!markPaidTxnId.trim()) {
      toast({ title: "Transaction ID / UTR is required", variant: "destructive" }); return
    }

    setIsMarkingPaid(true)
    const processedTime = markPaidTime ? new Date(markPaidTime).toISOString() : new Date().toISOString()
    
    let updatedClaim: WithdrawalClaim | null = null
    const updated = withdrawals.map(w => {
      if (w.id === markPaidModalClaim.id) {
        updatedClaim = {
          ...w,
          status: 'paid' as const,
          transaction_id: markPaidTxnId.trim(),
          payment_mode_used: markPaidMode,
          processed_at: processedTime,
          admin_notes: markPaidRemarks.trim() || undefined
        }
        return updatedClaim
      }
      return w
    })

    setWithdrawals(updated)
    writeWithdrawals(updated)

    if (updatedClaim) {
      await persistWithdrawalClaim(updatedClaim)
      await sendPayoutCompletedEmailToMember(updatedClaim)
    }

    setIsMarkingPaid(false)
    setMarkPaidModalClaim(null)
    setMarkPaidTxnId("")
    setMarkPaidRemarks("")

    toast({
      title: "✅ Payout Marked as PAID!",
      description: `Txn ID: ${markPaidTxnId} recorded & receipt email sent to ${(updatedClaim as any)?.user_email}.`
    })
  }

  const handleUpdateWithdrawalStatus = async (
    claimId: string,
    newStatus: 'approved' | 'paid' | 'rejected',
    adminNotes?: string
  ) => {
    if (newStatus === 'paid') {
      const claim = withdrawals.find(w => w.id === claimId)
      if (claim) {
        setMarkPaidModalClaim(claim)
        setMarkPaidTxnId("")
        setMarkPaidMode(claim.payment_method === 'UPI' ? 'UPI Transfer' : 'Bank IMPS')
        setMarkPaidTime(new Date().toISOString().slice(0, 16))
        setMarkPaidRemarks("")
        return
      }
    }

    let affectedClaim: WithdrawalClaim | null = null
    const updated = withdrawals.map(w => {
      if (w.id === claimId) {
        affectedClaim = {
          ...w,
          status: newStatus,
          processed_at: new Date().toISOString(),
          admin_notes: adminNotes || w.admin_notes
        }
        return affectedClaim
      }
      return w
    })

    if (affectedClaim) {
      await persistWithdrawalClaim(affectedClaim)
    } else {
      setWithdrawals(updated)
      writeWithdrawals(updated)
    }

    toast({
      title: `Claim marked as ${newStatus.toUpperCase()}`,
      description: `Claim status updated to ${newStatus}.`
    })
  }

  const getCatMeta = (c: string) => CATEGORIES.find(x => x.value === c) || CATEGORIES[0]
  const getPriMeta = (p: string) => PRIORITIES.find(x => x.value === p) || PRIORITIES[2]
  const getStaMeta = (s: string) => STATUSES.find(x => x.value === s) || STATUSES[0]

  // Critical deep search: tokenizes query, searches ALL fields, matches partial/small words
  const deepSearch = (item: KnowledgeItem, query: string): boolean => {
    if (!query.trim()) return true;
    const tokens = query.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
    // Build a single searchable string from ALL item fields
    const searchableFields = [
      item.title || "",
      item.description || "",
      item.category || "",
      item.priority || "",
      item.status || "",
      item.source || "",
      item.validation_notes || "",
      item.assigned_to || "",
      item.due_date || "",
      item.created_by || "",
      // Also search human-readable labels for category/priority/status
      getCatMeta(item.category).label || "",
      getPriMeta(item.priority).label || "",
      getStaMeta(item.status).label || "",
    ].join(" ").toLowerCase();
    // Every token must match somewhere in the combined fields (AND logic)
    return tokens.every(token => searchableFields.includes(token));
  };

  const filteredItems = useMemo(() => {
    return userAccessibleItems.filter(item => {
      if (!deepSearch(item, searchQuery)) return false
      if (filterCategory !== "all" && item.category !== filterCategory) return false
      if (filterStatus !== "all" && item.status !== filterStatus) return false
      if (filterPriority !== "all" && item.priority !== filterPriority) return false
      return true
    }).sort((a, b) => {
      // Sort date-wise (Due dates first, then created/updated newest first)
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      }
      if (a.due_date && !b.due_date) return -1
      if (!a.due_date && b.due_date) return 1
      
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [userAccessibleItems, searchQuery, filterCategory, filterStatus, filterPriority])

  // Automation: Auto-delete duplicates based on identical titles
  useEffect(() => {
    const deduplicate = async () => {
      if (items.length === 0 || isLoading) return;
      const seenTitles = new Set<string>();
      const duplicates: string[] = [];
      
      // Sort items so we keep the newest one and mark older ones for deletion
      const sortedByDate = [...items].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      
      sortedByDate.forEach(item => {
        const titleKey = item.title.trim().toLowerCase();
        if (seenTitles.has(titleKey)) {
          duplicates.push(item.id);
        } else {
          seenTitles.add(titleKey);
        }
      });

      if (duplicates.length > 0) {
        for (const id of duplicates) {
          try { await deleteItem(id); } catch(e) {}
        }
        if (duplicates.length > 0) {
          toast({ title: "Automation Applied", description: `Auto-deleted ${duplicates.length} duplicate entries.` })
        }
      }
    };
    deduplicate();
  }, [items, isLoading]);

  // ─── 2-STEP QA & CEO VALIDATION EMAIL DISPATCHERS ─────────────────────────
  const sendTaskSubmittedForReviewEmail = async (
    item: KnowledgeItem,
    submittedByEmail: string | null,
    proofNotes?: string
  ) => {
    const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || "xkeysib-brevo-key"
    const memberObj = assignableUsers.find(u => u.email.toLowerCase() === (submittedByEmail || '').toLowerCase())
    const memberName = memberObj ? memberObj.label : (submittedByEmail?.split('@')[0] || 'Team Member')
    const submittedAtStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
    const potentialReward = calculateTaskPoints(item)

    const recipients = [
      { email: "ceo@biovaco.in", name: "CEO Office (BiovaCo)" },
      { email: "md@biovaco.in", name: "MD Office (BiovaCo)" }
    ]

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; max-width: 650px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: 5px solid #f59e0b; border-radius: 8px; margin: 0 auto;">
        <div style="border-bottom: 1px solid #edf2f7; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #b45309; margin: 0; font-size: 20px;">📋 Task Submitted for CEO Review &amp; Validation</h2>
          <span style="background-color: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block; margin-top: 6px; border: 1px solid #fde68a;">
            ACTION REQUIRED: CEO APPROVAL PENDING
          </span>
        </div>

        <p style="color: #2d3748; font-size: 14px; line-height: 1.6;">
          Dear CEO &amp; Management,
        </p>

        <p style="color: #2d3748; font-size: 14px; line-height: 1.6;">
          <strong>${memberName}</strong> (<code>${submittedByEmail || 'N/A'}</code>) has completed their work and submitted the following task for <strong>CEO Review &amp; Validation</strong>:
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; color: #718096; width: 140px;"><strong>Task Title:</strong></td>
              <td style="padding: 8px 0; color: #1a202c; font-weight: bold; font-size: 15px;">${item.title}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Submitted By:</strong></td>
              <td style="padding: 8px 0; color: #4B49AC; font-weight: bold;">${memberName} &lt;${submittedByEmail || 'N/A'}&gt;</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Submission Time:</strong></td>
              <td style="padding: 8px 0; color: #2d3748; font-weight: 500;">${submittedAtStr} IST</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Priority &amp; Value:</strong></td>
              <td style="padding: 8px 0; color: #047857; font-weight: bold;">${(item.priority || 'medium').toUpperCase()} (Eligible: ₹${potentialReward.inrValue} / ${potentialReward.totalPoints} Pts)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Due Date:</strong></td>
              <td style="padding: 8px 0; color: #2d3748;">${item.due_date || "No deadline"}</td>
            </tr>
            ${item.description ? `
            <tr>
              <td style="padding: 8px 0; color: #718096; vertical-align: top;"><strong>Task Details:</strong></td>
              <td style="padding: 8px 0; color: #4a5568; line-height: 1.5;">${item.description}</td>
            </tr>` : ''}
            ${(proofNotes || item.validation_notes) ? `
            <tr>
              <td style="padding: 8px 0; color: #718096; vertical-align: top;"><strong>Member Work Proof:</strong></td>
              <td style="padding: 8px 0; color: #1e3a8a; background: #eff6ff; padding: 10px; border-radius: 6px; font-weight: 500;">${proofNotes || item.validation_notes}</td>
            </tr>` : ''}
          </table>
        </div>

        <p style="text-align: center; margin-top: 25px;">
          <a href="https://admin.biovaco.in" style="background-color: #4B49AC; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
            Open Knowledge Tracker to Review &amp; Validate →
          </a>
        </p>

        <p style="color: #a0aec0; font-size: 11px; text-align: center; margin-top: 20px; border-top: 1px solid #edf2f7; padding-top: 15px;">
          BiovaCo Nexus ERP System • 2-Step Work QA Workflow Notice
        </p>
      </div>
    `;

    try {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "accept": "application/json", "content-type": "application/json", "api-key": BREVO_API_KEY },
        body: JSON.stringify({
          sender: { name: "BiovaCo Knowledge Review", email: "no-reply@biovaco.in" },
          to: recipients,
          subject: `[Task Review Required] ${memberName} submitted "${item.title}" for CEO Validation`,
          htmlContent: emailHtml
        })
      });
    } catch (err) {
      console.warn("Brevo review email error:", err);
    }
  }

  const sendTaskApprovedByCEOEmail = async (
    item: KnowledgeItem,
    reward: ReturnType<typeof calculateTaskPoints>,
    adminNotes?: string
  ) => {
    const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || "xkeysib-brevo-key"
    const targetEmails = (item.assigned_to || item.created_by || '').split(',').map(e => e.trim()).filter(Boolean)
    if (targetEmails.length === 0) return

    const recipients = [
      ...targetEmails.map(email => ({ email, name: email.split('@')[0] })),
      { email: "ceo@biovaco.in", name: "CEO Office (Copy)" }
    ]

    const validatedAtStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; max-width: 650px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: 5px solid #10b981; border-radius: 8px; margin: 0 auto;">
        <div style="border-bottom: 1px solid #edf2f7; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #065f46; margin: 0; font-size: 20px;">🎉 Task Approved &amp; Validated by CEO!</h2>
          <span style="background-color: #ecfdf5; color: #047857; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block; margin-top: 6px; border: 1px solid #a7f3d0;">
            ₹${reward.inrValue} (${reward.totalPoints} POINTS) CREDITED TO YOUR WALLET
          </span>
        </div>

        <p style="color: #2d3748; font-size: 14px; line-height: 1.6;">
          Congratulations! Your submitted work for <strong>"${item.title}"</strong> has been reviewed and officially <strong>APPROVED &amp; VALIDATED</strong> by CEO Office.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; color: #718096; width: 140px;"><strong>Points Credited:</strong></td>
              <td style="padding: 8px 0; color: #047857; font-weight: 800; font-size: 18px;">+₹${reward.inrValue} (${reward.totalPoints} Pts)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Reward Breakdown:</strong></td>
              <td style="padding: 8px 0; color: #2d3748; font-weight: 500;">${reward.breakdown}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Approved Time:</strong></td>
              <td style="padding: 8px 0; color: #2d3748;">${validatedAtStr} IST</td>
            </tr>
            ${adminNotes ? `
            <tr>
              <td style="padding: 8px 0; color: #718096; vertical-align: top;"><strong>CEO Remarks:</strong></td>
              <td style="padding: 8px 0; color: #065f46; font-weight: 600;">${adminNotes}</td>
            </tr>` : ''}
          </table>
        </div>

        <p style="text-align: center; margin-top: 25px;">
          <a href="https://admin.biovaco.in" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 11px 22px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
            Open Your Rewards Wallet →
          </a>
        </p>

        <p style="color: #a0aec0; font-size: 11px; text-align: center; margin-top: 20px; border-top: 1px solid #edf2f7; padding-top: 15px;">
          BiovaCo Nexus ERP System • Official Performance Validation
        </p>
      </div>
    `;

    try {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "accept": "application/json", "content-type": "application/json", "api-key": BREVO_API_KEY },
        body: JSON.stringify({
          sender: { name: "BiovaCo CEO Office", email: "no-reply@biovaco.in" },
          to: recipients,
          subject: `🎉 [Task Validated] CEO approved "${item.title}" — ₹${reward.inrValue} Credited!`,
          htmlContent: emailHtml
        })
      });
    } catch (err) {
      console.warn("Brevo approval email error:", err);
    }
  }

  const sendTaskReworkRequestedEmail = async (
    item: KnowledgeItem,
    feedbackNotes: string
  ) => {
    const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || "xkeysib-brevo-key"
    const targetEmails = (item.assigned_to || item.created_by || '').split(',').map(e => e.trim()).filter(Boolean)
    if (targetEmails.length === 0) return

    const recipients = [
      ...targetEmails.map(email => ({ email, name: email.split('@')[0] })),
      { email: "ceo@biovaco.in", name: "CEO Office (Copy)" }
    ]

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; max-width: 650px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: 5px solid #ef4444; border-radius: 8px; margin: 0 auto;">
        <div style="border-bottom: 1px solid #edf2f7; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #991b1b; margin: 0; font-size: 20px;">⚠️ Changes Requested on Task</h2>
          <span style="background-color: #fef2f2; color: #991b1b; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block; margin-top: 6px; border: 1px solid #fecaca;">
            ACTION REQUIRED: REWORK / IMPROVEMENTS NEEDED
          </span>
        </div>

        <p style="color: #2d3748; font-size: 14px; line-height: 1.6;">
          CEO Office has reviewed your submission for <strong>"${item.title}"</strong> and requested some changes before it can be validated:
        </p>

        <div style="background-color: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <p style="color: #742a2a; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 6px;">CEO Review Feedback:</p>
          <p style="color: #2d3748; font-size: 14px; line-height: 1.6; font-weight: 500;">${feedbackNotes}</p>
        </div>

        <p style="color: #4a5568; font-size: 13px;">
          Please make the necessary changes and re-submit the task for CEO review to claim your reward points.
        </p>

        <p style="text-align: center; margin-top: 25px;">
          <a href="https://admin.biovaco.in" style="background-color: #4B49AC; color: #ffffff; text-decoration: none; padding: 11px 22px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
            Open Task on Knowledge Tracker →
          </a>
        </p>
      </div>
    `;

    try {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "accept": "application/json", "content-type": "application/json", "api-key": BREVO_API_KEY },
        body: JSON.stringify({
          sender: { name: "BiovaCo CEO Office", email: "no-reply@biovaco.in" },
          to: recipients,
          subject: `⚠️ [Changes Requested] CEO feedback on "${item.title}"`,
          htmlContent: emailHtml
        })
      });
    } catch (err) {
      console.warn("Brevo rework email error:", err);
    }
  }

  // ─── 2-STEP QA ACTION HANDLERS ─────────────────────────────────────────────
  const handleMemberSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!submitReviewModalItem) return
    setIsSubmittingReview(true)

    const updatedNotes = submitReviewProofNotes.trim() || submitReviewModalItem.validation_notes || ""
    await updateItem(submitReviewModalItem.id, {
      status: "pending_review",
      validation_notes: updatedNotes
    })

    // Send email to CEO
    await sendTaskSubmittedForReviewEmail(submitReviewModalItem, userEmail, updatedNotes)

    setIsSubmittingReview(false)
    setSubmitReviewModalItem(null)
    setSubmitReviewProofNotes("")

    toast({
      title: "🚀 Submitted for CEO Review!",
      description: "ceo@biovaco.in notified. Points will be credited once CEO approves & validates."
    })
  }

  const handleCeoApproveAndValidate = async (item: KnowledgeItem, adminRemarks?: string) => {
    setIsCeoValidating(true)
    const updatedNotes = adminRemarks
      ? `${item.validation_notes ? item.validation_notes + ' | ' : ''}CEO Approval: ${adminRemarks}`
      : item.validation_notes

    await updateItem(item.id, {
      status: "validated",
      validation_notes: updatedNotes
    })

    const reward = calculateTaskPoints({ ...item, status: "validated" })
    await sendTaskApprovedByCEOEmail(item, reward, adminRemarks)

    setIsCeoValidating(false)
    setCeoReviewModalItem(null)
    setCeoReviewFeedback("")

    toast({
      title: `🎉 Task Validated & +₹${reward.totalPoints} Credited!`,
      description: `Approved by CEO Office. Reward updated on member's wallet.`
    })
  }

  const handleCeoRequestRework = async (item: KnowledgeItem, feedback: string) => {
    if (!feedback.trim()) {
      toast({ title: "Please enter feedback for the member", variant: "destructive" }); return
    }
    setIsCeoValidating(true)
    const updatedNotes = `${item.validation_notes ? item.validation_notes + ' | ' : ''}Changes Requested: ${feedback}`

    await updateItem(item.id, {
      status: "in_progress",
      validation_notes: updatedNotes
    })

    await sendTaskReworkRequestedEmail(item, feedback)

    setIsCeoValidating(false)
    setCeoReviewModalItem(null)
    setCeoReviewFeedback("")

    toast({
      title: "⚠️ Rework Requested",
      description: "Task returned to In Progress and feedback sent to member."
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return }
    setIsSaving(true)
    
    // Determine target assignees: if non-executive, force assignment to self
    const targetAssignedTo = isExecutive 
      ? (form.assigned_to || userEmail || "") 
      : (userEmail || "")

    if (editId) {
      const existingItem = items.find(i => i.id === editId)
      const isNewlyValidated = form.status === "validated" && existingItem?.status !== "validated"
      const isNewlySubmittedReview = form.status === "pending_review" && existingItem?.status !== "pending_review"

      await updateItem(editId, {
        ...form,
        assigned_to: targetAssignedTo,
        description: form.description || null,
        source: form.source || null,
        validation_notes: form.validation_notes || null,
        due_date: form.due_date || null,
      })
      
      const assignees = targetAssignedTo.split(',').map(e => e.trim()).filter(Boolean)
      if (assignees.length > 0 && !isNewlyValidated && !isNewlySubmittedReview) {
        sendAssignmentEmail(
          assignees,
          form.title,
          form.description,
          form.priority,
          form.category,
          form.due_date,
          userEmail
        )
      }

      if (isNewlySubmittedReview && existingItem) {
        sendTaskSubmittedForReviewEmail(
          { ...existingItem, ...form, assigned_to: targetAssignedTo },
          userEmail,
          form.validation_notes
        )
      }

      if (isNewlyValidated && existingItem) {
        const reward = calculateTaskPoints({ ...existingItem, ...form, status: "validated" })
        sendTaskApprovedByCEOEmail(
          { ...existingItem, ...form, assigned_to: targetAssignedTo },
          reward,
          form.validation_notes
        )
      }
      
      toast({ title: isOnline ? "Item updated" : "Item updated (will sync when online)" })
    } else {
      const createdItem = await addItem({
        ...form,
        created_by: userEmail,
        assigned_to: targetAssignedTo,
        description: form.description || null,
        source: form.source || null,
        validation_notes: form.validation_notes || null,
        due_date: form.due_date || null,
      })
      
      const assignees = targetAssignedTo.split(',').map(e => e.trim()).filter(Boolean)
      if (assignees.length > 0) {
        sendAssignmentEmail(
          assignees,
          form.title,
          form.description,
          form.priority,
          form.category,
          form.due_date,
          userEmail
        )
      }

      if (form.status === "pending_review") {
        sendTaskSubmittedForReviewEmail(createdItem, userEmail, form.validation_notes)
      } else if (form.status === "validated") {
        const reward = calculateTaskPoints(createdItem)
        sendTaskApprovedByCEOEmail(createdItem, reward, form.validation_notes)
      }
      
      toast({ title: isOnline ? "Item created" : "Item saved offline (will sync when online)" })
    }
    setIsSaving(false)
    resetForm()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this knowledge item?")) return
    await deleteItem(id)
    toast({ title: isOnline ? "Item deleted" : "Item deleted (will sync when online)" })
  }

  const handleStatusChange = async (id: string, status: Status) => {
    const item = items.find(i => i.id === id)
    if (!item) return

    // If regular member tries to set validated, route them to Submit Review modal
    if (!isExecutive && status === "validated") {
      setSubmitReviewModalItem(item)
      setSubmitReviewProofNotes(item.validation_notes || "")
      return
    }

    if (status === "pending_review") {
      setSubmitReviewModalItem(item)
      setSubmitReviewProofNotes(item.validation_notes || "")
      return
    }

    await updateItem(id, { status })

    if (status === "validated" && isExecutive) {
      const reward = calculateTaskPoints({ ...item, status: "validated" })
      sendTaskApprovedByCEOEmail(item, reward)
      toast({
        title: `🎉 Task Validated & +₹${reward.totalPoints} Credited!`,
        description: `Task approved by CEO. Points credited to member wallet.`
      })
    } else {
      toast({ title: `Status → ${status.replace("_", " ")}` })
    }
  }

  const handleEdit = (item: KnowledgeItem) => {
    setForm({
      title: item.title, description: item.description || "", category: item.category as Category,
      priority: item.priority as Priority, status: item.status as Status, source: item.source || "",
      validation_notes: item.validation_notes || "", due_date: item.due_date || "", assigned_to: item.assigned_to || ""
    })
    setEditId(item.id)
    setIsEditing(true)
  }

  const resetForm = () => { setForm(emptyForm()); setEditId(null); setIsEditing(false) }

  // ─── Bulk Todo Handlers ───────────────────────────────────────────────────────
  const handleBulkOpen = () => {
    setBulkStep(1)
    setBulkSelectedEmails([])
    setBulkRawCSV(BULK_CSV_TEMPLATE)
    setBulkParsedTasks([])
    setBulkDefaultPriority('medium')
    setBulkDefaultDueDate('')
  }

  const handleBulkStep2 = () => {
    if (bulkSelectedEmails.length === 0) {
      toast({ title: 'Select at least one assignee', variant: 'destructive' }); return
    }
    setBulkStep(2)
  }

  const handleBulkPreview = () => {
    const parsed = parseBulkCSV(bulkRawCSV)
    if (parsed.length === 0) {
      toast({ title: 'No valid tasks found', description: 'Check your CSV format and try again', variant: 'destructive' }); return
    }
    // Apply defaults where fields are empty
    const withDefaults = parsed.map(t => ({
      ...t,
      priority: t.priority || bulkDefaultPriority,
      due_date: t.due_date || bulkDefaultDueDate
    }))
    setBulkParsedTasks(withDefaults)
    setBulkStep(3)
  }

  const handleBulkSubmit = async () => {
    if (bulkParsedTasks.length === 0) return
    setIsBulkSubmitting(true)
    let successCount = 0
    const assignedToStr = bulkSelectedEmails.join(',')

    for (const task of bulkParsedTasks) {
      try {
        await addItem({
          title: task.title,
          description: task.description || null,
          category: task.category,
          priority: task.priority,
          status: 'pending',
          source: task.source || null,
          validation_notes: task.validation_notes || null,
          due_date: task.due_date || null,
          created_by: userEmail,
          assigned_to: assignedToStr,
        })
        successCount++
      } catch(e) {
        console.error('Bulk task creation error:', e)
      }
    }

    // Send one bulk assignment email
    if (successCount > 0) {
      const titlesStr = bulkParsedTasks.slice(0, 5).map(t => `• ${t.title}`).join('<br>') +
        (bulkParsedTasks.length > 5 ? `<br>• ...and ${bulkParsedTasks.length - 5} more` : '')

      const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || "xkeysib-brevo-key"
      const ceoEmail = 'ceo@biovaco.in'
      const allRecipients = Array.from(new Set([...bulkSelectedEmails, ceoEmail]))
      const formattedRecipients = allRecipients.map(email => ({
        email,
        name: assignableUsers.find(u => u.email === email)?.label || email
      }))
      const assigneeNamesStr = bulkSelectedEmails.map(email => {
        return assignableUsers.find(u => u.email === email)?.label || email
      }).join(', ')

      const emailHtml = `
        <div style="font-family: 'Segoe UI', sans-serif; padding: 25px; max-width: 650px; background: #fff; border: 1px solid #e2e8f0; border-top: 5px solid #4B49AC; border-radius: 8px; margin: 0 auto;">
          <h2 style="color: #4B49AC; margin: 0;">BiovaCo Nexus — Bulk Task Assignment</h2>
          <span style="background:#f2f6ff; color:#4B49AC; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:bold; display:inline-block; margin-top:6px;">BULK TASK DISPATCH · ${successCount} TASKS</span>
          <p style="color:#2d3748; font-size:14px; margin-top:16px;">Hello Team,</p>
          <p style="color:#2d3748; font-size:14px;"><strong>${successCount} tasks</strong> have been bulk-assigned to you via BiovaCo Nexus by <strong>${userEmail || 'Management'}</strong>.</p>
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:18px; margin:20px 0;">
            <p style="margin:0 0 8px; color:#718096; font-size:12px; font-weight:bold;">ASSIGNED TO:</p>
            <p style="margin:0 0 16px; color:#4B49AC; font-weight:bold;">${assigneeNamesStr}</p>
            <p style="margin:0 0 8px; color:#718096; font-size:12px; font-weight:bold;">TASKS ASSIGNED:</p>
            <div style="color:#1a202c; font-size:13px; line-height:2;">${titlesStr}</div>
          </div>
          <p style="text-align:center; margin-top:25px;">
            <a href="https://admin.biovaco.in" style="background:#4B49AC; color:#fff; text-decoration:none; padding:10px 20px; border-radius:6px; font-weight:bold; font-size:13px; display:inline-block;">Open BiovaCo Nexus Portal →</a>
          </p>
          <p style="color:#a0aec0; font-size:11px; text-align:center; margin-top:20px; border-top:1px solid #edf2f7; padding-top:15px;">BiovaCo Nexus Enterprise ERP • Automated Bulk Task Assignment Notice</p>
        </div>
      `
      try {
        await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { "accept": "application/json", "content-type": "application/json", "api-key": BREVO_API_KEY },
          body: JSON.stringify({
            sender: { name: "BiovaCo Executive Office", email: "no-reply@biovaco.in" },
            to: formattedRecipients,
            subject: `[Bulk Task Assignment] ${successCount} Tasks Assigned`,
            htmlContent: emailHtml
          })
        })
      } catch(e) { console.warn('Bulk email error:', e) }
    }

    setIsBulkSubmitting(false)
    setBulkStep(0)
    toast({
      title: `✅ ${successCount} Tasks Created!`,
      description: `Bulk assigned to ${bulkSelectedEmails.length} member(s) with email notification sent.`
    })
  }

  if (isLoading && items.length === 0) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      {(!isOnline || pendingCount > 0) && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border bg-muted/50 border-border text-foreground">
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <>
                <WifiOff className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">Offline Mode — Data is saved locally and will auto-sync when internet returns</span>
              </>
            ) : (
              <>
                <CloudOff className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">{pendingCount} pending change{pendingCount > 1 ? "s" : ""} waiting to sync</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge variant="outline" className="bg-white text-xs">{pendingCount} queued</Badge>
            )}
            {isOnline && pendingCount > 0 && (
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={forceSync} disabled={isSyncing}>
                <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? "animate-spin" : ""}`} /> Sync Now
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Header & Access Control Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold text-foreground">Knowledge Tracker</h2>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${isOnline ? "bg-muted/50 text-foreground border-border" : "bg-muted/50 text-foreground border-border"}`}>
              {isOnline ? <><Wifi className="h-3 w-3 mr-0.5" />Online</> : <><WifiOff className="h-3 w-3 mr-0.5" />Offline</>}
            </Badge>

            {!isExecutive ? (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[11px] px-2 py-0.5 font-medium flex items-center gap-1">
                <Lock className="h-3 w-3 text-emerald-600" />
                Personal Tasks View ({userEmail?.split('@')[0]})
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300 text-[11px] px-2 py-0.5 font-medium flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-blue-600" />
                Executive Access (All Tasks)
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {!isExecutive 
              ? "Showing tasks assigned strictly to your account." 
              : "Track, assign, and validate tasks across all organization members."}
          </p>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-2 flex-wrap">
            {isExecutive && (
              <>
                <Button
                  onClick={() => setExecutivePayoutsModalOpen(true)}
                  variant="outline"
                  className="border-emerald-600 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 font-semibold relative"
                >
                  <Receipt className="h-4 w-4 mr-2 text-emerald-600" />
                  Payouts &amp; Claims
                  {pendingWithdrawalsCount > 0 && (
                    <span className="ml-1.5 bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                      {pendingWithdrawalsCount}
                    </span>
                  )}
                </Button>
                <Button
                  onClick={handleBulkOpen}
                  variant="outline"
                  className="border-[#4B49AC] text-[#4B49AC] hover:bg-[#4B49AC]/10 font-semibold"
                >
                  <ListChecks className="h-4 w-4 mr-2" /> Bulk Todo
                </Button>
              </>
            )}
            <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-primary hover:bg-primary/90 text-white font-semibold">
              <Plus className="h-4 w-4 mr-2" /> Add Knowledge Item
            </Button>
          </div>
        )}
      </div>

      {/* ═══════════════ PROFESSIONAL REWARD WALLET & CLAIM BAR ═══════════════ */}
      <Card className="border border-slate-200/90 shadow-sm bg-white overflow-hidden rounded-2xl">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            {/* Left: Wallet Balances (Available vs Total) */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#4B49AC]/10 border border-[#4B49AC]/20 flex items-center justify-center shrink-0">
                <Wallet className="h-7 w-7 text-[#4B49AC]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5 text-amber-500" /> Performance Rewards Wallet
                  </span>
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-bold text-[10px] px-2 py-0">
                    1 Point = ₹1 INR
                  </Badge>
                </div>

                <div className="flex items-baseline gap-3 mt-1 flex-wrap">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-gray-500 font-medium">Account Balance:</span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                      ₹{userRewardStats.currentAccountBalanceInr}
                    </h3>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    (₹{userRewardStats.availableBalanceInr} Available to Claim · Lifetime Earned: ₹{userRewardStats.totalInr})
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-200">
                    <span>{userRewardStats.tier.icon}</span> {userRewardStats.tier.name}
                  </span>
                  {userRewardStats.pendingClaimInr > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] bg-amber-100 text-amber-900 font-semibold px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1 animate-pulse">
                        <Clock className="h-3 w-3 text-amber-700" />
                        ₹{userRewardStats.pendingClaimInr} Claim In Review
                      </span>
                      {userRewardStats.myWithdrawals.find(w => w.status === 'pending') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const pendingClaim = userRewardStats.myWithdrawals.find(w => w.status === 'pending');
                            if (pendingClaim) handleSendPayoutReminder(pendingClaim.id);
                          }}
                          className="h-6 text-[11px] border-amber-400 bg-amber-50/80 text-amber-900 hover:bg-amber-100 font-bold px-2 flex items-center gap-1 shadow-2xs"
                        >
                          <BellRing className="h-3 w-3 text-amber-700 animate-bounce" /> Remind CEO
                        </Button>
                      )}
                    </div>
                  )}
                  {userRewardStats.totalPaidInr > 0 && (
                    <span className="text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-emerald-600" />
                      ₹{userRewardStats.totalPaidInr} Disbursed &amp; Paid
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Center: Live Stats Highlights */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
              <div className="text-center px-2">
                <p className="text-base font-bold text-gray-900 flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {userRewardStats.validatedCount}
                </p>
                <p className="text-[10px] text-gray-500 font-medium">Completed</p>
              </div>
              <div className="text-center px-2 border-x border-slate-200">
                <p className="text-base font-bold text-amber-600 flex items-center justify-center gap-1">
                  <Zap className="h-4 w-4 text-amber-500" /> {userRewardStats.speedBonusCount}
                </p>
                <p className="text-[10px] text-gray-500 font-medium">Speed Bonus</p>
              </div>
              <div className="text-center px-2">
                <p className="text-base font-bold text-[#4B49AC] flex items-center justify-center gap-1">
                  <Flame className="h-4 w-4 text-[#4B49AC]" /> {userRewardStats.tier.progress}%
                </p>
                <p className="text-[10px] text-gray-500 font-medium">Tier XP</p>
              </div>
            </div>

            {/* Right: Primary Claim Button & Action Modals */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => {
                  setClaimAmountInput(userRewardStats.availableBalanceInr.toString())
                  setWithdrawModalOpen(true)
                }}
                disabled={userRewardStats.availableBalanceInr <= 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm h-9 px-4"
              >
                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                Claim / Withdraw
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setWalletModalOpen(true)}
                className="font-semibold text-xs h-9 border-slate-300 text-gray-700 hover:bg-slate-50"
              >
                <Coins className="h-3.5 w-3.5 mr-1 text-amber-600" /> History
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLeaderboardModalOpen(true)}
                className="font-semibold text-xs h-9 border-slate-300 text-gray-700 hover:bg-slate-50"
              >
                <Trophy className="h-3.5 w-3.5 mr-1 text-amber-500" /> Leaderboard
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRulesModalOpen(true)}
                className="text-gray-500 hover:text-gray-900 text-xs h-9 px-2"
                title="Reward Rules"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tier Progress Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3">
            <span className="text-[11px] font-medium text-gray-600 shrink-0">
              {userRewardStats.tier.icon} {userRewardStats.tier.name}
            </span>
            <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-[#4B49AC] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, userRewardStats.tier.progress)}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-[#4B49AC] shrink-0">
              {userRewardStats.totalPoints} / {userRewardStats.tier.max} Pts
            </span>
          </div>
        </CardContent>
      </Card>

      {/* KPI Stats (Reflects accessible tasks for logged-in user) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Tasks", value: stats.total, icon: BarChart3, bg: "bg-primary text-primary-foreground", text: "text-white", accent: "text-foreground" },
          { label: "Pending", value: stats.pending, icon: Circle, bg: "bg-white", text: "text-slate-800", accent: "text-slate-400" },
          { label: "In Progress", value: stats.inProgress, icon: Clock, bg: "bg-white", text: "text-foreground", accent: "text-foreground" },
          { label: "Validated", value: stats.validated, icon: CheckCircle2, bg: "bg-white", text: "text-foreground", accent: "text-foreground" },
          { label: "Critical", value: stats.critical, icon: AlertTriangle, bg: "bg-white", text: "text-red-700", accent: "text-red-400" },
          { label: "Overdue", value: stats.overdue, icon: AlertTriangle, bg: stats.overdue > 0 ? "bg-red-50 border-red-200" : "bg-white", text: stats.overdue > 0 ? "text-red-800" : "text-gray-700", accent: "text-red-400" },
        ].map(s => (
          <Card key={s.label} className={`${s.bg} border`}>
            <CardContent className="p-3 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.accent} shrink-0`} />
              <div>
                <p className={`text-xl font-bold ${s.text}`}>{s.value}</p>
                <p className={`text-[11px] ${s.accent} font-medium`}>{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form Drawer */}
      {isEditing && (
        <Card className="animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-foreground">{editId ? "Edit Item" : "New Knowledge Item"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Title *</label>
                  <Input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Competitor X launched new product line" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Source</label>
                  <Input value={form.source} onChange={e => setForm({...form, source: e.target.value})} placeholder="e.g. Industry report, Internal audit" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <Select value={form.category} onValueChange={v => setForm({...form, category: v as Category})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Priority</label>
                  <Select value={form.priority} onValueChange={v => setForm({...form, priority: v as Priority})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select value={form.status} onValueChange={v => setForm({...form, status: v as Status})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Due Date</label>
                  <Input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
                </div>
                
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-1.5 text-slate-800">
                      <UserCheck className="h-4 w-4 text-[#4B49AC]" />
                      Assign To (Select Multiple from Access Control & Team)
                    </label>
                    <span className="text-xs text-gray-500 font-normal">Click chips to toggle assignment</span>
                  </div>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-gray-50/50 max-h-48 overflow-y-auto">
                    {assignableUsers.map(opt => {
                      const isSelected = (form.assigned_to || '').split(',').map(e => e.trim().toLowerCase()).includes(opt.email);
                      return (
                        <Badge 
                          key={opt.email} 
                          variant={isSelected ? "default" : "outline"} 
                          className={`cursor-pointer transition-all py-1 px-2.5 text-xs flex items-center gap-1.5 ${
                            isSelected 
                              ? 'bg-[#4B49AC] text-white hover:bg-[#3e3d93] shadow-2xs font-semibold' 
                              : 'hover:bg-gray-100 bg-white text-gray-700 border-gray-300'
                          }`}
                          onClick={() => {
                            let current = (form.assigned_to || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
                            if (current.includes(opt.email)) {
                              current = current.filter(e => e !== opt.email);
                            } else {
                              current.push(opt.email);
                            }
                            setForm({...form, assigned_to: current.join(',')});
                          }}
                        >
                          <span>{opt.label} ({opt.email})</span>
                          {opt.type && (
                            <span className={`text-[10px] px-1 py-0.2 rounded font-medium ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {opt.type}
                            </span>
                          )}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Detailed description..." rows={3} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Validation Notes</label>
                <Textarea value={form.validation_notes} onChange={e => setForm({...form, validation_notes: e.target.value})} placeholder="How was this validated?..." rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary/90 text-white">
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  {editId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════ BULK TODO MODAL ═══════════════ */}
      {bulkStep > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#4B49AC]/10 flex items-center justify-center">
                  <ListChecks className="h-5 w-5 text-[#4B49AC]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Bulk Todo Assignment</h3>
                  <p className="text-xs text-gray-500">
                    {bulkStep === 1 && 'Step 1 of 3 — Select Assignees'}
                    {bulkStep === 2 && 'Step 2 of 3 — Upload Tasks'}
                    {bulkStep === 3 && 'Step 3 of 3 — Preview & Confirm'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Step Pills */}
                <div className="hidden sm:flex items-center gap-1">
                  {[1,2,3].map(s => (
                    <div key={s} className={`w-2 h-2 rounded-full transition-all ${
                      bulkStep >= s ? 'bg-[#4B49AC]' : 'bg-gray-200'
                    }`} />
                  ))}
                </div>
                <button onClick={() => setBulkStep(0)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-6">

            {/* ── STEP 1: Select Assignees ── */}
            {bulkStep === 1 && (
              <div className="space-y-5">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                  <Users className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Select who gets these bulk tasks</p>
                    <p className="text-xs text-blue-600 mt-0.5">All selected members will receive every task you upload in the next step + email notification.</p>
                  </div>
                </div>

                {/* Quick Select All / Clear */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Team Members & Access Users
                    <span className="ml-2 text-xs bg-[#4B49AC]/10 text-[#4B49AC] px-2 py-0.5 rounded-full font-semibold">
                      {bulkSelectedEmails.length} selected
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBulkSelectedEmails(assignableUsers.map(u => u.email))}
                      className="text-xs text-[#4B49AC] hover:underline font-medium"
                    >Select All</button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => setBulkSelectedEmails([])}
                      className="text-xs text-gray-500 hover:underline"
                    >Clear</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                  {assignableUsers.map(u => {
                    const isSelected = bulkSelectedEmails.includes(u.email)
                    return (
                      <button
                        key={u.email}
                        onClick={() => {
                          setBulkSelectedEmails(prev =>
                            isSelected ? prev.filter(e => e !== u.email) : [...prev, u.email]
                          )
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-[#4B49AC] bg-[#4B49AC]/5'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#4B49AC] bg-[#4B49AC]' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold truncate ${isSelected ? 'text-[#4B49AC]' : 'text-gray-800'}`}>{u.label}</p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                          u.type === 'Executive' ? 'bg-purple-100 text-purple-700' :
                          u.type === 'Intern' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{u.type}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleBulkStep2}
                    className="bg-[#4B49AC] hover:bg-[#3e3d93] text-white px-6"
                  >
                    Next: Upload Tasks <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Upload Tasks ── */}
            {bulkStep === 2 && (
              <div className="space-y-5">
                <div className="bg-[#4B49AC]/5 border border-[#4B49AC]/20 rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#4B49AC] flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Assigning to {bulkSelectedEmails.length} member(s)
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {bulkSelectedEmails.map(email => (
                      <span key={email} className="text-xs bg-[#4B49AC] text-white px-2 py-0.5 rounded-full font-medium">
                        {assignableUsers.find(u => u.email === email)?.label || email.split('@')[0]}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Default overrides */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Default Priority (if not in CSV)</label>
                    <Select value={bulkDefaultPriority} onValueChange={v => setBulkDefaultPriority(v as Priority)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Default Due Date (if not in CSV)</label>
                    <Input
                      type="date"
                      value={bulkDefaultDueDate}
                      onChange={e => setBulkDefaultDueDate(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Format guide */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1">
                  <p className="font-bold uppercase tracking-wide mb-2">📋 CSV Column Format</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span><code className="bg-amber-100 px-1 rounded">title</code> — Task name <span className="text-red-600">*required</span></span>
                    <span><code className="bg-amber-100 px-1 rounded">description</code> — Details</span>
                    <span><code className="bg-amber-100 px-1 rounded">category</code> — system / market / competitor / regulation / technology / customer</span>
                    <span><code className="bg-amber-100 px-1 rounded">priority</code> — critical / high / medium / low</span>
                    <span><code className="bg-amber-100 px-1 rounded">due_date</code> — YYYY-MM-DD</span>
                    <span><code className="bg-amber-100 px-1 rounded">source</code> — Reference source</span>
                  </div>
                </div>

                {/* CSV area + download template */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700">Paste Your CSV Tasks Below</label>
                    <button
                      onClick={() => {
                        const blob = new Blob([BULK_CSV_TEMPLATE], { type: 'text/csv' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url; a.download = 'bulk_tasks_template.csv'; a.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="flex items-center gap-1.5 text-xs text-[#4B49AC] hover:underline font-medium"
                    >
                      <Download className="h-3.5 w-3.5" /> Download Template
                    </button>
                  </div>
                  <Textarea
                    value={bulkRawCSV}
                    onChange={e => setBulkRawCSV(e.target.value)}
                    rows={10}
                    className="font-mono text-xs leading-relaxed resize-y"
                    placeholder="Paste CSV here with header row..."
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setBulkStep(1)}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button
                    onClick={handleBulkPreview}
                    className="bg-[#4B49AC] hover:bg-[#3e3d93] text-white px-6"
                  >
                    Preview Tasks <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Preview & Confirm ── */}
            {bulkStep === 3 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {bulkParsedTasks.length} Tasks Ready
                    </p>
                    <p className="text-xs text-gray-500">
                      Will be assigned to: {bulkSelectedEmails.map(e => assignableUsers.find(u => u.email === e)?.label || e.split('@')[0]).join(', ')}
                    </p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
                    Ready to Submit
                  </span>
                </div>

                {/* Preview Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2.5 font-semibold text-gray-600 border-b">#</th>
                          <th className="text-left px-3 py-2.5 font-semibold text-gray-600 border-b">Title</th>
                          <th className="text-left px-3 py-2.5 font-semibold text-gray-600 border-b">Category</th>
                          <th className="text-left px-3 py-2.5 font-semibold text-gray-600 border-b">Priority</th>
                          <th className="text-left px-3 py-2.5 font-semibold text-gray-600 border-b">Due Date</th>
                          <th className="text-left px-3 py-2.5 font-semibold text-gray-600 border-b">Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkParsedTasks.map((task, idx) => {
                          const priMeta = getPriMeta(task.priority)
                          const catMeta = getCatMeta(task.category)
                          return (
                            <tr key={idx} className={`border-b border-gray-100 hover:bg-gray-50 ${
                              task._error ? 'bg-red-50' : ''
                            }`}>
                              <td className="px-3 py-2.5 text-gray-400 font-mono">{idx+1}</td>
                              <td className="px-3 py-2.5">
                                <p className="font-semibold text-gray-800 max-w-[200px] truncate">{task.title}</p>
                                {task.description && <p className="text-gray-400 truncate max-w-[200px]">{task.description}</p>}
                                {task._error && <p className="text-red-600 font-medium">{task._error}</p>}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${catMeta.color}`}>{catMeta.label}</span>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${priMeta.color}`}>{priMeta.label}</span>
                              </td>
                              <td className="px-3 py-2.5 text-gray-600">{task.due_date || <span className="text-gray-400 italic">—</span>}</td>
                              <td className="px-3 py-2.5 text-gray-500 max-w-[120px] truncate">{task.source || <span className="text-gray-300 italic">—</span>}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Assignee summary */}
                <div className="bg-[#4B49AC]/5 border border-[#4B49AC]/15 rounded-xl p-4">
                  <p className="text-xs font-bold text-[#4B49AC] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5" /> Email notification will be sent to:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {bulkSelectedEmails.map(email => (
                      <span key={email} className="text-xs bg-[#4B49AC] text-white px-2.5 py-1 rounded-full font-medium">
                        {assignableUsers.find(u => u.email === email)?.label || email.split('@')[0]}
                      </span>
                    ))}
                    <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">+ CEO (confirmation copy)</span>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setBulkStep(2)} disabled={isBulkSubmitting}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button
                    onClick={handleBulkSubmit}
                    disabled={isBulkSubmitting}
                    className="bg-[#4B49AC] hover:bg-[#3e3d93] text-white px-8 font-semibold"
                  >
                    {isBulkSubmitting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating {bulkParsedTasks.length} Tasks...</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-2" /> Submit {bulkParsedTasks.length} Tasks & Send Email</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ REWARDS: EARNINGS BREAKDOWN MODAL ═══════════════ */}
      {walletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    My Earnings &amp; Points Wallet
                    <span className="text-xs bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded-full">
                      1 Point = ₹1 INR
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">Track all points and cash rewards credited for your validated work</p>
                </div>
              </div>
              <button onClick={() => setWalletModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Wallet Summary Cards (Ledger Overview) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-[#4B49AC] to-[#3B398C] text-white p-3.5 rounded-xl shadow-sm">
                  <p className="text-[11px] text-amber-200 font-semibold uppercase">Account Balance</p>
                  <p className="text-2xl font-extrabold mt-1">₹{userRewardStats.currentAccountBalanceInr}</p>
                  <p className="text-[10px] text-white/80 mt-0.5">Holding in wallet</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                  <p className="text-[11px] text-emerald-700 font-semibold uppercase">Available to Claim</p>
                  <p className="text-2xl font-extrabold text-emerald-800 mt-1">₹{userRewardStats.availableBalanceInr}</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">Ready for payout request</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl">
                  <p className="text-[11px] text-amber-700 font-semibold uppercase">In Review (CEO)</p>
                  <p className="text-2xl font-extrabold text-amber-800 mt-1">₹{userRewardStats.pendingClaimInr}</p>
                  <p className="text-[10px] text-amber-600 mt-0.5">Pending CEO disbursement</p>
                </div>
                <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-xl">
                  <p className="text-[11px] text-slate-700 font-semibold uppercase">Disbursed &amp; Paid</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">₹{userRewardStats.totalPaidInr}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Completed bank/UPI payouts</p>
                </div>
              </div>

              {/* Task Rewards History Table */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#4B49AC]" /> Completed Tasks Reward History
                </h4>
                {userRewardStats.taskRewards.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-xl bg-gray-50">
                    <Coins className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 font-medium">No completed tasks yet</p>
                    <p className="text-xs text-gray-400 mt-0.5">Validate tasks early to earn base points + ₹15 speed bonuses!</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2.5 font-semibold text-gray-600 border-b">Task</th>
                          <th className="text-left px-3 py-2.5 font-semibold text-gray-600 border-b">Priority</th>
                          <th className="text-left px-3 py-2.5 font-semibold text-gray-600 border-b">Speed Bonus</th>
                          <th className="text-right px-3 py-2.5 font-semibold text-gray-600 border-b">Points</th>
                          <th className="text-right px-3 py-2.5 font-semibold text-gray-600 border-b">INR Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userRewardStats.taskRewards.map(({ task, reward }, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-3 py-2.5">
                              <p className="font-semibold text-gray-900 truncate max-w-[220px]">{task.title}</p>
                              <p className="text-[10px] text-gray-400">Validated: {new Date(task.updated_at).toLocaleDateString()}</p>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="capitalize font-medium text-gray-700">{task.priority}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              {reward.speedBonus > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                  <Zap className="h-3 w-3 text-amber-600" /> {reward.bonusLabel}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-[#4B49AC]">
                              +{reward.totalPoints} Pts
                            </td>
                            <td className="px-3 py-2.5 text-right font-extrabold text-emerald-700">
                              +₹{reward.inrValue}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Conversion guarantee note */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <strong>100% Guaranteed Payout Rate:</strong> 1 Knowledge Point = ₹1.00 INR credited to your monthly incentive.
                </span>
                <Button size="sm" variant="outline" onClick={() => setRulesModalOpen(true)} className="h-7 text-xs bg-white">
                  View Rules
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ REWARDS: TEAM LEADERBOARD MODAL ═══════════════ */}
      {leaderboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Team Rewards Leaderboard</h3>
                  <p className="text-xs text-gray-500">Top earners and fastest performers across the organization</p>
                </div>
              </div>
              <button onClick={() => setLeaderboardModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                {teamLeaderboard.map((member) => {
                  const isCurrent = member.email === (userEmail || '').toLowerCase().trim()
                  const rankIcon = member.rank === 1 ? "🥇" : member.rank === 2 ? "🥈" : member.rank === 3 ? "🥉" : `#${member.rank}`
                  return (
                    <div
                      key={member.email}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        isCurrent
                          ? 'border-[#4B49AC] bg-[#4B49AC]/5 shadow-xs'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg font-bold w-7 text-center shrink-0">{rankIcon}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900 truncate">{member.label}</p>
                            {isCurrent && (
                              <span className="text-[10px] bg-[#4B49AC] text-white px-1.5 py-0.2 rounded font-bold">YOU</span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-gray-100 text-gray-600">
                              {member.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {member.completedCount} tasks completed · {member.speedBonusCount} speed bonuses
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-base font-extrabold text-emerald-700">₹{member.totalPoints}</p>
                        <p className="text-[11px] font-semibold text-[#4B49AC]">
                          {member.totalPoints} Pts · {member.tier.icon}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ REWARDS: RULES MODAL ═══════════════ */}
      {rulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Reward &amp; Points Rules</h3>
                  <p className="text-xs text-gray-500">1 Point = ₹1 INR Real Incentive Policy</p>
                </div>
              </div>
              <button onClick={() => setRulesModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-sm">
              {/* Base points */}
              <div>
                <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-[#4B49AC]" /> 1. Base Points by Task Priority
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 flex justify-between items-center">
                    <span className="font-semibold text-red-800">Critical Priority</span>
                    <span className="font-bold text-red-900">50 Pts (₹50)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-200 flex justify-between items-center">
                    <span className="font-semibold text-orange-800">High Priority</span>
                    <span className="font-bold text-orange-900">30 Pts (₹30)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-yellow-50 border border-yellow-200 flex justify-between items-center">
                    <span className="font-semibold text-yellow-800">Medium Priority</span>
                    <span className="font-bold text-yellow-900">20 Pts (₹20)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 flex justify-between items-center">
                    <span className="font-semibold text-gray-800">Low Priority</span>
                    <span className="font-bold text-gray-900">10 Pts (₹10)</span>
                  </div>
                </div>
              </div>

              {/* Speed Bonus */}
              <div>
                <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-amber-500" /> 2. Speed &amp; Efficiency Multiplier Bonus
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-amber-900">⚡ Super Fast Delivery (&gt;= 24 Hours Early)</p>
                      <p className="text-amber-700">Completed more than a day before the due date</p>
                    </div>
                    <span className="font-extrabold text-amber-900 text-sm">+15 Pts (₹15)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-emerald-900">🎯 On-Time Delivery</p>
                      <p className="text-emerald-700">Completed on or before deadline</p>
                    </div>
                    <span className="font-extrabold text-emerald-900 text-sm">+5 Pts (₹5)</span>
                  </div>
                </div>
              </div>

              {/* Tiers */}
              <div>
                <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-cyan-600" /> 3. Performance Tiers
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-orange-50 border border-orange-200">
                    <p className="font-bold text-orange-900">🥉 Bronze Achiever</p>
                    <p className="text-orange-700">0 - 99 Pts</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 border border-slate-300">
                    <p className="font-bold text-slate-800">🥈 Silver Performer</p>
                    <p className="text-slate-600">100 - 299 Pts</p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="font-bold text-amber-900">🥇 Gold Star</p>
                    <p className="text-amber-700">300 - 699 Pts</p>
                  </div>
                  <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200">
                    <p className="font-bold text-cyan-900">💎 Diamond Champion</p>
                    <p className="text-cyan-700">700+ Pts</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <Button onClick={() => setRulesModalOpen(false)} className="bg-[#4B49AC] hover:bg-[#3e3d93] text-white px-8">
                  Got it, Let's Earn!
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ REWARDS: WITHDRAW / CLAIM MODAL ═══════════════ */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Claim Your Reward Amount</h3>
                  <p className="text-xs text-gray-500">Request payout directly to your UPI ID or Bank Account</p>
                </div>
              </div>
              <button onClick={() => setWithdrawModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Available balance highlight & Ledger Overview */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Account Holding Balance</p>
                    <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                      ₹{userRewardStats.currentAccountBalanceInr}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs px-2.5 py-1">
                    1 Point = ₹1 INR
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[11px]">Available to Claim</span>
                    <span className="font-extrabold text-emerald-700 text-sm">₹{userRewardStats.availableBalanceInr}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">In Review (CEO)</span>
                    <span className="font-bold text-amber-700 text-sm">₹{userRewardStats.pendingClaimInr}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Total Paid Out</span>
                    <span className="font-semibold text-slate-700 text-sm">₹{userRewardStats.totalPaidInr}</span>
                  </div>
                </div>
              </div>

              {/* Claim Form */}
              <form onSubmit={handleClaimSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 uppercase">Amount to Claim (₹) *</label>
                    <button
                      type="button"
                      onClick={() => setClaimAmountInput(userRewardStats.availableBalanceInr.toString())}
                      className="text-xs text-[#4B49AC] hover:underline font-bold"
                    >
                      Claim Full (₹{userRewardStats.availableBalanceInr})
                    </button>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    max={userRewardStats.availableBalanceInr}
                    required
                    value={claimAmountInput}
                    onChange={e => setClaimAmountInput(e.target.value)}
                    placeholder="Enter amount in ₹..."
                    className="h-10 text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase">Payment Method *</label>
                  <Select value={claimPaymentMethod} onValueChange={(v: any) => setClaimPaymentMethod(v)}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI">UPI (GooglePay / PhonePe / Paytm / BHIM)</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer (IMPS / NEFT)</SelectItem>
                      <SelectItem value="Other">Other Payout Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase">
                    {claimPaymentMethod === 'UPI' ? 'UPI ID (e.g. yourname@okaxis or 9876543210@paytm) *' : 'Bank Account Details (A/C No, IFSC, Beneficiary Name) *'}
                  </label>
                  <Input
                    required
                    value={claimPaymentDetails}
                    onChange={e => setClaimPaymentDetails(e.target.value)}
                    placeholder={claimPaymentMethod === 'UPI' ? 'e.g. member@okhdfcbank' : 'A/C: 1234567890, IFSC: HDFC0001234, Name: John Doe'}
                    className="h-10 text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase">Notes / Remarks (Optional)</label>
                  <Textarea
                    value={claimNotes}
                    onChange={e => setClaimNotes(e.target.value)}
                    placeholder="Any message for CEO / finance team..."
                    rows={2}
                    className="text-xs"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
                  <Info className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    Submitting this claim will notify <strong>ceo@biovaco.in</strong> via email. Payout is processed directly to your provided details.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setWithdrawModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isClaimSubmitting || userRewardStats.availableBalanceInr <= 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
                  >
                    {isClaimSubmitting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting Request...</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" /> Submit Claim &amp; Notify CEO</>
                    )}
                  </Button>
                </div>
              </form>

              {/* My Past Claims History */}
              {userRewardStats.myWithdrawals.length > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> My Recent Claim Requests
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {userRewardStats.myWithdrawals.map(w => (
                      <div key={w.id} className="p-2.5 rounded-lg border bg-gray-50/70 flex items-center justify-between text-xs gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900">₹{w.amount}</span>
                            <span className="text-gray-500 font-mono">({w.payment_method}: {w.payment_details})</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Claimed: {new Date(w.created_at).toLocaleDateString()}
                            {w.reminder_count && w.reminder_count > 0 && (
                              <span className="text-amber-700 ml-1 font-semibold">
                                · Reminded {w.reminder_count}x
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {w.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendPayoutReminder(w.id)}
                              className="h-6 text-[10px] border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 font-bold px-2 flex items-center gap-1"
                            >
                              <BellRing className="h-3 w-3 text-amber-700" /> Remind CEO
                            </Button>
                          )}
                          <Badge
                            className={`text-[10px] font-bold ${
                              w.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                              w.status === 'approved' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              w.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                              'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            {w.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ EXECUTIVE: PAYOUTS & CLAIMS CENTER (CEO / MD) ═══════════════ */}
      {executivePayoutsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    Executive Payouts &amp; Claims Management
                    <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300 font-bold text-[10px]">
                      CEO Dashboard
                    </Badge>
                  </h3>
                  <p className="text-xs text-gray-500">Track who claimed rewards, pending payouts, and member balances</p>
                </div>
              </div>
              <button onClick={() => setExecutivePayoutsModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Executive KPI Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                  <p className="text-[11px] text-gray-500 font-semibold uppercase">Total Pool Earned</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">
                    ₹{teamLeaderboard.reduce((s, m) => s + m.totalPoints, 0)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Across all members</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl">
                  <p className="text-[11px] text-amber-800 font-semibold uppercase">Pending Claims</p>
                  <p className="text-2xl font-extrabold text-amber-900 mt-1">
                    ₹{withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + w.amount, 0)}
                  </p>
                  <p className="text-[10px] text-amber-700 mt-0.5">{pendingWithdrawalsCount} requests waiting</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                  <p className="text-[11px] text-emerald-800 font-semibold uppercase">Total Paid Out</p>
                  <p className="text-2xl font-extrabold text-emerald-900 mt-1">
                    ₹{withdrawals.filter(w => w.status === 'paid').reduce((s, w) => s + w.amount, 0)}
                  </p>
                  <p className="text-[10px] text-emerald-700 mt-0.5">Disbursed rewards</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl">
                  <p className="text-[11px] text-blue-800 font-semibold uppercase">Unclaimed Balances</p>
                  <p className="text-2xl font-extrabold text-blue-900 mt-1">
                    ₹{teamLeaderboard.reduce((s, m) => s + m.availableInr, 0)}
                  </p>
                  <p className="text-[10px] text-blue-700 mt-0.5">Active member balance</p>
                </div>
              </div>

              {/* Section 1: Withdrawal Claims Requests */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-[#4B49AC]" /> Member Withdrawal Claims
                  </h4>
                  <div className="flex items-center gap-2">
                    <Select value={payoutsFilterStatus} onValueChange={setPayoutsFilterStatus}>
                      <SelectTrigger className="h-8 text-xs w-[130px]">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Claims</SelectItem>
                        <SelectItem value="pending">Pending Only</SelectItem>
                        <SelectItem value="paid">Paid Out</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {withdrawals.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-xl bg-gray-50">
                    <Receipt className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 font-medium">No withdrawal claims submitted yet</p>
                    <p className="text-xs text-gray-400 mt-0.5">When members click Claim Amount on their wallet, requests will appear here for payout approval.</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2.5 font-semibold text-gray-600 border-b">Member</th>
                          <th className="text-left px-3 py-2.5 font-semibold text-gray-600 border-b">Amount</th>
                          <th className="text-left px-3 py-2.5 font-semibold text-gray-600 border-b">Payment Info</th>
                          <th className="text-left px-3 py-2.5 font-semibold text-gray-600 border-b">Date</th>
                          <th className="text-left px-3 py-2.5 font-semibold text-gray-600 border-b">Status</th>
                          <th className="text-right px-3 py-2.5 font-semibold text-gray-600 border-b">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals
                          .filter(w => payoutsFilterStatus === 'all' || w.status === payoutsFilterStatus)
                          .map((claim) => (
                            <tr key={claim.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-3 py-2.5">
                                <p className="font-bold text-gray-900">{claim.user_name}</p>
                                <p className="text-[10px] text-gray-500">{claim.user_email}</p>
                                {claim.reminder_count && claim.reminder_count > 0 && (
                                  <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] px-1.5 py-0 font-bold flex items-center gap-1 mt-1 w-fit animate-pulse">
                                    <BellRing className="h-2.5 w-2.5 text-amber-700" />
                                    Reminded {claim.reminder_count}x
                                  </Badge>
                                )}
                              </td>
                              <td className="px-3 py-2.5 font-extrabold text-emerald-700 text-sm">
                                ₹{claim.amount}
                              </td>
                              <td className="px-3 py-2.5">
                                <p className="font-semibold text-gray-800">{claim.payment_method}</p>
                                <p className="font-mono text-gray-600">{claim.payment_details}</p>
                                {claim.transaction_id && (
                                  <p className="text-[10px] text-blue-700 font-mono font-bold mt-0.5">
                                    Txn/UTR: {claim.transaction_id}
                                  </p>
                                )}
                                {claim.notes && <p className="text-[10px] text-gray-400 italic">"{claim.notes}"</p>}
                              </td>
                              <td className="px-3 py-2.5 text-gray-500">
                                <p>{new Date(claim.created_at).toLocaleDateString()}</p>
                                {claim.processed_at && (
                                  <p className="text-[10px] text-emerald-700 font-medium">
                                    Paid: {new Date(claim.processed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                              </td>
                              <td className="px-3 py-2.5">
                                <Badge
                                  className={`text-[10px] font-bold ${
                                    claim.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                    claim.status === 'approved' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                    claim.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                                    'bg-amber-100 text-amber-800 border-amber-300'
                                  }`}
                                >
                                  {claim.status.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                {claim.status === 'pending' && (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateWithdrawalStatus(claim.id, 'paid')}
                                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                    >
                                      Mark Paid
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleUpdateWithdrawalStatus(claim.id, 'rejected')}
                                      className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                )}
                                {claim.status === 'paid' && (
                                  <div className="text-right">
                                    <span className="text-[11px] text-emerald-700 font-bold flex items-center justify-end gap-1">
                                      <CheckCircle className="h-3.5 w-3.5" /> Disbursed
                                    </span>
                                    {claim.payment_mode_used && (
                                      <span className="text-[10px] text-gray-500 block">{claim.payment_mode_used}</span>
                                    )}
                                  </div>
                                )}
                                {claim.status === 'rejected' && (
                                  <span className="text-[11px] text-red-600 font-semibold">Rejected</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Section 2: Member Balance & Withdrawal Tracker */}
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-[#4B49AC]" /> Member Balance &amp; Claim Tracker (Who Withdrew vs Who Hasn't)
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-600 border-b">Member</th>
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-600 border-b">Type</th>
                        <th className="text-right px-3 py-2.5 font-semibold text-gray-600 border-b">Lifetime Earned</th>
                        <th className="text-right px-3 py-2.5 font-semibold text-gray-600 border-b">Total Claimed</th>
                        <th className="text-right px-3 py-2.5 font-semibold text-gray-600 border-b">Available Unclaimed</th>
                        <th className="text-center px-3 py-2.5 font-semibold text-gray-600 border-b">Claim Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamLeaderboard.map((member) => (
                        <tr key={member.email} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2.5">
                            <p className="font-bold text-gray-900">{member.label}</p>
                            <p className="text-[10px] text-gray-500">{member.email}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-gray-100 text-gray-600">
                              {member.type}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-gray-900">
                            ₹{member.totalPoints}
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">
                            ₹{member.claimedInr}
                          </td>
                          <td className="px-3 py-2.5 text-right font-extrabold text-[#4B49AC]">
                            ₹{member.availableInr}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {member.pendingInr > 0 ? (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold">
                                Pending ₹{member.pendingInr}
                              </Badge>
                            ) : member.claimedInr > 0 && member.availableInr === 0 ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                                Fully Claimed
                              </Badge>
                            ) : member.availableInr > 0 ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300 text-[10px] font-medium">
                                Unclaimed Balance
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-[11px]">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ EXECUTIVE: MARK PAID WITH TRANSACTION ID MODAL ═══════════════ */}
      {markPaidModalClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Record Payout &amp; Mark as Paid</h3>
                  <p className="text-xs text-gray-500">Enter bank transaction / UTR reference ID</p>
                </div>
              </div>
              <button onClick={() => setMarkPaidModalClaim(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmMarkPaid} className="p-6 space-y-4">
              {/* Claim Summary */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold uppercase">Claim Amount</span>
                  <span className="text-lg font-extrabold text-emerald-700">₹{markPaidModalClaim.amount} ({markPaidModalClaim.points} Pts)</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-gray-500">Beneficiary:</span>
                  <span className="font-bold text-gray-900">{markPaidModalClaim.user_name} &lt;{markPaidModalClaim.user_email}&gt;</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Payment Mode &amp; A/C:</span>
                  <span className="font-mono font-bold text-[#4B49AC]">{markPaidModalClaim.payment_method}: {markPaidModalClaim.payment_details}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase">
                  Transaction ID / UTR / Reference Number *
                </label>
                <Input
                  required
                  value={markPaidTxnId}
                  onChange={e => setMarkPaidTxnId(e.target.value)}
                  placeholder="e.g. UPI UTR 423589123456 / IMPS12345678"
                  className="h-10 text-sm font-mono font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase">Payment Mode Used *</label>
                  <Select value={markPaidMode} onValueChange={setMarkPaidMode}>
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI (GPay / PhonePe / Paytm)">UPI (GPay / PhonePe / Paytm)</SelectItem>
                      <SelectItem value="Bank IMPS Transfer">Bank IMPS Transfer</SelectItem>
                      <SelectItem value="Bank NEFT / RTGS">Bank NEFT / RTGS</SelectItem>
                      <SelectItem value="Company Account Transfer">Company Account Transfer</SelectItem>
                      <SelectItem value="Cash / Other">Cash / Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 uppercase">Disbursed Date &amp; Time *</label>
                  <Input
                    type="datetime-local"
                    required
                    value={markPaidTime}
                    onChange={e => setMarkPaidTime(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase">Admin / Finance Remarks (Optional)</label>
                <Textarea
                  value={markPaidRemarks}
                  onChange={e => setMarkPaidRemarks(e.target.value)}
                  placeholder="Any bank reference notes..."
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Confirming will permanently mark this claim as <strong>PAID</strong>, update the member's wallet ledger, and send a receipt email with the transaction ID to <strong>{markPaidModalClaim.user_email}</strong>.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setMarkPaidModalClaim(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isMarkingPaid}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
                >
                  {isMarkingPaid ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Recording Payout...</>
                  ) : (
                    <><Check className="h-4 w-4 mr-2" /> Confirm Payout &amp; Send Receipt</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ MEMBER: SUBMIT WORK FOR CEO REVIEW MODAL ═══════════════ */}
      {submitReviewModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Submit Work for CEO Validation</h3>
                  <p className="text-xs text-gray-500">Provide proof/links of your completed work</p>
                </div>
              </div>
              <button onClick={() => setSubmitReviewModalItem(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleMemberSubmitReview} className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase">Task Title</p>
                <p className="text-sm font-bold text-gray-900">{submitReviewModalItem.title}</p>
                <div className="flex items-center gap-2 pt-1 text-xs text-emerald-700 font-semibold">
                  <Coins className="h-3.5 w-3.5 text-emerald-600" />
                  Potential Reward: +₹{calculateTaskPoints(submitReviewModalItem).inrValue} ({calculateTaskPoints(submitReviewModalItem).totalPoints} Pts) upon CEO approval
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase">
                  Work Proof / Deliverable Summary / Links *
                </label>
                <Textarea
                  required
                  value={submitReviewProofNotes}
                  onChange={e => setSubmitReviewProofNotes(e.target.value)}
                  placeholder="Explain what you accomplished, link to document / spreadsheet / code / designs, output proof..."
                  rows={4}
                  className="text-xs"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  Submitting will notify <strong>ceo@biovaco.in</strong> via email. Points will be automatically credited to your wallet once CEO reviews and validates your work.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setSubmitReviewModalItem(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="bg-[#4B49AC] hover:bg-[#3e3d93] text-white font-bold px-6"
                >
                  {isSubmittingReview ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> Submit for CEO Review</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ CEO: REVIEW & VALIDATE TASK MODAL ═══════════════ */}
      {ceoReviewModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">CEO Work Review &amp; Validation</h3>
                  <p className="text-xs text-gray-500">Review member's completed work and credit points</p>
                </div>
              </div>
              <button onClick={() => setCeoReviewModalItem(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Task</p>
                    <p className="text-sm font-bold text-gray-900">{ceoReviewModalItem.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Assigned to: <strong className="text-slate-800">{ceoReviewModalItem.assigned_to || 'Member'}</strong></p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs">
                    ₹{calculateTaskPoints(ceoReviewModalItem).inrValue} ({calculateTaskPoints(ceoReviewModalItem).totalPoints} Pts)
                  </Badge>
                </div>

                {ceoReviewModalItem.validation_notes && (
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-[11px] font-bold text-blue-900 uppercase">Member's Submitted Proof / Notes:</p>
                    <p className="text-xs text-slate-800 mt-1 bg-white p-2.5 rounded-lg border border-slate-200 whitespace-pre-wrap">
                      {ceoReviewModalItem.validation_notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase">
                  CEO Remarks / Review Feedback (Optional for approval, required for rework)
                </label>
                <Textarea
                  value={ceoReviewFeedback}
                  onChange={e => setCeoReviewFeedback(e.target.value)}
                  placeholder="Enter positive feedback or rework instructions..."
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isCeoValidating}
                  onClick={() => handleCeoRequestRework(ceoReviewModalItem, ceoReviewFeedback)}
                  className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Request Changes / Rework
                </Button>

                <Button
                  type="button"
                  disabled={isCeoValidating}
                  onClick={() => handleCeoApproveAndValidate(ceoReviewModalItem, ceoReviewFeedback)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 shadow-sm"
                >
                  {isCeoValidating ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Processing...</>
                  ) : (
                    <><Check className="h-3.5 w-3.5 mr-1.5" /> Approve &amp; Credit ₹{calculateTaskPoints(ceoReviewModalItem).inrValue}</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Deep Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input className="pl-9 text-sm" placeholder="Deep search title, description, notes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>

            {/* Executive Assignee Filter Dropdown */}
            {isExecutive && (
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger className="w-full sm:w-[200px] text-xs">
                  <User className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                  <SelectValue placeholder="All Assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="mine">Assigned to Me</SelectItem>
                  {assignableUsers.map(u => (
                    <SelectItem key={u.email} value={u.email}>
                      {u.label} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[150px] text-xs"><Filter className="h-3.5 w-3.5 mr-1.5 text-gray-400" /><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Categories</SelectItem>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Statuses</SelectItem>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full sm:w-[150px] text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Priorities</SelectItem>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      {filteredItems.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No knowledge items found</p>
          <p className="text-sm text-gray-400 mt-1">
            {!isExecutive 
              ? "No tasks assigned to your email at the moment." 
              : items.length === 0 ? 'Click "Add Knowledge Item" to get started' : "Try adjusting your filters"}
          </p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => {
            const cat = getCatMeta(item.category), pri = getPriMeta(item.priority), sta = getStaMeta(item.status)
            const StaIcon = sta.icon, CatIcon = cat.icon
            const isExpanded = expandedId === item.id
            const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== "validated" && item.status !== "rejected"
            const itemReward = calculateTaskPoints(item)
            return (
              <Card key={item.id} className="shadow-sm hover:shadow-md transition-all border-gray-200/80">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <button 
                      onClick={() => handleStatusChange(item.id, item.status === "validated" ? "pending" : item.status === "pending" ? "in_progress" : "validated")}
                      className="mt-0.5 shrink-0 transition-transform hover:scale-110" 
                      title="Toggle status"
                    >
                      <StaIcon className={`h-5 w-5 ${item.status === "validated" ? "text-foreground" : item.status === "in_progress" ? "text-foreground" : item.status === "rejected" ? "text-red-400" : "text-gray-400"}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-semibold text-gray-900 ${item.status === "validated" ? "line-through opacity-60" : ""}`}>{item.title}</h3>
                        {isOverdue && <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0">OVERDUE</Badge>}

                        {/* Reward Badge */}
                        {item.status === "validated" ? (
                          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 border text-[10px] px-2 py-0.5 font-bold flex items-center gap-1 shadow-2xs">
                            <Coins className="h-3 w-3 text-emerald-600" />
                            +₹{itemReward.inrValue} ({itemReward.totalPoints} Pts)
                            {itemReward.speedBonus > 0 && <span className="text-amber-600 ml-0.5 font-extrabold">⚡+15</span>}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50/80 text-amber-800 border-amber-200 text-[10px] px-2 py-0.5 font-semibold flex items-center gap-1">
                            <Coins className="h-3 w-3 text-amber-600" />
                            Potential: +₹{itemReward.basePoints + 15} ({itemReward.basePoints + 15} Pts)
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className={`${cat.color} text-[11px] px-1.5 py-0 border`}><CatIcon className="h-3 w-3 mr-1" />{cat.label}</Badge>
                        <Badge variant="outline" className={`${pri.color} text-[11px] px-1.5 py-0 border`}>{pri.label}</Badge>
                        <Badge variant="outline" className={`${sta.color} text-[11px] px-1.5 py-0`}>{sta.label}</Badge>

                        {/* Status specific badges & action shortcuts */}
                        {item.status === 'pending_review' && (
                          <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold text-[10px] px-2 py-0.5 animate-pulse">
                            ⏳ Under CEO Review (Points pending validation)
                          </Badge>
                        )}
                        {item.status === 'rejected' && (
                          <Badge className="bg-red-100 text-red-800 border-red-300 font-bold text-[10px] px-2 py-0.5">
                            ⚠️ Changes Requested by CEO
                          </Badge>
                        )}

                        {/* Executive direct review action */}
                        {isExecutive && item.status === 'pending_review' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCeoReviewModalItem(item);
                              setCeoReviewFeedback("");
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold h-6 px-2.5 shadow-2xs"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Review &amp; Validate
                          </Button>
                        )}

                        {/* Member submit for review button */}
                        {!isExecutive && (item.status === 'pending' || item.status === 'in_progress' || item.status === 'rejected') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSubmitReviewModalItem(item);
                              setSubmitReviewProofNotes(item.validation_notes || "");
                            }}
                            className="border-[#4B49AC] text-[#4B49AC] hover:bg-[#4B49AC]/10 text-[11px] font-bold h-6 px-2"
                          >
                            <Send className="h-3 w-3 mr-1" /> Submit for Review
                          </Button>
                        )}

                        {item.assigned_to && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.assigned_to.split(',').filter(Boolean).map(email => (
                              <Badge key={email} variant="outline" className="bg-muted/50 text-foreground border-border text-[10px] px-1.5 py-0">
                                <User className="h-3 w-3 mr-1" />
                                {email.split('@')[0]}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {item.due_date && <span className="text-[11px] text-gray-400">Due: {item.due_date}</span>}
                        {item.source && <span className="text-[11px] text-gray-400 hidden sm:inline">· {item.source}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4 text-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-4 pl-8 space-y-3 animate-in slide-in-from-top-1 duration-200">
                      {/* Reward breakdown highlight */}
                      <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4 text-amber-600" />
                          <span className="font-bold text-gray-800">Task Value:</span>
                          <span className="text-gray-700">{itemReward.breakdown}</span>
                        </div>
                        <span className="font-bold text-emerald-700">1 Pt = ₹1 INR</span>
                      </div>

                      {item.description && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</p><p className="text-sm text-gray-700 whitespace-pre-wrap">{item.description}</p></div>}
                      {item.validation_notes && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Work Proof / Notes</p><p className="text-sm text-gray-700 whitespace-pre-wrap bg-slate-50 p-2.5 rounded-lg border">{item.validation_notes}</p></div>}
                      {item.source && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Source</p><p className="text-sm text-gray-700">{item.source}</p></div>}
                      <div className="flex gap-4 text-[11px] text-gray-400 pt-1 border-t border-gray-100">
                        <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                        <span>Updated: {new Date(item.updated_at).toLocaleDateString()}</span>
                      </div>
                      
                      {/* Action buttons in expanded view */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                        {isExecutive ? (
                          <>
                            {STATUSES.map(s => (
                              <Button 
                                key={s.value} 
                                variant={item.status === s.value ? "default" : "outline"} 
                                size="sm"
                                className={`text-xs h-7 ${item.status === s.value ? "bg-primary text-primary-foreground" : ""}`}
                                onClick={() => handleStatusChange(item.id, s.value)}
                              >
                                <s.icon className="h-3 w-3 mr-1" /> {s.label}
                              </Button>
                            ))}
                            {item.status !== 'validated' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setCeoReviewModalItem(item);
                                  setCeoReviewFeedback("");
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 font-bold ml-auto"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" /> CEO: Approve &amp; Credit ₹{itemReward.inrValue}
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <Button
                              variant={item.status === 'pending' ? "default" : "outline"}
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => handleStatusChange(item.id, 'pending')}
                            >
                              Pending
                            </Button>
                            <Button
                              variant={item.status === 'in_progress' ? "default" : "outline"}
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => handleStatusChange(item.id, 'in_progress')}
                            >
                              In Progress
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSubmitReviewModalItem(item);
                                setSubmitReviewProofNotes(item.validation_notes || "");
                              }}
                              className="bg-[#4B49AC] hover:bg-[#3e3d93] text-white text-xs h-7 font-bold"
                            >
                              <Send className="h-3 w-3 mr-1" /> Submit Work for CEO Review
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {filteredItems.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Showing {filteredItems.length} of {userAccessibleItems.length} accessible items · {stats.validated} validated
          {pendingCount > 0 && <span className="text-foreground ml-2">· {pendingCount} pending sync</span>}
        </p>
      )}
    </div>
  )
}
