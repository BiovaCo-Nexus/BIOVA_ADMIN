import React, { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Activity, User, Clock } from "lucide-react"

interface AdminLog {
  id: string;
  admin_email: string;
  action_type: string;
  entity_name: string;
  details: string;
  created_at: string;
}

interface AdminActivityLogsProps {
  setActiveTab?: (tab: string) => void;
}

export function AdminActivityLogs({ setActiveTab }: AdminActivityLogsProps = {}) {
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
    
    // Set up realtime subscription for live updates
    const channel = supabase
      .channel('admin_logs_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_activity_logs' }, (payload) => {
        setLogs(currentLogs => [payload.new as AdminLog, ...currentLogs])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('admin_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching admin logs. Table might not exist yet:", error)
    } else {
      setLogs(data || [])
    }
    setLoading(false)
  }

  const handleLogClick = (actionType: string) => {
    if (!setActiveTab) return;
    
    // Determine which tab to go to based on action type
    if (["STATUS_CHANGED", "EMAIL_SENT", "INTERNAL_NOTE"].includes(actionType)) {
      setActiveTab("applications");
    } else if (["CREATED_POST", "UPDATED_POST", "DELETED_POST", "TOGGLED_POST_STATUS"].includes(actionType)) {
      setActiveTab("posts");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
          <Activity className="h-5 w-5 text-blue-600" />
          Admin Activity Audit Log
        </CardTitle>
        <p className="text-sm text-gray-500">
          Securely track all changes made by administrators (CEOs, MDs, HRs) in real-time.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No recent administrative activity found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div 
                key={log.id} 
                onClick={() => handleLogClick(log.action_type)}
                className={`p-4 transition-colors flex items-start gap-4 ${setActiveTab ? 'cursor-pointer hover:bg-blue-50/80' : 'hover:bg-blue-50/50'}`}
              >
                <div className="bg-blue-100 text-blue-600 p-2 rounded-full mt-1">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm text-gray-900">
                      {log.admin_email}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.created_at).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <p className="text-sm text-gray-800 mb-1">
                    <span className="font-medium text-blue-700">{log.action_type.replace(/_/g, ' ')}</span> on <span className="font-medium">{log.entity_name}</span>
                  </p>
                  {log.details && (
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 mt-2">
                      {log.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
