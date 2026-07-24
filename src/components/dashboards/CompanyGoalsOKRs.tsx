import React from "react"
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
                <span className={`text-xs font-bold px-2 py-1 rounded-md text-white ${o.color}`}>{o.status}</span>
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
