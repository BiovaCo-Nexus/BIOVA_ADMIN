import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Plus, Edit, Trash2, X, Check, Loader2, ListChecks } from "lucide-react"

interface QCChecklist {
 id: string; batch_id: string; product_name: string;
 moisture: boolean; weight_check: boolean; seal_quality: boolean;
 metal_detection: boolean; label_check: boolean; batch_code_check: boolean;
 mfg_date_check: boolean; expiry_check: boolean; inspector: string;
 inspection_date: string; passed: boolean; remarks: string;
}

const emptyForm = (): Partial<QCChecklist> => ({
 batch_id: "", product_name: "",
 moisture: false, weight_check: false, seal_quality: false, metal_detection: false,
 label_check: false, batch_code_check: false, mfg_date_check: false, expiry_check: false,
 inspector: "", inspection_date: new Date().toISOString().split("T")[0], passed: false, remarks: ""
})

const QC_FIELDS = [
 { key: "moisture", label: "Moisture Check" },
 { key: "weight_check", label: "Weight Verification" },
 { key: "seal_quality", label: "Seal Quality" },
 { key: "metal_detection", label: "Metal Detection" },
 { key: "label_check", label: "Label Correctness" },
 { key: "batch_code_check", label: "Batch Code Legibility" },
 { key: "mfg_date_check", label: "Mfg Date Format" },
 { key: "expiry_check", label: "Expiry Date Accuracy" },
] as const

export function QCChecklists() {
 const { toast } = useToast()
 const [lists, setLists] = useState<QCChecklist[]>([])
 const [trials, setTrials] = useState<{trial_no: string, recipe: {product_name: string}}[]>([])
 const [isLoading, setIsLoading] = useState(true)
 const [isEditing, setIsEditing] = useState(false)
 const [isSaving, setIsSaving] = useState(false)
 const [form, setForm] = useState(emptyForm())

 const fetchData = async () => {
 try {
 setIsLoading(true)
 const [listsRes, trialsRes] = await Promise.all([
 supabase.from("rd_qc_checklists").select("*").order("inspection_date", { ascending: false }),
 supabase.from("rd_batch_trials").select("trial_no, recipe:rd_recipes(product_name)").order("trial_no")
 ])
 if (listsRes.error) throw listsRes.error
 if (trialsRes.error) throw trialsRes.error
 setLists(listsRes.data as any)
 setTrials(trialsRes.data as any)
 } catch (e: any) { toast({ title: "Error loading QC lists", description: e.message, variant: "destructive" }) }
 finally { setIsLoading(false) }
 }

 useEffect(() => { fetchData() }, [])

 const handleBatchSelect = (v: string) => {
 const trial = trials.find(t => t.trial_no === v)
 setForm({ ...form, batch_id: v, product_name: trial?.recipe?.product_name || form.product_name })
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!form.batch_id?.trim()) { toast({ title: "Batch ID required", variant: "destructive" }); return }
 
 // Auto-calculate 'passed' (all checkboxes must be true to pass automatically, or admin overrides)
 const allChecked = QC_FIELDS.every(f => form[f.key as keyof QCChecklist] === true)
 
 try {
 setIsSaving(true)
 const payload = {
 batch_id: form.batch_id, product_name: form.product_name,
 moisture: form.moisture || false, weight_check: form.weight_check || false,
 seal_quality: form.seal_quality || false, metal_detection: form.metal_detection || false,
 label_check: form.label_check || false, batch_code_check: form.batch_code_check || false,
 mfg_date_check: form.mfg_date_check || false, expiry_check: form.expiry_check || false,
 inspector: form.inspector, inspection_date: form.inspection_date,
 passed: form.passed !== undefined ? form.passed : allChecked, remarks: form.remarks
 }
 
 if (form.id) {
 const { error } = await supabase.from("rd_qc_checklists").update(payload).eq("id", form.id)
 if (error) throw error
 toast({ title: "QC updated" })
 } else {
 const { error } = await supabase.from("rd_qc_checklists").insert([payload])
 if (error) throw error
 toast({ title: "QC logged" })
 }
 setIsEditing(false)
 fetchData()
 } catch (e: any) { toast({ title: "Error saving", description: e.message, variant: "destructive" }) }
 finally { setIsSaving(false) }
 }

 const handleDelete = async (id: string) => {
 if (!window.confirm("Delete this QC record?")) return
 const { error } = await supabase.from("rd_qc_checklists").delete().eq("id", id)
 if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
 toast({ title: "Record deleted" })
 fetchData()
 }

 const handleEdit = (item: QCChecklist) => { setForm({ ...item }); setIsEditing(true) }
 const resetForm = () => { setForm(emptyForm()); setIsEditing(false) }

 if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-foreground" /></div>

 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <h2 className="text-xl font-bold text-foreground">QC Checklists</h2>
 {!isEditing && <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-2" />New QC Form</Button>}
 </div>

 {isEditing ? (
 <Card className=" ">
 <CardHeader className="pb-3">
 <div className="flex justify-between items-center">
 <CardTitle className="text-foreground">{form.id ? "Edit QC Form" : "New QC Form"}</CardTitle>
 <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
 </div>
 </CardHeader>
 <CardContent>
 <form onSubmit={handleSubmit} className="space-y-5">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="space-y-1.5"><label className="text-sm font-medium">Batch ID *</label>
 <Select value={form.batch_id || ""} onValueChange={handleBatchSelect}>
 <SelectTrigger><SelectValue placeholder="Select batch..." /></SelectTrigger>
 <SelectContent>
 {trials.map(t => <SelectItem key={t.trial_no} value={t.trial_no}>{t.trial_no}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-medium">Product Name</label>
 <Input value={form.product_name || ""} onChange={e => setForm({ ...form, product_name: e.target.value })} /></div>
 <div className="space-y-1.5"><label className="text-sm font-medium">Date</label>
 <Input type="date" required value={form.inspection_date || ""} onChange={e => setForm({ ...form, inspection_date: e.target.value })} /></div>
 <div className="space-y-1.5"><label className="text-sm font-medium">Inspector</label>
 <Input value={form.inspector || ""} onChange={e => setForm({ ...form, inspector: e.target.value })} /></div>
 <div className="space-y-1.5"><label className="text-sm font-medium">Final Decision</label>
 <div className="flex items-center space-x-2 pt-2">
 <Checkbox id="passed" checked={form.passed} onCheckedChange={(c) => setForm({...form, passed: c === true})} />
 <label htmlFor="passed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">QC Passed</label>
 </div>
 </div>
 </div>

 <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
 <h4 className="font-medium text-sm text-foreground mb-3">Parameters</h4>
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 {QC_FIELDS.map(f => (
 <div key={f.key} className="flex items-center space-x-2 bg-white p-2 border rounded">
 <Checkbox id={f.key} checked={form[f.key as keyof QCChecklist] as boolean} onCheckedChange={(c) => setForm({...form, [f.key]: c === true})} />
 <label htmlFor={f.key} className="text-sm font-medium leading-none cursor-pointer">{f.label}</label>
 </div>
 ))}
 </div>
 </div>

 <div className="space-y-1.5"><label className="text-sm font-medium">Remarks / Fail Reasons</label>
 <Textarea value={form.remarks || ""} onChange={e => setForm({ ...form, remarks: e.target.value })} rows={2} /></div>

 <div className="flex justify-end gap-2 pt-2">
 <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
 <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
 {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}{form.id ? "Update" : "Save QC"}
 </Button>
 </div>
 </form>
 </CardContent>
 </Card>
 ) : (
 <Card><CardContent className="p-0">
 {lists.length === 0 ? (
 <div className="p-12 text-center"><ListChecks className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No QC records.</p></div>
 ) : (
 <div className="overflow-x-auto w-full"><Table className="min-w-[600px] mb-4"><TableHeader><TableRow>
 <TableHead>Date</TableHead><TableHead>Batch ID</TableHead><TableHead>Product</TableHead><TableHead>Inspector</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
 </TableRow></TableHeader>
 <TableBody>{lists.map(t => (
 <TableRow key={t.id}>
 <TableCell>{t.inspection_date}</TableCell>
 <TableCell className="font-medium">{t.batch_id}</TableCell>
 <TableCell>{t.product_name || "—"}</TableCell>
 <TableCell>{t.inspector || "—"}</TableCell>
 <TableCell>
 <Badge variant="outline" className={t.passed ? "bg-primary/10 text-foreground border-border" : "bg-red-100 text-red-700 border-red-200"}>
 {t.passed ? "PASSED" : "FAILED"}
 </Badge>
 </TableCell>
 <TableCell className="text-right">
 <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}><Edit className="h-4 w-4 text-foreground" /></Button>
 <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
