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
  ShoppingCart,
  Receipt,
  Package,
  Truck,
  CreditCard,
  BookOpen,
  FlaskConical,
  Loader2
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
import { DocumentGenerator } from "@/components/DocumentGenerator"
import { BusinessManagement } from "@/components/BusinessManagement"
import { NewsManagement } from "@/components/NewsManagement"
import { KnowledgeTracker } from "@/components/KnowledgeTracker"
import { RDLabManagement } from "@/components/RDLabManagement"
import { MarketResearchHub } from "@/components/rd-lab/MarketResearchHub"

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

const INITIAL_TABS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "applications", label: "Applications", icon: FileText },
  { id: "newsletter", label: "Newsletter", icon: Mail },
  { id: "interns", label: "Interns", icon: Users },
  { id: "content", label: "Our Story", icon: FileText },
  { id: "documents", label: "Document Generator", icon: FileText, className: "text-purple-700 bg-purple-50/50 hover:bg-purple-100" },
  { id: "jobs", label: "Job Positions", icon: Briefcase },
  { id: "videos", label: "Videos", icon: Video },
  { id: "location", label: "Location", icon: MapPin },
  { id: "countdown", label: "Countdown", icon: Calendar },
  { id: "postcountdown", label: "Post Countdown", icon: Settings },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "posts", label: "Marketing Posts", icon: FileText },
  { id: "models3d", label: "3D Models", icon: Box },
  { id: "social", label: "Social Links", icon: Share2 },
  { id: "business", label: "Business & ERP", icon: Briefcase, className: "text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 font-bold border border-indigo-200" },
  { id: "market_research", label: "Market Research & BD", icon: Briefcase, className: "text-amber-700 bg-amber-50/50 hover:bg-amber-100 font-bold border border-amber-200" },
  { id: "knowledge", label: "Knowledge Tracker", icon: BookOpen, className: "text-teal-700 bg-teal-50/50 hover:bg-teal-100 font-semibold border border-teal-200" },
  { id: "rdlab", label: "R&D Lab", icon: FlaskConical, className: "text-[#08A04B] bg-green-50/50 hover:bg-green-100 font-bold border border-green-200" },
  { id: "audit", label: "Audit Logs", icon: Activity, className: "text-blue-700 bg-blue-50/50 hover:bg-blue-100" },
  { id: "news", label: "News & Press", icon: FileText, className: "text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100" },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [targetApplicationId, setTargetApplicationId] = useState<string | undefined>()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [documentPayload, setDocumentPayload] = useState<string | undefined>()
  const navigate = useNavigate()
  const { toast } = useToast()


  const [tabs, setTabs] = useState(() => {
    const saved = localStorage.getItem("adminTabsOrder");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length === INITIAL_TABS.length) {
          return parsed.map((pId: string) => INITIAL_TABS.find(t => t.id === pId) || INITIAL_TABS.find(t => t.id === pId)).filter(Boolean);
        }
      } catch (e) {}
    }
    return INITIAL_TABS;
  });

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    const newTabs = [...tabs];
    const draggedItem = newTabs[draggedIdx];
    newTabs.splice(draggedIdx, 1);
    newTabs.splice(index, 0, draggedItem);
    setDraggedIdx(index);
    setTabs(newTabs);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    localStorage.setItem("adminTabsOrder", JSON.stringify(tabs.map(t => t.id)));
  };

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

      const email = session.user.email?.toLowerCase();
      
      // SECURITY: Hardcoded RBAC
      if (!email || !["ceo@biovaco.in", "md@biovaco.in", "food@biovaco.in"].includes(email)) {
        toast({ title: "Access Denied", description: "You do not have permission to access the admin portal.", variant: "destructive" });
        await supabase.auth.signOut();
        navigate("/auth");
        return;
      }

      setUser(session.user)

      if (email === "food@biovaco.in") {
        setActiveTab("rdlab")
      }
      
      setIsCheckingAuth(false)
    }

    checkAuth()
  }, [navigate, toast])

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

  const isCEOorMD = user?.email === "ceo@biovaco.in" || user?.email === "md@biovaco.in";
  const isFoodTech = user?.email === "food@biovaco.in";
  
  const visibleTabs = isCEOorMD 
    ? tabs 
    : isFoodTech 
      ? tabs.filter(t => t.id === "rdlab" || t.id === "knowledge") 
      : tabs.filter(t => t.id === "knowledge");

  useEffect(() => {
    if (!isCEOorMD && !isFoodTech && activeTab !== "knowledge") {
      setActiveTab("knowledge");
    } else if (isFoodTech && activeTab !== "rdlab" && activeTab !== "knowledge") {
      setActiveTab("rdlab");
    }
  }, [isCEOorMD, isFoodTech, activeTab]);

  const handleNavigateToTab = (tab: string, payload?: string) => {
    if (tab === "applications" && payload) {
      setTargetApplicationId(payload)
    }
    if (tab === "documents" && payload) {
      setDocumentPayload(payload)
    }
    setActiveTab(tab)
  }

  if (isCheckingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]"><Loader2 className="h-10 w-10 animate-spin text-green-600" /></div>
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white shadow-sm border-b-4 border-[#08A04B] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex -ml-2 text-gray-500 hover:text-[#032E63]">
                <Menu className="h-5 w-5" />
              </Button>
              <BiovaCoLogo className="h-10 w-auto" />
              <span className="text-xl font-bold text-[#032E63] hidden sm:block">
                {user?.email === "ceo@biovaco.in" || user?.email === "md@biovaco.in" ? "BiovaCo Nexus Admin" : "BiovaCo Nexus Portal"}
              </span>
              <span className="text-lg font-bold text-[#032E63] sm:hidden">
                {user?.email === "ceo@biovaco.in" || user?.email === "md@biovaco.in" ? "Admin" : "Portal"}
              </span>
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
        <aside className={`${sidebarOpen ? 'hidden lg:flex' : 'hidden'} lg:flex-col lg:w-64 bg-white shadow-sm border-r border-gray-200 transition-all duration-300`}>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {visibleTabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <div
                  key={tab.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setActiveTab(tab.id)}
                  className={`cursor-grab active:cursor-grabbing transition-opacity ${draggedIdx === index ? 'opacity-40' : ''}`}
                >
                  <Button
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    className={`w-full justify-start pointer-events-none ${tab.className || ''}`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {tab.label}
                  </Button>
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 w-full lg:ml-0 overflow-x-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            
            <div className="lg:hidden mb-6">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {visibleTabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>{tab.label}</option>
                ))}
              </select>
            </div>

            {isFoodTech ? (
              <>
                {activeTab === "knowledge" ? <KnowledgeTracker /> : <RDLabManagement />}
              </>
            ) : !isCEOorMD ? (
              <>
                <KnowledgeTracker />
              </>
            ) : (
              <>
                {activeTab === "dashboard" && <DashboardAnalytics user={user} onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "audit" && <AdminActivityLogs onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "applications" && <ApplicationsManagement initialTargetId={targetApplicationId} onClearTargetId={() => setTargetApplicationId(undefined)} onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "posts" && <MarketingPostsManagement />}
                {activeTab === "newsletter" && <NewsletterManagement />}
                { activeTab === "interns" && <InternManagement /> }
                { activeTab === "documents" && <DocumentGenerator initialPayload={documentPayload} onClearPayload={() => setDocumentPayload(undefined)} /> }
                { activeTab === "content" && <PageContentManagement /> }
                {activeTab === "jobs" && <JobPositionsManagement />}
                {activeTab === "videos" && <VideoManagement />}
                {activeTab === "location" && <LocationManagement />}
                {activeTab === "countdown" && <CountdownManagement />}
                {activeTab === "postcountdown" && <PostCountdownManagement />}
                {activeTab === "maintenance" && <MaintenanceManagement />}
                {activeTab === "models3d" && <Model3DManagement />}
                {activeTab === "social" && <SocialLinksManagement />}
                {activeTab === "business" && <BusinessManagement />}
                {activeTab === "market_research" && <MarketResearchHub />}
                {activeTab === "knowledge" && <KnowledgeTracker />}
                {activeTab === "rdlab" && <RDLabManagement />}
                {activeTab === "news" && <NewsManagement />}
              </>
            )}
          </div>
        </main>
      </div>

    </div>
  )
}

export default Admin
