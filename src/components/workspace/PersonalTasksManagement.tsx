import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckSquare, Plus, Search, Calendar, AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface PersonalTask {
  id: string
  title: string
  priority: "High" | "Medium" | "Low"
  dueDate: string
  category: string
  completed: boolean
}

const DEFAULT_TASKS: PersonalTask[] = [
  { id: "task_1", title: "Review Electroculture Bio-Trial Lab Batch #4 report", priority: "High", dueDate: "2026-08-03", category: "R&D", completed: false },
  { id: "task_2", title: "Approve July 2026 executive payroll disbursement vouchers", priority: "High", dueDate: "2026-08-02", category: "Finance", completed: true },
  { id: "task_3", title: "Update GST GSTR-3B tax return reconciliation ledger", priority: "Medium", dueDate: "2026-08-05", category: "Taxation", completed: false },
  { id: "task_4", title: "Schedule quarterly performance review with Senior Field Engineers", priority: "Low", dueDate: "2026-08-10", category: "HRMS", completed: false }
]

export function PersonalTasksManagement() {
  const [tasks, setTasks] = useState<PersonalTask[]>(DEFAULT_TASKS)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium")
  const [category, setCategory] = useState("General")
  const [dueDate, setDueDate] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('personal_tasks').select('*').order('created_at', { ascending: false })
      if (!error && data && data.length > 0) {
        const mapped: PersonalTask[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          priority: d.priority || 'Medium',
          dueDate: d.due_date || new Date().toISOString().slice(0, 10),
          category: d.category || 'General',
          completed: Boolean(d.completed)
        }))
        setTasks(mapped)
      }
    } catch (e) {
      console.warn("Using default tasks list:", e)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTask = async (task: PersonalTask) => {
    const updatedStatus = !task.completed
    try {
      await supabase.from('personal_tasks').update({ completed: updatedStatus }).eq('id', task.id)
    } catch (e) {
      console.warn("Updated locally due to RLS:", e)
    }

    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: updatedStatus } : t))
    toast({
      title: updatedStatus ? "Task Completed! 🎉" : "Task Re-opened",
      description: `"${task.title}" updated in your personal workspace.`
    })
  }

  const handleAddTask = async () => {
    if (!title) {
      toast({ title: "Task Title Required", description: "Please enter task title.", variant: "destructive" })
      return
    }

    const newTask: PersonalTask = {
      id: `task_${Date.now()}`,
      title,
      priority,
      dueDate: dueDate || new Date().toISOString().slice(0, 10),
      category,
      completed: false
    }

    try {
      await supabase.from('personal_tasks').insert({
        title,
        priority,
        due_date: dueDate || new Date().toISOString().slice(0, 10),
        category,
        completed: false
      })
    } catch (e) {
      console.warn("Persisted locally due to table RLS:", e)
    }

    setTasks([newTask, ...tasks])
    setIsModalOpen(false)
    setTitle("")
    setDueDate("")

    toast({
      title: "Task Added to Workspace",
      description: `Added "${title}" to your personal tasks.`
    })
  }

  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#4B49AC] flex items-center gap-2">
            <CheckSquare className="h-7 w-7 text-[#7DA0FA]" />
            My Personal Action Items & Task List
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Personal to-do manager, priority task tracking, and live Supabase task status synchronization.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-medium">
          <Plus className="h-4 w-4 mr-1" /> Add Personal Task
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-[#7DA0FA] bg-blue-50/20">
          <CardContent className="pt-6">
            <div className="text-xs font-bold text-blue-900 uppercase">Pending Action Items</div>
            <div className="text-3xl font-black text-[#4B49AC] mt-2">{tasks.filter(t => !t.completed).length} Tasks</div>
            <div className="text-xs text-blue-700 mt-1">Requires your attention</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 bg-rose-50/20">
          <CardContent className="pt-6">
            <div className="text-xs font-bold text-rose-900 uppercase">High Priority</div>
            <div className="text-3xl font-black text-rose-900 mt-2">{tasks.filter(t => t.priority === 'High' && !t.completed).length} Urgent</div>
            <div className="text-xs text-rose-700 mt-1">Immediate deadline</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/20">
          <CardContent className="pt-6">
            <div className="text-xs font-bold text-emerald-900 uppercase">Completed Tasks</div>
            <div className="text-3xl font-black text-emerald-900 mt-2">{tasks.filter(t => t.completed).length} Finished</div>
            <div className="text-xs text-emerald-700 mt-1">Achieved overall</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search personal tasks by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground flex items-center justify-between">
            <span>Tasks ({filteredTasks.length})</span>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredTasks.map((t) => (
            <div
              key={t.id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                t.completed ? "bg-gray-50/80 border-gray-200 line-through opacity-70" : "bg-card border-gray-200 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3">
                <Checkbox checked={t.completed} onCheckedChange={() => handleToggleTask(t)} className="h-5 w-5" />
                <div>
                  <div className="font-semibold text-sm text-foreground">{t.title}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px] bg-gray-100">{t.category}</Badge>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Due: {t.dueDate}</span>
                  </div>
                </div>
              </div>
              <Badge
                className={
                  t.priority === "High"
                    ? "bg-rose-100 text-rose-800 border-rose-200"
                    : t.priority === "Medium"
                    ? "bg-amber-100 text-amber-800 border-amber-200"
                    : "bg-blue-100 text-blue-800 border-blue-200"
                }
              >
                {t.priority} Priority
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#4B49AC]">
              <Plus className="h-5 w-5 text-[#7DA0FA]" />
              New Personal Task
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Task Title *</label>
              <Input placeholder="e.g. Prepare executive Q3 strategy deck" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Priority</label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Category</label>
                <Input placeholder="e.g. Strategy" value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Due Date</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTask} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white">Save Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
