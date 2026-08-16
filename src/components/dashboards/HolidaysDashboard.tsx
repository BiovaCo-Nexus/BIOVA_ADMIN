import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Calendar, Search, Clock, Sparkles } from "lucide-react"
import { FINANCIAL_HOLIDAYS, getNextHoliday, getTodayHoliday, Holiday } from "@/data/holidays"
import { format } from "date-fns"

export function HolidaysDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedYear, setSelectedYear] = useState<string>("2026")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const now = new Date()
  const todayHoliday = getTodayHoliday(now)
  const nextHolidayInfo = getNextHoliday(now)

  // Filter holidays
  const filteredHolidays = FINANCIAL_HOLIDAYS.filter(h => {
    const matchesYear = h.date.startsWith(selectedYear)
    const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          h.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (h.description && h.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = categoryFilter === "all" || 
                            (categoryFilter === "national" && h.category === "national") ||
                            (categoryFilter === "public" && h.category === "public") ||
                            (categoryFilter === "company" && h.category === "company")
    return matchesYear && matchesSearch && matchesCategory
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Selected date holiday details
  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
  const selectedDateHoliday = FINANCIAL_HOLIDAYS.find(h => h.date === selectedDateStr)

  const getTypeBadgeColor = (type: Holiday["type"]) => {
    switch (type) {
      case "National Holiday":
        return "bg-amber-50 text-amber-800 border-amber-200"
      case "Public Holiday":
        return "bg-indigo-50 text-[#4B49AC] border-indigo-100"
      case "Festival":
        return "bg-rose-50 text-rose-800 border-rose-100"
      case "Company Holiday":
        return "bg-emerald-50 text-emerald-800 border-emerald-100"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Portal Standard Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Calendar className="h-8 w-8 text-[#4B49AC]" /> Holidays Calendar
        </h2>
        <p className="text-gray-500 mt-2">Official company holiday schedule and annual calendar.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Next Upcoming Holiday</p>
              <p className="text-lg font-bold text-gray-900 mt-1 truncate max-w-[170px]">
                {nextHolidayInfo ? nextHolidayInfo.holiday.name : "None"}
              </p>
              <p className="text-[11px] text-[#4B49AC] font-semibold mt-0.5">
                {nextHolidayInfo ? `in ${nextHolidayInfo.daysRemaining} days` : "-"}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-[#4B49AC]">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Holidays ({selectedYear})</p>
              <p className="text-2xl font-bold text-[#4B49AC] mt-1">
                {FINANCIAL_HOLIDAYS.filter(h => h.date.startsWith(selectedYear)).length}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">Scheduled annual days</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-[#4B49AC]">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">National Holidays ({selectedYear})</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {FINANCIAL_HOLIDAYS.filter(h => h.date.startsWith(selectedYear) && h.category === "national").length}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">Gazetted mandatory</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Festivals & Company Offs</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                {FINANCIAL_HOLIDAYS.filter(h => h.date.startsWith(selectedYear) && (h.category === "public" || h.category === "company")).length}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">Approved celebrations</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Interactive Calendar & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Mini Calendar */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-gray-200">
            <CardContent className="p-4 flex flex-col items-center">
              <div className="w-full pb-3 border-b border-gray-100 text-left">
                <span className="font-semibold text-sm text-gray-900">Select Date</span>
              </div>
              <div className="py-2 flex justify-center w-full">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-lg p-0 mx-auto"
                  modifiers={{
                    holiday: FINANCIAL_HOLIDAYS.map(h => new Date(h.date + "T00:00:00")),
                    sunday: (date: Date) => date.getDay() === 0
                  }}
                  modifiersStyles={{
                    holiday: {
                      backgroundColor: '#dc2626',
                      color: 'white',
                      fontWeight: 'bold',
                      borderRadius: '6px'
                    },
                    sunday: {
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      fontWeight: 'bold',
                      borderRadius: '6px'
                    }
                  }}
                />
              </div>

              {/* Selected date info */}
              <div className="w-full pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium">
                  {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "No date selected"}
                </p>
                {selectedDateHoliday ? (
                  <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-950">{selectedDateHoliday.name}</span>
                      <Badge className="bg-rose-600 text-white text-[9px] font-semibold border-0">
                        {selectedDateHoliday.type}
                      </Badge>
                    </div>
                    {selectedDateHoliday.description && (
                      <p className="text-[11px] text-rose-700 mt-1">{selectedDateHoliday.description}</p>
                    )}
                  </div>
                ) : (selectedDate && selectedDate.getDay() === 0) ? (
                  <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-950">Sunday Weekly Holiday</span>
                      <Badge className="bg-rose-600 text-white text-[9px] font-semibold border-0">
                        Weekly Off
                      </Badge>
                    </div>
                    <p className="text-[11px] text-rose-700 mt-1">Official Weekly Sunday Off • Portal in Sunday Mode</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Regular working day</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Table */}
        <div className="lg:col-span-8">
          <Card className="border-gray-200">
            <CardContent className="p-6">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center mb-5">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search holiday name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs border-gray-200"
                  />
                </div>

                {/* Year Switcher */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                  {["2025", "2026", "2027"].map(year => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        selectedYear === year 
                          ? "bg-white text-[#4B49AC] shadow-xs font-bold" 
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Holiday Name</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHolidays.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-xs text-gray-500">
                          No holidays found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHolidays.map((h, idx) => {
                        const hDate = new Date(h.date + "T00:00:00")
                        const isToday = h.date === format(now, "yyyy-MM-dd")
                        const isPast = hDate.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

                        return (
                          <TableRow 
                            key={idx}
                            onClick={() => setSelectedDate(hDate)}
                            className="cursor-pointer hover:bg-gray-50/80"
                          >
                            <TableCell className="text-xs font-medium py-3">
                              {format(hDate, "MMM dd, yyyy")}
                              <span className="block text-[10px] text-gray-400 font-normal">{format(hDate, "EEEE")}</span>
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-gray-900 py-3">
                              {h.name}
                            </TableCell>
                            <TableCell className="py-3">
                              <Badge variant="outline" className={`text-[10px] font-medium ${getTypeBadgeColor(h.type)}`}>
                                {h.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-right py-3">
                              {isToday ? (
                                <Badge className="bg-rose-500 text-white text-[9px]">Today</Badge>
                              ) : isPast ? (
                                <span className="text-gray-400 text-[11px]">Passed</span>
                              ) : (
                                <span className="text-[#4B49AC] font-semibold text-[11px]">
                                  in {Math.ceil((hDate.getTime() - now.getTime()) / (1000 * 3600 * 24))}d
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
