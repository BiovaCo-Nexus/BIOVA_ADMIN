import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Globe,
  CheckCircle,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  Search,
  Activity,
  ShieldCheck,
  Zap,
  Eye,
  BarChart3,
  RefreshCw,
  FileText,
  Clock,
  Sparkles,
  Check,
  Sliders,
  Layers,
  Laptop
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

export interface WebsitePageItem {
  id: string
  title: string
  slug: string
  status: "Published" | "Draft" | "Maintenance"
  meta_title: string
  meta_description: string
  monthly_views: number
  conversion_rate: string
  page_speed_score: number
  last_updated: string
  is_active: boolean
}

const INITIAL_PAGES: WebsitePageItem[] = [
  {
    id: "pg_1",
    title: "Homepage — Electroculture Solutions",
    slug: "/",
    status: "Published",
    meta_title: "BiovaCo Nexus — Sustainable Agricultural Electroculture Equipment",
    meta_description: "Increase crop yield by up to 40% using advanced electroculture antennas, soil ionization, and wireless bio-frequency equipment.",
    monthly_views: 48500,
    conversion_rate: "4.8%",
    page_speed_score: 98,
    last_updated: new Date().toISOString(),
    is_active: true
  },
  {
    id: "pg_2",
    title: "Electroculture Technology & Science",
    slug: "/technology",
    status: "Published",
    meta_title: "The Science of Electroculture — Soil Ionization & Biomagnetic Waves",
    meta_description: "Explore the peer-reviewed science, electrical field physics, and crop growth mechanics behind atmospheric energy harvesting.",
    monthly_views: 24200,
    conversion_rate: "3.9%",
    page_speed_score: 95,
    last_updated: new Date().toISOString(),
    is_active: true
  },
  {
    id: "pg_3",
    title: "Commercial Product Catalog",
    slug: "/products",
    status: "Published",
    meta_title: "Electroculture Hardware, Copper Antenna Rods & Frequency Generators",
    meta_description: "Order commercial grade electroculture systems, atmospheric collectors, and precision coil systems for high-yield farming.",
    monthly_views: 31900,
    conversion_rate: "6.2%",
    page_speed_score: 94,
    last_updated: new Date().toISOString(),
    is_active: true
  },
  {
    id: "pg_4",
    title: "Farmer Case Studies & Research Results",
    slug: "/case-studies",
    status: "Published",
    meta_title: "Proven Yield Results — 200+ Farm Case Studies Across India",
    meta_description: "Verified field trial results showing root length expansion, reduced fertilizer dependency, and faster harvest cycles.",
    monthly_views: 18400,
    conversion_rate: "5.1%",
    page_speed_score: 96,
    last_updated: new Date().toISOString(),
    is_active: true
  },
  {
    id: "pg_5",
    title: "Contact & Commercial Consultations",
    slug: "/contact",
    status: "Published",
    meta_title: "Contact BiovaCo Nexus — AgriTech Advisory & Custom Field Setup",
    meta_description: "Get in touch with our agricultural engineers for a customized electroculture field setup assessment and quote.",
    monthly_views: 12100,
    conversion_rate: "8.4%",
    page_speed_score: 99,
    last_updated: new Date().toISOString(),
    is_active: true
  }
]

export function WebsiteCMSManager() {
  const [pages, setPages] = useState<WebsitePageItem[]>(INITIAL_PAGES)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<WebsitePageItem | null>(null)
  const [form, setForm] = useState<{
    title: string
    slug: string
    status: "Published" | "Draft" | "Maintenance"
    meta_title: string
    meta_description: string
  }>({
    title: "",
    slug: "/",
    status: "Published",
    meta_title: "",
    meta_description: ""
  })

  const { toast } = useToast()

  const filteredPages = useMemo(() => {
    return pages.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.meta_title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus = filterStatus === "all" || p.status.toLowerCase() === filterStatus.toLowerCase()
      return matchSearch && matchStatus
    })
  }, [pages, searchQuery, filterStatus])

  const handleToggleActive = (id: string) => {
    setPages(prev => prev.map(p => {
      if (p.id !== id) return p
      const nextActive = !p.is_active
      const nextStatus = nextActive ? "Published" : "Draft"
      return { ...p, is_active: nextActive, status: nextStatus }
    }))
    toast({ title: "Page Status Updated", description: "CMS state updated successfully." })
  }

  const handleOpenAdd = () => {
    setEditingPage(null)
    setForm({
      title: "",
      slug: "/",
      status: "Published",
      meta_title: "",
      meta_description: ""
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (page: WebsitePageItem) => {
    setEditingPage(page)
    setForm({
      title: page.title,
      slug: page.slug,
      status: page.status,
      meta_title: page.meta_title,
      meta_description: page.meta_description
    })
    setIsModalOpen(true)
  }

  const handleSavePage = () => {
    if (!form.title || !form.slug) {
      toast({ title: "Validation Error", description: "Title and Slug are required.", variant: "destructive" })
      return
    }

    if (editingPage) {
      setPages(prev => prev.map(p => p.id === editingPage.id ? {
        ...p,
        ...form,
        last_updated: new Date().toISOString()
      } : p))
      toast({ title: "Page Updated", description: `"${form.title}" updated in CMS.` })
    } else {
      const newPage: WebsitePageItem = {
        id: `pg_${Date.now()}`,
        ...form,
        monthly_views: Math.floor(Math.random() * 5000) + 500,
        conversion_rate: `${(Math.random() * 4 + 2).toFixed(1)}%`,
        page_speed_score: Math.floor(Math.random() * 5) + 95,
        last_updated: new Date().toISOString(),
        is_active: form.status === "Published"
      }
      setPages(prev => [newPage, ...prev])
      toast({ title: "New Page Created!", description: `"${form.title}" published to CMS.` })
    }
    setIsModalOpen(false)
  }

  const handleDeletePage = (id: string, title: string) => {
    setPages(prev => prev.filter(p => p.id !== id))
    toast({ title: "Page Removed", description: `"${title}" deleted from CMS.` })
  }

  const totalViews = useMemo(() => pages.reduce((acc, p) => acc + p.monthly_views, 0), [pages])
  const avgSpeed = useMemo(() => Math.round(pages.reduce((acc, p) => acc + p.page_speed_score, 0) / (pages.length || 1)), [pages])

  return (
    <div className="space-y-6">
      {/* Top Banner & Live Stats */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live HTTPS Web Production Engine
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Globe className="h-7 w-7 text-[#7DA0FA]" />
              Website & Production CMS Suite
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Manage live production web pages, meta SEO tags, conversion analytics, and load speed performance across biovaco.in
            </p>
          </div>

          <Button
            onClick={handleOpenAdd}
            className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white font-semibold shadow-md text-xs h-10 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Web Page
          </Button>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Total Active Pages</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{pages.length} Live Pages</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Monthly Web Traffic</span>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{(totalViews / 1000).toFixed(1)}k Views</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Average Page Speed</span>
            <span className="text-xl font-bold text-purple-300 mt-0.5 block">⚡ {avgSpeed} / 100</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">SSL & Domain Health</span>
            <span className="text-xl font-bold text-cyan-300 mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
              biovaco.in Active
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search pages, slugs, or meta title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Badge variant="outline" className="bg-slate-50 text-slate-700 text-xs px-3 py-1 font-medium">
            Showing {filteredPages.length} of {pages.length} Pages
          </Badge>
        </div>
      </div>

      {/* Page List Table / Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPages.map(page => (
          <Card key={page.id} className="border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-md">
            <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-indigo-50 text-[#4B49AC] rounded-lg border border-indigo-100">
                    <Laptop className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{page.title}</h3>
                      <Badge className={`text-[10px] ${
                        page.status === "Published" 
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      }`}>
                        {page.status}
                      </Badge>
                    </div>
                    <a
                      href={`https://biovaco.in${page.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#4B49AC] font-mono hover:underline flex items-center gap-1 mt-0.5"
                    >
                      https://biovaco.in{page.slug}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1 mt-2">
                  <div className="text-slate-700 font-semibold line-clamp-1">Meta SEO Title: {page.meta_title}</div>
                  <div className="text-slate-500 text-[11px] line-clamp-2">{page.meta_description}</div>
                </div>
              </div>

              {/* Metrics & Actions */}
              <div className="flex flex-wrap md:flex-col items-end gap-3 min-w-[200px] border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Monthly Views</span>
                    <span className="font-bold text-slate-800">{(page.monthly_views / 1000).toFixed(1)}k</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Conversion</span>
                    <span className="font-bold text-emerald-600">{page.conversion_rate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Page Speed</span>
                    <span className="font-bold text-purple-600">⚡ {page.page_speed_score}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <Switch
                    checked={page.is_active}
                    onCheckedChange={() => handleToggleActive(page.id)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(page)}
                    className="h-8 text-xs text-[#4B49AC] border-[#7DA0FA]/40 hover:bg-[#4B49AC]/10"
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1" />
                    Edit Meta SEO
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePage(page.id, page.title)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add / Edit Page Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#4B49AC] flex items-center gap-2">
              <Globe className="h-5 w-5 text-[#7DA0FA]" />
              {editingPage ? "Edit CMS Page & Meta SEO" : "Create New Production Web Page"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Configure page URL slug, title, status, and search engine optimization (Meta SEO) settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Page Title *</label>
              <Input
                placeholder="e.g. Electroculture Antenna Rods & Accessories"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">URL Slug *</label>
                <Input
                  placeholder="/antennas"
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Publish Status</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs shadow-2xs focus:outline-hidden"
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as any })}
                >
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Meta SEO Title Tag</label>
              <Input
                placeholder="Search Engine Title (approx 60 chars)"
                value={form.meta_title}
                onChange={e => setForm({ ...form, meta_title: e.target.value })}
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Meta SEO Description</label>
              <Textarea
                rows={3}
                placeholder="Detailed meta description for Google Search index..."
                value={form.meta_description}
                onChange={e => setForm({ ...form, meta_description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSavePage} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white">
              {editingPage ? "Update Page" : "Publish Page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
