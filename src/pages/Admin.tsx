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
  Loader2,
  FolderOpen,
  Shield,
  Newspaper,
  Search,
  Bell
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { AdminActivityLogs } from "@/components/AdminActivityLogs"
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
import { UniversalDashboard } from "@/components/dashboards/UniversalDashboard"
import { CoreOperationsDashboard } from "@/components/dashboards/CoreOperationsDashboard"
import { HRTeamDashboard } from "@/components/dashboards/HRTeamDashboard"
import { MarketingDashboard } from "@/components/dashboards/MarketingDashboard"
import { MediaDashboard } from "@/components/dashboards/MediaDashboard"
import { ApplicationsManagement } from "@/components/ApplicationsManagement"
import { DocumentGenerator } from "@/components/DocumentGenerator"
import { BusinessManagement } from "@/components/BusinessManagement"
import { NewsManagement } from "@/components/NewsManagement"
import { KnowledgeTracker } from "@/components/KnowledgeTracker"
import { RDLabManagement } from "@/components/RDLabManagement"
import { MarketResearchHub } from "@/components/rd-lab/MarketResearchHub"
import { SharedFilesManager } from "@/components/SharedFilesManager"
import { CeoMdTimetable } from "@/components/CeoMdTimetable"
import { UserAccessSettings } from "@/components/UserAccessSettings"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

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
  // Executive Command
  { id: "dashboard", label: "Executive Dashboard", icon: BarChart3, category: "Executive Command" },

  // Enterprise Operations
  { id: "core_ops_dashboard", label: "Financial & Ops Overview", icon: BarChart3, category: "Enterprise Operations" },
  { id: "timetable", label: "Executive Scheduler", icon: Calendar, category: "Enterprise Operations" },
  { id: "business", label: "Enterprise Resource Planning", icon: Briefcase, category: "Enterprise Operations" },
  { id: "documents", label: "Document Automation", icon: FileText, category: "Enterprise Operations" },
  { id: "shared_files", label: "Secure Vault", icon: FolderOpen, category: "Enterprise Operations" },

  // Human Capital
  { id: "hr_dashboard", label: "Workforce Analytics", icon: BarChart3, category: "Human Capital" },
  { id: "interns", label: "Talent Acquisition", icon: Users, category: "Human Capital" },
  { id: "jobs", label: "Role Architecture", icon: Briefcase, category: "Human Capital" },
  { id: "applications", label: "Candidate Pipeline", icon: FileText, category: "Human Capital" },
  { id: "rdlab", label: "Innovation Hub (R&D)", icon: FlaskConical, category: "Human Capital" },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen, category: "Human Capital" },

  // Brand & Market Strategy
  { id: "marketing_dashboard", label: "Marketing Intelligence", icon: BarChart3, category: "Brand & Market Strategy" },
  { id: "posts", label: "Campaign Management", icon: FileText, category: "Brand & Market Strategy" },
  { id: "newsletter", label: "Audience Engagement", icon: Mail, category: "Brand & Market Strategy" },
  { id: "content", label: "Brand Narrative", icon: FileText, category: "Brand & Market Strategy" },
  { id: "news", label: "Public Relations", icon: Newspaper, category: "Brand & Market Strategy" },
  { id: "market_research", label: "Market Intelligence", icon: Briefcase, category: "Brand & Market Strategy" },

  // Digital Assets & Media
  { id: "media_dashboard", label: "Asset Analytics", icon: BarChart3, category: "Digital Assets & Media" },
  { id: "videos", label: "Video Repository", icon: Video, category: "Digital Assets & Media" },
  { id: "models3d", label: "Spatial Assets", icon: Box, category: "Digital Assets & Media" },
  { id: "location", label: "Facility Coordinates", icon: MapPin, category: "Digital Assets & Media" },
  { id: "social", label: "Network Integrations", icon: Share2, category: "Digital Assets & Media" },

  // System Configuration
  { id: "access_settings", label: "Identity & Access", icon: Shield, category: "System Configuration" },
  { id: "audit", label: "Compliance & Auditing", icon: Activity, category: "System Configuration" },
  { id: "countdown", label: "Launch Protocols", icon: Calendar, category: "System Configuration" },
  { id: "postcountdown", label: "Post-Launch Metrics", icon: Settings, category: "System Configuration" },
  { id: "maintenance", label: "Infrastructure Status", icon: Wrench, category: "System Configuration" },
];

const FINANCIAL_HOLIDAYS = [
  { date: "2026-01-26", name: "Republic Day", type: "National" },
  { date: "2026-03-08", name: "Maha Shivaratri", type: "Market Closed" },
  { date: "2026-03-25", name: "Holi", type: "Market Closed" },
  { date: "2026-03-29", name: "Good Friday", type: "Market Closed" },
  { date: "2026-04-11", name: "Id-Ul-Fitr", type: "Market Closed" },
  { date: "2026-04-17", name: "Ram Navami", type: "Market Closed" },
  { date: "2026-05-01", name: "Maharashtra Day", type: "Market Closed" },
  { date: "2026-08-15", name: "Independence Day", type: "National" },
  { date: "2026-10-02", name: "Gandhi Jayanti", type: "National" },
  { date: "2026-11-01", name: "Diwali (Laxmi Pujan)", type: "Trading" },
  { date: "2026-12-25", name: "Christmas", type: "Market Closed" }
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [targetApplicationId, setTargetApplicationId] = useState<string | undefined>()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [documentPayload, setDocumentPayload] = useState<string | undefined>()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date())
  const navigate = useNavigate()
  const { toast } = useToast()

  // Holiday computation
  const todayDateStr = format(currentTime, 'yyyy-MM-dd');
  const selectedDateStr = calendarDate ? format(calendarDate, 'yyyy-MM-dd') : null;
  const todayHoliday = FINANCIAL_HOLIDAYS.find(h => h.date === todayDateStr);
  const selectedHoliday = FINANCIAL_HOLIDAYS.find(h => h.date === selectedDateStr);
  const nextHoliday = FINANCIAL_HOLIDAYS.find(h => new Date(h.date + "T00:00:00").getTime() > currentTime.getTime());
  const daysToNext = nextHoliday ? Math.ceil((new Date(nextHoliday.date + "T00:00:00").getTime() - currentTime.getTime()) / (1000 * 3600 * 24)) : null;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])



  const [userAccess, setUserAccess] = useState<{ allowed_pages: string[]; default_tab: string | null } | null>(null);

  const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || ""
  const SENDER_EMAIL = "no-reply@biovaco.in"
  const SENDER_NAME = "BiovaCo Nexus"
  
  const [notifications, setNotifications] = useState<{title: string, desc: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<{type: string, id: string, title: string, subtitle: string, tab: string, payload?: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const query = searchQuery.toLowerCase();
        const likeQuery = `%${query}%`;
        const results: typeof searchResults = [];

        const isCEOorMD = user?.email === "ceo@biovaco.in" || user?.email === "md@biovaco.in";
        const hasDbAccess = userAccess !== null;
        const allowed = isCEOorMD ? INITIAL_TABS.map(t => t.id) : (hasDbAccess ? userAccess.allowed_pages : []);

        // 1. Search Job Applications
        if (allowed.includes('applications')) {
          const { data: apps } = await supabase.from('job_applications')
            .select('id, full_name, role, email')
            .or(`full_name.ilike.${likeQuery},email.ilike.${likeQuery},role.ilike.${likeQuery}`)
            .limit(3);
          if (apps) apps.forEach(a => results.push({ type: 'Application', id: a.id, title: a.full_name, subtitle: `${a.role} • ${a.email}`, tab: 'applications', payload: a.id }));
        }

        // 2. Search Job Positions
        if (allowed.includes('jobs')) {
          const { data: jobs } = await supabase.from('job_positions')
            .select('id, title, department')
            .or(`title.ilike.${likeQuery},department.ilike.${likeQuery}`)
            .limit(3);
          if (jobs) jobs.forEach(j => results.push({ type: 'Job Position', id: j.id, title: j.title, subtitle: j.department, tab: 'jobs' }));
        }

        // 3. Search Interns
        if (allowed.includes('interns')) {
          const { data: interns } = await supabase.from('interns')
            .select('id, name, position, email')
            .or(`name.ilike.${likeQuery},email.ilike.${likeQuery},position.ilike.${likeQuery}`)
            .limit(3);
          if (interns) interns.forEach(i => results.push({ type: 'Intern', id: i.id, title: i.name, subtitle: `${i.position} • ${i.email}`, tab: 'interns' }));
        }

        // 4. Search Knowledge Base
        if (allowed.includes('knowledge')) {
          const { data: kb } = await supabase.from('knowledge_items')
            .select('id, title, topic')
            .or(`title.ilike.${likeQuery},topic.ilike.${likeQuery}`)
            .limit(3);
          if (kb) kb.forEach(k => results.push({ type: 'Knowledge Base', id: k.id, title: k.title, subtitle: k.topic, tab: 'knowledge' }));
        }

        // 5. Search News & Press
        if (allowed.includes('news')) {
          const { data: news } = await supabase.from('news_articles')
            .select('id, title, category')
            .or(`title.ilike.${likeQuery},category.ilike.${likeQuery}`)
            .limit(3);
          if (news) news.forEach(n => results.push({ type: 'News Article', id: n.id, title: n.title, subtitle: n.category, tab: 'news' }));
        }

        // 6. Search Videos
        if (allowed.includes('videos')) {
          const { data: videos } = await supabase.from('website_videos')
            .select('id, title, category')
            .or(`title.ilike.${likeQuery},category.ilike.${likeQuery}`)
            .limit(3);
          if (videos) videos.forEach(v => results.push({ type: 'Website Video', id: v.id, title: v.title, subtitle: v.category, tab: 'videos' }));
        }

        // 7. Search Marketing Posts
        if (allowed.includes('posts')) {
          const { data: posts } = await supabase.from('marketing_posts')
            .select('id, title, platform')
            .or(`title.ilike.${likeQuery},platform.ilike.${likeQuery}`)
            .limit(3);
          if (posts) posts.forEach(p => results.push({ type: 'Marketing Post', id: p.id, title: p.title, subtitle: p.platform, tab: 'posts' }));
        }

        // 8. Search Expense Records (Business / ERP)
        if (allowed.includes('business')) {
           const { data: exp } = await supabase.from('expense_records')
             .select('id, description, vendor_name')
             .or(`description.ilike.${likeQuery},vendor_name.ilike.${likeQuery}`)
             .limit(3);
           if (exp) exp.forEach(e => results.push({ type: 'Expense Record', id: e.id, title: e.description, subtitle: e.vendor_name, tab: 'business' }));
        }

        setSearchResults(results);
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, user, userAccess]);
  
  useEffect(() => {
    if (!user) return;
    const fetchAlerts = async () => {
      const notifs = [];
      const { count: appsCount } = await supabase.from('job_applications').select('*', { count: 'exact', head: true }).in('status', ['New', 'Pending']);
      if (appsCount && appsCount > 0) notifs.push({ title: "Job Applications", desc: `${appsCount} pending applications to review.` });
      
      const { data: invData } = await supabase.from('inventory_items').select('quantity, min_stock');
      if (invData) {
        const lowStockCount = invData.filter(i => (i.quantity || 0) < (i.min_stock || 5)).length;
        if (lowStockCount > 0) notifs.push({ title: "Low Stock Alert", desc: `${lowStockCount} items are critically low on stock.` });
      }
      
      const { count: expCount } = await supabase.from('expense_records').select('*', { count: 'exact', head: true }).eq('reimbursement_status', 'Pending');
      if (expCount && expCount > 0) notifs.push({ title: "Pending Expenses", desc: `${expCount} expenses are pending reimbursement.` });
      
      const { data: scheduleData } = await supabase.from('ceo_md_timetable').select('task_title, start_time, end_time, event_date').eq('assigned_email', user.email).eq('status', 'Pending');
      if (scheduleData && scheduleData.length > 0) {
        scheduleData.forEach(item => {
          notifs.push({ title: `Assigned Task: ${item.task_title}`, desc: `Scheduled for ${item.event_date ? item.event_date : 'this week'} from ${item.start_time} to ${item.end_time}.` });
        });
      }

      setNotifications(notifs);
    };
    fetchAlerts();
  }, [user]);
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
      if (!email) {
        await supabase.auth.signOut();
        navigate("/auth");
        return;
      }

      // CEO & MD always have full access
      if (email === "ceo@biovaco.in" || email === "md@biovaco.in") {
        setUser(session.user);
        setUserAccess(null); // null = full access
        setIsCheckingAuth(false);
        return;
      }

      // For other users, check database access rules
      const { data: accessRule, error } = await supabase
        .from("user_page_access")
        .select("allowed_pages, default_tab, is_active")
        .eq("user_email", email)
        .maybeSingle();

      if (error || !accessRule || !accessRule.is_active) {
        toast({ title: "Access Denied", description: "You do not have permission to access the admin portal.", variant: "destructive" });
        await supabase.auth.signOut();
        navigate("/auth");
        return;
      }

      setUser(session.user);
      setUserAccess({ allowed_pages: accessRule.allowed_pages || [], default_tab: accessRule.default_tab });
      if (accessRule.default_tab) {
        setActiveTab(accessRule.default_tab);
      } else if (accessRule.allowed_pages?.length > 0) {
        setActiveTab(accessRule.allowed_pages[0]);
      }
      setIsCheckingAuth(false);
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
  const hasDbAccess = userAccess !== null;
  
  const visibleTabs = isCEOorMD 
    ? INITIAL_TABS 
    : hasDbAccess 
      ? INITIAL_TABS.filter(t => userAccess.allowed_pages.includes(t.id)) 
      : [];

  const groupedTabs = visibleTabs.reduce((acc, tab) => {
    if (!acc[tab.category]) acc[tab.category] = [];
    acc[tab.category].push(tab);
    return acc;
  }, {} as Record<string, typeof INITIAL_TABS>);

  useEffect(() => {
    if (!isCEOorMD && hasDbAccess && userAccess.allowed_pages.length > 0) {
      if (!userAccess.allowed_pages.includes(activeTab)) {
        setActiveTab(userAccess.default_tab || userAccess.allowed_pages[0]);
      }
    }
  }, [isCEOorMD, hasDbAccess, activeTab, userAccess]);

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
    return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]"><Loader2 className="h-10 w-10 animate-spin text-[#7DA0FA]" /></div>
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b-2 border-[#7DA0FA] sticky top-0 z-40" style={{ boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3 w-auto md:w-1/3">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex -ml-2 text-gray-500 hover:text-[#4B49AC]">
                <Menu className="h-5 w-5" />
              </Button>
              <BiovaCoLogo className="h-9 w-auto" />
              <div className="hidden sm:flex flex-col">
                <span className="text-base font-semibold text-[#4B49AC] leading-tight">
                  {isCEOorMD ? "BiovaCo Nexus" : "BiovaCo Portal"}
                </span>
                <span className="text-[10px] font-medium text-[#7DA0FA] uppercase tracking-wider leading-tight">Admin Console</span>
              </div>
              <span className="text-base font-semibold text-[#4B49AC] sm:hidden">
                {isCEOorMD ? "Nexus" : "Portal"}
              </span>
            </div>

            {/* Middle Section: Functional Search Bar */}
            <div className="hidden md:flex flex-1 items-center justify-center w-1/3 px-4">
              <div className="relative w-full max-w-md group">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-[#4B49AC] transition-colors" />
                <Input 
                  type="text" 
                  placeholder="Search anything..." 
                  className="w-full pl-9 pr-12 h-9 bg-gray-50/80 border-gray-200/80 text-sm focus-visible:ring-2 focus-visible:ring-[#4B49AC]/20 focus-visible:border-[#4B49AC] rounded-lg shadow-sm transition-all duration-200" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                />
                <div className="absolute right-3 top-2 flex items-center gap-1 pointer-events-none">
                  <span className="text-[10px] font-medium text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 bg-white shadow-sm">⌘ K</span>
                </div>
                
                {showSearchDropdown && searchQuery && (
                  <div className="absolute top-11 left-0 w-full bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-xl overflow-hidden z-50 ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[400px] overflow-y-auto py-1">
                      {/* Modules Search */}
                      {visibleTabs.filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
                        <div className="p-2">
                          <div className="text-[10px] font-bold text-gray-400 uppercase px-3 mb-1 mt-1">Modules</div>
                          {visibleTabs.filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase())).map(tab => (
                            <div 
                              key={tab.id} 
                              className="px-3 py-2 text-sm cursor-pointer hover:bg-[#f2f6ff] flex items-center transition-colors text-gray-700 hover:text-[#4B49AC] rounded-lg mx-2 my-0.5" 
                              onClick={() => {
                                handleNavigateToTab(tab.id);
                                setSearchQuery("");
                                setShowSearchDropdown(false);
                              }}
                            >
                              <tab.icon className="w-4 h-4 mr-2" />
                              {tab.label}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Deep Search Results */}
                      {searchResults.length > 0 && (
                        <div className="p-2 border-t border-gray-100 mt-2">
                          <div className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-2 mt-1">Deep Search Results</div>
                          {searchResults.map(res => (
                            <div 
                              key={res.id} 
                              className="px-3 py-2.5 cursor-pointer hover:bg-[#f2f6ff] transition-colors text-gray-700 hover:text-[#4B49AC] rounded-lg flex flex-col mx-1 my-0.5" 
                              onClick={() => {
                                handleNavigateToTab(res.tab, res.payload);
                                setSearchQuery("");
                                setShowSearchDropdown(false);
                              }}
                            >
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-sm font-semibold">{res.title}</span>
                                <Badge variant="secondary" className="text-[9px] font-medium h-4 px-1.5 bg-[#7DA0FA]/10 text-[#4B49AC] border-0">{res.type}</Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">{res.subtitle}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {isSearching && (
                        <div className="p-4 text-center">
                          <Loader2 className="h-4 w-4 animate-spin text-primary mx-auto" />
                        </div>
                      )}

                      {!isSearching && searchResults.length === 0 && visibleTabs.filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                        <div className="px-3 py-6 text-sm text-gray-500 text-center">No results found for "{searchQuery}"</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Section: Notification, Profile, Logout */}
            <div className="flex items-center justify-end space-x-2.5 flex-shrink-0">
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg shadow-sm whitespace-nowrap">
                <Clock className="h-4 w-4 text-[#4B49AC]" />
                <span className="text-[11px] font-semibold text-gray-700 tracking-wide tabular-nums">
                  {format(currentTime, 'MMM dd, yyyy • hh:mm:ss a')}
                </span>
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-gray-500 hover:text-[#4B49AC] hover:bg-[#f2f6ff] shadow-sm hidden md:flex border-gray-200">
                    <Calendar className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[330px] p-0 shadow-2xl border-gray-200 rounded-xl overflow-hidden ring-1 ring-black/5">
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 text-white">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#7DA0FA]" /> Market Calendar
                    </h4>
                    {todayHoliday ? (
                      <div className="mt-2.5 inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-200 border border-rose-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">
                        <AlertCircle className="h-3 w-3" /> Today is {todayHoliday.name}
                      </div>
                    ) : nextHoliday ? (
                      <p className="text-[11px] text-gray-300 mt-1 font-medium tracking-wide">
                        Next Holiday: <span className="text-white font-bold">{nextHoliday.name}</span> in {daysToNext} days
                      </p>
                    ) : null}
                  </div>
                  <div className="p-3 bg-white">
                    <CalendarComponent
                      mode="single"
                      selected={calendarDate}
                      onSelect={setCalendarDate}
                      initialFocus
                      modifiers={{
                        holiday: FINANCIAL_HOLIDAYS.map(h => new Date(h.date + "T00:00:00"))
                      }}
                      modifiersStyles={{
                        holiday: {
                          backgroundColor: '#1f2937',
                          color: 'white',
                          fontWeight: 'bold',
                        }
                      }}
                      className="rounded-lg bg-white border-none mx-auto p-0"
                    />
                  </div>
                  {selectedHoliday && selectedDateStr !== todayDateStr && (
                    <div className="border-t border-gray-100 bg-gray-50/80 p-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[13px] font-bold text-gray-900">{selectedHoliday.name}</p>
                          <p className="text-[10px] font-medium text-gray-500 mt-0.5">{format(new Date(selectedHoliday.date + "T00:00:00"), 'MMMM do, yyyy')}</p>
                        </div>
                        <Badge variant="secondary" className="bg-[#4B49AC]/10 text-[#4B49AC] text-[10px] font-bold border-0 shadow-sm">{selectedHoliday.type}</Badge>
                      </div>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-primary hover:bg-primary/5 hidden md:flex">
                      <Bell className="h-5 w-5" />
                      {notifications.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#F3797E] rounded-full border border-white"></span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 p-0 shadow-lg border-gray-100">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between rounded-t-lg">
                      <span className="font-semibold text-sm text-foreground">Notifications & Alerts</span>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-0">{notifications.length} New</Badge>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length > 0 ? notifications.map((n, i) => (
                        <div key={i} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50/80 transition-colors last:border-0">
                          <p className="text-sm font-semibold text-primary">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                        </div>
                      )) : (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">No pending alerts. You're all caught up!</div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f2f6ff] border border-[#7DA0FA]/20 rounded-md">
                <div className="h-2 w-2 rounded-full bg-[#7DA0FA]" />
                <span className="text-xs text-[#4B49AC] font-medium">{user?.email}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-gray-500 hover:text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="h-2 w-2 rounded-full bg-[#7DA0FA]" />
                <span className="text-xs text-gray-500">{user?.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start text-gray-600 hover:text-[#4B49AC]"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="flex" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <aside
          className={`${
            sidebarOpen ? 'hidden lg:flex' : 'hidden'
          } lg:flex-col lg:w-60 bg-white border-r border-gray-200 sticky top-14 overflow-y-auto transition-all duration-200`}
          style={{ height: 'calc(100vh - 56px)' }}
        >
          <nav className="flex-1 px-3 py-4 space-y-5">
            {Object.entries(groupedTabs).map(([category, catTabs]) => (
              <div key={category} className="space-y-1">
                <div className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {category}
                </div>
                {catTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <div
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`cursor-pointer transition-opacity flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 select-none ${
                        isActive
                          ? 'bg-[#7DA0FA] text-white shadow-sm'
                          : 'text-gray-600 hover:bg-[#f2f6ff] hover:text-[#4B49AC]'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      <span className="truncate">{tab.label}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 w-full overflow-x-hidden bg-[#f8fafc]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            
            <div className="lg:hidden mb-5">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-[#4B49AC]/20 focus:border-[#4B49AC] outline-none appearance-none"
              >
                {Object.entries(groupedTabs).map(([category, catTabs]) => (
                  <optgroup key={category} label={category}>
                    {catTabs.map(tab => (
                      <option key={tab.id} value={tab.id}>{tab.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {!isCEOorMD && hasDbAccess ? (
              <>
                {userAccess.allowed_pages.includes("dashboard") && activeTab === "dashboard" && <UniversalDashboard onNavigateToTab={handleNavigateToTab} />}
                {userAccess.allowed_pages.includes("core_ops_dashboard") && activeTab === "core_ops_dashboard" && <CoreOperationsDashboard />}
                {userAccess.allowed_pages.includes("hr_dashboard") && activeTab === "hr_dashboard" && <HRTeamDashboard />}
                {userAccess.allowed_pages.includes("marketing_dashboard") && activeTab === "marketing_dashboard" && <MarketingDashboard />}
                {userAccess.allowed_pages.includes("media_dashboard") && activeTab === "media_dashboard" && <MediaDashboard />}
                {userAccess.allowed_pages.includes("timetable") && activeTab === "timetable" && <CeoMdTimetable />}
                {userAccess.allowed_pages.includes("applications") && activeTab === "applications" && <ApplicationsManagement initialTargetId={targetApplicationId} onClearTargetId={() => setTargetApplicationId(undefined)} onNavigateToTab={handleNavigateToTab} />}
                {userAccess.allowed_pages.includes("newsletter") && activeTab === "newsletter" && <NewsletterManagement />}
                {userAccess.allowed_pages.includes("interns") && activeTab === "interns" && <InternManagement />}
                {userAccess.allowed_pages.includes("content") && activeTab === "content" && <PageContentManagement />}
                {userAccess.allowed_pages.includes("documents") && activeTab === "documents" && <DocumentGenerator initialPayload={documentPayload} onClearPayload={() => setDocumentPayload(undefined)} />}
                {userAccess.allowed_pages.includes("jobs") && activeTab === "jobs" && <JobPositionsManagement />}
                {userAccess.allowed_pages.includes("videos") && activeTab === "videos" && <VideoManagement />}
                {userAccess.allowed_pages.includes("location") && activeTab === "location" && <LocationManagement />}
                {userAccess.allowed_pages.includes("countdown") && activeTab === "countdown" && <CountdownManagement />}
                {userAccess.allowed_pages.includes("postcountdown") && activeTab === "postcountdown" && <PostCountdownManagement />}
                {userAccess.allowed_pages.includes("maintenance") && activeTab === "maintenance" && <MaintenanceManagement />}
                {userAccess.allowed_pages.includes("posts") && activeTab === "posts" && <MarketingPostsManagement />}
                {userAccess.allowed_pages.includes("models3d") && activeTab === "models3d" && <Model3DManagement />}
                {userAccess.allowed_pages.includes("social") && activeTab === "social" && <SocialLinksManagement />}
                {userAccess.allowed_pages.includes("business") && activeTab === "business" && <BusinessManagement />}
                {userAccess.allowed_pages.includes("market_research") && activeTab === "market_research" && <MarketResearchHub />}
                {userAccess.allowed_pages.includes("shared_files") && activeTab === "shared_files" && <SharedFilesManager />}
                {userAccess.allowed_pages.includes("knowledge") && activeTab === "knowledge" && <KnowledgeTracker />}
                {userAccess.allowed_pages.includes("rdlab") && activeTab === "rdlab" && <RDLabManagement />}
                {userAccess.allowed_pages.includes("news") && activeTab === "news" && <NewsManagement />}
                {userAccess.allowed_pages.includes("audit") && activeTab === "audit" && <AdminActivityLogs onNavigateToTab={handleNavigateToTab} />}
              </>
            ) : (
              <>
                {activeTab === "dashboard" && <UniversalDashboard onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "core_ops_dashboard" && <CoreOperationsDashboard />}
                {activeTab === "hr_dashboard" && <HRTeamDashboard />}
                {activeTab === "marketing_dashboard" && <MarketingDashboard />}
                {activeTab === "media_dashboard" && <MediaDashboard />}
                {activeTab === "timetable" && <CeoMdTimetable />}
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
                {activeTab === "shared_files" && <SharedFilesManager />}
                {activeTab === "knowledge" && <KnowledgeTracker />}
                {activeTab === "rdlab" && <RDLabManagement />}
                {activeTab === "news" && <NewsManagement />}
                {activeTab === "access_settings" && <UserAccessSettings />}
              </>
            )}
          </div>
        </main>
      </div>

    </div>
  )
}

export default Admin
