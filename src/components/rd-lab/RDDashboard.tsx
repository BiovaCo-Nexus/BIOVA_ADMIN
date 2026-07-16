import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"
import { Beaker, FlaskConical, Package, ClipboardCheck, Truck, FileText, BarChart3, TestTubes, ShieldCheck, Factory, Users, Calculator, AlertTriangle } from "lucide-react"

interface DashboardStats {
  totalRecipes: number; approvedRecipes: number; devRecipes: number;
  totalTrials: number; totalMaterials: number; lowStockCount: number;
  runningShelfTests: number; totalSuppliers: number; pendingSamples: number;
}

export function RDDashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [stats, setStats] = useState<DashboardStats>({
    totalRecipes: 0, approvedRecipes: 0, devRecipes: 0,
    totalTrials: 0, totalMaterials: 0, lowStockCount: 0,
    runningShelfTests: 0, totalSuppliers: 0, pendingSamples: 0,
  })

  useEffect(() => {
    const fetch = async () => {
      try {
        const [r1, r2, r3, r4, r5, r6, r7, r8] = await Promise.all([
          supabase.from("rd_recipes").select("*", { count: "exact", head: true }),
          supabase.from("rd_recipes").select("*", { count: "exact", head: true }).eq("status", "approved"),
          supabase.from("rd_recipes").select("*", { count: "exact", head: true }).in("status", ["draft", "testing"]),
          supabase.from("rd_batch_trials").select("*", { count: "exact", head: true }),
          supabase.from("rd_raw_materials").select("*", { count: "exact", head: true }),
          supabase.from("rd_shelf_life_tests").select("*", { count: "exact", head: true }).eq("status", "running"),
          supabase.from("rd_suppliers").select("*", { count: "exact", head: true }),
          supabase.from("rd_samples").select("*", { count: "exact", head: true }).eq("status", "sent"),
        ])
        setStats({
          totalRecipes: r1.count || 0, approvedRecipes: r2.count || 0, devRecipes: r3.count || 0,
          totalTrials: r4.count || 0, totalMaterials: r5.count || 0, lowStockCount: 0,
          runningShelfTests: r6.count || 0, totalSuppliers: r7.count || 0, pendingSamples: r8.count || 0,
        })
      } catch (e) { console.error("Dashboard stats error:", e) }
    }
    fetch()
  }, [])

  const cards = [
    { label: "Total Recipes", value: stats.totalRecipes, icon: FlaskConical, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200", tab: "recipes" },
    { label: "Approved Recipes", value: stats.approvedRecipes, icon: ShieldCheck, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", tab: "recipes" },
    { label: "Under Development", value: stats.devRecipes, icon: Beaker, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", tab: "recipes" },
    { label: "Batch Trials", value: stats.totalTrials, icon: TestTubes, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", tab: "trials" },
    { label: "Raw Materials", value: stats.totalMaterials, icon: Package, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", tab: "materials" },
    { label: "Shelf-Life Tests", value: stats.runningShelfTests, icon: ClipboardCheck, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200", tab: "shelflife" },
    { label: "Suppliers", value: stats.totalSuppliers, icon: Truck, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200", tab: "suppliers" },
    { label: "Pending Samples", value: stats.pendingSamples, icon: Users, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200", tab: "samples" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#032E63]">R&D Lab Dashboard</h2>
        <p className="text-sm text-gray-500">Real-time overview of all lab operations</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Card key={c.label} className={`${c.bg} border ${c.border} shadow-sm cursor-pointer hover:shadow-md transition-shadow`} onClick={() => onNavigate(c.tab)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${c.bg}`}><c.icon className={`h-5 w-5 ${c.color}`} /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                <p className="text-[11px] text-gray-500 font-medium">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
