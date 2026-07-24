import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, TrendingUp, Users, ArrowUpRight, CheckCircle2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"

export function CEODashboard({ onNavigateToTab }: { onNavigateToTab?: (tabId: string) => void }) {
  const [stats, setStats] = useState({ expenses: 0, revenue: 0, interns: 0, pendingTasks: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const { data: exp } = await supabase.from('expense_records').select('amount')
      const { data: inc } = await supabase.from('income_records').select('amount')
      const { count: intCount } = await supabase.from('interns').select('*', { count: 'exact', head: true })
      const { count: taskCount } = await supabase.from('ceo_md_timetable').select('*', { count: 'exact', head: true }).neq('status', 'completed')

      setStats({
        expenses: exp?.reduce((a, b) => a + (b.amount || 0), 0) || 0,
        revenue: inc?.reduce((a, b) => a + (b.amount || 0), 0) || 0,
        interns: intCount || 0,
        pendingTasks: taskCount || 0
      })
      setLoading(false)
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">CEO Command Center</h2>
          <p className="text-gray-500">High-level overview of enterprise health.</p>
        </div>
        <Button onClick={() => onNavigateToTab?.('reports_center')} className="bg-[#4B49AC] text-white">View Full Report</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium opacity-80">Total Revenue</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="h-5 w-5" /> ₹{stats.revenue.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card onClick={() => onNavigateToTab?.('intern_management')} className="cursor-pointer hover:border-[#4B49AC] transition-all border-gray-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Active Workforce (Interns)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2 text-gray-900"><Users className="h-5 w-5 text-emerald-500" /> {stats.interns}</div>
          </CardContent>
        </Card>
        <Card onClick={() => onNavigateToTab?.('executive_calendar')} className="cursor-pointer hover:border-[#4B49AC] transition-all border-gray-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Pending Executive Tasks</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2 text-gray-900"><Briefcase className="h-5 w-5 text-amber-500" /> {stats.pendingTasks}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
