import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, AlertTriangle, Package, Loader2 } from "lucide-react";

export interface InventoryItem {
  id: string;
  item_code: string;
  name: string;
  category: string;
  hsn_code?: string;
  quantity: number;
  unit_price: number;
  low_stock_threshold: number;
  damaged_quantity: number;
  last_restocked_at?: string;
}

export function InventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    item_code: "", name: "", category: "Raw Materials", hsn_code: "", quantity: 0, unit_price: 0, low_stock_threshold: 10, damaged_quantity: 0
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('inventory_items').select('*').order('name');
      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist yet, handle gracefully
          console.log("Inventory table does not exist yet.");
          setItems([]);
        } else {
          throw error;
        }
      } else {
        setItems(data || []);
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
        const { error } = await supabase.from('inventory_items').update(formData).eq('id', editingId);
        if (error) throw error;
        toast({ title: "Updated", description: "Item updated successfully." });
      } else {
        const { error } = await supabase.from('inventory_items').insert([formData]);
        if (error) throw error;
        toast({ title: "Created", description: "Item added successfully." });
      }
      setIsAdding(false);
      setEditingId(null);
      fetchItems();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setFormData(item);
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Item removed." });
      fetchItems();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const lowStockItems = items.filter(i => i.quantity <= i.low_stock_threshold);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-600 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Total Items Types</p>
            <h3 className="text-xl font-bold">{items.length}</h3>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-600 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Total Stock Value</p>
            <h3 className="text-xl font-bold text-emerald-700">₹{totalValue.toLocaleString('en-IN')}</h3>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Low Stock Alerts</p>
            <div className="flex items-center">
              <h3 className={`text-xl font-bold ${lowStockItems.length > 0 ? 'text-orange-600' : 'text-gray-800'}`}>{lowStockItems.length} Items</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Inventory Valuation & Stock</h3>
        <Button onClick={() => {
          setIsAdding(!isAdding);
          setEditingId(null);
          setFormData({ item_code: `ITM-${Date.now().toString().slice(-6)}`, name: "", category: "Raw Materials", hsn_code: "", quantity: 0, unit_price: 0, low_stock_threshold: 10, damaged_quantity: 0 });
        }} className="bg-blue-600 hover:bg-blue-700">
          {isAdding ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add Item</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="text-xs block mb-1">Item Code</label><Input value={formData.item_code} onChange={e => setFormData({...formData, item_code: e.target.value})} /></div>
            <div><label className="text-xs block mb-1">Name</label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div><label className="text-xs block mb-1">Category</label>
              <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="Raw Materials">Raw Materials</SelectItem><SelectItem value="Packaging">Packaging</SelectItem><SelectItem value="Finished Goods">Finished Goods</SelectItem></SelectContent>
              </Select>
            </div>
            <div><label className="text-xs block mb-1">HSN Code</label><Input value={formData.hsn_code || ''} onChange={e => setFormData({...formData, hsn_code: e.target.value})} /></div>
            <div><label className="text-xs block mb-1">Quantity in Stock</label><Input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} /></div>
            <div><label className="text-xs block mb-1">Unit Price (₹)</label><Input type="number" value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: Number(e.target.value)})} /></div>
            <div><label className="text-xs block mb-1">Low Stock Threshold</label><Input type="number" value={formData.low_stock_threshold} onChange={e => setFormData({...formData, low_stock_threshold: Number(e.target.value)})} /></div>
            <div><label className="text-xs block mb-1 text-red-500">Damaged Qty</label><Input type="number" value={formData.damaged_quantity} onChange={e => setFormData({...formData, damaged_quantity: Number(e.target.value)})} /></div>
            <div className="md:col-span-3 flex justify-end"><Button onClick={handleSave} className="bg-blue-600">Save Item</Button></div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Code & Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock Qty</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{item.item_code} {item.hsn_code ? `| HSN: ${item.hsn_code}` : ''}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                  <TableCell>
                    <div className="font-medium">{item.quantity}</div>
                    {item.damaged_quantity > 0 && <div className="text-xs text-red-500">{item.damaged_quantity} damaged</div>}
                  </TableCell>
                  <TableCell className="font-bold text-gray-800">₹{(item.quantity * item.unit_price).toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    {item.quantity <= item.low_stock_threshold ? (
                      <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="w-3 h-3 mr-1" /> Low Stock</Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-800">In Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}><Edit className="w-4 h-4 text-blue-600" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No inventory items. Did you run the SQL migration?</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
