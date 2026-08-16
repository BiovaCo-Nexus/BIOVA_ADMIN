import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Kanban, Plus, Loader2, Pencil, Trash2, AlertTriangle, Search, Filter, CheckCircle2, Clock, ListTodo } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface OpsTask {
  id: string; title: string; description: string | null; project_id: string | null
  assignee: string | null; priority: string; status: string; due_date: string | null
  estimated_hours: number; actual_hours: number; labels: string[]
  created_by: string; created_at: string
}

interface OpsProjectRef { id: string; name: string; code: string | null }

const STATUS_OPTIONS = ["Todo", "In Progress", "Review", "Done"]
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"]

const statusColor: Record<string, string> = {
  "Todo": "bg-slate-100 text-slate-600 border-slate-200",
  "In Progress": "bg-amber-100 text-amber-700 border-amber-200",
  "Review": "bg-purple-100 text-purple-700 border-purple-200",
  "Done": "bg-green-100 text-green-700 border-green-200",
}

const priorityColor: Record<string, string> = {
  "Low": "bg-slate-100 text-slate-600",
  "Medium": "bg-blue-100 text-blue-600",
  "High": "bg-orange-100 text-orange-700",
  "Critical": "bg-red-100 text-red-700",
}

interface TasksManagementProps {
  onNavigateToTab?: (tabId: string, payload?: string) => void
  initialProjectFilter?: string | null
}

export function TasksManagement({ onNavigateToTab, initialProjectFilter }: TasksManagementProps) {
  const [tasks, setTasks] = useState<OpsTask[]>([])
  const [projects, setProjects] = useState<OpsProjectRef[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<OpsTask | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterProject, setFilterProject] = useState(initialProjectFilter || "all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const [form, setForm] = useState({
    title: "", description: "", project_id: "", assignee: "",
    priority: "Medium", status: "Todo", due_date: "",
    estimated_hours: "", labels: ""
  })

  const resetForm = () => setForm({
    title: "", description: "", project_id: "", assignee: "",
    priority: "Medium", status: "Todo", due_date: "",
    estimated_hours: "", labels: ""
  })

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("ops_tasks" as any).select("*").order("created_at", { ascending: false })
      if (!error && data) setTasks(data as any[])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fetchProjects = async () => {
    try {
      const { data } = await supabase.from("ops_projects" as any).select("id, name, code").order("name")
      if (data) setProjects(data as any[])
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    fetchTasks()
    fetchProjects()
    const channel = supabase.channel("ops-tasks-realtime")
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "ops_tasks" }, () => fetchTasks())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (initialProjectFilter) setFilterProject(initialProjectFilter)
  }, [initialProjectFilter])

  const handleSave = async () => {
    if (!form.title) {
      toast({ title: "Validation Error", description: "Task title is required.", variant: "destructive" })
      return
    }
    const payload = {
      title: form.title,
      description: form.description || null,
      project_id: form.project_id || null,
      assignee: form.assignee || null,
      priority: form.priority,
      status: form.status,
      due_date: form.due_date || null,
      estimated_hours: Number(form.estimated_hours) || 0,
      labels: form.labels ? form.labels.split(",").map(l => l.trim()) : [],
      updated_at: new Date().toISOString(),
    }

    if (editingTask) {
      const { error } = await supabase.from("ops_tasks" as any).update(payload as any).eq("id", editingTask.id)
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
      toast({ title: "Updated", description: `Task "${form.title}" updated.` })
    } else {
      const { error } = await supabase.from("ops_tasks" as any).insert({ ...payload, created_by: "portal" } as any)
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
      toast({ title: "Created", description: `Task "${form.title}" created.` })
      await supabase.from("ops_activity_log" as any).insert({ actor: "portal", action: "Created Task", entity_type: "task", entity_name: form.title } as any)
    }
    setIsModalOpen(false)
    resetForm()
    setEditingTask(null)
    fetchTasks()
  }

  const handleEdit = (t: OpsTask) => {
    setEditingTask(t)
    setForm({
      title: t.title, description: t.description || "", project_id: t.project_id || "",
      assignee: t.assignee || "", priority: t.priority, status: t.status,
      due_date: t.due_date || "", estimated_hours: String(t.estimated_hours || ""),
      labels: (t.labels || []).join(", ")
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (t: OpsTask) => {
    await supabase.from("ops_tasks" as any).delete().eq("id", t.id)
    toast({ title: "Deleted", description: `Task "${t.title}" deleted.` })
    fetchTasks()
  }

  const handleBulkStatusUpdate = async (newStatus: string) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    for (const id of ids) {
      await supabase.from("ops_tasks" as any).update({ status: newStatus, updated_at: new Date().toISOString() } as any).eq("id", id)
    }
    toast({ title: "Updated", description: `${ids.length} tasks moved to "${newStatus}".` })
    setSelectedIds(new Set())
    fetchTasks()
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedIds(next)
  }

  const getProjectName = (pid: string | null) => {
    if (!pid) return "—"
    const p = projects.find(pr => pr.id === pid)
    return p ? (p.code ? `${p.code}: ${p.name}` : p.name) : "—"
  }

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.assignee || "").toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus = filterStatus === "all" || t.status === filterStatus
      const matchPriority = filterPriority === "all" || t.priority === filterPriority
      const matchProject = filterProject === "all" || t.project_id === filterProject
      return matchSearch && matchStatus && matchPriority && matchProject
    })
  }, [tasks, searchQuery, filterStatus, filterPriority, filterProject])

  const isOverdue = (t: OpsTask) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "Done"

  const todoCount = tasks.filter(t => t.status === "Todo").length
  const inProgressCount = tasks.filter(t => t.status === "In Progress").length
  const reviewCount = tasks.filter(t => t.status === "Review").length
  const doneCount = tasks.filter(t => t.status === "Done").length
  const overdueCount = tasks.filter(t => isOverdue(t)).length

  const kpis = [
    { label: "Total Tasks", value: tasks.length, icon: Kanban, color: "#4B49AC" },
    { label: "Todo", value: todoCount, icon: ListTodo, color: "#64748b" },
    { label: "In Progress", value: inProgressCount, icon: Clock, color: "#f59e0b" },
    { label: "Done", value: doneCount, icon: CheckCircle2, color: "#22c55e" },
    { label: "Overdue", value: overdueCount, icon: AlertTriangle, color: "#ef4444" },
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#4B49AC]/10 rounded-xl flex items-center justify-center">
            <Kanban className="h-5 w-5 text-[#4B49AC]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
            <p className="text-sm text-gray-500">Track, assign, and manage all operational tasks</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setEditingTask(null); setIsModalOpen(true) }} className="bg-[#4B49AC] hover:bg-[#3b3a88]">
          <Plus className="h-4 w-4 mr-2" /> New Task
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="border-gray-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: `${k.color}15` }}>
                <k.icon className="h-5 w-5" style={{ color: k.color }} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{k.label}</p>
                <p className="text-xl font-bold text-gray-900">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Project" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.code ? `${p.code}` : p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card className="border-[#4B49AC]/30 bg-[#4B49AC]/5">
          <CardContent className="p-3 flex items-center gap-3">
            <span className="text-sm font-medium text-[#4B49AC]">{selectedIds.size} task(s) selected</span>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map(s => (
                <Button key={s} variant="outline" size="sm" onClick={() => handleBulkStatusUpdate(s)} className="text-xs h-7">{s}</Button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-xs ml-auto">Clear</Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#4B49AC]" /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-12 text-gray-500">No tasks found.</TableCell></TableRow>
                ) : filtered.map(t => (
                  <TableRow key={t.id} className={`hover:bg-gray-50/50 ${isOverdue(t) ? "bg-red-50/30" : ""}`}>
                    <TableCell>
                      <input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => toggleSelect(t.id)} className="rounded border-gray-300" />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className={`font-medium ${isOverdue(t) ? "text-red-700" : "text-gray-900"}`}>
                          {isOverdue(t) && <AlertTriangle className="h-3.5 w-3.5 inline mr-1 text-red-500" />}
                          {t.title}
                        </p>
                        {t.labels && t.labels.length > 0 && (
                          <div className="flex gap-1 mt-1">{t.labels.map((l, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{l}</span>)}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button onClick={() => t.project_id && onNavigateToTab?.("projects")} className="text-sm text-[#4B49AC] hover:underline">
                        {getProjectName(t.project_id)}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{t.assignee || "—"}</TableCell>
                    <TableCell><Badge className={`text-xs ${priorityColor[t.priority] || ""}`}>{t.priority}</Badge></TableCell>
                    <TableCell><Badge className={`text-xs border ${statusColor[t.status] || ""}`}>{t.status}</Badge></TableCell>
                    <TableCell className={`text-sm ${isOverdue(t) ? "text-red-600 font-medium" : "text-gray-500"}`}>{t.due_date || "—"}</TableCell>
                    <TableCell className="text-sm text-gray-500">{t.estimated_hours ? `${t.estimated_hours}h` : "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(t)} className="h-8 w-8 p-0 text-gray-400 hover:text-[#4B49AC]"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(t)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Task Title *</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Complete lab testing batch #5" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Project</label>
              <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.code ? `${p.code}: ${p.name}` : p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Assignee</label>
              <Input value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })} placeholder="e.g. nakul.m@biovaco.in" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Priority</label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Due Date</label>
              <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Estimated Hours</label>
              <Input type="number" value={form.estimated_hours} onChange={e => setForm({ ...form, estimated_hours: e.target.value })} placeholder="0" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Labels (comma-separated)</label>
              <Input value={form.labels} onChange={e => setForm({ ...form, labels: e.target.value })} placeholder="e.g. R&D, Lab, Urgent" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Task details and requirements..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[#4B49AC] hover:bg-[#3b3a88]">{editingTask ? "Save Changes" : "Create Task"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
