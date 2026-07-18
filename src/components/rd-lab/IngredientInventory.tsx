import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Plus, Edit, Trash2, X, Check, Loader2, Scale, AlertTriangle } from "lucide-react"

interface InventoryItem {
 id: string; material_id: string; material_name: string;
 available_qty: number; unit: string; reorder_level: number;
 expiry_date: string; batch_number: string; supplier: string;
}

const emptyForm = (): Partial<InventoryItem> => ({
 material_id: "", material_name: "", available_qty: 0, unit: "kg",
 reorder_level: 0, expiry_date: "", batch_number: "", supplier: ""
})

export function IngredientInventory() {
 const { toast } = useToast()
 const [inventory, setInventory] = useState<InventoryItem[]>([])
 const [materials, setMaterials] = useState<{id: string, name: string}[]>([])
 const [isLoading, setIsLoading] = useState(true)
 const [isEditing, setIsEditing] = useState(false)
 const [isSaving, setIsSaving] = useState(false)
 const [form, setForm] = useState(emptyForm())

 const fetchData = async () => {
 try {
 setIsLoading(true)
 const [invRes, matRes] = await Promise.all([
 supabase.from("rd_ingredient_inventory").select("*").order("material_name"),
 supabase.from("rd_raw_materials").select("id, name").order("name")
 ])
 if (invRes.error) throw invRes.error
 if (matRes.error) throw matRes.error
 setInventory(invRes.data || [])
 setMaterials(matRes.data || [])
 } catch (e: any) { toast({ title: "Error loading inventory", description: e.message, variant: "destructive" }) }
 finally { setIsLoading(false) }
 }

 useEffect(() => { fetchData() }, [])

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!form.material_name?.trim()) { toast({ title: "Material name required", variant: "destructive" }); return }
 try {
 setIsSaving(true)
 const payload = {
 material_id: form.material_id || null, material_name: form.material_name,
 available_qty: form.available_qty || 0, unit: form.unit || "kg",
 reorder_level: form.reorder_level || 0, expiry_date: form.expiry_date || null,
 batch_number: form.batch_number, supplier: form.supplier
 }
 if (form.id) {
 const { error } = await supabase.from("rd_ingredient_inventory").update(payload).eq("id", form.id)
 if (error) throw error
 toast({ title: "Inventory updated" })
 } else {
 const { error } = await supabase.from("rd_ingredient_inventory").insert([payload])
 if (error) throw error
 toast({ title: "Item added to inventory" })
 }
 setIsEditing(false)
 fetchData()
 } catch (e: any) { toast({ title: "Error saving", description: e.message, variant: "destructive" }) }
 finally { setIsSaving(false) }
 }

 const handleDelete = async (id: string) => {
 if (!window.confirm("Delete this inventory record?")) return
 const { error } = await supabase.from("rd_ingredient_inventory").delete().eq("id", id)
 if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
 toast({ title: "Record deleted" })
 fetchData()
 }

 const handleMaterialSelect = (matId: string) => {
 const mat = materials.find(m => m.id === matId)
 if (mat) setForm({ ...form, material_id: mat.id, material_name: mat.name })
 }

 const handleEdit = (item: InventoryItem) => { setForm({ ...item }); setIsEditing(true) }
 const resetForm = () => { setForm(emptyForm()); setIsEditing(false) }

 if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-foreground" /></div>

 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <h2 className="text-xl font-bold text-foreground">Ingredient Inventory</h2>
 {!isEditing && <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-2" />Add Stock</Button>}
 </div>

 {isEditing ? (
 <Card className=" ">
 <CardHeader className="pb-3">
 <div className="flex justify-between items-center">
 <CardTitle className="text-foreground">{form.id ? "Edit Stock" : "New Stock Entry"}</CardTitle>
 <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
 </div>
 </CardHeader>
 <CardContent>
 <form onSubmit={handleSubmit} className="space-y-5">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5"><label className="text-sm font-medium">Link to Raw Material</label>
 <Select value={form.material_id || ""} onValueChange={handleMaterialSelect}>
 <SelectTrigger><SelectValue placeholder="Select existing material..." /></SelectTrigger>
 <SelectContent>{materials.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
 </Select>
 </div>
 <div className="space-y-1.5"><label className="text-sm font-medium">Material Name *</label>
 <Input required value={form.material_name || ""} onChange={e => setForm({ ...form, material_name: e.target.value })} placeholder="E.g. Mango Powder" /></div>
 
 <div className="flex gap-4">
 <div className="space-y-1.5 flex-1"><label className="text-sm font-medium">Available Qty</label>
 <Input type="number" step="0.01" value={form.available_qty || 0} onChange={e => setForm({ ...form, available_qty: parseFloat(e.target.value) || 0 })} /></div>
 <div className="space-y-1.5 w-24"><label className="text-sm font-medium">Unit</label>
 <Select value={form.unit || "kg"} onValueChange={v => setForm({ ...form, unit: v })}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent><SelectItem value="kg">kg</SelectItem><SelectItem value="g">g</SelectItem><SelectItem value="L">L</SelectItem><SelectItem value="ml">ml</SelectItem></SelectContent>
 </Select>
 </div>
 </div>
 
 <div className="space-y-1.5"><label className="text-sm font-medium">Reorder Level (Alert below this)</label>
 <Input type="number" step="0.01" value={form.reorder_level || 0} onChange={e => setForm({ ...form, reorder_level: parseFloat(e.target.value) || 0 })} /></div>
 <div className="space-y-1.5"><label className="text-sm font-medium">Batch Number</label>
 <Input value={form.batch_number || ""} onChange={e => setForm({ ...form, batch_number: e.target.value })} placeholder="BATCH-001" /></div>
 <div className="space-y-1.5"><label className="text-sm font-medium">Expiry Date</label>
 <Input type="date" value={form.expiry_date || ""} onChange={e => setForm({ ...form, expiry_date: e.target.value })} /></div>
 <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-medium">Supplier / Vendor</label>
 <Input value={form.supplier || ""} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="Vendor Corp" /></div>
 </div>

 <div className="flex justify-end gap-2 pt-2">
 <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
 <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
 {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}{form.id ? "Update" : "Save"}
 </Button>
 </div>
 </form>
 </CardContent>
 </Card>
 ) : (
 <Card><CardContent className="p-0">
 {inventory.length === 0 ? (
 <div className="p-12 text-center"><Scale className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Inventory is empty. Add your first stock entry.</p></div>
 ) : (
 <div className="overflow-x-auto w-full"><Table className="min-w-[600px] mb-4"><TableHeader><TableRow>
 <TableHead>Material</TableHead><TableHead>Stock Level</TableHead><TableHead>Status</TableHead><TableHead>Batch</TableHead><TableHead>Expiry</TableHead><TableHead className="text-right">Actions</TableHead>
 </TableRow></TableHeader>
 <TableBody>{inventory.map(item => {
 const isLow = item.available_qty <= item.reorder_level;
 return (
 <TableRow key={item.id} className={isLow ? "bg-red-50/50" : ""}>
 <TableCell className="font-medium">{item.material_name}</TableCell>
 <TableCell className="font-bold">{item.available_qty} {item.unit}</TableCell>
 <TableCell>
 {isLow ? <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200"><AlertTriangle className="h-3 w-3 mr-1" />Low Stock</Badge> : <Badge variant="outline" className="bg-primary/10 text-foreground border-border">In Stock</Badge>}
 </TableCell>
 <TableCell>{item.batch_number || "—"}</TableCell>
 <TableCell>{item.expiry_date || "—"}</TableCell>
 <TableCell className="text-right">
 <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit className="h-4 w-4 text-foreground" /></Button>
 <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
 </TableCell>
 </TableRow>
 )
 })}</TableBody>
 </Table></div>
 )}
 </CardContent></Card>
 )}
 </div>
 )
}
