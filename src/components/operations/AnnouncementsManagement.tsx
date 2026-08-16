import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Megaphone, Plus, Loader2, Pin, Clock, Eye, Trash2, Search, Archive } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface OpsAnnouncement {
  id: string; title: string; content: string; author: string
  priority: string; target_departments: string[]; is_pinned: boolean
  expires_at: string | null; read_count: number; created_at: string
}

const PRIORITY_OPTIONS = ["Info", "Important", "Urgent", "Critical"]
const DEPARTMENT_OPTIONS = ["All", "R&D", "IT", "Marketing", "Operations", "Finance", "HR", "Sales", "Executive Board"]

const priorityConfig: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  "Info": { color: "#3b82f6", bg: "bg-blue-50", border: "border-blue-200", icon: "ℹ️" },
  "Important": { color: "#f59e0b", bg: "bg-amber-50", border: "border-amber-200", icon: "⚠️" },
  "Urgent": { color: "#f97316", bg: "bg-orange-50", border: "border-orange-200", icon: "🔶" },
  "Critical": { color: "#ef4444", bg: "bg-red-50", border: "border-red-200", icon: "🔴" },
}

export function AnnouncementsManagement() {
  const [announcements, setAnnouncements] = useState<OpsAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeView, setActiveView] = useState<"active" | "archived">("active")
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  const [form, setForm] = useState({
    title: "", content: "", author: "", priority: "Info",
    target_departments: "All", is_pinned: false, expires_at: ""
  })

  const resetForm = () => setForm({
    title: "", content: "", author: "", priority: "Info",
    target_departments: "All", is_pinned: false, expires_at: ""
  })

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from("ops_announcements" as any).select("*").order("created_at", { ascending: false })
      if (data) setAnnouncements(data as any[])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchAnnouncements()
    const channel = supabase.channel("ops-announcements-realtime")
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "ops_announcements" }, () => fetchAnnouncements())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleCreate = async () => {
    if (!form.title || !form.content) {
      toast({ title: "Validation Error", description: "Title and content are required.", variant: "destructive" })
      return
    }
    const { error } = await supabase.from("ops_announcements" as any).insert({
      title: form.title, content: form.content,
      author: form.author || "Admin",
      priority: form.priority,
      target_departments: form.target_departments ? form.target_departments.split(",").map(d => d.trim()) : ["All"],
      is_pinned: form.is_pinned,
      expires_at: form.expires_at || null,
    } as any)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Published", description: `Announcement "${form.title}" published.` })
    await supabase.from("ops_activity_log" as any).insert({ actor: form.author || "Admin", action: "Published Announcement", entity_type: "announcement", entity_name: form.title } as any)
    setIsModalOpen(false); resetForm(); fetchAnnouncements()
  }

  const handleDelete = async (a: OpsAnnouncement) => {
    await supabase.from("ops_announcements" as any).delete().eq("id", a.id)
    toast({ title: "Deleted", description: `Announcement "${a.title}" deleted.` })
    fetchAnnouncements()
  }

  const togglePin = async (a: OpsAnnouncement) => {
    await supabase.from("ops_announcements" as any).update({ is_pinned: !a.is_pinned, updated_at: new Date().toISOString() } as any).eq("id", a.id)
    toast({ title: a.is_pinned ? "Unpinned" : "Pinned", description: `"${a.title}" ${a.is_pinned ? "unpinned" : "pinned to top"}.` })
    fetchAnnouncements()
  }

  const incrementRead = async (a: OpsAnnouncement) => {
    await supabase.from("ops_announcements" as any).update({ read_count: (a.read_count || 0) + 1 } as any).eq("id", a.id)
  }

  const isExpired = (a: OpsAnnouncement) => a.expires_at && new Date(a.expires_at) < new Date()

  const filteredAnnouncements = useMemo(() => {
    const base = announcements.filter(a => {
      const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase())
      return matchSearch
    })
    if (activeView === "active") {
      return base.filter(a => !isExpired(a)).sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    }
    return base.filter(a => isExpired(a))
  }, [announcements, searchQuery, activeView])

  const activeCount = announcements.filter(a => !isExpired(a)).length
  const archivedCount = announcements.filter(a => isExpired(a)).length
  const pinnedCount = announcements.filter(a => a.is_pinned && !isExpired(a)).length

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) }
    catch { return d }
  }

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#4B49AC]/10 rounded-xl flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-[#4B49AC]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
            <p className="text-sm text-gray-500">Company-wide announcements and important notices</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true) }} className="bg-[#4B49AC] hover:bg-[#3b3a88]">
          <Plus className="h-4 w-4 mr-2" /> New Announcement
        </Button>
      </div>

      {/* KPI & Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView("active")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === "active" ? "bg-[#4B49AC] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setActiveView("archived")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === "archived" ? "bg-[#4B49AC] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            <Archive className="h-3.5 w-3.5 inline mr-1" /> Archived ({archivedCount})
          </button>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1"><Pin className="h-3.5 w-3.5" /> {pinnedCount} pinned</span>
          <span>{announcements.length} total</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Search announcements..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      {/* Announcements Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#4B49AC]" />
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="p-12 text-center text-gray-500">
            {activeView === "active" ? "No active announcements." : "No archived announcements."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map(a => {
            const pc = priorityConfig[a.priority] || priorityConfig["Info"]
            return (
              <Card key={a.id} className={`border ${pc.border} ${pc.bg} transition-all hover:shadow-md`} onClick={() => incrementRead(a)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {a.is_pinned && <Pin className="h-4 w-4 text-[#4B49AC] fill-[#4B49AC]" />}
                      <Badge className="text-xs" style={{ background: `${pc.color}20`, color: pc.color }}>
                        {pc.icon} {a.priority}
                      </Badge>
                      {(a.target_departments || []).map((d, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{d}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); togglePin(a) }} className="h-7 w-7 p-0 text-gray-400 hover:text-[#4B49AC]">
                        <Pin className={`h-3.5 w-3.5 ${a.is_pinned ? "fill-[#4B49AC] text-[#4B49AC]" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(a) }} className="h-7 w-7 p-0 text-gray-400 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{a.title}</h3>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{a.content}</p>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: `${pc.color}20` }}>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="font-medium">{a.author}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{timeAgo(a.created_at)}</span>
                      {a.expires_at && (
                        <>
                          <span>•</span>
                          <span className={isExpired(a) ? "text-red-500" : ""}>
                            {isExpired(a) ? "Expired" : `Expires: ${formatDate(a.expires_at)}`}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Eye className="h-3 w-3" /> {a.read_count} reads
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Announcement Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Content *</label>
              <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4} placeholder="Write your announcement here..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Author</label>
                <Input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="e.g. HR Department" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Priority</label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Target Departments (comma-separated)</label>
              <Input value={form.target_departments} onChange={e => setForm({ ...form, target_departments: e.target.value })} placeholder="e.g. All, R&D, Marketing" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Expiry Date (optional)</label>
                <Input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 pb-2">
                  <input type="checkbox" checked={form.is_pinned} onChange={e => setForm({ ...form, is_pinned: e.target.checked })} className="rounded" />
                  <span className="text-sm text-gray-600">📌 Pin to top</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} className="bg-[#4B49AC] hover:bg-[#3b3a88]">Publish Announcement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
