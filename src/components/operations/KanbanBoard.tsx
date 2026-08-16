import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Kanban, Plus, GripVertical, User, Calendar, ChevronRight, Loader2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface KanbanTask {
  id: string; title: string; assignee: string | null; priority: string
  status: string; due_date: string | null; project_id: string | null
  labels: string[]
}

interface ProjectRef { id: string; name: string; code: string | null }

const COLUMNS = [
  { key: "Todo", label: "To Do", color: "#64748b", bg: "#f1f5f9" },
  { key: "In Progress", label: "In Progress", color: "#f59e0b", bg: "#fffbeb" },
  { key: "Review", label: "Review", color: "#8b5cf6", bg: "#f5f3ff" },
  { key: "Done", label: "Done", color: "#22c55e", bg: "#f0fdf4" },
]

const priorityDot: Record<string, string> = {
  "Low": "bg-slate-400", "Medium": "bg-blue-500",
  "High": "bg-orange-500", "Critical": "bg-red-500",
}

export function KanbanBoard() {
  const [tasks, setTasks] = useState<KanbanTask[]>([])
  const [projects, setProjects] = useState<ProjectRef[]>([])
  const [loading, setLoading] = useState(true)
  const [filterProject, setFilterProject] = useState("all")
  const [movingTask, setMovingTask] = useState<KanbanTask | null>(null)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddColumn, setQuickAddColumn] = useState("Todo")
  const [quickTitle, setQuickTitle] = useState("")
  const [quickAssignee, setQuickAssignee] = useState("")
  const [quickPriority, setQuickPriority] = useState("Medium")
  const [quickProject, setQuickProject] = useState("")
  const { toast } = useToast()

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from("ops_tasks" as any).select("id, title, assignee, priority, status, due_date, project_id, labels").order("created_at", { ascending: false })
      if (data) setTasks(data as any[])
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
    const channel = supabase.channel("ops-kanban-realtime")
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "ops_tasks" }, () => fetchTasks())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const filteredTasks = useMemo(() => {
    if (filterProject === "all") return tasks
    return tasks.filter(t => t.project_id === filterProject)
  }, [tasks, filterProject])

  const columnTasks = useMemo(() => {
    const map: Record<string, KanbanTask[]> = {}
    COLUMNS.forEach(c => { map[c.key] = [] })
    filteredTasks.forEach(t => {
      if (map[t.status]) map[t.status].push(t)
      else if (map["Todo"]) map["Todo"].push(t) // fallback
    })
    return map
  }, [filteredTasks])

  const moveTask = async (task: KanbanTask, newStatus: string) => {
    await supabase.from("ops_tasks" as any).update({ status: newStatus, updated_at: new Date().toISOString() } as any).eq("id", task.id)
    toast({ title: "Moved", description: `"${task.title}" → ${newStatus}` })
    setMovingTask(null)
    fetchTasks()
  }

  const handleQuickAdd = async () => {
    if (!quickTitle) { toast({ title: "Error", description: "Title is required.", variant: "destructive" }); return }
    const { error } = await supabase.from("ops_tasks" as any).insert({
      title: quickTitle, status: quickAddColumn, assignee: quickAssignee || null,
      priority: quickPriority, project_id: quickProject || null, created_by: "portal"
    } as any)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Created", description: `Task added to ${quickAddColumn}.` })
    setQuickTitle(""); setQuickAssignee(""); setQuickPriority("Medium"); setQuickProject("")
    setIsQuickAddOpen(false)
    fetchTasks()
  }

  const getProjectCode = (pid: string | null) => {
    if (!pid) return null
    const p = projects.find(pr => pr.id === pid)
    return p?.code || null
  }

  const isOverdue = (t: KanbanTask) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "Done"

  const getInitials = (name: string | null) => {
    if (!name) return "?"
    return name.split("@")[0].split(".").map(p => p[0]?.toUpperCase() || "").join("").slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#4B49AC]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#4B49AC]/10 rounded-xl flex items-center justify-center">
            <Kanban className="h-5 w-5 text-[#4B49AC]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Kanban Board</h2>
            <p className="text-sm text-gray-500">Visual task management — drag tasks across workflow stages</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by project" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.code || p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Column Summary */}
      <div className="grid grid-cols-4 gap-2">
        {COLUMNS.map(col => (
          <div key={col.key} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: col.bg }}>
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
            <span className="text-sm font-medium" style={{ color: col.color }}>{col.label}</span>
            <Badge variant="outline" className="ml-auto text-xs">{columnTasks[col.key]?.length || 0}</Badge>
          </div>
        ))}
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-h-[500px]">
        {COLUMNS.map(col => (
          <div key={col.key} className="flex flex-col">
            {/* Column Header */}
            <div className="flex items-center justify-between px-3 py-2 rounded-t-lg border border-b-0" style={{ background: col.bg, borderColor: `${col.color}30` }}>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ background: col.color }} />
                <span className="font-semibold text-sm" style={{ color: col.color }}>{col.label}</span>
              </div>
              <Button
                variant="ghost" size="sm"
                onClick={() => { setQuickAddColumn(col.key); setIsQuickAddOpen(true) }}
                className="h-6 w-6 p-0 text-gray-400 hover:text-[#4B49AC]"
              ><Plus className="h-3.5 w-3.5" /></Button>
            </div>

            {/* Cards Container */}
            <div className="flex-1 border rounded-b-lg p-2 space-y-2 bg-gray-50/50 min-h-[400px]" style={{ borderColor: `${col.color}20` }}>
              {(columnTasks[col.key] || []).map(task => (
                <Card
                  key={task.id}
                  className={`border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group ${isOverdue(task) ? "border-red-200 bg-red-50/50" : "bg-white"}`}
                >
                  <CardContent className="p-3 space-y-2">
                    {/* Project Badge */}
                    {getProjectCode(task.project_id) && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#4B49AC]/10 text-[#4B49AC] rounded font-medium">
                        {getProjectCode(task.project_id)}
                      </span>
                    )}
                    {/* Title */}
                    <p className={`text-sm font-medium leading-snug ${isOverdue(task) ? "text-red-700" : "text-gray-800"}`}>
                      {isOverdue(task) && <AlertTriangle className="h-3 w-3 inline mr-1 text-red-500" />}
                      {task.title}
                    </p>
                    {/* Labels */}
                    {task.labels && task.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.labels.slice(0, 2).map((l, i) => (
                          <span key={i} className="text-[9px] px-1 py-0.5 bg-gray-100 text-gray-500 rounded">{l}</span>
                        ))}
                      </div>
                    )}
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${priorityDot[task.priority] || "bg-gray-400"}`} title={task.priority} />
                        {task.due_date && (
                          <span className={`text-[10px] flex items-center gap-0.5 ${isOverdue(task) ? "text-red-500 font-medium" : "text-gray-400"}`}>
                            <Calendar className="h-2.5 w-2.5" />
                            {task.due_date}
                          </span>
                        )}
                      </div>
                      {task.assignee && (
                        <div className="h-6 w-6 rounded-full bg-[#4B49AC]/10 flex items-center justify-center" title={task.assignee}>
                          <span className="text-[9px] font-bold text-[#4B49AC]">{getInitials(task.assignee)}</span>
                        </div>
                      )}
                    </div>
                    {/* Move Actions (on hover) */}
                    <div className="hidden group-hover:flex gap-1 pt-1 border-t border-gray-100">
                      {COLUMNS.filter(c => c.key !== col.key).map(targetCol => (
                        <button
                          key={targetCol.key}
                          onClick={() => moveTask(task, targetCol.key)}
                          className="flex-1 text-[9px] py-1 rounded text-center transition-colors hover:opacity-80"
                          style={{ background: `${targetCol.color}15`, color: targetCol.color }}
                        >
                          {targetCol.label}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(columnTasks[col.key] || []).length === 0 && (
                <div className="flex items-center justify-center h-24 text-xs text-gray-400">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Add Dialog */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Add Task — {quickAddColumn}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Input value={quickTitle} onChange={e => setQuickTitle(e.target.value)} placeholder="Task title *" />
            <Input value={quickAssignee} onChange={e => setQuickAssignee(e.target.value)} placeholder="Assignee email" />
            <Select value={quickPriority} onValueChange={setQuickPriority}>
              <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                {["Low", "Medium", "High", "Critical"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={quickProject} onValueChange={setQuickProject}>
              <SelectTrigger><SelectValue placeholder="Link to project (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Project</SelectItem>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.code || p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickAddOpen(false)}>Cancel</Button>
            <Button onClick={handleQuickAdd} className="bg-[#4B49AC] hover:bg-[#3b3a88]">Add Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
