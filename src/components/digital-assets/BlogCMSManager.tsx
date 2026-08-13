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
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Search,
  Eye,
  Clock,
  Sparkles,
  ExternalLink,
  Tag,
  User,
  Share2,
  ThumbsUp,
  FileText
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
}

const INITIAL_ARTICLES: BlogArticle[] = [
  {
    id: "art_1",
    title: "How Atmospheric Electroculture Increases Crop Yield by 40% Without Chemical Fertilizers",
    slug: "how-electroculture-increases-yield",
    category: "Electroculture Science",
    excerpt: "Comprehensive study on soil charge distribution, root cellular expansion, and ion uptake mechanisms using passive atmospheric copper antennas.",
    content: "Detailed research breakdown of atmospheric voltage harvest...",
    author: "Dr. A. Sharma (Head of R&D)",
    read_time: "6 min read",
    cover_image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80",
    published_at: "2026-08-01",
    views_count: 14200,
    likes_count: 890,
    status: "Published"
  },
  {
    id: "art_2",
    title: "Commercial Wheat Field Trial Results: 100-Acre Case Study in Punjab",
    slug: "punjab-wheat-field-trial",
    category: "Farm Case Studies",
    excerpt: "Field test data showing 38.5% yield surge, 25% lower irrigation requirements, and zero pest infestations over a 120-day growth cycle.",
    content: "Field report from 100-acre commercial trial in Punjab...",
    author: "R. Patel (Agronomy Specialist)",
    read_time: "8 min read",
    cover_image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    published_at: "2026-07-20",
    views_count: 9800,
    likes_count: 615,
    status: "Published"
  },
  {
    id: "art_3",
    title: "Installing Electroculture Antenna Rods: Step-by-Step Installation Guide",
    slug: "electroculture-antenna-installation-guide",
    category: "Guides & Tutorials",
    excerpt: "Learn how to orient magnetic poles, grounding depth, spiral direction, and wire connections for maximum atmospheric energy collection.",
    content: "Step-by-step setup guide for farmers and garden enthusiasts...",
    author: "BiovaCo Technical Team",
    read_time: "5 min read",
    cover_image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80",
    published_at: "2026-07-10",
    views_count: 21500,
    likes_count: 1420,
    status: "Published"
  }
]

export function BlogCMSManager() {
  const [articles, setArticles] = useState<BlogArticle[]>(INITIAL_ARTICLES)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null)
  const [form, setForm] = useState<{
    title: string
    slug: string
    category: string
    excerpt: string
    content: string
    author: string
    read_time: string
    cover_image: string
    status: "Published" | "Draft"
  }>({
    title: "",
    slug: "",
    category: "Electroculture Science",
    excerpt: "",
    content: "",
    author: "BiovaCo Nexus Team",
    read_time: "5 min read",
    cover_image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80",
    status: "Published"
  })

  const { toast } = useToast()

  const categories = useMemo(() => {
    const set = new Set(articles.map(a => a.category))
    return ["all", ...Array.from(set)]
  }, [articles])

  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.author.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory = selectedCategory === "all" || a.category === selectedCategory
      return matchSearch && matchCategory
    })
  }, [articles, searchQuery, selectedCategory])

  const handleOpenAdd = () => {
    setEditingArticle(null)
    setForm({
      title: "",
      slug: "",
      category: "Electroculture Science",
      excerpt: "",
      content: "",
      author: "BiovaCo Nexus Team",
      read_time: "5 min read",
      cover_image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80",
      status: "Published"
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (article: BlogArticle) => {
    setEditingArticle(article)
    setForm({
      title: article.title,
      slug: article.slug,
      category: article.category,
      excerpt: article.excerpt,
      content: article.content,
      author: article.author,
      read_time: article.read_time,
      cover_image: article.cover_image,
      status: article.status
    })
    setIsModalOpen(true)
  }

  const handleSaveArticle = () => {
    if (!form.title || !form.excerpt) {
      toast({ title: "Validation Error", description: "Title and Excerpt are required.", variant: "destructive" })
      return
    }

    const generatedSlug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

    if (editingArticle) {
      setArticles(prev => prev.map(a => a.id === editingArticle.id ? {
        ...a,
        ...form,
        slug: generatedSlug
      } : a))
      toast({ title: "Article Updated", description: `"${form.title}" saved.` })
    } else {
      const newArticle: BlogArticle = {
        id: `art_${Date.now()}`,
        ...form,
        slug: generatedSlug,
        published_at: new Date().toISOString().slice(0, 10),
        views_count: Math.floor(Math.random() * 500) + 100,
        likes_count: Math.floor(Math.random() * 50) + 10
      }
      setArticles(prev => [newArticle, ...prev])
      toast({ title: "Article Published!", description: `"${form.title}" is now live on the blog.` })
    }
    setIsModalOpen(false)
  }

  const handleDeleteArticle = (id: string, title: string) => {
    setArticles(prev => prev.filter(a => a.id !== id))
    toast({ title: "Article Deleted", description: `"${title}" removed.` })
  }

  const totalViews = useMemo(() => articles.reduce((acc, a) => acc + a.views_count, 0), [articles])

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
                Blog & Editorial CMS Engine
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <BookOpen className="h-7 w-7 text-[#7DA0FA]" />
              Blog & Field Publications CMS
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Publish scientific research, farmer case studies, installation guides, and product announcements to the official BiovaCo blog.
            </p>
          </div>

          <Button
            onClick={handleOpenAdd}
            className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white font-semibold shadow-md text-xs h-10 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Write New Article
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Total Articles</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{articles.length} Publications</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Total Article Reads</span>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{(totalViews / 1000).toFixed(1)}k Reads</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Categories Covered</span>
            <span className="text-xl font-bold text-purple-300 mt-0.5 block">{categories.length - 1} Scientific Topics</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Publication Status</span>
            <span className="text-xl font-bold text-cyan-300 mt-0.5 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-cyan-300" />
              100% Live Index
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search articles by title, excerpt, or author..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {categories.map(cat => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className={`cursor-pointer text-xs py-1 px-3 capitalize ${
                selectedCategory === cat ? "bg-[#4B49AC] text-white" : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map(article => (
          <Card key={article.id} className="border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-lg flex flex-col justify-between overflow-hidden">
            <div>
              <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                <img
                  src={article.cover_image}
                  alt={article.title}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <Badge className="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] backdrop-blur font-medium">
                  {article.category}
                </Badge>
                <Badge className={`absolute top-3 right-3 text-[10px] ${
                  article.status === "Published" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                }`}>
                  {article.status}
                </Badge>
              </div>

              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1"><User className="h-3 w-3 text-[#4B49AC]" /> {article.author}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-purple-600" /> {article.read_time}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug hover:text-[#4B49AC] transition-colors cursor-pointer">
                  {article.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {article.excerpt}
                </p>
              </CardContent>
            </div>

            <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3 text-slate-600 text-[11px]">
                <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-slate-400" /> {article.views_count}</span>
                <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5 text-rose-500" /> {article.likes_count}</span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(article)}
                  className="h-8 text-xs text-[#4B49AC] hover:bg-[#4B49AC]/10"
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteArticle(article.id, article.title)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add / Edit Article Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#4B49AC] flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#7DA0FA]" />
              {editingArticle ? "Edit Blog Article" : "Write & Publish New Scientific Article"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Create educational electroculture posts, case studies, and agronomy guides for farmers and researchers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Article Title *</label>
              <Input
                placeholder="e.g. Soil Ionization & Root Yield Expansion Mechanics"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Category</label>
                <Input
                  placeholder="Electroculture Science"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Author Name</label>
                <Input
                  placeholder="Dr. A. Sharma"
                  value={form.author}
                  onChange={e => setForm({ ...form, author: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Cover Image URL</label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={form.cover_image}
                onChange={e => setForm({ ...form, cover_image: e.target.value })}
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Short Summary / Excerpt *</label>
              <Textarea
                rows={2}
                placeholder="Brief 2-3 sentence overview for the article preview card..."
                value={form.excerpt}
                onChange={e => setForm({ ...form, excerpt: e.target.value })}
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Full Article Content (Markdown / Text)</label>
              <Textarea
                rows={5}
                placeholder="Write full article body text, headings, and key takeaways..."
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveArticle} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white">
              {editingArticle ? "Save Changes" : "Publish Article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
