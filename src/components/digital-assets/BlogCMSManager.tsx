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
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Search,
  Eye,
  Clock,
  User,
  ThumbsUp,
  FileText,
  Loader2,
  FileX
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

export interface BlogArticle {
  id: string
  title: string
  slug: string
  category: string
  excerpt: string
  content: string
  author: string
  read_time: string
  cover_image: string
  published_at: string
  views_count: number
  likes_count: number
  status: "Published" | "Draft"
  created_at?: string
}

export function BlogCMSManager() {
  const [articles, setArticles] = useState<BlogArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null)
  const [form, setForm] = useState<{
    title: string; slug: string; category: string; excerpt: string
    content: string; author: string; read_time: string; cover_image: string
    status: "Published" | "Draft"
  }>({
    title: "", slug: "", category: "", excerpt: "", content: "",
    author: "", read_time: "5 min read", cover_image: "", status: "Published"
  })

  const { toast } = useToast()

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("blog_articles")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) {
      console.warn("blog_articles fetch error:", error.message)
      setArticles([])
    } else {
      setArticles((data ?? []) as BlogArticle[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchArticles()
    const channel = supabase
      .channel("blog_articles_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "blog_articles" }, fetchArticles)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchArticles])

  const categories = useMemo(() => {
    const set = new Set(articles.map(a => a.category).filter(Boolean))
    return ["all", ...Array.from(set)]
  }, [articles])

  const filteredArticles = useMemo(() =>
    articles.filter(a => {
      const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.excerpt || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.author || "").toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory = selectedCategory === "all" || a.category === selectedCategory
      return matchSearch && matchCategory
    }), [articles, searchQuery, selectedCategory])

  const handleOpenAdd = () => {
    setEditingArticle(null)
    setForm({ title: "", slug: "", category: "", excerpt: "", content: "", author: "", read_time: "5 min read", cover_image: "", status: "Published" })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (a: BlogArticle) => {
    setEditingArticle(a)
    setForm({ title: a.title, slug: a.slug, category: a.category || "", excerpt: a.excerpt || "", content: a.content || "", author: a.author || "", read_time: a.read_time || "5 min read", cover_image: a.cover_image || "", status: a.status })
    setIsModalOpen(true)
  }

  const handleSaveArticle = async () => {
    if (!form.title || !form.excerpt) {
      toast({ title: "Validation Error", description: "Title and Excerpt are required.", variant: "destructive" })
      return
    }
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    const payload = {
      title: form.title.trim(), slug,
      category: form.category.trim(), excerpt: form.excerpt.trim(),
      content: form.content.trim(), author: form.author.trim(),
      read_time: form.read_time, cover_image: form.cover_image.trim(),
      status: form.status, published_at: new Date().toISOString().slice(0, 10)
    }
    if (editingArticle) {
      const { data, error } = await supabase.from("blog_articles").update(payload).eq("id", editingArticle.id).select().single()
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" })
      else if (data) { setArticles(prev => prev.map(a => a.id === editingArticle.id ? data : a)); toast({ title: "Article Updated" }) }
    } else {
      const { data, error } = await supabase.from("blog_articles").insert({ ...payload, views_count: 0, likes_count: 0 }).select().single()
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" })
      else if (data) { setArticles(prev => [data, ...prev]); toast({ title: "Article Published!" }) }
    }
    setIsModalOpen(false)
  }

  const handleDeleteArticle = async (id: string, title: string) => {
    setArticles(prev => prev.filter(a => a.id !== id))
    await supabase.from("blog_articles").delete().eq("id", id)
    toast({ title: "Article Deleted", description: `"${title}" removed.` })
  }

  const totalViews = useMemo(() => articles.reduce((acc, a) => acc + (a.views_count || 0), 0), [articles])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#4B49AC]" />
        <p className="text-sm font-medium text-gray-500">Loading Blog Articles...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-[#4B49AC]" /> Blog & Field Publications CMS
          </h1>
          <p className="text-sm text-gray-500">Publish scientific research, farmer case studies, and agronomy reports.</p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white text-xs h-9 flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Write New Article
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#4B49AC] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Publications</CardTitle>
            <BookOpen className="h-4 w-4 text-[#4B49AC]" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900">{articles.length} Articles</div><p className="text-xs text-gray-500 mt-1">Live blog posts</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#7DA0FA] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Reads</CardTitle>
            <Eye className="h-4 w-4 text-[#7DA0FA]" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900">{totalViews > 0 ? `${(totalViews / 1000).toFixed(1)}k` : "0"} Reads</div><p className="text-xs text-gray-500 mt-1">Across all articles</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Topics</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900">{categories.length - 1} Categories</div><p className="text-xs text-purple-600 mt-1">Research & Guides</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Search Index</CardTitle>
            <ThumbsUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900">100% Sync</div><p className="text-xs text-emerald-600 mt-1">Google Indexed</p></CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search articles..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 text-xs" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(cat => (
            <Badge key={cat} variant={selectedCategory === cat ? "default" : "outline"}
              className={`cursor-pointer text-xs py-1 px-3 ${selectedCategory === cat ? "bg-[#4B49AC] text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
              onClick={() => setSelectedCategory(cat)}>
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="p-4 bg-slate-100 rounded-full"><FileX className="h-10 w-10 text-slate-400" /></div>
          <div className="text-center">
            <p className="text-base font-semibold text-slate-700">No Articles Yet</p>
            <p className="text-sm text-slate-500 mt-1">Write your first blog article or research publication.</p>
          </div>
          <Button onClick={handleOpenAdd} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white text-xs h-9 flex items-center gap-1.5 mt-2">
            <Plus className="h-4 w-4" /> Write First Article
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map(article => (
            <Card key={article.id} className="border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-md flex flex-col justify-between overflow-hidden bg-white">
              <div>
                {article.cover_image && (
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img src={article.cover_image} alt={article.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                    {article.category && <Badge className="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] backdrop-blur">{article.category}</Badge>}
                    <Badge className={`absolute top-3 right-3 text-[10px] ${article.status === "Published" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>{article.status}</Badge>
                  </div>
                )}
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    {article.author && <span className="flex items-center gap-1"><User className="h-3 w-3 text-[#4B49AC]" /> {article.author}</span>}
                    {article.read_time && <><span>•</span><span className="flex items-center gap-1"><Clock className="h-3 w-3 text-purple-600" /> {article.read_time}</span></>}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">{article.title}</h3>
                  {article.excerpt && <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{article.excerpt}</p>}
                </CardContent>
              </div>
              <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-600 text-[11px]">
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-slate-400" /> {article.views_count || 0}</span>
                  <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5 text-rose-500" /> {article.likes_count || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(article)} className="h-8 text-xs text-[#4B49AC] hover:bg-[#4B49AC]/10">
                    <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteArticle(article.id, article.title)} className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#4B49AC] flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#7DA0FA]" />
              {editingArticle ? "Edit Article" : "Write & Publish New Article"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">Create educational posts, case studies, and agronomy guides.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div><label className="font-semibold text-slate-700 mb-1 block">Title *</label><Input placeholder="Article title..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="font-semibold text-slate-700 mb-1 block">Category</label><Input placeholder="e.g. Field Science" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
              <div><label className="font-semibold text-slate-700 mb-1 block">Author</label><Input placeholder="Dr. A. Sharma" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} /></div>
            </div>
            <div><label className="font-semibold text-slate-700 mb-1 block">Cover Image URL</label><Input placeholder="https://..." value={form.cover_image} onChange={e => setForm({ ...form, cover_image: e.target.value })} /></div>
            <div><label className="font-semibold text-slate-700 mb-1 block">Excerpt *</label><Textarea rows={2} placeholder="Short summary..." value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} /></div>
            <div><label className="font-semibold text-slate-700 mb-1 block">Full Content</label><Textarea rows={4} placeholder="Full article text..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveArticle} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white">{editingArticle ? "Save Changes" : "Publish Article"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
