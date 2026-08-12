"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BiovaCoLogo } from "@/components/BiovaCoLogo"
import { PlaceholderPage } from "@/components/PlaceholderPage"



import { CRMDashboard } from "@/components/dashboards/CRMDashboard"
import { Leads } from "@/components/dashboards/Leads"
import { Opportunities } from "@/components/dashboards/Opportunities"
import { Accounts } from "@/components/dashboards/Accounts"
import { Contacts } from "@/components/dashboards/Contacts"
import { Customers } from "@/components/dashboards/Customers"
import { SalesPipeline } from "@/components/dashboards/SalesPipeline"
import { Quotations } from "@/components/dashboards/Quotations"
import { FollowUps } from "@/components/dashboards/FollowUps"
import { Meetings } from "@/components/dashboards/Meetings"
import { Calls } from "@/components/dashboards/Calls"
import { Emails } from "@/components/dashboards/Emails"
import { Deals } from "@/components/dashboards/Deals"
import { CustomerSupport } from "@/components/dashboards/CustomerSupport"
import { Complaints } from "@/components/dashboards/Complaints"
import { Feedback } from "@/components/dashboards/Feedback"
import { Contracts } from "@/components/dashboards/Contracts"
import { HRDashboard } from "@/components/dashboards/HRDashboard"
import { Employees } from "@/components/dashboards/Employees"
import { Attendance } from "@/components/dashboards/Attendance"
import { LeaveManagement } from "@/components/dashboards/LeaveManagement"
import { Payroll } from "@/components/dashboards/Payroll"
import { PerformanceReviews } from "@/components/dashboards/PerformanceReviews"
import { OfferLetters } from "@/components/dashboards/OfferLetters"
import { ExitManagement } from "@/components/dashboards/ExitManagement"
import { AssetsAssigned } from "@/components/dashboards/AssetsAssigned"
import { CompanyProfile } from "@/components/dashboards/CompanyProfile"
import { Departments } from "@/components/dashboards/Departments"
import { Branches } from "@/components/dashboards/Branches"
import { Teams } from "@/components/dashboards/Teams"
import { OrganizationChart } from "@/components/dashboards/OrganizationChart"
import { CEODashboard } from "@/components/dashboards/CEODashboard"
import { MDDashboard } from "@/components/dashboards/MDDashboard"
import { CompanyGoalsOKRs } from "@/components/dashboards/CompanyGoalsOKRs"
import { KPIDashboard } from "@/components/dashboards/KPIDashboard"
import { BusinessIntelligence } from "@/components/dashboards/BusinessIntelligence"
import { ReportsCenter } from "@/components/dashboards/ReportsCenter"

import { MyWork } from "@/components/dashboards/MyWork"
import { Notifications } from "@/components/dashboards/Notifications"
import { AIBusinessAssistant } from "@/components/dashboards/AIBusinessAssistant"
import { GlobalSearch } from "@/components/dashboards/GlobalSearch"
import { ComplianceAI } from "@/components/dashboards/ComplianceAI"

import {
  Mail,
  FileText,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  Download,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  BarChart3,
  Users,
  Settings,
  MapPin,
  Video,
  Briefcase,
  Calendar,
  Wrench,
  Box,
  Share2,
  Activity,
  IndianRupee,
  ShoppingCart,
  Receipt,
  Package,
  Truck,
  CreditCard,
  BookOpen,
  FlaskConical,
  Loader2,
  FolderOpen,
  Shield,
  Newspaper,
  Search,
  Bell,
  Bot,
  Network,
  Factory,
  Globe,
  Image,
  Kanban,
  ShieldAlert,
  StickyNote,
  Sparkles,
  Target
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { AdminActivityLogs } from "@/components/AdminActivityLogs"
import { ContactRemarkModal } from "@/components/ContactRemarkModal"
import { VideoManagement } from "@/components/VideoManagement"
import { CountdownManagement } from "@/components/CountdownManagement"
import { JobPositionsManagement } from "@/components/JobPositionsManagement"
import InternManagement from "@/components/InternManagement"
import PageContentManagement from "@/components/PageContentManagement"
import PostCountdownManagement from "@/components/PostCountdownManagement"
import { MaintenanceManagement } from "@/components/MaintenanceManagement"
import { UserManagement } from "@/components/it-system/UserManagement"
import { RolesPermissionsManagement } from "@/components/it-system/RolesPermissionsManagement"
import { APIKeysManagement } from "@/components/it-system/APIKeysManagement"
import { IntegrationsManagement } from "@/components/it-system/IntegrationsManagement"
import { EmailSettingsManagement } from "@/components/it-system/EmailSettingsManagement"
import { BackupManagement } from "@/components/it-system/BackupManagement"
import { SystemActivityLogs } from "@/components/it-system/SystemActivityLogs"
import { SystemHealthManagement } from "@/components/it-system/SystemHealthManagement"
import { ApplicationDetailModal } from "@/components/ApplicationDetailModal"
import { Model3DManagement } from "@/components/Model3DManagement"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SocialLinksManagement from "@/components/SocialLinksManagement"
import { NewsletterManagement } from "@/components/NewsletterManagement"
import { MarketingPostsManagement } from "@/components/MarketingPostsManagement"
import { DashboardAnalytics } from "@/components/DashboardAnalytics"
import { UniversalDashboard } from "@/components/dashboards/UniversalDashboard"
import { CoreOperationsDashboard } from "@/components/dashboards/CoreOperationsDashboard"
import { HRTeamDashboard } from "@/components/dashboards/HRTeamDashboard"
import { MarketingDashboard } from "@/components/dashboards/MarketingDashboard"
import { MediaDashboard } from "@/components/dashboards/MediaDashboard"
import { ApplicationsManagement } from "@/components/ApplicationsManagement"
import { DocumentGenerator } from "@/components/DocumentGenerator"
import { BusinessManagement } from "@/components/BusinessManagement"
import { NewsManagement } from "@/components/NewsManagement"
import { KnowledgeTracker } from "@/components/KnowledgeTracker"
import { RDLabManagement } from "@/components/RDLabManagement"
import { SharedFilesManager } from "@/components/SharedFilesManager"
import { FinanceManagement } from "@/components/FinanceManagement"
import { ReceivablesPayables } from "@/components/ReceivablesPayables"
import { ChartOfAccountsManagement } from "@/components/finance/ChartOfAccountsManagement"
import { JournalEntriesManagement } from "@/components/finance/JournalEntriesManagement"
import { FinancialStatementsCenter } from "@/components/finance/FinancialStatementsCenter"
import { BudgetManagement } from "@/components/finance/BudgetManagement"
import { TaxGSTCenter } from "@/components/finance/TaxGSTCenter"
import { FixedAssetsManagement } from "@/components/finance/FixedAssetsManagement"
import { RecruitmentManagement } from "@/components/hrms/RecruitmentManagement"
import { PersonalTasksManagement } from "@/components/workspace/PersonalTasksManagement"
import { UserProfileManagement } from "@/components/workspace/UserProfileManagement"
import { CampaignsManagement } from "@/components/marketing/CampaignsManagement"
import { MarketingInternNotepad } from "@/components/marketing/MarketingInternNotepad"
import { ContentStorytellingStudio } from "@/components/marketing/ContentStorytellingStudio"
import { MarketingStrategy } from "@/components/marketing/MarketingStrategy"
import { ContentCalendar } from "@/components/marketing/ContentCalendar"
import { CreativeAssets } from "@/components/marketing/CreativeAssets"
import { MarketingReports } from "@/components/marketing/MarketingReports"
import { MarketingStoreProvider } from "@/components/marketing/useMarketingStore"
import { MarketResearchHub } from "@/components/rd-lab/MarketResearchHub"
import { DocumentTemplatesManagement } from "@/components/documents/DocumentTemplatesManagement"
import { DigitalSignaturesManagement } from "@/components/documents/DigitalSignaturesManagement"
import { SOPLibraryManagement } from "@/components/documents/SOPLibraryManagement"
import { CeoMdTimetable } from "@/components/CeoMdTimetable"
import { ManufacturingManagement } from "@/components/ManufacturingManagement"
import { UserAccessSettings } from "@/components/UserAccessSettings"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

interface NewsletterSubscription {
  id: string
  email: string
  confirmed: boolean
  subscribed_at: string
}

interface ApplicationStatus {
  application_id: string
  status: string
  changed_at: string
  notes: string
}

const INITIAL_TABS = [

  // Executive Dashboard
  { id: "dashboard", label: "Dashboard", icon: BarChart3, category: "Executive Dashboard" },
  { id: "my_work", label: "My Work", icon: Briefcase, category: "Executive Dashboard" },
  { id: "notifications", label: "Notifications", icon: Briefcase, category: "Executive Dashboard" },
  { id: "ai_business_assistant", label: "AI Business Assistant", icon: Bot, category: "Executive Dashboard" },
  { id: "global_search", label: "Global Search", icon: Briefcase, category: "Executive Dashboard" },

  // Executive & Strategy
  { id: "ceo_dashboard", label: "CEO Dashboard", icon: BarChart3, category: "Executive & Strategy" },
  { id: "md_dashboard", label: "MD Dashboard", icon: BarChart3, category: "Executive & Strategy" },
  { id: "executive_calendar", label: "Executive Calendar", icon: Calendar, category: "Executive & Strategy" },
  { id: "company_goals_okrs", label: "Company Goals (OKRs)", icon: Briefcase, category: "Executive & Strategy" },
  { id: "kpi_dashboard", label: "KPI Dashboard", icon: BarChart3, category: "Executive & Strategy" },
  { id: "business_intelligence", label: "Business Intelligence", icon: BarChart3, category: "Executive & Strategy" },
  { id: "reports_center", label: "Reports Center", icon: BarChart3, category: "Executive & Strategy" },
  { id: "compliance_ai", label: "Compliance AI Lawyer", icon: ShieldAlert, category: "Executive & Strategy" },

  // Organization
  { id: "company_profile", label: "Company Profile", icon: FileText, category: "Organization" },
  { id: "departments", label: "Departments", icon: Briefcase, category: "Organization" },
  { id: "branches", label: "Branches", icon: Briefcase, category: "Organization" },
  { id: "teams", label: "Teams", icon: Users, category: "Organization" },
  { id: "organization_chart", label: "Organization Chart", icon: Network, category: "Organization" },

  // Human Resources (HRMS)
  { id: "hr_dashboard", label: "HR Dashboard", icon: BarChart3, category: "Human Resources (HRMS)" },
  { id: "employees", label: "Employees", icon: Users, category: "Human Resources (HRMS)" },
  { id: "intern_management", label: "Intern Management", icon: Users, category: "Human Resources (HRMS)" },
  { id: "attendance", label: "Attendance", icon: Briefcase, category: "Human Resources (HRMS)" },
  { id: "leave_management", label: "Leave Management", icon: Briefcase, category: "Human Resources (HRMS)" },
  { id: "payroll", label: "Payroll", icon: CreditCard, category: "Human Resources (HRMS)" },
  { id: "performance_reviews", label: "Performance Reviews", icon: Briefcase, category: "Human Resources (HRMS)" },
  { id: "recruitment", label: "Recruitment", icon: Briefcase, category: "Human Resources (HRMS)" },
  { id: "job_positions", label: "Job Positions", icon: Briefcase, category: "Human Resources (HRMS)" },
  { id: "applications", label: "Applications", icon: Briefcase, category: "Human Resources (HRMS)" },
  { id: "offer_letters", label: "Offer Letters", icon: Briefcase, category: "Human Resources (HRMS)" },
  { id: "exit_management", label: "Exit Management", icon: Briefcase, category: "Human Resources (HRMS)" },
  { id: "assets_assigned", label: "Assets Assigned", icon: Briefcase, category: "Human Resources (HRMS)" },

  // CRM (Customer Relationship Management)
  { id: "crm_dashboard", label: "CRM Dashboard", icon: BarChart3, category: "CRM (Customer Relationship Management)" },
  { id: "leads", label: "Leads", icon: Briefcase, category: "CRM (Customer Relationship Management)" },
  { id: "opportunities", label: "Opportunities", icon: Briefcase, category: "CRM (Customer Relationship Management)" },
  { id: "accounts_companies", label: "Accounts (Companies)", icon: Briefcase, category: "CRM (Customer Relationship Management)" },
  { id: "contacts", label: "Contacts", icon: Users, category: "CRM (Customer Relationship Management)" },
  { id: "customers", label: "Customers", icon: Users, category: "CRM (Customer Relationship Management)" },
  { id: "sales_pipeline", label: "Sales Pipeline", icon: Briefcase, category: "CRM (Customer Relationship Management)" },
  { id: "quotations", label: "Quotations", icon: Briefcase, category: "CRM (Customer Relationship Management)" },
  { id: "followups", label: "Follow-ups", icon: Briefcase, category: "CRM (Customer Relationship Management)" },
  { id: "meetings", label: "Meetings", icon: Calendar, category: "CRM (Customer Relationship Management)" },
  { id: "calls", label: "Calls", icon: Calendar, category: "CRM (Customer Relationship Management)" },
  { id: "emails", label: "Emails", icon: Mail, category: "CRM (Customer Relationship Management)" },
  { id: "deals", label: "Deals", icon: Briefcase, category: "CRM (Customer Relationship Management)" },
  { id: "customer_support", label: "Customer Support", icon: Users, category: "CRM (Customer Relationship Management)" },
  { id: "complaints", label: "Complaints", icon: Bot, category: "CRM (Customer Relationship Management)" },
  { id: "feedback", label: "Feedback", icon: Briefcase, category: "CRM (Customer Relationship Management)" },
  { id: "contracts", label: "Contracts", icon: FileText, category: "CRM (Customer Relationship Management)" },

  // Sales
  { id: "sales_dashboard", label: "🔴 Sales Dashboard", icon: BarChart3, category: "Sales" },
  { id: "orders", label: "🔴 Orders", icon: FileText, category: "Sales" },
  { id: "quotations_sales", label: "Quotations", icon: Briefcase, category: "Sales" },
  { id: "proforma_invoice", label: "🔴 Proforma Invoice", icon: FileText, category: "Sales" },
  { id: "invoices", label: "🔴 Invoices", icon: FileText, category: "Sales" },
  { id: "payments", label: "🔴 Payments", icon: CreditCard, category: "Sales" },
  { id: "sales_analytics", label: "🔴 Sales Analytics", icon: BarChart3, category: "Sales" },
  { id: "price_lists", label: "🔴 Price Lists", icon: Briefcase, category: "Sales" },
  { id: "discounts", label: "🔴 Discounts", icon: Briefcase, category: "Sales" },

  // Inventory & Warehouse
  { id: "inventory_dashboard", label: "🔴 Inventory Dashboard", icon: BarChart3, category: "Inventory & Warehouse" },
  { id: "products", label: "🔴 Products", icon: Package, category: "Inventory & Warehouse" },
  { id: "categories", label: "🔴 Categories", icon: Briefcase, category: "Inventory & Warehouse" },
  { id: "warehouses", label: "🔴 Warehouses", icon: Package, category: "Inventory & Warehouse" },
  { id: "stock_movement", label: "🔴 Stock Movement", icon: Package, category: "Inventory & Warehouse" },
  { id: "purchase_requests", label: "🔴 Purchase Requests", icon: Briefcase, category: "Inventory & Warehouse" },
  { id: "stock_adjustment", label: "🔴 Stock Adjustment", icon: Package, category: "Inventory & Warehouse" },
  { id: "batch_tracking", label: "🔴 Batch Tracking", icon: Package, category: "Inventory & Warehouse" },
  { id: "barcode_management", label: "🔴 Barcode Management", icon: Briefcase, category: "Inventory & Warehouse" },

  // Manufacturing
  { id: "production_dashboard", label: "Production Dashboard", icon: BarChart3, category: "Manufacturing" },
  { id: "bill_of_materials_bom", label: "Bill of Materials (BOM)", icon: FileText, category: "Manufacturing" },
  { id: "production_orders", label: "Production Orders", icon: FileText, category: "Manufacturing" },
  { id: "quality_check", label: "Quality Check", icon: Briefcase, category: "Manufacturing" },
  { id: "machines", label: "Machines", icon: Factory, category: "Manufacturing" },
  { id: "maintenance", label: "Maintenance", icon: Settings, category: "Manufacturing" },
  { id: "production_reports", label: "Production Reports", icon: BarChart3, category: "Manufacturing" },

  // Finance & Accounting
  { id: "finance_dashboard", label: "Finance Dashboard", icon: BarChart3, category: "Finance & Accounting" },
  { id: "chart_of_accounts", label: "Chart of Accounts", icon: Network, category: "Finance & Accounting" },
  { id: "journal_entries", label: "Journal Entries", icon: Briefcase, category: "Finance & Accounting" },
  { id: "general_ledger", label: "General Ledger", icon: Briefcase, category: "Finance & Accounting" },
  { id: "trial_balance", label: "Trial Balance", icon: Briefcase, category: "Finance & Accounting" },
  { id: "profit_loss", label: "Profit & Loss", icon: Briefcase, category: "Finance & Accounting" },
  { id: "balance_sheet", label: "Balance Sheet", icon: Briefcase, category: "Finance & Accounting" },
  { id: "cash_flow", label: "Cash Flow", icon: CreditCard, category: "Finance & Accounting" },
  { id: "budget", label: "Budget", icon: CreditCard, category: "Finance & Accounting" },
  { id: "expenses", label: "Expenses", icon: CreditCard, category: "Finance & Accounting" },
  { id: "receivables", label: "Receivables", icon: Briefcase, category: "Finance & Accounting" },
  { id: "payables", label: "Payables", icon: CreditCard, category: "Finance & Accounting" },
  { id: "gst", label: "GST", icon: CreditCard, category: "Finance & Accounting" },
  { id: "tax_center", label: "Tax Center", icon: CreditCard, category: "Finance & Accounting" },
  { id: "fixed_assets", label: "Fixed Assets", icon: Briefcase, category: "Finance & Accounting" },

  // Procurement
  { id: "procurement_dashboard", label: "🔴 Procurement Dashboard", icon: BarChart3, category: "Procurement" },
  { id: "vendors", label: "🔴 Vendors", icon: Users, category: "Procurement" },
  { id: "purchase_orders", label: "🔴 Purchase Orders", icon: FileText, category: "Procurement" },
  { id: "rfq", label: "🔴 RFQ", icon: Briefcase, category: "Procurement" },
  { id: "vendor_quotations", label: "🔴 Vendor Quotations", icon: Users, category: "Procurement" },
  { id: "goods_received_note_grn", label: "🔴 Goods Received Note (GRN)", icon: Briefcase, category: "Procurement" },
  { id: "bills", label: "🔴 Bills", icon: FileText, category: "Procurement" },
  { id: "vendor_payments", label: "🔴 Vendor Payments", icon: Users, category: "Procurement" },

  // Research & Development
  { id: "rd_dashboard", label: "R&D Dashboard", icon: BarChart3, category: "Research & Development" },
  { id: "rd_lab", label: "R&D Lab", icon: FlaskConical, category: "Research & Development" },
  { id: "product_formulations", label: "Product Formulations", icon: Package, category: "Research & Development" },
  { id: "experiments", label: "Experiments", icon: FlaskConical, category: "Research & Development" },
  { id: "product_testing", label: "Product Testing", icon: Package, category: "Research & Development" },
  { id: "prototype_tracker", label: "Prototype Tracker", icon: Briefcase, category: "Research & Development" },
  { id: "knowledge_tracker", label: "Knowledge Tracker", icon: Briefcase, category: "Research & Development" },
  { id: "ip_patents", label: "IP & Patents", icon: Briefcase, category: "Research & Development" },

  // Marketing
  { id: "marketing_dashboard", label: "Marketing Dashboard", icon: BarChart3, category: "Marketing" },
  { id: "mkt_strategy", label: "Strategy", icon: Target, category: "Marketing" },
  { id: "mkt_calendar", label: "Content Calendar", icon: Calendar, category: "Marketing" },
  { id: "mkt_assets", label: "Creative / Assets", icon: Image, category: "Marketing" },
  { id: "mkt_reports", label: "Reports", icon: BarChart3, category: "Marketing" },
  { id: "intern_ideas", label: "Marketing Notepad", icon: StickyNote, category: "Marketing" },
  { id: "content_storytelling", label: "Content & Story Studio", icon: Sparkles, category: "Marketing" },
  { id: "campaigns", label: "Campaigns", icon: Bot, category: "Marketing" },
  { id: "social_media", label: "Social Media", icon: Globe, category: "Marketing" },
  { id: "marketing_posts", label: "Marketing Posts", icon: Briefcase, category: "Marketing" },
  { id: "newsletter", label: "Newsletter", icon: Mail, category: "Marketing" },
  { id: "seo", label: "SEO", icon: Briefcase, category: "Marketing" },
  { id: "market_research", label: "Market Research", icon: FlaskConical, category: "Marketing" },
  { id: "brand_assets", label: "Brand Assets", icon: Briefcase, category: "Marketing" },
  { id: "press_media", label: "Press & Media", icon: Image, category: "Marketing" },

  // Digital Assets
  { id: "website", label: "🔴 Website", icon: Globe, category: "Digital Assets" },
  { id: "blog", label: "🔴 Blog", icon: Briefcase, category: "Digital Assets" },
  { id: "landing_pages", label: "🔴 Landing Pages", icon: Briefcase, category: "Digital Assets" },
  { id: "media_library", label: "🔴 Media Library", icon: Image, category: "Digital Assets" },
  { id: "videos", label: "🔴 Videos", icon: Image, category: "Digital Assets" },
  { id: "images", label: "🔴 Images", icon: Image, category: "Digital Assets" },

  // D Models
  { id: "downloads", label: "🔴 Downloads", icon: Briefcase, category: "D Models" },

  // Documents
  { id: "shared_files", label: "Shared Files", icon: FileText, category: "Documents" },
  { id: "document_generator", label: "Document Generator", icon: FileText, category: "Documents" },
  { id: "templates", label: "Templates", icon: Briefcase, category: "Documents" },
  { id: "digital_signatures", label: "Digital Signatures", icon: Briefcase, category: "Documents" },
  { id: "contracts_documents", label: "Contracts", icon: FileText, category: "Documents" },
  { id: "sop_library", label: "SOP Library", icon: Briefcase, category: "Documents" },

  // Operations
  { id: "operations_dashboard", label: "🔴 Operations Dashboard", icon: BarChart3, category: "Operations" },
  { id: "projects", label: "🔴 Projects", icon: Kanban, category: "Operations" },
  { id: "tasks", label: "🔴 Tasks", icon: Kanban, category: "Operations" },
  { id: "kanban_board", label: "🔴 Kanban Board", icon: Kanban, category: "Operations" },
  { id: "meetings_operations", label: "Meetings", icon: Calendar, category: "Operations" },
  { id: "calendar", label: "🔴 Calendar", icon: Calendar, category: "Operations" },
  { id: "approvals", label: "🔴 Approvals", icon: Briefcase, category: "Operations" },
  { id: "announcements", label: "🔴 Announcements", icon: Briefcase, category: "Operations" },

  // IT & System
  { id: "access_control", label: "Access Control", icon: Shield, category: "IT & System" },
  { id: "user_management", label: "User Management", icon: Users, category: "IT & System" },
  { id: "roles_permissions", label: "Roles & Permissions", icon: Shield, category: "IT & System" },
  { id: "api_keys", label: "API Keys", icon: Briefcase, category: "IT & System" },
  { id: "integrations", label: "Integrations", icon: Globe, category: "IT & System" },
  { id: "email_settings", label: "Email Settings", icon: Settings, category: "IT & System" },
  { id: "backup", label: "Backup", icon: Briefcase, category: "IT & System" },
  { id: "audit_logs", label: "Audit Logs", icon: Briefcase, category: "IT & System" },
  { id: "activity_logs", label: "Activity Logs", icon: Briefcase, category: "IT & System" },
  { id: "system_health", label: "System Health", icon: Briefcase, category: "IT & System" },
  { id: "maintenance_it", label: "Maintenance", icon: Settings, category: "IT & System" },

  // AI & Automation
  { id: "ai_dashboard", label: "🔴 AI Dashboard", icon: BarChart3, category: "AI & Automation" },
  { id: "ai_reports", label: "🔴 AI Reports", icon: BarChart3, category: "AI & Automation" },
  { id: "workflow_automation", label: "🔴 Workflow Automation", icon: Bot, category: "AI & Automation" },
  { id: "ai_insights", label: "🔴 AI Insights", icon: Bot, category: "AI & Automation" },
  { id: "ai_predictions", label: "🔴 AI Predictions", icon: Bot, category: "AI & Automation" },
  { id: "scheduled_jobs", label: "🔴 Scheduled Jobs", icon: Calendar, category: "AI & Automation" },

  // Analytics
  { id: "business_analytics", label: "🔴 Business Analytics", icon: BarChart3, category: "Analytics" },
  { id: "sales_analytics_analytics", label: "🔴 Sales Analytics", icon: BarChart3, category: "Analytics" },
  { id: "finance_analytics", label: "🔴 Finance Analytics", icon: BarChart3, category: "Analytics" },
  { id: "hr_analytics", label: "🔴 HR Analytics", icon: BarChart3, category: "Analytics" },
  { id: "manufacturing_analytics", label: "🔴 Manufacturing Analytics", icon: BarChart3, category: "Analytics" },
  { id: "marketing_analytics", label: "🔴 Marketing Analytics", icon: BarChart3, category: "Analytics" },
  { id: "custom_reports", label: "🔴 Custom Reports", icon: BarChart3, category: "Analytics" },

  // Administration
  { id: "company_settings", label: "🔴 Company Settings", icon: Settings, category: "Administration" },
  { id: "branch_settings", label: "🔴 Branch Settings", icon: Settings, category: "Administration" },
  { id: "currency", label: "🔴 Currency", icon: Briefcase, category: "Administration" },
  { id: "tax_configuration", label: "🔴 Tax Configuration", icon: Settings, category: "Administration" },
  { id: "holidays", label: "🔴 Holidays", icon: Calendar, category: "Administration" },
  { id: "business_hours", label: "🔴 Business Hours", icon: Briefcase, category: "Administration" },
  { id: "notifications_administration", label: "🔴 Notifications", icon: Briefcase, category: "Administration" },
  { id: "licenses", label: "🔴 Licenses", icon: Briefcase, category: "Administration" },

  // My Workspace (Personal)
  { id: "my_tasks", label: "My Tasks", icon: Kanban, category: "My Workspace (Personal)" },
  { id: "my_calendar", label: "My Calendar", icon: Calendar, category: "My Workspace (Personal)" },
  { id: "my_documents", label: "My Documents", icon: FileText, category: "My Workspace (Personal)" },
  { id: "my_attendance", label: "My Attendance", icon: Briefcase, category: "My Workspace (Personal)" },
  { id: "my_performance", label: "My Performance", icon: Briefcase, category: "My Workspace (Personal)" },
  { id: "my_notifications", label: "My Notifications", icon: Briefcase, category: "My Workspace (Personal)" },
  { id: "profile", label: "Profile", icon: FileText, category: "My Workspace (Personal)" },
];

const FINANCIAL_HOLIDAYS = [
  { date: "2026-01-26", name: "Republic Day", type: "National" },
  { date: "2026-03-08", name: "Maha Shivaratri", type: "Market Closed" },
  { date: "2026-03-25", name: "Holi", type: "Market Closed" },
  { date: "2026-03-29", name: "Good Friday", type: "Market Closed" },
  { date: "2026-04-11", name: "Id-Ul-Fitr", type: "Market Closed" },
  { date: "2026-04-17", name: "Ram Navami", type: "Market Closed" },
  { date: "2026-05-01", name: "Maharashtra Day", type: "Market Closed" },
  { date: "2026-08-15", name: "Independence Day", type: "National" },
  { date: "2026-10-02", name: "Gandhi Jayanti", type: "National" },
  { date: "2026-11-01", name: "Diwali (Laxmi Pujan)", type: "Trading" },
  { date: "2026-12-25", name: "Christmas", type: "Market Closed" }
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [targetApplicationId, setTargetApplicationId] = useState<string | undefined>()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [documentPayload, setDocumentPayload] = useState<string | undefined>()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date())
  const navigate = useNavigate()
  const { toast } = useToast()

  // Holiday computation
  const todayDateStr = format(currentTime, 'yyyy-MM-dd');
  const selectedDateStr = calendarDate ? format(calendarDate, 'yyyy-MM-dd') : null;
  const todayHoliday = FINANCIAL_HOLIDAYS.find(h => h.date === todayDateStr);
  const selectedHoliday = FINANCIAL_HOLIDAYS.find(h => h.date === selectedDateStr);
  const nextHoliday = FINANCIAL_HOLIDAYS.find(h => new Date(h.date + "T00:00:00").getTime() > currentTime.getTime());
  const daysToNext = nextHoliday ? Math.ceil((new Date(nextHoliday.date + "T00:00:00").getTime() - currentTime.getTime()) / (1000 * 3600 * 24)) : null;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])



  interface UserAccessState { allowed_pages: string[]; default_tab: string | null; }
  const [userAccess, setUserAccess] = useState<UserAccessState | null>(null);

  const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || ""
  const SENDER_EMAIL = "no-reply@biovaco.in"
  const SENDER_NAME = "BiovaCo Nexus"
  
  const [notifications, setNotifications] = useState<{title: string, desc: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<{type: string, id: string, title: string, subtitle: string, tab: string, payload?: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ─── ⌘K Keyboard Shortcut ───
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        e.stopPropagation();
        searchInputRef.current?.focus();
        setShowSearchDropdown(true);
      }
      if (e.key === 'Escape') {
        setShowSearchDropdown(false);
        searchInputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─── Module keyword aliases for fuzzy search ───
  const MODULE_KEYWORDS: Record<string, string[]> = {
    dashboard: ['home', 'main', 'overview', 'exec', 'command'],
    my_work: ['my', 'work', 'personal', 'todo'],
    notifications: ['alert', 'bell', 'notify', 'notif'],
    ai_business_assistant: ['ai', 'bot', 'assistant', 'chat', 'gpt'],
    global_search: ['search', 'find', 'look'],
    ceo_dashboard: ['ceo', 'chief', 'executive'],
    md_dashboard: ['md', 'managing', 'director'],
    executive_calendar: ['calendar', 'schedule', 'timetable', 'agenda'],
    company_goals_okrs: ['goals', 'okr', 'objective', 'target'],
    kpi_dashboard: ['kpi', 'metrics', 'indicator'],
    business_intelligence: ['bi', 'intelligence', 'insight'],
    reports_center: ['report', 'reports', 'analytics'],
    compliance_ai: ['compliance', 'lawyer', 'legal', 'regulation'],
    company_profile: ['company', 'profile', 'about'],
    departments: ['dept', 'department', 'division'],
    branches: ['branch', 'office', 'location'],
    teams: ['team', 'group', 'squad'],
    organization_chart: ['org', 'chart', 'hierarchy', 'structure'],
    hr_dashboard: ['hr', 'human', 'resource'],
    employees: ['employee', 'staff', 'member'],
    intern_management: ['intern', 'trainee', 'fresher'],
    attendance: ['attendance', 'present', 'absent', 'punch'],
    leave_management: ['leave', 'vacation', 'holiday', 'off'],
    payroll: ['payroll', 'salary', 'pay', 'wage'],
    performance_reviews: ['review', 'appraisal', 'rating'],
    recruitment: ['recruit', 'hire', 'hiring'],
    job_positions: ['job', 'position', 'vacancy', 'opening'],
    applications: ['application', 'applicant', 'resume', 'cv'],
    offer_letters: ['offer', 'letter', 'joining'],
    exit_management: ['exit', 'resign', 'termination', 'offboard'],
    assets_assigned: ['asset', 'laptop', 'device', 'equipment'],
    crm_dashboard: ['crm', 'customer', 'relation'],
    leads: ['lead', 'prospect'],
    opportunities: ['opportunity', 'deal', 'pipeline'],
    accounts_companies: ['account', 'company', 'client'],
    contacts: ['contact', 'person', 'phone'],
    customers: ['customer', 'buyer'],
    sales_pipeline: ['pipeline', 'funnel', 'stage'],
    quotations: ['quote', 'quotation', 'estimate', 'proposal'],
    followups: ['followup', 'follow', 'reminder'],
    meetings: ['meeting', 'meet', 'conference', 'zoom'],
    calls: ['call', 'phone', 'dial'],
    emails: ['email', 'mail', 'inbox'],
    deals: ['deal', 'close', 'won'],
    customer_support: ['support', 'ticket', 'help'],
    complaints: ['complaint', 'issue', 'problem'],
    feedback: ['feedback', 'survey', 'response'],
    contracts: ['contract', 'agreement', 'mou'],
    finance_dashboard: ['finance', 'money', 'accounting', 'accounts'],
    gst: ['gst', 'tax', 'return'],
    invoices: ['invoice', 'bill', 'billing'],
    expenses: ['expense', 'spend', 'cost'],
    budget: ['budget', 'forecast'],
    inventory_dashboard: ['inventory', 'stock', 'warehouse'],
    products: ['product', 'item', 'sku'],
    production_dashboard: ['production', 'manufacturing', 'factory'],
    bill_of_materials_bom: ['bom', 'material', 'raw'],
    quality_check: ['quality', 'qc', 'qa', 'check'],
    rd_dashboard: ['rd', 'research', 'development'],
    rd_lab: ['lab', 'laboratory', 'experiment'],
    knowledge_tracker: ['knowledge', 'tracker', 'task', 'kb'],
    market_research: ['market', 'research', 'competitor'],
    marketing_dashboard: ['marketing', 'brand', 'campaign'],
    intern_ideas: ['intern', 'notepad', 'idea', 'pitch', 'notes', 'marketing intern'],
    content_storytelling: ['content', 'story', 'storytelling', 'copywriting', 'script', 'reel', 'writer'],
    marketing_posts: ['post', 'social', 'content'],
    newsletter: ['newsletter', 'subscriber'],
    seo: ['seo', 'google', 'rank'],
    shared_files: ['file', 'shared', 'document', 'upload', 'drive'],
    document_generator: ['document', 'generator', 'pdf', 'doc', 'stamp', 'seal'],
    access_control: ['access', 'permission', 'role', 'rbac', 'security'],
    user_management: ['user', 'manage'],
    audit_logs: ['audit', 'log', 'activity', 'history'],
    system_health: ['health', 'status', 'uptime', 'server'],
  };

  // Fuzzy module matching: checks label + category + keyword aliases
  const matchesModule = (tab: any, q: string): boolean => {
    const lq = q.toLowerCase();
    if (tab.label.toLowerCase().includes(lq)) return true;
    if (tab.category.toLowerCase().includes(lq)) return true;
    if (tab.id.toLowerCase().replace(/_/g, ' ').includes(lq)) return true;
    const keywords = MODULE_KEYWORDS[tab.id] || [];
    if (keywords.some(kw => kw.startsWith(lq) || lq.startsWith(kw))) return true;
    return false;
  };

  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const cleanQuery = searchQuery.toLowerCase().trim().replace(/[%_(),]/g, '');
        const likeQuery = `%${cleanQuery}%`;
        const results: any[] = [];
        if (cleanQuery.length >= 2) {
          const [appsRes, jobsRes, internsRes, kbRes, newsRes, videosRes, postsRes, expRes, schedRes] = await Promise.all([
            supabase.from('job_applications').select('id, full_name, role, email').or(`full_name.ilike.${likeQuery},email.ilike.${likeQuery},role.ilike.${likeQuery}`).limit(4),
            supabase.from('job_positions').select('id, title, department').or(`title.ilike.${likeQuery},department.ilike.${likeQuery}`).limit(4),
            supabase.from('interns').select('id, name, position, email').or(`name.ilike.${likeQuery},email.ilike.${likeQuery},position.ilike.${likeQuery}`).limit(4),
            supabase.from('knowledge_items').select('id, title, category, priority, status, description').or(`title.ilike.${likeQuery},category.ilike.${likeQuery},description.ilike.${likeQuery},priority.ilike.${likeQuery}`).limit(4),
            supabase.from('news_articles').select('id, title, category').or(`title.ilike.${likeQuery},category.ilike.${likeQuery}`).limit(3),
            supabase.from('website_videos').select('id, title, video_type').or(`title.ilike.${likeQuery},video_type.ilike.${likeQuery}`).limit(3),
            supabase.from('marketing_posts').select('id, title, content').or(`title.ilike.${likeQuery},content.ilike.${likeQuery}`).limit(3),
            supabase.from('expense_records').select('id, description, vendor_name, category').or(`description.ilike.${likeQuery},vendor_name.ilike.${likeQuery},category.ilike.${likeQuery}`).limit(3),
            supabase.from('ceo_md_timetable').select('id, task_title, category, assigned_email').or(`task_title.ilike.${likeQuery},category.ilike.${likeQuery},assigned_email.ilike.${likeQuery}`).limit(3),
          ]);
          if (appsRes.data) appsRes.data.forEach(a => results.push({ type: 'Application', id: a.id, title: a.full_name || 'Unknown', subtitle: `${a.role || ''} • ${a.email || ''}`, tab: 'applications', payload: a.id }));
          if (jobsRes.data) jobsRes.data.forEach(j => results.push({ type: 'Job Position', id: j.id, title: j.title, subtitle: j.department, tab: 'job_positions' }));
          if (internsRes.data) internsRes.data.forEach(i => results.push({ type: 'Intern', id: i.id, title: i.name, subtitle: `${i.position || ''} • ${i.email || ''}`, tab: 'intern_management' }));
          if (kbRes.data) kbRes.data.forEach(k => results.push({ type: 'Knowledge Task', id: k.id, title: k.title, subtitle: `${k.category || ''} • ${k.priority || ''} • ${k.status || ''}`, tab: 'knowledge_tracker' }));
          if (newsRes.data) newsRes.data.forEach(n => results.push({ type: 'News', id: n.id, title: n.title, subtitle: n.category, tab: 'press_media' }));
          if (videosRes.data) videosRes.data.forEach(v => results.push({ type: 'Video', id: v.id, title: v.title, subtitle: v.video_type || 'Video', tab: 'videos' }));
          if (postsRes.data) postsRes.data.forEach(p => results.push({ type: 'Marketing Post', id: p.id, title: p.title, subtitle: p.title, tab: 'marketing_posts' }));
          if (expRes.data) expRes.data.forEach(e => results.push({ type: 'Expense', id: e.id, title: e.description || e.category || 'Expense', subtitle: e.vendor_name || '', tab: 'business' }));
          if (schedRes.data) schedRes.data.forEach(t => results.push({ type: 'Schedule', id: t.id, title: t.task_title, subtitle: `${t.category || ''} • ${t.assigned_email || ''}`, tab: 'executive_calendar' }));
        }
        setSearchResults(results);
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user, userAccess]);
  
  useEffect(() => {
    if (!user) return;
    const fetchAlerts = async () => {
      const notifs = [];
      const { count: appsCount } = await supabase.from('job_applications').select('*', { count: 'exact', head: true }).in('status', ['New', 'Pending']);
      if (appsCount && appsCount > 0) notifs.push({ title: "Job Applications", desc: `${appsCount} pending applications to review.` });
      
      const { data: invData } = await supabase.from('inventory_items').select('quantity, low_stock_threshold');
      if (invData) {
        const lowStockCount = invData.filter(i => (i.quantity || 0) < (i.low_stock_threshold || 5)).length;
        if (lowStockCount > 0) notifs.push({ title: "Low Stock Alert", desc: `${lowStockCount} items are critically low on stock.` });
      }
      
      const { count: expCount } = await supabase.from('expense_records').select('*', { count: 'exact', head: true }).eq('reimbursement_status', 'Pending');
      if (expCount && expCount > 0) notifs.push({ title: "Pending Expenses", desc: `${expCount} expenses are pending reimbursement.` });
      
      const { data: scheduleData } = await supabase.from('ceo_md_timetable').select('task_title, start_time, end_time, event_date').eq('assigned_email', user.email).eq('status', 'Pending');
      if (scheduleData && scheduleData.length > 0) {
        scheduleData.forEach(item => {
          notifs.push({ title: `Assigned Task: ${item.task_title}`, desc: `Scheduled for ${item.event_date ? item.event_date : 'this week'} from ${item.start_time} to ${item.end_time}.` });
        });
      }

      setNotifications(notifs);
    };
    fetchAlerts();
  }, [user]);
  useEffect(() => {
    // Check authentication first
    const checkAuth = async () => {
      let session;
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Admin auth check failed (invalid/expired token):', error.message);
          await supabase.auth.signOut({ scope: 'local' });
          navigate("/auth");
          return;
        }
        session = data.session;
      } catch (err: any) {
        console.warn('Admin getSession threw:', err?.message || err);
        await supabase.auth.signOut({ scope: 'local' });
        navigate("/auth");
        return;
      }
      if (!session) {
        navigate("/auth")
        return
      }

      const email = session.user.email?.toLowerCase();
      if (!email) {
        await supabase.auth.signOut();
        navigate("/auth");
        return;
      }

      // CEO & MD always have full access
      if (email === "ceo@biovaco.in" || email === "md@biovaco.in") {
        setUser(session.user);
        setUserAccess(null); // null = full access
        setIsCheckingAuth(false);
        return;
      }

      // For other users, check database access rules
      const { data: accessRule, error } = await supabase
        .from("user_page_access")
        .select("allowed_pages, default_tab, is_active")
        .eq("user_email", email)
        .maybeSingle();

      if (error || !accessRule || !accessRule.is_active) {
        toast({ title: "Access Denied", description: "You do not have permission to access the admin portal.", variant: "destructive" });
        await supabase.auth.signOut();
        navigate("/auth");
        return;
      }

      setUser(session.user);
      setUserAccess({ allowed_pages: accessRule.allowed_pages || [], default_tab: accessRule.default_tab });
      if (accessRule.default_tab) {
        setActiveTab(accessRule.default_tab);
      } else if (accessRule.allowed_pages?.length > 0) {
        setActiveTab(accessRule.allowed_pages[0]);
      }
      setIsCheckingAuth(false);
    }

    checkAuth()
  }, [navigate, toast])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "Signed out successfully",
        description: "You have been logged out.",
      })
      navigate("/auth")
    } catch (error: any) {
      // If global signout fails (e.g. invalid token), force local cleanup
      console.warn('Global signOut failed, clearing local session:', error.message);
      await supabase.auth.signOut({ scope: 'local' });
      navigate("/auth")
    }
  }

  const isCEOorMD = user?.email === "ceo@biovaco.in" || user?.email === "md@biovaco.in";
  const hasDbAccess = userAccess !== null;

  const isTabAllowed = (tabId: string, allowedPages: string[]): boolean => {
    if (!allowedPages || allowedPages.length === 0) return false;
    if (allowedPages.includes(tabId)) return true;

    // Legacy 1-to-1 fallback aliases
    if (tabId === "mkt_strategy" && (allowedPages.includes("campaigns") || allowedPages.includes("marketing_dashboard"))) return true;
    if (tabId === "mkt_calendar" && (allowedPages.includes("content_storytelling") || allowedPages.includes("intern_ideas"))) return true;
    if (tabId === "mkt_assets" && allowedPages.includes("brand_assets")) return true;

    return false;
  };
  
  const visibleTabs = (isCEOorMD || !userAccess)
    ? INITIAL_TABS 
    : INITIAL_TABS.filter(t => isTabAllowed(t.id, userAccess.allowed_pages));

  const initialGroupedTabs: Record<string, any[]> = {};
  const groupedTabs = visibleTabs.reduce((acc, tab) => {
    if (!acc[tab.category]) acc[tab.category] = [];
    acc[tab.category].push(tab);
    return acc;
  }, initialGroupedTabs);

  useEffect(() => {
    if (!isCEOorMD && hasDbAccess && userAccess.allowed_pages.length > 0) {
      if (!isTabAllowed(activeTab, userAccess.allowed_pages)) {
        setActiveTab(userAccess.default_tab || userAccess.allowed_pages[0]);
      }
    }
  }, [isCEOorMD, hasDbAccess, activeTab, userAccess]);

  const handleNavigateToTab = (tab: string, payload?: string) => {
    if (tab === "applications" && payload) {
      setTargetApplicationId(payload)
    }
    if (tab === "documents" && payload) {
      setDocumentPayload(payload)
    }
    setActiveTab(tab)
  }

  if (isCheckingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]"><Loader2 className="h-10 w-10 animate-spin text-[#7DA0FA]" /></div>
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b-2 border-[#7DA0FA] sticky top-0 z-40" style={{ boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3 w-auto md:w-1/3">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex -ml-2 text-gray-500 hover:text-[#4B49AC]">
                <Menu className="h-5 w-5" />
              </Button>
              <BiovaCoLogo className="h-9 w-auto" />
              <div className="hidden sm:flex flex-col">
                <span className="text-base font-semibold text-[#4B49AC] leading-tight">
                  {isCEOorMD ? "BiovaCo Nexus" : "BiovaCo Portal"}
                </span>
                <span className="text-[10px] font-medium text-[#7DA0FA] uppercase tracking-wider leading-tight">Admin Console</span>
              </div>
              <span className="text-base font-semibold text-[#4B49AC] sm:hidden">
                {isCEOorMD ? "Nexus" : "Portal"}
              </span>
            </div>

            {/* Middle Section: Functional Search Bar */}
            <div className="hidden md:flex flex-1 items-center justify-center w-1/3 px-4">
              <div className="relative w-full max-w-md group">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-[#4B49AC] transition-colors" />
                <Input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Search modules, people, tasks... (⌘K)" 
                  className="w-full pl-9 pr-12 h-9 bg-gray-50/80 border-gray-200/80 text-sm focus-visible:ring-2 focus-visible:ring-[#4B49AC]/20 focus-visible:border-[#4B49AC] rounded-lg shadow-sm transition-all duration-200" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                />
                <div className="absolute right-3 top-2 flex items-center gap-1 pointer-events-none">
                  <span className="text-[10px] font-medium text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 bg-white shadow-sm">⌘ K</span>
                </div>
                
                {showSearchDropdown && searchQuery && (
                  <div className="absolute top-11 left-0 w-full bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-xl overflow-hidden z-50 ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[400px] overflow-y-auto py-1">
                      {/* Modules Search */}
                      {visibleTabs.filter(t => matchesModule(t, searchQuery)).length > 0 && (
                        <div className="p-2">
                          <div className="text-[10px] font-bold text-gray-400 uppercase px-3 mb-1 mt-1">Modules</div>
                          {visibleTabs.filter(t => matchesModule(t, searchQuery)).slice(0, 8).map(tab => (
                            <div 
                              key={tab.id} 
                              className="px-3 py-2 text-sm cursor-pointer hover:bg-[#f2f6ff] flex items-center justify-between transition-colors text-gray-700 hover:text-[#4B49AC] rounded-lg mx-2 my-0.5" 
                              onClick={() => {
                                handleNavigateToTab(tab.id);
                                setSearchQuery("");
                                setShowSearchDropdown(false);
                              }}
                            >
                              <div className="flex items-center">
                                <tab.icon className="w-4 h-4 mr-2" />
                                {tab.label}
                              </div>
                              <span className="text-[9px] text-gray-400 font-medium">{tab.category}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Deep Search Results */}
                      {searchResults.length > 0 && (
                        <div className="p-2 border-t border-gray-100 mt-2">
                          <div className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-2 mt-1">Deep Search Results</div>
                          {searchResults.map(res => (
                            <div 
                              key={res.id} 
                              className="px-3 py-2.5 cursor-pointer hover:bg-[#f2f6ff] transition-colors text-gray-700 hover:text-[#4B49AC] rounded-lg flex flex-col mx-1 my-0.5" 
                              onClick={() => {
                                handleNavigateToTab(res.tab, res.payload);
                                setSearchQuery("");
                                setShowSearchDropdown(false);
                              }}
                            >
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-sm font-semibold">{res.title}</span>
                                <Badge variant="secondary" className="text-[9px] font-medium h-4 px-1.5 bg-[#7DA0FA]/10 text-[#4B49AC] border-0">{res.type}</Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">{res.subtitle}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {isSearching && (
                        <div className="p-4 text-center">
                          <Loader2 className="h-4 w-4 animate-spin text-primary mx-auto" />
                        </div>
                      )}

                      {!isSearching && searchResults.length === 0 && visibleTabs.filter(t => matchesModule(t, searchQuery)).length === 0 && (
                        <div className="px-3 py-6 text-sm text-gray-500 text-center">No results found for "{searchQuery}"</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Section: Notification, Profile, Logout */}
            <div className="flex items-center justify-end space-x-2.5 flex-shrink-0">
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg shadow-sm whitespace-nowrap">
                <Clock className="h-4 w-4 text-[#4B49AC]" />
                <span className="text-[11px] font-semibold text-gray-700 tracking-wide tabular-nums">
                  {format(currentTime, 'MMM dd, yyyy • hh:mm:ss a')}
                </span>
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-gray-500 hover:text-[#4B49AC] hover:bg-[#f2f6ff] shadow-sm hidden md:flex border-gray-200">
                    <Calendar className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[330px] p-0 shadow-2xl border-gray-200 rounded-xl overflow-hidden ring-1 ring-black/5">
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 text-white">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#7DA0FA]" /> Market Calendar
                    </h4>
                    {todayHoliday ? (
                      <div className="mt-2.5 inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-200 border border-rose-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">
                        <AlertCircle className="h-3 w-3" /> Today is {todayHoliday.name}
                      </div>
                    ) : nextHoliday ? (
                      <p className="text-[11px] text-gray-300 mt-1 font-medium tracking-wide">
                        Next Holiday: <span className="text-white font-bold">{nextHoliday.name}</span> in {daysToNext} days
                      </p>
                    ) : null}
                  </div>
                  <div className="p-3 bg-white">
                    <CalendarComponent
                      mode="single"
                      selected={calendarDate}
                      onSelect={setCalendarDate}
                      initialFocus
                      modifiers={{
                        holiday: FINANCIAL_HOLIDAYS.map(h => new Date(h.date + "T00:00:00"))
                      }}
                      modifiersStyles={{
                        holiday: {
                          backgroundColor: '#1f2937',
                          color: 'white',
                          fontWeight: 'bold',
                        }
                      }}
                      className="rounded-lg bg-white border-none mx-auto p-0"
                    />
                  </div>
                  {selectedHoliday && selectedDateStr !== todayDateStr && (
                    <div className="border-t border-gray-100 bg-gray-50/80 p-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[13px] font-bold text-gray-900">{selectedHoliday.name}</p>
                          <p className="text-[10px] font-medium text-gray-500 mt-0.5">{format(new Date(selectedHoliday.date + "T00:00:00"), 'MMMM do, yyyy')}</p>
                        </div>
                        <Badge variant="secondary" className="bg-[#4B49AC]/10 text-[#4B49AC] text-[10px] font-bold border-0 shadow-sm">{selectedHoliday.type}</Badge>
                      </div>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-primary hover:bg-primary/5 hidden md:flex">
                      <Bell className="h-5 w-5" />
                      {notifications.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#F3797E] rounded-full border border-white"></span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 p-0 shadow-lg border-gray-100">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between rounded-t-lg">
                      <span className="font-semibold text-sm text-foreground">Notifications & Alerts</span>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-0">{notifications.length} New</Badge>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length > 0 ? notifications.map((n, i) => (
                        <div key={i} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50/80 transition-colors last:border-0">
                          <p className="text-sm font-semibold text-primary">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                        </div>
                      )) : (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">No pending alerts. You're all caught up!</div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f2f6ff] border border-[#7DA0FA]/20 rounded-md">
                <div className="h-2 w-2 rounded-full bg-[#7DA0FA]" />
                <span className="text-xs text-[#4B49AC] font-medium">{user?.email}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-gray-500 hover:text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="h-2 w-2 rounded-full bg-[#7DA0FA]" />
                <span className="text-xs text-gray-500">{user?.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start text-gray-600 hover:text-[#4B49AC]"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="flex" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <aside
          className={`${
            sidebarOpen ? 'hidden lg:flex' : 'hidden'
          } lg:flex-col lg:w-60 bg-white border-r border-gray-200 sticky top-14 overflow-y-auto transition-all duration-200`}
          style={{ height: 'calc(100vh - 56px)' }}
        >
          <nav className="flex-1 px-3 py-4 space-y-5">
            {Object.entries(groupedTabs).map(([category, catTabs]) => (
              <div key={category} className="space-y-1">
                <div className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {category}
                </div>
                {catTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <div
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`cursor-pointer transition-opacity flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 select-none ${
                        isActive
                          ? 'bg-[#7DA0FA] text-white shadow-sm'
                          : 'text-gray-600 hover:bg-[#f2f6ff] hover:text-[#4B49AC]'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      <span className="truncate">{tab.label}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 w-full overflow-x-hidden bg-[#f8fafc]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            
            <div className="lg:hidden mb-5">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-[#4B49AC]/20 focus:border-[#4B49AC] outline-none appearance-none"
              >
                {Object.entries(groupedTabs).map(([category, catTabs]) => (
                  <optgroup key={category} label={category}>
                    {catTabs.map(tab => (
                      <option key={tab.id} value={tab.id}>{tab.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

                        {(!isCEOorMD && hasDbAccess && !isTabAllowed(activeTab, userAccess.allowed_pages)) ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-lg border border-red-100 shadow-sm">
                <ShieldAlert className="h-16 w-16 text-red-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-800">Access Denied</h2>
                <p className="text-gray-500 mt-2">You do not have permission to view the <span className="font-semibold">{activeTab}</span> page.</p>
              </div>
            ) : (
              <>
                {activeTab === "dashboard" && <UniversalDashboard onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "my_work" && <MyWork onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "notifications" && <Notifications onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "ai_business_assistant" && <AIBusinessAssistant onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "global_search" && <GlobalSearch onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "ceo_dashboard" && <CEODashboard onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "md_dashboard" && <MDDashboard onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "executive_calendar" && <CeoMdTimetable />}
                {activeTab === "company_goals_okrs" && <CompanyGoalsOKRs />}
                {activeTab === "kpi_dashboard" && <KPIDashboard />}
                {activeTab === "business_intelligence" && <BusinessIntelligence />}
                {activeTab === "reports_center" && <ReportsCenter />}
                {activeTab === "company_profile" && <CompanyProfile />}
                {activeTab === "departments" && <Departments onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "branches" && <Branches />}
                {activeTab === "teams" && <Teams onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "organization_chart" && <OrganizationChart />}
                {activeTab === "hr_dashboard" && <HRDashboard onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "employees" && <Employees />}
                {activeTab === "intern_management" && <InternManagement />}
                {activeTab === "attendance" && <Attendance />}
                {activeTab === "leave_management" && <LeaveManagement />}
                {activeTab === "payroll" && <Payroll />}
                {activeTab === "performance_reviews" && <PerformanceReviews />}
                {activeTab === "recruitment" && <RecruitmentManagement onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "job_positions" && <JobPositionsManagement />}
                {activeTab === "applications" && <ApplicationsManagement initialTargetId={targetApplicationId} onClearTargetId={() => setTargetApplicationId(undefined)} onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "offer_letters" && <OfferLetters />}
                {activeTab === "exit_management" && <ExitManagement />}
                {activeTab === "assets_assigned" && <AssetsAssigned />}
                {activeTab === "crm_dashboard" && <CRMDashboard onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "leads" && <Leads />}
                {activeTab === "opportunities" && <Opportunities />}
                {activeTab === "accounts_companies" && <Accounts />}
                {activeTab === "contacts" && <Contacts />}
                {activeTab === "customers" && <Customers />}
                {activeTab === "sales_pipeline" && <SalesPipeline onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "quotations" && <Quotations />}
                {activeTab === "followups" && <FollowUps />}
                {activeTab === "meetings" && <Meetings />}
                {activeTab === "calls" && <Calls />}
                {activeTab === "emails" && <Emails />}
                {activeTab === "deals" && <Deals />}
                {activeTab === "customer_support" && <CustomerSupport />}
                {activeTab === "complaints" && <Complaints />}
                {activeTab === "feedback" && <Feedback />}
                {activeTab === "contracts" && <Contracts />}
                {activeTab === "sales_dashboard" && <PlaceholderPage title="Sales Dashboard" category="Sales" />}
                {activeTab === "orders" && <PlaceholderPage title="Orders" category="Sales" />}
                {activeTab === "quotations_sales" && <Quotations />}
                {activeTab === "proforma_invoice" && <PlaceholderPage title="Proforma Invoice" category="Sales" />}
                {activeTab === "invoices" && <PlaceholderPage title="Invoices" category="Sales" />}
                {activeTab === "payments" && <PlaceholderPage title="Payments" category="Sales" />}
                {activeTab === "sales_analytics" && <PlaceholderPage title="Sales Analytics" category="Sales" />}
                {activeTab === "price_lists" && <PlaceholderPage title="Price Lists" category="Sales" />}
                {activeTab === "discounts" && <PlaceholderPage title="Discounts" category="Sales" />}
                {activeTab === "inventory_dashboard" && <PlaceholderPage title="Inventory Dashboard" category="Inventory & Warehouse" />}
                {activeTab === "products" && <PlaceholderPage title="Products" category="Inventory & Warehouse" />}
                {activeTab === "categories" && <PlaceholderPage title="Categories" category="Inventory & Warehouse" />}
                {activeTab === "warehouses" && <PlaceholderPage title="Warehouses" category="Inventory & Warehouse" />}
                {activeTab === "stock_movement" && <PlaceholderPage title="Stock Movement" category="Inventory & Warehouse" />}
                {activeTab === "purchase_requests" && <PlaceholderPage title="Purchase Requests" category="Inventory & Warehouse" />}
                {activeTab === "stock_adjustment" && <PlaceholderPage title="Stock Adjustment" category="Inventory & Warehouse" />}
                {activeTab === "batch_tracking" && <PlaceholderPage title="Batch Tracking" category="Inventory & Warehouse" />}
                {activeTab === "barcode_management" && <PlaceholderPage title="Barcode Management" category="Inventory & Warehouse" />}
                {activeTab === "production_dashboard" && <ManufacturingManagement initialTab="dashboard" />}
                {activeTab === "bill_of_materials_bom" && <ManufacturingManagement initialTab="bom" />}
                {activeTab === "production_orders" && <ManufacturingManagement initialTab="orders" />}
                {activeTab === "quality_check" && <ManufacturingManagement initialTab="quality" />}
                {activeTab === "machines" && <ManufacturingManagement initialTab="machines" />}
                {activeTab === "maintenance" && <ManufacturingManagement initialTab="maintenance" />}
                {activeTab === "production_reports" && <ManufacturingManagement initialTab="reports" />}
                {activeTab === "finance_dashboard" && <FinanceManagement initialTab="dashboard" />}
                {activeTab === "chart_of_accounts" && <ChartOfAccountsManagement />}
                {activeTab === "journal_entries" && <JournalEntriesManagement />}
                {activeTab === "general_ledger" && <FinanceManagement initialTab="reports" />}
                {activeTab === "trial_balance" && <FinancialStatementsCenter initialTab="trial_balance" />}
                {activeTab === "profit_loss" && <FinancialStatementsCenter initialTab="profit_loss" />}
                {activeTab === "balance_sheet" && <FinancialStatementsCenter initialTab="balance_sheet" />}
                {activeTab === "cash_flow" && <FinancialStatementsCenter initialTab="cash_flow" />}
                {activeTab === "budget" && <BudgetManagement />}
                {activeTab === "expenses" && <FinanceManagement initialTab="expenses" />}
                {activeTab === "receivables" && <ReceivablesPayables />}
                {activeTab === "payables" && <ReceivablesPayables />}
                {activeTab === "gst" && <TaxGSTCenter initialTab="gst" />}
                {activeTab === "tax_center" && <TaxGSTCenter initialTab="tax" />}
                {activeTab === "fixed_assets" && <FixedAssetsManagement />}
                {activeTab === "procurement_dashboard" && <PlaceholderPage title="Procurement Dashboard" category="Procurement" />}
                {activeTab === "vendors" && <PlaceholderPage title="Vendors" category="Procurement" />}
                {activeTab === "purchase_orders" && <PlaceholderPage title="Purchase Orders" category="Procurement" />}
                {activeTab === "rfq" && <PlaceholderPage title="RFQ" category="Procurement" />}
                {activeTab === "vendor_quotations" && <PlaceholderPage title="Vendor Quotations" category="Procurement" />}
                {activeTab === "goods_received_note_grn" && <PlaceholderPage title="Goods Received Note (GRN)" category="Procurement" />}
                {activeTab === "bills" && <PlaceholderPage title="Bills" category="Procurement" />}
                {activeTab === "vendor_payments" && <PlaceholderPage title="Vendor Payments" category="Procurement" />}
                {activeTab === "rd_dashboard" && <RDLabManagement initialTab="dashboard" />}
                {activeTab === "rd_lab" && <RDLabManagement initialTab="dashboard" />}
                {activeTab === "product_formulations" && <RDLabManagement initialTab="recipes" />}
                {activeTab === "experiments" && <RDLabManagement initialTab="trials" />}
                {activeTab === "product_testing" && <RDLabManagement initialTab="testing" />}
                {activeTab === "prototype_tracker" && <RDLabManagement initialTab="samples" />}
                {activeTab === "knowledge_tracker" && <KnowledgeTracker />}
                {activeTab === "compliance_ai" && <ComplianceAI />}
                {activeTab === "marketing_dashboard" && <MarketingDashboard />}
                {activeTab === "mkt_strategy" && <MarketingStoreProvider><MarketingStrategy /></MarketingStoreProvider>}
                {activeTab === "mkt_calendar" && <MarketingStoreProvider><ContentCalendar /></MarketingStoreProvider>}
                {activeTab === "mkt_assets" && <MarketingStoreProvider><CreativeAssets /></MarketingStoreProvider>}
                {activeTab === "mkt_reports" && <MarketingStoreProvider><MarketingReports /></MarketingStoreProvider>}
                {activeTab === "intern_ideas" && <MarketingInternNotepad />}
                {activeTab === "content_storytelling" && <ContentStorytellingStudio />}
                {activeTab === "campaigns" && <CampaignsManagement />}
                {activeTab === "social_media" && <MarketingPostsManagement />}
                {activeTab === "marketing_posts" && <MarketingPostsManagement />}
                {activeTab === "newsletter" && <NewsletterManagement />}
                {activeTab === "seo" && <MarketResearchHub />}
                {activeTab === "market_research" && <MarketResearchHub />}
                {activeTab === "brand_assets" && <MediaDashboard />}
                {activeTab === "press_media" && <NewsManagement />}
                {activeTab === "website" && <PlaceholderPage title="Website" category="Digital Assets" />}
                {activeTab === "blog" && <PlaceholderPage title="Blog" category="Digital Assets" />}
                {activeTab === "landing_pages" && <PlaceholderPage title="Landing Pages" category="Digital Assets" />}
                {activeTab === "media_library" && <MediaDashboard />}
                {activeTab === "videos" && <PlaceholderPage title="Videos" category="Digital Assets" />}
                {activeTab === "images" && <PlaceholderPage title="Images" category="Digital Assets" />}
                {activeTab === "downloads" && <PlaceholderPage title="Downloads" category="D Models" />}
                {activeTab === "shared_files" && <SharedFilesManager />}
                {activeTab === "document_generator" && <DocumentGenerator initialPayload={documentPayload} onClearPayload={() => setDocumentPayload(undefined)} />}
                {activeTab === "templates" && <DocumentTemplatesManagement onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "digital_signatures" && <DigitalSignaturesManagement />}
                {activeTab === "contracts_documents" && <Contracts />}
                {activeTab === "sop_library" && <SOPLibraryManagement />}
                {activeTab === "operations_dashboard" && <CoreOperationsDashboard />}
                {activeTab === "projects" && <PlaceholderPage title="Projects" category="Operations" />}
                {activeTab === "tasks" && <PlaceholderPage title="Tasks" category="Operations" />}
                {activeTab === "kanban_board" && <PlaceholderPage title="Kanban Board" category="Operations" />}
                {activeTab === "meetings_operations" && <Meetings />}
                {activeTab === "calendar" && <PlaceholderPage title="Calendar" category="Operations" />}
                {activeTab === "approvals" && <PlaceholderPage title="Approvals" category="Operations" />}
                {activeTab === "announcements" && <PlaceholderPage title="Announcements" category="Operations" />}
                {activeTab === "access_control" && <UserAccessSettings />}
                {activeTab === "user_management" && <UserManagement onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "roles_permissions" && <RolesPermissionsManagement />}
                {activeTab === "api_keys" && <APIKeysManagement />}
                {activeTab === "integrations" && <IntegrationsManagement />}
                {activeTab === "email_settings" && <EmailSettingsManagement />}
                {activeTab === "backup" && <BackupManagement />}
                {activeTab === "audit_logs" && <AdminActivityLogs onNavigateToTab={handleNavigateToTab} />}
                {activeTab === "activity_logs" && <SystemActivityLogs />}
                {activeTab === "system_health" && <SystemHealthManagement />}
                {activeTab === "maintenance_it" && <MaintenanceManagement />}
                {activeTab === "ai_dashboard" && <PlaceholderPage title="AI Dashboard" category="AI & Automation" />}
                {activeTab === "ai_reports" && <PlaceholderPage title="AI Reports" category="AI & Automation" />}
                {activeTab === "workflow_automation" && <PlaceholderPage title="Workflow Automation" category="AI & Automation" />}
                {activeTab === "ai_insights" && <PlaceholderPage title="AI Insights" category="AI & Automation" />}
                {activeTab === "ai_predictions" && <PlaceholderPage title="AI Predictions" category="AI & Automation" />}
                {activeTab === "scheduled_jobs" && <PlaceholderPage title="Scheduled Jobs" category="AI & Automation" />}
                {activeTab === "business_analytics" && <BusinessManagement />}
                {activeTab === "sales_analytics_analytics" && <PlaceholderPage title="Sales Analytics" category="Analytics" />}
                {activeTab === "finance_analytics" && <PlaceholderPage title="Finance Analytics" category="Analytics" />}
                {activeTab === "hr_analytics" && <PlaceholderPage title="HR Analytics" category="Analytics" />}
                {activeTab === "manufacturing_analytics" && <PlaceholderPage title="Manufacturing Analytics" category="Analytics" />}
                {activeTab === "marketing_analytics" && <PlaceholderPage title="Marketing Analytics" category="Analytics" />}
                {activeTab === "custom_reports" && <PlaceholderPage title="Custom Reports" category="Analytics" />}
                {activeTab === "company_settings" && <PlaceholderPage title="Company Settings" category="Administration" />}
                {activeTab === "branch_settings" && <PlaceholderPage title="Branch Settings" category="Administration" />}
                {activeTab === "currency" && <PlaceholderPage title="Currency" category="Administration" />}
                {activeTab === "tax_configuration" && <PlaceholderPage title="Tax Configuration" category="Administration" />}
                {activeTab === "holidays" && <PlaceholderPage title="Holidays" category="Administration" />}
                {activeTab === "business_hours" && <PlaceholderPage title="Business Hours" category="Administration" />}
                {activeTab === "notifications_administration" && <PlaceholderPage title="Notifications" category="Administration" />}
                {activeTab === "licenses" && <PlaceholderPage title="Licenses" category="Administration" />}
                {activeTab === "my_tasks" && <PersonalTasksManagement />}
                {activeTab === "my_calendar" && <MyWork />}
                {activeTab === "my_documents" && <SharedFilesManager />}
                {activeTab === "my_attendance" && <Attendance />}
                {activeTab === "my_performance" && <PerformanceReviews />}
                {activeTab === "my_notifications" && <Notifications />}
                {activeTab === "profile" && <UserProfileManagement />}

              </>
            )}
          </div>
        </main>
      </div>

    </div>
  )
}

export default Admin
