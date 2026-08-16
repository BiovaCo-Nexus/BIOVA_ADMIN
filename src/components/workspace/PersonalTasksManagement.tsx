import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Edit2, 
  Layers,
  Filter,
  UserCheck
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PersonalWorkspaceService, PersonalTask, getCleanEmail } from "@/services/personalWorkspaceService"

interface PersonalTasksManagementProps {
  userEmail?: string
}

export function PersonalTasksManagement({ userEmail }: PersonalTasksManagementProps) {
  const activeEmail = getCleanEmail(userEmail)
  const [tasks, setTasks] = useState<PersonalTask[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<"all" | "pending" | "completed" | "high">("all")
  
  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium")
  const [category, setCategory] = useState("General")
  const [dueDate, setDueDate] = useState("")
  const [description, setDescription] = useState("")

  const { toast } = useToast()

  useEffect(() => {
    loadUserTasks()
  }, [activeEmail])

  const loadUserTasks = async () => {
    setLoading(true)
    const userTasks = await PersonalWorkspaceService.getTasks(activeEmail)
    setTasks(userTasks)
    setLoading(false)
  }

  const handleToggleTask = async (task: PersonalTask) => {
    const updatedStatus = !task.completed
    await PersonalWorkspaceService.updateTask(activeEmail, task.id, { completed: updatedStatus })
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: updatedStatus } : t))
    
    toast({
      title: updatedStatus ? "Task Completed! 🎉" : "Task Re-opened",
      description: `"${task.title}" updated in your personal workspace.`
    })
  }

  const handleOpenAddModal = () => {
    setEditingTaskId(null)
    setTitle("")
    setPriority("Medium")
    setCategory("General")
    setDueDate(new Date().toISOString().slice(0, 10))
    setDescription("")
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (task: PersonalTask) => {
    setEditingTaskId(task.id)
    setTitle(task.title)
    setPriority(task.priority)
    setCategory(task.category)
    setDueDate(task.dueDate)
    setDescription(task.description || "")
    setIsModalOpen(true)
  }

  const handleSaveTask = async () => {
    if (!title.trim()) {
      toast({ title: "Task Title Required", description: "Please enter a task title.", variant: "destructive" })
      return
    }

    if (editingTaskId) {
      await PersonalWorkspaceService.updateTask(activeEmail, editingTaskId, {
        title,
        priority,
        category,
        dueDate: dueDate || new Date().toISOString().slice(0, 10),
        description
      })
      setTasks(prev => prev.map(t => t.id === editingTaskId ? {
        ...t,
        title,
        priority,
        category,
        dueDate: dueDate || new Date().toISOString().slice(0, 10),
        description
      } : t))

      toast({
        title: "Task Updated",
        description: `Saved changes to "${title}".`
      })
    } else {
      const created = await PersonalWorkspaceService.saveTask(activeEmail, {
        title,
        priority,
        category,
        dueDate: dueDate || new Date().toISOString().slice(0, 10),
        completed: false,
        description
      })
      setTasks(prev => [created, ...prev])

      toast({
        title: "Task Added",
        description: `Added "${title}" to your personal task list.`
      })
    }

    setIsModalOpen(false)
  }

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    await PersonalWorkspaceService.deleteTask(activeEmail, taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
    toast({
      title: "Task Deleted",
      description: `Removed "${taskTitle}" from your workspace.`
    })
  }

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchQuery.toLowerCase())
    if (selectedFilter === "pending") return matchesSearch && !t.completed
    if (selectedFilter === "completed") return matchesSearch && t.completed
    if (selectedFilter === "high") return matchesSearch && t.priority === "High"
    return matchesSearch
  })

  const pendingCount = tasks.filter(t => !t.completed).length
  const highPriorityCount = tasks.filter(t => t.priority === "High" && !t.completed).length
  const completedCount = tasks.filter(t => t.completed).length

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CheckSquare className="h-8 w-8 text-[#4B49AC]" /> My Tasks & Action Items
          </h2>
          <p className="text-gray-500 mt-2 flex items-center gap-2">
            Personal to-do manager for <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs">{activeEmail}</span>
          </p>
        </div>

        <Button onClick={handleOpenAddModal} className="bg-[#4B49AC] hover:bg-[#3b3a88] text-white font-medium text-xs h-10 shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" /> Add Personal Task
        </Button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Action Items</p>
              <p className="text-2xl font-bold text-[#4B49AC] mt-1">{pendingCount} Tasks</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Requires your personal focus</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-[#4B49AC]">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">High Priority</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{highPriorityCount} Urgent</p>
              <p className="text-[11px] text-rose-600 mt-0.5 font-medium">Critical deliverables</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Completed Tasks</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{completedCount} Done</p>
              <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">Successfully achieved</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task List Container */}
      <Card className="border-gray-200">
        <CardHeader className="py-4 px-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search my tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs border-gray-200"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              {[
                { id: "all", label: "All Tasks" },
                { id: "pending", label: "Pending" },
                { id: "high", label: "Urgent" },
                { id: "completed", label: "Completed" }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id as any)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    selectedFilter === f.id
                      ? "bg-white text-[#4B49AC] shadow-xs font-bold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-2.5">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-xs">
              No personal tasks found. Click "Add Personal Task" to create one.
            </div>
          ) : (
            filteredTasks.map((t) => (
              <div
                key={t.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  t.completed 
                    ? "bg-gray-50/70 border-gray-200 opacity-75" 
                    : "bg-white border-gray-200 hover:border-indigo-200 shadow-2xs"
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0 pr-3">
                  <Checkbox 
                    checked={t.completed} 
                    onCheckedChange={() => handleToggleTask(t)} 
                    className="h-4 w-4 mt-0.5" 
                  />
                  <div className="min-w-0">
                    <p className={`text-xs font-bold text-gray-900 truncate ${t.completed ? "line-through text-gray-500" : ""}`}>
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                      <Badge variant="outline" className="text-[9px] bg-gray-50 font-medium px-1.5 py-0">
                        {t.category}
                      </Badge>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Calendar className="h-3 w-3 text-gray-400" /> Due: {t.dueDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    className={
                      t.priority === "High"
                        ? "bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-semibold"
                        : t.priority === "Medium"
                        ? "bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-semibold"
                        : "bg-blue-50 text-blue-800 border-blue-200 text-[10px] font-semibold"
                    }
                  >
                    {t.priority}
                  </Badge>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleOpenEditModal(t)} 
                    className="h-7 w-7 text-gray-400 hover:text-[#4B49AC] hover:bg-indigo-50"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDeleteTask(t.id, t.title)} 
                    className="h-7 w-7 text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Task Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[460px] p-0 rounded-2xl overflow-hidden border-gray-200">
          <DialogHeader className="p-4 bg-gray-50 border-b border-gray-100">
            <DialogTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-[#4B49AC]" />
              {editingTaskId ? "Edit Personal Task" : "New Personal Action Item"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Assigned specifically to {activeEmail}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 p-5 bg-white">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Task Title *</label>
              <Input 
                placeholder="e.g. Prepare monthly department deliverables" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="text-xs h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Priority</label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High Priority</SelectItem>
                    <SelectItem value="Medium">Medium Priority</SelectItem>
                    <SelectItem value="Low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Category</label>
                <Input 
                  placeholder="e.g. Operations, HR, R&D" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  className="text-xs h-9"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Target Due Date</label>
              <Input 
                type="date" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)} 
                className="text-xs h-9"
              />
            </div>
          </div>
          <DialogFooter className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleSaveTask} size="sm" className="bg-[#4B49AC] hover:bg-[#3b3a88] text-white text-xs">
              Save Action Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
