import React, { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Calendar, AlertCircle, Sparkles, ChevronRight, Clock } from "lucide-react"
import { format } from "date-fns"
import { FINANCIAL_HOLIDAYS, getNextHoliday, getTodayHoliday, getUpcomingHolidays, Holiday } from "@/data/holidays"

interface MarketCalendarWidgetProps {
  currentTime: Date
  onNavigateToHolidays?: () => void
}

export const MarketCalendarWidget: React.FC<MarketCalendarWidgetProps> = ({
  currentTime,
  onNavigateToHolidays
}) => {
  const [open, setOpen] = useState(false)
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(currentTime)
  const [activeView, setActiveView] = useState<"calendar" | "upcoming">("upcoming")

  const todayDateStr = format(currentTime, 'yyyy-MM-dd')
  const selectedDateStr = calendarDate ? format(calendarDate, 'yyyy-MM-dd') : null
  const todayHoliday = getTodayHoliday(currentTime)
  const nextHolidayInfo = getNextHoliday(currentTime)
  const upcomingHolidays = getUpcomingHolidays(currentTime, 5)
  const selectedHoliday = FINANCIAL_HOLIDAYS.find(h => h.date === selectedDateStr)

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`h-8 flex items-center gap-2 px-2.5 py-1 rounded-lg border shadow-xs text-xs font-semibold transition-all duration-150 hover:bg-opacity-80 cursor-pointer outline-none ${
            todayHoliday
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-indigo-50/80 border-indigo-100 text-[#4B49AC] hover:bg-indigo-100/70"
          }`}
          title="Click to open BiovaCo Calendar"
        >
          {/* Animated Status Dot */}
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              todayHoliday ? "bg-rose-400" : "bg-indigo-400"
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              todayHoliday ? "bg-rose-500" : "bg-[#4B49AC]"
            }`}></span>
          </span>

          <Calendar className="h-3.5 w-3.5 text-[#4B49AC] flex-shrink-0" />

          {/* Desktop full text */}
          <span className="hidden md:inline-flex items-center gap-1.5 whitespace-nowrap">
            {todayHoliday ? (
              <>
                <span className="text-rose-600 font-bold">Holiday:</span>
                <span className="text-rose-950 font-bold max-w-[150px] truncate">{todayHoliday.name}</span>
              </>
            ) : nextHolidayInfo ? (
              <>
                <span className="text-gray-500 font-medium">Next Holiday:</span>
                <span className="text-gray-900 font-bold max-w-[140px] truncate">{nextHolidayInfo.holiday.name}</span>
                <span className="text-[10px] font-semibold text-[#4B49AC] bg-white border border-indigo-100 px-1.5 py-0.2 rounded shadow-2xs">
                  {nextHolidayInfo.daysRemaining === 1 ? "Tomorrow" : `in ${nextHolidayInfo.daysRemaining}d`}
                </span>
              </>
            ) : (
              <span className="text-gray-700">Calendar</span>
            )}
          </span>

          {/* Mobile compact label */}
          <span className="md:hidden text-[11px] font-bold text-gray-800">
            {todayHoliday ? "Holiday Today" : nextHolidayInfo ? `${nextHolidayInfo.holiday.name.split(' ')[0]} (${nextHolidayInfo.daysRemaining}d)` : "Calendar"}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[330px] p-0 shadow-lg border-gray-200 rounded-xl overflow-hidden z-50 bg-white"
      >
        {/* Portal-Consistent Light Header */}
        <div className="px-3.5 py-2.5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#4B49AC]" />
            <span className="font-semibold text-xs text-gray-900">BiovaCo Calendar</span>
          </div>

          {/* View Switcher */}
          <div className="flex items-center bg-gray-200/60 p-0.5 rounded-lg text-[10px]">
            <button
              type="button"
              onClick={() => setActiveView("upcoming")}
              className={`px-2 py-0.5 rounded-md transition-all font-medium ${
                activeView === "upcoming" ? "bg-white text-[#4B49AC] shadow-2xs font-semibold" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setActiveView("calendar")}
              className={`px-2 py-0.5 rounded-md transition-all font-medium ${
                activeView === "calendar" ? "bg-white text-[#4B49AC] shadow-2xs font-semibold" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Calendar
            </button>
          </div>
        </div>

        {/* Banner inside popup */}
        <div className="p-3 border-b border-gray-100 bg-white">
          {todayHoliday ? (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg text-xs">
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              <div className="truncate">
                <span className="text-rose-900 font-bold">Today: {todayHoliday.name}</span>
                <span className="block text-[10px] text-rose-600">{todayHoliday.description || todayHoliday.type}</span>
              </div>
            </div>
          ) : nextHolidayInfo ? (
            <div className="bg-[#f2f6ff] border border-[#7DA0FA]/30 px-3 py-2 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4B49AC] flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[#7DA0FA]" /> Next Holiday
                </span>
                <p className="text-xs font-bold text-gray-900 mt-0.5">
                  {nextHolidayInfo.holiday.name}
                </p>
                <p className="text-[10px] text-gray-500">
                  {format(new Date(nextHolidayInfo.holiday.date + "T00:00:00"), "EEEE, MMM d, yyyy")}
                </p>
              </div>
              <Badge className="bg-[#4B49AC] hover:bg-[#3b3a88] text-white text-[10px] font-semibold px-2 py-0.5 border-0 shadow-2xs">
                in {nextHolidayInfo.daysRemaining} days
              </Badge>
            </div>
          ) : null}
        </div>

        {/* View 1: Upcoming Holidays List */}
        {activeView === "upcoming" && (
          <div className="p-2.5 bg-white max-h-[260px] overflow-y-auto space-y-1.5">
            {upcomingHolidays.map((item, idx) => {
              const hDate = new Date(item.holiday.date + "T00:00:00")
              const isToday = item.daysRemaining === 0

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setCalendarDate(hDate)
                    setActiveView("calendar")
                  }}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer hover:bg-[#f2f6ff]/50 ${
                    isToday ? "bg-rose-50/60 border-rose-200" : "bg-gray-50/50 border-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-white border border-gray-200 flex flex-col items-center justify-center flex-shrink-0 shadow-2xs">
                        <span className="text-[8px] font-bold text-gray-400 uppercase leading-none">
                          {format(hDate, "MMM")}
                        </span>
                        <span className="text-[11px] font-bold text-gray-900 leading-none mt-0.5">
                          {format(hDate, "dd")}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900 leading-tight">
                          {item.holiday.name}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {format(hDate, "EEEE")}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {isToday ? (
                        <Badge className="bg-rose-500 text-white text-[9px] px-1.5 py-0 border-0">Today</Badge>
                      ) : (
                        <span className="text-[10px] font-semibold text-[#4B49AC] bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                          {item.daysRemaining}d
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* View 2: Center-Aligned Mini Calendar */}
        {activeView === "calendar" && (
          <div className="p-3 bg-white">
            <div className="flex justify-center w-full">
              <CalendarComponent
                mode="single"
                selected={calendarDate}
                onSelect={setCalendarDate}
                initialFocus
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

            {/* Selected Date Card */}
            {selectedHoliday ? (
              <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-rose-950">{selectedHoliday.name}</p>
                    <p className="text-[10px] text-rose-600">
                      {format(new Date(selectedHoliday.date + "T00:00:00"), 'EEEE, MMMM do, yyyy')}
                    </p>
                  </div>
                  <Badge className="bg-rose-600 text-white text-[9px] font-semibold border-0">
                    {selectedHoliday.type}
                  </Badge>
                </div>
                {selectedHoliday.description && (
                  <p className="text-[10px] text-rose-700 mt-1">{selectedHoliday.description}</p>
                )}
              </div>
            ) : (calendarDate && calendarDate.getDay() === 0) ? (
              <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-rose-950">Sunday Weekly Holiday</p>
                    <p className="text-[10px] text-rose-600">
                      {calendarDate ? format(calendarDate, 'EEEE, MMMM do, yyyy') : ''}
                    </p>
                  </div>
                  <Badge className="bg-rose-600 text-white text-[9px] font-semibold border-0">
                    Weekly Off
                  </Badge>
                </div>
                <p className="text-[10px] text-rose-700 mt-1">Official Weekly Sunday Off • Portal in Sunday Mode</p>
              </div>
            ) : (
              <div className="mt-2 p-2 rounded-lg bg-gray-50 border border-gray-200 text-center">
                <p className="text-[11px] text-gray-500">
                  {calendarDate ? format(calendarDate, 'EEEE, MMM do') : ''} • Regular Working Day
                </p>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        {onNavigateToHolidays && (
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-gray-500 font-normal">Official Holiday Calendar</span>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onNavigateToHolidays()
              }}
              className="text-[11px] font-semibold text-[#4B49AC] hover:text-[#3b3a88] flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              Open Holidays Tab <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
