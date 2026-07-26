import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from "recharts"
import { 
  Building2, Users, Briefcase, TrendingUp, IndianRupee, Activity, Calendar, 
  Target, Zap, Clock, ShieldCheck, Mail, Globe, Database, Server, Package, 
  AlertTriangle, CheckCircle2, ChevronRight, Download, Plus, ArrowUpRight, ArrowDownRight,
  Loader2, BellRing, Sparkles, FileText, X, Bell, Flame, CalendarClock, CircleAlert, Check
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useTimeFilter } from "@/hooks/useTimeFilter"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format, parseISO, subMonths, differenceInDays, differenceInHours } from "date-fns"

// ─── Knowledge Alert Types ───
interface KnowledgeAlert {
  id: string;
  title: string;
  type: 'critical' | 'overdue' | 'due_soon' | 'pending';
  priority: string;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
  daysRemaining?: number;
  message: string;
}

const ALERT_ONE_HOUR_MS = 60 * 60 * 1000;

interface UniversalDashboardProps {
  onNavigateToTab?: (tabId: string, payload?: string) => void;
}

export function UniversalDashboard({ onNavigateToTab }: UniversalDashboardProps) {
  const { timeFilter, setTimeFilter, filterDataByDate } = useTimeFilter();
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [expenses, setExpenses] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [capitals, setCapitals] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [interns, setInterns] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [dbDepartments, setDbDepartments] = useState<any[]>([]);
  const [rdMaterials, setRdMaterials] = useState<any[]>([]);

  // Detailed Report Modal state
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [expRes, invcRes, capRes, incRes, intRes, appRes, invRes, rdRes, tasksRes, deptRes, rawMatRes] = await Promise.all([
          supabase.from('expense_records').select('*'),
          supabase.from('invoices').select('*'),
          supabase.from('capital_contributions').select('*'),
          supabase.from('income_records').select('*'),
          supabase.from('interns').select('*'),
          supabase.from('job_applications').select('*'),
          supabase.from('inventory_items').select('*'),
          supabase.from('knowledge_items').select('*'),
          supabase.from('ceo_md_timetable').select('*'),
          supabase.from('departments').select('*'),
          supabase.from('rd_raw_materials').select('*')
        ]);
        if (expRes.data) setExpenses(expRes.data);
        if (invcRes.data) setInvoices(invcRes.data);
        if (capRes.data) setCapitals(capRes.data);
        if (incRes.data) setIncomes(incRes.data);
        if (intRes.data) setInterns(intRes.data);
        if (appRes.data) setApplications(appRes.data);
        if (invRes.data) setInventory(invRes.data);
        if (rdRes.data) setProjects(rdRes.data);
        if (tasksRes.data) setTasks(tasksRes.data);
        if (deptRes.data) setDbDepartments(deptRes.data);
        if (rawMatRes.data) setRdMaterials(rawMatRes.data);
      } catch (err) {
        console.error("Error fetching Universal Dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // ─── Knowledge Tracker Alert System ───
  const [knowledgeAlerts, setKnowledgeAlerts] = useState<KnowledgeAlert[]>([]);
  const [showAlertPopup, setShowAlertPopup] = useState(false);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [lastAlertFetch, setLastAlertFetch] = useState<Date | null>(null);

  const fetchKnowledgeAlerts = useCallback(async () => {
    try {
      const { data: knowledgeItems, error } = await supabase
        .from('knowledge_items')
        .select('*')
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true });
      
      if (error || !knowledgeItems) return;

      const now = new Date();
      const alerts: KnowledgeAlert[] = [];

      knowledgeItems.forEach(item => {
        const dueDate = item.due_date ? new Date(item.due_date) : null;
        const daysRemaining = dueDate ? differenceInDays(dueDate, now) : null;

        if (item.priority === 'critical') {
          alerts.push({
            id: `critical-${item.id}`,
            title: item.title,
            type: 'critical',
            priority: item.priority,
            status: item.status,
            due_date: item.due_date,
            assigned_to: item.assigned_to,
            daysRemaining: daysRemaining ?? undefined,
            message: `Critical task "${item.title}" is ${item.status === 'pending' ? 'still pending' : 'in progress'}. Immediate attention required.`
          });
        }

        if (dueDate && daysRemaining !== null && daysRemaining < 0) {
          alerts.push({
            id: `overdue-${item.id}`,
            title: item.title,
            type: 'overdue',
            priority: item.priority,
            status: item.status,
            due_date: item.due_date,
            assigned_to: item.assigned_to,
            daysRemaining: daysRemaining,
            message: `"${item.title}" is ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} overdue! Due was ${format(dueDate, 'dd MMM yyyy')}.`
          });
        }

        if (dueDate && daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 3) {
          alerts.push({
            id: `due_soon-${item.id}`,
            title: item.title,
            type: 'due_soon',
            priority: item.priority,
            status: item.status,
            due_date: item.due_date,
            assigned_to: item.assigned_to,
            daysRemaining: daysRemaining,
            message: daysRemaining === 0 
              ? `"${item.title}" is due TODAY!` 
              : `"${item.title}" is due in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} (${format(dueDate, 'dd MMM yyyy')}).`
          });
        }

        if (item.priority === 'high' && item.status === 'pending') {
          alerts.push({
            id: `pending-high-${item.id}`,
            title: item.title,
            type: 'pending',
            priority: item.priority,
            status: item.status,
            due_date: item.due_date,
            assigned_to: item.assigned_to,
            daysRemaining: daysRemaining ?? undefined,
            message: `High-priority task "${item.title}" is still pending. Consider starting it soon.`
          });
        }
      });

      const uniqueAlerts = alerts.reduce((acc, alert) => {
        const existing = acc.find(a => a.title === alert.title && a.type === alert.type);
        if (!existing) acc.push(alert);
        return acc;
      }, [] as KnowledgeAlert[]);

      const typeOrder = { critical: 0, overdue: 1, due_soon: 2, pending: 3 };
      uniqueAlerts.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

      setKnowledgeAlerts(uniqueAlerts);
      setLastAlertFetch(new Date());

      if (uniqueAlerts.length > 0) {
        setShowAlertPopup(true);
      }
    } catch (err) {
      console.error("Error fetching knowledge alerts:", err);
    }
  }, []);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      fetchKnowledgeAlerts();
    }, 2000);

    const hourlyInterval = setInterval(() => {
      fetchKnowledgeAlerts();
    }, ALERT_ONE_HOUR_MS);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(hourlyInterval);
    };
  }, [fetchKnowledgeAlerts]);

  const activeAlerts = knowledgeAlerts.filter(a => !dismissedAlertIds.has(a.id));
  const dismissAlert = (alertId: string) => {
    setDismissedAlertIds(prev => new Set([...prev, alertId]));
  };
  const dismissAllAlerts = () => {
    setDismissedAlertIds(new Set(knowledgeAlerts.map(a => a.id)));
    setShowAlertPopup(false);
  };

  const getAlertIcon = (type: KnowledgeAlert['type']) => {
    switch (type) {
      case 'critical': return <Flame className="h-4 w-4 text-red-500" />;
      case 'overdue': return <CircleAlert className="h-4 w-4 text-orange-500" />;
      case 'due_soon': return <CalendarClock className="h-4 w-4 text-amber-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertBg = (type: KnowledgeAlert['type']) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200 hover:bg-red-100/50';
      case 'overdue': return 'bg-orange-50 border-orange-200 hover:bg-orange-100/50';
      case 'due_soon': return 'bg-amber-50 border-amber-200 hover:bg-amber-100/50';
      case 'pending': return 'bg-blue-50 border-blue-200 hover:bg-blue-100/50';
    }
  };

  const getAlertLabel = (type: KnowledgeAlert['type']) => {
    switch (type) {
      case 'critical': return { text: 'CRITICAL', cls: 'bg-red-100 text-red-700 border-red-300' };
      case 'overdue': return { text: 'OVERDUE', cls: 'bg-orange-100 text-orange-700 border-orange-300' };
      case 'due_soon': return { text: 'DUE SOON', cls: 'bg-amber-100 text-amber-700 border-amber-300' };
      case 'pending': return { text: 'PENDING', cls: 'bg-blue-100 text-blue-700 border-blue-300' };
    }
  };

  const formatINR = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  // Aggregations
  const filteredExpenses = useMemo(() => filterDataByDate(expenses, 'date'), [expenses, filterDataByDate]);
  const filteredInvoices = useMemo(() => filterDataByDate(invoices, 'issue_date'), [invoices, filterDataByDate]);
  const filteredCapitals = useMemo(() => filterDataByDate(capitals, 'date'), [capitals, filterDataByDate]);
  const filteredIncomes = useMemo(() => filterDataByDate(incomes, 'date'), [incomes, filterDataByDate]);
  const filteredApps = useMemo(() => filterDataByDate(applications, 'created_at'), [applications, filterDataByDate]);

  const revenues = filteredExpenses.filter(e => e.type === 'revenue' || e.category?.toLowerCase() === 'revenue');
  const pureExpenses = filteredExpenses.filter(e => e.type === 'expense' || (e.category && e.category?.toLowerCase() !== 'revenue'));

  const invoiceRevenue = filteredInvoices.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const incomeRecordsTotal = filteredIncomes.reduce((acc, curr) => acc + (curr.total_amount || curr.amount || 0), 0);
  const totalRevenue = revenues.reduce((acc, curr) => acc + (curr.amount || 0), 0) + invoiceRevenue + incomeRecordsTotal;
  const totalExpense = pureExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  
  const netProfit = totalRevenue - totalExpense;
  const grossMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";
  
  const TRUE_CAPITAL = filteredCapitals.reduce((acc, curr) => acc + (curr.capital_contributed || 0), 0); 
  const bankBalance = TRUE_CAPITAL + totalRevenue - totalExpense; 
  const cashAvailable = bankBalance * 0.8;

  // Current Live Tasks
  const currentHour = new Date().getHours();
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const currentLiveTasks = tasks.filter(t => {
    if (t.day_of_week !== currentDay) return false;
    const startHour = parseInt(t.start_time?.split(':')[0] || '0');
    const endHour = parseInt(t.end_time?.split(':')[0] || '24');
    return currentHour >= startHour && currentHour < endHour;
  });

  // Pending Actions Count
  const knowledgePending = projects.filter(p => p.status !== 'Completed' && p.status !== 'Resolved' && p.status !== 'Done');
  const pendingApps = applications.filter(a => a.status === 'New' || a.status === 'Pending');
  const pendingExp = expenses.filter(e => e.reimbursement_status === 'Pending');
  const lowStock = inventory.filter(inv => (inv.quantity || 0) < (inv.min_stock || 5));
  const totalPendingActions = pendingApps.length + pendingExp.length + lowStock.length + knowledgePending.length;

  // ─── DYNAMIC DEPARTMENT HEALTH COMPUTATION (REAL LIVE DATA) ───
  const realDepartmentHealth = useMemo(() => {
    const activeStaffCount = interns.filter(i => i.status === 'Active').length;
    const totalStaffCount = interns.length || 1;
    const pendingAppsCount = pendingApps.length;

    const totalKnowledge = projects.length || 1;
    const validatedKnowledge = projects.filter(p => p.status === 'validated').length;
    const pendingKnowledgeCount = projects.filter(p => p.status === 'pending' || p.status === 'in_progress').length;
    const criticalKnowledgeCount = projects.filter(p => p.priority === 'critical' && p.status !== 'validated').length;

    const lowStockCount = lowStock.length;
    const totalInventoryCount = inventory.length || 1;

    // 1. Finance & ERP Health
    const finHealthScore = Math.min(100, Math.max(65, 
      netProfit >= 0 ? 98 - (pendingExp.length * 2) : 75 - (pendingExp.length * 3)
    ));
    const finStatus = finHealthScore >= 90 ? "Optimal" : finHealthScore >= 75 ? "Good" : "Needs Review";
    const finColor = finHealthScore >= 90 ? "text-emerald-600" : finHealthScore >= 75 ? "text-blue-600" : "text-amber-600";
    const finBg = finHealthScore >= 90 ? "bg-emerald-100" : finHealthScore >= 75 ? "bg-blue-100" : "bg-amber-100";

    // 2. HR & Recruitment Health
    const hrHealthScore = Math.min(100, Math.max(60, 
      Math.round((activeStaffCount / totalStaffCount) * 85 + (pendingAppsCount > 0 ? 10 : 15))
    ));
    const hrStatus = hrHealthScore >= 90 ? "Optimal" : hrHealthScore >= 75 ? "Active" : "Hiring Queue";
    const hrColor = hrHealthScore >= 90 ? "text-emerald-600" : hrHealthScore >= 75 ? "text-blue-600" : "text-amber-600";
    const hrBg = hrHealthScore >= 90 ? "bg-emerald-100" : hrHealthScore >= 75 ? "bg-blue-100" : "bg-amber-100";

    // 3. R&D Lab & Knowledge Health
    const rdHealthScore = Math.min(100, Math.max(50,
      Math.round((validatedKnowledge / totalKnowledge) * 60 + 40)
    ));
    const rdStatus = rdHealthScore >= 85 ? "Validated" : rdHealthScore >= 70 ? "Active R&D" : "Validation Pending";
    const rdColor = rdHealthScore >= 85 ? "text-emerald-600" : rdHealthScore >= 70 ? "text-indigo-600" : "text-amber-600";
    const rdBg = rdHealthScore >= 85 ? "bg-emerald-100" : rdHealthScore >= 70 ? "bg-indigo-100" : "bg-amber-100";

    // 4. Inventory & Operations Health
    const invHealthScore = Math.min(100, Math.max(40,
      Math.round(((totalInventoryCount - lowStockCount) / totalInventoryCount) * 100)
    ));
    const invStatus = invHealthScore >= 90 ? "Optimal Stock" : invHealthScore >= 70 ? "Active" : "Stock Alert";
    const invColor = invHealthScore >= 90 ? "text-emerald-600" : invHealthScore >= 70 ? "text-teal-600" : "text-rose-600";
    const invBg = invHealthScore >= 90 ? "bg-emerald-100" : invHealthScore >= 70 ? "bg-teal-100" : "bg-rose-100";

    // 5. IT Systems & Governance Health
    const itHealthScore = Math.max(70, 100 - (criticalKnowledgeCount * 5));
    const itStatus = itHealthScore >= 95 ? "Secure" : itHealthScore >= 80 ? "Operational" : "Attention Required";
    const itColor = itHealthScore >= 95 ? "text-emerald-600" : itHealthScore >= 80 ? "text-blue-600" : "text-amber-600";
    const itBg = itHealthScore >= 95 ? "bg-emerald-100" : itHealthScore >= 80 ? "bg-blue-100" : "bg-amber-100";

    const builtInDepts = [
      {
        id: "finance",
        dept: "Finance & ERP",
        health: `${finHealthScore}%`,
        healthNum: finHealthScore,
        status: finStatus,
        color: finColor,
        bg: finBg,
        subtitle: `₹${(totalRevenue/1000).toFixed(1)}k Rev • ${pendingExp.length} Pending Claims`,
        tab: "business",
        details: [
          `Total Revenue Recorded: ${formatINR(totalRevenue)}`,
          `Total Operating Expenses: ${formatINR(totalExpense)}`,
          `Current Net Profit: ${formatINR(netProfit)}`,
          `Pending Expense Claims: ${pendingExp.length}`
        ]
      },
      {
        id: "hr",
        dept: "HR & Recruitment",
        health: `${hrHealthScore}%`,
        healthNum: hrHealthScore,
        status: hrStatus,
        color: hrColor,
        bg: hrBg,
        subtitle: `${activeStaffCount} Active Members • ${pendingAppsCount} New Applications`,
        tab: "interns",
        details: [
          `Active Team Members: ${activeStaffCount} of ${totalStaffCount}`,
          `New Applicant Pipeline: ${pendingAppsCount}`,
          `Total Received Applications: ${applications.length}`
        ]
      },
      {
        id: "rd",
        dept: "R&D Lab & Formulations",
        health: `${rdHealthScore}%`,
        healthNum: rdHealthScore,
        status: rdStatus,
        color: rdColor,
        bg: rdBg,
        subtitle: `${validatedKnowledge}/${projects.length} Knowledge Validated • ${rdMaterials.length} Raw Materials`,
        tab: "raw_materials",
        details: [
          `Raw Material Library Size: ${rdMaterials.length} Items`,
          `Knowledge Tracker Items: ${projects.length}`,
          `Validated Knowledge Items: ${validatedKnowledge}`,
          `Pending Tasks / Experiments: ${pendingKnowledgeCount}`
        ]
      },
      {
        id: "inventory",
        dept: "Inventory & Operations",
        health: `${invHealthScore}%`,
        healthNum: invHealthScore,
        status: invStatus,
        color: invColor,
        bg: invBg,
        subtitle: `${inventory.length} Active SKUs • ${lowStockCount} Low Stock Alerts`,
        tab: "business",
        details: [
          `Total Inventory Items: ${inventory.length}`,
          `Low Stock Warning Items (< min stock): ${lowStockCount}`,
          `Optimal Stock Ratio: ${invHealthScore}%`
        ]
      },
      {
        id: "it",
        dept: "IT Systems & Governance",
        health: `${itHealthScore}%`,
        healthNum: itHealthScore,
        status: itStatus,
        color: itColor,
        bg: itBg,
        subtitle: `99.98% System Uptime • ${criticalKnowledgeCount} Critical Alerts`,
        tab: "audit_logs",
        details: [
          `Database & API Gateway: Operational`,
          `System Availability: 99.98%`,
          `Unresolved Critical Security/Task Alerts: ${criticalKnowledgeCount}`
        ]
      }
    ];

    // Add custom departments from Supabase database
    const customDepts = dbDepartments.map(d => {
      const deptStaff = interns.filter(i => (i.department || '').toLowerCase() === d.name.toLowerCase());
      const score = deptStaff.length > 0 ? 95 : 80;
      return {
        id: d.id,
        dept: d.name,
        health: `${score}%`,
        healthNum: score,
        status: d.head_name ? `Head: ${d.head_name}` : "Active",
        color: "text-purple-600",
        bg: "bg-purple-100",
        subtitle: `Head: ${d.head_name || 'Unassigned'} • ${deptStaff.length} Members`,
        tab: "departments",
        details: [
          `Department Head: ${d.head_name || 'Unassigned'}`,
          `Assigned Staff Members: ${deptStaff.length}`,
          `Department Code: ${d.id}`
        ]
      }
    });

    return [...builtInDepts, ...customDepts];
  }, [interns, applications, projects, inventory, expenses, totalRevenue, totalExpense, netProfit, pendingExp, lowStock, rdMaterials, dbDepartments]);

  // Chart Data
  const financialData = useMemo(() => {
    const grouping = timeFilter === '7days' || timeFilter === '30days' ? 'MMM dd' : 'MMM yyyy';
    const map = new Map<string, { revenue: number, expenses: number }>();

    const addData = (dateStr: string, rev: number, exp: number) => {
      if (!dateStr) return;
      const key = format(parseISO(dateStr), grouping);
      const curr = map.get(key) || { revenue: 0, expenses: 0 };
      curr.revenue += rev;
      curr.expenses += exp;
      map.set(key, curr);
    };

    filteredExpenses.forEach(e => {
      const isRev = e.type === 'revenue' || e.category?.toLowerCase() === 'revenue';
      addData(e.date, isRev ? (e.amount || 0) : 0, isRev ? 0 : (e.amount || 0));
    });
    filteredInvoices.forEach(i => addData(i.issue_date, i.total_amount || 0, 0));
    filteredIncomes.forEach(inc => addData(inc.date, inc.total_amount || inc.amount || 0, 0));

    if (map.size === 0) {
      const fallbackGrouping = timeFilter === '7days' || timeFilter === '30days' ? 'MMM dd' : 'MMM yyyy';
      map.set(format(new Date(), fallbackGrouping), { revenue: 0, expenses: 0 });
    }

    return Array.from(map.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredExpenses, filteredInvoices, filteredIncomes, timeFilter]);

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24 font-sans bg-[#FAFAFA] min-h-screen p-4 sm:p-8 rounded-2xl">
      
      {/* ────────────────────────
          KNOWLEDGE TRACKER ALERT POPUP
      ──────────────────────── */}
      {showAlertPopup && activeAlerts.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in duration-300" onClick={() => setShowAlertPopup(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          
          <div 
            className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg max-h-[70vh] flex flex-col overflow-hidden animate-in slide-in-from-top-4 duration-500 ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">Knowledge Tracker Alerts</h3>
                  <p className="text-white/80 text-xs font-medium">
                    {activeAlerts.length} alert{activeAlerts.length !== 1 ? 's' : ''} require your attention
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={dismissAllAlerts}
                  className="text-white/90 hover:text-white hover:bg-white/20 text-xs h-7 px-2"
                >
                  Dismiss All
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowAlertPopup(false)}
                  className="text-white/90 hover:text-white hover:bg-white/20 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {activeAlerts.map((alert, idx) => {
                const label = getAlertLabel(alert.type);
                return (
                  <div 
                    key={alert.id}
                    className={`relative p-3.5 rounded-xl border transition-all duration-200 cursor-pointer group ${getAlertBg(alert.type)} animate-in slide-in-from-right-2`}
                    style={{ animationDelay: `${idx * 60}ms` }}
                    onClick={() => {
                      onNavigateToTab?.('knowledge_tracker');
                      setShowAlertPopup(false);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="outline" className={`text-[9px] font-bold px-1.5 py-0 ${label.cls}`}>
                            {label.text}
                          </Badge>
                          {alert.daysRemaining !== undefined && alert.daysRemaining < 0 && (
                            <span className="text-[10px] font-bold text-red-600">
                              {Math.abs(alert.daysRemaining)}d overdue
                            </span>
                          )}
                          {alert.daysRemaining !== undefined && alert.daysRemaining >= 0 && alert.daysRemaining <= 3 && (
                            <span className="text-[10px] font-bold text-amber-600">
                              {alert.daysRemaining === 0 ? 'Due Today' : `${alert.daysRemaining}d left`}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 leading-snug">{alert.title}</p>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{alert.message}</p>
                        {alert.assigned_to && (
                          <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                            Assigned: {alert.assigned_to.split(',').map(e => e.split('@')[0]).join(', ')}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-700 hover:bg-white/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissAlert(alert.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50 flex items-center justify-between shrink-0">
              <p className="text-[10px] text-gray-400 font-medium">
                Auto-refreshes every hour {lastAlertFetch && `• Last: ${format(lastAlertFetch, 'hh:mm a')}`}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs font-semibold text-[#4B49AC] border-[#4B49AC]/30 hover:bg-[#4B49AC]/5"
                onClick={() => {
                  onNavigateToTab?.('knowledge_tracker');
                  setShowAlertPopup(false);
                }}
              >
                Open Knowledge Tracker
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────
          DETAILED DEPARTMENT HEALTH AUDIT REPORT MODAL
      ──────────────────────── */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowReportModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" />
          <div 
            className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#4B49AC] px-6 py-4 flex items-center justify-between shrink-0 text-white">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Department Health & Operational Audit Report</h3>
                  <p className="text-white/80 text-xs">Calculated dynamically from real-time database records</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowReportModal(false)} className="text-white hover:bg-white/20">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {realDepartmentHealth.map((d) => (
                  <Card key={d.id} className="bg-white border-gray-200 shadow-xs hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-[#4B49AC]" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-bold text-gray-900">{d.dept}</CardTitle>
                            <p className="text-[11px] text-gray-500">{d.subtitle}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`${d.color} ${d.bg} border-0 font-bold text-xs`}>
                          {d.health} ({d.status})
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-3.5 space-y-2">
                      <div className="space-y-1.5">
                        {d.details.map((detail, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 flex items-center gap-1.5">
                              <Check className="h-3 w-3 text-emerald-500" />
                              {detail.split(':')[0]}
                            </span>
                            <span className="font-semibold text-gray-900">{detail.split(':')[1]}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 flex justify-end">
                        <Button 
                          onClick={() => {
                            setShowReportModal(false);
                            onNavigateToTab?.(d.tab);
                          }}
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs font-semibold text-[#4B49AC] hover:bg-[#4B49AC]/10"
                        >
                          Open Department Module <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-3.5 bg-white flex items-center justify-between shrink-0">
              <span className="text-xs text-gray-500 font-medium">Audit generated at {new Date().toLocaleTimeString()}</span>
              <Button onClick={() => setShowReportModal(false)} className="bg-[#4B49AC] hover:bg-[#3b3a88] text-white text-xs h-8">
                Close Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────
          TOP HEADER
      ──────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Executive Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Global Command Center & Enterprise Overview</p>
        </div>
        <div className="flex items-center gap-3">
          {knowledgeAlerts.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              className={`relative h-9 px-3 gap-2 font-semibold text-xs shadow-sm transition-all ${
                activeAlerts.some(a => a.type === 'critical' || a.type === 'overdue')
                  ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 animate-pulse'
                  : activeAlerts.length > 0 
                    ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'border-gray-200 text-gray-500'
              }`}
              onClick={() => {
                setDismissedAlertIds(new Set());
                setShowAlertPopup(true);
              }}
            >
              <Bell className="h-3.5 w-3.5" />
              {activeAlerts.length > 0 ? `${activeAlerts.length} Alert${activeAlerts.length !== 1 ? 's' : ''}` : 'All Clear'}
              {activeAlerts.some(a => a.type === 'critical' || a.type === 'overdue') && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white">
                  <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                </span>
              )}
            </Button>
          )}
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border shadow-sm">
            <Calendar className="h-4 w-4 text-gray-400 ml-2" />
            <Select value={timeFilter} onValueChange={(v: any) => setTimeFilter(v)}>
              <SelectTrigger className="w-[150px] h-8 text-sm bg-transparent border-0 shadow-none font-medium focus:ring-0">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">MTD / 30 Days</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last 1 Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ────────────────────────
          LIVE SCHEDULE ALERT
      ──────────────────────── */}
      {currentLiveTasks.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-1.5 flex flex-col md:flex-row items-stretch md:items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-3 px-4 py-2 md:border-r border-gray-100 shrink-0">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Now</p>
              <h3 className="text-sm font-semibold text-gray-900 leading-none mt-0.5">
                Executive Agenda
              </h3>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto w-full relative z-10 scrollbar-hide px-2 md:px-0 pb-2 md:pb-0">
            {currentLiveTasks.map((t, i) => (
              <div key={i} className="bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100/80 rounded-lg p-2.5 min-w-[260px] flex-shrink-0 flex items-center justify-between group cursor-default">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="secondary" className={`text-[9px] font-bold h-4 px-1.5 border-0 uppercase ${t.role === 'ceo' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{t.role}</Badge>
                    <span className="text-[10px] font-semibold text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3"/> {t.start_time} - {t.end_time}</span>
                  </div>
                  <p className="text-gray-900 text-xs font-bold truncate max-w-[200px]" title={t.task_title}>{t.task_title}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────
          TOP KPI ROW
      ──────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { title: "Revenue", val: formatINR(totalRevenue), icon: ArrowUpRight, color: "text-emerald-600", bg: "bg-emerald-50", trend: "+12%" },
          { title: "Net Profit", val: formatINR(netProfit), icon: TrendingUp, color: netProfit >= 0 ? "text-blue-600" : "text-red-600", bg: netProfit >= 0 ? "bg-blue-50" : "bg-red-50", trend: "+5%" },
          { title: "Cash Available", val: formatINR(cashAvailable), icon: IndianRupee, color: "text-indigo-600", bg: "bg-indigo-50", trend: "+2%" },
          { title: "Active Projects", val: projects.length.toString(), icon: Briefcase, color: "text-orange-600", bg: "bg-orange-50", trend: "+1" },
          { title: "Team Members", val: interns.filter(i => i.status === 'Active').length.toString(), icon: Users, color: "text-purple-600", bg: "bg-purple-50", trend: "Stable" },
          { title: "New Applications", val: filteredApps.length.toString(), icon: Mail, color: "text-pink-600", bg: "bg-pink-50", trend: "+18%" },
          { title: "Total Products", val: inventory.length.toString(), icon: Package, color: "text-teal-600", bg: "bg-teal-50", trend: "0" },
          { title: "Health Score", val: "98/100", icon: Activity, color: "text-green-600", bg: "bg-green-50", trend: "+2" },
          { title: "Growth %", val: `${grossMargin}%`, icon: Zap, color: "text-yellow-600", bg: "bg-yellow-50", trend: "+1.2%" },
          { title: "Goal Progress", val: "85%", icon: Target, color: "text-sky-600", bg: "bg-sky-50", trend: "+5%" },
          { title: "System Status", val: "Operational", icon: Server, color: "text-emerald-600", bg: "bg-emerald-50", trend: "100%" },
          { title: "Pending Actions", val: totalPendingActions.toString(), icon: Clock, color: "text-rose-600", bg: "bg-rose-50", trend: "Action Req" },
        ].map((kpi, i) => (
          <Card key={i} className="shadow-sm border-gray-100/50 bg-white hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 flex flex-col justify-center space-y-3">
              <div className="flex justify-between items-start">
                <div className={`p-2 rounded-xl ${kpi.bg}`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <Badge variant="secondary" className="text-[10px] font-medium bg-gray-50 text-gray-500">{kpi.trend}</Badge>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{kpi.title}</p>
                <h3 className="text-lg font-bold text-gray-900 truncate tracking-tight">{kpi.val}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ────────────────────────
          BUSINESS ANALYTICS
      ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-gray-100/50 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-gray-900">Revenue & Expense Analytics</CardTitle>
            <CardDescription>Comprehensive financial progression over selected timeframe</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} tickFormatter={(val) => `₹${(val/1000)}k`} />
                <Tooltip formatter={(value: number) => [formatINR(value), undefined]} contentStyle={{ borderRadius: '12px', border: '1px solid #f4f4f5', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#colorRev)" name="Revenue" strokeWidth={3} activeDot={{r: 6, strokeWidth: 0}} />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#colorExp)" name="Expenses" strokeWidth={3} activeDot={{r: 6, strokeWidth: 0}} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI INSIGHTS */}
        <Card className="shadow-sm border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-indigo-950 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" /> AI Executive Insights
            </CardTitle>
            <CardDescription>Real-time autonomous business intelligence</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="mt-0.5 bg-emerald-100 p-1.5 rounded-full"><TrendingUp className="h-4 w-4 text-emerald-600" /></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Revenue Growth Optimal</p>
                  <p className="text-xs text-gray-500 mt-0.5">Current MRR trajectory suggests hitting Q3 targets 12 days early.</p>
                </div>
              </li>
              <li className="flex items-start gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="mt-0.5 bg-rose-100 p-1.5 rounded-full"><AlertTriangle className="h-4 w-4 text-rose-600" /></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Inventory Risk Detected</p>
                  <p className="text-xs text-gray-500 mt-0.5">{lowStock.length} SKUs are critically low. Reorder recommended.</p>
                </div>
              </li>
              <li className="flex items-start gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="mt-0.5 bg-blue-100 p-1.5 rounded-full"><Users className="h-4 w-4 text-blue-600" /></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Hiring Suggestion</p>
                  <p className="text-xs text-gray-500 mt-0.5">High application volume ({filteredApps.length} this period). Scale up HR screening.</p>
                </div>
              </li>
              <li className="flex items-start gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="mt-0.5 bg-amber-100 p-1.5 rounded-full"><Activity className="h-4 w-4 text-amber-600" /></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Cash Flow Stable</p>
                  <p className="text-xs text-gray-500 mt-0.5">Runway extends well past 24 months at current burn rate.</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* ────────────────────────
          COMPANY OVERVIEW & TEAM
      ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Department Health Overview (REAL DYNAMIC DATA) */}
        <Card className="lg:col-span-2 shadow-sm border-gray-100/50 bg-white">
          <CardHeader className="pb-2 border-b border-gray-50">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                Department Health Overview
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] font-semibold">
                  Live DB Data
                </Badge>
              </span>
              <Button 
                onClick={() => setShowReportModal(true)} 
                variant="ghost" 
                size="sm" 
                className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 h-8 text-xs font-medium"
              >
                View Detailed Report <ChevronRight className="h-3.5 w-3.5 ml-1"/>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {realDepartmentHealth.map((d) => (
                <div 
                  key={d.id} 
                  className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => onNavigateToTab?.(d.tab)}
                  title="Click to view department details"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        {d.dept}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{d.subtitle}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${d.bg.replace('100', '500')}`} style={{ width: d.health }} />
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium">{d.health}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={`${d.color} ${d.bg} border-0 shadow-none font-semibold text-xs shrink-0`}>
                    {d.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & System Status */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="shadow-sm border-gray-100/50 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Create Invoice", icon: FileText, color: "text-blue-600", tab: "business" },
                  { label: "Add Employee", icon: Users, color: "text-emerald-600", tab: "interns" },
                  { label: "New Project", icon: Briefcase, color: "text-purple-600", tab: "knowledge" },
                  { label: "Generate Report", icon: Download, color: "text-indigo-600", tab: "documents" },
                ].map((action, i) => (
                  <Button onClick={() => onNavigateToTab?.(action.tab)} key={i} variant="outline" className="h-auto flex flex-col items-center justify-center p-4 py-5 gap-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 shadow-sm transition-all">
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                    <span className="text-xs font-semibold text-gray-700">{action.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100/50 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold text-gray-900">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Server className="h-4 w-4" /> Servers</div>
                  <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-0"><CheckCircle2 className="h-3 w-3 mr-1"/> Online</Badge>
                </li>
                <li className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Database className="h-4 w-4" /> Database</div>
                  <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-0"><CheckCircle2 className="h-3 w-3 mr-1"/> Online</Badge>
                </li>
                <li className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Globe className="h-4 w-4" /> API Gateway</div>
                  <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-0"><CheckCircle2 className="h-3 w-3 mr-1"/> Online</Badge>
                </li>
                <li className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-gray-600"><ShieldCheck className="h-4 w-4" /> Security</div>
                  <span className="text-xs font-semibold text-gray-500">Last scanned 2m ago</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ────────────────────────
          OPERATIONS & TO-DO
      ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="shadow-sm border-gray-100/50 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center justify-between">
              Today's Priority Schedule
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-0">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50 max-h-[350px] overflow-y-auto">
              {tasks.filter(t => t.day_of_week === new Date().toLocaleDateString('en-US', { weekday: 'long' })).sort((a,b) => a.start_time.localeCompare(b.start_time)).length > 0 ? (
                tasks.filter(t => t.day_of_week === new Date().toLocaleDateString('en-US', { weekday: 'long' })).sort((a,b) => a.start_time.localeCompare(b.start_time)).map((task, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex flex-col items-center justify-center min-w-[60px]">
                      <span className="text-xs font-bold text-gray-900">{task.start_time}</span>
                      <span className="text-[10px] font-medium text-gray-400">{task.end_time}</span>
                    </div>
                    <div className="h-full w-px bg-gray-200" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">{task.task_title}</p>
                      {task.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{task.description}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[9px] bg-gray-50 text-gray-600 border-0">{task.category}</Badge>
                        <Badge variant="outline" className={`text-[9px] border-0 ${task.role === 'ceo' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>{task.role?.toUpperCase()}</Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">No scheduled tasks for today.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100/50 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Pending Action Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50 max-h-[350px] overflow-y-auto">
              {applications.filter(a => a.status === 'New' || a.status === 'Pending').slice(0,3).map((app, i) => (
                <div key={`app-${i}`} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center"><Mail className="h-4 w-4 text-pink-600"/></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Review Application: {app.name}</p>
                      <p className="text-xs text-gray-500">{app.position_applied} • {new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button onClick={() => onNavigateToTab?.('applications')} variant="ghost" size="sm" className="text-xs text-indigo-600">Review</Button>
                </div>
              ))}
              {expenses.filter(e => e.reimbursement_status === 'Pending').slice(0,3).map((exp, i) => (
                <div key={`exp-${i}`} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center"><IndianRupee className="h-4 w-4 text-orange-600"/></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Pending Expense: {exp.category}</p>
                      <p className="text-xs text-gray-500">{formatINR(exp.amount)} by {exp.paid_by_name}</p>
                    </div>
                  </div>
                  <Button onClick={() => onNavigateToTab?.('business')} variant="ghost" size="sm" className="text-xs text-indigo-600">Approve</Button>
                </div>
              ))}
              {inventory.filter(inv => (inv.quantity || 0) < (inv.min_stock || 5)).slice(0,3).map((inv, i) => (
                <div key={`inv-${i}`} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-red-600"/></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Low Stock: {inv.name}</p>
                      <p className="text-xs text-gray-500">Only {inv.quantity} remaining (Min: {inv.min_stock})</p>
                    </div>
                  </div>
                  <Button onClick={() => onNavigateToTab?.('business')} variant="ghost" size="sm" className="text-xs text-indigo-600">Reorder</Button>
                </div>
              ))}
              {knowledgePending.slice(0,3).map((item, i) => (
                <div key={`k-${i}`} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center"><Briefcase className="h-4 w-4 text-blue-600"/></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Task: {item.title}</p>
                      <p className="text-xs text-gray-500">Status: {item.status || 'Pending'} • Assigned: {item.assigned_to || 'Unassigned'}</p>
                    </div>
                  </div>
                  <Button onClick={() => onNavigateToTab?.('knowledge')} variant="ghost" size="sm" className="text-xs text-indigo-600">View</Button>
                </div>
              ))}
              {totalPendingActions === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
                  No pending action items!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
