import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Plus, Edit, Trash2, X, Check, Loader2, FileText, ArrowUp, ArrowDown } from "lucide-react"

interface SOPStep {
 order: number; title: string; description: string; duration: string; notes: string;
}

interface MfgSOP {
 id: string; product: string; version: string; steps: SOPStep[];
 status: string; approved_by: string; notes: string;
}

const emptyForm = (): Partial<MfgSOP> => ({
 product: "", version: "V1.0", steps: [{ order: 1, title: "", description: "", duration: "", notes: "" }],
 status: "draft", approved_by: "", notes: ""
})

export function ManufacturingSOP() {
 const { toast } = useToast()
 const [sops, setSops] = useState<MfgSOP[]>([])
 const [recipes, setRecipes] = useState<{product_name: string}[]>([])
 const [isLoading, setIsLoading] = useState(true)
 const [isEditing, setIsEditing] = useState(false)
 const [isSaving, setIsSaving] = useState(false)
 const [form, setForm] = useState(emptyForm())

 const fetchData = async () => {
 try {
 setIsLoading(true)
 const [sopsRes, recipesRes] = await Promise.all([
 supabase.from("rd_manufacturing_sops").select("*").order("product", { ascending: true }),
 supabase.from("rd_recipes").select("product_name").order("product_name")
 ])
 if (sopsRes.error) throw sopsRes.error
 if (recipesRes.error) throw recipesRes.error
 
 const parsed = (sopsRes.data || []).map((s: any) => ({
 ...s,
 steps: typeof s.steps === "string" ? JSON.parse(s.steps) : (s.steps || [])
 }))
 setSops(parsed)
 setRecipes(recipesRes.data || [])
 } catch (e: any) { toast({ title: "Error loading SOPs", description: e.message, variant: "destructive" }) }
 finally { setIsLoading(false) }
 }

 useEffect(() => { fetchData() }, [])

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!form.product?.trim()) { toast({ title: "Product name required", variant: "destructive" }); return }
 try {
 setIsSaving(true)
 const payload = {
 product: form.product, version: form.version,
 steps: JSON.stringify(form.steps), status: form.status,
 approved_by: form.approved_by, notes: form.notes
 }
 if (form.id) {
 const { error } = await supabase.from("rd_manufacturing_sops").update(payload).eq("id", form.id)
 if (error) throw error
 toast({ title: "SOP updated" })
 } else {
 const { error } = await supabase.from("rd_manufacturing_sops").insert([payload])
 if (error) throw error
 toast({ title: "SOP created" })
 }
 setIsEditing(false)
 fetchData()
 } catch (e: any) { toast({ title: "Error saving", description: e.message, variant: "destructive" }) }
 finally { setIsSaving(false) }
 }

 const handleDelete = async (id: string) => {
 if (!window.confirm("Delete this SOP?")) return
 const { error } = await supabase.from("rd_manufacturing_sops").delete().eq("id", id)
 if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
 toast({ title: "SOP deleted" })
 fetchData()
 }

 const handleEdit = (item: MfgSOP) => { setForm({ ...item }); setIsEditing(true) }
 const resetForm = () => { setForm(emptyForm()); setIsEditing(false) }

 // Step Helpers
 const addStep = () => {
 const steps = form.steps || []
 setForm({ ...form, steps: [...steps, { order: steps.length + 1, title: "", description: "", duration: "", notes: "" }] })
 }
 const removeStep = (i: number) => {
 const steps = (form.steps || []).filter((_, idx) => idx !== i)
 // Re-index
 steps.forEach((s, idx) => s.order = idx + 1)
 setForm({ ...form, steps })
 }
 const updateStep = (i: number, field: keyof SOPStep, val: string) => {
 const updated = [...(form.steps || [])]
 updated[i] = { ...updated[i], [field]: val }
 setForm({ ...form, steps: updated })
 }
 const moveStep = (i: number, dir: -1 | 1) => {
 const steps = [...(form.steps || [])]
 if (i + dir < 0 || i + dir >= steps.length) return
 const temp = steps[i]
 steps[i] = steps[i + dir]
 steps[i + dir] = temp
 steps.forEach((s, idx) => s.order = idx + 1)
 setForm({ ...form, steps })
 }

 if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-foreground" /></div>

 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <h2 className="text-xl font-bold text-foreground">Manufacturing SOPs</h2>
 {!isEditing && <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-2" />New SOP</Button>}
 </div>

 {isEditing ? (
 <Card className=" ">
 <CardHeader className="pb-3">
 <div className="flex justify-between items-center">
 <CardTitle className="text-foreground">{form.id ? "Edit SOP" : "Create SOP"}</CardTitle>
 <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
 </div>
 </CardHeader>
 <CardContent>
 <form onSubmit={handleSubmit} className="space-y-5">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-medium">Product Name *</label>
 <Select value={form.product || ""} onValueChange={v => setForm({ ...form, product: v })}>
 <SelectTrigger><SelectValue placeholder="Select recipe product..." /></SelectTrigger>
 <SelectContent>
 {recipes.map(r => <SelectItem key={r.product_name} value={r.product_name}>{r.product_name}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1.5"><label className="text-sm font-medium">Version</label>
 <Input value={form.version || ""} onChange={e => setForm({ ...form, version: e.target.value })} /></div>
 <div className="space-y-1.5"><label className="text-sm font-medium">Status</label>
 <Select value={form.status || "draft"} onValueChange={v => setForm({ ...form, status: v })}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent>
 </Select>
 </div>
 </div>

 <div className="space-y-2">
 <div className="flex items-center justify-between"><label className="text-sm font-semibold text-foreground">Step-by-Step Procedure</label>
 <Button type="button" variant="outline" size="sm" onClick={addStep}><Plus className="h-3 w-3 mr-1" />Add Step</Button></div>
 <div className="space-y-3">
 {(form.steps || []).map((step, i) => (
 <div key={i} className="flex gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
 <div className="flex flex-col gap-1 items-center justify-center w-8">
 <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveStep(i, -1)} disabled={i === 0}><ArrowUp className="h-3 w-3" /></Button>
 <Badge variant="outline" className="h-6 w-6 justify-center p-0">{step.order}</Badge>
 <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveStep(i, 1)} disabled={i === (form.steps || []).length - 1}><ArrowDown className="h-3 w-3" /></Button>
 </div>
 <div className="flex-1 space-y-3">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
 <div className="md:col-span-3 space-y-1.5"><label className="text-xs font-medium text-gray-500">Step Title</label><Input value={step.title} onChange={e => updateStep(i, "title", e.target.value)} placeholder="e.g. Dry Mixing" /></div>
 <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Duration</label><Input value={step.duration} onChange={e => updateStep(i, "duration", e.target.value)} placeholder="15 mins" /></div>
 </div>
 <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Detailed Instructions</label><Textarea value={step.description} onChange={e => updateStep(i, "description", e.target.value)} rows={2} /></div>
 </div>
 <Button type="button" variant="ghost" size="icon" className="text-red-400 hover:text-red-600 mt-6" onClick={() => removeStep(i)}><Trash2 className="h-4 w-4" /></Button>
 </div>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5"><label className="text-sm font-medium">Approved By</label>
 <Input value={form.approved_by || ""} onChange={e => setForm({ ...form, approved_by: e.target.value })} /></div>
 <div className="space-y-1.5"><label className="text-sm font-medium">Internal Notes</label>
 <Input value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
 </div>

 <div className="flex justify-end gap-2 pt-2">
 <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
 <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
 {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}{form.id ? "Update" : "Save SOP"}
 </Button>
 </div>
 </form>
 </CardContent>
 </Card>
 ) : (
 <Card><CardContent className="p-0">
 {sops.length === 0 ? (
 <div className="p-12 text-center"><FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No SOPs found.</p></div>
 ) : (
 <div className="overflow-x-auto w-full"><Table className="min-w-[600px] mb-4"><TableHeader><TableRow>
 <TableHead>Product</TableHead><TableHead>Version</TableHead><TableHead>Steps</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
 </TableRow></TableHeader>
 <TableBody>{sops.map(s => (
 <TableRow key={s.id}>
 <TableCell className="font-medium">{s.product}</TableCell>
 <TableCell>{s.version}</TableCell>
 <TableCell className="text-sm text-gray-500">{(s.steps || []).length} steps</TableCell>
 <TableCell>
 <Badge variant="outline" className={s.status === 'active' ? "bg-primary/10 text-foreground border-border" : s.status === 'archived' ? "bg-gray-100 text-gray-700" : "bg-secondary text-foreground"}>
 {s.status.toUpperCase()}
 </Badge>
 </TableCell>
 <TableCell className="text-right">
 <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Edit className="h-4 w-4 text-foreground" /></Button>
 <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
