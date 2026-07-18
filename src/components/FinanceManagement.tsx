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
 Wallet,
 Printer,
 ShoppingCart,
 BarChart3,
 Calculator,
 Receipt,
 MapPin
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
 "Raw Materials",
 "Packaging",
 "Shipping",
 "Marketing",
 "Office Supplies",
 "Travel & Transport",
 "Software & Subscriptions",
 "Meals & Entertainment",
 "Legal & Professional Fees",
 "Rent & Utilities",
 "Company Registration",
 "Hardware & Equipment",
 "Miscellaneous Expenses"
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
 
 const [isUploadingFile, setIsUploadingFile] = useState(false);

 const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 setIsUploadingFile(true);
 try {
 const fileExt = file.name.split('.').pop();
 const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
 const filePath = `expense_bills/${fileName}`;

 const { error: uploadError } = await supabase.storage
 .from('documents') // Ensure you have a 'documents' bucket created in Supabase
 .upload(filePath, file);

 if (uploadError) {
 // Fallback: If 'documents' bucket doesn't exist, try 'public' bucket or similar, but for now just throw
 throw uploadError;
 }

 const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
 
 setNewExpense(prev => ({ ...prev, bill_url: data.publicUrl }));
 toast({ title: "Success", description: "Bill uploaded successfully." });
 } catch (error: any) {
 console.error("Upload error:", error);
 toast({ title: "Upload Failed", description: error.message || "Please ensure the 'documents' bucket exists in Supabase Storage and is public.", variant: "destructive" });
 } finally {
 setIsUploadingFile(false);
 }
 };

 // --- Printing Settings State ---
 const [printMode, setPrintMode] = useState(() => localStorage.getItem("printMode") || "standard");
 const [printPaperSize, setPrintPaperSize] = useState(() => localStorage.getItem("printPaperSize") || "a4");
 const [printOrientation, setPrintOrientation] = useState(() => localStorage.getItem("printOrientation") || "portrait");
 const [printMargin, setPrintMargin] = useState(() => Number(localStorage.getItem("printMargin") || "14"));
 const [printNodeApiKey, setPrintNodeApiKey] = useState(() => localStorage.getItem("printNodeApiKey") || "");
 const [printNodePrinterId, setPrintNodePrinterId] = useState(() => localStorage.getItem("printNodePrinterId") || "");
 const [localAgentUrl, setLocalAgentUrl] = useState(() => localStorage.getItem("localAgentUrl") || "http://localhost:5050/print");
 const [printersList, setPrintersList] = useState<{ id: number; name: string; state: string }[]>([]);
 const [fetchingPrinters, setFetchingPrinters] = useState(false);

 const fetchPrintNodePrinters = async (keyToUse = printNodeApiKey) => {
 if (!keyToUse) return;
 setFetchingPrinters(true);
 try {
 const response = await fetch("https://api.printnode.com/printers", {
 method: "GET",
 headers: {
 "Authorization": "Basic " + btoa(keyToUse + ":")
 }
 });
 if (!response.ok) throw new Error("Failed to fetch printers from PrintNode");
 const data = await response.json();
 setPrintersList(data);
 toast({ title: "Printers Synced", description: `Found ${data.length} printers.` });
 } catch (err: any) {
 console.error(err);
 toast({ title: "PrintNode Error", description: err.message, variant: "destructive" });
 } finally {
 setFetchingPrinters(false);
 }
 };

 useEffect(() => {
 localStorage.setItem("printMode", printMode);
 }, [printMode]);
 useEffect(() => {
 localStorage.setItem("printPaperSize", printPaperSize);
 }, [printPaperSize]);
 useEffect(() => {
 localStorage.setItem("printOrientation", printOrientation);
 }, [printOrientation]);
 useEffect(() => {
 localStorage.setItem("printMargin", String(printMargin));
 }, [printMargin]);
 useEffect(() => {
 localStorage.setItem("printNodeApiKey", printNodeApiKey);
 }, [printNodeApiKey]);
 useEffect(() => {
 localStorage.setItem("printNodePrinterId", printNodePrinterId);
 }, [printNodePrinterId]);
 useEffect(() => {
 localStorage.setItem("localAgentUrl", localAgentUrl);
 }, [localAgentUrl]);

 useEffect(() => {
 if (printMode === "printnode" && printNodeApiKey && printersList.length === 0) {
 fetchPrintNodePrinters();
 }
 }, [printMode]);

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
 } catch (error: unknown) {
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
 } catch (error: unknown) {
 console.error("Error saving expense:", error);
 toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
 }
 };

 const handleEditExpense = (expenseItem: ExpenseRecord) => {
 setNewExpense({ ...expenseItem });
 setEditingExpenseId(expenseItem.id);
 setIsAddingExpense(true);
 };

 const handleUpdateStatus = async (id: string, status: string) => {
 try {
 const updateData: Partial<ExpenseRecord> = { reimbursement_status: status };
 if (status === 'Approved') updateData.approval_date = new Date().toISOString().split('T')[0];
 if (status === 'Reimbursed') updateData.reimbursement_date = new Date().toISOString().split('T')[0];

 const { error } = await supabase.from('expense_records').update(updateData).eq('id', id);
 if (error) throw error;

 toast({ title: "Status Updated", description: `Expense marked as ${status}` });
 fetchData();
 } catch (error: unknown) {
 toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
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
 } catch (error: unknown) {
 toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
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
 } catch (error: unknown) {
 toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
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
 } catch (error: unknown) {
 console.error("Error saving income:", error);
 toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
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
 } catch (error: unknown) {
 toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
 }
 };

 const handleUpdateIncomeStatus = async (id: string, status: string) => {
 try {
 const { error } = await supabase.from('income_records').update({ status }).eq('id', id);
 if (error) throw error;
 toast({ title: "Status Updated", description: `Income marked as ${status}` });
 fetchData();
 } catch (error: unknown) {
 toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
 }
 };

 const generatePDFReport = async (type: string, forceDownload = false) => {
 const isThermal = printPaperSize === "thermal80";
 const formatValue = isThermal ? [80, 297] as [number, number] : printPaperSize;
 const doc = new jsPDF({
 orientation: printOrientation as "portrait" | "landscape",
 unit: "mm",
 format: formatValue
 });
 const companyName = "BiovaCo Nexus Private Limited";
 const reportNo = `RPT-${Date.now().toString(36).toUpperCase()}`;
 const pageWidth = doc.internal.pageSize.getWidth();

 // Load Image
 const imgData = await new Promise<string>((resolve) => {
 const img = new Image();
 img.src = '/uploads/Icon.png';
 img.onload = () => {
 const canvas = document.createElement('canvas');
 canvas.width = img.width;
 canvas.height = img.height;
 const ctx = canvas.getContext('2d');
 if (ctx) {
 ctx.drawImage(img, 0, 0);
 resolve(canvas.toDataURL('image/png'));
 } else {
 resolve('');
 }
 };
 img.onerror = () => resolve('');
 });

 const isNarrow = pageWidth < 160;

 // --- Professional B&W Header ---
 doc.setDrawColor(0);
 doc.setLineWidth(isThermal ? 0.4 : 0.8);
 doc.line(printMargin, 12, pageWidth - printMargin, 12);

 doc.setFontSize(isThermal ? 12 : (isNarrow ? 13 : 18));
 doc.setTextColor(0, 0, 0);
 doc.setFont('helvetica', 'bold');

 let textStartX = printMargin;
 if (imgData && !isThermal) {
 doc.addImage(imgData, 'PNG', printMargin, 15, 12, 12);
 textStartX = printMargin + 16;
 }

 doc.text(companyName, textStartX, 22);

 doc.setFontSize(isThermal ? 6 : (isNarrow ? 6 : 8));
 doc.setFont('helvetica', 'normal');
 doc.setTextColor(0);
 
 if (isNarrow && !isThermal) {
 doc.text('CIN: U46300ME2026PTC475352', textStartX, 26);
 doc.text('Office: Dhamangaon Rly, MH', textStartX, 30);
 } else {
 doc.text('CIN: U46300ME2026PTC475352 | Registered Office: Dhamangaon Railway, Maharashtra', textStartX, 27);
 }

 doc.setLineWidth(0.3);
 const headerBottomY = (isNarrow && !isThermal) ? 33 : 30;
 doc.line(printMargin, headerBottomY, pageWidth - printMargin, headerBottomY);

 // Report meta (right-aligned) - Skip on thermal or place below to save space
 if (!isThermal) {
 doc.setFontSize(isNarrow ? 6 : 8);
 doc.setTextColor(0);
 doc.text(`Report No: ${reportNo}`, pageWidth - printMargin, 18, { align: 'right' });
 doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth - printMargin, 23, { align: 'right' });
 }

 let head: string[][] = [];
 let body: (string | number)[][] = [];
 let title = "";
 let totalLabel = "";
 let totalValue = 0;

 if (type === "Expense Ledger") {
 title = "EXPENSE LEDGER";
 head = isThermal
 ? [["Date", "Desc", "Amt", "Status"]]
 : [["#", "Date & ID", "Category & Desc", "Vendor & Details", "Paid By & Mode", "Amount (Rs.)", "Status"]];
 body = expenses.map((e, i) => isThermal ? [
 new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' }),
 e.description.substring(0, 15),
 Number(e.total_amount).toLocaleString('en-IN'),
 e.reimbursement_status.substring(0, 3)
 ] : [
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
 head = isThermal
 ? [["Date", "Investor", "Amt"]]
 : [["#", "Date", "Founder / Investor", "Capital Type", "Equity %", "Payment Details", "Amount (Rs.)"]];
 body = capital.map((c, i) => isThermal ? [
 new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' }),
 c.founder_name.substring(0, 15),
 Number(c.capital_contributed).toLocaleString('en-IN')
 ] : [
 i + 1, new Date(c.date).toLocaleDateString('en-IN'), c.founder_name, c.capital_type || 'Equity', c.equity_percentage ? `${c.equity_percentage}%` : '-', `${c.payment_mode || '-'} ${c.transaction_reference ? `(${c.transaction_reference})` : ''}`, Number(c.capital_contributed).toLocaleString('en-IN')
 ]);
 totalLabel = "Total Capital";
 totalValue = capital.reduce((s, c) => s + Number(c.capital_contributed), 0);
 } else if (type === "Reimbursement Report") {
 title = "REIMBURSEMENT REPORT";
 head = isThermal
 ? [["Date", "Paid By", "Amt", "Status"]]
 : [["#", "Date", "ID", "Paid By", "Amount (Rs.)", "Status", "Approval Date"]];
 body = expenses.filter(e => e.reimbursement_status !== 'Rejected').map((e, i) => isThermal ? [
 new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' }),
 e.paid_by_name.substring(0, 10),
 Number(e.total_amount).toLocaleString('en-IN'),
 e.reimbursement_status.substring(0, 3)
 ] : [
 i + 1, new Date(e.date).toLocaleDateString('en-IN'), e.expense_id, e.paid_by_name, Number(e.total_amount).toLocaleString('en-IN'), e.reimbursement_status, e.approval_date ? new Date(e.approval_date).toLocaleDateString('en-IN') : '-'
 ]);
 totalLabel = "Total Reimbursable";
 totalValue = expenses.filter(e => e.reimbursement_status !== 'Rejected').reduce((s, e) => s + Number(e.total_amount), 0);
 } else if (type === "Registration Expenses") {
 title = "REGISTRATION EXPENSES";
 const reg = expenses.filter(e => e.category === 'Company Registration');
 head = isThermal
 ? [["Date", "Category", "Amt"]]
 : [["#", "Date", "Sub Category", "Description", "Vendor", "Amount (Rs.)"]];
 body = reg.map((e, i) => isThermal ? [
 new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' }),
 (e.sub_category || '').substring(0, 12),
 Number(e.total_amount).toLocaleString('en-IN')
 ] : [
 i + 1, new Date(e.date).toLocaleDateString('en-IN'), e.sub_category || '-', e.description, e.vendor_name || '-', Number(e.total_amount).toLocaleString('en-IN')
 ]);
 totalLabel = "Total Reg Cost";
 totalValue = reg.reduce((s, e) => s + Number(e.total_amount), 0);
 } else if (type === "Income Ledger") {
 title = "INCOME LEDGER";
 head = isThermal
 ? [["Date", "Client", "Amt", "Status"]]
 : [["#", "Date", "Income ID", "Source", "Client", "Amount (Rs.)", "Status"]];
 body = incomes.map((inc, i) => isThermal ? [
 new Date(inc.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' }),
 (inc.client_name || '').substring(0, 12),
 Number(inc.total_amount).toLocaleString('en-IN'),
 inc.status.substring(0, 3)
 ] : [
 i + 1, new Date(inc.date).toLocaleDateString('en-IN'), inc.income_id, inc.source, inc.client_name || '-', Number(inc.total_amount).toLocaleString('en-IN'), inc.status
 ]);
 totalLabel = "Total Income";
 totalValue = incomes.filter(inc => inc.status === 'Received').reduce((s, inc) => s + Number(inc.total_amount), 0);
 }

 // Title
 doc.setFontSize(isThermal ? 10 : 13);
 doc.setFont('helvetica', 'bold');
 doc.setTextColor(0);
 doc.text(title, printMargin, isThermal ? 36 : 40);

 doc.setFontSize(isThermal ? 6 : 8);
 doc.setFont('helvetica', 'normal');
 doc.setTextColor(0);
 doc.text(isThermal ? `Entries: ${body.length}` : `Reporting Period: All Records | Total Entries: ${body.length}`, printMargin, isThermal ? 41 : 46);

 // Table - Strict Black & White
 autoTable(doc, {
 startY: isThermal ? 45 : 52,
 margin: { left: printMargin, right: printMargin },
 head: head,
 body: body,
 theme: 'grid',
 headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: isThermal ? 5 : (isNarrow ? 6 : 7), lineWidth: 0.1, lineColor: [0, 0, 0] },
 bodyStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: isThermal ? 5 : (isNarrow ? 6 : 7), lineWidth: 0.1, lineColor: [0, 0, 0] },
 alternateRowStyles: { fillColor: [255, 255, 255] },
 styles: { cellPadding: isThermal ? 1.2 : (isNarrow ? 1.5 : 2.5), overflow: 'linebreak' },
 });

 const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || (isThermal ? 45 : 52);

 // Total line
 doc.setDrawColor(0);
 doc.setLineWidth(0.5);
 doc.line(printMargin, finalY + 4, pageWidth - printMargin, finalY + 4);
 doc.setFontSize(isThermal ? 7 : 10);
 doc.setFont('helvetica', 'bold');
 doc.setTextColor(0);
 doc.text(`${totalLabel}: Rs. ${totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - printMargin, finalY + (isThermal ? 9 : 11), { align: 'right' });

 if (isThermal) {
 // Small simple footer for thermal print
 doc.setFontSize(5);
 doc.setFont('helvetica', 'normal');
 const footerY = finalY + 16;
 doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, printMargin, footerY);
 doc.text(`BiovaCo Nexus Pvt Ltd | Internal Record`, printMargin, footerY + 3);
 } else {
 // Signatures
 const sigY = finalY + 40;
 doc.setFontSize(isNarrow ? 6 : 8);
 doc.setFont('helvetica', 'normal');
 doc.setTextColor(0);
 
 const printableWidth = pageWidth - (printMargin * 2);
 const sigWidth = Math.min(50, printableWidth * 0.28);
 
 doc.line(printMargin, sigY, printMargin + sigWidth, sigY);
 doc.text('Prepared By', printMargin, sigY + 5);

 const midSigX = printMargin + (printableWidth / 2) - (sigWidth / 2);
 doc.line(midSigX, sigY, midSigX + sigWidth, sigY);
 doc.text('Verified By', midSigX, sigY + 5);

 const rightSigX = pageWidth - printMargin - sigWidth;
 doc.line(rightSigX, sigY, pageWidth - printMargin, sigY);
 doc.text('Authorized Signatory', rightSigX, sigY + 5);

 // Footer
 doc.setFontSize(isNarrow ? 5 : 7);
 doc.setTextColor(0);
 doc.text('This is a system-generated document. No signature is required for internal records.', printMargin, sigY + 15);
 doc.text(`Generated on ${new Date().toLocaleString('en-IN')} | ${companyName}`, printMargin, sigY + 20);
 }

 const reportTitle = `BiovaCo_${type.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

 // Check printing mode
 if (forceDownload || printMode === "standard") {
 doc.save(`${reportTitle}.pdf`);
 toast({ title: "Report Downloaded", description: "PDF generated and saved successfully." });
 } else if (printMode === "kiosk") {
 try {
 const blob = doc.output('blob');
 const url = URL.createObjectURL(blob);
 const iframe = document.createElement('iframe');
 iframe.style.position = 'fixed';
 iframe.style.right = '0';
 iframe.style.bottom = '0';
 iframe.style.width = '0';
 iframe.style.height = '0';
 iframe.style.border = '0';
 iframe.src = url;
 document.body.appendChild(iframe);

 iframe.onload = () => {
 iframe.contentWindow?.focus();
 iframe.contentWindow?.print();
 setTimeout(() => {
 document.body.removeChild(iframe);
 URL.revokeObjectURL(url);
 }, 3000);
 };
 toast({ title: "Kiosk Print Triggered", description: "Sent silently to browser print engine." });
 } catch (err: any) {
 console.error("Kiosk print failed:", err);
 doc.save(`${reportTitle}.pdf`);
 }
 } else if (printMode === "printnode") {
 if (!printNodeApiKey) {
 toast({ title: "Missing API Key", description: "Please enter your PrintNode API key in Settings.", variant: "destructive" });
 doc.save(`${reportTitle}.pdf`);
 return;
 }
 if (!printNodePrinterId) {
 toast({ title: "No Printer Selected", description: "Please select a printer from the list in Settings.", variant: "destructive" });
 doc.save(`${reportTitle}.pdf`);
 return;
 }

 try {
 toast({ title: "Connecting to PrintNode...", description: `Sending print job to printer ID: ${printNodePrinterId}` });
 const base64String = doc.output('datauristring').split(',')[1];

 const response = await fetch("https://api.printnode.com/printjobs", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 "Authorization": "Basic " + btoa(printNodeApiKey + ":")
 },
 body: JSON.stringify({
 printerId: Number(printNodePrinterId),
 title: reportTitle,
 contentType: "pdf_base64",
 content: base64String,
 source: "BiovaCo Admin Portal",
 options: {
 paper: printPaperSize === "a4" ? "A4" : printPaperSize === "letter" ? "Letter" : printPaperSize === "a5" ? "A5" : undefined,
 rotate: printOrientation === "landscape" ? 90 : 0
 }
 })
 });

 if (!response.ok) {
 const errData = await response.json();
 throw new Error(errData.message || "Failed to submit print job");
 }

 const jobId = await response.json();
 toast({ title: "Direct Print Successful", description: `Created PrintNode Job ID: ${jobId}` });
 } catch (err: any) {
 console.error("PrintNode direct printing failed:", err);
 toast({ title: "Direct Print Failed", description: err.message || "Could not connect to PrintNode. Downloading PDF instead.", variant: "destructive" });
 doc.save(`${reportTitle}.pdf`);
 }
 } else if (printMode === "local") {
 try {
 toast({ title: "Connecting to Local Agent...", description: `Sending PDF to ${localAgentUrl}` });
 const base64String = doc.output('datauristring').split(',')[1];

 const response = await fetch(localAgentUrl, {
 method: "POST",
 headers: {
 "Content-Type": "application/json"
 },
 body: JSON.stringify({
 title: reportTitle,
 pdf: base64String,
 printer: printNodePrinterId || "default",
 paperSize: printPaperSize,
 orientation: printOrientation
 })
 });

 if (!response.ok) throw new Error("Local agent returned error status");
 toast({ title: "Direct Print Successful", description: "PDF sent directly to your local printer agent!" });
 } catch (err: any) {
 console.error("Local printing failed:", err);
 toast({ title: "Local Agent Print Failed", description: "Could not print via local agent. Downloading PDF instead.", variant: "destructive" });
 doc.save(`${reportTitle}.pdf`);
 }
 }
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

// Valuation Calculation Logic
const calculateValuation = () => {
 const bookValue = totalCapital + cashFlow;
 const revenueMultiple = 4;
 const revenueValuation = totalIncome * revenueMultiple;
 const profitMultiple = 10;
 const profitValuation = netProfitLoss > 0 ? netProfitLoss * profitMultiple : 0;

 let estimatedValuation = 0;
 let primaryMethod = "";

 if (totalIncome === 0) {
 estimatedValuation = bookValue;
 primaryMethod = "Book Value (Pre-Revenue)";
 } else if (netProfitLoss <= 0) {
 estimatedValuation = (bookValue * 0.3) + (revenueValuation * 0.7);
 primaryMethod = "Revenue Multiple Blended (Pre-Profit)";
 } else {
 estimatedValuation = (bookValue * 0.2) + (revenueValuation * 0.5) + (profitValuation * 0.3);
 primaryMethod = "Comprehensive Blended (Profitable)";
 }

 if (estimatedValuation < bookValue) estimatedValuation = bookValue;

 return {
 estimatedValuation,
 bookValue,
 revenueValuation,
 profitValuation,
 primaryMethod,
 multiples: { rev: revenueMultiple, prof: profitMultiple }
 };
};

const valuationMetrics = calculateValuation();

// --- Advanced Financial Calculations (P&L, GST, Cash Flow) ---
const cogsExpenses = expenses.filter(e => ['Raw Materials', 'Packaging', 'Shipping'].includes(e.category));
const totalCOGS = cogsExpenses.reduce((sum, e) => sum + Number(e.total_amount), 0);
const operatingExpenses = totalExpenses - totalCOGS;
const grossProfit = totalIncome - totalCOGS;

const gstCollected = incomes.filter(i => i.status === 'Received').reduce((sum, i) => sum + Number(i.gst_amount || 0), 0);
const gstPaid = expenses.filter(e => e.reimbursement_status !== 'Rejected').reduce((sum, e) => sum + Number(e.gst_amount || 0), 0);
const netGstPayable = gstCollected - gstPaid;

const totalReceivables = pendingIncome;
const totalPayables = pendingReimbursements;

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

// --- Sales Dashboard Calculations ---
const salesIncomes = incomes.filter(i => i.source === "Product Sales" && i.status === 'Received');

const todayStr = new Date().toISOString().split('T')[0];
const todaySales = salesIncomes.filter(i => i.date === todayStr).reduce((sum, i) => sum + Number(i.total_amount), 0);

const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
const weekStr = sevenDaysAgo.toISOString().split('T')[0];
const weekSales = salesIncomes.filter(i => i.date >= weekStr).reduce((sum, i) => sum + Number(i.total_amount), 0);

const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
const monthStr = thirtyDaysAgo.toISOString().split('T')[0];
const monthSales = salesIncomes.filter(i => i.date >= monthStr).reduce((sum, i) => sum + Number(i.total_amount), 0);

const ordersCount = salesIncomes.length;

// Top Selling Products (Group by description)
const productSalesMap: Record<string, { count: number; total: number }> = {};
salesIncomes.forEach(inc => {
 const productName = inc.description || "Unknown Product";
 if (!productSalesMap[productName]) {
 productSalesMap[productName] = { count: 0, total: 0 };
 }
 productSalesMap[productName].count += 1;
 productSalesMap[productName].total += Number(inc.total_amount);
});

const topSellingProducts = Object.entries(productSalesMap)
 .map(([name, data]) => ({ name, ...data }))
 .sort((a, b) => b.total - a.total)
 .slice(0, 5);

// Revenue Graph (Daily)
const salesGraphData = (() => {
 const dates: Record<string, number> = {};
 salesIncomes.forEach(i => {
 const key = new Date(i.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
 dates[key] = (dates[key] || 0) + Number(i.total_amount);
 });
 // Sort dates chronologically before slicing
 return Object.entries(dates)
 .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
 .map(([name, amount]) => ({ name, amount }))
 .slice(-14);
})();
// ------------------------------------

// Delete Expense
const handleDeleteExpense = async (id: string) => {
 if (!confirm('Are you sure you want to delete this expense?')) return;
 try {
 const { error } = await supabase.from('expense_records').delete().eq('id', id);
 if (error) throw error;
 toast({ title: 'Deleted', description: 'Expense record removed.' });
 fetchData();
 } catch (error: unknown) {
 toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
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

const exportTaxCSV = () => {
 const headers = 'Date,Type,Category/Source,Description,Amount,GST Amount,Total Amount\n';
 const expenseRows = expenses.map(e => 
 `${e.date},Expense (Input),${e.category},"${e.description}",${e.amount},${e.gst_amount},${e.total_amount}`
 ).join('\n');
 const incomeRows = incomes.map(i => 
 `${i.date},Income (Output),${i.source},"${i.description}",${i.amount},${i.gst_amount},${i.total_amount}`
 ).join('\n');
 
 const blob = new Blob([headers + incomeRows + '\n' + expenseRows], { type: 'text/csv' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `BiovaCo_GST_Tax_Report_${new Date().toISOString().split('T')[0]}.csv`;
 a.click();
};

const downloadCSV = (content: string, filename: string) => {
 const blob = new Blob([content], { type: 'text/csv' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `BiovaCo_${filename}_${new Date().toISOString().split('T')[0]}.csv`;
 a.click();
};

const exportPnLCSV = () => {
 const content = `Profit & Loss Statement\nDate,${new Date().toLocaleDateString()}\n\nCategory,Amount\nTotal Revenue,${totalIncome}\nCost of Goods Sold (COGS),-${totalCOGS}\nGross Profit,${grossProfit}\nOperating Expenses,-${operatingExpenses}\nNet Profit,${netProfitLoss}\n`;
 downloadCSV(content, 'Profit_And_Loss');
};

const exportBalanceSheetCSV = () => {
 const content = `Balance Sheet\nDate,${new Date().toLocaleDateString()}\n\nAssets,Amount\nCash & Bank (Net Cash),${cashFlow}\nAccounts Receivable,${totalReceivables}\nTotal Assets,${cashFlow + totalReceivables}\n\nLiabilities & Equity,Amount\nAccounts Payable,${totalPayables}\nCapital/Equity,${totalCapital}\nRetained Earnings,${netProfitLoss}\nTotal Liabilities & Equity,${totalPayables + totalCapital + netProfitLoss}\n`;
 downloadCSV(content, 'Balance_Sheet');
};

const exportCashFlowCSV = () => {
 const content = `Cash Flow Statement\nDate,${new Date().toLocaleDateString()}\n\nCategory,Amount\nOperating Cash Inflow (Sales/Income),${totalIncome}\nFinancing Cash Inflow (Capital),${totalCapital}\nTotal Cash Inflow,${totalIncome + totalCapital}\nTotal Cash Outflow (Expenses),-${totalExpenses}\nNet Cash Available,${cashFlow}\n`;
 downloadCSV(content, 'Cash_Flow_Statement');
};

const exportSalesByProductCSV = () => {
 const content = `Sales by Product\nDate,${new Date().toLocaleDateString()}\n\nProduct,Quantity Sold,Total Revenue\n` + 
 topSellingProducts.map(p => `"${p.name}",${p.count},${p.total}`).join('\n');
 downloadCSV(content, 'Sales_By_Product');
};

const exportSalesByCityCSV = () => {
 const cityMap: Record<string, number> = {};
 salesIncomes.forEach(i => {
 let city = "Unknown / Online";
 if (i.client_name) {
 const parts = i.client_name.split('-');
 city = parts.length > 1 ? parts[parts.length - 1].trim() : i.client_name;
 }
 cityMap[city] = (cityMap[city] || 0) + Number(i.total_amount);
 });
 const content = `Sales by City / Client\nDate,${new Date().toLocaleDateString()}\n\nCity/Client,Total Revenue\n` +
 Object.entries(cityMap).map(([city, total]) => `"${city}",${total}`).join('\n');
 downloadCSV(content, 'Sales_By_City');
};

if (loading) {
 return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-foreground" /></div>;
}

return (
 <div className="space-y-6 w-full min-w-0">
 {/* Tabs */}
 <div className="flex flex-wrap gap-2 border-b pb-4">
 <Button variant={activeTab === "dashboard" ? "default" : "outline"} onClick={() => setActiveTab("dashboard")} className="flex-1 sm:flex-none">
 <PieChart className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Dashboard</span>
 </Button>
 <Button variant={activeTab === "sales" ? "default" : "outline"} onClick={() => setActiveTab("sales")} className="flex-1 sm:flex-none">
 <ShoppingCart className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Sales</span>
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
 <Button variant={activeTab === "analytics" ? "default" : "outline"} onClick={() => setActiveTab("analytics")} className="flex-1 sm:flex-none">
 <BarChart3 className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Analytics & GST</span>
 </Button>
 <Button variant={activeTab === "reports" ? "default" : "outline"} onClick={() => setActiveTab("reports")} className="flex-1 sm:flex-none">
 <Download className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Reports</span>
 </Button>
 </div>

 {/* DASHBOARD TAB */}
 {activeTab === "dashboard" && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 <Card className=" ">
 <CardContent className="p-4">
 <p className="text-xs font-medium text-gray-500 mb-1">Total Capital Contributed</p>
 <div className="flex items-center"><IndianRupee className="w-4 h-4 text-gray-400 mr-1" /><h3 className="text-xl font-bold">{totalCapital.toLocaleString('en-IN')}</h3></div>
 </CardContent>
 </Card>
 <Card className=" ">
 <CardContent className="p-4">
 <p className="text-xs font-medium text-gray-500 mb-1">Total Received Income</p>
 <div className="flex items-center"><IndianRupee className="w-4 h-4 text-emerald-500 mr-1" /><h3 className="text-xl font-bold text-emerald-700">{totalIncome.toLocaleString('en-IN')}</h3></div>
 </CardContent>
 </Card>
 <Card className=" ">
 <CardContent className="p-4">
 <p className="text-xs font-medium text-gray-500 mb-1">Total Expenses</p>
 <div className="flex items-center"><IndianRupee className="w-4 h-4 text-red-500 mr-1" /><h3 className="text-xl font-bold text-red-700">{totalExpenses.toLocaleString('en-IN')}</h3></div>
 </CardContent>
 </Card>
 <Card className={` ${netProfitLoss >= 0 ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
 <CardContent className="p-4">
 <p className="text-xs font-medium text-gray-500 mb-1">Net Profit / Loss</p>
 <div className="flex items-center">
 {netProfitLoss >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" /> : <TrendingDown className="w-4 h-4 text-foreground mr-1" />}
 <h3 className={`text-xl font-bold ${netProfitLoss >= 0 ? 'text-emerald-700' : 'text-foreground'}`}>₹{Math.abs(netProfitLoss).toLocaleString('en-IN')}</h3>
 </div>
 </CardContent>
 </Card>
 <Card className={` ${cashFlow >= 0 ? 'border-l-blue-500' : 'border-l-rose-500'}`}>
 <CardContent className="p-4">
 <p className="text-xs font-medium text-gray-500 mb-1">Available Cash Flow</p>
 <div className="flex items-center">
 {cashFlow >= 0 ? <TrendingUp className="w-4 h-4 text-foreground mr-1" /> : <TrendingDown className="w-4 h-4 text-foreground mr-1" />}
 <h3 className={`text-xl font-bold ${cashFlow >= 0 ? 'text-foreground' : 'text-foreground'}`}>₹{Math.abs(cashFlow).toLocaleString('en-IN')}</h3>
 </div>
 </CardContent>
 </Card>
 <Card className=" ">
 <CardContent className="p-4">
 <p className="text-xs font-medium text-gray-500 mb-1">Pending Reimbursements</p>
 <div className="flex items-center"><IndianRupee className="w-4 h-4 text-gray-400 mr-1" /><h3 className="text-xl font-bold">{pendingReimbursements.toLocaleString('en-IN')}</h3></div>
 </CardContent>
 </Card>
 </div>

 {/* AI Smart Valuation Card */}
 <Card className="border border-border bg-gradient-to-br from-white to-purple-50/50 overflow-hidden relative">
 <div className="absolute top-[-20%] right-[-5%] p-8 opacity-5 pointer-events-none"><Building2 className="w-64 h-64 text-foreground" /></div>
 <CardContent className="p-6 relative z-10">
 <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
 <div>
 <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-foreground text-xs font-semibold mb-2">
 <TrendingUp className="w-3 h-3" /> AI Smart Valuation
 </div>
 <h2 className="text-4xl font-black text-gray-900 tracking-tight">
 ₹{valuationMetrics.estimatedValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
 </h2>
 <p className="text-sm text-gray-600 mt-1">Estimated Company Valuation based on real-time financial metrics.</p>
 </div>

 <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-border/50 w-full md:w-1/2">
 <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Calculation Guide</h4>
 <p className="text-sm text-gray-700 leading-relaxed">
 {totalIncome === 0
 ? `Currently Pre-Revenue. Valuation is equal to your Book Value (Total Assets + Cash). Start generating revenue to multiply this value!`
 : netProfitLoss <= 0
 ? `Pre-Profit Growth Stage. Valuation is a blend of your Book Value and a ${valuationMetrics.multiples.rev}x Revenue Multiple. Focus on reducing expenses to reach profitability and unlock higher EBITDA multiples.`
 : `Profitable Stage! 🎉 Valuation is a comprehensive blend of Book Value, a ${valuationMetrics.multiples.rev}x Revenue Multiple, and a ${valuationMetrics.multiples.prof}x Profit Multiple. Excellent financial health.`
 }
 </p>
 <div className="mt-3 pt-3 border-t border-border flex gap-4 text-xs text-gray-500">
 <div><span className="font-semibold text-gray-700">Book Value:</span> ₹{valuationMetrics.bookValue.toLocaleString('en-IN')}</div>
 {totalIncome > 0 && <div><span className="font-semibold text-gray-700">Rev Value:</span> ₹{valuationMetrics.revenueValuation.toLocaleString('en-IN')}</div>}
 </div>
 </div>
 </div>
 </CardContent>
 </Card>

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
 <RechartsTooltip formatter={(v: number) => `₹${Number(v).toLocaleString('en-IN')}`} />
 <Bar dataKey="amount" fill="#4B49AC" radius={[4, 4, 0, 0]} />
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
 const COLORS = ['#4B49AC', '#98BDFF', '#7DA0FA', '#7978E9', '#F3797E', '#c5d3f6', '#f9a6aa', '#346dfa'];
 return catData.length > 0 ? (
 <ResponsiveContainer width="100%" height="100%">
 <RechartsPieChart>
 <Pie data={catData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name.substring(0, 12)} ${(percent * 100).toFixed(0)}%`}>
 {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
 </Pie>
 <RechartsTooltip formatter={(v: number) => `₹${v}`} />
 </RechartsPieChart>
 </ResponsiveContainer>
 ) : <p className="text-center text-gray-400 py-16">No expense data yet</p>;
 })()}
 </CardContent>
 </Card>
 </div>
 </div>
 )}

 {/* SALES DASHBOARD TAB */}
 {activeTab === "sales" && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 <Card className=" ">
 <CardContent className="p-4">
 <p className="text-xs font-medium text-gray-500 mb-1">Today's Sales</p>
 <div className="flex items-center"><IndianRupee className="w-4 h-4 text-gray-400 mr-1" /><h3 className="text-xl font-bold text-gray-800">{todaySales.toLocaleString('en-IN')}</h3></div>
 </CardContent>
 </Card>
 <Card className=" ">
 <CardContent className="p-4">
 <p className="text-xs font-medium text-gray-500 mb-1">This Week's Sales</p>
 <div className="flex items-center"><IndianRupee className="w-4 h-4 text-gray-400 mr-1" /><h3 className="text-xl font-bold text-foreground">{weekSales.toLocaleString('en-IN')}</h3></div>
 </CardContent>
 </Card>
 <Card className=" ">
 <CardContent className="p-4">
 <p className="text-xs font-medium text-gray-500 mb-1">This Month's Sales</p>
 <div className="flex items-center"><IndianRupee className="w-4 h-4 text-emerald-500 mr-1" /><h3 className="text-xl font-bold text-emerald-700">{monthSales.toLocaleString('en-IN')}</h3></div>
 </CardContent>
 </Card>
 <Card className=" ">
 <CardContent className="p-4">
 <p className="text-xs font-medium text-gray-500 mb-1">Total Orders Count</p>
 <div className="flex items-center"><ShoppingCart className="w-4 h-4 text-orange-500 mr-2" /><h3 className="text-xl font-bold text-orange-700">{ordersCount}</h3></div>
 </CardContent>
 </Card>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <Card className="lg:col-span-2">
 <CardHeader><CardTitle className="text-lg">Revenue Graph (Product Sales)</CardTitle></CardHeader>
 <CardContent className="h-80">
 {salesGraphData.length > 0 ? (
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={salesGraphData}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} />
 <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
 <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
 <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} formatter={(v: number) => `₹${Number(v).toLocaleString('en-IN')}`} />
 <Bar dataKey="amount" fill="#4B49AC" radius={[4, 4, 0, 0]} barSize={40} />
 </BarChart>
 </ResponsiveContainer>
 ) : <p className="text-center text-gray-400 py-24">No sales data available to chart.</p>}
 </CardContent>
 </Card>
 
 <Card>
 <CardHeader><CardTitle className="text-lg">Top Selling Products</CardTitle></CardHeader>
 <CardContent>
 {topSellingProducts.length > 0 ? (
 <div className="space-y-4">
 {topSellingProducts.map((product, idx) => (
 <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
 <div className="flex flex-col overflow-hidden mr-2">
 <span className="text-sm font-semibold text-gray-800 truncate" title={product.name}>{product.name}</span>
 <span className="text-xs text-gray-500">{product.count} Order{product.count > 1 ? 's' : ''}</span>
 </div>
 <div className="text-sm font-bold text-emerald-600 whitespace-nowrap">
 ₹{product.total.toLocaleString('en-IN')}
 </div>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-center text-gray-400 py-16">No products sold yet.</p>
 )}
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
 <Button variant="outline" size="sm" onClick={() => generatePDFReport("Income Ledger", true)} className="flex-1 sm:flex-none"><FileText className="w-4 h-4 mr-1" /> PDF</Button>
 <Button variant="default" size="sm" onClick={() => generatePDFReport("Income Ledger", false)} className="flex-1 sm:flex-none bg-secondary hover:bg-secondary text-white"><Printer className="w-4 h-4 mr-1" /> Print</Button>
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
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Date *</label><Input type="date" value={newIncome.date} onChange={e => setNewIncome({ ...newIncome, date: e.target.value })} /></div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Source *</label>
 <Select value={newIncome.source} onValueChange={val => setNewIncome({ ...newIncome, source: val })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{INCOME_SOURCES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
 </div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Base Amount (₹) *</label><Input type="number" value={newIncome.amount || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIncome({ ...newIncome, amount: Number(e.target.value) })} placeholder="0.00" /></div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">GST Amount (₹)</label><Input type="number" value={newIncome.gst_amount || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIncome({ ...newIncome, gst_amount: Number(e.target.value) })} placeholder="0.00" /></div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Payment Mode</label>
 <Select value={newIncome.payment_mode} onValueChange={val => setNewIncome({ ...newIncome, payment_mode: val })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{PAYMENT_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
 </div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Transaction Ref / UPI</label><Input value={newIncome.transaction_reference || ''} onChange={e => setNewIncome({ ...newIncome, transaction_reference: e.target.value })} placeholder="Ref No" /></div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Client / Customer Name</label><Input value={newIncome.client_name || ''} onChange={e => setNewIncome({ ...newIncome, client_name: e.target.value })} placeholder="Client Name" /></div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Invoice Number</label><Input value={newIncome.invoice_number || ''} onChange={e => setNewIncome({ ...newIncome, invoice_number: e.target.value })} placeholder="INV-..." /></div>
 <div className="md:col-span-3"><label className="text-xs font-medium text-gray-600 mb-1 block">Description</label><Input value={newIncome.description || ''} onChange={e => setNewIncome({ ...newIncome, description: e.target.value })} placeholder="Payment for..." /></div>
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
 <Button size="icon" variant="outline" className="h-8 w-8 text-foreground" onClick={() => handleEditIncome(inc)}><Edit className="w-4 h-4" /></Button>
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
 <Button size="sm" variant="outline" className="h-7 text-xs text-foreground" onClick={() => handleEditIncome(inc)}><Edit className="w-3 h-3" /></Button>
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
 <Button variant="outline" size="sm" onClick={() => generatePDFReport("Expense Ledger", true)}><FileText className="w-4 h-4 mr-1" /> PDF</Button>
 <Button variant="default" size="sm" onClick={() => generatePDFReport("Expense Ledger", false)} className="bg-secondary hover:bg-secondary text-white"><Printer className="w-4 h-4 mr-1" /> Print</Button>
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
 }} className="bg-primary text-primary-foreground hover:bg-primary/90" size="sm">
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
 <Card className="border-border bg-muted/50/30">
 <CardHeader><CardTitle className="text-foreground">{editingExpenseId ? "Edit Expense Entry" : "New Expense Entry"}</CardTitle></CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Date *</label><Input type="date" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} /></div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Category *</label>
 <Select value={newExpense.category} onValueChange={val => setNewExpense({ ...newExpense, category: val })}><SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger><SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
 </div>
 {newExpense.category === "Company Registration" && (
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Sub Category</label>
 <Select value={newExpense.sub_category} onValueChange={val => setNewExpense({ ...newExpense, sub_category: val })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{REGISTRATION_SUBCATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
 </div>
 )}
 <div className="md:col-span-2"><label className="text-xs font-medium text-gray-600 mb-1 block">Description *</label><Input value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} placeholder="What was this expense for?" /></div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Amount (Base) *</label><Input type="number" value={newExpense.amount || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })} placeholder="0.00" /></div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">GST Amount</label><Input type="number" value={newExpense.gst_amount || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExpense({ ...newExpense, gst_amount: Number(e.target.value) })} placeholder="0.00" /></div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Total Amount</label><div className="p-2 bg-gray-100 rounded-md font-bold text-gray-800 border">₹ {(Number(newExpense.amount || 0) + Number(newExpense.gst_amount || 0)).toFixed(2)}</div></div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Paid By Role *</label>
 <Select value={newExpense.paid_by_role} onValueChange={val => setNewExpense({ ...newExpense, paid_by_role: val })}><SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger><SelectContent>{PAID_BY_ROLES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
 </div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Paid By Name *</label><Input value={newExpense.paid_by_name} onChange={e => setNewExpense({ ...newExpense, paid_by_name: e.target.value })} placeholder="Name" /></div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Payment Mode *</label>
 <Select value={newExpense.payment_mode} onValueChange={val => setNewExpense({ ...newExpense, payment_mode: val })}><SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger><SelectContent>{PAYMENT_MODES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
 </div>
 {(newExpense.payment_mode === 'UPI' || newExpense.payment_mode === 'Bank Transfer') && (
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">UPI ID / Txn Ref *</label><Input value={newExpense.transaction_ref_number || ''} onChange={e => setNewExpense({ ...newExpense, transaction_ref_number: e.target.value })} placeholder="Ref/Txn No" /></div>
 )}
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Beneficiary Name</label><Input value={newExpense.beneficiary_name || ''} onChange={e => setNewExpense({ ...newExpense, beneficiary_name: e.target.value })} placeholder="Beneficiary" /></div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Vendor Name</label><Input value={newExpense.vendor_name || ''} onChange={e => setNewExpense({ ...newExpense, vendor_name: e.target.value })} placeholder="Vendor" /></div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Invoice Number</label><Input value={newExpense.invoice_number || ''} onChange={e => setNewExpense({ ...newExpense, invoice_number: e.target.value })} placeholder="INV-123" /></div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Project / Department</label><Input value={newExpense.project_department || ''} onChange={e => setNewExpense({ ...newExpense, project_department: e.target.value })} placeholder="e.g. R&D" /></div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Upload Bill / Invoice (PDF/Image)</label>
 <div className="flex gap-2 items-center">
 <Input type="file" onChange={handleFileUpload} accept=".pdf,.png,.jpg,.jpeg" disabled={isUploadingFile} className="text-xs" />
 {isUploadingFile && <Loader2 className="w-4 h-4 animate-spin text-foreground" />}
 </div>
 {newExpense.bill_url && <a href={newExpense.bill_url} target="_blank" rel="noreferrer" className="text-xs text-foreground hover:underline mt-1 inline-block">View Uploaded Bill</a>}
 </div>
 <div className="md:col-span-1"><label className="text-xs font-medium text-gray-600 mb-1 block">Remarks</label><Input value={newExpense.remarks || ''} onChange={e => setNewExpense({ ...newExpense, remarks: e.target.value })} placeholder="Any notes..." /></div>
 </div>
 <Button onClick={handleAddExpense} className="w-full sm:w-auto bg-primary text-primary-foreground">{editingExpenseId ? "Update Expense Record" : "Save Expense Record"}</Button>
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
 expense.reimbursement_status === 'Approved' ? 'bg-primary text-primary-foreground text-foreground' :
 expense.reimbursement_status === 'Reimbursed' ? 'bg-primary/10 text-foreground' :
 expense.reimbursement_status === 'Rejected' ? 'bg-red-100 text-red-800' :
 'bg-yellow-100 text-yellow-800'
 }>{expense.reimbursement_status}</Badge>
 </div>
 <div>
 <div className="font-medium text-sm text-gray-800">{expense.category}</div>
 <div className="text-xs text-gray-600 mt-1">{expense.description}</div>
 <div className="text-xs text-gray-500 mt-1">Paid by: {expense.paid_by_name} • {expense.payment_mode} {expense.transaction_ref_number ? `(${expense.transaction_ref_number})` : ''}</div>
 {expense.bill_url && (
 <div className="mt-2">
 <a href={expense.bill_url} target="_blank" rel="noreferrer" className="text-xs text-foreground hover:underline flex items-center gap-1"><FileText className="w-3 h-3" /> View Bill</a>
 </div>
 )}
 </div>
 <div className="flex justify-between items-center pt-1">
 <div className="font-bold text-gray-900 text-lg">₹{Number(expense.total_amount).toLocaleString('en-IN')}</div>
 <div className="flex gap-1 flex-wrap justify-end">
 {expense.reimbursement_status === 'Pending' && (
 <>
 <Button size="icon" variant="outline" className="h-8 w-8 bg-muted/50 text-foreground" onClick={() => handleUpdateStatus(expense.id, 'Approved')}><CheckCircle className="w-4 h-4" /></Button>
 <Button size="icon" variant="outline" className="h-8 w-8 bg-red-50 text-red-600" onClick={() => handleUpdateStatus(expense.id, 'Rejected')}><XCircle className="w-4 h-4" /></Button>
 </>
 )}
 {expense.reimbursement_status === 'Approved' && (
 <Button size="sm" variant="outline" className="h-8 text-xs bg-muted/50 text-foreground" onClick={() => handleUpdateStatus(expense.id, 'Reimbursed')}>Mark Paid</Button>
 )}
 <Button size="icon" variant="outline" className="h-8 w-8 text-foreground" onClick={() => handleEditExpense(expense)}><Edit className="w-4 h-4" /></Button>
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
 {expense.bill_url && (
 <a href={expense.bill_url} target="_blank" rel="noreferrer" className="text-xs text-foreground hover:underline flex items-center gap-1 mt-1"><FileText className="w-3 h-3" /> View Bill</a>
 )}
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
 expense.reimbursement_status === 'Approved' ? 'bg-primary text-primary-foreground text-foreground' :
 expense.reimbursement_status === 'Reimbursed' ? 'bg-primary/10 text-foreground' :
 expense.reimbursement_status === 'Rejected' ? 'bg-red-100 text-red-800' :
 'bg-yellow-100 text-yellow-800'
 }>{expense.reimbursement_status}</Badge>
 </TableCell>
 <TableCell>
 <div className="flex gap-1 flex-wrap">
 {expense.reimbursement_status === 'Pending' && (
 <>
 <Button size="sm" variant="outline" className="h-7 text-xs bg-muted/50 text-foreground" onClick={() => handleUpdateStatus(expense.id, 'Approved')}>Approve</Button>
 <Button size="sm" variant="outline" className="h-7 text-xs bg-red-50 text-red-600" onClick={() => handleUpdateStatus(expense.id, 'Rejected')}>Reject</Button>
 </>
 )}
 {expense.reimbursement_status === 'Approved' && (
 <Button size="sm" variant="outline" className="h-7 text-xs bg-muted/50 text-foreground" onClick={() => handleUpdateStatus(expense.id, 'Reimbursed')}>Mark Paid</Button>
 )}
 <Button size="sm" variant="outline" className="h-7 text-xs text-foreground" onClick={() => handleEditExpense(expense)}><Edit className="w-3 h-3" /></Button>
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
 }} className="bg-secondary hover:bg-secondary">
 {isAddingCapital ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add Capital</>}
 </Button>
 </div>

 {isAddingCapital && (
 <Card className="border-border bg-muted/50/30">
 <CardHeader>
 <CardTitle className="text-foreground">{editingCapitalId ? "Edit Capital Entry" : "New Capital Entry"}</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Date *</label><Input type="date" value={newCapital.date} onChange={e => setNewCapital({ ...newCapital, date: e.target.value })} /></div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Founder / Investor Name *</label><Input value={newCapital.founder_name} onChange={e => setNewCapital({ ...newCapital, founder_name: e.target.value })} placeholder="Name" /></div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Amount Contributed *</label><Input type="number" value={newCapital.capital_contributed || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCapital({ ...newCapital, capital_contributed: Number(e.target.value) })} placeholder="0.00" /></div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Equity %</label><Input type="number" value={newCapital.equity_percentage || ''} onChange={e => setNewCapital({ ...newCapital, equity_percentage: Number(e.target.value) })} placeholder="e.g. 50" /></div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Capital Type</label>
 <Select value={newCapital.capital_type} onValueChange={val => setNewCapital({ ...newCapital, capital_type: val })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Equity">Equity</SelectItem><SelectItem value="Debt">Debt (Loan)</SelectItem><SelectItem value="Convertible Note">Convertible Note</SelectItem></SelectContent></Select>
 </div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Payment Mode</label>
 <Select value={newCapital.payment_mode} onValueChange={val => setNewCapital({ ...newCapital, payment_mode: val })}><SelectTrigger><SelectValue placeholder="Select Mode" /></SelectTrigger><SelectContent><SelectItem value="UPI">UPI</SelectItem><SelectItem value="Bank Transfer">Bank Transfer</SelectItem><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Cheque">Cheque</SelectItem></SelectContent></Select>
 </div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">{newCapital.payment_mode === "UPI" ? "UPI ID / Ref No" : newCapital.payment_mode === "Bank Transfer" ? "Transaction ID" : "Reference No"}</label><Input value={newCapital.transaction_reference || ''} onChange={e => setNewCapital({ ...newCapital, transaction_reference: e.target.value })} placeholder="Ref No" /></div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Authorized Capital Allocation</label><Input type="number" value={newCapital.authorized_capital_allocation || ''} onChange={e => setNewCapital({ ...newCapital, authorized_capital_allocation: Number(e.target.value) })} placeholder="0.00" /></div>
 <div><label className="text-xs font-medium text-gray-600 mb-1 block">Paid-Up Capital Allocation</label><Input type="number" value={newCapital.paid_up_capital_allocation || ''} onChange={e => setNewCapital({ ...newCapital, paid_up_capital_allocation: Number(e.target.value) })} placeholder="0.00" /></div>
 </div>
 <Button onClick={handleAddCapital} className="w-full sm:w-auto bg-secondary">{editingCapitalId ? "Update Capital Entry" : "Save Capital Entry"}</Button>
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
 <Button size="icon" variant="outline" className="h-8 w-8 text-foreground" onClick={() => handleEditCapital(c)}><Edit className="w-4 h-4" /></Button>
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
 <Button size="sm" variant="outline" className="h-7 text-xs text-foreground" onClick={() => handleEditCapital(c)}><Edit className="w-3 h-3" /></Button>
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

 {/* ANALYTICS & GST TAB */}
 {activeTab === "analytics" && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Profit & Loss Statement */}
 <Card className=" ">
 <CardHeader className="pb-2">
 <CardTitle className="text-lg flex items-center"><Calculator className="w-5 h-5 mr-2 text-foreground" /> Profit & Loss Statement</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-3 mt-4">
 <div className="flex justify-between text-sm"><span>Total Revenue</span><span className="font-semibold">₹{totalIncome.toLocaleString('en-IN')}</span></div>
 <div className="flex justify-between text-sm text-red-500"><span>Cost of Goods Sold (COGS)</span><span>- ₹{totalCOGS.toLocaleString('en-IN')}</span></div>
 <div className="flex justify-between text-sm font-bold border-t pt-2 border-gray-100"><span>Gross Profit</span><span>₹{grossProfit.toLocaleString('en-IN')}</span></div>
 <div className="flex justify-between text-sm text-red-500 mt-2"><span>Operating Expenses</span><span>- ₹{operatingExpenses.toLocaleString('en-IN')}</span></div>
 <div className="flex justify-between text-base font-black border-t-2 pt-2 border-gray-200 mt-2">
 <span>Net Profit</span>
 <span className={netProfitLoss >= 0 ? "text-emerald-600" : "text-foreground"}>₹{netProfitLoss.toLocaleString('en-IN')}</span>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Cash Flow */}
 <Card className=" ">
 <CardHeader className="pb-2">
 <CardTitle className="text-lg flex items-center"><Wallet className="w-5 h-5 mr-2 text-emerald-500" /> Cash Flow Statement</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-3 mt-4">
 <div className="flex justify-between text-sm text-emerald-600"><span>Cash Inflow (Income + Capital)</span><span className="font-semibold">₹{(totalIncome + totalCapital).toLocaleString('en-IN')}</span></div>
 <div className="flex justify-between text-sm text-foreground"><span>Cash Outflow (Expenses)</span><span>- ₹{totalExpenses.toLocaleString('en-IN')}</span></div>
 <div className="flex justify-between text-base font-black border-t-2 pt-2 border-gray-200 mt-2">
 <span>Net Cash Available</span>
 <span className={cashFlow >= 0 ? "text-foreground" : "text-foreground"}>₹{cashFlow.toLocaleString('en-IN')}</span>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* GST Module */}
 <Card className=" ">
 <CardHeader className="pb-2">
 <div className="flex justify-between items-start">
 <div>
 <CardTitle className="text-lg flex items-center"><Receipt className="w-5 h-5 mr-2 text-orange-500" /> GST Tax Module</CardTitle>
 <CardDescription>Estimated input/output tax summary</CardDescription>
 </div>
 <Button variant="outline" size="sm" onClick={exportTaxCSV} className="text-xs">
 <Download className="w-3 h-3 mr-1"/> Export Report
 </Button>
 </div>
 </CardHeader>
 <CardContent>
 <div className="space-y-3 mt-2">
 <div className="flex justify-between text-sm text-emerald-600"><span>GST Collected (Output Tax)</span><span className="font-semibold">₹{gstCollected.toLocaleString('en-IN')}</span></div>
 <div className="flex justify-between text-sm text-foreground"><span>GST Paid (Input Tax Credit)</span><span>- ₹{gstPaid.toLocaleString('en-IN')}</span></div>
 <div className="flex justify-between text-sm font-bold border-t pt-2 border-gray-100 mt-2">
 <span>Net GST Payable</span>
 <span className={netGstPayable > 0 ? "text-orange-600" : "text-emerald-600"}>
 {netGstPayable > 0 ? `₹${netGstPayable.toLocaleString('en-IN')} (Payable)` : `₹${Math.abs(netGstPayable).toLocaleString('en-IN')} (Credit)`}
 </span>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Receivables & Payables */}
 <Card className=" ">
 <CardHeader className="pb-2">
 <CardTitle className="text-lg flex items-center"><Activity className="w-5 h-5 mr-2 text-foreground" /> Receivables & Payables</CardTitle>
 <CardDescription>Pending dues and obligations</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="space-y-3 mt-2">
 <div className="flex justify-between text-sm">
 <span className="flex flex-col">
 <span className="text-emerald-600 font-medium">Accounts Receivable (A/R)</span>
 <span className="text-xs text-gray-400">Customers who haven't paid</span>
 </span>
 <span className="font-semibold text-emerald-600">₹{totalReceivables.toLocaleString('en-IN')}</span>
 </div>
 <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
 <span className="flex flex-col">
 <span className="text-foreground font-medium">Accounts Payable (A/P)</span>
 <span className="text-xs text-gray-400">Suppliers/Staff you need to pay</span>
 </span>
 <span className="font-semibold text-foreground">₹{totalPayables.toLocaleString('en-IN')}</span>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 )}

 {/* REPORTS TAB */}
 {activeTab === "reports" && (
 <div className="space-y-4">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <h3 className="text-lg font-semibold text-gray-800">Generate Professional PDF & CSV Reports</h3>
 </div>

 {/* Financial Report Exports */}
 <Card className="border border-emerald-100 bg-emerald-50/10 ">
 <CardHeader className="pb-3">
 <CardTitle className="text-base font-semibold text-emerald-900 flex items-center gap-2">
 <Download className="w-5 h-5 text-emerald-600" />
 Core Financial Reports (CSV Exports)
 </CardTitle>
 <CardDescription>
 Download detailed breakdown of your business financials.
 </CardDescription>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
 <Button variant="outline" className="w-full flex justify-start border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={exportPnLCSV}>
 <FileText className="w-4 h-4 mr-2" /> Profit & Loss
 </Button>
 <Button variant="outline" className="w-full flex justify-start border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={exportBalanceSheetCSV}>
 <Building2 className="w-4 h-4 mr-2" /> Balance Sheet
 </Button>
 <Button variant="outline" className="w-full flex justify-start border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={exportCashFlowCSV}>
 <Wallet className="w-4 h-4 mr-2" /> Cash Flow
 </Button>
 <Button variant="outline" className="w-full flex justify-start border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={exportSalesByProductCSV}>
 <ShoppingCart className="w-4 h-4 mr-2" /> Sales by Product
 </Button>
 <Button variant="outline" className="w-full flex justify-start border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={exportSalesByCityCSV}>
 <MapPin className="w-4 h-4 mr-2" /> Sales by City
 </Button>
 </div>
 </CardContent>
 </Card>

 {/* Printing & Layout settings */}
 <Card className="border border-border bg-muted/50/10 ">
 <CardHeader className="pb-3">
 <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
 <Printer className="w-5 h-5 text-foreground" />
 Direct Printing & Report Layout Settings
 </CardTitle>
 <CardDescription>
 Configure page parameters and silent direct printing to bypass the browser print dialog.
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 {/* Print Mode */}
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Print Mode</label>
 <Select value={printMode} onValueChange={setPrintMode}>
 <SelectTrigger className="bg-white">
 <SelectValue placeholder="Select print mode" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="standard">Standard (Download PDF)</SelectItem>
 <SelectItem value="kiosk">Kiosk Mode (System Default Silent)</SelectItem>
 <SelectItem value="printnode">PrintNode Cloud (Direct Printer selection)</SelectItem>
 <SelectItem value="local">Local Print Server (Custom Agent)</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Paper Size */}
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Paper Size</label>
 <Select value={printPaperSize} onValueChange={setPrintPaperSize}>
 <SelectTrigger className="bg-white">
 <SelectValue placeholder="Select paper size" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="a4">A4 (210 x 297 mm)</SelectItem>
 <SelectItem value="letter">Letter (8.5" x 11")</SelectItem>
 <SelectItem value="a5">A5 (148 x 210 mm)</SelectItem>
 <SelectItem value="thermal80">Thermal Receipt (80mm)</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Orientation */}
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Orientation</label>
 <Select value={printOrientation} onValueChange={setPrintOrientation}>
 <SelectTrigger className="bg-white">
 <SelectValue placeholder="Select orientation" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="portrait">Portrait</SelectItem>
 <SelectItem value="landscape">Landscape</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Margin */}
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Margins (mm)</label>
 <Input 
 type="number" 
 value={printMargin} 
 onChange={(e) => setPrintMargin(Math.max(0, Number(e.target.value)))} 
 className="bg-white"
 min="0"
 max="50"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* PrintNode Key or Local Agent Url */}
 {printMode === "printnode" && (
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">PrintNode API Key</label>
 <div className="flex gap-2">
 <Input 
 type="password" 
 value={printNodeApiKey} 
 onChange={(e) => setPrintNodeApiKey(e.target.value)} 
 placeholder="Enter PrintNode API Key" 
 className="bg-white"
 />
 <Button size="sm" variant="outline" className="shrink-0" onClick={() => fetchPrintNodePrinters(printNodeApiKey)} disabled={fetchingPrinters}>
 {fetchingPrinters ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sync"}
 </Button>
 </div>
 </div>
 )}

 {printMode === "local" && (
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Local Agent URL</label>
 <Input 
 type="text" 
 value={localAgentUrl} 
 onChange={(e) => setLocalAgentUrl(e.target.value)} 
 placeholder="http://localhost:5050/print" 
 className="bg-white"
 />
 </div>
 )}

 {/* Printer Selector */}
 {(printMode === "printnode" || printMode === "local") && (
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Active Printer Name</label>
 {printMode === "printnode" ? (
 <Select value={printNodePrinterId} onValueChange={setPrintNodePrinterId}>
 <SelectTrigger className="bg-white">
 <SelectValue placeholder={printersList.length > 0 ? "Select printer" : "Sync printers first"} />
 </SelectTrigger>
 <SelectContent>
 {printersList.map((p) => (
 <SelectItem key={p.id} value={String(p.id)}>
 {p.name} ({p.state})
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 ) : (
 <Input 
 type="text" 
 value={printNodePrinterId} 
 onChange={(e) => setPrintNodePrinterId(e.target.value)} 
 placeholder="e.g. EPSON_TM-T82III" 
 className="bg-white"
 />
 )}
 </div>
 )}
 </div>

 {printMode === "kiosk" && (
 <div className="p-3 bg-muted/50 border border-border rounded-lg text-xs text-foreground">
 <strong>Tip for Kiosk Mode:</strong> Run your browser with the flags <code>--kiosk --kiosk-printing</code> to print instantly to the system default printer without showing any print preview or dialog box.
 </div>
 )}
 </CardContent>
 </Card>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {[
 { type: "Expense Ledger", desc: "Complete list of all expenses", icon: <FileText className="w-7 h-7" />, color: "blue" },
 { type: "Income Ledger", desc: "Complete record of all income", icon: <Wallet className="w-7 h-7" />, color: "emerald" },
 { type: "Capital Contributions", desc: "Funds injected by founders", icon: <Building2 className="w-7 h-7" />, color: "indigo" },
 { type: "Reimbursement Report", desc: "Pending & completed reimbursements", icon: <CheckCircle className="w-7 h-7" />, color: "green" },
 { type: "Registration Expenses", desc: "Company registration costs", icon: <Briefcase className="w-7 h-7" />, color: "purple" },
 ].map(r => (
 <Card key={r.type} className={`hover:border-${r.color}-300 transition-colors`}>
 <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
 <div className={`p-3 bg-${r.color}-50 text-${r.color}-600 rounded-full`}>{r.icon}</div>
 <h3 className="font-bold text-gray-900">{r.type}</h3>
 <p className="text-xs text-gray-500">{r.desc}</p>
 <div className="flex gap-2 w-full mt-2">
 <Button variant="outline" size="sm" className="flex-1" onClick={() => generatePDFReport(r.type, true)}><Download className="w-4 h-4 mr-1" /> PDF</Button>
 <Button variant="default" size="sm" className="flex-1 bg-secondary hover:bg-secondary text-white" onClick={() => generatePDFReport(r.type, false)}><Printer className="w-4 h-4 mr-1" /> Print</Button>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 <Card className="mt-4 border-dashed">
 <CardContent className="p-4 flex flex-wrap gap-3 items-center justify-center">
 <p className="text-sm text-gray-600 mr-2">Quick Export:</p>
 <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" /> Expenses CSV</Button>
 <Button variant="outline" size="sm" onClick={exportIncomeCSV}><Download className="w-4 h-4 mr-1" /> Income CSV</Button>
 <Button variant="outline" size="sm" onClick={() => generatePDFReport("Expense Ledger", true)}><FileText className="w-4 h-4 mr-1" /> Expenses PDF</Button>
 <Button variant="default" size="sm" className="bg-secondary hover:bg-secondary text-white" onClick={() => generatePDFReport("Expense Ledger", false)}><Printer className="w-4 h-4 mr-1" /> Print Expenses</Button>
 </CardContent>
 </Card>
 </div>
 )}
 </div>
);
}
