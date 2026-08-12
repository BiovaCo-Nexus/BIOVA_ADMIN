import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Image as ImageIcon, Plus, Search, Edit3, Trash2, Eye, FileText, Video, Film, Award, Box, Link as LinkIcon, Upload, Loader2, Download, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useMarketingStore } from "./useMarketingStore"
import { supabase } from "@/integrations/supabase/client"
import type { MktCreativeAsset, AssetType, AssetStatus } from "./marketingTypes"

const ASSET_TYPES: AssetType[] = [
  "Product Photos", "Product Videos", "Reels", "Posters", "Logos", "Brand Assets", "Templates", "Campaign Assets"
]

export function CreativeAssets() {
  const store = useMarketingStore()
  const { toast } = useToast()

  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [campaignFilter, setCampaignFilter] = useState<string>("all")
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<MktCreativeAsset | null>(null)
  const [detailAsset, setDetailAsset] = useState<MktCreativeAsset | null>(null)

  // Form State
  const [name, setName] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")
  const [assetType, setAssetType] = useState<AssetType>("Product Photos")
  const [campaignId, setCampaignId] = useState("")
  const [product, setProduct] = useState("")
  const [version, setVersion] = useState("v1")
  const [createdBy, setCreatedBy] = useState("")
  const [status, setStatus] = useState<AssetStatus>("Approved")
  const [uploading, setUploading] = useState(false)

  const resetForm = () => {
    setEditing(null); setName(""); setPreviewUrl(""); setAssetType("Product Photos"); setCampaignId("")
    setProduct(""); setVersion("v1"); setCreatedBy(""); setStatus("Approved"); setUploading(false)
  }

  const openCreate = () => { resetForm(); setIsModalOpen(true) }

  const openEdit = (a: MktCreativeAsset) => {
    setEditing(a); setName(a.name); setPreviewUrl(a.previewUrl || ""); setAssetType(a.assetType)
    setCampaignId(a.campaignId); setProduct(a.product); setVersion(a.version)
    setCreatedBy(a.createdBy); setStatus(a.status)
    setIsModalOpen(true)
  }

  // Download Asset Image/File directly to computer
  const handleDownloadAsset = async (asset: MktCreativeAsset) => {
    if (!asset.previewUrl) {
      toast({ title: "No Image Link", description: "This asset does not have a downloadable photo attached.", variant: "destructive" })
      return
    }

    try {
      if (asset.previewUrl.startsWith("data:")) {
        const a = document.createElement("a")
        a.href = asset.previewUrl
        a.download = `${asset.name.replace(/[^a-zA-Z0-9]/g, "_")}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        toast({ title: "Image Downloaded 📥", description: `"${asset.name}" downloaded.` })
      } else {
        const response = await fetch(asset.previewUrl)
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = blobUrl
        a.download = `${asset.name.replace(/[^a-zA-Z0-9]/g, "_")}.${blob.type.split('/')[1] || 'png'}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(blobUrl)
        toast({ title: "Image Downloaded 📥", description: `"${asset.name}" downloaded.` })
      }
    } catch {
      // Direct anchor download fallback
      const a = document.createElement("a")
      a.href = asset.previewUrl
      a.download = `${asset.name.replace(/[^a-zA-Z0-9]/g, "_")}`
      a.target = "_blank"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast({ title: "Downloading Asset", description: "Asset download initiated." })
    }
  }

  // Convert File to Base64 Data URL for 100% Database Persistence
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`
      const filePath = `assets/${fileName}`

      // Attempt Supabase Storage Upload
      const { data, error } = await supabase.storage.from("marketing_assets").upload(filePath, file)

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage.from("marketing_assets").getPublicUrl(filePath)
        setPreviewUrl(publicUrlData.publicUrl)
        toast({ title: "Uploaded to Storage! 🖼️", description: "Image saved in Supabase storage bucket." })
      } else {
        // Fallback to permanent Base64 Data URL (saved straight into Supabase DB table)
        const base64Url = await fileToBase64(file)
        setPreviewUrl(base64Url)
        toast({ title: "Image Encoded for Database 💾", description: "Image ready to save into database." })
      }
    } catch {
      try {
        const base64Url = await fileToBase64(file)
        setPreviewUrl(base64Url)
        toast({ title: "Image Ready", description: "Image file processed for database." })
      } catch {
        toast({ title: "Upload Error", description: "Failed to process image file.", variant: "destructive" })
      }
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Asset Name Required", description: "Please enter an asset name.", variant: "destructive" })
      return
    }

    const payload: Omit<MktCreativeAsset, "id" | "uploadDate" | "usedInContentIds"> = {
      name: name.trim(), previewUrl: previewUrl.trim(), assetType, campaignId, product: product.trim(),
      version: version.trim() || "v1", createdBy: createdBy.trim() || "Marketing Team", status
    }

    if (editing) {
      await store.updateAsset(editing.id, payload)
      toast({ title: "Asset Updated 💾", description: `"${name}" saved to database.` })
    } else {
      await store.addAsset({
        id: `ast_${Date.now()}`,
        ...payload,
        uploadDate: new Date().toISOString().slice(0, 10),
        usedInContentIds: []
      })
      toast({ title: "Saved to Database! 🎨", description: `"${name}" saved permanently.` })
    }

    setIsModalOpen(false); resetForm()
  }

  const handleDelete = async (a: MktCreativeAsset) => {
    if (!confirm(`Delete asset "${a.name}"?`)) return
    await store.deleteAsset(a.id)
    toast({ title: "Asset Deleted", description: `"${a.name}" removed from database.` })
  }

  const filteredAssets = useMemo(() => {
    return store.creativeAssets.filter(a => {
      const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
                          a.product.toLowerCase().includes(search.toLowerCase()) ||
                          a.createdBy.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === "all" || a.assetType === typeFilter
      const matchCampaign = campaignFilter === "all" || a.campaignId === campaignFilter

      return matchSearch && matchType && matchCampaign
    })
  }, [store.creativeAssets, search, typeFilter, campaignFilter])

  const getAssetIcon = (type: AssetType) => {
    switch (type) {
      case "Product Videos": return Video
      case "Reels": return Film
      case "Posters": return ImageIcon
      case "Logos": return Award
      case "Brand Assets": return Box
      default: return ImageIcon
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-[#4B49AC]" /> Creative / Assets
          </h1>
          <p className="text-sm text-gray-500 mt-1">Centralized asset library, photo links, and Supabase storage/DB upload.</p>
        </div>
        <Button onClick={openCreate} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-semibold shadow-sm">
          <Plus className="h-4 w-4 mr-2" /> Upload / Add Asset
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input placeholder="Search assets by name, product..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] text-xs bg-white"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger className="w-[160px] text-xs bg-white"><SelectValue placeholder="Campaign" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {store.campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2">
          <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700">No assets found</h3>
          <p className="text-sm text-gray-500 mt-1">Upload brand assets or photo URLs to save to database.</p>
          <Button onClick={openCreate} className="mt-4 bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white"><Plus className="h-4 w-4 mr-2" /> Add Asset</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map(a => {
            const Icon = getAssetIcon(a.assetType)
            const camp = store.getCampaignById(a.campaignId)
            const usedInContent = store.getContentByAsset(a.id)

            return (
              <Card key={a.id} className="border border-gray-200 hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  {/* Photo / Asset Image Preview */}
                  {a.previewUrl ? (
                    <div className="h-36 w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50 relative group">
                      <img
                        src={a.previewUrl}
                        alt={a.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none"
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-36 rounded-lg bg-gray-100 flex flex-col items-center justify-center border border-gray-200 text-gray-400">
                      <Icon className="h-8 w-8 mb-1 text-gray-400" />
                      <span className="text-[11px] font-medium">{a.assetType}</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-semibold">{a.version}</Badge>
                      <Badge className={a.status === "Approved" ? "bg-emerald-100 text-emerald-800 text-[10px]" : "bg-gray-100 text-gray-800 text-[10px]"}>{a.status}</Badge>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm mt-1 truncate">{a.name}</h4>
                  </div>

                  <div className="text-xs text-gray-600 space-y-0.5 border-t pt-2">
                    {a.product && <p><strong>Product:</strong> {a.product}</p>}
                    {camp && <p><strong>Campaign:</strong> {camp.name}</p>}
                    <p className="text-gray-400 text-[11px]">By {a.createdBy} • {a.uploadDate}</p>
                  </div>
                </CardContent>

                <div className="p-3 border-t bg-gray-50/50 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-medium">Used in {usedInContent.length} posts</span>
                  <div className="flex items-center gap-1">
                    {a.previewUrl && (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handleDownloadAsset(a)} title="Download Image">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setDetailAsset(a)} title="View Asset"><Eye className="h-3.5 w-3.5 text-gray-600" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(a)} title="Edit Asset"><Edit3 className="h-3.5 w-3.5 text-gray-600" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={() => handleDelete(a)} title="Delete Asset"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Upload/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">{editing ? "Edit Asset" : "Add Brand Photo / Asset"}</DialogTitle>
            <DialogDescription>Upload image file to database/storage or paste image URL link.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Asset Name *</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mango Preserve Product Photo" />
            </div>

            {/* Photo Link & File Upload */}
            <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <label className="text-xs font-bold text-gray-800 block">Product Photo / Image</label>
              
              <div className="space-y-2">
                <Input
                  value={previewUrl}
                  onChange={e => setPreviewUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or Image Link"
                  className="text-xs bg-white"
                />

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400 font-semibold uppercase">Or File:</span>
                  <label className="cursor-pointer inline-flex items-center px-3 py-1.5 rounded border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
                    {uploading ? (
                      <span className="flex items-center gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin text-[#4B49AC]" /> Processing...</span>
                    ) : (
                      <span className="flex items-center gap-1"><Upload className="h-3.5 w-3.5 text-[#4B49AC]" /> Upload Image File</span>
                    )}
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              {previewUrl && (
                <div className="mt-2 border rounded-lg overflow-hidden h-28 bg-white flex items-center justify-center p-1">
                  <img src={previewUrl} alt="Preview" className="h-full max-w-full object-contain rounded" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Asset Category</label>
                <Select value={assetType} onValueChange={(v: any) => setAssetType(v)}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>{ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Version</label>
                <Input value={version} onChange={e => setVersion(e.target.value)} placeholder="v1" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Associated Campaign</label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Select Campaign" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None / General</SelectItem>
                  {store.campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Product Link</label>
              <Input value={product} onChange={e => setProduct(e.target.value)} placeholder="e.g. Alphonso Mango Preserve" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Created By</label>
                <Input value={createdBy} onChange={e => setCreatedBy(e.target.value)} placeholder="e.g. Priya" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Status</label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={uploading} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-semibold">{editing ? "Update Asset" : "Save to Database"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clean Asset Detail Modal */}
      <Dialog open={!!detailAsset} onOpenChange={() => setDetailAsset(null)}>
        <DialogContent className="max-w-lg bg-white max-h-[90vh] overflow-y-auto w-full p-6">
          {detailAsset && (() => {
            const camp = store.getCampaignById(detailAsset.campaignId)
            const usedInContent = store.getContentByAsset(detailAsset.id)

            return (
              <div className="space-y-4">
                <DialogHeader className="p-0">
                  <DialogTitle className="text-xl text-gray-900 font-bold">{detailAsset.name}</DialogTitle>
                  <DialogDescription className="text-xs text-gray-500">{detailAsset.assetType} • {detailAsset.version}</DialogDescription>
                </DialogHeader>

                {/* Clean Image Preview Box */}
                {detailAsset.previewUrl && (
                  <div className="w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center p-2 max-h-72 relative">
                    <img src={detailAsset.previewUrl} alt={detailAsset.name} className="max-h-64 max-w-full object-contain rounded-lg shadow-sm" />
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-xl space-y-1.5 border border-gray-200/80 text-xs text-gray-700">
                  <p><strong>Associated Campaign:</strong> {camp?.name || "General Asset"}</p>
                  <p><strong>Product:</strong> {detailAsset.product || "—"}</p>
                  <p><strong>Creator:</strong> {detailAsset.createdBy}</p>
                  <p><strong>Upload Date:</strong> {detailAsset.uploadDate}</p>
                  <p><strong>Status:</strong> {detailAsset.status}</p>
                  {detailAsset.previewUrl && (
                    <div className="pt-1 border-t border-gray-200 mt-1">
                      <span className="font-semibold block text-gray-900 mb-0.5">Image Database Reference:</span>
                      <span className="text-[11px] font-mono text-gray-500 truncate block max-w-full">
                        {detailAsset.previewUrl.startsWith("data:") ? "Permanent Base64 Image String (Saved in Database)" : detailAsset.previewUrl}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 text-xs mb-2">Used In Content Items ({usedInContent.length})</h4>
                  {usedInContent.length === 0 ? (
                    <p className="text-gray-400 italic text-xs">This asset has not been attached to any calendar content yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {usedInContent.map(c => (
                        <div key={c.id} className="bg-gray-50 p-2.5 rounded-lg flex items-center justify-between border border-gray-200 text-xs">
                          <span className="font-medium text-gray-900">{c.title}</span>
                          <Badge variant="outline" className="text-[10px]">{c.platform}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <DialogFooter className="pt-2 flex items-center justify-between gap-2">
                  {detailAsset.previewUrl && (
                    <Button onClick={() => handleDownloadAsset(detailAsset)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs">
                      <Download className="h-4 w-4 mr-1.5" /> Download Image
                    </Button>
                  )}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setDetailAsset(null)}>Close</Button>
                    <Button onClick={() => { setDetailAsset(null); openEdit(detailAsset) }} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-semibold text-xs">Edit Asset</Button>
                  </div>
                </DialogFooter>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
