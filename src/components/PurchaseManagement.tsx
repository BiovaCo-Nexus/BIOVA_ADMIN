import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, ShoppingCart, Loader2 } from "lucide-react";

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_name: string;
  order_date: string;
  expected_delivery_date?: string;
  total_amount: number;
  amount_paid: number;
  due_amount: number;
  payment_status: string;
  order_status: string;
}

export function PurchaseManagement() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<{name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<PurchaseOrder>>({
    po_number: "", supplier_name: "", order_date: new Date().toISOString().split('T')[0], total_amount: 0, amount_paid: 0, payment_status: "Pending", order_status: "Draft"
  });

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase.from('suppliers').select('name');
      if (!error && data) setSuppliers(data);
    } catch (e) {}
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('purchase_orders').select('*').order('order_date', { ascending: false });
      if (error) {
        if (error.code === '42P01') {
          console.log("Purchase orders table does not exist yet.");
          setOrders([]);
        } else {
          throw error;
        }
      } else {
        setOrders(data || []);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        const { error } = await supabase.from('purchase_orders').update(formData).eq('id', editingId);
        if (error) throw error;
        toast({ title: "Updated", description: "Purchase order updated successfully." });
      } else {
        const { error } = await supabase.from('purchase_orders').insert([formData]);
        if (error) throw error;
        toast({ title: "Created", description: "Purchase order created successfully." });
      }
      setIsAdding(false);
      setEditingId(null);
      fetchOrders();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (order: PurchaseOrder) => {
    setFormData(order);
    setEditingId(order.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Order removed." });
      fetchOrders();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const totalPayables = orders.reduce((sum, o) => sum + (o.total_amount - o.amount_paid), 0);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-blue-600 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Total Purchase Orders</p>
            <h3 className="text-xl font-bold">{orders.length}</h3>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-rose-500 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Total Due to Suppliers</p>
            <h3 className="text-xl font-bold text-rose-700">₹{totalPayables.toLocaleString('en-IN')}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Purchase Orders</h3>
        <Button onClick={() => {
          setIsAdding(!isAdding);
          setEditingId(null);
          setFormData({ po_number: `PO-${Date.now().toString().slice(-6)}`, supplier_name: "", order_date: new Date().toISOString().split('T')[0], total_amount: 0, amount_paid: 0, payment_status: "Pending", order_status: "Draft" });
        }} className="bg-indigo-600 hover:bg-indigo-700">
          {isAdding ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> New PO</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-indigo-50/50 border-indigo-100">
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="text-xs block mb-1">PO Number</label><Input value={formData.po_number} onChange={e => setFormData({...formData, po_number: e.target.value})} /></div>
            <div><label className="text-xs block mb-1">Supplier Name</label>
              <Select value={formData.supplier_name} onValueChange={v => setFormData({...formData, supplier_name: v})}>
                <SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-xs block mb-1">Order Date</label><Input type="date" value={formData.order_date} onChange={e => setFormData({...formData, order_date: e.target.value})} /></div>
            <div><label className="text-xs block mb-1">Expected Delivery</label><Input type="date" value={formData.expected_delivery_date || ''} onChange={e => setFormData({...formData, expected_delivery_date: e.target.value})} /></div>
            <div><label className="text-xs block mb-1">Total Amount (₹)</label><Input type="number" value={formData.total_amount} onChange={e => setFormData({...formData, total_amount: Number(e.target.value)})} /></div>
            <div><label className="text-xs block mb-1">Amount Paid (₹)</label><Input type="number" value={formData.amount_paid} onChange={e => setFormData({...formData, amount_paid: Number(e.target.value)})} /></div>
            <div><label className="text-xs block mb-1">Payment Status</label>
              <Select value={formData.payment_status} onValueChange={v => setFormData({...formData, payment_status: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Partial">Partial</SelectItem><SelectItem value="Paid">Paid</SelectItem></SelectContent>
              </Select>
            </div>
            <div><label className="text-xs block mb-1">Order Status</label>
              <Select value={formData.order_status} onValueChange={v => setFormData({...formData, order_status: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Sent">Sent</SelectItem><SelectItem value="Received">Received</SelectItem><SelectItem value="Cancelled">Cancelled</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3 flex justify-end"><Button onClick={handleSave} className="bg-indigo-600">Save PO</Button></div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>PO Number & Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Total Amt</TableHead>
                <TableHead>Due Amt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(order => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-semibold text-gray-900">{order.po_number}</div>
                    <div className="text-xs text-gray-500">{new Date(order.order_date).toLocaleDateString('en-IN')}</div>
                  </TableCell>
                  <TableCell className="font-medium">{order.supplier_name}</TableCell>
                  <TableCell>₹{Number(order.total_amount).toLocaleString('en-IN')}</TableCell>
                  <TableCell className="font-bold text-rose-600">₹{Number(order.total_amount - order.amount_paid).toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="mr-1">{order.order_status}</Badge>
                    <Badge className={order.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}>{order.payment_status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(order)}><Edit className="w-4 h-4 text-blue-600" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(order.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No purchase orders found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
