import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  FileText, 
  Mail, 
  AlertCircle, 
  Settings, 
  Briefcase, 
  Wrench, 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  User, 
  Calendar,
  Loader2,
  BellRing
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { AdminActivityLogs } from "@/components/AdminActivityLogs"
import { registerServiceWorkerAndSubscribe, isPushSubscribed, triggerPushNotification } from "@/utils/pushNotifications"

interface DashboardAnalyticsProps {
  user: any
  onNavigateToTab?: (tab: string, payload?: string) => void
}

export function DashboardAnalytics({ user, onNavigateToTab }: DashboardAnalyticsProps) {
  const { toast } = useToast()
  const [applicationsCount, setApplicationsCount] = useState(0)
  const [newApplicationsCount, setNewApplicationsCount] = useState(0)
  const [newslettersCount, setNewslettersCount] = useState(0)
  const [confirmedNewslettersCount, setConfirmedNewslettersCount] = useState(0)

  // Push Subscription State
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [checkingPush, setCheckingPush] = useState(true)

  // Pending Tasks states
  const [pendingTasks, setPendingTasks] = useState<any[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)

  const fetchDashboardStats = async () => {
    try {
      // Fetch applications counts using exact head
      const { count: totalApps } = await supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })

      const { count: newApps } = await supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "submitted")

      // Fetch newsletters counts
      const { count: totalNews } = await supabase
        .from("newsletter_subscriptions")
        .select("*", { count: "exact", head: true })

      const { count: confirmedNews } = await supabase
        .from("newsletter_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("confirmed", true)

      setApplicationsCount(totalApps || 0)
      setNewApplicationsCount(newApps || 0)
      setNewslettersCount(totalNews || 0)
      setConfirmedNewslettersCount(confirmedNews || 0)
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    }
  }

  const fetchPendingTasks = async () => {
    try {
      setIsLoadingTasks(true)
      const { data, error } = await supabase
        .from("knowledge_items")
        .select("*")
        .neq("status", "validated")
        .neq("status", "rejected")

      if (error) throw error

      // Sort: critical first, then high, then medium, then low
      const sorted = (data || []).sort((a: any, b: any) => {
        const pOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
        return (pOrder[a.priority] ?? 9) - (pOrder[b.priority] ?? 9)
      })

      setPendingTasks(sorted)
    } catch (err: any) {
      console.error("Error fetching pending tasks:", err)
    } finally {
      setIsLoadingTasks(false)
    }
  }

  useEffect(() => {
    fetchDashboardStats()
    fetchPendingTasks()

    // Check push notifications registration
    isPushSubscribed().then(sub => {
      setIsSubscribed(sub)
      setCheckingPush(false)
    })
  }, [])

  const handleSubscribe = async () => {
    if (!user?.email) return
    const success = await registerServiceWorkerAndSubscribe(user.email)
    if (success) {
      setIsSubscribed(true)
      toast({
        title: "Notifications Enabled 🔔",
        description: "You will now receive Chrome push alerts on your desktop & mobile device!"
      })
    } else {
      toast({
        title: "Setup Failed",
        description: "Failed to enable notifications. Please verify browser permissions.",
        variant: "destructive"
      })
    }
  }

  const handleValidateTask = async (id: string, title: string, assignedToField: string, createdByField: string) => {
    try {
      const { error } = await supabase
        .from("knowledge_items")
        .update({ status: "validated" })
        .eq("id", id)

      if (error) throw error

      toast({
        title: "Task Completed",
        description: `"${title}" has been successfully completed and validated.`
      })

      // Send push notification to executives & assigned users
      const alertRecipients = new Set<string>([
        "ceo@biovaco.in",
        "md@biovaco.in"
      ])
      if (createdByField) alertRecipients.add(createdByField)
      if (assignedToField) {
        assignedToField.split(',').forEach(email => alertRecipients.add(email.trim()))
      }

      const senderName = user?.email?.split("@")[0] || "A user"
      triggerPushNotification(
        "✅ Task Completed",
        `"${title}" has been validated and completed by ${senderName}.`,
        Array.from(alertRecipients)
      )

      // Refresh list
      fetchPendingTasks()
    } catch (err: any) {
      toast({
        title: "Failed to update task",
        description: err.message,
        variant: "destructive"
      })
    }
  }

  const sendTestPush = async () => {
    if (!user?.email) return
    toast({
      title: "Sending test notification...",
      description: "Please check your desktop/mobile alerts."
    })
    await triggerPushNotification(
      "Test Notification 🔔",
      "Hello! This is a test push notification from BiovaCo Nexus.",
      [user.email]
    )
  }

  // Count overdue or critical tasks
  const criticalCount = pendingTasks.filter(t => t.priority === "critical").length
  const overdueCount = pendingTasks.filter(t => {
    if (!t.due_date) return false
    return new Date(t.due_date) < new Date()
  }).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-[#032E63]">Dashboard Overview</h1>
        <div className="flex items-center gap-3 mt-1 sm:mt-0">
          <p className="text-sm text-gray-600">Welcome back, {user?.email?.split("@")[0]}</p>
          {isSubscribed ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Push Alerts Active
              </Badge>
              <Button 
                onClick={sendTestPush} 
                size="sm" 
                variant="outline" 
                className="h-6 text-[10px] px-2 py-0 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Send Test 🔔
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Push Notification Promo Banner */}
      {!checkingPush && !isSubscribed && (
        <div className="bg-blue-50 border-l-4 border-l-blue-600 p-4 rounded-r-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <BellRing className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-blue-950 text-xs sm:text-sm">Get Chrome Push Alerts on Desktop & Mobile</h4>
              <p className="text-[11px] sm:text-xs text-blue-800">
                Receive instant notifications about assigned tasks, updates, and documents even when you close the browser tab.
              </p>
            </div>
          </div>
          <Button 
            onClick={handleSubscribe} 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shrink-0 self-start sm:self-auto"
          >
            Enable Alerts 🔔
          </Button>
        </div>
      )}

      {/* Urgent Alerts Banner */}
      {(criticalCount > 0 || overdueCount > 0) && (
        <div className="bg-red-50 border-l-4 border-l-red-600 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-red-950 text-sm">Critical Attention Required!</h4>
            <p className="text-xs text-red-800">
              You have {criticalCount > 0 ? <span><strong>{criticalCount} critical task(s)</strong></span> : ""} 
              {criticalCount > 0 && overdueCount > 0 ? " and " : ""}
              {overdueCount > 0 ? <span><strong>{overdueCount} overdue task(s)</strong></span> : ""} remaining pending. Please resolve them immediately.
            </p>
          </div>
        </div>
      )}

      {/* Pending Tasks Section (FIRST) */}
      <Card className="border-l-4 border-l-orange-500 shadow-md">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-[#032E63] text-lg font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-orange-500" />
              Urgent Checklist & Pending Work
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 mt-0.5">
              Tasks assigned to you or waiting for validation. Mark them completed directly.
            </CardDescription>
          </div>
          {onNavigateToTab && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onNavigateToTab("knowledge")} 
              className="text-xs border-orange-200 hover:bg-orange-50 text-[#032E63]"
            >
              Manage All Tasks
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-2">
          {isLoadingTasks ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : pendingTasks.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              🎉 No pending tasks! All clear.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {pendingTasks.map(task => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date()
                const priorityColors: Record<string, string> = {
                  critical: "bg-red-100 text-red-800 border-red-300",
                  high: "bg-orange-100 text-orange-800 border-orange-300",
                  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
                  low: "bg-gray-100 text-gray-700 border-gray-300"
                }

                return (
                  <div 
                    key={task.id} 
                    className={`flex items-start justify-between gap-3 p-3 rounded-lg border bg-white transition-all hover:border-slate-300 ${
                      isOverdue ? "border-l-4 border-l-red-500" : task.priority === "critical" ? "border-l-4 border-l-red-500" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleValidateTask(task.id, task.title, task.assigned_to, task.created_by)}
                        className="h-5 w-5 rounded-full shrink-0 p-0 text-slate-400 hover:text-green-600 transition-colors"
                        title="Mark Validated (Completed)"
                      >
                        <Circle className="h-4.5 w-4.5" />
                      </Button>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-xs text-slate-900 leading-tight">
                            {task.title}
                          </span>
                          {isOverdue && (
                            <Badge className="bg-red-600 text-white text-[9px] px-1 py-0 border-0 leading-none">
                              OVERDUE
                            </Badge>
                          )}
                          <Badge variant="outline" className={`${priorityColors[task.priority] || 'bg-gray-100'} text-[9px] px-1.5 py-0 leading-none`}>
                            {task.priority.toUpperCase()}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2.5 flex-wrap text-[10px] text-slate-400">
                          {task.due_date && (
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar className="h-3 w-3" /> Due: {task.due_date}
                            </span>
                          )}
                          {task.assigned_to && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" /> 
                              Assigned: {task.assigned_to.split(',')[0].split('@')[0]} 
                              {task.assigned_to.split(',').length > 1 ? ` +${task.assigned_to.split(',').length - 1}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-[#032E63] text-white shadow-md border-t-4 border-t-[#08A04B]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-[#08A04B]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applicationsCount}</div>
            <p className="text-xs opacity-80">{newApplicationsCount} new submissions</p>
          </CardContent>
        </Card>

        <Card className="bg-white text-[#032E63] shadow-md border-t-4 border-t-[#08A04B]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Newsletter Subscribers</CardTitle>
            <Mail className="h-4 w-4 text-[#08A04B]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newslettersCount}</div>
            <p className="text-xs opacity-80 font-medium">{confirmedNewslettersCount} confirmed subscribers</p>
          </CardContent>
        </Card>

        <Card className="bg-[#f8fafc] text-[#032E63] shadow-md border-t-4 border-t-[#032E63]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">System Status</CardTitle>
            <AlertCircle className="h-4 w-4 text-[#032E63]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs opacity-80 font-medium">All systems running smoothly</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-l-4 border-l-[#032E63] shadow-md">
        <CardHeader>
          <CardTitle className="text-[#032E63]">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2 bg-transparent"
              onClick={() => onNavigateToTab?.("applications")}
            >
              <FileText className="h-6 w-6" />
              <span className="text-xs">Applications</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2 bg-transparent"
              onClick={() => onNavigateToTab?.("content")}
            >
              <Settings className="h-6 w-6" />
              <span className="text-xs">Content</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2 bg-transparent"
              onClick={() => onNavigateToTab?.("jobs")}
            >
              <Briefcase className="h-6 w-6" />
              <span className="text-xs">Jobs</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2 bg-transparent"
              onClick={() => onNavigateToTab?.("maintenance")}
            >
              <Wrench className="h-6 w-6" />
              <span className="text-xs">Maintenance</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Activity Logs */}
      <div className="mt-8">
        <AdminActivityLogs onNavigateToTab={onNavigateToTab} />
      </div>
    </div>
  )
}
