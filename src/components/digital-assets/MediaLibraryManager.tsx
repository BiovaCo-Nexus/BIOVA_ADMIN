import React, { useState, useEffect, useMemo, useCallback } from "react"
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
  Video,
  FileText,
  Download,
  Plus,
  Trash2,
  Search,
  Copy,
  Eye,
  Sparkles,
  FolderOpen,
  Check,
  Loader2,
  FileDown
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

export interface DigitalAssetItem {
  id: string
  title: string
  file_name: string
  file_type: "Image" | "Video" | "PDF Document" | "Brand Logo" | "Presentation"
  file_url: string
  file_size_formatted: string
  category: string
  download_count: number
  created_at?: string
}

const DEFAULT_SEED_ASSETS: Omit<DigitalAssetItem, "id">[] = [
  {
    title: "BiovaCo Electroculture Commercial Brochure 2026",
    file_name: "BiovaCo_Electroculture_Brochure_2026.pdf",
    file_type: "PDF Document",
    file_url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80",
    file_size_formatted: "4.2 MB",
    category: "Marketing Collateral",
    download_count: 840
  },
  {
    title: "Electroculture Copper Antenna Rod High-Res Product Shot",
    file_name: "Electroculture_Antenna_Copper_Rod_HD.png",
    file_type: "Image",
    file_url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=1200&q=80",
    file_size_formatted: "8.5 MB",
    category: "Product Photography",
    download_count: 1420
  },
  {
    title: "Commercial Farm Yield Comparison Video Demo",
    file_name: "Commercial_Wheat_Yield_Expansion_4K.mp4",
    file_type: "Video",
    file_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80",
    file_size_formatted: "42.0 MB",
    category: "Video Vault",
    download_count: 2100
  },
  {
    title: "BiovaCo Official High-Res Vector Brand Logo Package",
    file_name: "BiovaCo_Logo_Vector_Package_HD.png",
    file_type: "Brand Logo",
    file_url: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=1200&q=80",
    file_size_formatted: "2.1 MB",
    category: "Brand Assets",
    download_count: 950
  }
]

export function MediaLibraryManager() {
  const [assets, setAssets] = useState<DigitalAssetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [previewAsset, setPreviewAsset] = useState<DigitalAssetItem | null>(null)
  
  // Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [form, setForm] = useState<{
    title: string
    file_name: string
    file_type: "Image" | "Video" | "PDF Document" | "Brand Logo" | "Presentation"
    file_url: string
    category: string
    file_size_formatted: string
  }>({
    title: "",
    file_name: "asset_file.png",
    file_type: "Image",
    file_url: "",
    category: "General Asset",
    file_size_formatted: "3.5 MB"
  })

  const { toast } = useToast()

  // Real DB Fetching from Supabase
  const fetchAssets = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("digital_assets")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.warn("digital_assets fetch error:", error.message)
      setAssets(DEFAULT_SEED_ASSETS.map((d, i) => ({ ...d, id: `def_${i}` })) as DigitalAssetItem[])
    } else if (!data || data.length === 0) {
      const seeded: DigitalAssetItem[] = []
      for (const item of DEFAULT_SEED_ASSETS) {
        const { data: inserted } = await supabase
          .from("digital_assets")
          .insert(item)
          .select()
          .single()
        if (inserted) seeded.push(inserted)
      }
      setAssets(seeded.length > 0 ? seeded : DEFAULT_SEED_ASSETS.map((d, i) => ({ ...d, id: `def_${i}` })) as DigitalAssetItem[])
    } else {
      setAssets(data as DigitalAssetItem[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAssets()

    const channel = supabase
      .channel("digital_assets_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "digital_assets" }, fetchAssets)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAssets])

  const types = useMemo(() => {
    return ["all", "Image", "Video", "PDF Document", "Brand Logo"]
  }, [])

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (a.category && a.category.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchType = selectedType === "all" || a.file_type === selectedType
      return matchSearch && matchType
    })
  }, [assets, searchQuery, selectedType])

  // Direct File Download Handler
  const handleDownloadAsset = async (asset: DigitalAssetItem) => {
    try {
      toast({ title: "Downloading Asset...", description: `Initiated download for ${asset.file_name}` })
      
      const response = await fetch(asset.file_url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = asset.file_name || "digital_asset"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      // Update count in state and Supabase
      const nextCount = (asset.download_count || 0) + 1
      setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, download_count: nextCount } : a))
      if (!asset.id.startsWith("def_")) {
        await supabase.from("digital_assets").update({ download_count: nextCount }).eq("id", asset.id)
      }

      toast({ title: "Download Complete! 📥", description: `${asset.file_name} downloaded successfully.` })
    } catch {
      window.open(asset.file_url, "_blank")
      toast({ title: "Opening Media Asset", description: `Opened ${asset.title} in new window.` })
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({ title: "Asset URL Copied!", description: "Direct CDN link copied to clipboard." })
  }

  const handleSaveAsset = async () => {
    if (!form.title || !form.file_url) {
      toast({ title: "Validation Error", description: "Title and File URL are required.", variant: "destructive" })
      return
    }

    const payload = {
      title: form.title.trim(),
      file_name: form.file_name.trim(),
      file_type: form.file_type,
      file_url: form.file_url.trim(),
      category: form.category.trim(),
      file_size_formatted: form.file_size_formatted,
      download_count: 0
    }

    const { data, error } = await supabase
      .from("digital_assets")
      .insert(payload)
      .select()
      .single()

    if (error) {
      const localObj = { ...payload, id: `local_${Date.now()}` }
      setAssets(prev => [localObj as any, ...prev])
      toast({ title: "Asset Added", description: `"${payload.title}" created.` })
    } else if (data) {
      setAssets(prev => [data, ...prev])
      toast({ title: "Asset Uploaded to DAM! 🚀", description: `"${data.title}" saved in database.` })
    }

    setIsUploadOpen(false)
  }

  const handleDeleteAsset = async (id: string, title: string) => {
    setAssets(prev => prev.filter(a => a.id !== id))
    if (!id.startsWith("def_") && !id.startsWith("local_")) {
      await supabase.from("digital_assets").delete().eq("id", id)
    }
    toast({ title: "Asset Deleted", description: `"${title}" removed.` })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Video": return Video
      case "PDF Document": return FileText
      case "Brand Logo": return Sparkles
      default: return ImageIcon
    }
  }

  const totalDownloads = useMemo(() => assets.reduce((acc, a) => acc + (a.download_count || 0), 0), [assets])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#4B49AC]" />
        <p className="text-sm font-medium text-gray-500">Loading Digital Media Library...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portal Standard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-[#4B49AC]" />
            Digital Assets & Media Library (DAM)
          </h1>
          <p className="text-sm text-gray-500">Centralized repository for product photography, brochures, pitch decks, brand logos, and 4K videos.</p>
        </div>

        <Button
          onClick={() => setIsUploadOpen(true)}
          className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white font-semibold text-xs h-9 flex items-center gap-1.5 shadow-2xs"
        >
          <Plus className="h-4 w-4" />
          Upload New Media Asset
        </Button>
      </div>

      {/* Portal Standard Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#4B49AC] shadow-2xs bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Media Assets</CardTitle>
            <FolderOpen className="h-4 w-4 text-[#4B49AC]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{assets.length} Files</div>
            <p className="text-xs text-gray-500 mt-1">In media library</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#7DA0FA] shadow-2xs bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-[#7DA0FA]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalDownloads.toLocaleString()} Downloads</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">Across all files</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-2xs bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">DAM Storage CDN</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">Supabase DB</div>
            <p className="text-xs text-purple-600 font-medium mt-1">Cloud Bucket Linked</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-2xs bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Repository Status</CardTitle>
            <Check className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">100% Sync</div>
            <p className="text-xs text-emerald-600 font-semibold mt-1">Realtime Multi-user</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search media by title, filename, or category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {types.map(t => (
            <Badge
              key={t}
              variant={selectedType === t ? "default" : "outline"}
              className={`cursor-pointer text-xs py-1 px-3 capitalize ${
                selectedType === t ? "bg-[#4B49AC] text-white" : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
              onClick={() => setSelectedType(t)}
            >
              {t}
            </Badge>
          ))}
        </div>
      </div>

      {/* Media Assets Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAssets.map(asset => {
          const IconComp = getTypeIcon(asset.file_type)

          return (
            <Card key={asset.id} className="border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-md flex flex-col justify-between overflow-hidden bg-white">
              <div>
                <div className="relative h-40 w-full bg-slate-900 overflow-hidden flex items-center justify-center group">
                  {asset.file_type === "Image" || asset.file_type === "Brand Logo" ? (
                    <img
                      src={asset.file_url}
                      alt={asset.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <IconComp className="h-10 w-10 text-[#7DA0FA]" />
                      <span className="text-xs font-semibold text-slate-300">{asset.file_type}</span>
                    </div>
                  )}

                  <Badge className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] backdrop-blur font-medium">
                    {asset.category}
                  </Badge>

                  {/* Hover Quick Preview Button */}
                  <button
                    onClick={() => setPreviewAsset(asset)}
                    className="absolute inset-0 bg-slate-950/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-xs font-semibold"
                  >
                    <Eye className="h-4 w-4 text-[#7DA0FA]" /> Quick Preview
                  </button>
                </div>

                <CardContent className="p-3.5 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1" title={asset.title}>
                    {asset.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="truncate max-w-[140px]" title={asset.file_name}>{asset.file_name}</span>
                    <span className="font-semibold text-slate-700">{asset.file_size_formatted}</span>
                  </div>
                </CardContent>
              </div>

              <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-slate-500 font-medium">
                  {asset.download_count} downloads
                </span>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyUrl(asset.file_url)}
                    className="h-7 w-7 p-0 text-slate-500 hover:text-indigo-600"
                    title="Copy URL"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAsset(asset.id, asset.title)}
                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                    title="Delete Asset"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleDownloadAsset(asset)}
                    className="h-7 px-2.5 text-xs bg-[#4B49AC] hover:bg-[#3b3a8c] text-white font-semibold flex items-center gap-1 shadow-2xs"
                  >
                    <Download className="h-3 w-3" /> Download
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Preview Lightbox Modal */}
      {previewAsset && (
        <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">{previewAsset.title}</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-mono">
                {previewAsset.file_name} • {previewAsset.file_size_formatted} • {previewAsset.category}
              </DialogDescription>
            </DialogHeader>

            <div className="my-2 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-4 min-h-[300px]">
              {previewAsset.file_type === "Image" || previewAsset.file_type === "Brand Logo" ? (
                <img src={previewAsset.file_url} alt={previewAsset.title} className="max-h-[400px] w-auto object-contain rounded" />
              ) : (
                <div className="text-center space-y-3 text-slate-300">
                  <FileText className="h-16 w-16 mx-auto text-[#7DA0FA]" />
                  <p className="text-sm font-semibold">{previewAsset.title}</p>
                  <p className="text-xs text-slate-400 font-mono">{previewAsset.file_url}</p>
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between w-full">
              <Button variant="ghost" size="sm" onClick={() => handleCopyUrl(previewAsset.file_url)}>
                <Copy className="h-4 w-4 mr-1" /> Copy CDN URL
              </Button>
              <Button size="sm" onClick={() => handleDownloadAsset(previewAsset)} className="bg-[#4B49AC] text-white font-semibold">
                <FileDown className="h-4 w-4 mr-1" /> Download File Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload Asset Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#4B49AC] flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-[#7DA0FA]" />
              Upload New Media Asset to DAM
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Add high-res product photos, video demos, or marketing PDF brochures to the central Digital Asset Management CDN.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Asset Title *</label>
              <Input
                placeholder="e.g. Electroculture Field Trial Brochure 2026"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Asset Type</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs shadow-2xs focus:outline-hidden"
                  value={form.file_type}
                  onChange={e => setForm({ ...form, file_type: e.target.value as any })}
                >
                  <option value="Image">Image</option>
                  <option value="Video">Video</option>
                  <option value="PDF Document">PDF Document</option>
                  <option value="Brand Logo">Brand Logo</option>
                  <option value="Presentation">Presentation</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Category</label>
                <Input
                  placeholder="e.g. Marketing Collateral"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">File CDN / Image URL *</label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={form.file_url}
                onChange={e => setForm({ ...form, file_url: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveAsset} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white">
              Upload & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
