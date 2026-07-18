import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Plus, Edit, Trash2, X, Check, Loader2, PackageSearch, ClipboardCheck } from "lucide-react"

interface Spec { key: string; value: string }
interface RawMaterial {
 id: string; name: string; supplier: string; cost_per_kg: number;
 moq: string; shelf_life: string; fssai_category: string;
 coa_url: string; specifications: Spec[]; notes: string;
}

const emptyForm = (): Partial<RawMaterial> => ({
 name: "", supplier: "", cost_per_kg: 0, moq: "",
 shelf_life: "", fssai_category: "", coa_url: "",
 specifications: [{ key: "", value: "" }], notes: "",
})

export function RawMaterialLibrary() {
 const { toast } = useToast()
 const [materials, setMaterials] = useState<RawMaterial[]>([])
 const [isLoading, setIsLoading] = useState(true)
 const [isEditing, setIsEditing] = useState(false)
 const [isPasting, setIsPasting] = useState(false)
 const [pasteText, setPasteText] = useState("")
 const [isSaving, setIsSaving] = useState(false)
 const [form, setForm] = useState(emptyForm())

 const [suppliers, setSuppliers] = useState<{name: string}[]>([])

 const fetchMaterials = async () => {
 try {
 setIsLoading(true)
 const [matRes, supRes] = await Promise.all([
 supabase.from("rd_raw_materials").select("*").order("name", { ascending: true }),
 supabase.from("rd_suppliers").select("name").order("name")
 ])
 if (matRes.error) throw matRes.error
 if (supRes.error) throw supRes.error
 
 const parsed = (matRes.data || []).map((m: any) => ({
 ...m,
 specifications: typeof m.specifications === "string" ? JSON.parse(m.specifications) : (m.specifications || []),
 }))
 setMaterials(parsed)
 setSuppliers(supRes.data || [])
 } catch (e: any) { toast({ title: "Error loading materials", description: e.message, variant: "destructive" }) }
 finally { setIsLoading(false) }
 }

 useEffect(() => { fetchMaterials() }, [])

 const handlePasteImport = async () => {
 const lines = pasteText.split(/\r?\n/).filter(line => line.trim() !== "");
 if (lines.length < 2) {
 toast({ title: "Invalid Data", description: "Please paste a header row and at least one data row from Excel.", variant: "destructive" });
 return;
 }

 setIsSaving(true);
 const headers = lines[0].split("\t").map(h => h.trim().toLowerCase());
 const rows = lines.slice(1);

 const mappings = {
 name: ['name', 'materialname', 'ingredientname', 'material', 'ingredient', 'rawmaterial'],
 supplier: ['supplier', 'vendor', 'source'],
 cost_per_kg: ['costperkg', 'cost/kg', 'cost', 'rate', 'price', 'unitprice', 'costperkg'],
 moq: ['moq', 'minimumorderquantity', 'minimumorder'],
 shelf_life: ['shelflife', 'shelf_life', 'expiry'],
 fssai_category: ['fssaicategory', 'fssai_category', 'category'],
 coa_url: ['coaurl', 'coa_url', 'coa'],
 notes: ['notes', 'note', 'description']
 };

 const dbRows: any[] = [];

 for (const row of rows) {
 const cols = row.split("\t");
 const dbRow: any = {};
 
 headers.forEach((header, index) => {
 const normHeader = header.replace(/[^a-z0-9]/g, '');
 const val = cols[index]?.trim() || '';

 for (const [dbCol, synonyms] of Object.entries(mappings)) {
 if (synonyms.includes(normHeader)) {
 if (dbCol === 'cost_per_kg') {
 const parsedNum = Number(val.replace(/[^0-9.-]+/g, ""));
 dbRow[dbCol] = isNaN(parsedNum) ? 0 : parsedNum;
 } else {
 dbRow[dbCol] = val;
 }
 break;
 }
 }
 });

 if (dbRow.name) {
 // Default specifications to empty array for rd_raw_materials
 dbRow.specifications = JSON.stringify([]);
 dbRows.push(dbRow);
 }
 }

 if (dbRows.length === 0) {
 toast({ title: "Import Failed", description: "Could not auto-detect the 'name' column. Please check your headers.", variant: "destructive" });
 setIsSaving(false);
 return;
 }

 try {
 const { error } = await supabase.from("rd_raw_materials").insert(dbRows);
 if (error) throw error;
 toast({ title: "Import Successful", description: `Successfully imported ${dbRows.length} materials.` });
 fetchMaterials();
 setIsPasting(false);
 setPasteText("");
 } catch (err: any) {
 toast({ title: "Import Failed", description: err.message, variant: "destructive" });
 } finally {
 setIsSaving(false);
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!form.name?.trim()) { toast({ title: "Name is required", variant: "destructive" }); return }
 try {
 setIsSaving(true)
 const payload = {
 name: form.name, supplier: form.supplier, cost_per_kg: form.cost_per_kg || 0,
 moq: form.moq, shelf_life: form.shelf_life, fssai_category: form.fssai_category,
 coa_url: form.coa_url, specifications: JSON.stringify(form.specifications), notes: form.notes,
 }
 if (form.id) {
 const { error } = await supabase.from("rd_raw_materials").update(payload).eq("id", form.id)
 if (error) throw error
 toast({ title: "Material updated" })
 } else {
 const { error } = await supabase.from("rd_raw_materials").insert([payload])
 if (error) throw error
 toast({ title: "Material added" })
 }
 setIsEditing(false)
 fetchMaterials()
 } catch (e: any) { toast({ title: "Error saving", description: e.message, variant: "destructive" }) }
 finally { setIsSaving(false) }
 }

 const handleDelete = async (id: string) => {
 if (!window.confirm("Delete this material?")) return
 const { error } = await supabase.from("rd_raw_materials").delete().eq("id", id)
 if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
 toast({ title: "Material deleted" })
 fetchMaterials()
 }

 const handleEdit = (m: RawMaterial) => { setForm({ ...m }); setIsEditing(true) }
 const resetForm = () => { setForm(emptyForm()); setIsEditing(false) }

 // Spec helpers
 const addSpec = () => setForm({ ...form, specifications: [...(form.specifications || []), { key: "", value: "" }] })
 const removeSpec = (i: number) => setForm({ ...form, specifications: (form.specifications || []).filter((_, idx) => idx !== i) })
 const updateSpec = (i: number, field: keyof Spec, val: string) => {
 const updated = [...(form.specifications || [])]
 updated[i] = { ...updated[i], [field]: val }
 setForm({ ...form, specifications: updated })
 }

 if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-foreground" /></div>

 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <h2 className="text-xl font-bold text-foreground">Raw Material Library</h2>
 {!isEditing && !isPasting && (
 <div className="flex gap-2">
 <Button onClick={() => { setPasteText(""); setIsPasting(true) }} variant="outline" className="border-border text-foreground hover:bg-muted/50">
 <ClipboardCheck className="h-4 w-4 mr-2" />Bulk Paste (Excel)
 </Button>
 <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-2" />Add Material</Button>
 </div>
 )}
 </div>

 {isPasting ? (
 <Card className=" ">
 <CardHeader className="pb-3">
 <div className="flex justify-between items-center">
 <CardTitle className="text-foreground flex items-center gap-2">
 <ClipboardCheck className="h-5 w-5 text-foreground" /> Excel/Sheets Bulk Paste
 </CardTitle>
 <Button variant="ghost" size="sm" onClick={() => setIsPasting(false)}><X className="h-4 w-4" /></Button>
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 <p className="text-sm text-gray-500">
 Copy rows from your Excel/Google Sheet (including the header row) and paste them below. 
 The system will auto-detect columns like <strong>Name, Supplier, Cost per Kg, MOQ, Shelf Life, Category, Notes</strong>.
 </p>
 <Textarea
 value={pasteText}
 onChange={e => setPasteText(e.target.value)}
 placeholder="Name&#9;Supplier&#9;Cost per Kg&#9;MOQ&#10;Sugar&#9;Local Vendor&#9;45&#9;50 kg&#10;Salt&#9;Tata Salt&#9;20&#9;100 kg"
 rows={10}
 className="font-mono text-xs"
 />
 <div className="flex justify-end gap-2">
 <Button variant="outline" onClick={() => setIsPasting(false)}>Cancel</Button>
 <Button onClick={handlePasteImport} disabled={isSaving || !pasteText.trim()} className="bg-secondary hover:bg-secondary text-white">
 {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />} Import Data
 </Button>
 </div>
 </CardContent>
 </Card>
 ) : isEditing ? (
 <Card className=" ">
 <CardHeader className="pb-3">
 <div className="flex justify-between items-center">
 <CardTitle className="text-foreground">{form.id ? "Edit Material" : "New Material"}</CardTitle>
 <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
 </div>
 </CardHeader>
 <CardContent>
 <form onSubmit={handleSubmit} className="space-y-5">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="space-y-1.5"><label className="text-sm font-medium">Material Name *</label>
 <Input required value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Mango Powder" /></div>
 <div className="space-y-1.5"><label className="text-sm font-medium">Supplier</label>
 <Select value={form.supplier || ""} onValueChange={v => setForm({ ...form, supplier: v })}>
 <SelectTrigger><SelectValue placeholder="Select supplier..." /></SelectTrigger>
 <SelectContent>
 {suppliers.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1.5"><label className="text-sm font-medium">Cost per Kg (₹)</label>
 <Input type="number" value={form.cost_per_kg || 0} onChange={e => setForm({ ...form, cost_per_kg: parseFloat(e.target.value) || 0 })} /></div>
 <div className="space-y-1.5"><label className="text-sm font-medium">MOQ</label>
 <Input value={form.moq || ""} onChange={e => setForm({ ...form, moq: e.target.value })} placeholder="50 kg" /></div>
 <div className="space-y-1.5"><label className="text-sm font-medium">Shelf Life</label>
 <Input value={form.shelf_life || ""} onChange={e => setForm({ ...form, shelf_life: e.target.value })} placeholder="12 months" /></div>
 <div className="space-y-1.5"><label className="text-sm font-medium">FSSAI Category</label>
 <Input value={form.fssai_category || ""} onChange={e => setForm({ ...form, fssai_category: e.target.value })} placeholder="Spices & Condiments" /></div>
 <div className="space-y-1.5 md:col-span-3"><label className="text-sm font-medium">COA Upload URL</label>
 <Input value={form.coa_url || ""} onChange={e => setForm({ ...form, coa_url: e.target.value })} placeholder="https://..." /></div>
 </div>

 {/* Specs */}
 <div className="space-y-2">
 <div className="flex items-center justify-between"><label className="text-sm font-semibold text-foreground">Specifications</label>
 <Button type="button" variant="outline" size="sm" onClick={addSpec}><Plus className="h-3 w-3 mr-1" />Add Spec</Button></div>
 <div className="border rounded-lg overflow-hidden">
 <div className="overflow-x-auto w-full"><Table className="min-w-[600px] mb-4"><TableHeader><TableRow><TableHead>Property</TableHead><TableHead>Requirement</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
 <TableBody>
 {(form.specifications || []).map((spec, i) => (
 <TableRow key={i}>
 <TableCell><Input className="h-8" value={spec.key} onChange={e => updateSpec(i, "key", e.target.value)} placeholder="Moisture" /></TableCell>
 <TableCell><Input className="h-8" value={spec.value} onChange={e => updateSpec(i, "value", e.target.value)} placeholder="< 5%" /></TableCell>
 <TableCell><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSpec(i)}><X className="h-3 w-3 text-red-400" /></Button></TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table></div>
 </div>
 </div>

 <div className="space-y-1.5"><label className="text-sm font-medium">Notes</label>
 <Textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>

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
 {materials.length === 0 ? (
 <div className="p-12 text-center"><PackageSearch className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No raw materials. Add items to your library.</p></div>
 ) : (
 <div className="overflow-x-auto w-full"><Table className="min-w-[600px] mb-4"><TableHeader><TableRow>
 <TableHead>Material Name</TableHead><TableHead>Supplier</TableHead><TableHead>Cost/kg</TableHead><TableHead>MOQ</TableHead><TableHead>Shelf Life</TableHead><TableHead className="text-right">Actions</TableHead>
 </TableRow></TableHeader>
 <TableBody>{materials.map(m => (
 <TableRow key={m.id}>
 <TableCell className="font-medium">{m.name}</TableCell>
 <TableCell>{m.supplier || "—"}</TableCell>
 <TableCell>₹{(m.cost_per_kg || 0).toLocaleString()}</TableCell>
 <TableCell>{m.moq || "—"}</TableCell>
 <TableCell>{m.shelf_life || "—"}</TableCell>
 <TableCell className="text-right">
 <Button variant="ghost" size="icon" onClick={() => handleEdit(m)}><Edit className="h-4 w-4 text-foreground" /></Button>
 <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
 </TableCell>
 </TableRow>
 ))}</TableBody>
 </Table></div>
 )}
 </CardContent></Card>
 )}
 </div>
 )
}
