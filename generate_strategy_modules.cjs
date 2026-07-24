const fs = require('fs');

const ceoDashboard = `import React, { useState, useEffect } from "react"
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
`;

const mdDashboard = `import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Zap, CheckCircle2 } from "lucide-react"

export function MDDashboard({ onNavigateToTab }: { onNavigateToTab?: (tabId: string) => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Managing Director Operations</h2>
        <p className="text-gray-500">Execution, efficiency, and day-to-day operations metrics.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card onClick={() => onNavigateToTab?.('my_work')} className="cursor-pointer hover:shadow-md transition-all">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><CheckCircle2 className="h-5 w-5 text-blue-500"/> Action Items</CardTitle></CardHeader>
          <CardContent><p className="text-gray-500">Review pending executions assigned by the CEO.</p></CardContent>
        </Card>
        <Card onClick={() => onNavigateToTab?.('operations_dashboard')} className="cursor-pointer hover:shadow-md transition-all">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Settings className="h-5 w-5 text-gray-700"/> Core Operations</CardTitle></CardHeader>
          <CardContent><p className="text-gray-500">Monitor plant and facility status metrics.</p></CardContent>
        </Card>
      </div>
    </div>
  )
}
`;

const okrs = `import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Target, Flag } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function CompanyGoalsOKRs() {
  const okrs = [
    { objective: "Expand Market Share in Q3", progress: 75, status: "On Track", color: "bg-emerald-500" },
    { objective: "Launch 3 New R&D Formulations", progress: 40, status: "At Risk", color: "bg-amber-500" },
    { objective: "Reduce Operational Overheads by 15%", progress: 90, status: "Near Completion", color: "bg-blue-500" }
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><Target className="h-8 w-8 text-[#4B49AC]" /> Objectives & Key Results (OKRs)</h2>
      </div>
      <div className="space-y-4">
        {okrs.map((o, i) => (
          <Card key={i} className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2"><Flag className="h-4 w-4 text-gray-400"/> {o.objective}</h3>
                <span className={\`text-xs font-bold px-2 py-1 rounded-md text-white \${o.color}\`}>{o.status}</span>
              </div>
              <Progress value={o.progress} className="h-2" />
              <p className="text-xs text-gray-500 mt-2 font-medium">{o.progress}% Completed</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
`;

const kpiDashboard = `import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Activity } from "lucide-react"

export function KPIDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><Activity className="h-8 w-8 text-[#4B49AC]" /> KPI Dashboard</h2>
        <p className="text-gray-500 mt-2">Enterprise-wide Key Performance Indicators.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['Customer Acquisition Cost (CAC)', 'Lifetime Value (LTV)', 'Employee Retention', 'Net Promoter Score (NPS)'].map(kpi => (
          <Card key={kpi} className="border-gray-200">
            <CardContent className="p-6 text-center">
              <h4 className="text-sm font-semibold text-gray-500 mb-2">{kpi}</h4>
              <div className="text-3xl font-bold text-[#4B49AC]">N/A</div>
              <p className="text-xs text-gray-400 mt-2">Pending Data Integration</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
`;

const bi = `import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { BrainCircuit } from "lucide-react"

export function BusinessIntelligence() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><BrainCircuit className="h-8 w-8 text-[#4B49AC]" /> Business Intelligence</h2>
        <p className="text-gray-500 mt-2">Advanced Analytics and Predictive Modeling.</p>
      </div>
      <Card className="bg-gray-50 border-dashed border-2 border-gray-300">
        <CardContent className="p-12 text-center text-gray-500 font-medium">
          Machine Learning models are currently analyzing your dataset. Insights will appear here shortly.
        </CardContent>
      </Card>
    </div>
  )
}
`;

const reports = `import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function ReportsCenter() {
  const { toast } = useToast()
  const handleDownload = () => toast({ title: "Downloading Report", description: "Your PDF is being generated." })

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><FileText className="h-8 w-8 text-[#4B49AC]" /> Reports Center</h2>
        <p className="text-gray-500 mt-2">Generate and download executive reports.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['Q2 Financial Summary', 'Monthly HR & Payroll', 'Annual R&D Output', 'Operations Health Index'].map(rep => (
          <Card key={rep} className="border-gray-200">
            <CardContent className="p-6 flex justify-between items-center">
              <span className="font-semibold text-gray-800">{rep}</span>
              <Button variant="outline" size="sm" onClick={handleDownload}><Download className="h-4 w-4 mr-2"/> PDF</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
`;

fs.writeFileSync('src/components/dashboards/CEODashboard.tsx', ceoDashboard);
fs.writeFileSync('src/components/dashboards/MDDashboard.tsx', mdDashboard);
fs.writeFileSync('src/components/dashboards/CompanyGoalsOKRs.tsx', okrs);
fs.writeFileSync('src/components/dashboards/KPIDashboard.tsx', kpiDashboard);
fs.writeFileSync('src/components/dashboards/BusinessIntelligence.tsx', bi);
fs.writeFileSync('src/components/dashboards/ReportsCenter.tsx', reports);
console.log("Modules created successfully.");
