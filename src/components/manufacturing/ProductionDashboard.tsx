import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { FileText, Factory, Briefcase, Settings, BarChart3, AlertTriangle, ShieldCheck } from "lucide-react"

interface DashboardStats {
  totalBOMs: number;
  activeOrders: number;
  pendingChecks: number;
  machinesOperational: number;
}

export function ProductionDashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [stats, setStats] = useState<DashboardStats>({
    totalBOMs: 0, activeOrders: 0, pendingChecks: 0, machinesOperational: 0
  })

  useEffect(() => {
    const fetch = async () => {
      try {
        const [r1, r2, r3, r4] = await Promise.all([
          supabase.from("mfg_bom").select("*", { count: "exact", head: true }),
          supabase.from("mfg_production_orders").select("*", { count: "exact", head: true }).in("status", ["Planned", "In Progress"]),
          supabase.from("mfg_quality_checks").select("*", { count: "exact", head: true }).eq("status", "Pending"),
          supabase.from("mfg_machines").select("*", { count: "exact", head: true }).eq("status", "Operational"),
        ])
        setStats({
          totalBOMs: r1.count || 0, 
          activeOrders: r2.count || 0, 
          pendingChecks: r3.count || 0,
          machinesOperational: r4.count || 0,
        })
      } catch (e) { console.error("Dashboard stats error:", e) }
    }
    fetch()
  }, [])

  const cards = [
    { label: "Active Orders", value: stats.activeOrders, icon: FileText, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", tab: "orders" },
    { label: "Bill of Materials", value: stats.totalBOMs, icon: FileText, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", tab: "bom" },
    { label: "Pending Quality Checks", value: stats.pendingChecks, icon: ShieldCheck, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", tab: "quality" },
    { label: "Machines Operational", value: stats.machinesOperational, icon: Factory, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", tab: "machines" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Manufacturing Dashboard</h2>
        <p className="text-sm text-gray-500">Real-time overview of production operations</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map(c => (
          <Card key={c.label} className={`${c.bg} border ${c.border} shadow-sm cursor-pointer hover:shadow-md transition-shadow`} onClick={() => onNavigate(c.tab)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-white shadow-sm`}><c.icon className={`h-5 w-5 ${c.color}`} /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                <p className="text-[11px] text-gray-500 font-medium">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 border border-border">
        <CardHeader className="bg-muted/50 pb-4 border-b border-border">
          <CardTitle className="text-foreground flex items-center gap-2 text-lg">
            <Factory className="h-5 w-5 text-foreground" />
            Manufacturing Flow Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-secondary p-2 rounded-full text-foreground shrink-0"><FileText className="h-4 w-4" /></div>
                <div><h4 className="font-semibold text-gray-900 text-sm">1. Bill of Materials (BOM)</h4><p className="text-sm text-gray-600 leading-relaxed">Create the master blueprint for a product. List all the raw materials and quantities required to produce one unit.</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground p-2 rounded-full shrink-0"><Factory className="h-4 w-4" /></div>
                <div><h4 className="font-semibold text-gray-900 text-sm">2. Production Orders</h4><p className="text-sm text-gray-600 leading-relaxed">Initiate a production run. Select a BOM, set the target quantity, assign a machine, and track the progress from Planned to Completed.</p></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-orange-100 p-2 rounded-full text-orange-700 shrink-0"><ShieldCheck className="h-4 w-4" /></div>
                <div><h4 className="font-semibold text-gray-900 text-sm">3. Quality Checks</h4><p className="text-sm text-gray-600 leading-relaxed">Ensure production standards. Log quality inspections for active production orders before marking them as ready for inventory.</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-full text-green-700 shrink-0"><Settings className="h-4 w-4" /></div>
                <div><h4 className="font-semibold text-gray-900 text-sm">4. Machines & Maintenance</h4><p className="text-sm text-gray-600 leading-relaxed">Manage your factory equipment. Track operational status, log maintenance schedules, and prevent downtimes.</p></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
