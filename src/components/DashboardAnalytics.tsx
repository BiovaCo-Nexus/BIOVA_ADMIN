import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Mail, AlertCircle, Settings, Briefcase, Wrench } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { AdminActivityLogs } from "@/components/AdminActivityLogs"

interface DashboardAnalyticsProps {
  user: any
  setActiveTab: (tab: string) => void
}

export function DashboardAnalytics({ user, setActiveTab }: DashboardAnalyticsProps) {
  const [applicationsCount, setApplicationsCount] = useState(0)
  const [newApplicationsCount, setNewApplicationsCount] = useState(0)
  const [newslettersCount, setNewslettersCount] = useState(0)
  const [confirmedNewslettersCount, setConfirmedNewslettersCount] = useState(0)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-[#032E63]">Dashboard Overview</h1>
        <p className="text-sm text-gray-600 mt-1 sm:mt-0">Welcome back, {user?.email?.split("@")[0]}</p>
      </div>

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
              onClick={() => setActiveTab("applications")}
            >
              <FileText className="h-6 w-6" />
              <span className="text-xs">Applications</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2 bg-transparent"
              onClick={() => setActiveTab("content")}
            >
              <Settings className="h-6 w-6" />
              <span className="text-xs">Content</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2 bg-transparent"
              onClick={() => setActiveTab("jobs")}
            >
              <Briefcase className="h-6 w-6" />
              <span className="text-xs">Jobs</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2 bg-transparent"
              onClick={() => setActiveTab("maintenance")}
            >
              <Wrench className="h-6 w-6" />
              <span className="text-xs">Maintenance</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Activity Logs */}
      <div className="mt-8">
        <AdminActivityLogs />
      </div>
    </div>
  )
}
