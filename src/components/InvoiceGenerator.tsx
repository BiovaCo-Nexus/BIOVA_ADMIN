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
    
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const rightMargin = pageWidth - margin;
    
    // Outer border
    doc.setLineWidth(0.2);
    doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);

    // Row 1: Header
    doc.setFontSize(8);
    doc.text("Page No. 1 of 1", margin + 2, margin + 4);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${inv.invoice_type.toUpperCase()} INVOICE`, pageWidth / 2, margin + 4, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Original Copy", rightMargin - 2, margin + 4, { align: 'right' });
    doc.line(margin, margin + 6, rightMargin, margin + 6);

    // Row 2: Company Info & Logo
    try {
      const imgData = await fetch('/uploads/Logo.png')
        .then(res => res.blob())
        .then(blob => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        }));
      doc.addImage(imgData, 'PNG', margin + 2, margin + 8, 25, 25);
    } catch (e) {
      console.warn('Could not load logo for invoice', e);
      doc.rect(margin + 2, margin + 8, 25, 25);
      doc.setFontSize(10);
      doc.text("Add\nLogo", margin + 14, margin + 20, { align: 'center' });
    }
    
    const centerX = pageWidth / 2;
    let currentY = margin + 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("BiovaCo Nexus Private Limited", centerX, currentY, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    currentY += 4;
    doc.text("Business Off: 1st Floor, RBU, TBI, Katol Rd, Bupeshnagar, Nagpur, Maharashtra 440013", centerX, currentY, { align: 'center' });
    currentY += 3;
    doc.text("Reg Off: H. No. 72, Bhagchand Nagar, Dhamangaon Railway, Maharashtra 444709", centerX, currentY, { align: 'center' });
    currentY += 4;
    doc.text("Mobile: +91 9226595332 | Email: hello@biovaco.in", centerX, currentY, { align: 'center' });
    currentY += 4;
    doc.text("GSTIN: 27AABCU9603R1ZX | PAN: AABCU9603R", centerX, currentY, { align: 'center' });
    currentY += 4;
    doc.text("CIN: U46300ME2026PTC475352", centerX, currentY, { align: 'center' });

    currentY = margin + 35;
    doc.line(margin, currentY, rightMargin, currentY);

    // Row 3: Invoice Details & Transporter
    const midX = pageWidth / 2;
    doc.line(midX, currentY, midX, currentY + 30);
    
    let leftY = currentY + 5;
    const labelX = margin + 2;
    const valueX = margin + 35;
    doc.setFont("helvetica", "bold"); doc.text("Invoice Number", labelX, leftY); doc.text(`: ${inv.invoice_number}`, valueX, leftY);
    leftY += 5;
    doc.text("Invoice Date", labelX, leftY); doc.setFont("helvetica", "normal"); doc.text(`: ${new Date(inv.issue_date).toLocaleDateString()}`, valueX, leftY);
    leftY += 5;
    doc.setFont("helvetica", "bold"); doc.text("Due Date", labelX, leftY); doc.setFont("helvetica", "normal"); doc.text(`: ${inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}`, valueX, leftY);
    leftY += 5;
    doc.setFont("helvetica", "bold"); doc.text("Place of Supply", labelX, leftY); doc.setFont("helvetica", "normal"); doc.text(`: 27 - Maharashtra`, valueX, leftY);
    leftY += 5;
    doc.setFont("helvetica", "bold"); doc.text("Reverse Charge", labelX, leftY); doc.setFont("helvetica", "normal"); doc.text(`: No`, valueX, leftY);
    
    let rightY = currentY + 5;
    const rLabelX = midX + 2;
    const rValueX = midX + 35;
    doc.setFont("helvetica", "bold"); doc.text("Transporter Details", rLabelX, rightY);
    rightY += 5;
    doc.text("Transporter", rLabelX, rightY); doc.setFont("helvetica", "normal"); doc.text(`: N/A`, rValueX, rightY);
    rightY += 5;
    doc.setFont("helvetica", "bold"); doc.text("Vehicle No.", rLabelX, rightY); doc.setFont("helvetica", "normal"); doc.text(`: N/A`, rValueX, rightY);
    
    currentY += 30;
    doc.line(margin, currentY, rightMargin, currentY);

    // Row 4: Billing & Shipping
    doc.line(midX, currentY, midX, currentY + 25);
    
    leftY = currentY + 5;
    doc.setFont("helvetica", "bold"); doc.text("Billing Details", labelX, leftY);
    leftY += 5; doc.text("Name", labelX, leftY);
    leftY += 5; doc.setFont("helvetica", "normal"); doc.text(inv.client_name, labelX, leftY);
    leftY += 5; doc.text("GSTIN: Unregistered  | Mobile: N/A", labelX, leftY);

    rightY = currentY + 5;
    doc.setFont("helvetica", "bold"); doc.text("Shipping Details", rLabelX, rightY);
    rightY += 5; doc.text("Name", rLabelX, rightY);
    rightY += 5; doc.setFont("helvetica", "normal"); doc.text(inv.client_name, rLabelX, rightY);
    rightY += 5; doc.text("GSTIN: Unregistered  | Mobile: N/A", rLabelX, rightY);

    currentY += 25;
    doc.line(margin, currentY, rightMargin, currentY);

    // IRN Row
    currentY += 5;
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(`IRN- N/A | Ack No.- N/A | Ack Date- N/A`, labelX, currentY);
    currentY += 2;
    
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.2, textColor: [0,0,0] },
      headStyles: { fillColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      columnStyles: { 0: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' } },
      head: [['Sr.', 'Item Description', 'HSN/SAC', 'Qty', 'Unit', 'List Price', 'Disc.', 'Tax %', 'Amount (Rs)']],
      body: [
        ['1', 'Professional Services / Goods', '9983', '1.00', 'Nos', inv.subtotal.toFixed(2), '0.00', '18.00', inv.subtotal.toFixed(2)]
      ]
    });

    const finalY = (doc as any).lastAutoTable.finalY || currentY + 10;
    
    // Totals
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Total", midX, finalY + 5, { align: 'center' });
    doc.text(inv.total_amount.toFixed(2), rightMargin - 2, finalY + 5, { align: 'right' });
    doc.line(margin, finalY + 7, rightMargin, finalY + 7);
    
    doc.setFontSize(8);
    doc.text(`Rs. ${inv.total_amount.toLocaleString('en-IN')} Only`, margin + 2, finalY + 12);
    doc.text(`Settled by - Bank : 0.00 | Invoice Balance : ${inv.total_amount.toFixed(2)}`, margin + 2, finalY + 17);
    doc.setFont("helvetica", "normal");
    doc.text(`Sale @18% = ${inv.subtotal.toFixed(2)}, IGST = ${inv.gst_amount.toFixed(2)} | Total Sale = ${inv.subtotal.toFixed(2)}, Tax = ${inv.gst_amount.toFixed(2)}`, margin + 2, finalY + 22);
    doc.line(margin, finalY + 24, rightMargin, finalY + 24);

    const bottomY = finalY + 24;
    const colWidth = (pageWidth - 2 * margin) / 3;
    doc.line(margin + colWidth, bottomY, margin + colWidth, pageHeight - margin);
    doc.line(margin + 2 * colWidth, bottomY, margin + 2 * colWidth, pageHeight - margin);
    
    // Left
    doc.setFont("helvetica", "bold"); doc.text("Terms and Conditions", margin + 2, bottomY + 5);
    doc.setFontSize(7); doc.text("E & O.E", margin + 2, bottomY + 9);
    doc.text("1. Goods once sold will not be taken back.", margin + 2, bottomY + 13, { maxWidth: colWidth - 4 });
    doc.text("2. Interest @ 18% p.a. will be charged if", margin + 2, bottomY + 21, { maxWidth: colWidth - 4 });
    doc.text("   payment is not made within time.", margin + 2, bottomY + 25, { maxWidth: colWidth - 4 });
    doc.text("3. Subject to jurisdiction only.", margin + 2, bottomY + 33, { maxWidth: colWidth - 4 });

    // Middle
    doc.rect(margin + colWidth + 20, bottomY + 5, 20, 20); // Bank QR placeholder
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold"); doc.text("Account Number:", margin + colWidth + 2, bottomY + 33);
    doc.setFont("helvetica", "normal"); doc.text("123456789", margin + colWidth + 2, bottomY + 37);
    doc.setFont("helvetica", "bold"); doc.text("Bank:", margin + colWidth + 2, bottomY + 43); doc.setFont("helvetica", "normal"); doc.text(" ICICI Bank", margin + colWidth + 12, bottomY + 43);
    doc.setFont("helvetica", "bold"); doc.text("IFSC:", margin + colWidth + 2, bottomY + 49); doc.setFont("helvetica", "normal"); doc.text(" ICIC0001234", margin + colWidth + 12, bottomY + 49);
    doc.setFont("helvetica", "bold"); doc.text("Branch:", margin + colWidth + 2, bottomY + 55); doc.setFont("helvetica", "normal"); doc.text(" Noida", margin + colWidth + 15, bottomY + 55);
    doc.setFont("helvetica", "bold"); doc.text("Name:", margin + colWidth + 2, bottomY + 61); doc.setFont("helvetica", "normal"); doc.text(" BiovaCo Nexus", margin + colWidth + 12, bottomY + 61);

    // Right
    doc.setFont("helvetica", "bold");
    doc.text("E-Invoice QR", margin + 2 * colWidth + colWidth/2, bottomY + 5, { align: 'center' });
    doc.rect(margin + 2 * colWidth + 20, bottomY + 8, 20, 20); // E-Invoice QR placeholder
    doc.text("For BiovaCo Nexus Pvt Ltd", rightMargin - 2, bottomY + 35, { align: 'right' });
    doc.text("Signature", rightMargin - 2, bottomY + 61, { align: 'right' });

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
