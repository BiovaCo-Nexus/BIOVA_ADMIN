import React, { useState } from "react";
import { FinanceManagement } from "./FinanceManagement";
import { InventoryManagement } from "./InventoryManagement";
import { PurchaseManagement } from "./PurchaseManagement";
import { InvoiceGenerator } from "./InvoiceGenerator";
import { CustomersManagement } from "./CustomersManagement";
import { SuppliersManagement } from "./SuppliersManagement";
import { ReceivablesPayables } from "./ReceivablesPayables";
import { 
  Building2, 
  Package, 
  ShoppingCart, 
  Receipt, 
  Users, 
  Truck, 
  CreditCard,
  IndianRupee
} from "lucide-react";
import { Button } from "./ui/button";

export function BusinessManagement() {
  const [activeSubTab, setActiveSubTab] = useState("finance");

  const subTabs = [
    { id: "finance", label: "Finance & Accounting", icon: IndianRupee },
    { id: "receivables", label: "A/R & A/P", icon: CreditCard },
    { id: "invoices", label: "Invoices", icon: Receipt },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "purchases", label: "Purchase Orders", icon: ShoppingCart },
    { id: "customers", label: "Customers", icon: Users },
    { id: "suppliers", label: "Suppliers", icon: Truck },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-navigation Header */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "ghost"}
              className={`flex-shrink-0 ${isActive ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setActiveSubTab(tab.id)}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Render Active Sub-Module */}
      <div className="bg-white rounded-xl">
        {activeSubTab === "finance" && <FinanceManagement />}
        {activeSubTab === "receivables" && <ReceivablesPayables />}
        {activeSubTab === "invoices" && <InvoiceGenerator />}
        {activeSubTab === "inventory" && <InventoryManagement />}
        {activeSubTab === "purchases" && <PurchaseManagement />}
        {activeSubTab === "customers" && <CustomersManagement />}
        {activeSubTab === "suppliers" && <SuppliersManagement />}
      </div>
    </div>
  );
}
