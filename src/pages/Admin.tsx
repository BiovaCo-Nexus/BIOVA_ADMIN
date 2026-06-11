"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BiovaCoLogo } from "@/components/BiovaCoLogo"
import {
  Mail,
  FileText,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  Download,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  BarChart3,
  Users,
  Settings,
  MapPin,
  Video,
  Briefcase,
  Calendar,
  Wrench,
  Box,
  Share2,
  Activity,
  IndianRupee,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { ContactRemarkModal } from "@/components/ContactRemarkModal"
import { VideoManagement } from "@/components/VideoManagement"
import { CountdownManagement } from "@/components/CountdownManagement"
import { JobPositionsManagement } from "@/components/JobPositionsManagement"
import InternManagement from "@/components/InternManagement"
import PageContentManagement from "@/components/PageContentManagement"
import PostCountdownManagement from "@/components/PostCountdownManagement"
import { LocationManagement } from "@/components/LocationManagement"
import { MaintenanceManagement } from "@/components/MaintenanceManagement"
import { ApplicationDetailModal } from "@/components/ApplicationDetailModal"
import { Model3DManagement } from "@/components/Model3DManagement"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SocialLinksManagement from "@/components/SocialLinksManagement"
import { NewsletterManagement } from "@/components/NewsletterManagement"
import { MarketingPostsManagement } from "@/components/MarketingPostsManagement"
import { DashboardAnalytics } from "@/components/DashboardAnalytics"
import { ApplicationsManagement } from "@/components/ApplicationsManagement"
import { AdminActivityLogs } from "@/components/AdminActivityLogs"
import { FinanceManagement } from "@/components/FinanceManagement"

interface NewsletterSubscription {
  id: string
  email: string
  confirmed: boolean
  subscribed_at: string
}

interface ApplicationStatus {
  application_id: string
  status: string
  changed_at: string
  notes: string
}

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [targetApplicationId, setTargetApplicationId] = useState<string | undefined>()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const navigate = useNavigate()
  const { toast } = useToast()



  const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || ""
  const SENDER_EMAIL = "no-reply@biovaco.in"
  const SENDER_NAME = "BiovaCo Nexus"
  useEffect(() => {
    // Check authentication first
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        navigate("/auth")
        return
      }
      setUser(session.user)
    }

    checkAuth()
  }, [navigate])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "Signed out successfully",
        description: "You have been logged out.",
      })
      navigate("/auth")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleNavigateToTab = (tab: string, payload?: string) => {
    if (tab === "applications" && payload) {
      setTargetApplicationId(payload)
    }
    setActiveTab(tab)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white shadow-sm border-b-4 border-[#08A04B] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BiovaCoLogo className="h-10 w-auto" />
              <span className="text-xl font-bold text-[#032E63] hidden sm:block">BiovaCo Nexus Admin</span>
              <span className="text-lg font-bold text-[#032E63] sm:hidden">Admin</span>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-600 font-medium">Welcome, {user?.email?.split("@")[0]}</span>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="text-green-700 hover:text-green-800 bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>

            <Button variant="ghost" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
              <Link to="/" className="block">
                <Button variant="ghost" className="w-full justify-start text-green-700">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="px-4 py-2 text-sm text-gray-600">Welcome, {user?.email?.split("@")[0]}</div>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full justify-start text-green-700 bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="flex min-h-screen">
        <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white shadow-sm border-r border-gray-200">
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("dashboard")}
            >
              <BarChart3 className="h-4 w-4 mr-3" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === "applications" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("applications")}
            >
              <FileText className="h-4 w-4 mr-3" />
              Applications
            </Button>
            <Button
              variant={activeTab === "newsletter" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("newsletter")}
            >
              <Mail className="h-4 w-4 mr-3" />
              Newsletter
            </Button>
            <Button
              variant={activeTab === "interns" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("interns")}
            >
              <Users className="h-4 w-4 mr-3" />
              Interns
            </Button>
            <Button
              variant={activeTab === "content" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("content")}
            >
              <FileText className="h-4 w-4 mr-3" />
              Our Story
            </Button>
            <Button
              variant={activeTab === "jobs" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("jobs")}
            >
              <Briefcase className="h-4 w-4 mr-3" />
              Job Positions
            </Button>
            <Button
              variant={activeTab === "videos" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("videos")}
            >
              <Video className="h-4 w-4 mr-3" />
              Videos
            </Button>
            <Button
              variant={activeTab === "location" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("location")}
            >
              <MapPin className="h-4 w-4 mr-3" />
              Location
            </Button>
            <Button
              variant={activeTab === "countdown" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("countdown")}
            >
              <Calendar className="h-4 w-4 mr-3" />
              Countdown
            </Button>
            <Button
              variant={activeTab === "postcountdown" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("postcountdown")}
            >
              <Settings className="h-4 w-4 mr-3" />
              Post Countdown
            </Button>
            <Button
              variant={activeTab === "maintenance" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("maintenance")}
            >
              <Wrench className="h-4 w-4 mr-3" />
              Maintenance
            </Button>
            <Button
              variant={activeTab === "posts" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("posts")}
            >
              <FileText className="h-4 w-4 mr-3" />
              Marketing Posts
            </Button>
            <Button
              variant={activeTab === "models3d" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("models3d")}
            >
              <Box className="h-4 w-4 mr-3" />
              3D Models
            </Button>
            <Button
              variant={activeTab === "social" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("social")}
            >
              <Share2 className="h-4 w-4 mr-3" />
              Social Links
            </Button>
            <Button
              variant={activeTab === "finance" ? "default" : "ghost"}
              className="w-full justify-start text-[#08A04B] bg-[#08A04B]/10 hover:bg-[#08A04B]/20"
              onClick={() => setActiveTab("finance")}
            >
              <IndianRupee className="h-4 w-4 mr-3" />
              Finance & Expenses
            </Button>
            <Button
              variant={activeTab === "audit" ? "default" : "ghost"}
              className="w-full justify-start text-blue-700 bg-blue-50/50 hover:bg-blue-100"
              onClick={() => setActiveTab("audit")}
            >
              <Activity className="h-4 w-4 mr-3" />
              Audit Logs
            </Button>
          </nav>
        </aside>

        <main className="flex-1 lg:ml-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            
            <div className="lg:hidden mb-6">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="dashboard">Dashboard</option>
                <option value="applications">Applications</option>
                <option value="newsletter">Newsletter</option>
                <option value="interns">Interns</option>
                <option value="content">Our Story</option>
                <option value="jobs">Job Positions</option>
                <option value="videos">Videos</option>
                <option value="location">Location</option>
                <option value="countdown">Countdown</option>
                <option value="postcountdown">Post Countdown</option>
                <option value="maintenance">Maintenance</option>
                <option value="posts">Marketing Posts</option>
                <option value="models3d">3D Models</option>
                <option value="social">Social Links</option>
                <option value="finance">Finance & Expenses</option>
                <option value="audit">Audit Logs</option>
              </select>
            </div>

            {activeTab === "dashboard" && <DashboardAnalytics user={user} onNavigateToTab={handleNavigateToTab} />}
            {activeTab === "audit" && <AdminActivityLogs onNavigateToTab={handleNavigateToTab} />}
            {activeTab === "applications" && <ApplicationsManagement initialTargetId={targetApplicationId} onClearTargetId={() => setTargetApplicationId(undefined)} />}
            {activeTab === "posts" && <MarketingPostsManagement />}
            {activeTab === "newsletter" && <NewsletterManagement />}
            {activeTab === "interns" && <InternManagement />}
            {activeTab === "content" && <PageContentManagement />}
            {activeTab === "jobs" && <JobPositionsManagement />}
            {activeTab === "videos" && <VideoManagement />}
            {activeTab === "location" && <LocationManagement />}
            {activeTab === "countdown" && <CountdownManagement />}
            {activeTab === "postcountdown" && <PostCountdownManagement />}
            {activeTab === "maintenance" && <MaintenanceManagement />}
            {activeTab === "models3d" && <Model3DManagement />}
            {activeTab === "social" && <SocialLinksManagement />}
            {activeTab === "finance" && <FinanceManagement />}
          </div>
        </main>
      </div>

    </div>
  )
}

export default Admin
