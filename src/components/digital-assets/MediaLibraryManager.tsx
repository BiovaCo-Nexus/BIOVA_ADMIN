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
  FileDown,
  FileX
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

export function MediaLibraryManager() {
  const [assets, setAssets] = useState<DigitalAssetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [previewAsset, setPreviewAsset] = useState<DigitalAssetItem | null>(null)

  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [form, setForm] = useState<{
    title: string; file_name: string
    file_type: "Image" | "Video" | "PDF Document" | "Brand Logo" | "Presentation"
    file_url: string; category: string; file_size_formatted: string
  }>({ title: "", file_name: "", file_type: "Image", file_url: "", category: "", file_size_formatted: "" })

  const { toast } = useToast()

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("digital_assets")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) {
      console.warn("digital_assets fetch error:", error.message)
      setAssets([])
    } else {
      setAssets((data ?? []) as DigitalAssetItem[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAssets()
    const channel = supabase
      .channel("digital_assets_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "digital_assets" }, fetchAssets)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchAssets])

  const types = ["all", "Image", "Video", "PDF Document", "Brand Logo"]

  const filteredAssets = useMemo(() =>
    assets.filter(a => {
      const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.file_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.category || "").toLowerCase().includes(searchQuery.toLowerCase())
      const matchType = selectedType === "all" || a.file_type === selectedType
      return matchSearch && matchType
    }), [assets, searchQuery, selectedType])

  const handleDownloadAsset = async (asset: DigitalAssetItem) => {
    try {
      toast({ title: "Downloading Asset..." })
      const response = await fetch(asset.file_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = asset.file_name || "digital_asset"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      const nextCount = (asset.download_count || 0) + 1
      setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, download_count: nextCount } : a))
      await supabase.from("digital_assets").update({ download_count: nextCount }).eq("id", asset.id)
      toast({ title: "Download Complete! 📥" })
    } catch {
      window.open(asset.file_url, "_blank")
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({ title: "Asset URL Copied!" })
  }

  const handleSaveAsset = async () => {
    if (!form.title || !form.file_url) {
      toast({ title: "Validation Error", description: "Title and File URL are required.", variant: "destructive" })
      return
    }
    const payload = {
      title: form.title.trim(), file_name: form.file_name.trim(),
      file_type: form.file_type, file_url: form.file_url.trim(),
      category: form.category.trim(), file_size_formatted: form.file_size_formatted,
      download_count: 0
    }
    const { data, error } = await supabase.from("digital_assets").insert(payload).select().single()
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" })
    else if (data) { setAssets(prev => [data, ...prev]); toast({ title: "Asset Uploaded! 🚀" }) }
    setIsUploadOpen(false)
  }

  const handleDeleteAsset = async (id: string, title: string) => {
    setAssets(prev => prev.filter(a => a.id !== id))
    await supabase.from("digital_assets").delete().eq("id", id)
    toast({ title: "Asset Deleted", description: `"${title}" removed.` })
  }

  const getTypeIcon = (type: string) => {
    if (type === "Video") return Video
    if (type === "PDF Document") return FileText
    if (type === "Brand Logo") return Sparkles
    return ImageIcon
  }

  const totalDownloads = useMemo(() => assets.reduce((acc, a) => acc + (a.download_count || 0), 0), [assets])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#4B49AC]" />
        <p className="text-sm font-medium text-gray-500">Loading Media Library...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-[#4B49AC]" /> Digital Assets & Media Library (DAM)
          </h1>
          <p className="text-sm text-gray-500">Centralized repository for product photography, brochures, brand logos, and videos.</p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white text-xs h-9 flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Upload Media Asset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#4B49AC] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Assets</CardTitle>
            <FolderOpen className="h-4 w-4 text-[#4B49AC]" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900">{assets.length} Files</div><p className="text-xs text-gray-500 mt-1">In media library</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#7DA0FA] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Downloads</CardTitle>
            <Download className="h-4 w-4 text-[#7DA0FA]" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900">{totalDownloads.toLocaleString()}</div><p className="text-xs text-gray-500 mt-1">Across all files</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Storage CDN</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900">Supabase DB</div><p className="text-xs text-purple-600 mt-1">Cloud Bucket</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle>
            <Check className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-gray-900">100% Sync</div><p className="text-xs text-emerald-600 mt-1">Realtime</p></CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search assets..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 text-xs" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {types.map(t => (
            <Badge key={t} variant={selectedType === t ? "default" : "outline"}
              className={`cursor-pointer text-xs py-1 px-3 ${selectedType === t ? "bg-[#4B49AC] text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
              onClick={() => setSelectedType(t)}>{t}</Badge>
          ))}
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="p-4 bg-slate-100 rounded-full"><FileX className="h-10 w-10 text-slate-400" /></div>
          <div className="text-center">
            <p className="text-base font-semibold text-slate-700">No Media Assets Yet</p>
            <p className="text-sm text-slate-500 mt-1">Upload your first media file to the digital asset library.</p>
          </div>
          <Button onClick={() => setIsUploadOpen(true)} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white text-xs h-9 flex items-center gap-1.5 mt-2">
            <Plus className="h-4 w-4" /> Upload First Asset
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAssets.map(asset => {
            const IconComp = getTypeIcon(asset.file_type)
            return (
              <Card key={asset.id} className="border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-md flex flex-col justify-between overflow-hidden bg-white">
                <div>
                  <div className="relative h-40 w-full bg-slate-900 overflow-hidden flex items-center justify-center group">
                    {(asset.file_type === "Image" || asset.file_type === "Brand Logo") && asset.file_url ? (
                      <img src={asset.file_url} alt={asset.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <IconComp className="h-10 w-10 text-[#7DA0FA]" />
                        <span className="text-xs font-semibold text-slate-300">{asset.file_type}</span>
                      </div>
                    )}
                    {asset.category && <Badge className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] backdrop-blur">{asset.category}</Badge>}
                    <button onClick={() => setPreviewAsset(asset)} className="absolute inset-0 bg-slate-950/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-xs font-semibold">
                      <Eye className="h-4 w-4 text-[#7DA0FA]" /> Preview
                    </button>
                  </div>
                  <CardContent className="p-3.5 space-y-2">
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{asset.title}</h3>
                    {asset.file_name && (
                      <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="truncate max-w-[140px]">{asset.file_name}</span>
                        {asset.file_size_formatted && <span className="font-semibold text-slate-700">{asset.file_size_formatted}</span>}
                      </div>
                    )}
                  </CardContent>
                </div>
                <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] text-slate-500">{asset.download_count || 0} downloads</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleCopyUrl(asset.file_url)} className="h-7 w-7 p-0 text-slate-500 hover:text-indigo-600"><Copy className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteAsset(asset.id, asset.title)} className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" onClick={() => handleDownloadAsset(asset)} className="h-7 px-2.5 text-xs bg-[#4B49AC] hover:bg-[#3b3a8c] text-white font-semibold flex items-center gap-1">
                      <Download className="h-3 w-3" /> Download
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {previewAsset && (
        <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">{previewAsset.title}</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-mono">{previewAsset.file_name} • {previewAsset.file_size_formatted} • {previewAsset.category}</DialogDescription>
            </DialogHeader>
            <div className="my-2 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-4 min-h-[300px]">
              {(previewAsset.file_type === "Image" || previewAsset.file_type === "Brand Logo") ? (
                <img src={previewAsset.file_url} alt={previewAsset.title} className="max-h-[400px] w-auto object-contain rounded" />
              ) : (
                <div className="text-center space-y-3 text-slate-300">
                  <FileText className="h-16 w-16 mx-auto text-[#7DA0FA]" />
                  <p className="text-sm font-semibold">{previewAsset.title}</p>
                </div>
              )}
            </div>
            <DialogFooter className="flex items-center justify-between w-full">
              <Button variant="ghost" size="sm" onClick={() => handleCopyUrl(previewAsset.file_url)}><Copy className="h-4 w-4 mr-1" /> Copy URL</Button>
              <Button size="sm" onClick={() => handleDownloadAsset(previewAsset)} className="bg-[#4B49AC] text-white font-semibold"><FileDown className="h-4 w-4 mr-1" /> Download</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#4B49AC] flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-[#7DA0FA]" /> Upload New Media Asset
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">Add photos, video demos, or PDF brochures to the DAM.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div><label className="font-semibold text-slate-700 mb-1 block">Title *</label><Input placeholder="e.g. Product Brochure 2026" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Asset Type</label>
                <select className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs" value={form.file_type} onChange={e => setForm({ ...form, file_type: e.target.value as any })}>
                  <option value="Image">Image</option>
                  <option value="Video">Video</option>
                  <option value="PDF Document">PDF Document</option>
                  <option value="Brand Logo">Brand Logo</option>
                  <option value="Presentation">Presentation</option>
                </select>
              </div>
              <div><label className="font-semibold text-slate-700 mb-1 block">Category</label><Input placeholder="Marketing Collateral" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
            </div>
            <div><label className="font-semibold text-slate-700 mb-1 block">File URL *</label><Input placeholder="https://..." value={form.file_url} onChange={e => setForm({ ...form, file_url: e.target.value })} /></div>
            <div><label className="font-semibold text-slate-700 mb-1 block">File Name</label><Input placeholder="brochure.pdf" value={form.file_name} onChange={e => setForm({ ...form, file_name: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveAsset} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white">Upload & Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
