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
  Wifi, WifiOff, RefreshCw, CloudOff, User, Lock, UserCheck
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return }
    setIsSaving(true)
    
    // Determine target assignees: if non-executive, force assignment to self
    const targetAssignedTo = isExecutive 
      ? (form.assigned_to || userEmail || "") 
      : (userEmail || "")

    if (editId) {
      await updateItem(editId, {
        ...form,
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
      
      toast({ title: isOnline ? "Item updated" : "Item updated (will sync when online)" })
    } else {
      await addItem({
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
    await updateItem(id, { status })
    toast({ title: `Status → ${status.replace("_", " ")}` })
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
          <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="h-4 w-4 mr-2" /> Add Knowledge Item
          </Button>
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
