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
  Upload,
  Edit,
  Wallet
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

export interface IncomeRecord {
  id: string;
  income_id: string;
  date: string;
  source: string;
  description: string;
  amount: number;
  gst_amount: number;
  total_amount: number;
  payment_mode: string;
  transaction_reference?: string;
  client_name?: string;
  invoice_number?: string;
  status: string;
  created_at: string;
}

export interface CapitalContribution {
  id: string;
  founder_name: string;
  capital_contributed: number;
  date: string;
  equity_percentage?: number;
  capital_type?: string;
  payment_mode?: string;
  transaction_reference?: string;
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

const INCOME_SOURCES = [
  "Product Sales",
  "Service Revenue",
  "Consulting Fees",
  "Subscription",
  "Interest Income",
  "Other Income"
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
  const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
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
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState<Partial<ExpenseRecord>>({
    date: new Date().toISOString().split('T')[0],
    category: "",
    sub_category: "",
    description: "",
    amount: 0,
    gst_amount: 0,
    total_amount: 0,
    payment_mode: "",
    transaction_ref_number: "",
    paid_by_role: "",
    paid_by_name: "",
    reimbursement_status: "Pending"
  });

  // New Capital State
  const [isAddingCapital, setIsAddingCapital] = useState(false);
  const [editingCapitalId, setEditingCapitalId] = useState<string | null>(null);
  const [newCapital, setNewCapital] = useState<Partial<CapitalContribution>>({
    date: new Date().toISOString().split('T')[0],
    founder_name: "",
    capital_contributed: 0,
    payment_mode: "",
    transaction_reference: "",
  });

  // New Income State
  const [isAddingIncome, setIsAddingIncome] = useState(false);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [newIncome, setNewIncome] = useState<Partial<IncomeRecord>>({
    date: new Date().toISOString().split('T')[0],
    source: "",
    description: "",
    amount: 0,
    gst_amount: 0,
    total_amount: 0,
    payment_mode: "",
    status: "Received"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expenseRes, capitalRes, incomeRes] = await Promise.all([
        supabase.from('expense_records').select('*').order('date', { ascending: false }),
        supabase.from('capital_contributions').select('*').order('date', { ascending: false }),
        supabase.from('income_records').select('*').order('date', { ascending: false })
      ]);

      if (expenseRes.error) throw expenseRes.error;
      if (capitalRes.error) throw capitalRes.error;
      if (incomeRes.error && incomeRes.error.code !== '42P01') throw incomeRes.error; // Ignore if table doesn't exist yet

      setExpenses(expenseRes.data || []);
      setCapital(capitalRes.data || []);
      setIncomes(incomeRes.data || []);
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

      if (editingExpenseId) {
        const { error } = await supabase.from('expense_records').update({
          ...newExpense,
          total_amount: total
        }).eq('id', editingExpenseId);
        if (error) throw error;
        toast({ title: "Success", description: "Expense record updated." });
      } else {
        const expenseId = generateExpenseId();
        const { error } = await supabase.from('expense_records').insert([{
          ...newExpense,
          expense_id: expenseId,
          total_amount: total
        }]);
        if (error) throw error;
        toast({ title: "Success", description: "Expense record created." });
      }

      setIsAddingExpense(false);
      setEditingExpenseId(null);
      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        category: "",
        sub_category: "",
        description: "",
        amount: 0,
        gst_amount: 0,
        total_amount: 0,
        payment_mode: "",
        transaction_ref_number: "",
        paid_by_role: "",
        paid_by_name: "",
        beneficiary_name: "",
        vendor_name: "",
        invoice_number: "",
        project_department: "",
        remarks: "",
        reimbursement_status: "Pending"
      });
      fetchData();
    } catch (error: any) {
      console.error("Error saving expense:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEditExpense = (expenseItem: ExpenseRecord) => {
    setNewExpense({ ...expenseItem });
    setEditingExpenseId(expenseItem.id);
    setIsAddingExpense(true);
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
      if (editingCapitalId) {
        const { error } = await supabase.from('capital_contributions').update(newCapital).eq('id', editingCapitalId);
        if (error) throw error;
        toast({ title: "Success", description: "Capital contribution updated." });
      } else {
        const { error } = await supabase.from('capital_contributions').insert([newCapital]);
        if (error) throw error;
        toast({ title: "Success", description: "Capital contribution recorded." });
      }

      setIsAddingCapital(false);
      setEditingCapitalId(null);
      setNewCapital({
        date: new Date().toISOString().split('T')[0],
        founder_name: "",
        capital_contributed: 0,
        equity_percentage: undefined,
        capital_type: undefined,
        payment_mode: "",
        transaction_reference: "",
        authorized_capital_allocation: undefined,
        paid_up_capital_allocation: undefined,
      });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEditCapital = (capitalItem: CapitalContribution) => {
    setNewCapital({ ...capitalItem });
    setEditingCapitalId(capitalItem.id);
    setIsAddingCapital(true);
  };

  const handleDeleteCapital = async (id: string) => {
    if (!confirm('Are you sure you want to delete this capital entry?')) return;
    try {
      const { error } = await supabase.from('capital_contributions').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Capital contribution removed.' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const generateIncomeId = () => {
    const prefix = "INC";
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${dateStr}-${random}`;
  };

  const handleAddIncome = async () => {
    if (!newIncome.date || !newIncome.source || !newIncome.amount) {
      toast({ title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    try {
      const total = Number(newIncome.amount) + Number(newIncome.gst_amount || 0);

      if (editingIncomeId) {
        const { error } = await supabase.from('income_records').update({
          ...newIncome,
          total_amount: total
        }).eq('id', editingIncomeId);
        if (error) throw error;
        toast({ title: "Success", description: "Income record updated." });
      } else {
        const incomeId = generateIncomeId();
        const { error } = await supabase.from('income_records').insert([{
          ...newIncome,
          income_id: incomeId,
          total_amount: total
        }]);
        if (error) throw error;
        toast({ title: "Success", description: "Income record created." });
      }

      setIsAddingIncome(false);
      setEditingIncomeId(null);
      setNewIncome({
        date: new Date().toISOString().split('T')[0],
        source: "",
        description: "",
        amount: 0,
        gst_amount: 0,
        total_amount: 0,
        payment_mode: "",
        transaction_reference: "",
        client_name: "",
        invoice_number: "",
        status: "Received"
      });
      fetchData();
    } catch (error: any) {
      console.error("Error saving income:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEditIncome = (incomeItem: IncomeRecord) => {
    setNewIncome({ ...incomeItem });
    setEditingIncomeId(incomeItem.id);
    setIsAddingIncome(true);
  };

  const handleDeleteIncome = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income record?')) return;
    try {
      const { error } = await supabase.from('income_records').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Income record removed.' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleUpdateIncomeStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('income_records').update({ status }).eq('id', id);
      if (error) throw error;
      toast({ title: "Status Updated", description: `Income marked as ${status}` });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const generatePDFReport = (type: string) => {
    const doc = new jsPDF();
    const companyName = "BiovaCo Nexus Private Limited";
    const reportNo = `RPT-${Date.now().toString(36).toUpperCase()}`;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // --- Professional B&W Header ---
    doc.setDrawColor(0);
    doc.setLineWidth(0.8);
    doc.line(14, 12, pageWidth - 14, 12);

    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 14, 22);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text('CIN: U01100MH2026PTC000000  |  Registered Office: Dhamangaon Railway, Maharashtra', 14, 27);

    doc.setLineWidth(0.3);
    doc.line(14, 30, pageWidth - 14, 30);

    // Report meta (right-aligned)
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.text(`Report No: ${reportNo}`, pageWidth - 14, 18, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth - 14, 23, { align: 'right' });

    let head: any[] = [];
    let body: any[] = [];
    let title = "";
    let totalLabel = "";
    let totalValue = 0;

    if (type === "Expense Ledger") {
      title = "EXPENSE LEDGER";
      head = [["#", "Date & ID", "Category & Desc", "Vendor & Details", "Paid By & Mode", "Amount (Rs.)", "Status"]];
      body = expenses.map((e, i) => [
        i + 1, 
        `${new Date(e.date).toLocaleDateString('en-IN')}\n${e.expense_id}`, 
        `${e.category}\n${e.description}`, 
        `Vendor: ${e.vendor_name || '-'}\nBen: ${e.beneficiary_name || '-'}\nInv: ${e.invoice_number || '-'}`, 
        `${e.paid_by_name} (${e.paid_by_role})\n${e.payment_mode}${e.transaction_ref_number ? `\nRef: ${e.transaction_ref_number}` : ''}`, 
        Number(e.total_amount).toLocaleString('en-IN'), 
        e.reimbursement_status
      ]);
      totalLabel = "Total Expenses";
      totalValue = expenses.reduce((s, e) => s + Number(e.total_amount), 0);
    } else if (type === "Capital Contributions") {
      title = "CAPITAL CONTRIBUTIONS";
      head = [["#", "Date", "Founder / Investor", "Capital Type", "Equity %", "Payment Details", "Amount (Rs.)"]];
      body = capital.map((c, i) => [
        i + 1, new Date(c.date).toLocaleDateString('en-IN'), c.founder_name, c.capital_type || 'Equity', c.equity_percentage ? `${c.equity_percentage}%` : '-', `${c.payment_mode || '-'} ${c.transaction_reference ? `(${c.transaction_reference})` : ''}`, Number(c.capital_contributed).toLocaleString('en-IN')
      ]);
      totalLabel = "Total Capital";
      totalValue = capital.reduce((s, c) => s + Number(c.capital_contributed), 0);
    } else if (type === "Reimbursement Report") {
      title = "REIMBURSEMENT STATUS REPORT";
      head = [["#", "Date", "ID", "Paid By", "Amount (Rs.)", "Status", "Approval Date"]];
      body = expenses.filter(e => e.reimbursement_status !== 'Rejected').map((e, i) => [
        i + 1, new Date(e.date).toLocaleDateString('en-IN'), e.expense_id, e.paid_by_name, Number(e.total_amount).toLocaleString('en-IN'), e.reimbursement_status, e.approval_date ? new Date(e.approval_date).toLocaleDateString('en-IN') : '-'
      ]);
      totalLabel = "Total Reimbursable";
      totalValue = expenses.filter(e => e.reimbursement_status !== 'Rejected').reduce((s, e) => s + Number(e.total_amount), 0);
    } else if (type === "Registration Expenses") {
      title = "COMPANY REGISTRATION EXPENSES";
      const reg = expenses.filter(e => e.category === 'Company Registration');
      head = [["#", "Date", "Sub Category", "Description", "Vendor", "Amount (Rs.)"]];
      body = reg.map((e, i) => [
        i + 1, new Date(e.date).toLocaleDateString('en-IN'), e.sub_category || '-', e.description, e.vendor_name || '-', Number(e.total_amount).toLocaleString('en-IN')
      ]);
      totalLabel = "Total Registration Cost";
      totalValue = reg.reduce((s, e) => s + Number(e.total_amount), 0);
    } else if (type === "Income Ledger") {
      title = "INCOME LEDGER REPORT";
      head = [["#", "Date", "Income ID", "Source", "Client", "Amount (Rs.)", "Status"]];
      body = incomes.map((inc, i) => [
        i + 1, new Date(inc.date).toLocaleDateString('en-IN'), inc.income_id, inc.source, inc.client_name || '-', Number(inc.total_amount).toLocaleString('en-IN'), inc.status
      ]);
      totalLabel = "Total Income";
      totalValue = incomes.filter(inc => inc.status === 'Received').reduce((s, inc) => s + Number(inc.total_amount), 0);
    }

    // Title
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(title, 14, 40);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text(`Reporting Period: All Records  |  Total Entries: ${body.length}`, 14, 46);

    // Table - Strict Black & White
    autoTable(doc, {
      startY: 52,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 7, lineWidth: 0.3, lineColor: [0, 0, 0] },
      bodyStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 7, lineWidth: 0.3, lineColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      styles: { cellPadding: 2.5 },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 52;

    // Total line
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(14, finalY + 5, pageWidth - 14, finalY + 5);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(`${totalLabel}: Rs. ${totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 14, finalY + 12, { align: 'right' });

    // Signatures
    const sigY = finalY + 40;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.line(14, sigY, 70, sigY);
    doc.text('Prepared By', 14, sigY + 5);
    doc.line(85, sigY, 135, sigY);
    doc.text('Verified By', 85, sigY + 5);
    doc.line(145, sigY, pageWidth - 14, sigY);
    doc.text('Authorized Signatory', 145, sigY + 5);

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(0);
    doc.text('This is a system-generated document. No signature is required for internal records.', 14, sigY + 15);
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')} | ${companyName}`, 14, sigY + 20);

    doc.save(`BiovaCo_${type.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Calculations for Dashboard
  const totalCapital = capital.reduce((sum, c) => sum + Number(c.capital_contributed), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.total_amount), 0);
  const totalIncome = incomes.filter(i => i.status === 'Received').reduce((sum, i) => sum + Number(i.total_amount), 0);
  const pendingIncome = incomes.filter(i => i.status === 'Pending').reduce((sum, i) => sum + Number(i.total_amount), 0);
  const pendingReimbursements = expenses.filter(e => e.reimbursement_status === 'Pending').reduce((sum, e) => sum + Number(e.total_amount), 0);
  const reimbursedAmount = expenses.filter(e => e.reimbursement_status === 'Reimbursed').reduce((sum, e) => sum + Number(e.total_amount), 0);
  const netProfitLoss = totalIncome - totalExpenses;
  const cashFlow = totalCapital + totalIncome - totalExpenses;

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

  // CSV Export for Expenses
  const exportCSV = () => {
    const headers = 'Date,Expense ID,Category,Description,Paid By,Role,Amount,GST,Total,Payment Mode,Txn Ref,Status,Vendor,Invoice\n';
    const rows = filteredExpenses.map(e =>
      `${e.date},${e.expense_id},${e.category},"${e.description}",${e.paid_by_name},${e.paid_by_role},${e.amount},${e.gst_amount},${e.total_amount},${e.payment_mode},${e.transaction_ref_number || ''},${e.reimbursement_status},${e.vendor_name || ''},${e.invoice_number || ''}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BiovaCo_Expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // CSV Export for Income
  const exportIncomeCSV = () => {
    const headers = 'Date,Income ID,Source,Description,Client,Amount,GST,Total,Payment Mode,Status,Invoice\n';
    const rows = incomes.map(inc =>
      `${inc.date},${inc.income_id},${inc.source},"${inc.description}",${inc.client_name || ''},${inc.amount},${inc.gst_amount},${inc.total_amount},${inc.payment_mode},${inc.status},${inc.invoice_number || ''}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BiovaCo_Income_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        <Button variant={activeTab === "dashboard" ? "default" : "outline"} onClick={() => setActiveTab("dashboard")} className="flex-1 sm:flex-none">
          <PieChart className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Dashboard</span>
        </Button>
        <Button variant={activeTab === "income" ? "default" : "outline"} onClick={() => setActiveTab("income")} className="flex-1 sm:flex-none">
          <Wallet className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Income</span>
        </Button>
        <Button variant={activeTab === "expenses" ? "default" : "outline"} onClick={() => setActiveTab("expenses")} className="flex-1 sm:flex-none">
          <FileText className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Expenses</span>
        </Button>
        <Button variant={activeTab === "capital" ? "default" : "outline"} onClick={() => setActiveTab("capital")} className="flex-1 sm:flex-none">
          <Building2 className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Capital</span>
        </Button>
        <Button variant={activeTab === "reports" ? "default" : "outline"} onClick={() => setActiveTab("reports")} className="flex-1 sm:flex-none">
          <Download className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Reports</span>
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
            <Card className="border-l-4 border-l-emerald-600 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Total Received Income</p>
                <div className="flex items-center"><IndianRupee className="w-4 h-4 text-emerald-500 mr-1" /><h3 className="text-xl font-bold text-emerald-700">{totalIncome.toLocaleString('en-IN')}</h3></div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Total Expenses</p>
                <div className="flex items-center"><IndianRupee className="w-4 h-4 text-red-500 mr-1" /><h3 className="text-xl font-bold text-red-700">{totalExpenses.toLocaleString('en-IN')}</h3></div>
              </CardContent>
            </Card>
            <Card className={`border-l-4 shadow-sm ${netProfitLoss >= 0 ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Net Profit / Loss</p>
                <div className="flex items-center">
                  {netProfitLoss >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" /> : <TrendingDown className="w-4 h-4 text-rose-500 mr-1" />}
                  <h3 className={`text-xl font-bold ${netProfitLoss >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>₹{Math.abs(netProfitLoss).toLocaleString('en-IN')}</h3>
                </div>
              </CardContent>
            </Card>
            <Card className={`border-l-4 shadow-sm ${cashFlow >= 0 ? 'border-l-blue-500' : 'border-l-rose-500'}`}>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Available Cash Flow</p>
                <div className="flex items-center">
                  {cashFlow >= 0 ? <TrendingUp className="w-4 h-4 text-blue-500 mr-1" /> : <TrendingDown className="w-4 h-4 text-rose-500 mr-1" />}
                  <h3 className={`text-xl font-bold ${cashFlow >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>₹{Math.abs(cashFlow).toLocaleString('en-IN')}</h3>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Pending Reimbursements</p>
                <div className="flex items-center"><IndianRupee className="w-4 h-4 text-gray-400 mr-1" /><h3 className="text-xl font-bold">{pendingReimbursements.toLocaleString('en-IN')}</h3></div>
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

      {/* INCOME TAB */}
      {activeTab === "income" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-800">Income Management</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={exportIncomeCSV} className="flex-1 sm:flex-none"><Download className="w-4 h-4 mr-1" /> CSV</Button>
              <Button variant="outline" size="sm" onClick={() => generatePDFReport("Income Ledger")} className="flex-1 sm:flex-none"><FileText className="w-4 h-4 mr-1" /> PDF</Button>
              <Button onClick={() => {
                if (isAddingIncome) {
                  setIsAddingIncome(false);
                  setEditingIncomeId(null);
                  setNewIncome({
                    date: new Date().toISOString().split('T')[0],
                    source: "",
                    description: "",
                    amount: 0,
                    gst_amount: 0,
                    total_amount: 0,
                    payment_mode: "",
                    transaction_reference: "",
                    client_name: "",
                    invoice_number: "",
                    status: "Received"
                  });
                } else {
                  setIsAddingIncome(true);
                }
              }} className="bg-emerald-600 hover:bg-emerald-700" size="sm">
                {isAddingIncome ? "Cancel" : <><Plus className="w-4 h-4 mr-1" /> Record Income</>}
              </Button>
            </div>
          </div>

          {isAddingIncome && (
            <Card className="border-emerald-100 bg-emerald-50/30">
              <CardHeader><CardTitle className="text-emerald-900">{editingIncomeId ? "Edit Income Entry" : "New Income Entry"}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Date *</label><Input type="date" value={newIncome.date} onChange={e => setNewIncome({...newIncome, date: e.target.value})} /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Source *</label>
                    <Select value={newIncome.source} onValueChange={val => setNewIncome({...newIncome, source: val})}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{INCOME_SOURCES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Base Amount (₹) *</label><Input type="number" value={newIncome.amount || ''} onChange={e => setNewIncome({...newIncome, amount: Number(e.target.value)})} placeholder="0.00" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">GST Amount (₹)</label><Input type="number" value={newIncome.gst_amount || ''} onChange={e => setNewIncome({...newIncome, gst_amount: Number(e.target.value)})} placeholder="0.00" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Payment Mode</label>
                    <Select value={newIncome.payment_mode} onValueChange={val => setNewIncome({...newIncome, payment_mode: val})}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{PAYMENT_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Transaction Ref / UPI</label><Input value={newIncome.transaction_reference || ''} onChange={e => setNewIncome({...newIncome, transaction_reference: e.target.value})} placeholder="Ref No" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Client / Customer Name</label><Input value={newIncome.client_name || ''} onChange={e => setNewIncome({...newIncome, client_name: e.target.value})} placeholder="Client Name" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Invoice Number</label><Input value={newIncome.invoice_number || ''} onChange={e => setNewIncome({...newIncome, invoice_number: e.target.value})} placeholder="INV-..." /></div>
                  <div className="md:col-span-3"><label className="text-xs font-medium text-gray-600 mb-1 block">Description</label><Input value={newIncome.description || ''} onChange={e => setNewIncome({...newIncome, description: e.target.value})} placeholder="Payment for..." /></div>
                </div>
                <Button onClick={handleAddIncome} className="w-full sm:w-auto bg-emerald-600">{editingIncomeId ? "Update Income Record" : "Save Income Record"}</Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {/* Mobile View */}
              <div className="block sm:hidden divide-y">
                {incomes.map((inc) => (
                  <div key={inc.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{new Date(inc.date).toLocaleDateString('en-IN')}</div>
                        <div className="text-xs text-gray-500 font-mono">{inc.income_id}</div>
                      </div>
                      <Badge className={inc.status === 'Received' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}>{inc.status}</Badge>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-1">{inc.source}</Badge>
                      <div className="text-sm font-medium">{inc.client_name}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-emerald-700">₹{Number(inc.total_amount).toLocaleString('en-IN')}</div>
                        <div className="text-xs text-gray-500">{inc.payment_mode || 'Cash'}</div>
                      </div>
                      <div className="flex space-x-1">
                        {inc.status === 'Pending' && (
                          <Button size="icon" variant="outline" className="h-8 w-8 bg-emerald-50 text-emerald-600" onClick={() => handleUpdateIncomeStatus(inc.id, 'Received')}><CheckCircle className="w-4 h-4" /></Button>
                        )}
                        <Button size="icon" variant="outline" className="h-8 w-8 text-blue-600" onClick={() => handleEditIncome(inc)}><Edit className="w-4 h-4" /></Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 text-red-400" onClick={() => handleDeleteIncome(inc.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
                {incomes.length === 0 && <div className="text-center py-8 text-gray-500 text-sm">No income records found.</div>}
              </div>

              {/* Desktop View */}
              <div className="hidden sm:block overflow-x-auto w-full">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>Date / ID</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="hidden sm:table-cell">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomes.map((inc) => (
                      <TableRow key={inc.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">{new Date(inc.date).toLocaleDateString('en-IN')}</div>
                          <div className="text-xs text-gray-500 font-mono">{inc.income_id}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="mb-1">{inc.source}</Badge>
                          <div className="text-xs font-medium hidden sm:block">{inc.client_name}</div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm hidden md:table-cell" title={inc.description}>{inc.description}</TableCell>
                        <TableCell>
                          <div className="font-bold text-emerald-700">₹{Number(inc.total_amount).toLocaleString('en-IN')}</div>
                          <div className="text-xs text-gray-500">{inc.payment_mode || 'Cash'}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge className={inc.status === 'Received' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}>{inc.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            {inc.status === 'Pending' && (
                              <Button size="sm" variant="outline" className="h-7 text-xs bg-emerald-50 text-emerald-600" onClick={() => handleUpdateIncomeStatus(inc.id, 'Received')}><CheckCircle className="w-3 h-3 mr-1" /> Mark Received</Button>
                            )}
                            <Button size="sm" variant="outline" className="h-7 text-xs text-blue-600" onClick={() => handleEditIncome(inc)}><Edit className="w-3 h-3" /></Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs text-red-400" onClick={() => handleDeleteIncome(inc.id)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {incomes.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No income records found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* EXPENSES TAB */}
      {activeTab === "expenses" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-800">Expense Records ({filteredExpenses.length})</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}><Filter className="w-4 h-4 mr-1" /> Filters</Button>
              <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" /> CSV</Button>
              <Button variant="outline" size="sm" onClick={() => generatePDFReport("Expense Ledger")}><FileText className="w-4 h-4 mr-1" /> PDF</Button>
              <Button onClick={() => {
                if (isAddingExpense) {
                  setIsAddingExpense(false);
                  setEditingExpenseId(null);
                  setNewExpense({
                    date: new Date().toISOString().split('T')[0],
                    category: "",
                    sub_category: "",
                    description: "",
                    amount: 0,
                    gst_amount: 0,
                    total_amount: 0,
                    payment_mode: "",
                    transaction_ref_number: "",
                    paid_by_role: "",
                    paid_by_name: "",
                    reimbursement_status: "Pending"
                  });
                } else {
                  setIsAddingExpense(true);
                }
              }} className="bg-blue-600 hover:bg-blue-700" size="sm">
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
              <CardHeader><CardTitle className="text-blue-900">{editingExpenseId ? "Edit Expense Entry" : "New Expense Entry"}</CardTitle></CardHeader>
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
                  {(newExpense.payment_mode === 'UPI' || newExpense.payment_mode === 'Bank Transfer') && (
                    <div><label className="text-xs font-medium text-gray-600 mb-1 block">UPI ID / Txn Ref *</label><Input value={newExpense.transaction_ref_number || ''} onChange={e => setNewExpense({...newExpense, transaction_ref_number: e.target.value})} placeholder="Ref/Txn No" /></div>
                  )}
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Beneficiary Name</label><Input value={newExpense.beneficiary_name || ''} onChange={e => setNewExpense({...newExpense, beneficiary_name: e.target.value})} placeholder="Beneficiary" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Vendor Name</label><Input value={newExpense.vendor_name || ''} onChange={e => setNewExpense({...newExpense, vendor_name: e.target.value})} placeholder="Vendor" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Invoice Number</label><Input value={newExpense.invoice_number || ''} onChange={e => setNewExpense({...newExpense, invoice_number: e.target.value})} placeholder="INV-123" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Project / Department</label><Input value={newExpense.project_department || ''} onChange={e => setNewExpense({...newExpense, project_department: e.target.value})} placeholder="e.g. R&D" /></div>
                  <div className="md:col-span-2"><label className="text-xs font-medium text-gray-600 mb-1 block">Remarks</label><Input value={newExpense.remarks || ''} onChange={e => setNewExpense({...newExpense, remarks: e.target.value})} placeholder="Any additional notes..." /></div>
                </div>
                <Button onClick={handleAddExpense} className="w-full sm:w-auto bg-blue-600">{editingExpenseId ? "Update Expense Record" : "Save Expense Record"}</Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {/* Mobile View */}
              <div className="block sm:hidden divide-y">
                {filteredExpenses.map((expense) => (
                  <div key={expense.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{new Date(expense.date).toLocaleDateString('en-IN')}</div>
                        <div className="text-xs text-gray-500">{expense.expense_id}</div>
                      </div>
                      <Badge className={
                        expense.reimbursement_status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                        expense.reimbursement_status === 'Reimbursed' ? 'bg-green-100 text-green-800' :
                        expense.reimbursement_status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>{expense.reimbursement_status}</Badge>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-800">{expense.category}</div>
                      <div className="text-xs text-gray-600 mt-1">{expense.description}</div>
                      <div className="text-xs text-gray-500 mt-1">Paid by: {expense.paid_by_name} • {expense.payment_mode} {expense.transaction_ref_number ? `(${expense.transaction_ref_number})` : ''}</div>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <div className="font-bold text-gray-900 text-lg">₹{Number(expense.total_amount).toLocaleString('en-IN')}</div>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {expense.reimbursement_status === 'Pending' && (
                          <>
                            <Button size="icon" variant="outline" className="h-8 w-8 bg-blue-50 text-blue-600" onClick={() => handleUpdateStatus(expense.id, 'Approved')}><CheckCircle className="w-4 h-4" /></Button>
                            <Button size="icon" variant="outline" className="h-8 w-8 bg-red-50 text-red-600" onClick={() => handleUpdateStatus(expense.id, 'Rejected')}><X className="w-4 h-4" /></Button>
                          </>
                        )}
                        {expense.reimbursement_status === 'Approved' && (
                          <Button size="sm" variant="outline" className="h-8 text-xs bg-green-50 text-green-600" onClick={() => handleUpdateStatus(expense.id, 'Reimbursed')}>Mark Paid</Button>
                        )}
                        <Button size="icon" variant="outline" className="h-8 w-8 text-blue-600" onClick={() => handleEditExpense(expense)}><Edit className="w-4 h-4" /></Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 text-red-400" onClick={() => handleDeleteExpense(expense.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredExpenses.length === 0 && <div className="text-center py-8 text-gray-500 text-sm">No expenses found.</div>}
              </div>

              {/* Desktop View */}
              <div className="hidden sm:block overflow-x-auto w-full">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="hidden md:table-cell">Paid By</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="hidden sm:table-cell">Status</TableHead>
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
                          <div className="font-medium text-sm">{expense.category}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[150px] hidden sm:block">{expense.description}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm font-medium">{expense.paid_by_name}</div>
                          <div className="text-xs text-gray-500">{expense.paid_by_role}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-gray-900">₹{Number(expense.total_amount).toLocaleString('en-IN')}</div>
                          <div className="text-xs text-gray-500">{expense.payment_mode} {expense.transaction_ref_number ? `(${expense.transaction_ref_number})` : ''}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
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
                            <Button size="sm" variant="outline" className="h-7 text-xs text-blue-600" onClick={() => handleEditExpense(expense)}><Edit className="w-3 h-3" /></Button>
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-800">Capital Contributions</h3>
            <Button onClick={() => {
              if (isAddingCapital) {
                setIsAddingCapital(false);
                setEditingCapitalId(null);
                setNewCapital({
                  date: new Date().toISOString().split('T')[0],
                  founder_name: "",
                  capital_contributed: 0,
                  payment_mode: "",
                  transaction_reference: "",
                });
              } else {
                setIsAddingCapital(true);
              }
            }} className="bg-indigo-600 hover:bg-indigo-700">
              {isAddingCapital ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add Capital</>}
            </Button>
          </div>

          {isAddingCapital && (
            <Card className="border-indigo-100 bg-indigo-50/30">
              <CardHeader>
                <CardTitle className="text-indigo-900">{editingCapitalId ? "Edit Capital Entry" : "New Capital Entry"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Date *</label><Input type="date" value={newCapital.date} onChange={e => setNewCapital({...newCapital, date: e.target.value})} /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Founder / Investor Name *</label><Input value={newCapital.founder_name} onChange={e => setNewCapital({...newCapital, founder_name: e.target.value})} placeholder="Name" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Amount Contributed *</label><Input type="number" value={newCapital.capital_contributed || ''} onChange={e => setNewCapital({...newCapital, capital_contributed: Number(e.target.value)})} placeholder="0.00" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Equity %</label><Input type="number" value={newCapital.equity_percentage || ''} onChange={e => setNewCapital({...newCapital, equity_percentage: Number(e.target.value)})} placeholder="e.g. 50" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Capital Type</label>
                    <Select value={newCapital.capital_type} onValueChange={val => setNewCapital({...newCapital, capital_type: val})}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Equity">Equity</SelectItem><SelectItem value="Debt">Debt (Loan)</SelectItem><SelectItem value="Convertible Note">Convertible Note</SelectItem></SelectContent></Select>
                  </div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Payment Mode</label>
                    <Select value={newCapital.payment_mode} onValueChange={val => setNewCapital({...newCapital, payment_mode: val})}><SelectTrigger><SelectValue placeholder="Select Mode" /></SelectTrigger><SelectContent><SelectItem value="UPI">UPI</SelectItem><SelectItem value="Bank Transfer">Bank Transfer</SelectItem><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Cheque">Cheque</SelectItem></SelectContent></Select>
                  </div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">{newCapital.payment_mode === "UPI" ? "UPI ID / Ref No" : newCapital.payment_mode === "Bank Transfer" ? "Transaction ID" : "Reference No"}</label><Input value={newCapital.transaction_reference || ''} onChange={e => setNewCapital({...newCapital, transaction_reference: e.target.value})} placeholder="Ref No" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Authorized Capital Allocation</label><Input type="number" value={newCapital.authorized_capital_allocation || ''} onChange={e => setNewCapital({...newCapital, authorized_capital_allocation: Number(e.target.value)})} placeholder="0.00" /></div>
                  <div><label className="text-xs font-medium text-gray-600 mb-1 block">Paid-Up Capital Allocation</label><Input type="number" value={newCapital.paid_up_capital_allocation || ''} onChange={e => setNewCapital({...newCapital, paid_up_capital_allocation: Number(e.target.value)})} placeholder="0.00" /></div>
                </div>
                <Button onClick={handleAddCapital} className="w-full sm:w-auto bg-indigo-600">{editingCapitalId ? "Update Capital Entry" : "Save Capital Entry"}</Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {/* Mobile View */}
              <div className="block sm:hidden divide-y">
                {capital.map((c) => (
                  <div key={c.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-gray-900">{new Date(c.date).toLocaleDateString('en-IN')}</div>
                      <Badge variant="outline">{c.capital_type || 'Equity'}</Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium">{c.founder_name}</div>
                      <div className="text-xs text-gray-500 mt-1">Payment Mode: {c.payment_mode || 'N/A'}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-gray-900 text-lg">₹{Number(c.capital_contributed).toLocaleString('en-IN')}</div>
                      <div className="flex space-x-2">
                        <Button size="icon" variant="outline" className="h-8 w-8 text-blue-600" onClick={() => handleEditCapital(c)}><Edit className="w-4 h-4" /></Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 text-red-400" onClick={() => handleDeleteCapital(c.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
                {capital.length === 0 && <div className="text-center py-8 text-gray-500 text-sm">No capital contributions recorded yet.</div>}
              </div>

              {/* Desktop View */}
              <div className="hidden sm:block overflow-x-auto w-full">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Type</TableHead>
                      <TableHead className="hidden md:table-cell">Equity</TableHead>
                      <TableHead className="hidden lg:table-cell">Mode</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {capital.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{new Date(c.date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell className="font-medium text-gray-900">{c.founder_name}</TableCell>
                        <TableCell className="hidden sm:table-cell"><Badge variant="outline">{c.capital_type || 'Equity'}</Badge></TableCell>
                        <TableCell className="hidden md:table-cell">{c.equity_percentage ? `${c.equity_percentage}%` : '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="text-sm font-medium">{c.payment_mode || '-'}</div>
                        </TableCell>
                        <TableCell className="font-bold text-gray-900">₹{Number(c.capital_contributed).toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs text-blue-600" onClick={() => handleEditCapital(c)}><Edit className="w-3 h-3" /></Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs text-red-400" onClick={() => handleDeleteCapital(c.id)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {capital.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No capital contributions recorded yet.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
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
              { type: "Income Ledger", desc: "Complete record of all income", icon: <Wallet className="w-7 h-7" />, color: "emerald" },
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
              <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" /> Expenses CSV</Button>
              <Button variant="outline" size="sm" onClick={exportIncomeCSV}><Download className="w-4 h-4 mr-1" /> Income CSV</Button>
              <Button variant="outline" size="sm" onClick={() => generatePDFReport("Expense Ledger")}><FileText className="w-4 h-4 mr-1" /> Expenses PDF</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
