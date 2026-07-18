import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity, AlertCircle, Clock, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvoiceRecord {
 id: string;
 invoice_number: string;
 client_name: string;
 issue_date: string;
 due_date?: string;
 total_amount: number;
 status: string;
}

interface PurchaseOrder {
 id: string;
 po_number: string;
 supplier_name: string;
 order_date: string;
 expected_delivery_date?: string;
 total_amount: number;
 amount_paid: number;
 due_amount: number;
 payment_status: string;
}

export function ReceivablesPayables() {
 const [receivables, setReceivables] = useState<InvoiceRecord[]>([]);
 const [payables, setPayables] = useState<PurchaseOrder[]>([]);
 const [loading, setLoading] = useState(true);
 const { toast } = useToast();

 useEffect(() => {
 fetchData();
 }, []);

 const fetchData = async () => {
 setLoading(true);
 try {
 const [invRes, poRes] = await Promise.all([
 supabase.from('invoices').select('*').neq('status', 'Paid').order('due_date', { ascending: true }),
 supabase.from('purchase_orders').select('*').neq('payment_status', 'Paid').order('expected_delivery_date', { ascending: true })
 ]);

 if (invRes.error && invRes.error.code !== '42P01') throw invRes.error;
 if (poRes.error && poRes.error.code !== '42P01') throw poRes.error;

 setReceivables(invRes.data || []);
 setPayables(poRes.data || []);
 } catch (error: any) {
 toast({ title: "Error", description: error.message, variant: "destructive" });
 } finally {
 setLoading(false);
 }
 };

 const markInvoicePaid = async (id: string) => {
 try {
 const { error } = await supabase.from('invoices').update({ status: 'Paid' }).eq('id', id);
 if (error) throw error;
 toast({ title: "Updated", description: "Invoice marked as paid." });
 fetchData();
 } catch (error: any) {
 toast({ title: "Error", description: error.message, variant: "destructive" });
 }
 };

 const isOverdue = (dateStr?: string) => {
 if (!dateStr) return false;
 return new Date(dateStr) < new Date();
 };

 const totalAR = receivables.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
 const totalAP = payables.reduce((sum, po) => sum + Number(po.total_amount - po.amount_paid), 0);

 if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-foreground" /></div>;

 return (
 <div className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <Card className=" ">
 <CardHeader className="pb-2">
 <CardTitle className="text-xl flex items-center justify-between">
 <span className="flex items-center text-emerald-700"><ArrowRight className="w-5 h-5 mr-2 rotate-90" /> Accounts Receivable</span>
 <span className="font-bold">₹{totalAR.toLocaleString('en-IN')}</span>
 </CardTitle>
 <CardDescription>Money owed to you by customers</CardDescription>
 </CardHeader>
 <CardContent className="p-0">
 <Table>
 <TableHeader className="bg-emerald-50/50">
 <TableRow>
 <TableHead>Customer</TableHead>
 <TableHead>Amount Due</TableHead>
 <TableHead>Due Date</TableHead>
 <TableHead></TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {receivables.map(inv => (
 <TableRow key={inv.id}>
 <TableCell>
 <div className="font-semibold text-gray-900">{inv.client_name}</div>
 <div className="text-xs text-gray-500">{inv.invoice_number}</div>
 </TableCell>
 <TableCell className="font-bold text-emerald-600">₹{Number(inv.total_amount).toLocaleString('en-IN')}</TableCell>
 <TableCell>
 {inv.due_date ? (
 <span className={`flex items-center text-xs font-medium ${isOverdue(inv.due_date) ? 'text-red-600' : 'text-gray-600'}`}>
 {isOverdue(inv.due_date) && <AlertCircle className="w-3 h-3 mr-1" />}
 {new Date(inv.due_date).toLocaleDateString()}
 </span>
 ) : <span className="text-xs text-gray-400">No date</span>}
 </TableCell>
 <TableCell className="text-right">
 <Button size="sm" variant="outline" className="text-xs h-7 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => markInvoicePaid(inv.id)}>
 <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Paid
 </Button>
 </TableCell>
 </TableRow>
 ))}
 {receivables.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-gray-500 text-sm">No pending receivables.</TableCell></TableRow>}
 </TableBody>
 </Table>
 </CardContent>
 </Card>

 <Card className=" ">
 <CardHeader className="pb-2">
 <CardTitle className="text-xl flex items-center justify-between">
 <span className="flex items-center text-foreground"><ArrowRight className="w-5 h-5 mr-2 -rotate-90" /> Accounts Payable</span>
 <span className="font-bold">₹{totalAP.toLocaleString('en-IN')}</span>
 </CardTitle>
 <CardDescription>Money you owe to suppliers</CardDescription>
 </CardHeader>
 <CardContent className="p-0">
 <Table>
 <TableHeader className="bg-muted/50/50">
 <TableRow>
 <TableHead>Supplier</TableHead>
 <TableHead>Amount Due</TableHead>
 <TableHead>Due Date</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {payables.map(po => (
 <TableRow key={po.id}>
 <TableCell>
 <div className="font-semibold text-gray-900">{po.supplier_name}</div>
 <div className="text-xs text-gray-500">{po.po_number}</div>
 </TableCell>
 <TableCell className="font-bold text-foreground">₹{Number(po.total_amount - po.amount_paid).toLocaleString('en-IN')}</TableCell>
 <TableCell>
 {po.expected_delivery_date ? (
 <span className={`flex items-center text-xs font-medium ${isOverdue(po.expected_delivery_date) ? 'text-red-600' : 'text-gray-600'}`}>
 {isOverdue(po.expected_delivery_date) && <AlertCircle className="w-3 h-3 mr-1" />}
 {new Date(po.expected_delivery_date).toLocaleDateString()}
 </span>
 ) : <span className="text-xs text-gray-400">No date</span>}
 </TableCell>
 </TableRow>
 ))}
 {payables.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-6 text-gray-500 text-sm">No pending payables.</TableCell></TableRow>}
 </TableBody>
 </Table>
 </CardContent>
 </Card>
 </div>
 </div>
 );
}
