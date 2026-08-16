import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Image as ImageIcon,
  Download,
  Plus,
  Trash2,
  Search,
  Copy,
  Maximize2,
  Loader2,
  Check,
  FileX
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

export interface ImageAssetItem {
  id: string
  title: string
  category: string
  dimensions: string
  file_size: string
  image_url: string
  tags: string[]
  download_count: number
  created_at?: string
}

export function ImagesManager() {
  const [images, setImages] = useState<ImageAssetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [lightboxImage, setLightboxImage] = useState<ImageAssetItem | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<{
    title: string; category: string; dimensions: string
    file_size: string; image_url: string; tags: string
  }>({ title: "", category: "", dimensions: "", file_size: "", image_url: "", tags: "" })

  const { toast } = useToast()

  const fetchImages = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("image_assets")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) {
      console.warn("image_assets fetch error:", error.message)
      setImages([])
    } else {
      setImages((data ?? []) as ImageAssetItem[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchImages()
    const channel = supabase
      .channel("image_assets_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "image_assets" }, fetchImages)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchImages])

  const categories = useMemo(() => {
    const set = new Set(images.map(i => i.category).filter(Boolean))
    return ["all", ...Array.from(set)]
  }, [images])

  const filteredImages = useMemo(() =>
    images.filter(img => {
      const matchSearch = img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (img.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchCategory = selectedCategory === "all" || img.category === selectedCategory
      return matchSearch && matchCategory
    }), [images, searchQuery, selectedCategory])

  const handleDownloadImage = async (img: ImageAssetItem) => {
    try {
      toast({ title: "Downloading Image..." })
      const response = await fetch(img.image_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${img.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      const nextCount = (img.download_count || 0) + 1
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, download_count: nextCount } : i))
      await supabase.from("image_assets").update({ download_count: nextCount }).eq("id", img.id)
      toast({ title: "Download Complete! 🖼️" })
    } catch {
      window.open(img.image_url, "_blank")
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({ title: "Image URL Copied!" })
  }

  const handleSaveImage = async () => {
    if (!form.title || !form.image_url) {
      toast({ title: "Validation Error", description: "Title and Image URL are required.", variant: "destructive" })
      return
    }
    const payload = {
      title: form.title.trim(), category: form.category.trim(),
      dimensions: form.dimensions.trim(), file_size: form.file_size.trim(),
      image_url: form.image_url.trim(),
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      download_count: 0
    }
    const { data, error } = await supabase.from("image_assets").insert(payload).select().single()
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" })
    else if (data) { setImages(prev => [data, ...prev]); toast({ title: "Image Uploaded! 🎨" }) }
    setIsModalOpen(false)
  }

  const handleDeleteImage = async (id: string, title: string) => {
    setImages(prev => prev.filter(i => i.id !== id))
    await supabase.from("image_assets").delete().eq("id", id)
    toast({ title: "Image Deleted", description: `"${title}" removed.` })
  }

  const totalDownloads = useMemo(() => images.reduce((acc, i) => acc + (i.download_count || 0), 0), [images])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#4B49AC]" />
        <p className="text-sm font-medium text-gray-500">Loading Image Assets...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-[#4B49AC]" /> Image Assets & Photography Hub
          </h1>
          <p className="text-sm text-gray-500">High-resolution photography for biotechnology innovations, crop yield comparisons, and infographics.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white text-xs h-9 flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Upload Image
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#4B49AC] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Images</CardTitle>
            <ImageIcon className="h-4 w-4 text-[#4B49AC]" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900">{images.length} Files</div><p className="text-xs text-gray-500 mt-1">High-res photography</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#7DA0FA] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Downloads</CardTitle>
            <Download className="h-4 w-4 text-[#7DA0FA]" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900">{totalDownloads.toLocaleString()}</div><p className="text-xs text-gray-500 mt-1">Across all images</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Max Resolution</CardTitle>
            <Maximize2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900">6000 x 4000</div><p className="text-xs text-purple-600 mt-1">Ultra HD Print</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Compression</CardTitle>
            <Check className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900">WebP</div><p className="text-xs text-emerald-600 mt-1">Lossless CDN</p></CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search images by title or tag..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 text-xs" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(cat => (
            <Badge key={cat} variant={selectedCategory === cat ? "default" : "outline"}
              className={`cursor-pointer text-xs py-1 px-3 ${selectedCategory === cat ? "bg-[#4B49AC] text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
              onClick={() => setSelectedCategory(cat)}>{cat}</Badge>
          ))}
        </div>
      </div>

      {filteredImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="p-4 bg-slate-100 rounded-full"><FileX className="h-10 w-10 text-slate-400" /></div>
          <div className="text-center">
            <p className="text-base font-semibold text-slate-700">No Images Yet</p>
            <p className="text-sm text-slate-500 mt-1">Upload your first high-resolution product or farm photo.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white text-xs h-9 flex items-center gap-1.5 mt-2">
            <Plus className="h-4 w-4" /> Upload First Image
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredImages.map(img => (
            <Card key={img.id} className="border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-md flex flex-col justify-between overflow-hidden group bg-white">
              <div>
                <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                  <img src={img.image_url} alt={img.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => setLightboxImage(img)} className="p-2.5 bg-white/90 hover:bg-white text-slate-900 rounded-full shadow-lg transition-transform hover:scale-110">
                      <Maximize2 className="h-4 w-4 text-[#4B49AC]" />
                    </button>
                    <button onClick={() => handleDownloadImage(img)} className="p-2.5 bg-[#4B49AC] hover:bg-[#3b3a8c] text-white rounded-full shadow-lg transition-transform hover:scale-110">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                  {img.category && <Badge className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] backdrop-blur">{img.category}</Badge>}
                </div>
                <CardContent className="p-3.5 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{img.title}</h3>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
                    {img.dimensions && <span>{img.dimensions}</span>}
                    {img.file_size && <span className="font-semibold text-slate-700">{img.file_size}</span>}
                  </div>
                  {img.tags && img.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {img.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 text-slate-600">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </div>
              <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">{img.download_count || 0} downloads</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleCopyUrl(img.image_url)} className="h-7 w-7 p-0 text-slate-500 hover:text-indigo-600"><Copy className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteImage(img.id, img.title)} className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {lightboxImage && (
        <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">{lightboxImage.title}</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-mono">{lightboxImage.category} • {lightboxImage.dimensions} • {lightboxImage.file_size}</DialogDescription>
            </DialogHeader>
            <div className="my-2 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-2">
              <img src={lightboxImage.image_url} alt={lightboxImage.title} className="max-h-[500px] w-auto object-contain rounded" />
            </div>
            <DialogFooter className="flex items-center justify-between w-full">
              <Button variant="ghost" size="sm" onClick={() => handleCopyUrl(lightboxImage.image_url)}><Copy className="h-4 w-4 mr-1" /> Copy URL</Button>
              <Button size="sm" onClick={() => handleDownloadImage(lightboxImage)} className="bg-[#4B49AC] text-white font-semibold"><Download className="h-4 w-4 mr-1" /> Download</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#4B49AC] flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-[#7DA0FA]" /> Upload New High-Res Image
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">Add product photography, infographics, or farm comparison shots.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div><label className="font-semibold text-slate-700 mb-1 block">Image Title *</label><Input placeholder="e.g. Sugarcane Root Growth Comparison" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="font-semibold text-slate-700 mb-1 block">Category</label><Input placeholder="Farm Yield Results" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
              <div><label className="font-semibold text-slate-700 mb-1 block">Dimensions</label><Input placeholder="3840 x 2160" value={form.dimensions} onChange={e => setForm({ ...form, dimensions: e.target.value })} /></div>
            </div>
            <div><label className="font-semibold text-slate-700 mb-1 block">Image URL *</label><Input placeholder="https://..." value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} /></div>
            <div><label className="font-semibold text-slate-700 mb-1 block">Tags (comma separated)</label><Input placeholder="Sugarcane, Bio-Innovation, Root Growth" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveImage} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white">Upload Image</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
