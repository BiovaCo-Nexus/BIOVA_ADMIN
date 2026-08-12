import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, UserPlus, Trash2, Save, Loader2, RefreshCw,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Search, Sparkles, Wand2, Cpu, Download, Calendar, Clock, FileSpreadsheet
} from "lucide-react";

// Master list of all available pages in the admin panel
const ALL_PAGES = [
  { id: "dashboard", label: "Dashboard", group: "Executive Dashboard" },
  { id: "my_work", label: "My Work", group: "Executive Dashboard" },
  { id: "notifications", label: "Notifications", group: "Executive Dashboard" },
  { id: "ai_business_assistant", label: "AI Business Assistant", group: "Executive Dashboard" },
  { id: "global_search", label: "Global Search", group: "Executive Dashboard" },
  { id: "ceo_dashboard", label: "CEO Dashboard", group: "Executive & Strategy" },
  { id: "md_dashboard", label: "MD Dashboard", group: "Executive & Strategy" },
  { id: "executive_calendar", label: "Executive Calendar", group: "Executive & Strategy" },
  { id: "company_goals_okrs", label: "Company Goals (OKRs)", group: "Executive & Strategy" },
  { id: "kpi_dashboard", label: "KPI Dashboard", group: "Executive & Strategy" },
  { id: "business_intelligence", label: "Business Intelligence", group: "Executive & Strategy" },
  { id: "reports_center", label: "Reports Center", group: "Executive & Strategy" },
  { id: "compliance_ai", label: "Compliance AI Lawyer", group: "Executive & Strategy" },
  { id: "company_profile", label: "Company Profile", group: "Organization" },
  { id: "departments", label: "Departments", group: "Organization" },
  { id: "branches", label: "Branches", group: "Organization" },
  { id: "teams", label: "Teams", group: "Organization" },
  { id: "organization_chart", label: "Organization Chart", group: "Organization" },
  { id: "hr_dashboard", label: "HR Dashboard", group: "Human Resources (HRMS)" },
  { id: "employees", label: "Employees", group: "Human Resources (HRMS)" },
  { id: "intern_management", label: "Intern Management", group: "Human Resources (HRMS)" },
  { id: "attendance", label: "Attendance", group: "Human Resources (HRMS)" },
  { id: "leave_management", label: "Leave Management", group: "Human Resources (HRMS)" },
  { id: "payroll", label: "Payroll", group: "Human Resources (HRMS)" },
  { id: "performance_reviews", label: "Performance Reviews", group: "Human Resources (HRMS)" },
  { id: "recruitment", label: "Recruitment", group: "Human Resources (HRMS)" },
  { id: "job_positions", label: "Job Positions", group: "Human Resources (HRMS)" },
  { id: "applications", label: "Applications", group: "Human Resources (HRMS)" },
  { id: "offer_letters", label: "Offer Letters", group: "Human Resources (HRMS)" },
  { id: "exit_management", label: "Exit Management", group: "Human Resources (HRMS)" },
  { id: "assets_assigned", label: "Assets Assigned", group: "Human Resources (HRMS)" },
  { id: "crm_dashboard", label: "CRM Dashboard", group: "CRM (Customer Relationship Management)" },
  { id: "leads", label: "Leads", group: "CRM (Customer Relationship Management)" },
  { id: "opportunities", label: "Opportunities", group: "CRM (Customer Relationship Management)" },
  { id: "accounts_companies", label: "Accounts (Companies)", group: "CRM (Customer Relationship Management)" },
  { id: "contacts", label: "Contacts", group: "CRM (Customer Relationship Management)" },
  { id: "customers", label: "Customers", group: "CRM (Customer Relationship Management)" },
  { id: "sales_pipeline", label: "Sales Pipeline", group: "CRM (Customer Relationship Management)" },
  { id: "quotations", label: "Quotations", group: "CRM (Customer Relationship Management)" },
  { id: "followups", label: "Follow-ups", group: "CRM (Customer Relationship Management)" },
  { id: "meetings", label: "Meetings", group: "CRM (Customer Relationship Management)" },
  { id: "calls", label: "Calls", group: "CRM (Customer Relationship Management)" },
  { id: "emails", label: "Emails", group: "CRM (Customer Relationship Management)" },
  { id: "deals", label: "Deals", group: "CRM (Customer Relationship Management)" },
  { id: "customer_support", label: "Customer Support", group: "CRM (Customer Relationship Management)" },
  { id: "complaints", label: "Complaints", group: "CRM (Customer Relationship Management)" },
  { id: "feedback", label: "Feedback", group: "CRM (Customer Relationship Management)" },
  { id: "contracts", label: "Contracts", group: "CRM (Customer Relationship Management)" },
  { id: "sales_dashboard", label: "Sales Dashboard", group: "Sales" },
  { id: "orders", label: "Orders", group: "Sales" },
  { id: "quotations_sales", label: "Quotations", group: "Sales" },
  { id: "proforma_invoice", label: "Proforma Invoice", group: "Sales" },
  { id: "invoices", label: "Invoices", group: "Sales" },
  { id: "payments", label: "Payments", group: "Sales" },
  { id: "sales_analytics", label: "Sales Analytics", group: "Sales" },
  { id: "price_lists", label: "Price Lists", group: "Sales" },
  { id: "discounts", label: "Discounts", group: "Sales" },
  { id: "inventory_dashboard", label: "Inventory Dashboard", group: "Inventory & Warehouse" },
  { id: "products", label: "Products", group: "Inventory & Warehouse" },
  { id: "categories", label: "Categories", group: "Inventory & Warehouse" },
  { id: "warehouses", label: "Warehouses", group: "Inventory & Warehouse" },
  { id: "stock_movement", label: "Stock Movement", group: "Inventory & Warehouse" },
  { id: "purchase_requests", label: "Purchase Requests", group: "Inventory & Warehouse" },
  { id: "stock_adjustment", label: "Stock Adjustment", group: "Inventory & Warehouse" },
  { id: "batch_tracking", label: "Batch Tracking", group: "Inventory & Warehouse" },
  { id: "barcode_management", label: "Barcode Management", group: "Inventory & Warehouse" },
  { id: "production_dashboard", label: "Production Dashboard", group: "Manufacturing" },
  { id: "bill_of_materials_bom", label: "Bill of Materials (BOM)", group: "Manufacturing" },
  { id: "production_orders", label: "Production Orders", group: "Manufacturing" },
  { id: "quality_check", label: "Quality Check", group: "Manufacturing" },
  { id: "machines", label: "Machines", group: "Manufacturing" },
  { id: "maintenance", label: "Maintenance", group: "Manufacturing" },
  { id: "production_reports", label: "Production Reports", group: "Manufacturing" },
  { id: "finance_dashboard", label: "Finance Dashboard", group: "Finance & Accounting" },
  { id: "chart_of_accounts", label: "Chart of Accounts", group: "Finance & Accounting" },
  { id: "journal_entries", label: "Journal Entries", group: "Finance & Accounting" },
  { id: "general_ledger", label: "General Ledger", group: "Finance & Accounting" },
  { id: "trial_balance", label: "Trial Balance", group: "Finance & Accounting" },
  { id: "profit_loss", label: "Profit & Loss", group: "Finance & Accounting" },
  { id: "balance_sheet", label: "Balance Sheet", group: "Finance & Accounting" },
  { id: "cash_flow", label: "Cash Flow", group: "Finance & Accounting" },
  { id: "budget", label: "Budget", group: "Finance & Accounting" },
  { id: "expenses", label: "Expenses", group: "Finance & Accounting" },
  { id: "receivables", label: "Receivables", group: "Finance & Accounting" },
  { id: "payables", label: "Payables", group: "Finance & Accounting" },
  { id: "gst", label: "GST", group: "Finance & Accounting" },
  { id: "tax_center", label: "Tax Center", group: "Finance & Accounting" },
  { id: "fixed_assets", label: "Fixed Assets", group: "Finance & Accounting" },
  { id: "procurement_dashboard", label: "Procurement Dashboard", group: "Procurement" },
  { id: "vendors", label: "Vendors", group: "Procurement" },
  { id: "purchase_orders", label: "Purchase Orders", group: "Procurement" },
  { id: "rfq", label: "RFQ", group: "Procurement" },
  { id: "vendor_quotations", label: "Vendor Quotations", group: "Procurement" },
  { id: "goods_received_note_grn", label: "Goods Received Note (GRN)", group: "Procurement" },
  { id: "bills", label: "Bills", group: "Procurement" },
  { id: "vendor_payments", label: "Vendor Payments", group: "Procurement" },
  { id: "rd_dashboard", label: "R&D Dashboard", group: "Research & Development" },
  { id: "rd_lab", label: "R&D Lab", group: "Research & Development" },
  { id: "product_formulations", label: "Product Formulations", group: "Research & Development" },
  { id: "experiments", label: "Experiments", group: "Research & Development" },
  { id: "product_testing", label: "Product Testing", group: "Research & Development" },
  { id: "prototype_tracker", label: "Prototype Tracker", group: "Research & Development" },
  { id: "knowledge_tracker", label: "Knowledge Tracker", group: "Research & Development" },
  { id: "ip_patents", label: "IP & Patents", group: "Research & Development" },
  { id: "marketing_dashboard", label: "Marketing Dashboard", group: "Marketing" },
  { id: "mkt_strategy", label: "Strategy", group: "Marketing" },
  { id: "mkt_calendar", label: "Content Calendar", group: "Marketing" },
  { id: "mkt_assets", label: "Creative / Assets", group: "Marketing" },
  { id: "mkt_reports", label: "Reports", group: "Marketing" },
  { id: "intern_ideas", label: "Marketing Notepad", group: "Marketing" },
  { id: "content_storytelling", label: "Content & Story Studio", group: "Marketing" },
  { id: "campaigns", label: "Campaigns", group: "Marketing" },
  { id: "social_media", label: "Social Media", group: "Marketing" },
  { id: "marketing_posts", label: "Marketing Posts", group: "Marketing" },
  { id: "newsletter", label: "Newsletter", group: "Marketing" },
  { id: "seo", label: "SEO", group: "Marketing" },
  { id: "market_research", label: "Market Research", group: "Marketing" },
  { id: "brand_assets", label: "Brand Assets", group: "Marketing" },
  { id: "press_media", label: "Press & Media", group: "Marketing" },
  { id: "website", label: "Website", group: "Digital Assets" },
  { id: "blog", label: "Blog", group: "Digital Assets" },
  { id: "landing_pages", label: "Landing Pages", group: "Digital Assets" },
  { id: "media_library", label: "Media Library", group: "Digital Assets" },
  { id: "videos", label: "Videos", group: "Digital Assets" },
  { id: "images", label: "Images", group: "Digital Assets" },
  { id: "downloads", label: "Downloads", group: "D Models" },
  { id: "shared_files", label: "Shared Files", group: "Documents" },
  { id: "document_generator", label: "Document Generator", group: "Documents" },
  { id: "templates", label: "Templates", group: "Documents" },
  { id: "digital_signatures", label: "Digital Signatures", group: "Documents" },
  { id: "contracts_documents", label: "Contracts", group: "Documents" },
  { id: "sop_library", label: "SOP Library", group: "Documents" },
  { id: "operations_dashboard", label: "Operations Dashboard", group: "Operations" },
  { id: "projects", label: "Projects", group: "Operations" },
  { id: "tasks", label: "Tasks", group: "Operations" },
  { id: "kanban_board", label: "Kanban Board", group: "Operations" },
  { id: "meetings_operations", label: "Meetings", group: "Operations" },
  { id: "calendar", label: "Calendar", group: "Operations" },
  { id: "approvals", label: "Approvals", group: "Operations" },
  { id: "announcements", label: "Announcements", group: "Operations" },
  { id: "access_control", label: "Access Control", group: "IT & System" },
  { id: "user_management", label: "User Management", group: "IT & System" },
  { id: "roles_permissions", label: "Roles & Permissions", group: "IT & System" },
  { id: "api_keys", label: "API Keys", group: "IT & System" },
  { id: "integrations", label: "Integrations", group: "IT & System" },
  { id: "email_settings", label: "Email Settings", group: "IT & System" },
  { id: "backup", label: "Backup", group: "IT & System" },
  { id: "audit_logs", label: "Audit Logs", group: "IT & System" },
  { id: "activity_logs", label: "Activity Logs", group: "IT & System" },
  { id: "system_health", label: "System Health", group: "IT & System" },
  { id: "maintenance_it", label: "Maintenance", group: "IT & System" },
  { id: "ai_dashboard", label: "AI Dashboard", group: "AI & Automation" },
  { id: "ai_reports", label: "AI Reports", group: "AI & Automation" },
  { id: "workflow_automation", label: "Workflow Automation", group: "AI & Automation" },
  { id: "ai_insights", label: "AI Insights", group: "AI & Automation" },
  { id: "ai_predictions", label: "AI Predictions", group: "AI & Automation" },
  { id: "scheduled_jobs", label: "Scheduled Jobs", group: "AI & Automation" },
  { id: "business_analytics", label: "Business Analytics", group: "Analytics" },
  { id: "sales_analytics_analytics", label: "Sales Analytics", group: "Analytics" },
  { id: "finance_analytics", label: "Finance Analytics", group: "Analytics" },
  { id: "hr_analytics", label: "HR Analytics", group: "Analytics" },
  { id: "manufacturing_analytics", label: "Manufacturing Analytics", group: "Analytics" },
  { id: "marketing_analytics", label: "Marketing Analytics", group: "Analytics" },
  { id: "custom_reports", label: "Custom Reports", group: "Analytics" },
  { id: "company_settings", label: "Company Settings", group: "Administration" },
  { id: "branch_settings", label: "Branch Settings", group: "Administration" },
  { id: "currency", label: "Currency", group: "Administration" },
  { id: "tax_configuration", label: "Tax Configuration", group: "Administration" },
  { id: "holidays", label: "Holidays", group: "Administration" },
  { id: "business_hours", label: "Business Hours", group: "Administration" },
  { id: "notifications_administration", label: "Notifications", group: "Administration" },
  { id: "licenses", label: "Licenses", group: "Administration" },
  { id: "my_tasks", label: "My Tasks", group: "My Workspace (Personal)" },
  { id: "my_calendar", label: "My Calendar", group: "My Workspace (Personal)" },
  { id: "my_documents", label: "My Documents", group: "My Workspace (Personal)" },
  { id: "my_attendance", label: "My Attendance", group: "My Workspace (Personal)" },
  { id: "my_performance", label: "My Performance", group: "My Workspace (Personal)" },
  { id: "my_notifications", label: "My Notifications", group: "My Workspace (Personal)" },
  { id: "profile", label: "Profile", group: "My Workspace (Personal)" },
];

const PAGE_GROUPS = ["Executive Dashboard","Executive & Strategy","Organization","Human Resources (HRMS)","CRM (Customer Relationship Management)","Sales","Inventory & Warehouse","Manufacturing","Finance & Accounting","Procurement","Research & Development","Marketing","Digital Assets","D Models","Documents","Operations","IT & System","AI & Automation","Analytics","Administration","My Workspace (Personal)"];

const GROUP_COLORS: Record<string, string> = {
  "Executive Dashboard": "bg-blue-100 text-blue-800",
  "Executive & Strategy": "bg-purple-100 text-purple-800",
  "Organization": "bg-amber-100 text-amber-800",
  "Human Resources (HRMS)": "bg-green-100 text-green-800",
  "CRM (Customer Relationship Management)": "bg-cyan-100 text-cyan-800",
  "Sales": "bg-pink-100 text-pink-800",
  "Inventory & Warehouse": "bg-orange-100 text-orange-800",
  "Manufacturing": "bg-slate-100 text-slate-800",
  "Finance & Accounting": "bg-red-100 text-red-800",
  "Procurement": "bg-indigo-100 text-indigo-800",
  "Research & Development": "bg-teal-100 text-teal-800",
  "Marketing": "bg-lime-100 text-lime-800",
  "Digital Assets": "bg-yellow-100 text-yellow-800",
  "D Models": "bg-fuchsia-100 text-fuchsia-800",
  "Documents": "bg-rose-100 text-rose-800",
  "Operations": "bg-sky-100 text-sky-800",
  "IT & System": "bg-emerald-100 text-emerald-800",
  "AI & Automation": "bg-blue-100 text-blue-800",
  "Analytics": "bg-purple-100 text-purple-800",
  "Administration": "bg-amber-100 text-amber-800",
  "My Workspace (Personal)": "bg-green-100 text-green-800",
};

// Automated Role Presets
const ROLE_PRESETS = [
  {
    id: "rd_researcher",
    title: "🔬 R&D Researcher / Scientist",
    pages: ["dashboard", "my_work", "ai_business_assistant", "rd_dashboard", "rd_lab", "product_formulations", "experiments", "knowledge_tracker", "ip_patents", "shared_files"],
    defaultTab: "rd_lab"
  },
  {
    id: "hr_manager",
    title: "👥 HR & Recruitment Manager",
    pages: ["dashboard", "my_work", "ai_business_assistant", "hr_dashboard", "employees", "intern_management", "attendance", "leave_management", "payroll", "recruitment", "applications", "offer_letters"],
    defaultTab: "hr_dashboard"
  },
  {
    id: "inventory_manager",
    title: "📦 Inventory & Warehouse Lead",
    pages: ["dashboard", "my_work", "ai_business_assistant", "inventory_dashboard", "products", "categories", "warehouses", "stock_movement", "purchase_requests", "barcode_management"],
    defaultTab: "inventory_dashboard"
  },
  {
    id: "finance_lead",
    title: "💰 Finance & Accountant",
    pages: ["dashboard", "my_work", "ai_business_assistant", "finance_dashboard", "invoices", "expenses", "general_ledger", "profit_loss", "balance_sheet", "tax_center", "reports_center"],
    defaultTab: "finance_dashboard"
  },
  {
    id: "sales_crm",
    title: "📈 Sales & CRM Specialist",
    pages: ["dashboard", "my_work", "ai_business_assistant", "crm_dashboard", "leads", "opportunities", "customers", "quotations", "sales_pipeline", "orders", "invoices"],
    defaultTab: "crm_dashboard"
  },
  {
    id: "intern_staff",
    title: "🎓 Intern / Junior Staff",
    pages: ["my_work", "knowledge_tracker", "shared_files", "ai_business_assistant", "profile"],
    defaultTab: "knowledge_tracker"
  },
  {
    id: "operations",
    title: "🛠️ Operations Lead",
    pages: ["dashboard", "my_work", "ai_business_assistant", "operations_dashboard", "projects", "tasks", "kanban_board", "calendar", "approvals"],
    defaultTab: "operations_dashboard"
  }
];

interface AccessRule {
  id?: string;
  user_email: string;
  user_label: string;
  allowed_pages: string[];
  default_tab: string | null;
  is_active: boolean;
  user_type?: "Intern" | "Team Member" | "Manager" | "Admin";
  target_hours_per_day?: number;
  target_hours_per_week?: number;
  logged_active_seconds?: number;
  weekly_logged_seconds?: number;
  first_login_at?: string;
  last_active_at?: string;
  isNew?: boolean;
}

export function UserAccessSettings() {
  const [rules, setRules] = useState<AccessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const fetchRules = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_page_access")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        toast({
          title: "Table Not Found",
          description: "Please run the SQL setup script first (master_enterprise_setup.sql).",
          variant: "destructive",
        });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      setRules([]);
    } else {
      setRules((data || []).map((r: any) => ({
        ...r,
        user_email: r.user_email || r.email || "",
        user_label: r.user_label || r.role || "",
        allowed_pages: Array.isArray(r.allowed_pages) && r.allowed_pages.length > 0 ? r.allowed_pages : (Array.isArray(r.accessible_tabs) ? r.accessible_tabs : []),
        user_type: r.user_type || "Team Member",
        target_hours_per_day: typeof r.target_hours_per_day === "number" ? r.target_hours_per_day : (r.user_type === "Intern" ? 4.0 : 8.0),
        target_hours_per_week: typeof r.target_hours_per_week === "number" ? r.target_hours_per_week : (r.user_type === "Intern" ? 20.0 : 40.0),
        logged_active_seconds: Number(r.logged_active_seconds || 0),
        weekly_logged_seconds: Number(r.weekly_logged_seconds || (r.logged_active_seconds || 0) * 5),
        isNew: false
      })));
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const addNewRule = () => {
    const tempId = `new_${Date.now()}`;
    const newRule: AccessRule = {
      id: tempId,
      user_email: "",
      user_label: "",
      user_type: "Team Member",
      target_hours_per_day: 8.0,
      logged_active_seconds: 0,
      allowed_pages: ["knowledge_tracker", "shared_files", "ai_business_assistant"],
      default_tab: "knowledge_tracker",
      is_active: true,
      isNew: true,
    };
    setRules(prev => [...prev, newRule]);
    setExpandedRule(tempId);
  };

  const updateRule = (id: string, field: keyof AccessRule, value: any) => {
    setRules(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === "user_type") {
        updated.target_hours_per_day = value === "Intern" ? 4.0 : 8.0;
        updated.target_hours_per_week = value === "Intern" ? 20.0 : 40.0;
      }
      if (field === "target_hours_per_day") {
        updated.target_hours_per_week = (parseFloat(value) || 0) * 5;
      }
      return updated;
    }));
  };

  const applyRolePreset = (ruleId: string, presetId: string) => {
    const preset = ROLE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setRules(prev => prev.map(r => {
      if (r.id !== ruleId) return r;
      return {
        ...r,
        allowed_pages: preset.pages,
        default_tab: preset.defaultTab
      };
    }));
    toast({ title: "Role Preset Applied", description: `Auto-configured tabs for ${preset.title}` });
  };

  const aiAutoSuggestForLabel = (ruleId: string, labelText: string) => {
    const text = labelText.toLowerCase();
    let matchedPreset = ROLE_PRESETS[5]; // default intern/staff
    if (text.includes("r&d") || text.includes("research") || text.includes("chemist") || text.includes("lab") || text.includes("formulat")) {
      matchedPreset = ROLE_PRESETS[0];
    } else if (text.includes("hr") || text.includes("recruit") || text.includes("people") || text.includes("talent")) {
      matchedPreset = ROLE_PRESETS[1];
    } else if (text.includes("store") || text.includes("inventory") || text.includes("warehouse") || text.includes("stock")) {
      matchedPreset = ROLE_PRESETS[2];
    } else if (text.includes("finance") || text.includes("account") || text.includes("ca") || text.includes("tax") || text.includes("billing")) {
      matchedPreset = ROLE_PRESETS[3];
    } else if (text.includes("sale") || text.includes("crm") || text.includes("marketing") || text.includes("lead")) {
      matchedPreset = ROLE_PRESETS[4];
    } else if (text.includes("operat") || text.includes("project") || text.includes("pm")) {
      matchedPreset = ROLE_PRESETS[6];
    }

    setRules(prev => prev.map(r => {
      if (r.id !== ruleId) return r;
      return {
        ...r,
        user_label: labelText,
        allowed_pages: matchedPreset.pages,
        default_tab: matchedPreset.defaultTab
      };
    }));

    toast({ 
      title: "🤖 AI Auto-Configured Tabs!", 
      description: `Detected "${labelText}" → Auto-assigned ${matchedPreset.title} page permissions.` 
    });
  };

  const togglePage = (ruleId: string, pageId: string) => {
    setRules(prev => prev.map(r => {
      if (r.id !== ruleId) return r;
      const pages = r.allowed_pages.includes(pageId)
        ? r.allowed_pages.filter(p => p !== pageId)
        : [...r.allowed_pages, pageId];
      const defaultTab = pages.includes(r.default_tab || "") ? r.default_tab : (pages[0] || null);
      return { ...r, allowed_pages: pages, default_tab: defaultTab };
    }));
  };

  const selectAllInGroup = (ruleId: string, group: string) => {
    const groupPageIds = ALL_PAGES.filter(p => p.group === group).map(p => p.id);
    setRules(prev => prev.map(r => {
      if (r.id !== ruleId) return r;
      const allSelected = groupPageIds.every(pid => r.allowed_pages.includes(pid));
      let pages: string[];
      if (allSelected) {
        pages = r.allowed_pages.filter(p => !groupPageIds.includes(p));
      } else {
        pages = [...new Set([...r.allowed_pages, ...groupPageIds])];
      }
      const defaultTab = pages.includes(r.default_tab || "") ? r.default_tab : (pages[0] || null);
      return { ...r, allowed_pages: pages, default_tab: defaultTab };
    }));
  };

  const saveRule = async (rule: AccessRule) => {
    if (!rule.user_email || !rule.user_email.includes("@")) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (rule.allowed_pages.length === 0) {
      toast({ title: "No Pages", description: "Select at least one page to grant access.", variant: "destructive" });
      return;
    }

    setSaving(rule.id || null);
    const emailVal = rule.user_email.toLowerCase().trim();
    const labelVal = rule.user_label.trim() || "Executive";
    
    // 1. Primary Clean Payload (Matching active database schema without invalid columns)
    const cleanPayload: any = {
      user_email: emailVal,
      user_label: labelVal,
      user_type: rule.user_type || "Team Member",
      target_hours_per_day: Number(rule.target_hours_per_day || (rule.user_type === "Intern" ? 4.0 : 8.0)),
      target_hours_per_week: Number(rule.target_hours_per_week || (rule.user_type === "Intern" ? 20.0 : 40.0)),
      allowed_pages: rule.allowed_pages,
      default_tab: rule.default_tab,
      is_active: rule.is_active,
    };

    // 2. Fallback Legacy Payload (Only basic columns)
    const legacyPayload: any = {
      email: emailVal,
      role: labelVal,
      allowed_pages: rule.allowed_pages,
      default_tab: rule.default_tab,
      is_active: rule.is_active,
    };

    let error: any = null;

    if (rule.isNew) {
      let res = await supabase.from("user_page_access").insert(cleanPayload).select();
      if (res.error) {
        console.warn("Primary insert failed, retrying legacy payload:", res.error.message);
        res = await supabase.from("user_page_access").insert(legacyPayload).select();
      }
      error = res.error;
    } else {
      // Check existing row by id or email
      let targetId = rule.id && !rule.id.startsWith("new_") ? rule.id : null;
      if (!targetId) {
        const { data: found } = await supabase
          .from("user_page_access")
          .select("id")
          .or(`user_email.eq.${emailVal},email.eq.${emailVal}`)
          .limit(1);
        targetId = found?.[0]?.id || null;
      }

      if (targetId) {
        let res = await supabase.from("user_page_access").update(cleanPayload).eq("id", targetId).select();
        if (res.error) {
          console.warn("Primary update failed, retrying legacy payload:", res.error.message);
          res = await supabase.from("user_page_access").update(legacyPayload).eq("id", targetId).select();
        }
        error = res.error;
      } else {
        let res = await supabase.from("user_page_access").insert(cleanPayload).select();
        if (res.error) {
          res = await supabase.from("user_page_access").insert(legacyPayload).select();
        }
        error = res.error;
      }
    }

    if (error) {
      console.error("Save access rule error:", error);
      toast({ title: "Save Failed", description: error.message || "Failed to save permissions.", variant: "destructive" });
    } else {
      toast({ title: "Saved & Automated! ⚡", description: `Permissions & AI scope for ${emailVal} updated successfully.` });
      await fetchRules();
    }
    setSaving(null);
  };

  const deleteRule = async (rule: AccessRule) => {
    if (rule.isNew) {
      setRules(prev => prev.filter(r => r.id !== rule.id));
      return;
    }
    const { error } = await supabase.from("user_page_access").delete().eq("id", rule.id!);
    if (error) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    } else {
      setRules(prev => prev.filter(r => r.id !== rule.id));
      toast({ title: "Deleted", description: `Access for ${rule.user_email} removed.` });
    }
  };

  const handleExportReport = () => {
    if (rules.length === 0) {
      toast({ title: "No Data", description: "No user rules available to export.", variant: "destructive" });
      return;
    }

    const headers = ["Email", "Name/Title", "Role Type", "Login Time Today", "Last Active / Logout", "Daily Active Hours", "Daily Target", "Daily Status", "Weekly Active Hours", "Weekly Target", "Weekly Status", "Account Status"];
    const rows = rules.map(r => {
      const dailyHours = ((r.logged_active_seconds || 0) / 3600).toFixed(1);
      const dailyTarget = (r.target_hours_per_day || (r.user_type === "Intern" ? 4.0 : 8.0)).toFixed(1);
      const dailyMet = (r.logged_active_seconds || 0) >= ((r.target_hours_per_day || 8) * 3600) ? "Met" : "Pending";
      
      const weeklySecs = r.weekly_logged_seconds || ((r.logged_active_seconds || 0) * 5);
      const weeklyHours = (weeklySecs / 3600).toFixed(1);
      const weeklyTarget = (r.target_hours_per_week || (r.user_type === "Intern" ? 20.0 : 40.0)).toFixed(1);
      const weeklyMet = weeklySecs >= ((r.target_hours_per_week || 40) * 3600) ? "Met" : "Pending";

      const loginStr = r.first_login_at ? new Date(r.first_login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Not logged in today";
      const logoutStr = r.last_active_at ? new Date(r.last_active_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—";

      return [
        `"${r.user_email}"`,
        `"${r.user_label || 'User'}"`,
        `"${r.user_type || 'Team Member'}"`,
        `"${loginStr}"`,
        `"${logoutStr}"`,
        `"${dailyHours} hrs"`,
        `"${dailyTarget} hrs"`,
        `"${dailyMet}"`,
        `"${weeklyHours} hrs"`,
        `"${weeklyTarget} hrs"`,
        `"${weeklyMet}"`,
        `"${r.is_active ? 'Active' : 'Inactive'}"`
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Working_Hours_Attendance_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRules = rules.filter(r =>
    (r.user_email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.user_label || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#7DA0FA]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#4B49AC] flex items-center gap-2">
            <Shield className="h-7 w-7 text-[#7DA0FA]" />
            User Access Control & Automated AI Scoping
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure tab permissions for team members. Select preset roles or type a job title to auto-configure pages and AI Assistant context instantly.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportReport} className="text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50">
            <FileSpreadsheet className="h-4 w-4 mr-1 text-emerald-600" /> Export Attendance CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchRules}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button onClick={addNewRule} className="bg-primary hover:bg-primary/90 text-white">
            <UserPlus className="h-4 w-4 mr-1" /> Add User
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-l-4 border-l-[#7DA0FA] bg-[#f2f6ff]">
        <CardContent className="py-3 px-4 text-sm text-[#4B49AC] flex justify-between items-center">
          <div>
            <strong>Note:</strong> CEO (<code className="bg-white/60 px-1 py-0.5 rounded text-xs">ceo@biovaco.in</code>) and MD (<code className="bg-white/60 px-1 py-0.5 rounded text-xs">md@biovaco.in</code>) always have full access. When you select or edit tabs for any user, the <strong>AI Assistant automatically customizes itself</strong> to match their granted permissions!
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      {rules.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by email or display label..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Rules List */}
      {filteredRules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Shield className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No access rules configured</p>
            <p className="text-sm">Click "Add User" to grant a team member portal access with automated AI scoping.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRules.map(rule => {
            const isExpanded = expandedRule === rule.id;
            return (
              <Card
                key={rule.id}
                className={`transition-all duration-200 ${
                  rule.isNew ? "ring-2 ring-[#7DA0FA]/40 shadow-lg" : ""
                } ${!rule.is_active ? "opacity-60" : ""}`}
              >
                {/* Collapsed Header */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 rounded-t-lg"
                  onClick={() => setExpandedRule(isExpanded ? null : rule.id!)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-3 w-3 rounded-full shrink-0 ${rule.is_active ? "bg-[#7DA0FA]" : "bg-gray-300"}`} />
                    <div className="min-w-0">
                      <div className="font-semibold text-[#4B49AC] truncate flex items-center gap-2">
                        {rule.user_label || rule.user_email || "New User"}
                        <Badge variant="outline" className={`text-[10px] ${
                          rule.user_type === "Intern" ? "bg-purple-50 text-purple-700 border-purple-200" :
                          rule.user_type === "Manager" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          rule.user_type === "Admin" ? "bg-gray-900 text-white" :
                          "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {rule.user_type === "Intern" ? "🎓 Intern" :
                           rule.user_type === "Manager" ? "👨‍💼 Manager" :
                           rule.user_type === "Admin" ? "🛡️ Admin" : "💼 Team Member"}
                        </Badge>
                      </div>
                      {rule.user_label && (
                        <div className="text-xs text-gray-500 truncate">{rule.user_email}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Working Hours Cutoff Progress Badge */}
                    {(() => {
                      const loggedHours = ((rule.logged_active_seconds || 0) / 3600).toFixed(1)
                      const targetHours = rule.target_hours_per_day || (rule.user_type === "Intern" ? 4.0 : 8.0)
                      const pct = Math.min(100, Math.round(((rule.logged_active_seconds || 0) / (targetHours * 3600)) * 100))
                      const isMet = (rule.logged_active_seconds || 0) >= (targetHours * 3600)

                      return (
                        <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                          <span className="text-[11px] font-mono text-gray-700">⏱️ {loggedHours}h / {targetHours}h ({pct}%)</span>
                          <Badge className={`text-[9px] px-1.5 py-0 ${isMet ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>
                            {isMet ? "Cutoff Met" : "Pending"}
                          </Badge>
                        </div>
                      )
                    })()}

                    <Badge variant="secondary" className="text-xs">
                      {rule.allowed_pages.length} pages
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <CardContent className="border-t pt-5 space-y-5">
                    {/* Basic Info & Account Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Email Address *</label>
                        <Input
                          placeholder="user@biovaco.in"
                          value={rule.user_email}
                          onChange={e => updateRule(rule.id!, "user_email", e.target.value)}
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-medium text-gray-600">Display Label / Role Title</label>
                          {rule.user_label && (
                            <button 
                              type="button" 
                              onClick={() => aiAutoSuggestForLabel(rule.id!, rule.user_label)}
                              className="text-[11px] text-[#4B49AC] hover:underline font-semibold flex items-center gap-1"
                            >
                              <Wand2 className="h-3 w-3" /> Auto-Select
                            </button>
                          )}
                        </div>
                        <Input
                          placeholder="e.g. Marketing Intern, R&D Researcher"
                          value={rule.user_label}
                          onChange={e => updateRule(rule.id!, "user_label", e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Account / Member Type *</label>
                        <Select
                          value={rule.user_type || "Team Member"}
                          onValueChange={(v: any) => updateRule(rule.id!, "user_type", v)}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Intern">🎓 Intern (4.0 Hrs/Day Target)</SelectItem>
                            <SelectItem value="Team Member">💼 Team Member (8.0 Hrs/Day Target)</SelectItem>
                            <SelectItem value="Manager">👨‍💼 Manager (8.0 Hrs/Day Target)</SelectItem>
                            <SelectItem value="Admin">🛡️ Admin (8.0 Hrs/Day Target)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Working Hours Cutoff & Active Portal Time Tracker Card */}
                    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-indigo-200/80 rounded-xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-2">
                        <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                          <Cpu className="h-4 w-4 text-[#4B49AC]" />
                          ⏱️ Daily & Weekly Working Hours & Attendance Report
                        </span>

                        {/* Login & Logout Time Badges */}
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">
                            🟢 Login: {rule.first_login_at ? new Date(rule.first_login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Not Logged Today"}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-800 border-blue-200">
                            🔴 Logout/Active: {rule.last_active_at ? new Date(rule.last_active_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                          </Badge>
                        </div>
                      </div>

                      {/* Cutoff Target Controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-semibold">Daily Target Cutoff:</span>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.5"
                              className="w-16 h-7 text-xs bg-white text-center font-bold"
                              value={rule.target_hours_per_day || (rule.user_type === "Intern" ? 4.0 : 8.0)}
                              onChange={e => updateRule(rule.id!, "target_hours_per_day", parseFloat(e.target.value) || 4.0)}
                            />
                            <span className="text-gray-500 text-[11px]">Hrs/Day</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-semibold">Weekly Target Cutoff:</span>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="1"
                              className="w-16 h-7 text-xs bg-white text-center font-bold"
                              value={rule.target_hours_per_week || (rule.user_type === "Intern" ? 20.0 : 40.0)}
                              onChange={e => updateRule(rule.id!, "target_hours_per_week", parseFloat(e.target.value) || 20.0)}
                            />
                            <span className="text-gray-500 text-[11px]">Hrs/Week</span>
                          </div>
                        </div>
                      </div>

                      {/* Daily & Weekly Cutoff Progress Bars */}
                      {(() => {
                        const loggedSecs = rule.logged_active_seconds || 0
                        const loggedHours = (loggedSecs / 3600).toFixed(1)
                        const targetHours = rule.target_hours_per_day || (rule.user_type === "Intern" ? 4.0 : 8.0)
                        const dailyPct = Math.min(100, Math.round((loggedSecs / (targetHours * 3600)) * 100))
                        const isDailyMet = loggedSecs >= (targetHours * 3600)

                        const weeklySecs = rule.weekly_logged_seconds || (loggedSecs * 5)
                        const weeklyHours = (weeklySecs / 3600).toFixed(1)
                        const targetWeeklyHours = rule.target_hours_per_week || (rule.user_type === "Intern" ? 20.0 : 40.0)
                        const weeklyPct = Math.min(100, Math.round((weeklySecs / (targetWeeklyHours * 3600)) * 100))
                        const isWeeklyMet = weeklySecs >= (targetWeeklyHours * 3600)

                        return (
                          <div className="space-y-3 bg-white p-3 rounded-lg border border-indigo-100 shadow-2xs">
                            {/* Daily Progress */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-gray-700">
                                  Daily Active Hours: <strong className="text-[#4B49AC]">{loggedHours} Hours</strong> / {targetHours}h Target
                                </span>
                                <span className={`font-bold text-[11px] ${isDailyMet ? "text-emerald-700" : "text-amber-600"}`}>
                                  {dailyPct}% Cutoff {isDailyMet ? "Met ✅" : "In Progress ⏳"}
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${isDailyMet ? "bg-emerald-500" : "bg-[#4B49AC]"}`}
                                  style={{ width: `${dailyPct}%` }}
                                />
                              </div>
                            </div>

                            {/* Weekly Progress */}
                            <div className="space-y-1 pt-1 border-t border-gray-100">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-gray-700">
                                  Weekly Active Hours: <strong className="text-[#4B49AC]">{weeklyHours} Hours</strong> / {targetWeeklyHours}h Target
                                </span>
                                <span className={`font-bold text-[11px] ${isWeeklyMet ? "text-emerald-700" : "text-amber-600"}`}>
                                  {weeklyPct}% Weekly Cutoff {isWeeklyMet ? "Met ✅" : "In Progress ⏳"}
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${isWeeklyMet ? "bg-emerald-500" : "bg-purple-600"}`}
                                  style={{ width: `${weeklyPct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Smart Role Preset Automation Card */}
                    <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/80 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
                          ⚡ Smart Role Auto-Customize Automation
                        </span>
                        <span className="text-[10px] text-purple-600 font-medium">Click any preset to auto-select tabs</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {ROLE_PRESETS.map(preset => (
                          <Button
                            key={preset.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => applyRolePreset(rule.id!, preset.id)}
                            className="h-7 text-xs bg-white/80 hover:bg-white text-purple-900 border-purple-200 hover:border-purple-400 font-medium shadow-2xs"
                          >
                            {preset.title}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                      <div>
                        <div className="font-medium text-sm">Account Active</div>
                        <div className="text-xs text-gray-500">Disable to temporarily revoke access without deleting</div>
                      </div>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={v => updateRule(rule.id!, "is_active", v)}
                      />
                    </div>

                    {/* Page Selection */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-600 block">Allowed Pages ({rule.allowed_pages.length} selected)</label>
                        <span className="text-[11px] text-gray-400">AI Assistant automatically adapts to these selected tabs</span>
                      </div>
                      <div className="space-y-3">
                        {PAGE_GROUPS.map(group => {
                          const groupPages = ALL_PAGES.filter(p => p.group === group);
                          const allSelected = groupPages.every(p => rule.allowed_pages.includes(p.id));
                          const someSelected = groupPages.some(p => rule.allowed_pages.includes(p.id));
                          return (
                            <div key={group} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <button
                                  type="button"
                                  onClick={() => selectAllInGroup(rule.id!, group)}
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer ${GROUP_COLORS[group] || "bg-gray-100 text-gray-700"}`}
                                >
                                  {group} {allSelected ? "- All Selected" : someSelected ? "- Partial" : ""}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => selectAllInGroup(rule.id!, group)}
                                  className="text-xs text-[#4B49AC] hover:underline"
                                >
                                  {allSelected ? "Deselect All" : "Select All"}
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {groupPages.map(page => {
                                  const selected = rule.allowed_pages.includes(page.id);
                                  return (
                                    <button
                                      key={page.id}
                                      type="button"
                                      onClick={() => togglePage(rule.id!, page.id)}
                                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                                        selected
                                          ? "bg-[#4B49AC] text-white border-[#4B49AC]"
                                          : "bg-white text-gray-600 border-gray-200 hover:border-[#7DA0FA]/40 hover:bg-[#f2f6ff]"
                                      }`}
                                    >
                                      {selected ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3 opacity-40" />}
                                      {page.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Default Landing Tab */}
                    {rule.allowed_pages.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Default Landing Page</label>
                        <Select
                          value={rule.default_tab || rule.allowed_pages[0]}
                          onValueChange={v => updateRule(rule.id!, "default_tab", v)}
                        >
                          <SelectTrigger className="w-full sm:w-64">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {rule.allowed_pages.map(pid => {
                              const page = ALL_PAGES.find(p => p.id === pid);
                              return (
                                <SelectItem key={pid} value={pid}>
                                  {page?.label || pid}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteRule(rule)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Remove
                      </Button>
                      <Button
                        onClick={() => saveRule(rule)}
                        disabled={saving === rule.id}
                        className="bg-primary hover:bg-primary/90 text-white"
                      >
                        {saving === rule.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Save & Automate AI
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
