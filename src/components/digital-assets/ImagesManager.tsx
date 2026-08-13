import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  Image as ImageIcon,
  Download,
  Plus,
  Trash2,
  Edit3,
  Search,
  Copy,
  Eye,
  Sparkles,
  ExternalLink,
  Maximize2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export interface ImageAssetItem {
  id: string
  title: string
  category: string
  dimensions: string
  file_size: string
  image_url: string
  tags: string[]
  download_count: number
  uploaded_at: string
}

const INITIAL_IMAGES: ImageAssetItem[] = [
  {
    id: "img_1",
    title: "Atmospheric Copper Spiral Antenna Pole Setup",
    category: "Product Hardware",
    dimensions: "3840 x 2160 (4K)",
    file_size: "4.8 MB",
    image_url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=1200&q=80",
    tags: ["Copper Pole", "Antenna", "Hardware"],
    download_count: 1540,
    uploaded_at: "2026-08-01"
  },
  {
    id: "img_2",
    title: "Electroculture Wheat Root Growth Expansion Comparison",
    category: "Farm Yield Results",
    dimensions: "4000 x 3000",
    file_size: "6.2 MB",
    image_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80",
    tags: ["Wheat", "Root Growth", "Comparison"],
    download_count: 2890,
    uploaded_at: "2026-07-26"
  },
  {
    id: "img_3",
    title: "Soil Ionization Voltage Field Diagram Infographic",
    category: "Infographics",
    dimensions: "2400 x 3200",
    file_size: "3.1 MB",
    image_url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80",
    tags: ["Infographic", "Soil Physics", "Diagram"],
    download_count: 1120,
    uploaded_at: "2026-07-18"
  },
  {
    id: "img_4",
    title: "BiovaCo High-Resolution Exhibition Banner",
    category: "Banners & Print",
    dimensions: "6000 x 2000",
    file_size: "12.4 MB",
    image_url: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=1200&q=80",
    tags: ["Banner", "Exhibition", "Print"],
    download_count: 780,
    uploaded_at: "2026-07-10"
  }
]

export function ImagesManager() {
  const [images, setImages] = useState<ImageAssetItem[]>(INITIAL_IMAGES)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [lightboxImage, setLightboxImage] = useState<ImageAssetItem | null>(null)
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<{
    title: string
    category: string
    dimensions: string
    file_size: string
    image_url: string
    tags: string
  }>({
    title: "",
    category: "Product Hardware",
    dimensions: "3840 x 2160",
    file_size: "4.5 MB",
    image_url: "",
    tags: "Electroculture, Farm"
  })

  const { toast } = useToast()

  const categories = useMemo(() => {
    const set = new Set(images.map(i => i.category))
    return ["all", ...Array.from(set)]
  }, [images])

  const filteredImages = useMemo(() => {
    return images.filter(img => {
      const matchSearch = img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          img.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchCategory = selectedCategory === "all" || img.category === selectedCategory
      return matchSearch && matchCategory
    })
  }, [images, searchQuery, selectedCategory])

  // Direct Image File Download
  const handleDownloadImage = async (img: ImageAssetItem) => {
    try {
      toast({ title: "Downloading Image...", description: `Downloading ${img.title}` })
      
      const response = await fetch(img.image_url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `${img.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      setImages(prev => prev.map(i => i.id === img.id ? { ...i, download_count: i.download_count + 1 } : i))
      toast({ title: "Download Complete! 🖼️", description: `${img.title} downloaded.` })
    } catch {
      window.open(img.image_url, "_blank")
      toast({ title: "Opened Image Stream", description: `Opened image in new tab.` })
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({ title: "Image URL Copied!", description: "Direct image URL copied to clipboard." })
  }

  const handleOpenAdd = () => {
    setForm({
      title: "",
      category: "Product Hardware",
      dimensions: "3840 x 2160",
      file_size: "4.5 MB",
      image_url: "",
      tags: "Electroculture, Farm"
    })
    setIsModalOpen(true)
  }

  const handleSaveImage = () => {
    if (!form.title || !form.image_url) {
      toast({ title: "Validation Error", description: "Title and Image URL are required.", variant: "destructive" })
      return
    }

    const newImg: ImageAssetItem = {
      id: `img_${Date.now()}`,
      title: form.title,
      category: form.category,
      dimensions: form.dimensions,
      file_size: form.file_size,
      image_url: form.image_url,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      download_count: 0,
      uploaded_at: new Date().toISOString().slice(0, 10)
    }

    setImages(prev => [newImg, ...prev])
    setIsModalOpen(false)
    toast({ title: "Image Added to Gallery! 🎨", description: `"${form.title}" uploaded.` })
  }

  const handleDeleteImage = (id: string, title: string) => {
    setImages(prev => prev.filter(i => i.id !== id))
    toast({ title: "Image Deleted", description: `"${title}" removed.` })
  }

  const totalDownloads = useMemo(() => images.reduce((acc, i) => acc + i.download_count, 0), [images])

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                Ultra HD Image & Photography Vault
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <ImageIcon className="h-7 w-7 text-[#7DA0FA]" />
              Image Assets & Photography Hub
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              High-resolution commercial photography gallery for electroculture antenna hardware, farm yield comparisons, scientific infographics, and exhibition banners.
            </p>
          </div>

          <Button
            onClick={handleOpenAdd}
            className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white font-semibold shadow-md text-xs h-10 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Upload Image
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Total Images</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{images.length} High-Res Images</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Total Downloads</span>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{totalDownloads.toLocaleString()} Downloads</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Max Resolution</span>
            <span className="text-xl font-bold text-purple-300 mt-0.5 block">6000 x 4000 Ultra HD</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">CDN Optimization</span>
            <span className="text-xl font-bold text-cyan-300 mt-0.5 block">WebP / Lossless</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search images by title or tag..."
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

      {/* Images Masonry/Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredImages.map(img => (
          <Card key={img.id} className="border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-lg flex flex-col justify-between overflow-hidden group">
            <div>
              <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                <img
                  src={img.image_url}
                  alt={img.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setLightboxImage(img)}
                    className="p-2.5 bg-white/90 hover:bg-white text-slate-900 rounded-full shadow-lg transition-transform hover:scale-110"
                    title="Zoom Lightbox"
                  >
                    <Maximize2 className="h-4 w-4 text-[#4B49AC]" />
                  </button>
                  <button
                    onClick={() => handleDownloadImage(img)}
                    className="p-2.5 bg-[#4B49AC] hover:bg-[#3b3a8c] text-white rounded-full shadow-lg transition-transform hover:scale-110"
                    title="Download High-Res"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>

                <Badge className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] backdrop-blur font-medium">
                  {img.category}
                </Badge>
              </div>

              <CardContent className="p-3.5 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 line-clamp-1" title={img.title}>
                  {img.title}
                </h3>

                <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
                  <span>{img.dimensions}</span>
                  <span className="font-semibold text-slate-700">{img.file_size}</span>
                </div>
              </CardContent>
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500 font-medium">
                {img.download_count} downloads
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyUrl(img.image_url)}
                  className="h-7 w-7 p-0 text-slate-500 hover:text-indigo-600"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteImage(img.id, img.title)}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Lightbox Zoom Modal */}
      {lightboxImage && (
        <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">{lightboxImage.title}</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-mono">
                {lightboxImage.category} • {lightboxImage.dimensions} • {lightboxImage.file_size}
              </DialogDescription>
            </DialogHeader>

            <div className="my-2 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-2">
              <img src={lightboxImage.image_url} alt={lightboxImage.title} className="max-h-[500px] w-auto object-contain rounded" />
            </div>

            <DialogFooter className="flex items-center justify-between w-full">
              <Button variant="ghost" size="sm" onClick={() => handleCopyUrl(lightboxImage.image_url)}>
                <Copy className="h-4 w-4 mr-1" /> Copy Image URL
              </Button>
              <Button size="sm" onClick={() => handleDownloadImage(lightboxImage)} className="bg-[#4B49AC] text-white font-semibold">
                <Download className="h-4 w-4 mr-1" /> Download High-Res Image
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Image Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#4B49AC] flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-[#7DA0FA]" />
              Upload New High-Res Image
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Add product photography, infographics, or farm comparison shots.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Image Title *</label>
              <Input
                placeholder="e.g. 100-Acre Sugarcane Root Growth Comparison"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Category</label>
                <Input
                  placeholder="Farm Yield Results"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Dimensions</label>
                <Input
                  placeholder="3840 x 2160"
                  value={form.dimensions}
                  onChange={e => setForm({ ...form, dimensions: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Image CDN URL *</label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={form.image_url}
                onChange={e => setForm({ ...form, image_url: e.target.value })}
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Tags (Comma Separated)</label>
              <Input
                placeholder="Sugarcane, Electroculture, Root Growth"
                value={form.tags}
                onChange={e => setForm({ ...form, tags: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveImage} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white">
              Upload Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
