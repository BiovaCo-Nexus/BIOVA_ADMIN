import React, { useState, useMemo } from "react"
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
  Target,
  Plus,
  Trash2,
  Edit3,
  Search,
  ExternalLink,
  Users,
  Copy,
  TrendingUp,
  BarChart3,
  CheckCircle,
  Sparkles,
  Zap,
  Layers,
  ArrowRight
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export interface LandingPageItem {
  id: string
  title: string
  slug: string
  campaign_name: string
  target_crop: string
  offer_headline: string
  conversion_rate: string
  total_leads: number
  total_visitors: number
  status: "Active" | "Paused" | "Draft"
  utm_link: string
  created_at: string
}

const INITIAL_LANDING_PAGES: LandingPageItem[] = [
  {
    id: "lp_1",
    title: "Free Electroculture Field Trial Guide for Wheat & Sugarcane Farmers",
    slug: "/free-field-trial-guide",
    campaign_name: "Kharif Season High-Yield Campaign",
    target_crop: "Wheat, Sugarcane, Cotton",
    offer_headline: "Get 40% Higher Crop Yield in 90 Days Using Atmospheric Ionization",
    conversion_rate: "14.2%",
    total_leads: 1850,
    total_visitors: 13000,
    status: "Active",
    utm_link: "https://biovaco.in/free-field-trial-guide?utm_source=meta_ads&utm_medium=cpc",
    created_at: "2026-07-15"
  },
  {
    id: "lp_2",
    title: "Commercial Farm Equipment Financing & Govt Subsidy Assessment",
    slug: "/subsidy-assessment",
    campaign_name: "Commercial Agribusiness Outreach",
    target_crop: "Commercial Greenhouse & Horticulture",
    offer_headline: "Calculate Your Electroculture Equipment Subsidy & Payback Period",
    conversion_rate: "11.8%",
    total_leads: 940,
    total_visitors: 7950,
    status: "Active",
    utm_link: "https://biovaco.in/subsidy-assessment?utm_source=google_search",
    created_at: "2026-07-22"
  },
  {
    id: "lp_3",
    title: "Organic Soil Revitalization & Chemical-Free Farming Webinar",
    slug: "/webinar-registration",
    campaign_name: "Organic Farming Summit 2026",
    target_crop: "Organic Vegetables & Fruits",
    offer_headline: "Join 5,000+ Farmers Live: Transition to 100% Organic Electroculture",
    conversion_rate: "18.5%",
    total_leads: 2400,
    total_visitors: 12900,
    status: "Active",
    utm_link: "https://biovaco.in/webinar-registration?utm_source=whatsapp_broadcast",
    created_at: "2026-08-01"
  }
]

export function LandingPagesManager() {
  const [pages, setPages] = useState<LandingPageItem[]>(INITIAL_LANDING_PAGES)
  const [searchQuery, setSearchQuery] = useState("")

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<LandingPageItem | null>(null)
  const [form, setForm] = useState<{
    title: string
    slug: string
    campaign_name: string
    target_crop: string
    offer_headline: string
    status: "Active" | "Paused" | "Draft"
  }>({
    title: "",
    slug: "/offer-",
    campaign_name: "",
    target_crop: "Wheat & Sugarcane",
    offer_headline: "",
    status: "Active"
  })

  const { toast } = useToast()

  const filteredPages = useMemo(() => {
    return pages.filter(p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.campaign_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.offer_headline.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [pages, searchQuery])

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    toast({ title: "Campaign Link Copied!", description: "UTM tracking URL copied to clipboard." })
  }

  const handleOpenAdd = () => {
    setEditingPage(null)
    setForm({
      title: "",
      slug: `/offer-${Date.now().toString().slice(-4)}`,
      campaign_name: "",
      target_crop: "Wheat & Sugarcane",
      offer_headline: "",
      status: "Active"
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (page: LandingPageItem) => {
    setEditingPage(page)
    setForm({
      title: page.title,
      slug: page.slug,
      campaign_name: page.campaign_name,
      target_crop: page.target_crop,
      offer_headline: page.offer_headline,
      status: page.status
    })
    setIsModalOpen(true)
  }

  const handleSavePage = () => {
    if (!form.title || !form.offer_headline) {
      toast({ title: "Validation Error", description: "Title and Offer Headline are required.", variant: "destructive" })
      return
    }

    const utm = `https://biovaco.in${form.slug}?utm_campaign=${encodeURIComponent(form.campaign_name || "default")}`

    if (editingPage) {
      setPages(prev => prev.map(p => p.id === editingPage.id ? {
        ...p,
        ...form,
        utm_link: utm
      } : p))
      toast({ title: "Landing Page Saved", description: `"${form.title}" updated.` })
    } else {
      const newLP: LandingPageItem = {
        id: `lp_${Date.now()}`,
        ...form,
        conversion_rate: "12.5%",
        total_leads: 0,
        total_visitors: 0,
        utm_link: utm,
        created_at: new Date().toISOString().slice(0, 10)
      }
      setPages(prev => [newLP, ...prev])
      toast({ title: "Landing Page Created!", description: `"${form.title}" ready for campaigns.` })
    }
    setIsModalOpen(false)
  }

  const handleDeletePage = (id: string, title: string) => {
    setPages(prev => prev.filter(p => p.id !== id))
    toast({ title: "Landing Page Removed", description: `"${title}" deleted.` })
  }

  const totalLeads = useMemo(() => pages.reduce((acc, p) => acc + p.total_leads, 0), [pages])
  const totalVisitors = useMemo(() => pages.reduce((acc, p) => acc + p.total_visitors, 0), [pages])

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                High-Converting Lead Gen Engine
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Target className="h-7 w-7 text-[#7DA0FA]" />
              Landing Pages & Lead Capture Suite
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Build, track, and optimize high-converting sales landing pages for farmer webinars, field trial downloads, and equipment consultations.
            </p>
          </div>

          <Button
            onClick={handleOpenAdd}
            className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white font-semibold shadow-md text-xs h-10 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Landing Page
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Active Campaign Pages</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{pages.length} Pages</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Total Captured Leads</span>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{totalLeads.toLocaleString()} Leads</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Campaign Visitors</span>
            <span className="text-xl font-bold text-purple-300 mt-0.5 block">{(totalVisitors / 1000).toFixed(1)}k Visitors</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Avg Conversion Rate</span>
            <span className="text-xl font-bold text-cyan-300 mt-0.5 block">⚡ 14.8% Avg</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search landing pages or campaign names..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Landing Pages Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPages.map(page => (
          <Card key={page.id} className="border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-lg flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-indigo-50 text-[#4B49AC] border-indigo-100 text-[10px] font-semibold">
                  {page.campaign_name}
                </Badge>
                <Badge className={`text-[10px] ${
                  page.status === "Active" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200"
                }`}>
                  {page.status}
                </Badge>
              </div>

              <CardTitle className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                {page.title}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3.5 pt-0">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1 text-xs">
                <span className="text-[10px] text-gray-400 font-semibold uppercase block">Offer Headline</span>
                <p className="text-slate-800 font-medium line-clamp-2">{page.offer_headline}</p>
                <span className="text-[11px] text-indigo-700 block pt-1 font-medium">Target Crop: {page.target_crop}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                <div>
                  <span className="text-[10px] text-gray-500 block">Leads</span>
                  <span className="font-bold text-[#4B49AC] text-sm">{page.total_leads}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Visitors</span>
                  <span className="font-bold text-slate-700 text-sm">{(page.total_visitors / 1000).toFixed(1)}k</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">CVR</span>
                  <span className="font-bold text-emerald-600 text-sm">{page.conversion_rate}</span>
                </div>
              </div>
            </CardContent>

            <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyLink(page.utm_link)}
                className="h-8 text-xs text-indigo-900 border-indigo-200 hover:bg-indigo-50 font-medium flex items-center gap-1"
              >
                <Copy className="h-3.5 w-3.5" /> Copy Campaign Link
              </Button>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(page)}
                  className="h-8 text-xs text-[#4B49AC]"
                >
                  <Edit3 className="h-3.5 w-3.5" />
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
          </Card>
        ))}
      </div>

      {/* Add / Edit Landing Page Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#4B49AC] flex items-center gap-2">
              <Target className="h-5 w-5 text-[#7DA0FA]" />
              {editingPage ? "Edit Landing Page" : "Create Lead Generation Landing Page"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Configure campaign offer headlines, URL slugs, and target crop segment parameters.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Page Title *</label>
              <Input
                placeholder="e.g. Free 100-Acre Field Trial Guide Download"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Campaign Name</label>
                <Input
                  placeholder="e.g. Meta Kharif Season 2026"
                  value={form.campaign_name}
                  onChange={e => setForm({ ...form, campaign_name: e.target.value })}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Target Crop Segment</label>
                <Input
                  placeholder="Wheat, Rice, Sugarcane"
                  value={form.target_crop}
                  onChange={e => setForm({ ...form, target_crop: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">URL Slug</label>
              <Input
                placeholder="/free-trial-guide"
                value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })}
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Hero Offer Headline *</label>
              <Textarea
                rows={2}
                placeholder="Main high-impact offer text displayed above the fold..."
                value={form.offer_headline}
                onChange={e => setForm({ ...form, offer_headline: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSavePage} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white">
              {editingPage ? "Update Landing Page" : "Publish Landing Page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
