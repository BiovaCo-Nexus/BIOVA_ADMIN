import React from "react"
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
