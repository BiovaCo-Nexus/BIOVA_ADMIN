import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FolderOpen, Plus, Loader2, Pencil, Trash2, Calendar, IndianRupee, TrendingUp, Clock, Search, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface OpsProject {
  id: string
  name: string
  code: string | null
  description: string | null
  department: string
  owner: string
  priority: string
  status: string
  start_date: string | null
  end_date: string | null
  budget: number
  spent: number
  progress: number
  tags: string[]
  created_by: string
  created_at: string
}

const STATUS_OPTIONS = ["Planning", "In Progress", "Review", "Completed", "On Hold"]
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"]
const DEPARTMENT_OPTIONS = ["R&D", "IT", "Marketing", "Operations", "Finance", "HR", "Sales", "Executive Board", "General"]

const statusColor: Record<string, string> = {
  "Planning": "bg-blue-100 text-blue-700 border-blue-200",
  "In Progress": "bg-amber-100 text-amber-700 border-amber-200",
  "Review": "bg-purple-100 text-purple-700 border-purple-200",
  "Completed": "bg-green-100 text-green-700 border-green-200",
  "On Hold": "bg-gray-100 text-gray-600 border-gray-200",
}

const priorityColor: Record<string, string> = {
  "Low": "bg-slate-100 text-slate-600",
  "Medium": "bg-blue-100 text-blue-600",
  "High": "bg-orange-100 text-orange-700",
  "Critical": "bg-red-100 text-red-700",
}

interface ProjectsManagementProps {
  onNavigateToTab?: (tabId: string, payload?: string) => void
}

export function ProjectsManagement({ onNavigateToTab }: ProjectsManagementProps) {
  const [projects, setProjects] = useState<OpsProject[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<OpsProject | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({})
  const [meetingCounts, setMeetingCounts] = useState<Record<string, number>>({})
  const { toast } = useToast()

  const [form, setForm] = useState({
    name: "", code: "", description: "", department: "General", owner: "",
    priority: "Medium", status: "Planning", start_date: "", end_date: "",
    budget: "", spent: "0", progress: "0"
  })

  const resetForm = () => setForm({
    name: "", code: "", description: "", department: "General", owner: "",
    priority: "Medium", status: "Planning", start_date: "", end_date: "",
    budget: "", spent: "0", progress: "0"
  })

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("ops_projects" as any).select("*").order("created_at", { ascending: false })
      if (!error && data) setProjects(data as any[])
    } catch (e) { console.error("Error fetching projects:", e) }
    finally { setLoading(false) }
  }

  const fetchLinkedCounts = async () => {
    try {
      const { data: tasks } = await supabase.from("ops_tasks" as any).select("project_id")
      const { data: meetings } = await supabase.from("ops_meetings" as any).select("project_id")
      const tc: Record<string, number> = {}
      const mc: Record<string, number> = {}
      ;(tasks as any[] || []).forEach((t: any) => { if (t.project_id) tc[t.project_id] = (tc[t.project_id] || 0) + 1 })
      ;(meetings as any[] || []).forEach((m: any) => { if (m.project_id) mc[m.project_id] = (mc[m.project_id] || 0) + 1 })
      setTaskCounts(tc)
      setMeetingCounts(mc)
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    fetchProjects()
    fetchLinkedCounts()
    const channel = supabase.channel("ops-projects-realtime")
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "ops_projects" }, () => { fetchProjects(); fetchLinkedCounts() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleSave = async () => {
    if (!form.name) {
      toast({ title: "Validation Error", description: "Project name is required.", variant: "destructive" })
      return
    }
    const payload = {
      name: form.name,
      code: form.code || null,
      description: form.description || null,
      department: form.department,
      owner: form.owner || "Project Manager",
      priority: form.priority,
      status: form.status,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      budget: Number(form.budget) || 0,
      spent: Number(form.spent) || 0,
      progress: Number(form.progress) || 0,
      updated_at: new Date().toISOString(),
    }

    if (editingProject) {
      const { error } = await supabase.from("ops_projects" as any).update(payload as any).eq("id", editingProject.id)
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
      toast({ title: "Updated", description: `Project "${form.name}" updated successfully.` })
    } else {
      const { error } = await supabase.from("ops_projects" as any).insert({ ...payload, created_by: "portal" } as any)
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
      toast({ title: "Created", description: `Project "${form.name}" created successfully.` })
      await supabase.from("ops_activity_log" as any).insert({ actor: "portal", action: "Created Project", entity_type: "project", entity_name: form.name } as any)
    }
    setIsModalOpen(false)
    resetForm()
    setEditingProject(null)
    fetchProjects()
  }

  const handleEdit = (p: OpsProject) => {
    setEditingProject(p)
    setForm({
      name: p.name, code: p.code || "", description: p.description || "",
      department: p.department, owner: p.owner, priority: p.priority, status: p.status,
      start_date: p.start_date || "", end_date: p.end_date || "",
      budget: String(p.budget), spent: String(p.spent), progress: String(p.progress)
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (p: OpsProject) => {
    const { error } = await supabase.from("ops_projects" as any).delete().eq("id", p.id)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Deleted", description: `Project "${p.name}" deleted.` })
    await supabase.from("ops_activity_log" as any).insert({ actor: "portal", action: "Deleted Project", entity_type: "project", entity_name: p.name } as any)
    fetchProjects()
  }

  const filtered = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.department.toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus = filterStatus === "all" || p.status === filterStatus
      const matchPriority = filterPriority === "all" || p.priority === filterPriority
      return matchSearch && matchStatus && matchPriority
    })
  }, [projects, searchQuery, filterStatus, filterPriority])

  // KPI data
  const totalBudget = projects.reduce((a, p) => a + p.budget, 0)
  const totalSpent = projects.reduce((a, p) => a + p.spent, 0)
  const activeCount = projects.filter(p => p.status === "In Progress").length
  const completedCount = projects.filter(p => p.status === "Completed").length

  const kpis = [
    { label: "Total Projects", value: projects.length, icon: FolderOpen, color: "#4B49AC" },
    { label: "Active", value: activeCount, icon: TrendingUp, color: "#f59e0b" },
    { label: "Completed", value: completedCount, icon: Clock, color: "#22c55e" },
    { label: "Budget Allocated", value: `₹${(totalBudget / 100000).toFixed(1)}L`, icon: IndianRupee, color: "#7DA0FA" },
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#4B49AC]/10 rounded-xl flex items-center justify-center">
            <FolderOpen className="h-5 w-5 text-[#4B49AC]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
            <p className="text-sm text-gray-500">Manage all company projects, budgets, and timelines</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setEditingProject(null); setIsModalOpen(true) }} className="bg-[#4B49AC] hover:bg-[#3b3a88]">
          <Plus className="h-4 w-4 mr-2" /> New Project
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* Budget Progress */}
      {totalBudget > 0 && (
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Total Budget Utilization</span>
              <span className="text-sm font-semibold text-gray-800">₹{(totalSpent / 100000).toFixed(1)}L / ₹{(totalBudget / 100000).toFixed(1)}L ({totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}%)</span>
            </div>
            <Progress value={totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search projects..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-2 text-gray-400" /><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Linked</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#4B49AC]" /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-12 text-gray-500">No projects found.</TableCell></TableRow>
                ) : filtered.map(p => (
                  <TableRow key={p.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div>
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        {p.code && <p className="text-xs text-gray-400">{p.code}</p>}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{p.department}</Badge></TableCell>
                    <TableCell className="text-sm text-gray-600">{p.owner}</TableCell>
                    <TableCell><Badge className={`text-xs ${priorityColor[p.priority] || ""}`}>{p.priority}</Badge></TableCell>
                    <TableCell><Badge className={`text-xs border ${statusColor[p.status] || ""}`}>{p.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <Progress value={p.progress} className="h-1.5 flex-1" />
                        <span className="text-xs text-gray-500 font-medium">{p.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <span className="text-gray-600">₹{(p.spent / 100000).toFixed(1)}L</span>
                        <span className="text-gray-400"> / ₹{(p.budget / 100000).toFixed(1)}L</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 text-xs">
                        <button
                          onClick={() => onNavigateToTab?.("tasks", p.id)}
                          className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        >
                          {taskCounts[p.id] || 0} tasks
                        </button>
                        <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">
                          {meetingCounts[p.id] || 0} mtgs
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-500">
                        {p.start_date && <div>{p.start_date}</div>}
                        {p.end_date && <div className="text-gray-400">→ {p.end_date}</div>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} className="h-8 w-8 p-0 text-gray-400 hover:text-[#4B49AC]"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Project Name *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bio-Kit v5 Development" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Project Code</label>
              <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. PRJ-005" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Department</label>
              <Select value={form.department} onValueChange={v => setForm({ ...form, department: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DEPARTMENT_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Owner</label>
              <Input value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} placeholder="e.g. Dr. Nakul Mundhada" />
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
              <label className="text-sm font-medium text-gray-700 mb-1 block">Progress (%)</label>
              <Input type="number" min="0" max="100" value={form.progress} onChange={e => setForm({ ...form, progress: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Start Date</label>
              <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">End Date</label>
              <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Budget (₹)</label>
              <Input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Spent (₹)</label>
              <Input type="number" value={form.spent} onChange={e => setForm({ ...form, spent: e.target.value })} placeholder="0" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Brief description of the project scope and objectives..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[#4B49AC] hover:bg-[#3b3a88]">{editingProject ? "Save Changes" : "Create Project"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
