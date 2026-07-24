import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Briefcase, FileText, CheckCircle2, User, Star, ShieldAlert } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { formatDistanceToNow } from "date-fns"

export function Notifications({ onNavigateToTab }: { onNavigateToTab?: (tabId: string) => void }) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Generate some mock notifications plus fetch recent tasks as real notifications
    const fetchRealData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      let realNotifications: any[] = []
      
      // If user exists, get their new tasks
      if (user) {
        const { data } = await supabase
          .from('ceo_md_timetable')
          .select('*')
          .ilike('assigned_email', `%${user.email}%`)
          .order('created_at', { ascending: false })
          .limit(5)
          
        if (data) {
          realNotifications = data.map(d => ({
            id: `task-${d.id}`,
            type: 'task',
            title: 'New Task Assigned',
            message: `You have been assigned: ${d.activity_name}`,
            time: new Date(d.created_at || new Date()),
            read: false,
            icon: <Briefcase className="h-5 w-5 text-blue-500" />,
            color: 'bg-blue-50 border-blue-100'
          }))
        }
      }

      // Add some system mock notifications to make it look active
      const systemNotifications = [
        {
          id: 'sys-1',
          type: 'system',
          title: 'System Update Completed',
          message: 'BiovaCo Nexus v2.4 has been successfully deployed without downtime.',
          time: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
          read: true,
          icon: <ShieldAlert className="h-5 w-5 text-emerald-500" />,
          color: 'bg-emerald-50 border-emerald-100'
        },
        {
          id: 'sys-2',
          type: 'hr',
          title: 'New Intern Application',
          message: 'Rahul Sharma has applied for the Frontend Developer role.',
          time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          read: false,
          icon: <User className="h-5 w-5 text-purple-500" />,
          color: 'bg-purple-50 border-purple-100'
        },
        {
          id: 'sys-3',
          type: 'finance',
          title: 'Invoice Paid',
          message: 'Invoice #INV-2026-0045 for ₹45,000 has been marked as paid.',
          time: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          read: true,
          icon: <FileText className="h-5 w-5 text-amber-500" />,
          color: 'bg-amber-50 border-amber-100'
        }
      ]

      const combined = [...realNotifications, ...systemNotifications].sort((a, b) => b.time.getTime() - a.time.getTime())
      setNotifications(combined)
      setLoading(false)
    }
    
    fetchRealData()
  }, [])

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleNotifClick = (notif: any) => {
    // If notif is not read, mark it as read locally (optional)
    if (!notif.read) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
    }
    
    // Navigate based on type
    if (notif.type === 'task') onNavigateToTab?.('executive_calendar')
    else if (notif.type === 'hr') onNavigateToTab?.('applications')
    else if (notif.type === 'finance') onNavigateToTab?.('finance_analytics')
    else if (notif.type === 'system') onNavigateToTab?.('audit_logs')
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8 border-b pb-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Bell className="h-8 w-8 text-[#4B49AC]" /> Notification Center
          </h2>
          <p className="text-gray-500 mt-2">Stay updated with everything happening in the enterprise.</p>
        </div>
        <Button variant="outline" onClick={markAllRead} className="hidden sm:flex text-gray-600">
          <CheckCircle2 className="h-4 w-4 mr-2" /> Mark all as read
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-12 text-gray-400">Loading notifications...</div>
        ) : (
          notifications.map(notif => (
            <Card key={notif.id} onClick={() => handleNotifClick(notif)} className={`overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md ${notif.read ? 'bg-white border-gray-100' : `${notif.color} border shadow-sm`}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl bg-white shadow-sm border ${notif.read ? 'opacity-50' : ''}`}>
                    {notif.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className={`font-semibold ${notif.read ? 'text-gray-600' : 'text-gray-900'}`}>{notif.title}</h4>
                      <span className="text-xs font-medium text-gray-400">{formatDistanceToNow(notif.time, { addSuffix: true })}</span>
                    </div>
                    <p className={`text-sm mt-1 ${notif.read ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>{notif.message}</p>
                  </div>
                  {!notif.read && (
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500 mt-2 flex-shrink-0 animate-pulse"></div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
