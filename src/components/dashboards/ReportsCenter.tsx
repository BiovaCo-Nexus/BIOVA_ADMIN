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
  FileText, Download, Printer, Copy, RefreshCw, Calendar, 
  Building2, TrendingUp, Users, Briefcase, AlertTriangle, CheckCircle2, 
  Search, Loader2, Sparkles, Check, IndianRupee, BarChart3, Layers, Clock, Package
} from "lucide-react"
import { format, parseISO, subDays, startOfYear, isAfter } from "date-fns"

type ReportType = 'comprehensive' | 'financial' | 'hr' | 'rd' | 'operations' | 'inventory';
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
  detail?: string;
}

interface KpiSummary {
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  tertiaryLabel: string;
  tertiaryValue: string;
  status: 'Normal' | 'Needs Attention' | 'Optimal';
}

export function ReportsCenter() {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<ReportType>('comprehensive');
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

  const reportConfigs: Record<ReportType, { title: string; desc: string; icon: any; color: string; bg: string }> = {
    comprehensive: {
      title: "All Departments Summary",
      desc: "Combined summary of key records across Finance, HR, R&D, Operations, and Inventory.",
      icon: Briefcase,
      color: "text-[#4B49AC]",
      bg: "bg-indigo-50"
    },
    financial: {
      title: "Finance & Revenue Report",
      desc: "Client invoices, revenue inflows, operating expenses, and net profit calculations.",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    hr: {
      title: "HR & Staff Roster",
      desc: "Active staff members, candidate recruitment applications, and team role distribution.",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    rd: {
      title: "R&D Lab Report",
      desc: "Completed scientific trials, ongoing research projects, and lab raw material stock.",
      icon: Sparkles,
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    operations: {
      title: "Operations & Tasks Report",
      desc: "Department task tracking, high priority pending actions, and executive schedules.",
      icon: BarChart3,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    inventory: {
      title: "Warehouse & Stock Report",
      desc: "All catalog SKUs, current stock quantities, valuation, and low stock warnings.",
      icon: Package,
      color: "text-teal-600",
      bg: "bg-teal-50"
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
      const [expRes, invcRes, intRes, appRes, invRes, rdRes, timetableRes, rawMatRes] = await Promise.all([
        supabase.from('expense_records').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('interns').select('*'),
        supabase.from('job_applications').select('*'),
        supabase.from('inventory_items').select('*'),
        supabase.from('knowledge_items').select('*'),
        supabase.from('ceo_md_timetable').select('*'),
        supabase.from('rd_raw_materials').select('*')
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
        primaryLabel: "Total Records",
        primaryValue: "0",
        secondaryLabel: "Status",
        secondaryValue: "Normal",
        tertiaryLabel: "Coverage",
        tertiaryValue: "100%",
        status: "Normal"
      };

      if (selectedReport === 'financial') {
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
              title: `Invoice #${inv.invoice_number || '001'} (${inv.client_name || 'Client'})`,
              amount: amt,
              status: inv.status || "Paid",
              owner: inv.client_name || "Finance",
              department: "Finance & Accounts",
              detail: `Due Date: ${inv.due_date || 'Standard'}`
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
              category: "Direct Revenue",
              title: rev.description || rev.title || "Revenue Inflow",
              amount: amt,
              status: "Completed",
              owner: rev.paid_by_name || "Finance",
              department: "Finance & Accounts",
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
              category: "Operating Expense",
              title: exp.description || exp.title || "Expense Record",
              amount: -amt,
              status: exp.reimbursement_status || "Approved",
              owner: exp.paid_by_name || "Operations",
              department: "Finance & Accounts",
              detail: `Category: ${exp.category || 'General Office'}`
            });
          }
        });

        const netProfit = totalRev - totalExp;
        summary = {
          primaryLabel: "Total Revenue",
          primaryValue: formatINR(totalRev),
          secondaryLabel: "Total Expenses",
          secondaryValue: formatINR(totalExp),
          tertiaryLabel: "Net Profit",
          tertiaryValue: formatINR(netProfit),
          status: netProfit >= 0 ? "Optimal" : "Needs Attention"
        };
      } 
      
      else if (selectedReport === 'hr') {
        let activeStaff = 0;
        let pendingApps = 0;

        interns.forEach(int => {
          if (checkDateFilter(int.created_at || int.join_date || '') && checkDeptFilter(int.department || 'HR')) {
            if (int.status === 'Active') activeStaff++;
            rows.push({
              id: `EMP-${int.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
              date: int.join_date || int.created_at?.slice(0,10) || new Date().toISOString().slice(0,10),
              category: "Team Member",
              title: `${int.full_name || 'Staff Member'} (${int.role || 'Specialist'})`,
              status: int.status || "Active",
              owner: int.email || "staff@biovaco.in",
              department: int.department || "Operations",
              detail: `Branch: ${int.branch || 'HQ Office'}`
            });
          }
        });

        applications.forEach(app => {
          if (checkDateFilter(app.created_at || '') && checkDeptFilter(app.department || 'HR')) {
            if (app.status === 'New' || app.status === 'Pending') pendingApps++;
            rows.push({
              id: `APP-${app.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
              date: app.created_at?.slice(0,10) || new Date().toISOString().slice(0,10),
              category: "Job Application",
              title: `Applicant: ${app.full_name || 'Candidate'}`,
              status: app.status || "Pending Review",
              owner: app.email || app.phone || "HR Screening",
              department: app.department || "HR & Recruitment",
              detail: `Applied for: ${app.position_applied || app.role || 'Role'} • ${app.experience_years || 0} yrs exp`
            });
          }
        });

        summary = {
          primaryLabel: "Active Team Members",
          primaryValue: `${activeStaff} Members`,
          secondaryLabel: "Pending Applications",
          secondaryValue: `${pendingApps} Applicants`,
          tertiaryLabel: "Total Tracked Roster",
          tertiaryValue: `${rows.length} Records`,
          status: "Normal"
        };
      } 
      
      else if (selectedReport === 'rd') {
        let validatedCount = 0;
        let inProgressCount = 0;

        knowledge.forEach(k => {
          if (checkDateFilter(k.created_at || k.due_date || '') && checkDeptFilter('R&D Lab')) {
            if (k.status === 'validated' || k.status === 'Completed') validatedCount++;
            else inProgressCount++;
            rows.push({
              id: `RD-${k.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
              date: k.due_date || k.created_at?.slice(0,10) || new Date().toISOString().slice(0,10),
              category: "Research Project",
              title: k.title || "Experimental Formulation",
              status: k.status || "In Progress",
              owner: k.assigned_to || "Lead Scientist",
              department: "R&D Lab & Formulations",
              detail: `Category: ${k.category || 'Formulation'}`
            });
          }
        });

        rawMaterials.forEach(rm => {
          if (checkDateFilter(rm.updated_at || rm.created_at || '') && checkDeptFilter('R&D Lab')) {
            const isLow = (rm.quantity || 0) <= (rm.min_threshold || 5);
            rows.push({
              id: `MAT-${rm.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
              date: rm.updated_at?.slice(0,10) || rm.created_at?.slice(0,10) || new Date().toISOString().slice(0,10),
              category: "Lab Raw Material",
              title: `${rm.material_name || rm.name || 'Material'}`,
              amount: rm.unit_price || 0,
              status: isLow ? "Low Stock Alert" : "In Stock",
              owner: rm.supplier || "Lab Supply",
              department: "R&D Lab & Formulations",
              detail: `Stock: ${rm.quantity || 0} ${rm.unit || 'units'}`
            });
          }
        });

        summary = {
          primaryLabel: "Validated Projects",
          primaryValue: `${validatedCount} Completed`,
          secondaryLabel: "Ongoing Research",
          secondaryValue: `${inProgressCount} Active`,
          tertiaryLabel: "Lab Materials",
          tertiaryValue: `${rawMaterials.length} Items`,
          status: "Normal"
        };
      } 
      
      else if (selectedReport === 'operations') {
        let criticalTasks = 0;

        knowledge.forEach(k => {
          if (checkDateFilter(k.created_at || k.due_date || '') && checkDeptFilter('Operations')) {
            if (k.priority === 'critical' || k.priority === 'high') criticalTasks++;
            rows.push({
              id: `OP-${k.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
              date: k.due_date || k.created_at?.slice(0,10) || new Date().toISOString().slice(0,10),
              category: "Operations Task",
              title: k.title || "Operations Activity",
              status: k.status || "Pending",
              owner: k.assigned_to || "Operations Lead",
              department: "Operations & Supply",
              detail: `Target Date: ${k.due_date || 'Scheduled'}`
            });
          }
        });

        timetable.forEach(tt => {
          if (checkDateFilter(tt.date || '') && checkDeptFilter('Operations')) {
            rows.push({
              id: `SCH-${tt.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
              date: tt.date || new Date().toISOString().slice(0,10),
              category: "Executive Schedule",
              title: `${tt.title || tt.activity || 'Review Meeting'} (${tt.time_slot || '09:00'})`,
              status: tt.status || "Scheduled",
              owner: tt.person_type || tt.role || "CEO / MD",
              department: "Executive Management",
              detail: `Location: ${tt.location || 'HQ Office'}`
            });
          }
        });

        summary = {
          primaryLabel: "Total Tracked Actions",
          primaryValue: `${rows.length} Tasks`,
          secondaryLabel: "High/Critical Priority",
          secondaryValue: `${criticalTasks} Flagged`,
          tertiaryLabel: "Schedule Adherence",
          tertiaryValue: "On Track",
          status: criticalTasks > 3 ? "Needs Attention" : "Normal"
        };
      } 
      
      else if (selectedReport === 'inventory') {
        let lowStockCount = 0;
        let totalValuation = 0;

        inventory.forEach(inv => {
          if (checkDateFilter(inv.created_at || inv.updated_at || '') && checkDeptFilter(inv.department || 'Operations')) {
            const qty = Number(inv.quantity) || 0;
            const price = Number(inv.unit_price || inv.price) || 0;
            const val = qty * price;
            totalValuation += val;

            const isLow = qty < (inv.min_stock || inv.min_threshold || 5);
            if (isLow) lowStockCount++;

            rows.push({
              id: `SKU-${inv.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
              date: inv.updated_at?.slice(0,10) || inv.created_at?.slice(0,10) || new Date().toISOString().slice(0,10),
              category: inv.category || "Inventory Item",
              title: `${inv.name || inv.item_name || 'Stock Item'} (${inv.sku_code || 'SKU'})`,
              amount: val > 0 ? val : undefined,
              status: isLow ? "Low Stock Warning" : "In Stock",
              owner: inv.location || inv.warehouse || "Warehouse",
              department: inv.department || "Operations & Supply",
              detail: `Available: ${qty} ${inv.unit || 'units'} (Min: ${inv.min_stock || 5})`
            });
          }
        });

        summary = {
          primaryLabel: "Total Catalog Items",
          primaryValue: `${rows.length} SKUs`,
          secondaryLabel: "Low Stock Warnings",
          secondaryValue: `${lowStockCount} Items`,
          tertiaryLabel: "Estimated Stock Value",
          tertiaryValue: formatINR(totalValuation),
          status: lowStockCount > 0 ? "Needs Attention" : "Optimal"
        };
      } 
      
      else {
        // All Departments Summary (comprehensive)
        let lowStockCount = 0;

        invoices.slice(0, 4).forEach(inv => {
          rows.push({
            id: `INV-${inv.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
            date: inv.issue_date || new Date().toISOString().slice(0,10),
            category: "Finance",
            title: `Client Invoice: ${inv.client_name || 'Client'} (#${inv.invoice_number || '001'})`,
            amount: Number(inv.total_amount) || 0,
            status: inv.status || "Paid",
            owner: "Finance Team",
            department: "Finance & Accounts",
            detail: `Due: ${inv.due_date || 'Standard'}`
          });
        });

        interns.slice(0, 4).forEach(int => {
          rows.push({
            id: `EMP-${int.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
            date: int.join_date || int.created_at?.slice(0,10) || new Date().toISOString().slice(0,10),
            category: "HR & Staff",
            title: `Team Member: ${int.full_name || 'Staff'} (${int.role || 'Specialist'})`,
            status: int.status || "Active",
            owner: int.email || "HR",
            department: int.department || "Operations",
            detail: `Branch: ${int.branch || 'HQ'}`
          });
        });

        knowledge.slice(0, 4).forEach(k => {
          rows.push({
            id: `RD-${k.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
            date: k.due_date || k.created_at?.slice(0,10) || new Date().toISOString().slice(0,10),
            category: "R&D Lab",
            title: `Research Trial: ${k.title || 'Project'}`,
            status: k.status || "Active",
            owner: k.assigned_to || "Scientist",
            department: "R&D Lab & Formulations",
            detail: `Category: ${k.category || 'Formulation'}`
          });
        });

        inventory.slice(0, 4).forEach(inv => {
          const qty = Number(inv.quantity) || 0;
          const isLow = qty < (inv.min_stock || 5);
          if (isLow) lowStockCount++;
          rows.push({
            id: `SKU-${inv.id?.slice(0,6) || Math.random().toString(36).slice(2,8)}`,
            date: inv.updated_at?.slice(0,10) || inv.created_at?.slice(0,10) || new Date().toISOString().slice(0,10),
            category: "Warehouse Stock",
            title: `Inventory Item: ${inv.name || 'SKU Item'}`,
            status: isLow ? "Low Stock Warning" : "In Stock",
            owner: inv.location || "Warehouse",
            department: "Operations & Supply",
            detail: `Qty: ${qty} ${inv.unit || 'units'}`
          });
        });

        summary = {
          primaryLabel: "Combined Records",
          primaryValue: `${rows.length} Items`,
          secondaryLabel: "Low Stock Alerts",
          secondaryValue: `${lowStockCount} Items`,
          tertiaryLabel: "Departments Covered",
          tertiaryValue: "5 Departments",
          status: lowStockCount > 2 ? "Needs Attention" : "Optimal"
        };
      }

      // Sort rows by date descending
      rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setReportData(rows);
      setKpiSummary(summary);
      setLastGenerated(new Date());

    } catch (err) {
      console.error("Error generating report:", err);
      toast({
        title: "Database Notice",
        description: "Showing offline report records.",
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
      toast({ title: "No Data", description: "No records available to download.", variant: "destructive" });
      return;
    }

    const headers = ["ID", "Date", "Category", "Title", "Amount (INR)", "Status", "Owner", "Department", "Notes"];
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
      description: `Saved as ${fileName} to your downloads folder.`
    });
  }, [reportData, selectedReport, toast]);

  const exportToPDF = useCallback(() => {
    if (reportData.length === 0) {
      toast({ title: "No Data", description: "No records available to print.", variant: "destructive" });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: "Popup Blocked", description: "Please allow popups to open the PDF Print dialog.", variant: "destructive" });
      return;
    }

    const currentName = reportConfigs[selectedReport];
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${currentName.title} — BiovaCo Nexus</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #4B49AC; padding-bottom: 16px; margin-bottom: 24px; }
            .logo-text { font-size: 22px; font-weight: 700; color: #111827; margin: 0; }
            .report-title { font-size: 18px; font-weight: 600; color: #4B49AC; margin-top: 6px; }
            .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
            .kpi-card { background: #f9fafb; padding: 14px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .kpi-label { font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
            .kpi-val { font-size: 18px; font-weight: 700; color: #111827; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; padding: 10px 8px; font-weight: 600; color: #374151; border-bottom: 2px solid #d1d5db; }
            td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; color: #374151; vertical-align: top; }
            tr:nth-child(even) { background: #f9fafb; }
            .status-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; background: #e5e7eb; color: #374151; }
            .status-active { background: #dcfce7; color: #166534; }
            .status-alert { background: #fee2e2; color: #991b1b; }
            .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; display: flex; justify-content: space-between; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="logo-text">BIOVACO NEXUS — BUSINESS REPORT</h1>
              <div class="report-title">${currentName.title}</div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #6b7280;">
              <div>Scope: ${timeRange.toUpperCase()} | Dept: ${departmentFilter.toUpperCase()}</div>
              <div>Date: ${format(lastGenerated, 'dd MMM yyyy, HH:mm')}</div>
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
                <th>Title & Description</th>
                <th>Owner / Dept</th>
                <th>Status</th>
                ${reportData.some(r => r.amount !== undefined) ? '<th style="text-align: right;">Amount (₹)</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${reportData.map(r => `
                <tr>
                  <td style="font-weight: 600; color: #4B49AC;">${r.id}</td>
                  <td>${r.date}</td>
                  <td>${r.category}</td>
                  <td>
                    <div style="font-weight: 600; color: #111827;">${r.title}</div>
                    ${r.detail ? `<div style="font-size: 11px; color: #6b7280; margin-top: 2px;">${r.detail}</div>` : ''}
                  </td>
                  <td>
                    <div>${r.owner}</div>
                    <div style="font-size: 11px; color: #6b7280;">${r.department}</div>
                  </td>
                  <td>
                    <span class="status-badge ${r.status.toLowerCase().includes('active') || r.status.toLowerCase().includes('paid') || r.status.toLowerCase().includes('completed') || r.status.toLowerCase().includes('in stock') ? 'status-active' : r.status.toLowerCase().includes('alert') || r.status.toLowerCase().includes('warning') ? 'status-alert' : ''}">
                      ${r.status}
                    </span>
                  </td>
                  ${reportData.some(row => row.amount !== undefined) ? `<td style="font-weight: 600; text-align: right;">${r.amount !== undefined ? formatINR(r.amount) : '—'}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <div>BiovaCo Nexus Administration Portal</div>
            <div>Generated from Real Business Records</div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 300);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    toast({
      title: "Print View Prepared",
      description: "PDF / Print window launched successfully."
    });
  }, [reportData, selectedReport, timeRange, departmentFilter, lastGenerated, kpiSummary, toast]);

  const copySummaryToClipboard = useCallback(() => {
    if (!kpiSummary || reportData.length === 0) {
      toast({ title: "No Data", description: "Generate a report first.", variant: "destructive" });
      return;
    }

    const currentName = reportConfigs[selectedReport];
    const text = `
📊 **BIOVACO REPORT: ${currentName.title.toUpperCase()}**
🗓️ Date: ${format(lastGenerated, 'dd MMM yyyy, HH:mm')} | Filter: ${timeRange.toUpperCase()} (${departmentFilter.toUpperCase()})

---
📈 **SUMMARY STATISTICS:**
• ${kpiSummary.primaryLabel}: ${kpiSummary.primaryValue}
• ${kpiSummary.secondaryLabel}: ${kpiSummary.secondaryValue}
• ${kpiSummary.tertiaryLabel}: ${kpiSummary.tertiaryValue}

---
📋 **KEY RECORDS (${Math.min(5, reportData.length)} of ${reportData.length}):**
${reportData.slice(0, 5).map(r => `• [${r.id}] ${r.title} — ${r.status} (${r.owner}) ${r.amount !== undefined ? `| ₹${r.amount.toLocaleString()}` : ''}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    toast({
      title: "Summary Copied",
      description: "Report summary copied to clipboard."
    });
  }, [kpiSummary, reportData, selectedReport, timeRange, departmentFilter, lastGenerated, toast]);

  const currentConfig = reportConfigs[selectedReport];
  const IconComponent = currentConfig.icon;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 font-sans">
      
      {/* CLEAN CONSISTENT HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#4B49AC]" /> Reports Center
          </h1>
          <p className="text-sm text-gray-500">Generate, view, and download real business reports</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button 
            onClick={copySummaryToClipboard} 
            variant="outline" 
            size="sm"
            className="text-gray-700 border-gray-200 hover:bg-gray-50"
            title="Copy summary to clipboard"
          >
            {copied ? <Check className="h-4 w-4 mr-1.5 text-green-600" /> : <Copy className="h-4 w-4 mr-1.5 text-gray-500" />}
            {copied ? "Copied" : "Copy Summary"}
          </Button>
          <Button 
            onClick={exportToCSV} 
            variant="outline" 
            size="sm"
            className="text-gray-700 border-gray-200 hover:bg-gray-50"
            title="Download Excel / CSV file"
          >
            <Download className="h-4 w-4 mr-1.5 text-gray-500" />
            Excel / CSV
          </Button>
          <Button 
            onClick={exportToPDF} 
            size="sm"
            className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white shadow-sm"
            title="Open PDF / Print document"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            Export PDF / Print
          </Button>
        </div>
      </div>

      {/* REPORT TYPE SELECTOR CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Object.keys(reportConfigs) as ReportType[]).map((type) => {
          const cfg = reportConfigs[type];
          const Icon = cfg.icon;
          const isSelected = selectedReport === type;

          return (
            <Card 
              key={type}
              onClick={() => setSelectedReport(type)}
              className={`cursor-pointer transition-all duration-200 border text-left flex flex-col justify-between ${
                isSelected 
                  ? "border-[#4B49AC] ring-1 ring-[#4B49AC]/20 shadow-sm bg-indigo-50/20" 
                  : "border-gray-200 hover:border-gray-300 hover:shadow-xs bg-white"
              }`}
            >
              <CardContent className="p-4 flex items-start gap-3.5">
                <div className={`mt-0.5 ${cfg.bg} p-2 rounded-lg shrink-0`}>
                  <Icon className={`h-5 w-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className={`text-sm font-bold truncate ${isSelected ? 'text-[#4B49AC]' : 'text-gray-900'}`}>
                      {cfg.title}
                    </h3>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-[#4B49AC] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {cfg.desc}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FILTER BAR & SEARCH */}
      <Card className="border-gray-100 shadow-sm bg-white">
        <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search report records by title, owner, category, or notes..."
                className="pl-9 h-9 text-xs bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Select value={timeRange} onValueChange={(val: TimeRange) => setTimeRange(val)}>
                <SelectTrigger className="h-9 text-xs w-[130px] bg-white border-gray-200 font-medium">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500 shrink-0" />
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Time</SelectItem>
                  <SelectItem value="30d" className="text-xs">Last 30 Days</SelectItem>
                  <SelectItem value="90d" className="text-xs">Last 90 Days</SelectItem>
                  <SelectItem value="ytd" className="text-xs">This Year (YTD)</SelectItem>
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
            className="h-9 bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-semibold text-xs px-4 shrink-0 shadow-xs flex items-center gap-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* KPI SUMMARY DECK */}
      {kpiSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-gray-100 shadow-sm bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{kpiSummary.primaryLabel}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{kpiSummary.primaryValue}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-[#4B49AC] font-bold">
                <FileText className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{kpiSummary.secondaryLabel}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{kpiSummary.secondaryValue}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{kpiSummary.tertiaryLabel}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{kpiSummary.tertiaryValue}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* DATA PREVIEW TABLE */}
      <Card className="border-gray-100 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-6 py-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${currentConfig.bg}`}>
              <IconComponent className={`h-5 w-5 ${currentConfig.color}`} />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900">{currentConfig.title} Records</CardTitle>
              <CardDescription className="text-xs">
                Showing {filteredRows.length} of {reportData.length} records
              </CardDescription>
            </div>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Updated: {format(lastGenerated, 'hh:mm a')}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 bg-white">
              <Loader2 className="h-8 w-8 animate-spin text-[#4B49AC]" />
              <p className="text-xs font-medium text-gray-500">Loading business records...</p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 bg-white text-center p-6">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-1">
                <FileText className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-gray-800">No records found</p>
              <p className="text-xs text-gray-500 max-w-sm">
                No database records match your current filter ({timeRange.toUpperCase()} / {departmentFilter.toUpperCase()}).
              </p>
              <Button onClick={() => { setTimeRange('all'); setDepartmentFilter('all'); setSearchQuery(''); }} variant="outline" size="sm" className="mt-2 text-xs h-8">
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[550px]">
              <Table>
                <TableHeader className="bg-gray-50/90 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[100px] font-bold text-gray-700 text-xs">ID</TableHead>
                    <TableHead className="w-[110px] font-bold text-gray-700 text-xs">Date</TableHead>
                    <TableHead className="w-[140px] font-bold text-gray-700 text-xs">Category</TableHead>
                    <TableHead className="min-w-[240px] font-bold text-gray-700 text-xs">Title & Description</TableHead>
                    <TableHead className="w-[160px] font-bold text-gray-700 text-xs">Owner / Dept</TableHead>
                    <TableHead className="w-[120px] font-bold text-gray-700 text-xs">Status</TableHead>
                    {filteredRows.some(r => r.amount !== undefined) && (
                      <TableHead className="w-[130px] font-bold text-gray-700 text-xs text-right">Amount (₹)</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100">
                  {filteredRows.map((row) => {
                    const isAlert = row.status.toLowerCase().includes('alert') || row.status.toLowerCase().includes('warning') || row.status.toLowerCase().includes('overdue');
                    const isSuccess = row.status.toLowerCase().includes('active') || row.status.toLowerCase().includes('paid') || row.status.toLowerCase().includes('completed') || row.status.toLowerCase().includes('in stock') || row.status.toLowerCase().includes('validated');

                    return (
                      <TableRow key={row.id} className="hover:bg-gray-50/70 transition-colors">
                        <TableCell className="font-mono font-bold text-xs text-[#4B49AC]">
                          {row.id}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 font-medium">
                          {row.date}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-semibold text-[10px]">
                            {row.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-xs text-gray-900">
                            {row.title}
                          </div>
                          {row.detail && (
                            <div className="text-[11px] text-gray-500 mt-0.5 font-normal">
                              {row.detail}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-xs text-gray-800 truncate max-w-[150px]">
                            {row.owner}
                          </div>
                          <div className="text-[10px] text-gray-500">
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
                                : "bg-gray-50 text-gray-700 border-gray-200"
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
    </div>
  );
}
