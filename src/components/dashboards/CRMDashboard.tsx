import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Users, Briefcase, Headset } from "lucide-react"

export function CRMDashboard({ onNavigateToTab }: { onNavigateToTab?: (tabId: string) => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">CRM Command Center</h2>
        <p className="text-gray-500">Manage customer relationships, sales pipelines, and support.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card onClick={() => onNavigateToTab?.('leads')} className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-indigo-500">
          <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-indigo-500"/> Leads</CardTitle></CardHeader>
          <CardContent><p className="text-gray-500">Track new prospects.</p></CardContent>
        </Card>
        <Card onClick={() => onNavigateToTab?.('accounts')} className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-blue-500">
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-500"/> Accounts</CardTitle></CardHeader>
          <CardContent><p className="text-gray-500">Manage clients.</p></CardContent>
        </Card>
        <Card onClick={() => onNavigateToTab?.('deals')} className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-emerald-500">
          <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-emerald-500"/> Deals</CardTitle></CardHeader>
          <CardContent><p className="text-gray-500">Sales pipeline.</p></CardContent>
        </Card>
        <Card onClick={() => onNavigateToTab?.('customer_support')} className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-orange-500">
          <CardHeader><CardTitle className="flex items-center gap-2"><Headset className="h-5 w-5 text-orange-500"/> Support</CardTitle></CardHeader>
          <CardContent><p className="text-gray-500">Resolve tickets.</p></CardContent>
        </Card>
      </div>
    </div>
  )
}
