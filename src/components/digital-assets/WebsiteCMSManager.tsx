import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  Search,
  Activity,
  ShieldCheck,
  Zap,
  Loader2,
  Laptop,
  FileX
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
  is_active: boolean
  created_at?: string
}

export function WebsiteCMSManager() {
  const [pages, setPages] = useState<WebsitePageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<WebsitePageItem | null>(null)
  const [form, setForm] = useState<{
    title: string
    slug: string
    status: "Published" | "Draft" | "Maintenance"
    meta_title: string
    meta_description: string
  }>({ title: "", slug: "/", status: "Published", meta_title: "", meta_description: "" })

  const { toast } = useToast()

  const fetchPages = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("website_pages")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.warn("website_pages fetch error:", error.message)
      setPages([])
    } else {
      setPages((data ?? []) as WebsitePageItem[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPages()
    const channel = supabase
      .channel("website_pages_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "website_pages" }, fetchPages)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchPages])

  const filteredPages = useMemo(() =>
    pages.filter(p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.meta_title && p.meta_title.toLowerCase().includes(searchQuery.toLowerCase()))
    ), [pages, searchQuery])

  const handleToggleActive = async (page: WebsitePageItem) => {
    const nextActive = !page.is_active
    const nextStatus: WebsitePageItem["status"] = nextActive ? "Published" : "Draft"
    setPages(prev => prev.map(p => p.id === page.id ? { ...p, is_active: nextActive, status: nextStatus } : p))
    await supabase.from("website_pages").update({ is_active: nextActive, status: nextStatus }).eq("id", page.id)
    toast({ title: "Status Updated", description: `"${page.title}" is now ${nextStatus}.` })
  }

  const handleOpenAdd = () => {
    setEditingPage(null)
    setForm({ title: "", slug: "/", status: "Published", meta_title: "", meta_description: "" })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (page: WebsitePageItem) => {
    setEditingPage(page)
    setForm({ title: page.title, slug: page.slug, status: page.status, meta_title: page.meta_title || "", meta_description: page.meta_description || "" })
    setIsModalOpen(true)
  }

  const handleSavePage = async () => {
    if (!form.title || !form.slug) {
      toast({ title: "Validation Error", description: "Title and Slug are required.", variant: "destructive" })
      return
    }
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      status: form.status,
      meta_title: form.meta_title.trim(),
      meta_description: form.meta_description.trim(),
      is_active: form.status === "Published"
    }
    if (editingPage) {
      const { data, error } = await supabase.from("website_pages").update(payload).eq("id", editingPage.id).select().single()
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }) }
      else if (data) { setPages(prev => prev.map(p => p.id === editingPage.id ? data : p)); toast({ title: "Page Updated" }) }
    } else {
      const { data, error } = await supabase.from("website_pages").insert({ ...payload, monthly_views: 0, conversion_rate: "0%", page_speed_score: 95 }).select().single()
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }) }
      else if (data) { setPages(prev => [data, ...prev]); toast({ title: "Page Published!" }) }
    }
    setIsModalOpen(false)
  }

  const handleDeletePage = async (id: string, title: string) => {
    setPages(prev => prev.filter(p => p.id !== id))
    await supabase.from("website_pages").delete().eq("id", id)
    toast({ title: "Page Removed", description: `"${title}" deleted.` })
  }

  const totalViews = useMemo(() => pages.reduce((acc, p) => acc + (p.monthly_views || 0), 0), [pages])
  const avgSpeed = useMemo(() => pages.length ? Math.round(pages.reduce((acc, p) => acc + (p.page_speed_score || 95), 0) / pages.length) : 0, [pages])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#4B49AC]" />
        <p className="text-sm font-medium text-gray-500">Loading Website Pages...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="h-6 w-6 text-[#4B49AC]" />
            Website & Production CMS
          </h1>
          <p className="text-sm text-gray-500">Manage live production web pages, meta SEO tags, and page performance.</p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white font-semibold text-xs h-9 flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Create Web Page
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#4B49AC] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Web Pages</CardTitle>
            <Globe className="h-4 w-4 text-[#4B49AC]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{pages.length} Pages</div>
            <p className="text-xs text-gray-500 mt-1">Live in production</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#7DA0FA] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monthly Web Traffic</CardTitle>
            <Activity className="h-4 w-4 text-[#7DA0FA]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalViews > 0 ? `${(totalViews / 1000).toFixed(1)}k` : "0"} Views</div>
            <p className="text-xs text-gray-500 mt-1">Across all active pages</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Page Speed</CardTitle>
            <Zap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{avgSpeed > 0 ? `⚡ ${avgSpeed}` : "—"} / 100</div>
            <p className="text-xs text-purple-600 font-medium mt-1">Lighthouse Score</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Domain SSL</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900 truncate">biovaco.in</div>
            <p className="text-xs text-emerald-600 font-semibold mt-1">HTTPS Operational</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search pages, slugs, meta title..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 text-xs" />
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1">{filteredPages.length} of {pages.length} Pages</Badge>
      </div>

      {filteredPages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="p-4 bg-slate-100 rounded-full">
            <FileX className="h-10 w-10 text-slate-400" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-slate-700">No Web Pages Yet</p>
            <p className="text-sm text-slate-500 mt-1">Create your first web page to get started.</p>
          </div>
          <Button onClick={handleOpenAdd} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white text-xs h-9 flex items-center gap-1.5 mt-2">
            <Plus className="h-4 w-4" /> Create First Page
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPages.map(page => (
            <Card key={page.id} className="border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-sm bg-white">
              <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-indigo-50 text-[#4B49AC] rounded-lg border border-indigo-100">
                      <Laptop className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{page.title}</h3>
                        <Badge className={`text-[10px] ${page.status === "Published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{page.status}</Badge>
                      </div>
                      <a href={`https://biovaco.in${page.slug}`} target="_blank" rel="noreferrer"
                        className="text-xs text-[#4B49AC] font-mono hover:underline flex items-center gap-1 mt-0.5">
                        https://biovaco.in{page.slug} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  {page.meta_description && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1 mt-2">
                      <div className="text-slate-700 font-semibold line-clamp-1">{page.meta_title}</div>
                      <div className="text-slate-500 text-[11px] line-clamp-2">{page.meta_description}</div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap md:flex-col items-end gap-3 min-w-[200px] border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                  <div className="flex items-center gap-4 text-xs">
                    <div><span className="text-[10px] text-gray-400 block">Views</span><span className="font-bold text-slate-800">{(page.monthly_views || 0).toLocaleString()}</span></div>
                    <div><span className="text-[10px] text-gray-400 block">CVR</span><span className="font-bold text-emerald-600">{page.conversion_rate}</span></div>
                    <div><span className="text-[10px] text-gray-400 block">Speed</span><span className="font-bold text-purple-600">⚡ {page.page_speed_score}</span></div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Switch checked={page.is_active} onCheckedChange={() => handleToggleActive(page)} />
                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(page)} className="h-8 text-xs text-[#4B49AC] border-[#7DA0FA]/40 hover:bg-[#4B49AC]/10">
                      <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeletePage(page.id, page.title)} className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#4B49AC] flex items-center gap-2">
              <Globe className="h-5 w-5 text-[#7DA0FA]" />
              {editingPage ? "Edit Web Page" : "Create New Web Page"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">Configure page URL slug, title, publish status and meta SEO settings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Page Title *</label>
              <Input placeholder="e.g. About BiovaCo Nexus" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">URL Slug *</label>
                <Input placeholder="/about" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Status</label>
                <select className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            </div>
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Meta SEO Title</label>
              <Input placeholder="Search Engine Title (~60 chars)" value={form.meta_title} onChange={e => setForm({ ...form, meta_title: e.target.value })} />
            </div>
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Meta Description</label>
              <Textarea rows={3} placeholder="Meta description for Google Search..." value={form.meta_description} onChange={e => setForm({ ...form, meta_description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSavePage} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white">{editingPage ? "Update Page" : "Publish Page"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
