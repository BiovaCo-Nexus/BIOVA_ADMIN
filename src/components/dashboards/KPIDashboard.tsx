import React from "react"
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
