import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Timer, 
  LogIn, 
  LogOut,
  Send,
  CalendarDays
} from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { PersonalWorkspaceService, getCleanEmail } from "@/services/personalWorkspaceService"

interface PersonalAttendanceTrackerProps {
  userEmail?: string
}

export function PersonalAttendanceTracker({ userEmail }: PersonalAttendanceTrackerProps) {
  const activeEmail = getCleanEmail(userEmail)
  const [logs, setLogs] = useState<any[]>([])
  const [isPunchedIn, setIsPunchedIn] = useState(true)
  const [todayPunchInTime, setTodayPunchInTime] = useState("09:02 AM")
  const [elapsedHours, setElapsedHours] = useState("4h 18m")
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [leaveType, setLeaveType] = useState("Casual Leave (CL)")
  const [leaveDate, setLeaveDate] = useState(new Date().toISOString().slice(0, 10))
  const [leaveReason, setLeaveReason] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadAttendance()
  }, [activeEmail])

  const loadAttendance = async () => {
    const data = await PersonalWorkspaceService.getAttendanceLogs(activeEmail)
    setLogs(data)
  }

  const handlePunchToggle = async () => {
    const now = new Date()
    const timeStr = format(now, "hh:mm a")
    const dateStr = format(now, "yyyy-MM-dd")

    if (isPunchedIn) {
      // Clock Out
      setIsPunchedIn(false)
      const updated = await PersonalWorkspaceService.saveAttendancePunch(activeEmail, {
        id: `att_${Date.now()}`,
        date: dateStr,
        checkIn: todayPunchInTime,
        checkOut: timeStr,
        status: "Present",
        totalHours: "8.5h"
      })
      setLogs(updated)
      toast({
        title: "Punched Out Successfully",
        description: `Clocked out at ${timeStr}. Great work today!`
      })
    } else {
      // Clock In
      setIsPunchedIn(true)
      setTodayPunchInTime(timeStr)
      const updated = await PersonalWorkspaceService.saveAttendancePunch(activeEmail, {
        id: `att_${Date.now()}`,
        date: dateStr,
        checkIn: timeStr,
        checkOut: "--:--",
        status: "Present (In Progress)",
        totalHours: "Active"
      })
      setLogs(updated)
      toast({
        title: "Punched In Successfully! 🚀",
        description: `Clocked in at ${timeStr}. Session active.`
      })
    }
  }

  const handleApplyLeave = async () => {
    if (!leaveReason.trim()) {
      toast({ title: "Reason Required", description: "Please enter a reason for your leave request.", variant: "destructive" })
      return
    }

    const updated = await PersonalWorkspaceService.saveAttendancePunch(activeEmail, {
      id: `att_${Date.now()}`,
      date: leaveDate,
      checkIn: "OFF",
      checkOut: "OFF",
      status: `Leave (${leaveType})`,
      totalHours: "0h"
    })

    setLogs(updated)
    setIsLeaveModalOpen(false)
    setLeaveReason("")

    toast({
      title: "Leave Application Submitted",
      description: `Applied for ${leaveType} on ${leaveDate}.`
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Clock className="h-8 w-8 text-[#4B49AC]" /> My Attendance & Live Time Tracker
          </h2>
          <p className="text-gray-500 mt-2 flex items-center gap-2">
            Punch in/out, working hours, and leave records for <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs">{activeEmail}</span>
          </p>
        </div>

        <Button 
          onClick={() => setIsLeaveModalOpen(true)} 
          variant="outline"
          className="border-[#4B49AC]/30 text-[#4B49AC] hover:bg-indigo-50 font-medium text-xs h-10 shadow-xs"
        >
          <CalendarDays className="h-4 w-4 mr-1.5" /> Apply for Leave
        </Button>
      </div>

      {/* Live Puncher Banner Card */}
      <Card className="border-gray-200 overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md">
        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {isPunchedIn ? "Active Working Session" : "Currently Shift Off"}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white">
              Today: {format(new Date(), "EEEE, MMMM do, yyyy")}
            </h3>
            <div className="flex items-center gap-4 text-xs text-indigo-200/90 pt-1">
              <span>Punch In: <strong className="text-white">{todayPunchInTime}</strong></span>
              <span>•</span>
              <span>Working Duration: <strong className="text-emerald-300">{elapsedHours}</strong></span>
            </div>
          </div>

          <Button
            onClick={handlePunchToggle}
            size="lg"
            className={
              isPunchedIn
                ? "bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm h-12 px-6 shadow-md"
                : "bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm h-12 px-6 shadow-md"
            }
          >
            {isPunchedIn ? (
              <>
                <LogOut className="h-5 w-5 mr-2" /> Clock Out (Punch Out)
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5 mr-2" /> Clock In (Punch In)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Present Days</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">21 Days</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Current Month</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Average Hours</p>
              <p className="text-2xl font-bold text-[#4B49AC] mt-1">8.8 hrs/day</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Optimal performance</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-[#4B49AC]">
              <Timer className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">On-Time Punch Ratio</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">98.5%</p>
              <p className="text-[11px] text-blue-600 font-medium mt-0.5">Exemplary punctuality</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Available Leave Balance</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">14 Days</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Annual quota</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-xl text-gray-700">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History Table */}
      <Card className="border-gray-200">
        <CardHeader className="py-4 px-6 border-b border-gray-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-gray-900">Personal Punch & Attendance Log</CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Historical record of your clock-in / clock-out timestamps
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                  <TableHead className="text-xs font-semibold">Check In</TableHead>
                  <TableHead className="text-xs font-semibold">Check Out</TableHead>
                  <TableHead className="text-xs font-semibold">Effective Hours</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50/70">
                    <TableCell className="font-semibold text-xs text-gray-900">{item.date}</TableCell>
                    <TableCell className="text-xs font-mono">{item.checkIn}</TableCell>
                    <TableCell className="text-xs font-mono">{item.checkOut}</TableCell>
                    <TableCell className="text-xs font-bold text-[#4B49AC]">{item.totalHours}</TableCell>
                    <TableCell>
                      <Badge className={
                        item.status.includes("Present")
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                          : "bg-amber-50 text-amber-800 border-amber-200 text-[10px]"
                      }>
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Leave Application Modal */}
      <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
        <DialogContent className="sm:max-w-[460px] p-0 rounded-2xl overflow-hidden border-gray-200">
          <DialogHeader className="p-4 bg-gray-50 border-b border-gray-100">
            <DialogTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#4B49AC]" /> Apply for Leave / Regularization
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Submitted for {activeEmail}
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-3.5 bg-white">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Leave Category</label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Casual Leave (CL)">Casual Leave (CL)</SelectItem>
                  <SelectItem value="Sick Leave (SL)">Sick Leave (SL)</SelectItem>
                  <SelectItem value="Earned / Privilege Leave (PL)">Earned / Privilege Leave (PL)</SelectItem>
                  <SelectItem value="Work from Home (WFH)">Work from Home (WFH)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Leave Date</label>
              <Input
                type="date"
                value={leaveDate}
                onChange={e => setLeaveDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Reason / Notes *</label>
              <Input
                placeholder="e.g. Urgent family matter / doctor consultation"
                value={leaveReason}
                onChange={e => setLeaveReason(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          <DialogFooter className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsLeaveModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleApplyLeave} size="sm" className="bg-[#4B49AC] hover:bg-[#3b3a88] text-white text-xs">
              <Send className="h-3.5 w-3.5 mr-1" /> Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
