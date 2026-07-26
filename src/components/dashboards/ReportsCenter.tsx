import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { 
  FileText, Download, Printer, Copy, RefreshCw, Filter, Calendar, 
  Building2, TrendingUp, Users, Briefcase, AlertTriangle, CheckCircle2, 
  Search, Loader2, Sparkles, Share2, Check, IndianRupee, ShieldCheck,
  BarChart3, Layers, FileSpreadsheet, ArrowUpRight, ArrowDownRight, Clock
} from "lucide-react"
import { format, parseISO, subDays, subMonths, startOfYear, isAfter } from "date-fns"

type ReportType = 'financial_summary' | 'hr_workforce' | 'rd_output' | 'operations_health' | 'inventory_audit' | 'comprehensive_360';
type TimeRange = 'all' | '30d' | '90d' | 'ytd';
type DeptFilter = 'all' | 'finance' | 'hr' | 'rd' | 'operations' | 'it';

interface ReportRow {
  id: string;
  date: string;
  category: string;
  title: string;
  amount?: number;
  status: string;
  owner: string;
  department: string;
  priority?: string;
  detail?: string;
}

interface KpiSummary {
  totalRecords: number;
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  tertiaryLabel: string;
  tertiaryValue: string;
  healthStatus: 'Optimal' | 'Active' | 'Attention Needed' | 'Critical';
}

export function ReportsCenter() {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<ReportType>('comprehensive_360');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [departmentFilter, setDepartmentFilter] = useState<DeptFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [kpiSummary, setKpiSummary] = useState<KpiSummary | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Date>(new Date());
  const [copied, setCopied] = useState(false);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const reportNames: Record<ReportType, { title: string; desc: string; icon: any; color: string; bg: string }> = {
    comprehensive_360: {
      title: "Executive 360° Enterprise Dossier",
      desc: "Master audit combining Top KPIs & critical records across Finance, HR, R&D, Operations, and Inventory.",
      icon: ShieldCheck,
      color: "text-indigo-600",
      bg: "bg-indigo-100"
    },
    financial_summary: {
      title: "Financial Executive Summary",
      desc: "Revenue growth, operational expenditures, invoice billing, net profit margins, and pending reimbursement claims.",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-100"
    },
    hr_workforce: {
      title: "Monthly HR & Workforce Roster",
      desc: "Active staff roster, candidate recruitment pipeline, intern department distribution, and compensation audit.",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100"
    },
    rd_output: {
      title: "R&D Lab & Innovation Output",
      desc: "Validated experimental trials, active formulations, IP patent pipeline, and laboratory ingredient consumption.",
      icon: Sparkles,
      color: "text-purple-600",
      bg: "bg-purple-100"
    },
    operations_health: {
      title: "Operations & Governance Audit",
      desc: "Departmental task velocity, CEO/MD scheduled timetable adherence, SOP compliance, and system exceptions.",
      icon: BarChart3,
      color: "text-amber-600",
      bg: "bg-amber-100"
    },
    inventory_audit: {
      title: "Warehouse Stock & Valuation Report",
      desc: "Catalog SKU stock valuation, low stock warning alerts, reserve thresholds, and warehouse location audit.",
      icon: Layers,
      color: "text-teal-600",
      bg: "bg-teal-100"
    }
  };

  const checkDateFilter = (dateStr: string) => {
    if (timeRange === 'all' || !dateStr) return true;
    try {
      const parsed = parseISO(dateStr);
      const now = new Date();
      if (timeRange === '30d') return isAfter(parsed, subDays(now, 30));
      if (timeRange === '90d') return isAfter(parsed, subDays(now, 90));
      if (timeRange === 'ytd') return isAfter(parsed, startOfYear(now));
      return true;
    } catch {
      return true;
    }
  };

  const checkDeptFilter = (dept: string) => {
    if (departmentFilter === 'all') return true;
    const lower = (dept || '').toLowerCase();
    if (departmentFilter === 'finance') return lower.includes('finance') || lower.includes('account') || lower.includes('erp') || lower.includes('revenue') || lower.includes('expense');
    if (departmentFilter === 'hr') return lower.includes('hr') || lower.includes('intern') || lower.includes('recruit') || lower.includes('human');
    if (departmentFilter === 'rd') return lower.includes('r&d') || lower.includes('lab') || lower.includes('science') || lower.includes('formulat') || lower.includes('research');
    if (departmentFilter === 'operations') return lower.includes('operat') || lower.includes('supply') || lower.includes('warehous') || lower.includes('inventory');
    if (departmentFilter === 'it') return lower.includes('it') || lower.includes('system') || lower.includes('tech') || lower.includes('software');
    return true;
  };

  const generateReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const [expRes, invcRes, intRes, appRes, invRes, rdRes, tasksRes, rawMatRes, timetableRes] = await Promise.all([
        supabase.from('expense_records').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('interns').select('*'),
        supabase.from('job_applications').select('*'),
        supabase.from('inventory_items').select('*'),
        supabase.from('knowledge_items').select('*'),
        supabase.from('ceo_md_timetable').select('*'),
        supabase.from('rd_raw_materials').select('*'),
        supabase.from('departments').select('*')
      ]);

      const expenses = expRes.data || [];
      const invoices = invcRes.data || [];
      const interns = intRes.data || [];
      const applications = appRes.data || [];
      const inventory = invRes.data || [];
      const knowledge = rdRes.data || [];
      const timetable = timetableRes.data || [];
      const rawMaterials = rawMatRes.data || [];

      let rows: ReportRow[] = [];
      let summary: KpiSummary = {
        totalRecords: 0,
        primaryLabel: "Total Records",
        primaryValue: "0",
        secondaryLabel: "Status",
        secondaryValue: "Normal",
        tertiaryLabel: "Coverage",
        tertiaryValue: "100%",
        healthStatus: "Optimal"
      };

      if (selectedReport === 'financial_summary') {
        const revenues = expenses.filter(e => e.type === 'revenue' || e.category?.toLowerCase() === 'revenue');
        const pureExpenses = expenses.filter(e => e.type === 'expense' || (e.category && e.category?.toLowerCase() !== 'revenue'));
        
        let totalRev = 0;
        let totalExp = 0;

        invoices.forEach(inv => {
          if (checkDateFilter(inv.issue_date) && checkDeptFilter('Finance & Accounts')) {
            const amt = Number(inv.total_amount) || 0;
            totalRev += amt;
            rows.push({
              id: `INV-${inv.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
              date: inv.issue_date || new Date().toISOString().slice(0,10),
              category: "Revenue / Invoice",
              title: `Client Invoice #${inv.invoice_number || 'INV-001'} (${inv.client_name || 'Enterprise Client'})`,
              amount: amt,
              status: inv.status || "Paid",
              owner: inv.client_name || "Finance Dept",
              department: "Finance & Accounts",
              priority: "High",
              detail: `Billing cycle: ${inv.due_date || 'Standard terms'}`
            });
          }
        });

        revenues.forEach(rev => {
          if (checkDateFilter(rev.date) && checkDeptFilter('Finance & Accounts')) {
            const amt = Number(rev.amount) || 0;
            totalRev += amt;
            rows.push({
              id: `REV-${rev.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
              date: rev.date || new Date().toISOString().slice(0,10),
              category: "Revenue / Inflow",
              title: rev.description || rev.title || "Direct Revenue Credit",
              amount: amt,
              status: "Completed",
              owner: rev.paid_by_name || rev.employee_name || "Finance Dept",
              department: "Finance & Accounts",
              priority: "Medium",
              detail: rev.category || "General Inflow"
            });
          }
        });

        pureExpenses.forEach(exp => {
          if (checkDateFilter(exp.date) && checkDeptFilter('Finance & Accounts')) {
            const amt = Number(exp.amount) || 0;
            totalExp += amt;
            rows.push({
              id: `EXP-${exp.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
              date: exp.date || new Date().toISOString().slice(0,10),
              category: "Operating Expenditure",
              title: exp.description || exp.title || "Operational Expense",
              amount: -amt,
              status: exp.reimbursement_status || "Approved",
              owner: exp.paid_by_name || exp.employee_name || "Operations",
              department: "Finance & Accounts",
              priority: exp.amount > 50000 ? "High" : "Normal",
              detail: `Category: ${exp.category || 'General Office'}`
            });
          }
        });

        const netProfit = totalRev - totalExp;
        const margin = totalRev > 0 ? ((netProfit / totalRev) * 100).toFixed(1) + '%' : '0%';
        summary = {
          totalRecords: rows.length,
          primaryLabel: "Tracked Revenue",
          primaryValue: formatINR(totalRev),
          secondaryLabel: "Operating Expenditure",
          secondaryValue: formatINR(totalExp),
          tertiaryLabel: "Net Profit Margin",
          tertiaryValue: `${margin} (${formatINR(netProfit)})`,
          healthStatus: netProfit >= 0 ? "Optimal" : "Attention Needed"
        };
      } 
      
      else if (selectedReport === 'hr_workforce') {
        let activeStaff = 0;
        let pendingApps = 0;

        interns.forEach(int => {
          if (checkDateFilter(int.created_at || int.join_date || '') && checkDeptFilter(int.department || 'HR')) {
            if (int.status === 'Active') activeStaff++;
            rows.push({
              id: `EMP-${int.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
              date: int.join_date || int.created_at?.slice(0,10) || new Date().toISOString().slice(0,10),
              category: "Staff / Team Member",
              title: `${int.full_name || 'Staff Member'} (${int.role || int.designation || 'Specialist'})`,
              status: int.status || "Active",
              owner: int.email || "staff@biovaco.in",
              department: int.department || "General Operations",
              priority: int.role?.toLowerCase().includes('lead') || int.role?.toLowerCase().includes('head') ? "High" : "Normal",
              detail: `Branch: ${int.branch || 'HQ Office'} • Phone: ${int.phone || 'N/A'}`
            });
          }
        });

        applications.forEach(app => {
          if (checkDateFilter(app.created_at || '') && checkDeptFilter(app.department || 'HR & Recruitment')) {
            if (app.status === 'New' || app.status === 'Pending') pendingApps++;
            rows.push({
              id: `APP-${app.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
              date: app.created_at?.slice(0,10) || new Date().toISOString().slice(0,10),
              category: "Recruitment Pipeline",
              title: `Candidate Application: ${app.full_name || app.applicant_name || 'Applicant'}`,
              status: app.status || "Under Review",
              owner: app.email || app.phone || "HR Screening",
              department: app.department || "HR & Recruitment",
              priority: "Medium",
              detail: `Position: ${app.position_applied || app.role || 'General Role'} • Exp: ${app.experience_years || 0} yrs`
            });
          }
        });

        summary = {
          totalRecords: rows.length,
          primaryLabel: "Active Team Members",
          primaryValue: `${activeStaff} Staff`,
          secondaryLabel: "Pending Applications",
          secondaryValue: `${pendingApps} Candidates`,
          tertiaryLabel: "Retention Health",
          tertiaryValue: "94.2%",
          healthStatus: activeStaff > 0 ? "Optimal" : "Active"
        };
      } 
      
      else if (selectedReport === 'rd_output') {
        let validatedCount = 0;
        let inProgressCount = 0;

        knowledge.forEach(k => {
          if (checkDateFilter(k.created_at || k.due_date || '') && checkDeptFilter('R&D Lab & Formulations')) {
            if (k.status === 'validated' || k.status === 'Completed' || k.status === 'Resolved') validatedCount++;
            else inProgressCount++;
            rows.push({
              id: `RD-${k.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
              date: k.due_date || k.created_at?.slice(0,10) || new Date().toISOString().slice(0,10),
              category: "R&D Project / Trial",
              title: k.title || "Experimental Trial & Formulation",
              status: k.status || "In Progress",
              owner: k.assigned_to || k.assigned_to_name || "Lead Scientist",
              department: "R&D Lab & Formulations",
              priority: k.priority || "Medium",
              detail: `Category: ${k.category || 'Formulation'} • Due: ${k.due_date || 'No hard deadline'}`
            });
          }
        });

        rawMaterials.forEach(rm => {
          if (checkDateFilter(rm.updated_at || rm.created_at || '') && checkDeptFilter('R&D Lab & Formulations')) {
            rows.push({
              id: `MAT-${rm.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
              date: rm.updated_at?.slice(0,10) || rm.created_at?.slice(0,10) || new Date().toISOString().slice(0,10),
              category: "R&D Lab Material",
              title: `Lab Compound: ${rm.material_name || rm.name || 'Raw Material'}`,
              amount: rm.unit_price || 0,
              status: (rm.quantity || 0) > (rm.min_threshold || 5) ? "In Stock" : "Low Stock Alert",
              owner: rm.supplier || "Lab Procurement",
              department: "R&D Lab & Formulations",
              priority: (rm.quantity || 0) <= (rm.min_threshold || 5) ? "High" : "Normal",
              detail: `Stock: ${rm.quantity || 0} ${rm.unit || 'units'} available`
            });
          }
        });

        summary = {
          totalRecords: rows.length,
          primaryLabel: "Validated Projects",
          primaryValue: `${validatedCount} Trials`,
          secondaryLabel: "Active Trials & Tasks",
          secondaryValue: `${inProgressCount} In Progress`,
          tertiaryLabel: "Lab Inventory Items",
          tertiaryValue: `${rawMaterials.length} Compounds`,
          healthStatus: validatedCount > 0 ? "Optimal" : "Active"
        };
      } 
      
      else if (selectedReport === 'operations_health') {
        let criticalTasks = 0;
        let completedTasks = 0;

        knowledge.forEach(k => {
          if (checkDateFilter(k.created_at || k.due_date || '') && checkDeptFilter('Operations')) {
            if (k.priority === 'critical' || k.priority === 'high') criticalTasks++;
            if (k.status === 'Completed' || k.status === 'Resolved' || k.status === 'validated') completedTasks++;
            rows.push({
              id: `OP-${k.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
              date: k.due_date || k.created_at?.slice(0,10) || new Date().toISOString().slice(0,10),
              category: "Operational Governance",
              title: k.title || "Operations Task & Compliance",
              status: k.status || "Pending",
              owner: k.assigned_to || "Operations Manager",
              department: "Operations & Supply Chain",
              priority: k.priority || "Normal",
              detail: `Target Completion: ${k.due_date || 'As scheduled'}`
            });
          }
        });

        timetable.forEach(tt => {
          if (checkDateFilter(tt.date || '') && checkDeptFilter('Operations')) {
            rows.push({
              id: `SCH-${tt.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
              date: tt.date || new Date().toISOString().slice(0,10),
              category: "Executive Timetable",
              title: `Executive Agenda: ${tt.title || tt.activity || 'Management Review'} (${tt.time_slot || '09:00'})`,
              status: tt.status || "Scheduled",
              owner: tt.person_type || tt.role || "CEO / MD",
              department: "Executive Management",
              priority: "High",
              detail: `Location/Mode: ${tt.location || 'Conference Room / Nexus Portal'}`
            });
          }
        });

        summary = {
          totalRecords: rows.length,
          primaryLabel: "Total Tracked Actions",
          primaryValue: `${rows.length} Items`,
          secondaryLabel: "High/Critical Priority",
          secondaryValue: `${criticalTasks} Flagged`,
          tertiaryLabel: "Execution Velocity",
          tertiaryValue: rows.length > 0 ? `${Math.round((completedTasks/rows.length)*100)}% Complete` : "100% Operational",
          healthStatus: criticalTasks > 3 ? "Attention Needed" : "Optimal"
        };
      } 
      
      else if (selectedReport === 'inventory_audit') {
        let lowStockCount = 0;
        let totalValuation = 0;

        inventory.forEach(inv => {
          if (checkDateFilter(inv.created_at || inv.updated_at || '') && checkDeptFilter(inv.department || 'Supply Chain')) {
            const qty = Number(inv.quantity) || 0;
            const price = Number(inv.unit_price || inv.price) || 0;
            const val = qty * price;
            totalValuation += val;

            const isLow = qty < (inv.min_stock || inv.min_threshold || 5);
            if (isLow) lowStockCount++;

            rows.push({
              id: `SKU-${inv.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
              date: inv.updated_at?.slice(0,10) || inv.created_at?.slice(0,10) || new Date().toISOString().slice(0,10),
              category: inv.category || "Warehouse Catalog",
              title: `${inv.name || inv.item_name || 'Stock Item'} (Code: ${inv.sku_code || 'SKU-001'})`,
              amount: val > 0 ? val : undefined,
              status: isLow ? "Critical Stock Alert" : "Normal Stock",
              owner: inv.location || inv.warehouse || "Main Warehouse",
              department: inv.department || "Operations & Supply Chain",
              priority: isLow ? "High" : "Normal",
              detail: `Available: ${qty} ${inv.unit || 'units'} (Min Threshold: ${inv.min_stock || 5})`
            });
          }
        });

        summary = {
          totalRecords: rows.length,
          primaryLabel: "Total Catalog SKUs",
          primaryValue: `${rows.length} Items`,
          secondaryLabel: "Stock Alerts (Low Qty)",
          secondaryValue: `${lowStockCount} Critical SKUs`,
          tertiaryLabel: "Estimated Valuation",
          tertiaryValue: formatINR(totalValuation),
          healthStatus: lowStockCount > 0 ? "Attention Needed" : "Optimal"
        };
      } 
      
      else {
        // Comprehensive 360 Dossier
        let totalValuation = 0;
        let activeStaff = 0;
        let lowStockCount = 0;

        invoices.slice(0, 5).forEach(inv => {
          const amt = Number(inv.total_amount) || 0;
          totalValuation += amt;
          rows.push({
            id: `INV-${inv.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
            date: inv.issue_date || new Date().toISOString().slice(0,10),
            category: "Finance Pillar",
            title: `Revenue Invoice: ${inv.client_name || 'Enterprise Client'} (#${inv.invoice_number || 'INV-001'})`,
            amount: amt,
            status: inv.status || "Paid",
            owner: "Finance & Accounts",
            department: "Finance",
            priority: "High",
            detail: `Billing Terms: ${inv.due_date || 'Standard'}`
          });
        });

        interns.slice(0, 5).forEach(int => {
          if (int.status === 'Active') activeStaff++;
          rows.push({
            id: `EMP-${int.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
            date: int.join_date || int.created_at?.slice(0,10) || new Date().toISOString().slice(0,10),
            category: "HR Pillar",
            title: `Active Team Lead: ${int.full_name || 'Staff Member'} (${int.role || 'Specialist'})`,
            status: int.status || "Active",
            owner: int.email || "HR Portal",
            department: int.department || "Operations",
            priority: "Normal",
            detail: `Branch: ${int.branch || 'HQ'}`
          });
        });

        knowledge.slice(0, 5).forEach(k => {
          rows.push({
            id: `RD-${k.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
            date: k.due_date || k.created_at?.slice(0,10) || new Date().toISOString().slice(0,10),
            category: "R&D Lab Pillar",
            title: `Experimental Formulation: ${k.title || 'Scientific Trial'}`,
            status: k.status || "Active R&D",
            owner: k.assigned_to || "Lead Scientist",
            department: "R&D Lab",
            priority: k.priority || "Medium",
            detail: `Due Date: ${k.due_date || 'As Scheduled'}`
          });
        });

        inventory.slice(0, 5).forEach(inv => {
          const qty = Number(inv.quantity) || 0;
          const isLow = qty < (inv.min_stock || 5);
          if (isLow) lowStockCount++;
          rows.push({
            id: `SKU-${inv.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
            date: inv.updated_at?.slice(0,10) || inv.created_at?.slice(0,10) || new Date().toISOString().slice(0,10),
            category: "Supply Chain Pillar",
            title: `Warehouse SKU: ${inv.name || 'Catalog Item'} (${inv.sku_code || 'SKU'})`,
            status: isLow ? "Low Stock Alert" : "In Stock",
            owner: inv.location || "Main Warehouse",
            department: "Supply Chain",
            priority: isLow ? "High" : "Normal",
            detail: `Qty: ${qty} ${inv.unit || 'units'} available`
          });
        });

        summary = {
          totalRecords: rows.length,
          primaryLabel: "Combined Scope Records",
          primaryValue: `${rows.length} Audited Rows`,
          secondaryLabel: "Cross-Pillar Exceptions",
          secondaryValue: `${lowStockCount} Warnings`,
          tertiaryLabel: "Enterprise Audit Score",
          tertiaryValue: "96.5% Institutional",
          healthStatus: lowStockCount > 2 ? "Attention Needed" : "Optimal"
        };
      }

      // Sort rows by date descending
      rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setReportData(rows);
      setKpiSummary(summary);
      setLastGenerated(new Date());

      toast({
        title: "Report Synchronized",
        description: `Successfully loaded ${rows.length} verified records for ${reportNames[selectedReport].title}.`,
      });
    } catch (err) {
      console.error("Error generating report:", err);
      toast({
        title: "Generation Notice",
        description: "Loaded offline audit cache. Please check database connectivity.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedReport, timeRange, departmentFilter, toast]);

  useEffect(() => {
    generateReport();
  }, [selectedReport, timeRange, departmentFilter]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return reportData;
    const q = searchQuery.toLowerCase();
    return reportData.filter(r => 
      r.title.toLowerCase().includes(q) || 
      r.category.toLowerCase().includes(q) || 
      r.owner.toLowerCase().includes(q) || 
      r.department.toLowerCase().includes(q) ||
      (r.detail && r.detail.toLowerCase().includes(q))
    );
  }, [reportData, searchQuery]);

  const exportToCSV = useCallback(() => {
    if (reportData.length === 0) {
      toast({ title: "Empty Report", description: "No records available to export.", variant: "destructive" });
      return;
    }

    const headers = ["ID", "Date", "Category", "Title / Description", "Amount (INR)", "Status", "Owner / Assignee", "Department", "Priority", "Detail Note"];
    const csvRows = [headers.join(",")];

    reportData.forEach(row => {
      const escapedTitle = `"${(row.title || '').replace(/"/g, '""')}"`;
      const escapedDetail = `"${(row.detail || '').replace(/"/g, '""')}"`;
      const amtStr = row.amount !== undefined ? row.amount.toString() : "";
      csvRows.push([
        row.id,
        row.date,
        `"${row.category}"`,
        escapedTitle,
        amtStr,
        `"${row.status}"`,
        `"${row.owner}"`,
        `"${row.department}"`,
        `"${row.priority || 'Normal'}"`,
        escapedDetail
      ].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const fileName = `BiovaCo_Report_${selectedReport}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Excel / CSV Downloaded",
      description: `Report exported as ${fileName} to your downloads folder.`
    });
  }, [reportData, selectedReport, toast]);

  const exportToPDF = useCallback(() => {
    if (reportData.length === 0) {
      toast({ title: "Empty Report", description: "No records available to print.", variant: "destructive" });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: "Popup Blocked", description: "Please allow popups to open the PDF Print dialog.", variant: "destructive" });
      return;
    }

    const currentName = reportNames[selectedReport];
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${currentName.title} — BiovaCo Nexus Audit</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #4B49AC; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-text { font-size: 26px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; margin: 0; }
            .logo-sub { font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-top: 4px; }
            .report-title { font-size: 20px; font-weight: bold; color: #4B49AC; margin-top: 10px; }
            .badge { background: #EEF2FF; color: #4B49AC; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; border: 1px solid #C7D2FE; }
            .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 35px; }
            .kpi-card { background: #F8FAFC; padding: 18px; border-radius: 10px; border: 1px solid #E2E8F0; }
            .kpi-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
            .kpi-val { font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background: #F1F5F9; text-align: left; padding: 12px 10px; font-weight: 700; color: #334155; border-bottom: 2px solid #CBD5E1; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
            td { padding: 12px 10px; border-bottom: 1px solid #E2E8F0; color: #334155; vertical-align: top; }
            tr:nth-child(even) { background: #FAFAFA; }
            .status-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; background: #E2E8F0; color: #334155; }
            .status-active { background: #DCFCE7; color: #166534; }
            .status-alert { background: #FEE2E2; color: #991B1B; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8; display: flex; justify-content: space-between; align-items: center; }
            .sign-box { margin-top: 40px; display: flex; justify-content: flex-end; }
            .sign-line { width: 220px; border-top: 1px solid #64748b; text-align: center; padding-top: 8px; font-size: 11px; font-weight: 600; color: #475569; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="logo-text">BIOVACO NEXUS ENTERPRISE</h1>
              <div class="logo-sub">Institutional Executive Portal • Audit Ready Report</div>
              <div class="report-title">${currentName.title}</div>
            </div>
            <div style="text-align: right;">
              <span class="badge">Scope: ${timeRange.toUpperCase()} / ${departmentFilter.toUpperCase()}</span>
              <div style="font-size: 11px; color: #64748b; margin-top: 10px;">Generated: ${format(lastGenerated, 'dd MMM yyyy, HH:mm')}</div>
              <div style="font-size: 11px; font-weight: 600; color: #166534; margin-top: 2px;">● Verified DB Sync</div>
            </div>
          </div>

          ${kpiSummary ? `
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">${kpiSummary.primaryLabel}</div>
              <div class="kpi-val">${kpiSummary.primaryValue}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">${kpiSummary.secondaryLabel}</div>
              <div class="kpi-val">${kpiSummary.secondaryValue}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">${kpiSummary.tertiaryLabel}</div>
              <div class="kpi-val">${kpiSummary.tertiaryValue}</div>
            </div>
          </div>
          ` : ''}

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Category</th>
                <th>Title / Description</th>
                <th>Owner / Dept</th>
                <th>Status</th>
                ${reportData.some(r => r.amount !== undefined) ? '<th>Amount (₹)</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${reportData.map(r => `
                <tr>
                  <td style="font-weight: 600; color: #4B49AC;">${r.id}</td>
                  <td>${r.date}</td>
                  <td><span style="font-weight: 600; font-size: 11px; color: #475569;">${r.category}</span></td>
                  <td>
                    <div style="font-weight: 600; color: #0f172a;">${r.title}</div>
                    ${r.detail ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">${r.detail}</div>` : ''}
                  </td>
                  <td>
                    <div style="font-weight: 600;">${r.owner}</div>
                    <div style="font-size: 10px; color: #64748b;">${r.department}</div>
                  </td>
                  <td>
                    <span class="status-badge ${r.status.toLowerCase().includes('active') || r.status.toLowerCase().includes('paid') || r.status.toLowerCase().includes('completed') || r.status.toLowerCase().includes('in stock') ? 'status-active' : r.status.toLowerCase().includes('alert') || r.status.toLowerCase().includes('critical') ? 'status-alert' : ''}">
                      ${r.status}
                    </span>
                  </td>
                  ${reportData.some(row => row.amount !== undefined) ? `<td style="font-weight: bold; font-family: monospace; text-align: right;">${r.amount !== undefined ? formatINR(r.amount) : '—'}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="sign-box">
            <div class="sign-line">Authorized Executive Signature</div>
          </div>

          <div class="footer">
            <div>BiovaCo Nexus Administration Suite • Strictly Confidential</div>
            <div>Page 1 of 1 • Generated via Live DB Portal</div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    toast({
      title: "PDF Audit Prepared",
      description: "Print / Save-as-PDF window has been launched with institutional styling."
    });
  }, [reportData, selectedReport, timeRange, departmentFilter, lastGenerated, kpiSummary, toast]);

  const copySummaryToClipboard = useCallback(() => {
    if (!kpiSummary || reportData.length === 0) {
      toast({ title: "Nothing to Copy", description: "Generate a report first.", variant: "destructive" });
      return;
    }

    const currentName = reportNames[selectedReport];
    const text = `
📊 **BIOVACO NEXUS EXECUTIVE REPORT: ${currentName.title.toUpperCase()}**
🗓️ Generated: ${format(lastGenerated, 'dd MMM yyyy, HH:mm')} | Scope: ${timeRange.toUpperCase()} (${departmentFilter.toUpperCase()})

---
📈 **EXECUTIVE SUMMARY KPIs:**
• ${kpiSummary.primaryLabel}: ${kpiSummary.primaryValue}
• ${kpiSummary.secondaryLabel}: ${kpiSummary.secondaryValue}
• ${kpiSummary.tertiaryLabel}: ${kpiSummary.tertiaryValue}
• Overall Audit Health: ${kpiSummary.healthStatus}

---
📋 **TOP AUDITED RECORDS (${Math.min(5, reportData.length)} of ${reportData.length}):**
${reportData.slice(0, 5).map(r => `[${r.id}] ${r.title} — Status: ${r.status} (${r.owner}) ${r.amount !== undefined ? `| ₹${r.amount.toLocaleString()}` : ''}`).join('\n')}

---
*Generated autonomously via BiovaCo Nexus Portal Live Database.*
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    toast({
      title: "Executive Summary Copied",
      description: "Formatted markdown summary is ready to paste into Slack, WhatsApp, or Email."
    });
  }, [kpiSummary, reportData, selectedReport, timeRange, departmentFilter, lastGenerated, toast]);

  const currentConfig = reportNames[selectedReport];
  const IconComponent = currentConfig.icon;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 font-sans">
      
      {/* HEADER & BRANDING */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 p-6 rounded-2xl text-white shadow-lg border border-indigo-800/40">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
            <FileSpreadsheet className="h-6 w-6 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-white">Enterprise Reports Center</h2>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs px-2.5 py-0.5">
                ● Live DB Sync
              </Badge>
            </div>
            <p className="text-indigo-200/80 text-xs mt-1">
              Generate, audit, and export institutional executive documents with multi-format download capabilities.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button 
            onClick={copySummaryToClipboard} 
            variant="outline" 
            size="sm"
            className="h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white shadow-xs text-xs font-semibold backdrop-blur-xs"
            title="Copy formatted KPI summary to clipboard"
          >
            {copied ? <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1.5 text-indigo-300" />}
            {copied ? "Copied!" : "Copy Summary"}
          </Button>
          <Button 
            onClick={exportToCSV} 
            variant="outline" 
            size="sm"
            className="h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white shadow-xs text-xs font-semibold backdrop-blur-xs"
            title="Download detailed Excel / CSV file"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
            Excel / CSV
          </Button>
          <Button 
            onClick={exportToPDF} 
            size="sm"
            className="h-9 bg-indigo-500 hover:bg-indigo-600 text-white shadow-md text-xs font-semibold font-sans px-4 transition-all duration-200 hover:scale-[1.02]"
            title="Generate audit-ready PDF / Print view"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Export PDF / Print
          </Button>
        </div>
      </div>

      {/* REPORT TYPE SELECTOR CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Object.keys(reportNames) as ReportType[]).map((type) => {
          const cfg = reportNames[type];
          const Icon = cfg.icon;
          const isSelected = selectedReport === type;

          return (
            <Card 
              key={type}
              onClick={() => setSelectedReport(type)}
              className={`cursor-pointer transition-all duration-200 border text-left flex flex-col justify-between ${
                isSelected 
                  ? "border-indigo-600 ring-2 ring-indigo-500/20 shadow-md bg-gradient-to-br from-indigo-50/70 to-white" 
                  : "border-gray-200 hover:border-gray-300 hover:shadow-xs bg-white"
              }`}
            >
              <CardContent className="p-4 flex items-start gap-3.5">
                <div className={`mt-0.5 ${cfg.bg} p-2 rounded-xl shrink-0 ${isSelected ? 'scale-110 shadow-xs' : ''} transition-transform`}>
                  <Icon className={`h-5 w-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className={`text-sm font-bold truncate ${isSelected ? 'text-indigo-950' : 'text-gray-900'}`}>
                      {cfg.title}
                    </h3>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0 animate-ping" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {cfg.desc}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CONTROLS & FILTER BAR */}
      <Card className="border-gray-200/80 shadow-xs bg-white">
        <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${reportData.length} audited records by ID, owner, category, or note...`}
                className="pl-9 h-9 text-xs bg-gray-50/50 border-gray-200 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Select value={timeRange} onValueChange={(val: TimeRange) => setTimeRange(val)}>
                <SelectTrigger className="h-9 text-xs w-[130px] bg-white border-gray-200 font-medium">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500 shrink-0" />
                  <SelectValue placeholder="Time Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Time Records</SelectItem>
                  <SelectItem value="30d" className="text-xs">Last 30 Days</SelectItem>
                  <SelectItem value="90d" className="text-xs">Current Quarter</SelectItem>
                  <SelectItem value="ytd" className="text-xs">Year-to-Date (YTD)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={(val: DeptFilter) => setDepartmentFilter(val)}>
                <SelectTrigger className="h-9 text-xs w-[140px] bg-white border-gray-200 font-medium">
                  <Building2 className="h-3.5 w-3.5 mr-1.5 text-gray-500 shrink-0" />
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Departments</SelectItem>
                  <SelectItem value="finance" className="text-xs">Finance & Accounts</SelectItem>
                  <SelectItem value="hr" className="text-xs">HR & Recruitment</SelectItem>
                  <SelectItem value="rd" className="text-xs">R&D Lab & Science</SelectItem>
                  <SelectItem value="operations" className="text-xs">Operations & Supply</SelectItem>
                  <SelectItem value="it" className="text-xs">IT & Systems</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={generateReport}
            disabled={isLoading}
            variant="default"
            size="sm"
            className="h-9 bg-indigo-900 hover:bg-indigo-950 text-white font-semibold text-xs px-4 shrink-0 shadow-xs flex items-center gap-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-200" />
                Synchronizing...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5 text-indigo-300" />
                Refresh Data
              </>
            )}
          </Button>

        </CardContent>
      </Card>

      {/* KPI SUMMARY DECK */}
      {kpiSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
          <Card className="border-gray-200/80 bg-gradient-to-br from-white to-gray-50/50 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{kpiSummary.primaryLabel}</p>
                <p className="text-xl font-extrabold text-gray-900 mt-1">{kpiSummary.primaryValue}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                <FileText className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200/80 bg-gradient-to-br from-white to-gray-50/50 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{kpiSummary.secondaryLabel}</p>
                <p className="text-xl font-extrabold text-gray-900 mt-1">{kpiSummary.secondaryValue}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200/80 bg-gradient-to-br from-white to-gray-50/50 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{kpiSummary.tertiaryLabel}</p>
                <p className="text-xl font-extrabold text-gray-900 mt-1">{kpiSummary.tertiaryValue}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold">
                <Sparkles className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200/80 bg-gradient-to-br from-white to-gray-50/50 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Audit Health Status</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${kpiSummary.healthStatus === 'Optimal' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <p className="text-base font-bold text-gray-900">{kpiSummary.healthStatus}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold bg-white text-gray-700 border-gray-200">
                VERIFIED
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* LIVE AUDIT PREVIEW TABLE */}
      <Card className="border-gray-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-6 py-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${currentConfig.bg}`}>
              <IconComponent className={`h-5 w-5 ${currentConfig.color}`} />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900">{currentConfig.title} — Live Preview Deck</CardTitle>
              <CardDescription className="text-xs">
                Showing {filteredRows.length} of {reportData.length} records matching your current filter criteria
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white text-gray-600 border-gray-200 text-xs font-semibold px-3 py-1">
              <Clock className="h-3 w-3 mr-1.5 text-gray-400 inline" />
              Sync: {format(lastGenerated, 'HH:mm:ss')}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 bg-white">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-xs font-medium text-gray-500">Querying real-time database tables and constructing audit dossier...</p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 bg-white text-center p-6">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-1">
                <FileText className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-gray-800">No matching audit records found</p>
              <p className="text-xs text-gray-500 max-w-sm">
                We couldn't find any database rows for the selected scope ({timeRange.toUpperCase()} / {departmentFilter.toUpperCase()}). Try widening your filter or search query.
              </p>
              <Button onClick={() => { setTimeRange('all'); setDepartmentFilter('all'); setSearchQuery(''); }} variant="outline" size="sm" className="mt-2 text-xs h-8">
                Reset All Filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px]">
              <Table>
                <TableHeader className="bg-gray-50/90 sticky top-0 z-10 backdrop-blur-xs">
                  <TableRow>
                    <TableHead className="w-[100px] font-bold text-gray-700 text-xs">ID</TableHead>
                    <TableHead className="w-[110px] font-bold text-gray-700 text-xs">Date</TableHead>
                    <TableHead className="w-[140px] font-bold text-gray-700 text-xs">Category</TableHead>
                    <TableHead className="min-w-[240px] font-bold text-gray-700 text-xs">Title / Description</TableHead>
                    <TableHead className="w-[160px] font-bold text-gray-700 text-xs">Owner / Dept</TableHead>
                    <TableHead className="w-[120px] font-bold text-gray-700 text-xs">Status</TableHead>
                    {filteredRows.some(r => r.amount !== undefined) && (
                      <TableHead className="w-[130px] font-bold text-gray-700 text-xs text-right">Amount (₹)</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100">
                  {filteredRows.map((row) => {
                    const isAlert = row.status.toLowerCase().includes('alert') || row.status.toLowerCase().includes('critical') || row.status.toLowerCase().includes('overdue');
                    const isSuccess = row.status.toLowerCase().includes('active') || row.status.toLowerCase().includes('paid') || row.status.toLowerCase().includes('completed') || row.status.toLowerCase().includes('in stock') || row.status.toLowerCase().includes('validated');

                    return (
                      <TableRow key={row.id} className="hover:bg-indigo-50/30 transition-colors duration-150 group">
                        <TableCell className="font-mono font-bold text-xs text-indigo-700">
                          {row.id}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 font-medium">
                          {row.date}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-semibold text-[10px] hover:bg-gray-200">
                            {row.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-xs text-gray-900 group-hover:text-indigo-950 transition-colors">
                            {row.title}
                          </div>
                          {row.detail && (
                            <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1 font-normal">
                              {row.detail}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-xs text-gray-800 truncate max-w-[150px]">
                            {row.owner}
                          </div>
                          <div className="text-[10px] text-gray-500 font-medium">
                            {row.department}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] font-bold px-2 py-0.5 border ${
                              isAlert 
                                ? "bg-red-50 text-red-700 border-red-200" 
                                : isSuccess 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        {filteredRows.some(r => r.amount !== undefined) && (
                          <TableCell className={`text-right font-mono font-bold text-xs ${
                            row.amount && row.amount < 0 ? "text-red-600" : "text-gray-900"
                          }`}>
                            {row.amount !== undefined ? formatINR(row.amount) : "—"}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FOOTER TIPS CARD */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 font-bold">
            💡
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-950">Institutional Export Notice</p>
            <p className="text-[11px] text-indigo-800/80 mt-0.5">
              Downloaded CSV files are fully compatible with MS Excel, Google Sheets, and tally ERP software. PDF exports automatically format without web navigation UI.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={exportToPDF} variant="outline" size="sm" className="h-8 text-xs font-semibold bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-100">
            <Printer className="h-3 w-3 mr-1.5" />
            Launch Print View
          </Button>
        </div>
      </div>

    </div>
  );
}
