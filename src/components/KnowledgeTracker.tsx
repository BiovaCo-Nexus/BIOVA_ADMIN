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
  Send, ArrowLeft
} from "lucide-react"

type Priority = "critical" | "high" | "medium" | "low"
type Status = "pending" | "in_progress" | "validated" | "rejected"
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
  { value: "pending", label: "Pending", icon: Circle, color: "bg-slate-100 text-slate-700" },
  { value: "in_progress", label: "In Progress", icon: Clock, color: "bg-[#4B49AC] text-white border-0" },
  { value: "validated", label: "Validated", icon: CheckCircle2, color: "bg-primary/10 text-primary border-0" },
  { value: "rejected", label: "Rejected", icon: XCircle, color: "bg-red-100 text-red-700" },
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

  const sendTaskValidatedEmail = async (
    item: KnowledgeItem,
    completedByEmail: string | null,
    validationNotes?: string
  ) => {
    const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || "xkeysib-brevo-key"
    
    // Find member label/name
    const memberObj = assignableUsers.find(u => u.email.toLowerCase() === (completedByEmail || '').toLowerCase())
    const memberName = memberObj ? memberObj.label : (completedByEmail?.split('@')[0] || 'Team Member')
    const completedAtStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })

    const recipients = [
      { email: "ceo@biovaco.in", name: "CEO Office (BiovaCo)" },
      { email: "md@biovaco.in", name: "MD Office (BiovaCo)" }
    ]

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; max-width: 650px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: 5px solid #10b981; border-radius: 8px; margin: 0 auto;">
        <div style="border-bottom: 1px solid #edf2f7; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #065f46; margin: 0; font-size: 20px;">✅ Task Completed &amp; Validated</h2>
          <span style="background-color: #ecfdf5; color: #047857; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block; margin-top: 6px; border: 1px solid #a7f3d0;">
            WORK COMPLETION ALERT FOR EXECUTIVE OFFICE
          </span>
        </div>

        <p style="color: #2d3748; font-size: 14px; line-height: 1.6;">
          Dear CEO &amp; Management,
        </p>

        <p style="color: #2d3748; font-size: 14px; line-height: 1.6;">
          <strong>${memberName}</strong> (<code>${completedByEmail || 'N/A'}</code>) has marked the following task as <strong>Validated / Completed</strong> in the <strong>Knowledge Tracker</strong>:
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; color: #718096; width: 140px;"><strong>Task Title:</strong></td>
              <td style="padding: 8px 0; color: #1a202c; font-weight: bold; font-size: 15px;">${item.title}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Completed By:</strong></td>
              <td style="padding: 8px 0; color: #047857; font-weight: bold;">${memberName} &lt;${completedByEmail || 'N/A'}&gt;</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Completed Time:</strong></td>
              <td style="padding: 8px 0; color: #2d3748; font-weight: 500;">${completedAtStr} IST</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Priority:</strong></td>
              <td style="padding: 8px 0;"><span style="background-color: #fff5f5; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">${(item.priority || 'MEDIUM').toUpperCase()}</span></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Category:</strong></td>
              <td style="padding: 8px 0; color: #2d3748; font-weight: 600;">${(item.category || 'SYSTEM').toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Assigned To:</strong></td>
              <td style="padding: 8px 0; color: #4B49AC;">${item.assigned_to || memberName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;"><strong>Due Date:</strong></td>
              <td style="padding: 8px 0; color: #2d3748;">${item.due_date || "No deadline"}</td>
            </tr>
            ${item.description ? `
            <tr>
              <td style="padding: 8px 0; color: #718096; vertical-align: top;"><strong>Description:</strong></td>
              <td style="padding: 8px 0; color: #4a5568; line-height: 1.5;">${item.description}</td>
            </tr>` : ''}
            ${(validationNotes || item.validation_notes) ? `
            <tr>
              <td style="padding: 8px 0; color: #718096; vertical-align: top;"><strong>Validation Notes:</strong></td>
              <td style="padding: 8px 0; color: #065f46; background: #ecfdf5; padding: 8px; border-radius: 6px; font-weight: 500;">${validationNotes || item.validation_notes}</td>
            </tr>` : ''}
          </table>
        </div>

        <p style="text-align: center; margin-top: 25px;">
          <a href="https://admin.biovaco.in" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 11px 22px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
            Open Knowledge Tracker Portal →
          </a>
        </p>

        <p style="color: #a0aec0; font-size: 11px; text-align: center; margin-top: 20px; border-top: 1px solid #edf2f7; padding-top: 15px;">
          BiovaCo Nexus Enterprise ERP • Automated Task Completion Notice
        </p>
      </div>
    `;

    const payload = {
      sender: { name: "BiovaCo Task Validation", email: "no-reply@biovaco.in" },
      to: recipients,
      subject: `[Task Validated] ${memberName} completed: "${item.title}"`,
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
          title: "✉️ CEO Notified!",
          description: `Completion notice sent to ceo@biovaco.in for "${item.title}".`
        });
      }
    } catch (err) {
      console.warn("Brevo completion notification error:", err);
    }
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

      await updateItem(editId, {
        ...form,
        assigned_to: targetAssignedTo,
        description: form.description || null,
        source: form.source || null,
        validation_notes: form.validation_notes || null,
        due_date: form.due_date || null,
      })
      
      const assignees = targetAssignedTo.split(',').map(e => e.trim()).filter(Boolean)
      if (assignees.length > 0 && !isNewlyValidated) {
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

      if (isNewlyValidated && existingItem) {
        sendTaskValidatedEmail(
          { ...existingItem, ...form, assigned_to: targetAssignedTo },
          userEmail,
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

      if (form.status === "validated") {
        sendTaskValidatedEmail(createdItem, userEmail, form.validation_notes)
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
    await updateItem(id, { status })
    toast({ title: `Status → ${status.replace("_", " ")}` })

    if (status === "validated" && item) {
      sendTaskValidatedEmail({ ...item, status: "validated" }, userEmail)
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
          <div className="flex items-center gap-2">
            {isExecutive && (
              <Button
                onClick={handleBulkOpen}
                variant="outline"
                className="border-[#4B49AC] text-[#4B49AC] hover:bg-[#4B49AC]/10 font-semibold"
              >
                <ListChecks className="h-4 w-4 mr-2" /> Bulk Todo
              </Button>
            )}
            <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="h-4 w-4 mr-2" /> Add Knowledge Item
            </Button>
          </div>
        )}
      </div>

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

      {/* Filter Controls Bar */}
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
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className={`${cat.color} text-[11px] px-1.5 py-0 border`}><CatIcon className="h-3 w-3 mr-1" />{cat.label}</Badge>
                        <Badge variant="outline" className={`${pri.color} text-[11px] px-1.5 py-0 border`}>{pri.label}</Badge>
                        <Badge variant="outline" className={`${sta.color} text-[11px] px-1.5 py-0`}>{sta.label}</Badge>
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
                      {item.description && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</p><p className="text-sm text-gray-700 whitespace-pre-wrap">{item.description}</p></div>}
                      {item.validation_notes && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Validation Notes</p><p className="text-sm text-gray-700 whitespace-pre-wrap">{item.validation_notes}</p></div>}
                      {item.source && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Source</p><p className="text-sm text-gray-700">{item.source}</p></div>}
                      <div className="flex gap-4 text-[11px] text-gray-400 pt-1 border-t border-gray-100">
                        <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                        <span>Updated: {new Date(item.updated_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2 pt-1">
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
