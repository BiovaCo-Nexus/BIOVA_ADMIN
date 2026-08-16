import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Plus, Loader2, Pencil, Trash2, Users, Clock, Search, Filter, Video, MapPin, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface OpsMeeting {
  id: string; subject: string; meeting_type: string; meeting_date: string
  duration_minutes: number; location: string; organizer: string; attendees: string[]
  agenda: string | null; minutes: string | null; project_id: string | null
  status: string; created_at: string
}

interface ProjectRef { id: string; name: string; code: string | null }

const TYPE_OPTIONS = ["Standup", "Review", "Planning", "Client", "Board", "One-on-One", "Training"]
const STATUS_OPTIONS = ["Scheduled", "In Progress", "Completed", "Cancelled"]

const typeColor: Record<string, string> = {
  "Standup": "bg-blue-100 text-blue-700", "Review": "bg-amber-100 text-amber-700",
  "Planning": "bg-purple-100 text-purple-700", "Client": "bg-green-100 text-green-700",
  "Board": "bg-red-100 text-red-700", "One-on-One": "bg-cyan-100 text-cyan-700",
  "Training": "bg-pink-100 text-pink-700",
}

const statusColor: Record<string, string> = {
  "Scheduled": "bg-blue-100 text-blue-600 border-blue-200",
  "In Progress": "bg-amber-100 text-amber-700 border-amber-200",
  "Completed": "bg-green-100 text-green-700 border-green-200",
  "Cancelled": "bg-gray-100 text-gray-500 border-gray-200",
}

export function OperationsMeetings() {
  const [meetings, setMeetings] = useState<OpsMeeting[]>([])
  const [projects, setProjects] = useState<ProjectRef[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<OpsMeeting | null>(null)
  const [detailMeeting, setDetailMeeting] = useState<OpsMeeting | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const { toast } = useToast()

  const [form, setForm] = useState({
    subject: "", meeting_type: "Review", meeting_date: "", duration_minutes: "30",
    location: "Google Meet", organizer: "", attendees: "",
    agenda: "", minutes: "", project_id: "", status: "Scheduled"
  })

  const resetForm = () => setForm({
    subject: "", meeting_type: "Review", meeting_date: "", duration_minutes: "30",
    location: "Google Meet", organizer: "", attendees: "",
    agenda: "", minutes: "", project_id: "", status: "Scheduled"
  })

  const fetchMeetings = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from("ops_meetings" as any).select("*").order("meeting_date", { ascending: false })
      if (data) setMeetings(data as any[])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fetchProjects = async () => {
    try {
      const { data } = await supabase.from("ops_projects" as any).select("id, name, code").order("name")
      if (data) setProjects(data as any[])
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    fetchMeetings()
    fetchProjects()
    const channel = supabase.channel("ops-meetings-realtime")
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "ops_meetings" }, () => fetchMeetings())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleSave = async () => {
    if (!form.subject || !form.meeting_date) {
      toast({ title: "Validation Error", description: "Subject and date are required.", variant: "destructive" })
      return
    }
    const payload = {
      subject: form.subject,
      meeting_type: form.meeting_type,
      meeting_date: form.meeting_date,
      duration_minutes: Number(form.duration_minutes) || 30,
      location: form.location,
      organizer: form.organizer || "portal",
      attendees: form.attendees ? form.attendees.split(",").map(a => a.trim()) : [],
      agenda: form.agenda || null,
      minutes: form.minutes || null,
      project_id: form.project_id || null,
      status: form.status,
      updated_at: new Date().toISOString(),
    }

    if (editingMeeting) {
      const { error } = await supabase.from("ops_meetings" as any).update(payload as any).eq("id", editingMeeting.id)
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
      toast({ title: "Updated", description: `Meeting "${form.subject}" updated.` })
    } else {
      const { error } = await supabase.from("ops_meetings" as any).insert({ ...payload, created_by: "portal" } as any)
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
      toast({ title: "Created", description: `Meeting "${form.subject}" scheduled.` })
      await supabase.from("ops_activity_log" as any).insert({ actor: "portal", action: "Scheduled Meeting", entity_type: "meeting", entity_name: form.subject } as any)
    }
    setIsModalOpen(false); resetForm(); setEditingMeeting(null); fetchMeetings()
  }

  const handleEdit = (m: OpsMeeting) => {
    setEditingMeeting(m)
    setForm({
      subject: m.subject, meeting_type: m.meeting_type,
      meeting_date: m.meeting_date ? m.meeting_date.slice(0, 16) : "",
      duration_minutes: String(m.duration_minutes), location: m.location,
      organizer: m.organizer, attendees: (m.attendees || []).join(", "),
      agenda: m.agenda || "", minutes: m.minutes || "",
      project_id: m.project_id || "", status: m.status
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (m: OpsMeeting) => {
    await supabase.from("ops_meetings" as any).delete().eq("id", m.id)
    toast({ title: "Deleted", description: `Meeting "${m.subject}" deleted.` })
    fetchMeetings()
  }

  const handleStatusChange = async (m: OpsMeeting, newStatus: string) => {
    await supabase.from("ops_meetings" as any).update({ status: newStatus, updated_at: new Date().toISOString() } as any).eq("id", m.id)
    toast({ title: "Updated", description: `Meeting marked as ${newStatus}.` })
    fetchMeetings()
    if (detailMeeting?.id === m.id) setDetailMeeting({ ...m, status: newStatus })
  }

  const getProjectName = (pid: string | null) => {
    if (!pid) return null
    const p = projects.find(pr => pr.id === pid)
    return p ? (p.code || p.name) : null
  }

  const filtered = useMemo(() => {
    return meetings.filter(m => {
      const matchSearch = m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.organizer.toLowerCase().includes(searchQuery.toLowerCase())
      const matchType = filterType === "all" || m.meeting_type === filterType
      const matchStatus = filterStatus === "all" || m.status === filterStatus
      return matchSearch && matchType && matchStatus
    })
  }, [meetings, searchQuery, filterType, filterStatus])

  const scheduledCount = meetings.filter(m => m.status === "Scheduled").length
  const completedCount = meetings.filter(m => m.status === "Completed").length
  const upcomingCount = meetings.filter(m => m.status === "Scheduled" && new Date(m.meeting_date) > new Date()).length

  const kpis = [
    { label: "Total Meetings", value: meetings.length, icon: Calendar, color: "#4B49AC" },
    { label: "Upcoming", value: upcomingCount, icon: Clock, color: "#7DA0FA" },
    { label: "Completed", value: completedCount, icon: Video, color: "#22c55e" },
    { label: "Cancelled", value: meetings.filter(m => m.status === "Cancelled").length, icon: Calendar, color: "#ef4444" },
  ]

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) }
    catch { return d }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#4B49AC]/10 rounded-xl flex items-center justify-center">
            <Calendar className="h-5 w-5 text-[#4B49AC]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Meetings & Calls</h2>
            <p className="text-sm text-gray-500">Schedule, track, and manage all operational meetings</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setEditingMeeting(null); setIsModalOpen(true) }} className="bg-[#4B49AC] hover:bg-[#3b3a88]">
          <Plus className="h-4 w-4 mr-2" /> Schedule Meeting
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="border-gray-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: `${k.color}15` }}>
                <k.icon className="h-5 w-5" style={{ color: k.color }} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{k.label}</p>
                <p className="text-xl font-bold text-gray-900">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search meetings..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {TYPE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Organizer</TableHead>
                  <TableHead>Attendees</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#4B49AC]" /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-12 text-gray-500">No meetings found.</TableCell></TableRow>
                ) : filtered.map(m => (
                  <TableRow key={m.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => { setDetailMeeting(m); setIsDetailOpen(true) }}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{m.subject}</p>
                        {m.location && <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="h-3 w-3" />{m.location}</p>}
                      </div>
                    </TableCell>
                    <TableCell><Badge className={`text-xs ${typeColor[m.meeting_type] || "bg-gray-100 text-gray-600"}`}>{m.meeting_type}</Badge></TableCell>
                    <TableCell className="text-sm text-gray-600">{formatDate(m.meeting_date)}</TableCell>
                    <TableCell className="text-sm text-gray-500">{m.duration_minutes} min</TableCell>
                    <TableCell className="text-sm text-gray-600">{m.organizer}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm text-gray-600">{(m.attendees || []).length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getProjectName(m.project_id) ? (
                        <span className="text-xs px-1.5 py-0.5 bg-[#4B49AC]/10 text-[#4B49AC] rounded">{getProjectName(m.project_id)}</span>
                      ) : <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell><Badge className={`text-xs border ${statusColor[m.status] || ""}`}>{m.status}</Badge></TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(m)} className="h-8 w-8 p-0 text-gray-400 hover:text-[#4B49AC]"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(m)} className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailMeeting?.subject}</DialogTitle>
          </DialogHeader>
          {detailMeeting && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Type:</span> <Badge className={`ml-1 text-xs ${typeColor[detailMeeting.meeting_type] || ""}`}>{detailMeeting.meeting_type}</Badge></div>
                <div><span className="text-gray-500">Status:</span> <Badge className={`ml-1 text-xs border ${statusColor[detailMeeting.status] || ""}`}>{detailMeeting.status}</Badge></div>
                <div><span className="text-gray-500">Date:</span> <span className="ml-1 font-medium">{formatDate(detailMeeting.meeting_date)}</span></div>
                <div><span className="text-gray-500">Duration:</span> <span className="ml-1 font-medium">{detailMeeting.duration_minutes} min</span></div>
                <div><span className="text-gray-500">Location:</span> <span className="ml-1">{detailMeeting.location}</span></div>
                <div><span className="text-gray-500">Organizer:</span> <span className="ml-1">{detailMeeting.organizer}</span></div>
              </div>
              {detailMeeting.attendees && detailMeeting.attendees.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Attendees</p>
                  <div className="flex flex-wrap gap-1">{detailMeeting.attendees.map((a, i) => <Badge key={i} variant="outline" className="text-xs">{a}</Badge>)}</div>
                </div>
              )}
              {detailMeeting.agenda && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Agenda</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{detailMeeting.agenda}</p>
                </div>
              )}
              {detailMeeting.minutes && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Minutes / Notes</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{detailMeeting.minutes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2 border-t">
                {detailMeeting.status === "Scheduled" && <Button size="sm" onClick={() => handleStatusChange(detailMeeting, "Completed")} className="bg-green-600 hover:bg-green-700 text-xs">Mark Completed</Button>}
                {detailMeeting.status === "Scheduled" && <Button size="sm" variant="outline" onClick={() => handleStatusChange(detailMeeting, "Cancelled")} className="text-xs text-red-500 border-red-200 hover:bg-red-50">Cancel Meeting</Button>}
                <Button size="sm" variant="outline" onClick={() => { setIsDetailOpen(false); handleEdit(detailMeeting) }} className="text-xs ml-auto">Edit</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMeeting ? "Edit Meeting" : "Schedule New Meeting"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Subject *</label>
              <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Weekly Sprint Review" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
              <Select value={form.meeting_type} onValueChange={v => setForm({ ...form, meeting_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Date & Time *</label>
              <Input type="datetime-local" value={form.meeting_date} onChange={e => setForm({ ...form, meeting_date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Duration (minutes)</label>
              <Input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Location</label>
              <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Google Meet / Conference Room" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Organizer</label>
              <Input value={form.organizer} onChange={e => setForm({ ...form, organizer: e.target.value })} placeholder="email@biovaco.in" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Linked Project</label>
              <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.code || p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Attendees (comma-separated emails)</label>
              <Input value={form.attendees} onChange={e => setForm({ ...form, attendees: e.target.value })} placeholder="e.g. nakul.m@biovaco.in, hr@biovaco.in" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Agenda</label>
              <Textarea value={form.agenda} onChange={e => setForm({ ...form, agenda: e.target.value })} rows={2} placeholder="Meeting agenda items..." />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Minutes / Notes</label>
              <Textarea value={form.minutes} onChange={e => setForm({ ...form, minutes: e.target.value })} rows={2} placeholder="Post-meeting notes and action items..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[#4B49AC] hover:bg-[#3b3a88]">{editingMeeting ? "Save Changes" : "Schedule Meeting"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
