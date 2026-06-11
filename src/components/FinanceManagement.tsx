import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Download, 
  Plus, 
  Filter, 
  PieChart, 
  Activity, 
  Building2, 
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Trash2,
  Upload
} from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, Legend } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- Types ---
export interface ExpenseRecord {
  id: string;
  expense_id: string;
  date: string;
  category: string;
  sub_category?: string;
  description: string;
  amount: number;
  gst_amount: number;
  total_amount: number;
  payment_mode: string;
  paid_by_role: string;
  paid_by_name: string;
  beneficiary_name?: string;
  vendor_name?: string;
  invoice_number?: string;
  bill_url?: string;
  project_department?: string;
  remarks?: string;
  reimbursement_status: string;
  approval_date?: string;
  reimbursement_date?: string;
  approved_by?: string;
  transaction_ref_number?: string;
  created_at: string;
}

export interface CapitalContribution {
  id: string;
  founder_name: string;
  capital_contributed: number;
  date: string;
  equity_percentage?: number;
  capital_type?: string;
  authorized_capital_allocation?: number;
  paid_up_capital_allocation?: number;
  created_at: string;
}

const EXPENSE_CATEGORIES = [
  "Office Supplies",
  "Travel & Transport",
  "Software & Subscriptions",
  "Marketing & Advertising",
  "Meals & Entertainment",
  "Legal & Professional Fees",
  "Rent & Utilities",
  "Company Registration",
  "Hardware & Equipment",
  "Miscellaneous"
];

const REGISTRATION_SUBCATEGORIES = [
  "DSC", "DIN", "Name Reservation", "MCA Fees", "Government Fees", 
  "Stamp Duty", "Legal Fees", "CA/CS Fees", "Trademark Fees", 
  "Startup India Fees", "Domain & Hosting", "Miscellaneous Registration Expenses"
];

const PAID_BY_ROLES = ["Founder", "Director", "Employee", "Consultant", "Investor Representative", "Other"];
const STATUSES = ["Pending", "Approved", "Rejected", "Reimbursed"];
const PAYMENT_MODES = ["UPI", "Bank Transfer", "Credit Card", "Debit Card", "Cash", "Wallet"];

export function FinanceManagement() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [capital, setCapital] = useState<CapitalContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Filters
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPaidBy, setFilterPaidBy] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // New Expense State
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<ExpenseRecord>>({
    date: new Date().toISOString().split('T')[0],
    category: "",
    sub_category: "",
    description: "",
    amount: 0,
    gst_amount: 0,
    total_amount: 0,
    payment_mode: "",
    paid_by_role: "",
    paid_by_name: "",
    reimbursement_status: "Pending"
  });

  // New Capital State
  const [isAddingCapital, setIsAddingCapital] = useState(false);
  const [newCapital, setNewCapital] = useState<Partial<CapitalContribution>>({
    date: new Date().toISOString().split('T')[0],
    founder_name: "",
    capital_contributed: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expenseRes, capitalRes] = await Promise.all([
        supabase.from('expense_records').select('*').order('date', { ascending: false }),
        supabase.from('capital_contributions').select('*').order('date', { ascending: false })
      ]);

      if (expenseRes.error) throw expenseRes.error;
      if (capitalRes.error) throw capitalRes.error;

      setExpenses(expenseRes.data || []);
      setCapital(capitalRes.data || []);
    } catch (error: any) {
      console.error("Error fetching finance data:", error);
      toast({ title: "Error", description: "Failed to load financial data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateExpenseId = () => {
    const prefix = "EXP";
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${dateStr}-${random}`;
  };

  const handleAddExpense = async () => {
    if (!newExpense.date || !newExpense.category || !newExpense.amount || !newExpense.paid_by_name) {
      toast({ title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    try {
      const total = Number(newExpense.amount) + Number(newExpense.gst_amount || 0);
      const expenseId = generateExpenseId();

      const { error } = await supabase.from('expense_records').insert([{
        ...newExpense,
        expense_id: expenseId,
        total_amount: total
      }]);

      if (error) throw error;

      toast({ title: "Success", description: "Expense record created." });
      setIsAddingExpense(false);
      fetchData();
    } catch (error: any) {
      console.error("Error adding expense:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const updateData: any = { reimbursement_status: status };
      if (status === 'Approved') updateData.approval_date = new Date().toISOString().split('T')[0];
      if (status === 'Reimbursed') updateData.reimbursement_date = new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('expense_records').update(updateData).eq('id', id);
      if (error) throw error;
      
      toast({ title: "Status Updated", description: `Expense marked as ${status}` });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAddCapital = async () => {
    if (!newCapital.founder_name || !newCapital.capital_contributed || !newCapital.date) {
      toast({ title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from('capital_contributions').insert([newCapital]);
      if (error) throw error;

      toast({ title: "Success", description: "Capital contribution recorded." });
      setIsAddingCapital(false);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const generatePDFReport = (type: string) => {
    const doc = new jsPDF();
    const companyName = "BiovaCo Nexus Private Limited";
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(3, 46, 99); // Brand blue
    doc.text(companyName, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Report Type: ${type}`, 14, 30);
    doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 14, 36);

    let head: any[] = [];
    let body: any[] = [];
    let title = "";

    if (type === "Expense Ledger") {
      title = "Expense Ledger Report";
      head = [["Date", "Expense ID", "Category", "Paid By", "Amount", "Status"]];
      body = expenses.map(e => [
        new Date(e.date).toLocaleDateString(),
        e.expense_id,
        e.category,
        e.paid_by_name,
        `Rs. ${e.total_amount}`,
        e.reimbursement_status
      ]);
    } else if (type === "Capital Contributions") {
      title = "Capital Contributions Report";
      head = [["Date", "Founder Name", "Capital Type", "Equity %", "Amount"]];
      body = capital.map(c => [
        new Date(c.date).toLocaleDateString(),
        c.founder_name,
        c.capital_type || '-',
        c.equity_percentage ? `${c.equity_percentage}%` : '-',
        `Rs. ${c.capital_contributed}`
      ]);
    } else if (type === "Reimbursement Report") {
      title = "Reimbursement Status Report";
      head = [["Date", "ID", "Paid By", "Amount", "Status", "Approval Date"]];
      body = expenses.filter(e => e.reimbursement_status !== 'Rejected').map(e => [
        new Date(e.date).toLocaleDateString(),
        e.expense_id,
        e.paid_by_name,
        `Rs. ${e.total_amount}`,
        e.reimbursement_status,
        e.approval_date ? new Date(e.approval_date).toLocaleDateString() : '-'
      ]);
    } else if (type === "Registration Expenses") {
      title = "Company Registration Expense Summary";
      const regExpenses = expenses.filter(e => e.category === 'Company Registration');
      head = [["Date", "Sub Category", "Description", "Vendor", "Amount"]];
      body = regExpenses.map(e => [
        new Date(e.date).toLocaleDateString(),
        e.sub_category || '-',
        e.description,
        e.vendor_name || '-',
        `Rs. ${e.total_amount}`
      ]);
    }

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(title, 14, 48);

    autoTable(doc, {
      startY: 55,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [3, 46, 99] },
      styles: { fontSize: 8 },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 55;
    
    if (type === "Expense Ledger") {
      const total = expenses.reduce((sum, e) => sum + Number(e.total_amount), 0);
      doc.setFontSize(12);
      doc.text(`Total Expenses: Rs. ${total.toFixed(2)}`, 14, finalY + 10);
    } else if (type === "Capital Contributions") {
      const total = capital.reduce((sum, c) => sum + Number(c.capital_contributed), 0);
      doc.setFontSize(12);
      doc.text(`Total Capital: Rs. ${total.toFixed(2)}`, 14, finalY + 10);
    }

    // Signatures
    doc.setFontSize(10);
    doc.text("_________________________", 14, finalY + 40);
    doc.text("Authorized Signatory", 14, finalY + 45);
    
    doc.text("_________________________", 140, finalY + 40);
    doc.text("Accountant / Director", 140, finalY + 45);

    doc.save(`BiovaCo_${type.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Calculations for Dashboard
  const totalCapital = capital.reduce((sum, c) => sum + Number(c.capital_contributed), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.total_amount), 0);
  const pendingReimbursements = expenses.filter(e => e.reimbursement_status === 'Pending').reduce((sum, e) => sum + Number(e.total_amount), 0);
  const reimbursedAmount = expenses.filter(e => e.reimbursement_status === 'Reimbursed').reduce((sum, e) => sum + Number(e.total_amount), 0);
  const approvedAmount = expenses.filter(e => e.reimbursement_status === 'Approved').reduce((sum, e) => sum + Number(e.total_amount), 0);
  const cashFlow = totalCapital - totalExpenses;

  // Filtered Expenses
  const filteredExpenses = expenses.filter(e => {
    if (filterDateFrom && e.date < filterDateFrom) return false;
    if (filterDateTo && e.date > filterDateTo) return false;
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    if (filterStatus !== 'all' && e.reimbursement_status !== filterStatus) return false;
    if (filterPaidBy && !e.paid_by_name.toLowerCase().includes(filterPaidBy.toLowerCase())) return false;
    return true;
  });

  // Monthly Chart Data
  const monthlyData = (() => {
    const months: Record<string, number> = {};
    expenses.forEach(e => {
      const key = new Date(e.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      months[key] = (months[key] || 0) + Number(e.total_amount);
    });
    return Object.entries(months).map(([name, amount]) => ({ name, amount })).slice(-6);
  })();

  // Registration Expenses
  const registrationExpenses = expenses.filter(e => e.category === 'Company Registration');
  const totalRegistration = registrationExpenses.reduce((s, e) => s + Number(e.total_amount), 0);

  // Delete Expense
  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      const { error } = await supabase.from('expense_records').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Expense record removed.' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // CSV Export
  const exportCSV = () => {
    const headers = 'Date,Expense ID,Category,Description,Paid By,Role,Amount,GST,Total,Payment Mode,Status,Vendor,Invoice\n';
    const rows = filteredExpenses.map(e =>
      `${e.date},${e.expense_id},${e.category},"${e.description}",${e.paid_by_name},${e.paid_by_role},${e.amount},${e.gst_amount},${e.total_amount},${e.payment_mode},${e.reimbursement_status},${e.vendor_name || ''},${e.invoice_number || ''}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BiovaCo_Expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-2 border-b pb-4 overflow-x-auto">
        <Button variant={activeTab === "dashboard" ? "default" : "outline"} onClick={() => setActiveTab("dashboard")}>
          <PieChart className="w-4 h-4 mr-2" /> Dashboard
        </Button>
        <Button variant={activeTab === "expenses" ? "default" : "outline"} onClick={() => setActiveTab("expenses")}>
          <FileText className="w-4 h-4 mr-2" /> Expenses & Reimbursements
        </Button>
        <Button variant={activeTab === "capital" ? "default" : "outline"} onClick={() => setActiveTab("capital")}>
          <Building2 className="w-4 h-4 mr-2" /> Capital Contributions
        </Button>
        <Button variant={activeTab === "reports" ? "default" : "outline"} onClick={() => setActiveTab("reports")}>
          <Download className="w-4 h-4 mr-2" /> Reports
        </Button>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-blue-600 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Total Capital Contributed</p>
                <div className="flex items-center"><IndianRupee className="w-4 h-4 text-gray-400 mr-1" /><h3 className="text-xl font-bold">{totalCapital.toLocaleString('en-IN')}</h3></div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Total Expenses</p>
                <div className="flex items-center"><IndianRupee className="w-4 h-4 text-gray-400 mr-1" /><h3 className="text-xl font-bold">{totalExpenses.toLocaleString('en-IN')}</h3></div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Pending Reimbursements</p>
                <div className="flex items-center"><IndianRupee className="w-4 h-4 text-gray-400 mr-1" /><h3 className="text-xl font-bold">{pendingReimbursements.toLocaleString('en-IN')}</h3></div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Reimbursed Amount</p>
                <div className="flex items-center"><IndianRupee className="w-4 h-4 text-gray-400 mr-1" /><h3 className="text-xl font-bold">{reimbursedAmount.toLocaleString('en-IN')}</h3></div>
              </CardContent>
            </Card>
            <Card className={`border-l-4 shadow-sm ${cashFlow >= 0 ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Cash Flow (Capital - Expenses)</p>
                <div className="flex items-center">
                  {cashFlow >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" /> : <TrendingDown className="w-4 h-4 text-rose-500 mr-1" />}
                  <h3 className={`text-xl font-bold ${cashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>₹{Math.abs(cashFlow).toLocaleString('en-IN')}</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Registration Expenses</p>
                <div className="flex items-center"><IndianRupee className="w-4 h-4 text-gray-400 mr-1" /><h3 className="text-xl font-bold">{totalRegistration.toLocaleString('en-IN')}</h3></div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Monthly Expense Analytics</CardTitle></CardHeader>
              <CardContent className="h-72">
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <RechartsTooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                      <Bar dataKey="amount" fill="#032E63" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-gray-400 py-16">No expense data yet</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Category Breakdown</CardTitle></CardHeader>
              <CardContent className="h-72">
                {(() => {
                  const catData = EXPENSE_CATEGORIES.map(cat => ({ name: cat, value: expenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.total_amount), 0) })).filter(d => d.value > 0);
                  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];
                  return catData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie data={catData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name.substring(0,12)} ${(percent*100).toFixed(0)}%`}>
                          {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip formatter={(v: any) => `₹${v}`} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-center text-gray-400 py-16">No expense data yet</p>;
                })()}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* EXPENSES TAB */}
      {activeTab === "expenses" && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">Expense Records ({filteredExpenses.length})</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}><Filter className="w-4 h-4 mr-1" /> Filters</Button>
              <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" /> CSV</Button>
              <Button variant="outline" size="sm" onClick={() => generatePDFReport("Expense Ledger")}><FileText className="w-4 h-4 mr-1" /> PDF</Button>
              <Button onClick={() => setIsAddingExpense(!isAddingExpense)} className="bg-blue-600 hover:bg-blue-700" size="sm">
                {isAddingExpense ? "Cancel" : <><Plus className="w-4 h-4 mr-1" /> Record Expense</>}
              </Button>
            </div>
          </div>

          {showFilters && (
            <Card className="bg-gray-50/50 border-dashed">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div><label className="text-xs text-gray-500 block mb-1">From Date</label><Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} /></div>
                  <div><label className="text-xs text-gray-500 block mb-1">To Date</label><Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} /></div>
                  <div><label className="text-xs text-gray-500 block mb-1">Category</label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div><label className="text-xs text-gray-500 block mb-1">Status</label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div><label className="text-xs text-gray-500 block mb-1">Paid By</label><Input value={filterPaidBy} onChange={e => setFilterPaidBy(e.target.value)} placeholder="Search name..." /></div>
                </div>
                <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); setFilterCategory("all"); setFilterStatus("all"); setFilterPaidBy(""); }}>Clear All Filters</Button>
              </CardContent>
            </Card>
          )}

          {isAddingExpense && (
            <Card className="border-blue-100 bg-blue-50/30">
              <CardHeader><CardTitle className="text-blue-900">New Expense Entry</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Date *</label><Input type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Category *</label>
                    <Select value={newExpense.category} onValueChange={val => setNewExpense({...newExpense, category: val})}><SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger><SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                  </div>
                  {newExpense.category === "Company Registration" && (
                    <div><label className="text-xs font-medium text-gray-600 mb-1 block">Sub Category</label>
                      <Select value={newExpense.sub_category} onValueChange={val => setNewExpense({...newExpense, sub_category: val})}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{REGISTRATION_SUBCATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                    </div>
                  )}
                  <div className="md:col-span-2"><label className="text-xs font-medium text-gray-600 mb-1 block">Description *</label><Input value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} placeholder="What was this expense for?" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Amount (Base) *</label><Input type="number" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} placeholder="0.00" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">GST Amount</label><Input type="number" value={newExpense.gst_amount || ''} onChange={e => setNewExpense({...newExpense, gst_amount: Number(e.target.value)})} placeholder="0.00" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Total Amount</label><div className="p-2 bg-gray-100 rounded-md font-bold text-gray-800 border">₹ {(Number(newExpense.amount || 0) + Number(newExpense.gst_amount || 0)).toFixed(2)}</div></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Paid By Role *</label>
                    <Select value={newExpense.paid_by_role} onValueChange={val => setNewExpense({...newExpense, paid_by_role: val})}><SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger><SelectContent>{PAID_BY_ROLES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Paid By Name *</label><Input value={newExpense.paid_by_name} onChange={e => setNewExpense({...newExpense, paid_by_name: e.target.value})} placeholder="Name" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Payment Mode *</label>
                    <Select value={newExpense.payment_mode} onValueChange={val => setNewExpense({...newExpense, payment_mode: val})}><SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger><SelectContent>{PAYMENT_MODES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Beneficiary Name</label><Input value={newExpense.beneficiary_name || ''} onChange={e => setNewExpense({...newExpense, beneficiary_name: e.target.value})} placeholder="Beneficiary" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Vendor Name</label><Input value={newExpense.vendor_name || ''} onChange={e => setNewExpense({...newExpense, vendor_name: e.target.value})} placeholder="Vendor" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Invoice Number</label><Input value={newExpense.invoice_number || ''} onChange={e => setNewExpense({...newExpense, invoice_number: e.target.value})} placeholder="INV-123" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Project / Department</label><Input value={newExpense.project_department || ''} onChange={e => setNewExpense({...newExpense, project_department: e.target.value})} placeholder="e.g. R&D" /></div>
                  <div className="md:col-span-2"><label className="text-xs font-medium text-gray-600 mb-1 block">Remarks</label><Input value={newExpense.remarks || ''} onChange={e => setNewExpense({...newExpense, remarks: e.target.value})} placeholder="Any additional notes..." /></div>
                </div>
                <Button onClick={handleAddExpense} className="w-full sm:w-auto bg-blue-600">Save Expense Record</Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>Date & ID</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Paid By</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <div className="font-medium">{new Date(expense.date).toLocaleDateString('en-IN')}</div>
                          <div className="text-xs text-gray-500">{expense.expense_id}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{expense.category}{expense.sub_category ? ` › ${expense.sub_category}` : ''}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">{expense.description}</div>
                          {expense.vendor_name && <div className="text-[10px] text-gray-400">Vendor: {expense.vendor_name}</div>}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{expense.paid_by_name}</div>
                          <div className="text-xs text-gray-500">{expense.paid_by_role}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-gray-900">₹{Number(expense.total_amount).toLocaleString('en-IN')}</div>
                          <div className="text-xs text-gray-500">{expense.payment_mode}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            expense.reimbursement_status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                            expense.reimbursement_status === 'Reimbursed' ? 'bg-green-100 text-green-800' :
                            expense.reimbursement_status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>{expense.reimbursement_status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {expense.reimbursement_status === 'Pending' && (
                              <>
                                <Button size="sm" variant="outline" className="h-7 text-xs bg-blue-50 text-blue-600" onClick={() => handleUpdateStatus(expense.id, 'Approved')}>Approve</Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs bg-red-50 text-red-600" onClick={() => handleUpdateStatus(expense.id, 'Rejected')}>Reject</Button>
                              </>
                            )}
                            {expense.reimbursement_status === 'Approved' && (
                              <Button size="sm" variant="outline" className="h-7 text-xs bg-green-50 text-green-600" onClick={() => handleUpdateStatus(expense.id, 'Reimbursed')}>Mark Paid</Button>
                            )}
                            <Button size="sm" variant="outline" className="h-7 text-xs text-red-400" onClick={() => handleDeleteExpense(expense.id)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredExpenses.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No expenses found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CAPITAL CONTRIBUTIONS TAB */}
      {activeTab === "capital" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Capital Contributions</h3>
            <Button onClick={() => setIsAddingCapital(!isAddingCapital)} className="bg-indigo-600 hover:bg-indigo-700">
              {isAddingCapital ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add Capital</>}
            </Button>
          </div>

          {isAddingCapital && (
            <Card className="border-indigo-100 bg-indigo-50/30">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Date *</label><Input type="date" value={newCapital.date} onChange={e => setNewCapital({...newCapital, date: e.target.value})} /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Founder / Investor Name *</label><Input value={newCapital.founder_name} onChange={e => setNewCapital({...newCapital, founder_name: e.target.value})} placeholder="Name" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Amount Contributed *</label><Input type="number" value={newCapital.capital_contributed || ''} onChange={e => setNewCapital({...newCapital, capital_contributed: Number(e.target.value)})} placeholder="0.00" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Equity %</label><Input type="number" value={newCapital.equity_percentage || ''} onChange={e => setNewCapital({...newCapital, equity_percentage: Number(e.target.value)})} placeholder="e.g. 50" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Capital Type</label>
                    <Select value={newCapital.capital_type} onValueChange={val => setNewCapital({...newCapital, capital_type: val})}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Equity">Equity</SelectItem><SelectItem value="Debt">Debt (Loan)</SelectItem><SelectItem value="Convertible Note">Convertible Note</SelectItem></SelectContent></Select>
                  </div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Authorized Capital Allocation</label><Input type="number" value={newCapital.authorized_capital_allocation || ''} onChange={e => setNewCapital({...newCapital, authorized_capital_allocation: Number(e.target.value)})} placeholder="0.00" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Paid-Up Capital Allocation</label><Input type="number" value={newCapital.paid_up_capital_allocation || ''} onChange={e => setNewCapital({...newCapital, paid_up_capital_allocation: Number(e.target.value)})} placeholder="0.00" /></div>
                </div>
                <Button onClick={handleAddCapital} className="bg-indigo-600">Save Capital Entry</Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Equity %</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {capital.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{new Date(c.date).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell className="font-medium text-gray-900">{c.founder_name}</TableCell>
                      <TableCell><Badge variant="outline">{c.capital_type || 'Equity'}</Badge></TableCell>
                      <TableCell>{c.equity_percentage ? `${c.equity_percentage}%` : '-'}</TableCell>
                      <TableCell className="font-bold text-gray-900">₹{Number(c.capital_contributed).toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}
                  {capital.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No capital contributions recorded yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Generate Professional PDF Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { type: "Expense Ledger", desc: "Complete list of all expenses", icon: <FileText className="w-7 h-7" />, color: "blue" },
              { type: "Capital Contributions", desc: "Funds injected by founders", icon: <Building2 className="w-7 h-7" />, color: "indigo" },
              { type: "Reimbursement Report", desc: "Pending & completed reimbursements", icon: <CheckCircle className="w-7 h-7" />, color: "green" },
              { type: "Registration Expenses", desc: "Company registration costs", icon: <Briefcase className="w-7 h-7" />, color: "purple" },
            ].map(r => (
              <Card key={r.type} className={`hover:border-${r.color}-300 transition-colors cursor-pointer`} onClick={() => generatePDFReport(r.type)}>
                <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
                  <div className={`p-3 bg-${r.color}-50 text-${r.color}-600 rounded-full`}>{r.icon}</div>
                  <h3 className="font-bold text-gray-900">{r.type}</h3>
                  <p className="text-xs text-gray-500">{r.desc}</p>
                  <Button variant="outline" size="sm" className="w-full"><Download className="w-4 h-4 mr-1" /> PDF</Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="mt-4 border-dashed">
            <CardContent className="p-4 flex flex-wrap gap-3 items-center justify-center">
              <p className="text-sm text-gray-600 mr-2">Quick Export:</p>
              <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" /> Export All as CSV</Button>
              <Button variant="outline" size="sm" onClick={() => generatePDFReport("Expense Ledger")}><FileText className="w-4 h-4 mr-1" /> Full Ledger PDF</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
