import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Sparkles,
  Inbox
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PersonalWorkspaceService, getCleanEmail } from "@/services/personalWorkspaceService"

interface PersonalNotificationsManagerProps {
  userEmail?: string
}

export function PersonalNotificationsManager({ userEmail }: PersonalNotificationsManagerProps) {
  const activeEmail = getCleanEmail(userEmail)
  const [notifications, setNotifications] = useState<any[]>([])
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const { toast } = useToast()

  useEffect(() => {
    loadNotifications()
  }, [activeEmail])

  const loadNotifications = async () => {
    const data = await PersonalWorkspaceService.getNotifications(activeEmail)
    setNotifications(data)
  }

  const handleMarkAsRead = async (id: string) => {
    const updated = await PersonalWorkspaceService.markNotificationRead(activeEmail, id)
    setNotifications(updated)
  }

  const handleMarkAllRead = async () => {
    const updated = await Promise.all(
      notifications.map(async n => {
        return await PersonalWorkspaceService.markNotificationRead(activeEmail, n.id)
      })
    )
    if (updated.length > 0) setNotifications(updated[updated.length - 1])
    toast({
      title: "All Notifications Marked Read",
      description: "Your inbox is caught up."
    })
  }

  const handleDelete = async (id: string) => {
    const updated = await PersonalWorkspaceService.deleteNotification(activeEmail, id)
    setNotifications(updated)
    toast({
      title: "Notification Dismissed",
      description: "Removed from your feed."
    })
  }

  const filteredNotifs = notifications.filter(n => filter === "unread" ? !n.read : true)
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="h-8 w-8 text-[#4B49AC]" /> My Notifications & Activity Feed
          </h2>
          <p className="text-gray-500 mt-2 flex items-center gap-2">
            Personal updates, alerts, and system notices for <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs">{activeEmail}</span>
          </p>
        </div>

        {unreadCount > 0 && (
          <Button onClick={handleMarkAllRead} variant="outline" className="border-[#4B49AC]/30 text-[#4B49AC] hover:bg-indigo-50 font-medium text-xs h-10 shadow-xs">
            <CheckCheck className="h-4 w-4 mr-1.5" /> Mark All as Read
          </Button>
        )}
      </div>

      {/* Notifications Card Container */}
      <Card className="border-gray-200">
        <CardHeader className="py-4 px-6 border-b border-gray-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-gray-900">Inbox</CardTitle>
            {unreadCount > 0 && (
              <Badge className="bg-[#4B49AC] text-white text-[10px]">
                {unreadCount} Unread
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === "all" ? "bg-white text-[#4B49AC] shadow-xs font-bold" : "text-gray-600"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === "unread" ? "bg-white text-[#4B49AC] shadow-xs font-bold" : "text-gray-600"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-2.5">
          {filteredNotifs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40 text-gray-400" />
              Your notification feed is completely clear!
            </div>
          ) : (
            filteredNotifs.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all cursor-pointer ${
                  notif.read
                    ? "bg-white border-gray-200 opacity-80"
                    : "bg-indigo-50/40 border-indigo-200 shadow-2xs"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl mt-0.5 ${notif.read ? "bg-gray-100 text-gray-500" : "bg-indigo-100 text-[#4B49AC]"}`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-bold ${notif.read ? "text-gray-800" : "text-gray-900"}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-[#4B49AC]" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notif.desc}</p>
                    <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {notif.time}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(notif.id)
                  }}
                  className="h-7 w-7 text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
