import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Receipt, FileText, Loader2, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  invoice_type: string;
  client_name: string;
  issue_date: string;
  due_date?: string;
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  status: string;
}

export function InvoiceGenerator() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [customers, setCustomers] = useState<{name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<InvoiceRecord>>({
    invoice_number: "", invoice_type: "Sales", client_name: "", issue_date: new Date().toISOString().split('T')[0], subtotal: 0, gst_amount: 0, total_amount: 0, status: "Unpaid"
  });

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase.from('customers').select('name');
      if (!error && data) setCustomers(data);
    } catch (e) {}
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('invoices').select('*').order('issue_date', { ascending: false });
      if (error) {
        if (error.code === '42P01') {
          console.log("Invoices table does not exist yet.");
          setInvoices([]);
        } else {
          throw error;
        }
      } else {
        setInvoices(data || []);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const total = Number(formData.subtotal || 0) + Number(formData.gst_amount || 0);
      const dataToSave = { ...formData, total_amount: total };

      if (editingId) {
        const { error } = await supabase.from('invoices').update(dataToSave).eq('id', editingId);
        if (error) throw error;
        toast({ title: "Updated", description: "Invoice updated successfully." });
      } else {
        const { error } = await supabase.from('invoices').insert([dataToSave]);
        if (error) throw error;
        toast({ title: "Created", description: "Invoice generated successfully." });
      }
      setIsAdding(false);
      setEditingId(null);
      fetchInvoices();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (inv: InvoiceRecord) => {
    setFormData(inv);
    setEditingId(inv.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Invoice removed." });
      fetchInvoices();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const generatePDF = async (inv: InvoiceRecord) => {
    const doc = new jsPDF();
    
    try {
      const imgData = await fetch('/pwa-192x192.png')
        .then(res => res.blob())
        .then(blob => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        }));
      
      doc.addImage(imgData, 'PNG', 14, 10, 25, 25);
    } catch (e) {
      console.warn('Could not load logo for invoice', e);
    }

    doc.setFontSize(24);
    doc.setTextColor(3, 46, 99); // #032E63 BiovaCo blue
    doc.text("BIOVACO NEXUS", 45, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("123 Innovation Drive, Tech Park", 45, 26);
    doc.text("City, State 400001, India", 45, 31);
    doc.text("GSTIN: 27AABCU9603R1ZX", 45, 36);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`${inv.invoice_type.toUpperCase()} INVOICE`, 140, 20);
    doc.setFontSize(10);
    doc.text(`Invoice Number: ${inv.invoice_number}`, 140, 26);
    doc.text(`Date: ${new Date(inv.issue_date).toLocaleDateString()}`, 140, 31);
    
    // Client details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Billed To:", 14, 55);
    doc.setFontSize(10);
    doc.text(inv.client_name, 14, 61);
    
    autoTable(doc, {
      startY: 70,
      headStyles: { fillColor: [8, 160, 75] }, // #08A04B
      head: [['Description', 'Subtotal (Rs)', 'GST (Rs)', 'Total (Rs)']],
      body: [
        ['Professional Services / Products', inv.subtotal.toFixed(2), inv.gst_amount.toFixed(2), inv.total_amount.toFixed(2)]
      ],
    });

    const finalY = (doc as any).lastAutoTable.finalY || 70;
    
    doc.setFontSize(12);
    doc.text(`Grand Total: Rs. ${inv.total_amount.toLocaleString('en-IN')}`, 140, finalY + 10);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for your business!", 105, 280, { align: "center" });
    
    doc.save(`${inv.invoice_number}.pdf`);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">GST Invoice Generator</h3>
        <Button onClick={() => {
          setIsAdding(!isAdding);
          setEditingId(null);
          setFormData({ invoice_number: `INV-${Date.now().toString().slice(-6)}`, invoice_type: "Sales", client_name: "", issue_date: new Date().toISOString().split('T')[0], subtotal: 0, gst_amount: 0, total_amount: 0, status: "Unpaid" });
        }} className="bg-purple-600 hover:bg-purple-700">
          {isAdding ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Create Invoice</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-purple-50/50 border-purple-100">
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="text-xs block mb-1">Invoice Number</label><Input value={formData.invoice_number} onChange={e => setFormData({...formData, invoice_number: e.target.value})} /></div>
            <div><label className="text-xs block mb-1">Type</label>
              <Select value={formData.invoice_type} onValueChange={v => setFormData({...formData, invoice_type: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="Sales">Sales Invoice</SelectItem><SelectItem value="Purchase">Purchase Invoice</SelectItem><SelectItem value="Credit Note">Credit Note</SelectItem></SelectContent>
              </Select>
            </div>
            <div><label className="text-xs block mb-1">Client/Customer Name</label>
              <Select value={formData.client_name} onValueChange={v => setFormData({...formData, client_name: v})}>
                <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-xs block mb-1">Issue Date</label><Input type="date" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} /></div>
            <div><label className="text-xs block mb-1">Due Date</label><Input type="date" value={formData.due_date || ''} onChange={e => setFormData({...formData, due_date: e.target.value})} /></div>
            <div><label className="text-xs block mb-1">Subtotal (₹)</label><Input type="number" value={formData.subtotal} onChange={e => setFormData({...formData, subtotal: Number(e.target.value)})} /></div>
            <div><label className="text-xs block mb-1">GST Amount (₹)</label><Input type="number" value={formData.gst_amount} onChange={e => setFormData({...formData, gst_amount: Number(e.target.value)})} /></div>
            <div><label className="text-xs block mb-1 font-bold">Total Amount</label><div className="p-2 bg-white border rounded">₹{Number(formData.subtotal || 0) + Number(formData.gst_amount || 0)}</div></div>
            <div><label className="text-xs block mb-1">Status</label>
              <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="Unpaid">Unpaid</SelectItem><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Overdue">Overdue</SelectItem><SelectItem value="Cancelled">Cancelled</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3 flex justify-end"><Button onClick={handleSave} className="bg-purple-600">Save Invoice</Button></div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <div className="font-semibold">{inv.invoice_number}</div>
                    <div className="text-xs text-gray-500">{new Date(inv.issue_date).toLocaleDateString()}</div>
                  </TableCell>
                  <TableCell className="font-medium">{inv.client_name}</TableCell>
                  <TableCell><Badge variant="outline">{inv.invoice_type}</Badge></TableCell>
                  <TableCell className="font-bold text-gray-900">₹{Number(inv.total_amount).toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <Badge className={inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : inv.status === 'Overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>{inv.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="mr-2" onClick={() => generatePDF(inv)}><Download className="w-3 h-3 mr-1" /> PDF</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(inv)}><Edit className="w-4 h-4 text-blue-600" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(inv.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No invoices generated.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
