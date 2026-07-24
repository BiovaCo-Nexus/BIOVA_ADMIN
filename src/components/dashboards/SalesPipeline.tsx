import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export function SalesPipeline({ onNavigateToTab }: { onNavigateToTab?: (tabId: string) => void }) {
  const stages = [
    { name: 'Prospecting', count: 12, value: 450000, color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { name: 'Proposal Sent', count: 5, value: 250000, color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { name: 'Negotiation', count: 3, value: 300000, color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { name: 'Closed Won', count: 8, value: 850000, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><BarChart3 className="h-8 w-8 text-[#4B49AC]" /> Sales Pipeline</h2>
          <p className="text-gray-500 mt-2">Visual overview of all active deals.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stages.map(s => (
          <Card key={s.name} onClick={() => onNavigateToTab?.('deals')} className="cursor-pointer hover:shadow-md transition-all">
            <CardHeader className={`pb-2 border-b ${s.color} bg-opacity-50`}>
              <CardTitle className="text-sm font-bold">{s.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-gray-900">{s.count} Deals</div>
              <p className="text-sm font-medium text-gray-500 mt-1">₹{s.value.toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
