import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  Copy,
  Users,
  Loader2,
  TrendingUp,
  FileX
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

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
  created_at?: string
}

export function LandingPagesManager() {
  const [pages, setPages] = useState<LandingPageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<LandingPageItem | null>(null)
  const [form, setForm] = useState<{
    title: string; slug: string; campaign_name: string
    target_crop: string; offer_headline: string; status: "Active" | "Paused" | "Draft"
  }>({ title: "", slug: "/offer-", campaign_name: "", target_crop: "", offer_headline: "", status: "Active" })

  const { toast } = useToast()

  const fetchLandingPages = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("landing_pages")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) {
      console.warn("landing_pages fetch error:", error.message)
      setPages([])
    } else {
      setPages((data ?? []) as LandingPageItem[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLandingPages()
    const channel = supabase
      .channel("landing_pages_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "landing_pages" }, fetchLandingPages)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchLandingPages])

  const filteredPages = useMemo(() =>
    pages.filter(p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.campaign_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.offer_headline || "").toLowerCase().includes(searchQuery.toLowerCase())
    ), [pages, searchQuery])

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    toast({ title: "Campaign Link Copied!", description: "UTM tracking URL copied to clipboard." })
  }

  const handleOpenAdd = () => {
    setEditingPage(null)
    setForm({ title: "", slug: `/offer-${Date.now().toString().slice(-4)}`, campaign_name: "", target_crop: "", offer_headline: "", status: "Active" })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (page: LandingPageItem) => {
    setEditingPage(page)
    setForm({ title: page.title, slug: page.slug, campaign_name: page.campaign_name || "", target_crop: page.target_crop || "", offer_headline: page.offer_headline || "", status: page.status })
    setIsModalOpen(true)
  }

  const handleSavePage = async () => {
    if (!form.title || !form.offer_headline) {
      toast({ title: "Validation Error", description: "Title and Offer Headline are required.", variant: "destructive" })
      return
    }
    const utm = `https://biovaco.in${form.slug}?utm_campaign=${encodeURIComponent(form.campaign_name || "default")}`
    const payload = {
      title: form.title.trim(), slug: form.slug.trim(),
      campaign_name: form.campaign_name.trim(), target_crop: form.target_crop.trim(),
      offer_headline: form.offer_headline.trim(), status: form.status, utm_link: utm
    }
    if (editingPage) {
      const { data, error } = await supabase.from("landing_pages").update(payload).eq("id", editingPage.id).select().single()
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" })
      else if (data) { setPages(prev => prev.map(p => p.id === editingPage.id ? data : p)); toast({ title: "Landing Page Updated" }) }
    } else {
      const { data, error } = await supabase.from("landing_pages").insert({ ...payload, conversion_rate: "0%", total_leads: 0, total_visitors: 0 }).select().single()
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" })
      else if (data) { setPages(prev => [data, ...prev]); toast({ title: "Landing Page Created!" }) }
    }
    setIsModalOpen(false)
  }

  const handleDeletePage = async (id: string, title: string) => {
    setPages(prev => prev.filter(p => p.id !== id))
    await supabase.from("landing_pages").delete().eq("id", id)
    toast({ title: "Landing Page Removed", description: `"${title}" deleted.` })
  }

  const totalLeads = useMemo(() => pages.reduce((acc, p) => acc + (p.total_leads || 0), 0), [pages])
  const totalVisitors = useMemo(() => pages.reduce((acc, p) => acc + (p.total_visitors || 0), 0), [pages])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#4B49AC]" />
        <p className="text-sm font-medium text-gray-500">Loading Landing Pages...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-6 w-6 text-[#4B49AC]" /> Landing Pages & Lead Capture Suite
          </h1>
          <p className="text-sm text-gray-500">Build and track high-converting sales landing pages for webinars, trial downloads, and consultations.</p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white text-xs h-9 flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Create Landing Page
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#4B49AC] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Campaign Pages</CardTitle>
            <Target className="h-4 w-4 text-[#4B49AC]" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900">{pages.length} Pages</div><p className="text-xs text-gray-500 mt-1">Live landing pages</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#7DA0FA] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-[#7DA0FA]" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900">{totalLeads.toLocaleString()} Leads</div><p className="text-xs text-gray-500 mt-1">Inbound inquiries</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Visitors</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900">{totalVisitors > 0 ? `${(totalVisitors / 1000).toFixed(1)}k` : "0"}</div><p className="text-xs text-purple-600 mt-1">Campaign hits</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900">{pages.filter(p => p.status === "Active").length} Active</div><p className="text-xs text-emerald-600 mt-1">Running now</p></CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search landing pages..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 text-xs" />
        </div>
      </div>

      {filteredPages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="p-4 bg-slate-100 rounded-full"><FileX className="h-10 w-10 text-slate-400" /></div>
          <div className="text-center">
            <p className="text-base font-semibold text-slate-700">No Landing Pages Yet</p>
            <p className="text-sm text-slate-500 mt-1">Create your first lead capture landing page or campaign offer.</p>
          </div>
          <Button onClick={handleOpenAdd} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white text-xs h-9 flex items-center gap-1.5 mt-2">
            <Plus className="h-4 w-4" /> Create First Landing Page
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPages.map(page => (
            <Card key={page.id} className="border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-md flex flex-col justify-between bg-white">
              <div>
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    {page.campaign_name && <Badge className="bg-indigo-50 text-[#4B49AC] border-indigo-100 text-[10px] font-semibold">{page.campaign_name}</Badge>}
                    <Badge className={`text-[10px] ml-auto ${page.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{page.status}</Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">{page.title}</h3>
                </div>
                <CardContent className="space-y-3 py-4">
                  {page.offer_headline && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1 text-xs">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase block">Offer Headline</span>
                      <p className="text-slate-800 font-medium line-clamp-2">{page.offer_headline}</p>
                      {page.target_crop && <span className="text-[11px] text-indigo-700 block pt-1 font-medium">Target: {page.target_crop}</span>}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-center bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                    <div><span className="text-[10px] text-gray-500 block">Leads</span><span className="font-bold text-[#4B49AC] text-sm">{page.total_leads || 0}</span></div>
                    <div><span className="text-[10px] text-gray-500 block">Visitors</span><span className="font-bold text-slate-700 text-sm">{(page.total_visitors || 0) > 999 ? `${((page.total_visitors || 0) / 1000).toFixed(1)}k` : page.total_visitors || 0}</span></div>
                    <div><span className="text-[10px] text-gray-500 block">CVR</span><span className="font-bold text-emerald-600 text-sm">{page.conversion_rate}</span></div>
                  </div>
                </CardContent>
              </div>
              <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                {page.utm_link && (
                  <Button variant="outline" size="sm" onClick={() => handleCopyLink(page.utm_link)} className="h-8 text-xs text-indigo-900 border-indigo-200 hover:bg-indigo-50 flex items-center gap-1">
                    <Copy className="h-3.5 w-3.5" /> Copy Link
                  </Button>
                )}
                <div className="flex items-center gap-1 ml-auto">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(page)} className="h-8 text-xs text-[#4B49AC]"><Edit3 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeletePage(page.id, page.title)} className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#4B49AC] flex items-center gap-2">
              <Target className="h-5 w-5 text-[#7DA0FA]" />
              {editingPage ? "Edit Landing Page" : "Create Lead Generation Landing Page"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">Configure campaign offer headlines, URL slugs and target segments.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div><label className="font-semibold text-slate-700 mb-1 block">Page Title *</label><Input placeholder="e.g. Free Field Trial Guide Download" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="font-semibold text-slate-700 mb-1 block">Campaign Name</label><Input placeholder="Meta Kharif 2026" value={form.campaign_name} onChange={e => setForm({ ...form, campaign_name: e.target.value })} /></div>
              <div><label className="font-semibold text-slate-700 mb-1 block">Target Crop</label><Input placeholder="Wheat, Rice, Sugarcane" value={form.target_crop} onChange={e => setForm({ ...form, target_crop: e.target.value })} /></div>
            </div>
            <div><label className="font-semibold text-slate-700 mb-1 block">URL Slug</label><Input placeholder="/free-trial-guide" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
            <div><label className="font-semibold text-slate-700 mb-1 block">Hero Offer Headline *</label><Textarea rows={2} placeholder="Main offer text above the fold..." value={form.offer_headline} onChange={e => setForm({ ...form, offer_headline: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSavePage} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white">{editingPage ? "Update Page" : "Publish Landing Page"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
