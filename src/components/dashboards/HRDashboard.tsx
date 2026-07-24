import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, CreditCard, Star } from "lucide-react"

export function HRDashboard({ onNavigateToTab }: { onNavigateToTab?: (tabId: string) => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">HR Dashboard</h2>
        <p className="text-gray-500">Overview of Human Capital operations.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card onClick={() => onNavigateToTab?.('employees')} className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-blue-500">
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-500"/> Employees</CardTitle></CardHeader>
          <CardContent><p className="text-gray-500">Manage directory.</p></CardContent>
        </Card>
        <Card onClick={() => onNavigateToTab?.('leave_management')} className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-amber-500">
          <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-amber-500"/> Leave Requests</CardTitle></CardHeader>
          <CardContent><p className="text-gray-500">Review time-offs.</p></CardContent>
        </Card>
        <Card onClick={() => onNavigateToTab?.('payroll')} className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-emerald-500">
          <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-emerald-500"/> Payroll</CardTitle></CardHeader>
          <CardContent><p className="text-gray-500">Process salaries.</p></CardContent>
        </Card>
        <Card onClick={() => onNavigateToTab?.('performance_reviews')} className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-purple-500">
          <CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-purple-500"/> Reviews</CardTitle></CardHeader>
          <CardContent><p className="text-gray-500">Track performance.</p></CardContent>
        </Card>
      </div>
    </div>
  )
}
