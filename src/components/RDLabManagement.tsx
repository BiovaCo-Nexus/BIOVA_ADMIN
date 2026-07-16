import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RDDashboard } from "./rd-lab/RDDashboard"
import { RecipeFormulation } from "./rd-lab/RecipeFormulation"
import { RawMaterialLibrary } from "./rd-lab/RawMaterialLibrary"
import { IngredientInventory } from "./rd-lab/IngredientInventory"
import { BatchTrials } from "./rd-lab/BatchTrials"
import { ProductTesting } from "./rd-lab/ProductTesting"
import { ShelfLifeTesting } from "./rd-lab/ShelfLifeTesting"
import { QCChecklists } from "./rd-lab/QCChecklists"
import { ManufacturingSOP } from "./rd-lab/ManufacturingSOP"
import { SupplierManagement } from "./rd-lab/SupplierManagement"
import { SampleManagement } from "./rd-lab/SampleManagement"
import { CostCalculator } from "./rd-lab/CostCalculator"
import { DocumentVault } from "./rd-lab/DocumentVault"
import { RDReports } from "./rd-lab/RDReports"
import { OfflineSyncManager } from "./rd-lab/OfflineSyncManager"
import { LayoutDashboard, FlaskConical, TestTubes, Package, ClipboardCheck, Scale, FileText, Truck, Users, Calculator, FolderOpen, FileBarChart } from "lucide-react"

export function RDLabManagement() {
  const [activeTab, setActiveTab] = useState("dashboard")

  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "recipes", label: "Recipe Formulation", icon: FlaskConical },
    { id: "trials", label: "Batch Trials", icon: TestTubes },
    { id: "materials", label: "Raw Materials", icon: Package },
    { id: "inventory", label: "Ingredient Inventory", icon: Scale },
    { id: "testing", label: "Product Testing", icon: ClipboardCheck },
    { id: "shelflife", label: "Shelf Life", icon: ClipboardCheck },
    { id: "qc", label: "QC Checklists", icon: FileText },
    { id: "sops", label: "Mfg SOPs", icon: FileText },
    { id: "suppliers", label: "Suppliers", icon: Truck },
    { id: "samples", label: "Samples", icon: Users },
    { id: "costing", label: "Cost Calc", icon: Calculator },
    { id: "vault", label: "Doc Vault", icon: FolderOpen },
    { id: "reports", label: "Reports", icon: FileBarChart },
  ]

  return (
    <div className="space-y-4">
      <OfflineSyncManager />
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
                  isActive ? "bg-white text-[#032E63] shadow-sm ring-1 ring-gray-200" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-[#08A04B]" : "text-gray-400"}`} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4">
        {activeTab === "dashboard" && <RDDashboard onNavigate={setActiveTab} />}
        {activeTab === "recipes" && <RecipeFormulation />}
        {activeTab === "materials" && <RawMaterialLibrary />}
        {activeTab === "inventory" && <IngredientInventory />}
        {activeTab === "trials" && <BatchTrials />}
        {activeTab === "testing" && <ProductTesting />}
        {activeTab === "shelflife" && <ShelfLifeTesting />}
        {activeTab === "qc" && <QCChecklists />}
        {activeTab === "sops" && <ManufacturingSOP />}
        {activeTab === "suppliers" && <SupplierManagement />}
        {activeTab === "samples" && <SampleManagement />}
        {activeTab === "costing" && <CostCalculator />}
        {activeTab === "vault" && <DocumentVault />}
        {activeTab === "reports" && <RDReports />}
      </div>
    </div>
  )
}
