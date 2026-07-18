import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Truck, Loader2 } from "lucide-react";

export interface Supplier {
 id: string;
 name: string;
 email?: string;
 phone?: string;
 gst_number?: string;
 address?: string;
}

export function SuppliersManagement() {
 const [suppliers, setSuppliers] = useState<Supplier[]>([]);
 const [loading, setLoading] = useState(true);
 const [isAdding, setIsAdding] = useState(false);
 const [editingId, setEditingId] = useState<string | null>(null);
 const { toast } = useToast();

 const [formData, setFormData] = useState<Partial<Supplier>>({
 name: "", email: "", phone: "", gst_number: "", address: ""
 });

 useEffect(() => {
 fetchSuppliers();
 }, []);

 const fetchSuppliers = async () => {
 setLoading(true);
 try {
 const { data, error } = await supabase.from('suppliers').select('*').order('name');
 if (error) {
 if (error.code === '42P01') {
 setSuppliers([]);
 } else {
 throw error;
 }
 } else {
 setSuppliers(data || []);
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
 const { error } = await supabase.from('suppliers').update(formData).eq('id', editingId);
 if (error) throw error;
 toast({ title: "Updated", description: "Supplier updated." });
 } else {
 const { error } = await supabase.from('suppliers').insert([formData]);
 if (error) throw error;
 toast({ title: "Created", description: "Supplier added." });
 }
 setIsAdding(false);
 setEditingId(null);
 fetchSuppliers();
 } catch (error: any) {
 toast({ title: "Error", description: error.message, variant: "destructive" });
 }
 };

 const handleEdit = (s: Supplier) => {
 setFormData(s);
 setEditingId(s.id);
 setIsAdding(true);
 };

 const handleDelete = async (id: string) => {
 if (!confirm("Are you sure?")) return;
 try {
 const { error } = await supabase.from('suppliers').delete().eq('id', id);
 if (error) throw error;
 toast({ title: "Deleted", description: "Supplier removed." });
 fetchSuppliers();
 } catch (error: any) {
 toast({ title: "Error", description: error.message, variant: "destructive" });
 }
 };

 if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-foreground" /></div>;

 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <h3 className="text-lg font-semibold text-gray-800 flex items-center"><Truck className="w-5 h-5 mr-2 text-foreground" /> Suppliers Directory</h3>
 <Button onClick={() => {
 setIsAdding(!isAdding);
 setEditingId(null);
 setFormData({ name: "", email: "", phone: "", gst_number: "", address: "" });
 }} className="bg-secondary hover:bg-secondary">
 {isAdding ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add Supplier</>}
 </Button>
 </div>

 {isAdding && (
 <Card className="bg-muted/50/50 border-border">
 <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
 <div><label className="text-xs block mb-1">Company / Individual Name *</label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
 <div><label className="text-xs block mb-1">Email</label><Input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
 <div><label className="text-xs block mb-1">Phone</label><Input value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
 <div><label className="text-xs block mb-1">GST Number</label><Input value={formData.gst_number || ''} onChange={e => setFormData({...formData, gst_number: e.target.value})} /></div>
 <div className="md:col-span-2"><label className="text-xs block mb-1">Address</label><Input value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
 <div className="md:col-span-2 flex justify-end"><Button onClick={handleSave} className="bg-secondary">Save Supplier</Button></div>
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
 {suppliers.map(s => (
 <TableRow key={s.id}>
 <TableCell className="font-semibold text-gray-900">{s.name}</TableCell>
 <TableCell>
 <div className="text-sm">{s.email}</div>
 <div className="text-xs text-gray-500">{s.phone}</div>
 </TableCell>
 <TableCell className="font-mono text-sm">{s.gst_number || '-'}</TableCell>
 <TableCell className="text-sm max-w-[200px] truncate">{s.address || '-'}</TableCell>
 <TableCell className="text-right">
 <Button size="sm" variant="ghost" onClick={() => handleEdit(s)}><Edit className="w-4 h-4 text-foreground" /></Button>
 <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
 </TableCell>
 </TableRow>
 ))}
 {suppliers.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No suppliers found.</TableCell></TableRow>}
 </TableBody>
 </Table>
 </CardContent>
 </Card>
 </div>
 );
}
