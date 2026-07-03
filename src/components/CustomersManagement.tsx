import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users, Loader2 } from "lucide-react";

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  gst_number?: string;
  address?: string;
}

export function CustomersManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: "", email: "", phone: "", gst_number: "", address: ""
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('customers').select('*').order('name');
      if (error) {
        if (error.code === '42P01') {
          setCustomers([]);
        } else {
          throw error;
        }
      } else {
        setCustomers(data || []);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({ title: "Required", description: "Name is required", variant: "destructive" });
      return;
    }
    try {
      if (editingId) {
        const { error } = await supabase.from('customers').update(formData).eq('id', editingId);
        if (error) throw error;
        toast({ title: "Updated", description: "Customer updated." });
      } else {
        const { error } = await supabase.from('customers').insert([formData]);
        if (error) throw error;
        toast({ title: "Created", description: "Customer added." });
      }
      setIsAdding(false);
      setEditingId(null);
      fetchCustomers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (c: Customer) => {
    setFormData(c);
    setEditingId(c.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Customer removed." });
      fetchCustomers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center"><Users className="w-5 h-5 mr-2 text-indigo-600" /> Customers Directory</h3>
        <Button onClick={() => {
          setIsAdding(!isAdding);
          setEditingId(null);
          setFormData({ name: "", email: "", phone: "", gst_number: "", address: "" });
        }} className="bg-indigo-600 hover:bg-indigo-700">
          {isAdding ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add Customer</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-indigo-50/50 border-indigo-100">
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs block mb-1">Company / Individual Name *</label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div><label className="text-xs block mb-1">Email</label><Input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
            <div><label className="text-xs block mb-1">Phone</label><Input value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
            <div><label className="text-xs block mb-1">GST Number</label><Input value={formData.gst_number || ''} onChange={e => setFormData({...formData, gst_number: e.target.value})} /></div>
            <div className="md:col-span-2"><label className="text-xs block mb-1">Address</label><Input value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
            <div className="md:col-span-2 flex justify-end"><Button onClick={handleSave} className="bg-indigo-600">Save Customer</Button></div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>GST Number</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold text-gray-900">{c.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">{c.email}</div>
                    <div className="text-xs text-gray-500">{c.phone}</div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{c.gst_number || '-'}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{c.address || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(c)}><Edit className="w-4 h-4 text-blue-600" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No customers found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
