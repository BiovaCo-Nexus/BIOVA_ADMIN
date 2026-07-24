import { useState } from "react"
import { ProductionDashboard } from "./manufacturing/ProductionDashboard"
import { BillOfMaterials } from "./manufacturing/BillOfMaterials"
import { ProductionOrders } from "./manufacturing/ProductionOrders"
import { QualityCheck } from "./manufacturing/QualityCheck"
import { Machines } from "./manufacturing/Machines"
import { ProductionReports } from "./manufacturing/ProductionReports"
import { MaintenanceManagement } from "./MaintenanceManagement"
import { LayoutDashboard, FileText, Briefcase, Factory, Settings, BarChart3 } from "lucide-react"

interface ManufacturingManagementProps {
  initialTab?: string;
}

export function ManufacturingManagement({ initialTab = "dashboard" }: ManufacturingManagementProps) {
  const [activeTab, setActiveTab] = useState(initialTab)

  const TABS = [
    { id: "dashboard", label: "Production Dashboard", icon: LayoutDashboard },
    { id: "bom", label: "Bill of Materials (BOM)", icon: FileText },
    { id: "orders", label: "Production Orders", icon: FileText },
    { id: "quality", label: "Quality Check", icon: Briefcase },
    { id: "machines", label: "Machines", icon: Factory },
    { id: "maintenance", label: "Maintenance", icon: Settings },
    { id: "reports", label: "Reports", icon: BarChart3 }
  ]

  return (
    <div className="space-y-4">
      {/* Responsive multi-row tab bar */}
      <div className="pb-2">
        <div className="flex flex-wrap gap-1 bg-white/50 p-1.5 rounded-lg border border-gray-100">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isActive ? "bg-white text-foreground ring-1 ring-gray-200" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-muted-foreground" : "text-gray-400"}`} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4">
        {activeTab === "dashboard" && <ProductionDashboard onNavigate={setActiveTab} />}
        {activeTab === "bom" && <BillOfMaterials />}
        {activeTab === "orders" && <ProductionOrders />}
        {activeTab === "quality" && <QualityCheck />}
        {activeTab === "machines" && <Machines />}
        {activeTab === "maintenance" && <MaintenanceManagement />}
        {activeTab === "reports" && <ProductionReports />}
      </div>
    </div>
  )
}
