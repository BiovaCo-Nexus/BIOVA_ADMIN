import React from "react"
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
