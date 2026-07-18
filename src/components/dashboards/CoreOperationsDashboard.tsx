import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts"
import { Briefcase, FileText, FolderOpen, TrendingUp, DollarSign, Activity, Calendar as CalendarIcon, Loader2, IndianRupee, Bell, Download, AlertTriangle, ArrowUpRight, ArrowDownRight, Package, CreditCard, Banknote } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useTimeFilter } from "@/hooks/useTimeFilter"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { format, parseISO, subMonths } from "date-fns"

const PIE_COLORS = ['#4B49AC', '#F3797E', '#7DA0FA', '#7978E9', '#FFA726', '#66BB6A'];

interface CoreOpsProps {
  onNavigateToTab?: (tabId: string, payload?: string) => void;
}

export function CoreOperationsDashboard({ onNavigateToTab }: CoreOpsProps) {
  const { timeFilter, setTimeFilter, filterDataByDate } = useTimeFilter();
  const [isLoading, setIsLoading] = useState(true);

  const [expenses, setExpenses] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [capitals, setCapitals] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [expRes, custRes, suppRes, invRes, invcRes, poRes, capRes, incRes] = await Promise.all([
          supabase.from('expense_records').select('*'),
          supabase.from('customers').select('*'),
          supabase.from('suppliers').select('*'),
          supabase.from('inventory_items').select('*'),
          supabase.from('invoices').select('*'),
          supabase.from('purchase_orders').select('*'),
          supabase.from('capital_contributions').select('*'),
          supabase.from('income_records').select('*')
        ]);
        if (expRes.data) setExpenses(expRes.data);
        if (custRes.data) setCustomers(custRes.data);
        if (suppRes.data) setSuppliers(suppRes.data);
        if (invRes.data) setInventory(invRes.data);
        if (invcRes.data) setInvoices(invcRes.data);
        if (poRes.data) setPurchaseOrders(poRes.data);
        if (capRes.data) setCapitals(capRes.data);
        if (incRes.data) setIncomes(incRes.data);
      } catch (err) {
        console.error("Error fetching Financial data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    // Realtime Subscriptions
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_records' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_orders' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'capital_contributions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'income_records' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredExpenses = useMemo(() => filterDataByDate(expenses, 'date'), [expenses, filterDataByDate]);
  const filteredInvoices = useMemo(() => filterDataByDate(invoices, 'issue_date'), [invoices, filterDataByDate]);
  const filteredPOs = useMemo(() => filterDataByDate(purchaseOrders, 'order_date'), [purchaseOrders, filterDataByDate]);
  const filteredIncomes = useMemo(() => filterDataByDate(incomes, 'date'), [incomes, filterDataByDate]);
  const filteredCapitals = useMemo(() => filterDataByDate(capitals, 'date'), [capitals, filterDataByDate]);

  // Aggregate Data from expense_records AND invoices / POs / incomes
  const revenues = filteredExpenses.filter(e => e.type === 'revenue' || e.category?.toLowerCase() === 'revenue');
  const pureExpenses = filteredExpenses.filter(e => e.type === 'expense' || (e.category && e.category?.toLowerCase() !== 'revenue'));

  // Total Revenue = Manual Revenues + Invoices (Sales) + Income Records
  const invoiceRevenue = filteredInvoices.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const incomeRecordsTotal = filteredIncomes.reduce((acc, curr) => acc + (curr.total_amount || curr.amount || 0), 0);
  const totalRevenue = revenues.reduce((acc, curr) => acc + (curr.amount || 0), 0) + invoiceRevenue + incomeRecordsTotal;
  
  // Total Expenses = Manual Expenses + Purchase Orders
  const poExpense = filteredPOs.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const totalExpense = pureExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0) + poExpense;
  
  const netProfit = totalRevenue - totalExpense;
  const grossMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";
  
  // Real database mappings for bottom widgets
  const topCustomers = customers.length > 0 ? customers.slice(0, 5) : [];
  const topSuppliers = suppliers.length > 0 ? suppliers.slice(0, 5) : [];
  
  let totalInventoryVal = 0;
  let rawInventoryVal = 0;
  let finishedInventoryVal = 0;
  
  if (inventory.length > 0) {
    totalInventoryVal = inventory.reduce((acc, curr) => acc + ((curr.quantity || 0) * (curr.price || 0)), 0);
    rawInventoryVal = inventory.filter(i => i.category === 'Raw Material').reduce((acc, curr) => acc + ((curr.quantity || 0) * (curr.price || 0)), 0);
    finishedInventoryVal = totalInventoryVal - rawInventoryVal;
  }
  
  // Bank Balance = Total Capital + Revenue - Expenses
  const TRUE_CAPITAL = filteredCapitals.reduce((acc, curr) => acc + (curr.capital_contributed || 0), 0); 
  const bankBalance = TRUE_CAPITAL + totalRevenue - totalExpense; 
  const cashAvailable = bankBalance * 0.8; // Assuming 80% of balance is liquid cash
  const burnRate = totalExpense / (timeFilter === '7days' ? 0.25 : timeFilter === '30days' ? 1 : 6); 
  const cashRunway = burnRate > 0 ? (bankBalance / burnRate).toFixed(1) : "∞";

  // Chart 1: Revenue Trend & Cash Flow (Grouped)
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
    filteredPOs.forEach(p => addData(p.order_date, 0, p.total_amount || 0));

    if (map.size === 0) {
      // Return empty chart if no data exists
      const fallbackGrouping = timeFilter === '7days' || timeFilter === '30days' ? 'MMM dd' : 'MMM yyyy';
      map.set(format(new Date(), fallbackGrouping), { revenue: 0, expenses: 0 });
    }

    return Array.from(map.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredExpenses, timeFilter]);

  // Chart 2: Expense Breakdown
  const expenseBreakdown = useMemo(() => {
    const catMap = new Map<string, number>();
    pureExpenses.forEach(e => {
      const cat = e.category || 'Operations';
      catMap.set(cat, (catMap.get(cat) || 0) + (e.amount || 0));
    });
    filteredPOs.forEach(p => {
      const cat = 'Inventory & Supply';
      catMap.set(cat, (catMap.get(cat) || 0) + (p.total_amount || 0));
    });
    if (catMap.size === 0) {
      catMap.set("No Expenses", 0);
    }
    return Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));
  }, [pureExpenses, filteredPOs]);

  // Chart 3: Sales/Profit by Product
  // Since there is no 'sales' table linked yet, we will show dynamic values based on actual inventory
  const productData = inventory.slice(0, 4).map(inv => ({
    name: inv.name || 'Unknown Item',
    sales: (inv.quantity || 0) * (inv.price || 0), // Use inventory value as a proxy if no sales data exists
    profit: ((inv.quantity || 0) * (inv.price || 0)) * 0.2 // Mock 20% margin for chart
  }));
  
  // If no inventory, return empty array for chart
  const activeProductData = productData.length > 0 ? productData : [{ name: 'No Data', sales: 0, profit: 0 }];

  const formatINR = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#7DA0FA]" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-[#4B49AC]" /> Financial & Ops Overview
          </h1>
          <p className="text-sm text-gray-500">Comprehensive Enterprise Operations & Financial Data</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => onNavigateToTab?.('business')} size="sm" className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white shadow-sm">
            <Briefcase className="h-4 w-4 mr-2" /> Open Business & ERP
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex text-gray-600">
            <Download className="h-4 w-4 mr-2" /> Export Reports
          </Button>
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <Select value={timeFilter} onValueChange={(v: any) => setTimeFilter(v)}>
              <SelectTrigger className="w-[140px] h-7 text-xs bg-transparent border-0 shadow-none font-medium focus:ring-0">
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

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
        {[
          { title: "Bank Balance", val: formatINR(bankBalance), icon: Banknote, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Cash Available", val: formatINR(cashAvailable), icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-50" },
          { title: "Revenue", val: formatINR(totalRevenue), icon: ArrowUpRight, color: "text-green-600", bg: "bg-green-50" },
          { title: "Expenses", val: formatINR(totalExpense), icon: ArrowDownRight, color: "text-red-600", bg: "bg-red-50" },
          { title: "Net Profit", val: formatINR(netProfit), icon: TrendingUp, color: netProfit >= 0 ? "text-green-600" : "text-red-600", bg: netProfit >= 0 ? "bg-green-50" : "bg-red-50" },
          { title: "Burn Rate", val: formatINR(burnRate) + '/mo', icon: Activity, color: "text-orange-600", bg: "bg-orange-50" },
          { title: "Cash Runway", val: `${cashRunway} mos`, icon: CalendarIcon, color: "text-purple-600", bg: "bg-purple-50" },
          { title: "Gross Margin", val: `${grossMargin}%`, icon: PieChart, color: "text-indigo-600", bg: "bg-indigo-50" },
        ].map((kpi, i) => (
          <Card key={i} className="shadow-sm border-gray-100">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center space-y-2">
              <div className={`p-2 rounded-full ${kpi.bg}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">{kpi.title}</p>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate w-full" title={kpi.val}>{kpi.val}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MAIN CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Line Chart */}
        <Card className="lg:col-span-2 shadow-sm border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-gray-800">Revenue & Expense Trend</CardTitle>
            <CardDescription>Daily / Monthly progression</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(val) => `₹${(val/1000)}k`} />
                <Tooltip formatter={(value: number) => [formatINR(value), undefined]} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" name="Revenue" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" name="Expenses" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Breakdown Pie Chart */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-gray-800">Expense Breakdown</CardTitle>
            <CardDescription>Distribution by Category</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {expenseBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
              {expenseBreakdown.slice(0,4).map((b, i) => (
                <div key={i} className="flex items-center text-[10px] text-gray-600">
                  <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="truncate">{b.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECONDARY CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-gray-800">Cash Flow (In vs Out)</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} tickFormatter={(val) => `₹${(val/1000)}k`} />
                <Tooltip formatter={(value: number) => formatINR(value)} cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="revenue" fill="#4B49AC" radius={[2, 2, 0, 0]} name="Cash In" barSize={12} />
                <Bar dataKey="expenses" fill="#F3797E" radius={[2, 2, 0, 0]} name="Cash Out" barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-gray-800">Sales & Profit by Product</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeProductData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} tickFormatter={(val) => `₹${(val/1000)}k`} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#333' }} width={80} />
                <Tooltip formatter={(value: number) => formatINR(value)} cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="sales" fill="#7DA0FA" radius={[0, 2, 2, 0]} name="Sales" barSize={12} />
                <Bar dataKey="profit" fill="#10b981" radius={[0, 2, 2, 0]} name="Profit" barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* TABLES / WIDGETS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Receivables & Customers */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-sm font-bold text-gray-800 flex items-center justify-between">
              Outstanding Receivables <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">Top 5</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y text-sm">
              {topCustomers.length > 0 ? topCustomers.map((c, i) => (
                <li key={i} className="flex justify-between items-center p-3 hover:bg-gray-50">
                  <span className="font-medium text-gray-700">{c.name}</span>
                  <span className="text-red-600 font-bold">{formatINR(c.due || 0)}</span>
                </li>
              )) : (
                <li className="p-4 text-center text-gray-500 text-xs">No outstanding receivables found</li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Payables & Vendors */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-sm font-bold text-gray-800 flex items-center justify-between">
              Vendor Payables <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-xs">Upcoming</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y text-sm">
              {topSuppliers.length > 0 ? topSuppliers.map((v, i) => (
                <li key={i} className="flex justify-between items-center p-3 hover:bg-gray-50">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-700">{v.name || v.company}</span>
                    <span className="text-xs text-gray-400">Due in {i+2} days</span>
                  </div>
                  <span className="text-gray-900 font-bold">{formatINR(v.due || 0)}</span>
                </li>
              )) : (
                <li className="p-4 text-center text-gray-500 text-xs">No upcoming vendor payables</li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Inventory Summary */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" /> Inventory Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Inventory Value</span>
              <span className="font-bold text-gray-900">{formatINR(totalInventoryVal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Raw Materials</span>
              <span className="font-bold text-gray-900">{formatINR(rawInventoryVal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Finished Goods</span>
              <span className="font-bold text-gray-900">{formatINR(finishedInventoryVal)}</span>
            </div>
            {inventory.some(i => (i.quantity || 0) < (i.min_stock || 5)) && (
              <div className="bg-red-50 text-red-700 p-2 rounded-md text-xs font-medium flex items-center gap-2 mt-2">
                <AlertTriangle className="h-4 w-4" /> {inventory.filter(i => (i.quantity || 0) < (i.min_stock || 5)).length} Items Low Stock Alert
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM SECTION: AI INSIGHTS & GST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Financial Insights */}
        <Card className="lg:col-span-2 shadow-sm border-indigo-100 bg-indigo-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-indigo-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-600" /> AI Financial Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 bg-green-100 p-1 rounded-full"><TrendingUp className="h-3 w-3 text-green-600" /></div>
                <span className="text-sm text-gray-700">Revenue is up <strong>15%</strong> this month compared to the previous period. Target on track.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 bg-red-100 p-1 rounded-full"><ArrowDownRight className="h-3 w-3 text-red-600" /></div>
                <span className="text-sm text-gray-700">Packaging and Operations costs have increased by <strong>8%</strong>. Consider reviewing vendor contracts.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 bg-orange-100 p-1 rounded-full"><AlertTriangle className="h-3 w-3 text-orange-600" /></div>
                <span className="text-sm text-gray-700"><strong>{formatINR(45000)}</strong> customer payment from Acme Corp is currently overdue by 4 days.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 bg-blue-100 p-1 rounded-full"><Activity className="h-3 w-3 text-blue-600" /></div>
                <span className="text-sm text-gray-700">Current Cash Runway is stable at <strong>{cashRunway} months</strong> based on current burn rate.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* GST & Compliance */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" /> GST & Tax Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">GSTR-1 Status</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">FILED</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">GSTR-3B Due</span>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">20th NEXT MO</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total GST Billed (Sales)</span>
              <span className="font-bold text-gray-900">{formatINR(filteredInvoices.reduce((acc, curr) => acc + (curr.gst_amount || 0), 0))}</span>
            </div>
            <Button className="w-full mt-2" variant="outline" size="sm">Download GSTR Report</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
