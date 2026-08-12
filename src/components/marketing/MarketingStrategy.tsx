import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Target, Plus, Search, Edit3, Trash2, Eye, Calendar, IndianRupee } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useMarketingStore } from "./useMarketingStore"
import type { MktCampaign, CampaignStatus, CampaignPriority, Platform } from "./marketingTypes"

const ALL_PLATFORMS: Platform[] = ["Instagram", "YouTube", "LinkedIn", "WhatsApp", "X", "Website"]

export function MarketingStrategy() {
  const store = useMarketingStore()
  const { toast } = useToast()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<MktCampaign | null>(null)
  const [detailCampaign, setDetailCampaign] = useState<MktCampaign | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [goal, setGoal] = useState("")
  const [audience, setAudience] = useState("")
  const [pillarsInput, setPillarsInput] = useState("")
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [keyMessages, setKeyMessages] = useState("")
  const [kpisInput, setKpisInput] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [budget, setBudget] = useState("")
  const [priority, setPriority] = useState<CampaignPriority>("Medium")
  const [status, setStatus] = useState<CampaignStatus>("Planning")

  const resetForm = () => {
    setEditing(null); setName(""); setGoal(""); setAudience(""); setPillarsInput("")
    setPlatforms([]); setKeyMessages(""); setKpisInput(""); setStartDate(""); setEndDate("")
    setBudget(""); setPriority("Medium"); setStatus("Planning")
  }

  const openCreate = () => { resetForm(); setIsModalOpen(true) }

  const openEdit = (c: MktCampaign) => {
    setEditing(c); setName(c.name); setGoal(c.goal); setAudience(c.targetAudience)
    setPillarsInput(c.contentPillars.join(", ")); setPlatforms([...c.platforms])
    setKeyMessages(c.keyMessages); setKpisInput(c.kpis.join(", "))
    setStartDate(c.startDate); setEndDate(c.endDate); setBudget(String(c.budget))
    setPriority(c.priority); setStatus(c.status); setIsModalOpen(true)
  }

  const togglePlatform = (p: Platform) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  const handleSave = () => {
    if (!name.trim() || !goal.trim()) {
      toast({ title: "Required Fields", description: "Campaign name and goal are required.", variant: "destructive" })
      return
    }
    const pillars = pillarsInput.split(",").map(s => s.trim()).filter(Boolean)
    const kpis = kpisInput.split(",").map(s => s.trim()).filter(Boolean)
    const payload: Omit<MktCampaign, "id" | "createdAt"> = {
      name: name.trim(), goal: goal.trim(), targetAudience: audience.trim(),
      contentPillars: pillars, platforms, keyMessages: keyMessages.trim(),
      kpis, startDate, endDate, budget: Number(budget) || 0, priority, status
    }
    if (editing) {
      store.updateCampaign(editing.id, payload)
      toast({ title: "Campaign Updated", description: `"${name}" has been updated.` })
    } else {
      store.addCampaign({ id: `camp_${Date.now()}`, ...payload, createdAt: new Date().toISOString() })
      toast({ title: "Campaign Created", description: `"${name}" is now live in Strategy.` })
    }
    setIsModalOpen(false); resetForm()
  }

  const handleDelete = (c: MktCampaign) => {
    if (!confirm(`Delete campaign "${c.name}"?`)) return
    store.deleteCampaign(c.id)
    toast({ title: "Campaign Deleted", description: `"${c.name}" removed.` })
  }

  const filtered = useMemo(() => {
    return store.campaigns.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.goal.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "all" || c.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [store.campaigns, search, statusFilter])

  const stats = useMemo(() => ({
    active: store.campaigns.filter(c => c.status === "Active").length,
    totalBudget: store.campaigns.reduce((s, c) => s + c.budget, 0),
    total: store.campaigns.length
  }), [store.campaigns])

  const priorityBadge = (p: CampaignPriority) => {
    const cls = p === "High" ? "bg-red-100 text-red-800" : p === "Medium" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"
    return <Badge className={`${cls} text-xs`}>{p}</Badge>
  }

  const statusBadge = (s: CampaignStatus) => {
    const cls = s === "Active" ? "bg-emerald-100 text-emerald-800" : s === "Completed" ? "bg-blue-100 text-blue-800" : s === "Paused" ? "bg-gray-200 text-gray-700" : "bg-amber-100 text-amber-800"
    return <Badge className={`${cls} text-xs`}>{s}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-6 w-6 text-[#4B49AC]" /> Strategy
          </h1>
          <p className="text-sm text-gray-500 mt-1">Plan campaigns, define goals, audience, content pillars and KPIs.</p>
        </div>
        <Button onClick={openCreate} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-semibold shadow-sm">
          <Plus className="h-4 w-4 mr-2" /> Create Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs font-medium text-gray-500 mb-1">Total Campaigns</p><h3 className="text-xl font-bold text-gray-900">{stats.total}</h3></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs font-medium text-gray-500 mb-1">Active Campaigns</p><h3 className="text-xl font-bold text-emerald-700">{stats.active}</h3></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs font-medium text-gray-500 mb-1">Total Budget</p><h3 className="text-xl font-bold text-gray-900">₹{stats.totalBudget.toLocaleString("en-IN")}</h3></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Planning">Planning</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Paused">Paused</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaign Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Target className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-700">No campaigns found</h3>
              <p className="text-sm text-gray-500 mt-1">Create your first campaign to get started.</p>
              <Button onClick={openCreate} className="mt-4 bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white"><Plus className="h-4 w-4 mr-2" /> Create Campaign</Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold">Campaign</TableHead>
                  <TableHead className="font-semibold">Goal</TableHead>
                  <TableHead className="font-semibold">Platforms</TableHead>
                  <TableHead className="font-semibold text-right">Budget</TableHead>
                  <TableHead className="font-semibold">Priority</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Dates</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id} className="hover:bg-gray-50/80 cursor-pointer" onClick={() => setDetailCampaign(c)}>
                    <TableCell className="font-bold text-gray-900">{c.name}</TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">{c.goal}</TableCell>
                    <TableCell><div className="flex flex-wrap gap-1">{c.platforms.map(p => <Badge key={p} variant="outline" className="text-[11px]">{p}</Badge>)}</div></TableCell>
                    <TableCell className="text-right font-mono">₹{c.budget.toLocaleString("en-IN")}</TableCell>
                    <TableCell>{priorityBadge(c.priority)}</TableCell>
                    <TableCell>{statusBadge(c.status)}</TableCell>
                    <TableCell className="text-xs text-gray-500">{c.startDate || "—"}<br />{c.endDate || "—"}</TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setDetailCampaign(c)}><Eye className="h-4 w-4 text-gray-600" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(c)}><Edit3 className="h-4 w-4 text-gray-600" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={() => handleDelete(c)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">{editing ? "Edit Campaign" : "Create New Campaign"}</DialogTitle>
            <DialogDescription>Define campaign goals, audience, content pillars and KPIs.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs font-semibold text-gray-700 block mb-1">Campaign Name *</label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mango Season Launch" /></div>
              <div><label className="text-xs font-semibold text-gray-700 block mb-1">Priority</label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div><label className="text-xs font-semibold text-gray-700 block mb-1">Campaign Goal *</label><Textarea rows={2} value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Drive awareness and pre-orders for the new mango range" /></div>
            <div><label className="text-xs font-semibold text-gray-700 block mb-1">Target Audience</label><Input value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. Health-conscious millennials, 22-35, metro cities" /></div>
            <div><label className="text-xs font-semibold text-gray-700 block mb-1">Platforms</label>
              <div className="flex flex-wrap gap-2 mt-1">{ALL_PLATFORMS.map(p => (
                <button key={p} onClick={() => togglePlatform(p)} className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${platforms.includes(p) ? "bg-[#4B49AC] text-white border-[#4B49AC]" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>{p}</button>
              ))}</div>
            </div>
            <div><label className="text-xs font-semibold text-gray-700 block mb-1">Content Pillars (comma separated)</label><Input value={pillarsInput} onChange={e => setPillarsInput(e.target.value)} placeholder="Product Showcase, Behind the Scenes, Customer Stories" /></div>
            <div><label className="text-xs font-semibold text-gray-700 block mb-1">Key Messages</label><Textarea rows={2} value={keyMessages} onChange={e => setKeyMessages(e.target.value)} placeholder="Core messaging theme for this campaign..." /></div>
            <div><label className="text-xs font-semibold text-gray-700 block mb-1">KPIs (comma separated)</label><Input value={kpisInput} onChange={e => setKpisInput(e.target.value)} placeholder="Reach > 50K, Engagement > 5%, Pre-orders > 200" /></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="text-xs font-semibold text-gray-700 block mb-1">Start Date</label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              <div><label className="text-xs font-semibold text-gray-700 block mb-1">End Date</label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
              <div><label className="text-xs font-semibold text-gray-700 block mb-1">Budget (₹)</label><Input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="75000" /></div>
            </div>
            <div><label className="text-xs font-semibold text-gray-700 block mb-1">Status</label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Planning">Planning</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Paused">Paused</SelectItem><SelectItem value="Completed">Completed</SelectItem></SelectContent></Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-semibold">{editing ? "Update Campaign" : "Create Campaign"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Detail Modal */}
      <Dialog open={!!detailCampaign} onOpenChange={() => setDetailCampaign(null)}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          {detailCampaign && (() => {
            const linkedContent = store.getContentByCampaign(detailCampaign.id)
            const linkedAssets = store.getAssetsByCampaign(detailCampaign.id)
            const published = linkedContent.filter(c => c.status === "Published")
            const totalReach = published.reduce((s, c) => s + c.reach, 0)
            return <>
              <DialogHeader>
                <DialogTitle className="text-xl text-gray-900 flex items-center gap-2">{detailCampaign.name} {statusBadge(detailCampaign.status)}</DialogTitle>
                <DialogDescription>{detailCampaign.goal}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg"><p className="text-[11px] text-gray-500">Priority</p><p className="font-semibold text-sm">{detailCampaign.priority}</p></div>
                  <div className="bg-gray-50 p-3 rounded-lg"><p className="text-[11px] text-gray-500">Budget</p><p className="font-semibold text-sm">₹{detailCampaign.budget.toLocaleString("en-IN")}</p></div>
                  <div className="bg-gray-50 p-3 rounded-lg"><p className="text-[11px] text-gray-500">Content Items</p><p className="font-semibold text-sm">{linkedContent.length}</p></div>
                  <div className="bg-gray-50 p-3 rounded-lg"><p className="text-[11px] text-gray-500">Total Reach</p><p className="font-semibold text-sm">{totalReach.toLocaleString()}</p></div>
                </div>
                <div><p className="text-xs font-semibold text-gray-700 mb-1">Target Audience</p><p className="text-sm text-gray-600">{detailCampaign.targetAudience || "—"}</p></div>
                <div><p className="text-xs font-semibold text-gray-700 mb-1">Key Messages</p><p className="text-sm text-gray-600">{detailCampaign.keyMessages || "—"}</p></div>
                <div><p className="text-xs font-semibold text-gray-700 mb-1">Content Pillars</p><div className="flex flex-wrap gap-1">{detailCampaign.contentPillars.map((p, i) => <Badge key={i} variant="outline" className="text-xs">{p}</Badge>)}</div></div>
                <div><p className="text-xs font-semibold text-gray-700 mb-1">KPIs</p><div className="flex flex-wrap gap-1">{detailCampaign.kpis.map((k, i) => <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-800 border-blue-200">{k}</Badge>)}</div></div>
                <div><p className="text-xs font-semibold text-gray-700 mb-1">Platforms</p><div className="flex flex-wrap gap-1">{detailCampaign.platforms.map(p => <Badge key={p} variant="outline" className="text-xs">{p}</Badge>)}</div></div>
                <div className="grid grid-cols-2 gap-3"><div><p className="text-xs font-semibold text-gray-700 mb-1">Start Date</p><p className="text-sm text-gray-600">{detailCampaign.startDate || "—"}</p></div><div><p className="text-xs font-semibold text-gray-700 mb-1">End Date</p><p className="text-sm text-gray-600">{detailCampaign.endDate || "—"}</p></div></div>
                {linkedContent.length > 0 && <div><p className="text-xs font-semibold text-gray-700 mb-2">Linked Content ({linkedContent.length})</p>
                  <div className="space-y-1">{linkedContent.slice(0, 5).map(c => (
                    <div key={c.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg text-sm">
                      <span className="font-medium text-gray-900">{c.title}</span>
                      <Badge className={`text-[11px] ${c.status === "Published" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"}`}>{c.status}</Badge>
                    </div>
                  ))}</div>
                </div>}
                {linkedAssets.length > 0 && <div><p className="text-xs font-semibold text-gray-700 mb-2">Linked Assets ({linkedAssets.length})</p>
                  <div className="flex flex-wrap gap-2">{linkedAssets.map(a => <Badge key={a.id} variant="outline" className="text-xs">{a.name}</Badge>)}</div>
                </div>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailCampaign(null)}>Close</Button>
                <Button onClick={() => { setDetailCampaign(null); openEdit(detailCampaign) }} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-semibold">Edit Campaign</Button>
              </DialogFooter>
            </>
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
