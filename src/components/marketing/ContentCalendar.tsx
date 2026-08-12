import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar as CalendarIcon, Plus, Search, Edit3, Trash2, Eye, List, Grid, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useMarketingStore } from "./useMarketingStore"
import type { MktContentItem, ContentStatus, ApprovalStatus, Platform, ContentType } from "./marketingTypes"

const ALL_PLATFORMS: Platform[] = ["Instagram", "YouTube", "LinkedIn", "WhatsApp", "X", "Website"]
const ALL_TYPES: ContentType[] = ["Reel", "Carousel", "Static Post", "Story", "Blog", "Video", "Email"]
const STATUS_WORKFLOW: ContentStatus[] = ["Idea", "Draft", "Creative Ready", "Review", "Approved", "Scheduled", "Published"]

export function ContentCalendar() {
  const store = useMarketingStore()
  const { toast } = useToast()

  const [search, setSearch] = useState("")
  const [campaignFilter, setCampaignFilter] = useState<string>("all")
  const [platformFilter, setPlatformFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<MktContentItem | null>(null)
  const [detailContent, setDetailContent] = useState<MktContentItem | null>(null)

  // Form State
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [platform, setPlatform] = useState<Platform>("Instagram")
  const [contentType, setContentType] = useState<ContentType>("Reel")
  const [campaignId, setCampaignId] = useState("")
  const [contentPillar, setContentPillar] = useState("")
  const [contentIdea, setContentIdea] = useState("")
  const [caption, setCaption] = useState("")
  const [cta, setCta] = useState("")
  const [assignedPerson, setAssignedPerson] = useState("")
  const [status, setStatus] = useState<ContentStatus>("Draft")
  const [creativeAssetId, setCreativeAssetId] = useState("")
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>("Pending")
  const [publishingDate, setPublishingDate] = useState("")

  const selectedCampaign = useMemo(() => {
    return store.campaigns.find(c => c.id === campaignId)
  }, [store.campaigns, campaignId])

  const availablePillars = useMemo(() => {
    return selectedCampaign?.contentPillars || []
  }, [selectedCampaign])

  const availableAssets = useMemo(() => {
    if (!campaignId) return store.creativeAssets
    return store.creativeAssets.filter(a => !a.campaignId || a.campaignId === campaignId)
  }, [store.creativeAssets, campaignId])

  const resetForm = () => {
    setEditing(null); setTitle(""); setDate(""); setPlatform("Instagram"); setContentType("Reel")
    setCampaignId(""); setContentPillar(""); setContentIdea(""); setCaption(""); setCta("")
    setAssignedPerson(""); setStatus("Draft"); setCreativeAssetId(""); setApprovalStatus("Pending")
    setPublishingDate("")
  }

  const openCreate = () => { resetForm(); setIsModalOpen(true) }

  const openEdit = (c: MktContentItem) => {
    setEditing(c); setTitle(c.title); setDate(c.date); setPlatform(c.platform)
    setContentType(c.contentType); setCampaignId(c.campaignId); setContentPillar(c.contentPillar)
    setContentIdea(c.contentIdea); setCaption(c.caption); setCta(c.cta)
    setAssignedPerson(c.assignedPerson); setStatus(c.status); setCreativeAssetId(c.creativeAssetId || "")
    setApprovalStatus(c.approvalStatus); setPublishingDate(c.publishingDate || "")
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: "Title Required", description: "Please enter a content title.", variant: "destructive" })
      return
    }

    const payload: Omit<MktContentItem, "id" | "createdAt" | "reach" | "impressions" | "engagement" | "clicks" | "conversions"> = {
      title: title.trim(), date: date || new Date().toISOString().slice(0, 10), platform, contentType,
      campaignId, contentPillar, contentIdea: contentIdea.trim(), caption: caption.trim(),
      cta: cta.trim(), assignedPerson: assignedPerson.trim(), status, creativeAssetId,
      approvalStatus, publishingDate
    }

    if (editing) {
      store.updateContent(editing.id, payload)
      toast({ title: "Content Updated", description: `"${title}" has been updated.` })
    } else {
      store.addContent({
        id: `cnt_${Date.now()}`,
        ...payload,
        reach: 0, impressions: 0, engagement: 0, clicks: 0, conversions: 0,
        createdAt: new Date().toISOString()
      })
      toast({ title: "Content Added", description: `"${title}" added to calendar.` })
    }

    setIsModalOpen(false); resetForm()
  }

  const handleDelete = (c: MktContentItem) => {
    if (!confirm(`Delete "${c.title}"?`)) return
    store.deleteContent(c.id)
    toast({ title: "Content Deleted", description: `"${c.title}" removed.` })
  }

  const filteredContent = useMemo(() => {
    return store.contentItems.filter(c => {
      const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
                          c.caption.toLowerCase().includes(search.toLowerCase()) ||
                          c.assignedPerson.toLowerCase().includes(search.toLowerCase())
      const matchCampaign = campaignFilter === "all" || c.campaignId === campaignFilter
      const matchPlatform = platformFilter === "all" || c.platform === platformFilter
      const matchStatus = statusFilter === "all" || c.status === statusFilter

      return matchSearch && matchCampaign && matchPlatform && matchStatus
    })
  }, [store.contentItems, search, campaignFilter, platformFilter, statusFilter])

  const statusBadge = (s: ContentStatus) => {
    const color = s === "Published" ? "bg-emerald-100 text-emerald-800" :
                  s === "Scheduled" ? "bg-blue-100 text-blue-800" :
                  s === "Approved" ? "bg-purple-100 text-purple-800" :
                  s === "Review" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800"
    return <Badge className={`${color} text-xs`}>{s}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-[#4B49AC]" /> Content Calendar
          </h1>
          <p className="text-sm text-gray-500 mt-1">Plan, approve, and schedule social media & marketing content.</p>
        </div>
        <Button onClick={openCreate} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-semibold shadow-sm">
          <Plus className="h-4 w-4 mr-2" /> Add Content Item
        </Button>
      </div>

      {/* Stats / Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input placeholder="Search content, caption, author..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger className="w-[150px] text-xs bg-white"><SelectValue placeholder="Campaign" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {store.campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[130px] text-xs bg-white"><SelectValue placeholder="Platform" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {ALL_PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] text-xs bg-white"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_WORKFLOW.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="border rounded-md p-1 bg-gray-100 flex items-center gap-1">
            <Button
              variant={viewMode === "list" ? "white" : "ghost"}
              size="sm"
              className={`h-7 px-2.5 text-xs ${viewMode === "list" ? "bg-white shadow-sm font-semibold text-gray-900" : "text-gray-500"}`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5 mr-1" /> List
            </Button>
            <Button
              variant={viewMode === "calendar" ? "white" : "ghost"}
              size="sm"
              className={`h-7 px-2.5 text-xs ${viewMode === "calendar" ? "bg-white shadow-sm font-semibold text-gray-900" : "text-gray-500"}`}
              onClick={() => setViewMode("calendar")}
            >
              <Grid className="h-3.5 w-3.5 mr-1" /> Grid
            </Button>
          </div>
        </div>
      </div>

      {/* Content Table / Cards */}
      <Card>
        <CardContent className="p-0">
          {filteredContent.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-700">No content scheduled</h3>
              <p className="text-sm text-gray-500 mt-1">Create your first content item to populate the calendar.</p>
              <Button onClick={openCreate} className="mt-4 bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white"><Plus className="h-4 w-4 mr-2" /> Add Content Item</Button>
            </div>
          ) : viewMode === "list" ? (
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Title & Idea</TableHead>
                  <TableHead className="font-semibold">Campaign</TableHead>
                  <TableHead className="font-semibold">Platform & Type</TableHead>
                  <TableHead className="font-semibold">Assigned</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContent.map(c => {
                  const camp = store.getCampaignById(c.campaignId)
                  return (
                    <TableRow key={c.id} className="hover:bg-gray-50/80 cursor-pointer" onClick={() => setDetailContent(c)}>
                      <TableCell className="text-xs font-mono font-semibold text-gray-700">{c.date || "TBD"}</TableCell>
                      <TableCell>
                        <div className="font-bold text-gray-900 text-sm">{c.title}</div>
                        <div className="text-xs text-gray-500 line-clamp-1">{c.contentIdea}</div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 font-medium">{camp?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] mr-1">{c.platform}</Badge>
                        <Badge variant="secondary" className="text-[11px]">{c.contentType}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700">{c.assignedPerson || "Unassigned"}</TableCell>
                      <TableCell>{statusBadge(c.status)}</TableCell>
                      <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setDetailContent(c)}><Eye className="h-4 w-4 text-gray-600" /></Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(c)}><Edit3 className="h-4 w-4 text-gray-600" /></Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={() => handleDelete(c)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContent.map(c => {
                const camp = store.getCampaignById(c.campaignId)
                const asset = store.creativeAssets.find(a => a.id === c.creativeAssetId)
                return (
                  <Card key={c.id} className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailContent(c)}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs font-semibold">{c.platform}</Badge>
                        {statusBadge(c.status)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{c.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.caption || c.contentIdea}</p>
                      </div>
                      <div className="text-xs space-y-1 text-gray-600 border-t pt-2">
                        <p><strong>Campaign:</strong> {camp?.name || "—"}</p>
                        <p><strong>Pillar:</strong> {c.contentPillar || "—"}</p>
                        <p><strong>Date:</strong> {c.date || "TBD"}</p>
                        {asset && <p className="text-emerald-700"><strong>Asset Attached:</strong> {asset.name}</p>}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">{editing ? "Edit Content Item" : "Create Content Item"}</DialogTitle>
            <DialogDescription>Plan caption, campaign link, asset attachment and scheduling.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Content Title *</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Alphonso Mango Jar Reveal Reel" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Target Date</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Platform</label>
                <Select value={platform} onValueChange={(v: any) => setPlatform(v)}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>{ALL_PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Content Type</label>
                <Select value={contentType} onValueChange={(v: any) => setContentType(v)}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>{ALL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Link to Campaign (from Strategy)</label>
                <Select value={campaignId} onValueChange={setCampaignId}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Select Campaign" /></SelectTrigger>
                  <SelectContent>
                    {store.campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Content Pillar</label>
                {availablePillars.length > 0 ? (
                  <Select value={contentPillar} onValueChange={setContentPillar}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Select Pillar" /></SelectTrigger>
                    <SelectContent>
                      {availablePillars.map((p, i) => <SelectItem key={i} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={contentPillar} onChange={e => setContentPillar(e.target.value)} placeholder="e.g. Product Showcase" />
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Core Concept / Idea</label>
              <Input value={contentIdea} onChange={e => setContentIdea(e.target.value)} placeholder="Visual concept or angle..." />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Caption / Copy</label>
              <Textarea rows={3} value={caption} onChange={e => setCaption(e.target.value)} placeholder="Social caption text..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Call to Action (CTA)</label>
                <Input value={cta} onChange={e => setCta(e.target.value)} placeholder="e.g. Link in bio" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Assigned Person</label>
                <Input value={assignedPerson} onChange={e => setAssignedPerson(e.target.value)} placeholder="e.g. Priya" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Workflow Status</label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_WORKFLOW.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Attach Creative / Asset</label>
                <Select value={creativeAssetId} onValueChange={setCreativeAssetId}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Select Asset" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableAssets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Approval Status</label>
                <Select value={approvalStatus} onValueChange={(v: any) => setApprovalStatus(v)}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-semibold">{editing ? "Update Content" : "Add Content"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Detail Modal */}
      <Dialog open={!!detailContent} onOpenChange={() => setDetailContent(null)}>
        <DialogContent className="max-w-xl bg-white">
          {detailContent && (() => {
            const camp = store.getCampaignById(detailContent.campaignId)
            const asset = store.creativeAssets.find(a => a.id === detailContent.creativeAssetId)
            return <>
              <DialogHeader>
                <DialogTitle className="text-lg text-gray-900 flex items-center justify-between">
                  <span>{detailContent.title}</span>
                  {statusBadge(detailContent.status)}
                </DialogTitle>
                <DialogDescription>{detailContent.date ? `Scheduled for ${detailContent.date}` : "Unscheduled"}</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2 text-xs text-gray-700">
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg">
                  <p><strong>Campaign:</strong> {camp?.name || "—"}</p>
                  <p><strong>Pillar:</strong> {detailContent.contentPillar || "—"}</p>
                  <p><strong>Platform:</strong> {detailContent.platform} ({detailContent.contentType})</p>
                  <p><strong>Assigned:</strong> {detailContent.assignedPerson || "Unassigned"}</p>
                </div>

                {detailContent.contentIdea && (
                  <div><strong>Idea Concept:</strong><p className="bg-gray-50 p-2 rounded mt-0.5">{detailContent.contentIdea}</p></div>
                )}

                {detailContent.caption && (
                  <div><strong>Caption Copy:</strong><p className="bg-gray-50 p-2 rounded mt-0.5 whitespace-pre-wrap">{detailContent.caption}</p></div>
                )}

                {detailContent.cta && <p><strong>CTA:</strong> {detailContent.cta}</p>}

                {asset && (
                  <div className="bg-emerald-50 p-2.5 rounded border border-emerald-200">
                    <p className="font-bold text-emerald-900">Attached Asset: {asset.name}</p>
                    <p className="text-[11px] text-emerald-700">Type: {asset.assetType} • Created by {asset.createdBy}</p>
                  </div>
                )}

                {detailContent.status === "Published" && (
                  <div className="border-t pt-2 grid grid-cols-4 gap-2 text-center font-mono">
                    <div className="bg-gray-50 p-1.5 rounded"><p className="text-[10px] text-gray-500">Reach</p><p className="font-bold">{detailContent.reach.toLocaleString()}</p></div>
                    <div className="bg-gray-50 p-1.5 rounded"><p className="text-[10px] text-gray-500">Engagement</p><p className="font-bold">{detailContent.engagement.toLocaleString()}</p></div>
                    <div className="bg-gray-50 p-1.5 rounded"><p className="text-[10px] text-gray-500">Clicks</p><p className="font-bold">{detailContent.clicks.toLocaleString()}</p></div>
                    <div className="bg-gray-50 p-1.5 rounded"><p className="text-[10px] text-gray-500">Conversions</p><p className="font-bold">{detailContent.conversions.toLocaleString()}</p></div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailContent(null)}>Close</Button>
                <Button onClick={() => { setDetailContent(null); openEdit(detailContent) }} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-semibold">Edit Content</Button>
              </DialogFooter>
            </>
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
