import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Calendar, 
  Plus, 
  Clock, 
  MapPin, 
  Video, 
  Trash2, 
  CheckCircle2, 
  Sparkles,
  CalendarCheck,
  Briefcase
} from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { PersonalWorkspaceService, getCleanEmail } from "@/services/personalWorkspaceService"

interface PersonalCalendarScheduleProps {
  userEmail?: string
}

export function PersonalCalendarSchedule({ userEmail }: PersonalCalendarScheduleProps) {
  const activeEmail = getCleanEmail(userEmail)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [events, setEvents] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [time, setTime] = useState("10:00 AM")
  const [type, setType] = useState("Meeting")
  const [priority, setPriority] = useState("Medium")
  const { toast } = useToast()

  useEffect(() => {
    loadUserCalendar()
  }, [activeEmail])

  const loadUserCalendar = async () => {
    const data = await PersonalWorkspaceService.getCalendarEvents(activeEmail)
    setEvents(data)
  }

  const handleAddEvent = async () => {
    if (!title.trim()) {
      toast({ title: "Event Title Required", description: "Please enter an event title.", variant: "destructive" })
      return
    }

    const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : new Date().toISOString().slice(0, 10)
    const newEvt = await PersonalWorkspaceService.saveCalendarEvent(activeEmail, {
      title,
      date: dateStr,
      time,
      type,
      priority
    })

    setEvents(prev => [newEvt, ...prev])
    setIsModalOpen(false)
    setTitle("")

    toast({
      title: "Event Scheduled",
      description: `Added "${title}" to your personal calendar.`
    })
  }

  const handleDeleteEvent = async (id: string, evtTitle: string) => {
    await PersonalWorkspaceService.deleteCalendarEvent(activeEmail, id)
    setEvents(prev => prev.filter(e => e.id !== id))
    toast({
      title: "Event Removed",
      description: `Deleted "${evtTitle}" from your schedule.`
    })
  }

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
  const selectedDateEvents = events.filter(e => e.date === selectedDateStr)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-[#4B49AC]" /> My Personal Schedule & Calendar
          </h2>
          <p className="text-gray-500 mt-2 flex items-center gap-2">
            Schedule, focus time blocks, and personal appointments for <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs">{activeEmail}</span>
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="bg-[#4B49AC] hover:bg-[#3b3a88] text-white font-medium text-xs h-10 shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" /> Schedule Event / Time Block
        </Button>
      </div>

      {/* Main Grid: Interactive Calendar on Left, Schedule on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Mini Calendar Picker */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-gray-200">
            <CardHeader className="py-3 px-4 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-[#4B49AC]" /> Calendar Picker
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col items-center">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-lg p-0 mx-auto"
                modifiers={{
                  hasEvent: events.map(e => new Date(e.date + "T00:00:00"))
                }}
                modifiersStyles={{
                  hasEvent: {
                    fontWeight: "bold",
                    textDecoration: "underline",
                    textDecorationColor: "#4B49AC"
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Selected Date Agenda */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-gray-200">
            <CardHeader className="py-4 px-6 border-b border-gray-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-gray-900">
                  Agenda for {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Selected Date"}
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  {selectedDateEvents.length} scheduled item(s) on this date
                </CardDescription>
              </div>
              <Button onClick={() => setIsModalOpen(true)} size="sm" variant="outline" className="text-xs h-8">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add on This Date
              </Button>
            </CardHeader>

            <CardContent className="p-5 space-y-3">
              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40 text-gray-400" />
                  No personal events scheduled for this day. Click "Schedule Event" to add one.
                </div>
              ) : (
                selectedDateEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 flex items-center justify-between hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-[#4B49AC]">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{evt.title}</p>
                        <p className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                          <span>{evt.time}</span>
                          <span>•</span>
                          <span className="text-[#4B49AC] font-medium">{evt.type}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={
                        evt.priority === "High"
                          ? "bg-rose-50 text-rose-700 border-rose-200 text-[10px]"
                          : "bg-blue-50 text-blue-800 border-blue-200 text-[10px]"
                      }>
                        {evt.priority}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEvent(evt.id, evt.title)}
                        className="h-7 w-7 text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedule Event Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[440px] p-0 rounded-2xl overflow-hidden border-gray-200">
          <DialogHeader className="p-4 bg-gray-50 border-b border-gray-100">
            <DialogTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#4B49AC]" /> Schedule Personal Event
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Assigned to {activeEmail}
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-3.5 bg-white">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Event / Meeting Title *</label>
              <Input
                placeholder="e.g. Q3 Sprint Planning, Weekly Review"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Time</label>
                <Input
                  type="text"
                  placeholder="e.g. 10:30 AM"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Meeting">Meeting</SelectItem>
                    <SelectItem value="Focus Block">Focus Block</SelectItem>
                    <SelectItem value="Review">Review</SelectItem>
                    <SelectItem value="Personal Reminder">Personal Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High Priority</SelectItem>
                  <SelectItem value="Medium">Medium Priority</SelectItem>
                  <SelectItem value="Low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleAddEvent} size="sm" className="bg-[#4B49AC] hover:bg-[#3b3a88] text-white text-xs">
              Save Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
