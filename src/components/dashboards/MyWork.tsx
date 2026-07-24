import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, Briefcase, AlertCircle, ArrowRight } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export function MyWork({ onNavigateToTab }: { onNavigateToTab?: (tabId: string) => void }) {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchUserAndTasks = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        setUser(currentUser)
        // Fetch tasks assigned to this user from timetable
        const { data, error } = await supabase
          .from('ceo_md_timetable')
          .select('*')
          .ilike('assigned_email', `%${currentUser.email}%`)
          .order('event_date', { ascending: true })

        if (!error && data) {
          setTasks(data)
        }
      }
      setLoading(false)
    }
    fetchUserAndTasks()
  }, [])

  const markComplete = async (taskId: string) => {
    const { error } = await supabase
      .from('ceo_md_timetable')
      .update({ status: 'completed' })
      .eq('id', taskId)

    if (!error) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t))
      toast({ title: "Task Completed", description: "Great job checking that off!" })
    }
  }

  const pendingTasks = tasks.filter(t => t.status !== 'completed')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">My Work</h2>
          <p className="text-gray-500 mt-1">Manage your assigned tasks and daily deliverables.</p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="px-4 py-1.5 border-[#4B49AC]/20 bg-[#4B49AC]/5 text-[#4B49AC] font-medium rounded-lg">
            {pendingTasks.length} Pending
          </Badge>
          <Badge variant="outline" className="px-4 py-1.5 border-emerald-500/20 bg-emerald-50 text-emerald-600 font-medium rounded-lg">
            {completedTasks.length} Completed
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Tasks */}
        <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-400 p-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Clock className="h-5 w-5" /> Pending Actions
            </h3>
          </div>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading tasks...</div>
            ) : pendingTasks.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-3" />
                <p className="text-gray-600 font-medium">You're all caught up!</p>
                <p className="text-sm text-gray-400">No pending tasks assigned to you right now.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingTasks.map(task => (
                  <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div>
                      <h4 className="font-semibold text-gray-800 text-base">{task.activity_name}</h4>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-amber-600 font-medium flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md">
                          <AlertCircle className="h-3 w-3" /> Due: {task.event_date ? format(new Date(task.event_date), 'MMM dd, yyyy') : task.day_of_week}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Briefcase className="h-3 w-3" /> {task.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 sm:mt-0">
                      <Button 
                        variant="outline"
                        onClick={() => onNavigateToTab?.('executive_calendar')}
                        className="text-gray-600 bg-white shadow-sm rounded-lg whitespace-nowrap h-9 px-3 text-xs font-semibold"
                      >
                        <Briefcase className="h-4 w-4 mr-1.5" /> View Schedule
                      </Button>
                      <Button 
                        onClick={() => markComplete(task.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-lg whitespace-nowrap h-9 px-4 text-xs font-semibold"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark Done
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Completed Actions
            </h3>
          </div>
          <CardContent className="p-0 bg-gray-50/30">
            {completedTasks.length === 0 && !loading ? (
              <div className="p-12 text-center text-gray-400">
                No completed tasks yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {completedTasks.map(task => (
                  <div key={task.id} className="p-4 opacity-70">
                    <h4 className="font-medium text-gray-700 line-through decoration-gray-300">{task.activity_name}</h4>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Completed on {task.event_date ? format(new Date(task.event_date), 'MMM dd, yyyy') : task.day_of_week}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
