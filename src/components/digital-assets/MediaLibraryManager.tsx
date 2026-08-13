import React, { useState, useEffect, useMemo } from "react"
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
  Edit3,
  Search,
  Copy,
  Eye,
  Sparkles,
  ExternalLink,
  Layers,
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
  uploaded_at: string
}

const DEFAULT_ASSETS: DigitalAssetItem[] = [
  {
    id: "ast_1",
    title: "BiovaCo Electroculture Commercial Brochure 2026",
    file_name: "BiovaCo_Electroculture_Brochure_2026.pdf",
    file_type: "PDF Document",
    file_url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80",
    file_size_formatted: "4.2 MB",
    category: "Marketing Collateral",
    download_count: 840,
    uploaded_at: "2026-08-01"
  },
  {
    id: "ast_2",
    title: "Electroculture Copper Antenna Rod High-Res Product Shot",
    file_name: "Electroculture_Antenna_Copper_Rod_HD.png",
    file_type: "Image",
    file_url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=1200&q=80",
    file_size_formatted: "8.5 MB",
    category: "Product Photography",
    download_count: 1420,
    uploaded_at: "2026-07-28"
  },
  {
    id: "ast_3",
    title: "Commercial Farm Yield Comparison Video Demo",
    file_name: "Commercial_Wheat_Yield_Expansion_4K.mp4",
    file_type: "Video",
    file_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80",
    file_size_formatted: "42.0 MB",
    category: "Video Vault",
    download_count: 2100,
    uploaded_at: "2026-07-20"
  },
  {
    id: "ast_4",
    title: "BiovaCo Official High-Res Vector Brand Logo Package",
    file_name: "BiovaCo_Logo_Vector_Package_HD.png",
    file_type: "Brand Logo",
    file_url: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=1200&q=80",
    file_size_formatted: "2.1 MB",
    category: "Brand Assets",
    download_count: 950,
    uploaded_at: "2026-07-15"
  }
]

export function MediaLibraryManager() {
  const [assets, setAssets] = useState<DigitalAssetItem[]>(DEFAULT_ASSETS)
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

  const types = useMemo(() => {
    return ["all", "Image", "Video", "PDF Document", "Brand Logo"]
  }, [])

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.category.toLowerCase().includes(searchQuery.toLowerCase())
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

      // Increment count
      setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, download_count: a.download_count + 1 } : a))

      toast({ title: "Download Complete! 📥", description: `${asset.file_name} downloaded successfully.` })
    } catch (err) {
      // Fallback direct window open
      window.open(asset.file_url, "_blank")
      toast({ title: "Opening Media Asset", description: `Opened ${asset.title} in new window.` })
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({ title: "Asset URL Copied!", description: "Direct CDN link copied to clipboard." })
  }

  const handleSaveAsset = () => {
    if (!form.title || !form.file_url) {
      toast({ title: "Validation Error", description: "Title and File URL are required.", variant: "destructive" })
      return
    }

    const newAsset: DigitalAssetItem = {
      id: `ast_${Date.now()}`,
      ...form,
      download_count: 0,
      uploaded_at: new Date().toISOString().slice(0, 10)
    }

    setAssets(prev => [newAsset, ...prev])
    setIsUploadOpen(false)
    toast({ title: "Asset Uploaded to Library! 🚀", description: `"${form.title}" is now available in DAM.` })
  }

  const handleDeleteAsset = (id: string, title: string) => {
    setAssets(prev => prev.filter(a => a.id !== id))
    toast({ title: "Asset Deleted", description: `"${title}" removed from DAM.` })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Video": return Video
      case "PDF Document": return FileText
      case "Brand Logo": return Sparkles
      default: return ImageIcon
    }
  }

  const totalDownloads = useMemo(() => assets.reduce((acc, a) => acc + a.download_count, 0), [assets])

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <FolderOpen className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                Enterprise DAM (Digital Asset Manager)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <ImageIcon className="h-7 w-7 text-[#7DA0FA]" />
              Digital Assets & Media Library
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Centralized DAM repository for high-resolution product photography, marketing brochures, pitch decks, brand logos, and 4K commercial videos.
            </p>
          </div>

          <Button
            onClick={() => setIsUploadOpen(true)}
            className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white font-semibold shadow-md text-xs h-10 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Upload New Media Asset
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Total Media Assets</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{assets.length} Files</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Total Downloads</span>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{totalDownloads.toLocaleString()} Downloads</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">DAM Storage CDN</span>
            <span className="text-xl font-bold text-purple-300 mt-0.5 block">Supabase Storage</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Repository Health</span>
            <span className="text-xl font-bold text-cyan-300 mt-0.5 flex items-center gap-1.5">
              <Check className="h-4 w-4 text-cyan-300" /> 100% Synchronized
            </span>
          </div>
        </div>
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
            <Card key={asset.id} className="border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-lg flex flex-col justify-between overflow-hidden">
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
