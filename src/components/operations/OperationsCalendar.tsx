import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Plus, Loader2, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface CalendarEvent {
  id: string; title: string; event_type: string; event_date: string
  start_time: string; end_time: string; is_all_day: boolean
  description: string | null; project_id: string | null
  color: string; created_at: string
}

interface ProjectRef { id: string; name: string; code: string | null }

const EVENT_TYPES = ["Meeting", "Deadline", "Holiday", "Review", "Milestone"]
const TYPE_COLORS: Record<string, string> = {
  "Meeting": "#4B49AC", "Deadline": "#ef4444", "Holiday": "#22c55e",
  "Review": "#f59e0b", "Milestone": "#8b5cf6",
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export function OperationsCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [meetingEvents, setMeetingEvents] = useState<CalendarEvent[]>([])
  const [taskDeadlines, setTaskDeadlines] = useState<CalendarEvent[]>([])
  const [projects, setProjects] = useState<ProjectRef[]>([])
  const [loading, setLoading] = useState(true)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()

  const [form, setForm] = useState({
    title: "", event_type: "Meeting", event_date: "", start_time: "10:00",
    end_time: "11:00", is_all_day: false, description: "", project_id: ""
  })

  const resetForm = () => setForm({
    title: "", event_type: "Meeting", event_date: "", start_time: "10:00",
    end_time: "11:00", is_all_day: false, description: "", project_id: ""
  })

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from("ops_calendar_events" as any).select("*").order("event_date")
      if (data) setEvents(data as any[])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fetchMeetingsAsEvents = async () => {
    try {
      const { data } = await supabase.from("ops_meetings" as any).select("id, subject, meeting_date, duration_minutes, status").eq("status", "Scheduled")
      if (data) {
        const mapped: CalendarEvent[] = (data as any[]).map(m => ({
          id: `mtg-${m.id}`, title: `📅 ${m.subject}`, event_type: "Meeting",
          event_date: m.meeting_date ? m.meeting_date.split("T")[0] : "",
          start_time: m.meeting_date ? m.meeting_date.split("T")[1]?.slice(0, 5) || "10:00" : "10:00",
          end_time: "11:00", is_all_day: false, description: null,
          project_id: null, color: "#4B49AC", created_at: ""
        }))
        setMeetingEvents(mapped)
      }
    } catch (e) { console.error(e) }
  }

  const fetchTaskDeadlines = async () => {
    try {
      const { data } = await supabase.from("ops_tasks" as any).select("id, title, due_date, status").not("due_date", "is", null)
      if (data) {
        const mapped: CalendarEvent[] = (data as any[]).filter(t => t.status !== "Done").map(t => ({
          id: `task-${t.id}`, title: `⏰ ${t.title}`, event_type: "Deadline",
          event_date: t.due_date, start_time: "18:00", end_time: "18:00",
          is_all_day: false, description: null, project_id: null,
          color: "#ef4444", created_at: ""
        }))
        setTaskDeadlines(mapped)
      }
    } catch (e) { console.error(e) }
  }

  const fetchProjects = async () => {
    try {
      const { data } = await supabase.from("ops_projects" as any).select("id, name, code").order("name")
      if (data) setProjects(data as any[])
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    fetchEvents()
    fetchMeetingsAsEvents()
    fetchTaskDeadlines()
    fetchProjects()
    const ch = supabase.channel("ops-calendar-realtime")
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "ops_calendar_events" }, () => fetchEvents())
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "ops_meetings" }, () => fetchMeetingsAsEvents())
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "ops_tasks" }, () => fetchTaskDeadlines())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const allEvents = useMemo(() => [...events, ...meetingEvents, ...taskDeadlines], [events, meetingEvents, taskDeadlines])

  const getEventsForDate = (dateStr: string) => allEvents.filter(e => e.event_date === dateStr)

  const handleSave = async () => {
    if (!form.title || !form.event_date) {
      toast({ title: "Validation Error", description: "Title and date are required.", variant: "destructive" })
      return
    }
    const { error } = await supabase.from("ops_calendar_events" as any).insert({
      title: form.title, event_type: form.event_type, event_date: form.event_date,
      start_time: form.start_time, end_time: form.end_time, is_all_day: form.is_all_day,
      description: form.description || null, project_id: form.project_id || null,
      color: TYPE_COLORS[form.event_type] || "#4B49AC", created_by: "portal"
    } as any)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Created", description: `Event "${form.title}" added to calendar.` })
    setIsModalOpen(false); resetForm(); fetchEvents()
  }

  const handleDeleteEvent = async (id: string) => {
    if (id.startsWith("mtg-") || id.startsWith("task-")) {
      toast({ title: "Info", description: "This event is auto-generated. Edit it from Meetings or Tasks tab." })
      return
    }
    await supabase.from("ops_calendar_events" as any).delete().eq("id", id)
    toast({ title: "Deleted", description: "Event removed." })
    fetchEvents()
  }

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }
  const goToday = () => { setCurrentYear(new Date().getFullYear()); setCurrentMonth(new Date().getMonth()) }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const todayStr = new Date().toISOString().split("T")[0]

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }, [firstDay, daysInMonth])

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#4B49AC]/10 rounded-xl flex items-center justify-center">
            <Calendar className="h-5 w-5 text-[#4B49AC]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Operations Calendar</h2>
            <p className="text-sm text-gray-500">Company events, meetings, deadlines, and milestones</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true) }} className="bg-[#4B49AC] hover:bg-[#3b3a88]">
          <Plus className="h-4 w-4 mr-2" /> Add Event
        </Button>
      </div>

      {/* Legend */}
      <Card className="border-gray-200">
        <CardContent className="p-3 flex flex-wrap gap-4">
          {EVENT_TYPES.map(t => (
            <div key={t} className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full" style={{ background: TYPE_COLORS[t] }} />
              <span className="text-xs text-gray-600">{t}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">📅 = Meeting auto-sync</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">⏰ = Task deadline auto-sync</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="border-gray-200 lg:col-span-2">
          <CardContent className="p-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-gray-900">{MONTHS[currentMonth]} {currentYear}</h3>
                <Button variant="outline" size="sm" onClick={goToday} className="text-xs h-7">Today</Button>
              </div>
              <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-px mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
              ))}
            </div>

            {/* Date Cells */}
            <div className="grid grid-cols-7 gap-px">
              {calendarDays.map((day, idx) => {
                if (day === null) return <div key={idx} className="h-20 bg-gray-50/50 rounded" />
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                const dayEvents = getEventsForDate(dateStr)
                const isToday = dateStr === todayStr
                const isSelected = dateStr === selectedDate

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`h-20 p-1 rounded border text-left transition-all hover:border-[#4B49AC]/40 flex flex-col ${
                      isToday ? "border-[#4B49AC] bg-[#4B49AC]/5" :
                      isSelected ? "border-[#7DA0FA] bg-[#7DA0FA]/5" : "border-gray-100 bg-white"
                    }`}
                  >
                    <span className={`text-xs font-medium mb-0.5 ${isToday ? "text-[#4B49AC] font-bold" : "text-gray-600"}`}>{day}</span>
                    <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                      {dayEvents.slice(0, 3).map((ev, i) => (
                        <div key={i} className="text-[9px] px-1 py-0.5 rounded truncate text-white leading-tight" style={{ background: ev.color || TYPE_COLORS[ev.event_type] || "#4B49AC" }}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px] text-gray-400 px-1">+{dayEvents.length - 3} more</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Event List Panel */}
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              {selectedDate ? (
                <>Events — {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</>
              ) : "Select a date"}
            </h3>
            {selectedDate ? (
              selectedDateEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEvents.map(ev => (
                    <div key={ev.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 space-y-1">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full mt-1" style={{ background: ev.color || TYPE_COLORS[ev.event_type] || "#4B49AC" }} />
                          <p className="text-sm font-medium text-gray-800">{ev.title}</p>
                        </div>
                        {!ev.id.startsWith("mtg-") && !ev.id.startsWith("task-") && (
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(ev.id)} className="h-6 w-6 p-0 text-gray-300 hover:text-red-500 text-xs">×</Button>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 pl-4">
                        <Badge variant="outline" className="text-[10px]">{ev.event_type}</Badge>
                        {!ev.is_all_day && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{ev.start_time} — {ev.end_time}</span>}
                        {ev.is_all_day && <span className="text-green-600">All Day</span>}
                      </div>
                      {ev.description && <p className="text-xs text-gray-500 pl-4">{ev.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No events for this date.</p>
              )
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Click on a date to view events.</p>
            )}

            {selectedDate && (
              <Button
                variant="outline" size="sm" className="w-full mt-4 text-xs"
                onClick={() => { resetForm(); setForm(f => ({ ...f, event_date: selectedDate })); setIsModalOpen(true) }}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Event on {selectedDate}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Event Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Calendar Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Event title" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
                <Select value={form.event_type} onValueChange={v => setForm({ ...form, event_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Date *</label>
                <Input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_all_day} onChange={e => setForm({ ...form, is_all_day: e.target.checked })} className="rounded" id="allday" />
              <label htmlFor="allday" className="text-sm text-gray-600">All day event</label>
            </div>
            {!form.is_all_day && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Start Time</label>
                  <Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">End Time</label>
                  <Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Linked Project</label>
              <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.code || p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Optional description..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[#4B49AC] hover:bg-[#3b3a88]">Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
