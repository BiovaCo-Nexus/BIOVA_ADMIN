import React from "react"
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
