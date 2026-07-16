import { useState, useMemo } from "react"
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
  Wifi, WifiOff, RefreshCw, CloudOff
} from "lucide-react"

type Priority = "critical" | "high" | "medium" | "low"
type Status = "pending" | "in_progress" | "validated" | "rejected"
type Category = "system" | "market" | "competitor" | "regulation" | "technology" | "customer"

const CATEGORIES: { value: Category; label: string; icon: any; color: string }[] = [
  { value: "system", label: "System", icon: Server, color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "market", label: "Market", icon: TrendingUp, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "competitor", label: "Competitor", icon: Target, color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "regulation", label: "Regulation", icon: ShieldCheck, color: "bg-purple-100 text-purple-800 border-purple-200" },
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
  { value: "in_progress", label: "In Progress", icon: Clock, color: "bg-blue-100 text-blue-700" },
  { value: "validated", label: "Validated", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
  { value: "rejected", label: "Rejected", icon: XCircle, color: "bg-red-100 text-red-700" },
]

const emptyForm = () => ({
  title: "", description: "", category: "system" as Category, priority: "medium" as Priority,
  status: "pending" as Status, source: "", validation_notes: "", due_date: "",
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
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const stats = useMemo(() => {
    const total = items.length
    const validated = items.filter(i => i.status === "validated").length
    const pending = items.filter(i => i.status === "pending").length
    const inProgress = items.filter(i => i.status === "in_progress").length
    const critical = items.filter(i => i.priority === "critical" && i.status !== "validated").length
    const overdue = items.filter(i => i.due_date && new Date(i.due_date) < new Date() && i.status !== "validated" && i.status !== "rejected").length
    return { total, validated, pending, inProgress, critical, overdue }
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(item.description || "").toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (filterCategory !== "all" && item.category !== filterCategory) return false
      if (filterStatus !== "all" && item.status !== filterStatus) return false
      if (filterPriority !== "all" && item.priority !== filterPriority) return false
      return true
    }).sort((a, b) => {
      const pOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
      const sOrder: Record<string, number> = { pending: 0, in_progress: 1, validated: 2, rejected: 3 }
      if ((pOrder[a.priority] ?? 9) !== (pOrder[b.priority] ?? 9)) return (pOrder[a.priority] ?? 9) - (pOrder[b.priority] ?? 9)
      if ((sOrder[a.status] ?? 9) !== (sOrder[b.status] ?? 9)) return (sOrder[a.status] ?? 9) - (sOrder[b.status] ?? 9)
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [items, searchQuery, filterCategory, filterStatus, filterPriority])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return }
    setIsSaving(true)
    if (editId) {
      await updateItem(editId, {
        title: form.title, description: form.description || null, category: form.category,
        priority: form.priority, status: form.status, source: form.source || null,
        validation_notes: form.validation_notes || null, due_date: form.due_date || null,
      })
      toast({ title: isOnline ? "Item updated" : "Item updated (will sync when online)" })
    } else {
      await addItem({
        title: form.title, description: form.description || null, category: form.category,
        priority: form.priority, status: form.status, source: form.source || null,
        validation_notes: form.validation_notes || null, due_date: form.due_date || null,
      })
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
      validation_notes: item.validation_notes || "", due_date: item.due_date || "",
    })
    setEditId(item.id)
    setIsEditing(true)
  }

  const resetForm = () => { setForm(emptyForm()); setEditId(null); setIsEditing(false) }
  const getCatMeta = (c: string) => CATEGORIES.find(x => x.value === c) || CATEGORIES[0]
  const getPriMeta = (p: string) => PRIORITIES.find(x => x.value === p) || PRIORITIES[2]
  const getStaMeta = (s: string) => STATUSES.find(x => x.value === s) || STATUSES[0]

  if (isLoading && items.length === 0) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>
  }

  return (
    <div className="space-y-6">
      {/* ── Offline/Sync Status Banner ── */}
      {(!isOnline || pendingCount > 0) && (
        <div className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border ${
          !isOnline
            ? "bg-amber-50 border-amber-300 text-amber-800"
            : "bg-blue-50 border-blue-200 text-blue-800"
        }`}>
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

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-[#032E63]">Knowledge Tracker</h2>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${isOnline ? "bg-green-50 text-green-700 border-green-300" : "bg-amber-50 text-amber-700 border-amber-300"}`}>
              {isOnline ? <><Wifi className="h-3 w-3 mr-0.5" />Online</> : <><WifiOff className="h-3 w-3 mr-0.5" />Offline</>}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">Track & validate system and market knowledge</p>
        </div>
        {!isEditing && (
          <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-[#08A04B] hover:bg-[#069a43]">
            <Plus className="h-4 w-4 mr-2" /> Add Knowledge Item
          </Button>
        )}
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total", value: stats.total, icon: BarChart3, bg: "bg-[#032E63]", text: "text-white", accent: "text-blue-200" },
          { label: "Pending", value: stats.pending, icon: Circle, bg: "bg-white", text: "text-slate-800", accent: "text-slate-400" },
          { label: "In Progress", value: stats.inProgress, icon: Clock, bg: "bg-white", text: "text-blue-700", accent: "text-blue-400" },
          { label: "Validated", value: stats.validated, icon: CheckCircle2, bg: "bg-white", text: "text-green-700", accent: "text-green-400" },
          { label: "Critical", value: stats.critical, icon: AlertTriangle, bg: "bg-white", text: "text-red-700", accent: "text-red-400" },
          { label: "Overdue", value: stats.overdue, icon: AlertTriangle, bg: stats.overdue > 0 ? "bg-red-50 border-red-200" : "bg-white", text: stats.overdue > 0 ? "text-red-800" : "text-gray-700", accent: "text-red-400" },
        ].map(s => (
          <Card key={s.label} className={`${s.bg} border shadow-sm`}>
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

      {/* ── Form ── */}
      {isEditing && (
        <Card className="border-l-4 border-l-[#08A04B] shadow-md animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-[#032E63]">{editId ? "Edit Item" : "New Knowledge Item"}</CardTitle>
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
                  <Select value={form.category} onValueChange={v => setForm({...form, category: v as Category})}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Priority</label>
                  <Select value={form.priority} onValueChange={v => setForm({...form, priority: v as Priority})}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select value={form.status} onValueChange={v => setForm({...form, status: v as Status})}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Due Date</label>
                  <Input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
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
                <Button type="submit" disabled={isSaving} className="bg-[#08A04B] hover:bg-[#069a43]">
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  {editId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Filters ── */}
      <Card className="shadow-sm"><CardContent className="p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input className="pl-9" placeholder="Search knowledge items..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[150px]"><Filter className="h-3.5 w-3.5 mr-1.5 text-gray-400" /><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Categories</SelectItem>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Statuses</SelectItem>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Priorities</SelectItem>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      {/* ── Items List ── */}
      {filteredItems.length === 0 ? (
        <Card className="shadow-sm"><CardContent className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No knowledge items found</p>
          <p className="text-sm text-gray-400 mt-1">{items.length === 0 ? 'Click "Add Knowledge Item" to get started' : "Try adjusting your filters"}</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => {
            const cat = getCatMeta(item.category), pri = getPriMeta(item.priority), sta = getStaMeta(item.status)
            const StaIcon = sta.icon, CatIcon = cat.icon
            const isExpanded = expandedId === item.id
            const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== "validated" && item.status !== "rejected"
            return (
              <Card key={item.id} className={`shadow-sm transition-all duration-200 hover:shadow-md ${isOverdue ? "border-l-4 border-l-red-400" : item.priority === "critical" ? "border-l-4 border-l-red-500" : item.priority === "high" ? "border-l-4 border-l-orange-400" : "border-l-4 border-l-transparent"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <button onClick={() => handleStatusChange(item.id, item.status === "validated" ? "pending" : item.status === "pending" ? "in_progress" : "validated")}
                      className="mt-0.5 shrink-0 transition-transform hover:scale-110" title="Toggle status">
                      <StaIcon className={`h-5 w-5 ${item.status === "validated" ? "text-green-500" : item.status === "in_progress" ? "text-blue-500" : item.status === "rejected" ? "text-red-400" : "text-gray-400"}`} />
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
                        {item.due_date && <span className="text-[11px] text-gray-400">Due: {item.due_date}</span>}
                        {item.source && <span className="text-[11px] text-gray-400 hidden sm:inline">· {item.source}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4 text-blue-600" />
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
                          <Button key={s.value} variant={item.status === s.value ? "default" : "outline"} size="sm"
                            className={`text-xs h-7 ${item.status === s.value ? "bg-[#032E63]" : ""}`}
                            onClick={() => handleStatusChange(item.id, s.value)}>
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
          Showing {filteredItems.length} of {items.length} items · {stats.validated} validated ({items.length > 0 ? Math.round(stats.validated / items.length * 100) : 0}%)
          {pendingCount > 0 && <span className="text-amber-500 ml-2">· {pendingCount} pending sync</span>}
        </p>
      )}
    </div>
  )
}
