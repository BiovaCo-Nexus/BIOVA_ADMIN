import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Plus, Edit, Trash2, X, Check, Loader2, FolderOpen, ExternalLink, FileText, FileBadge, FileArchive, ShieldCheck } from "lucide-react"

interface RDDemoDoc {
 id: string; title: string; category: string; file_url: string;
 file_type: string; uploaded_by: string; related_product: string;
 tags: string; notes: string; created_at: string;
}

const emptyForm = (): Partial<RDDemoDoc> => ({
 title: "", category: "COA", file_url: "", file_type: "PDF",
 uploaded_by: "", related_product: "", tags: "", notes: ""
})

const DOC_CATEGORIES = ["COA", "MSDS", "FSSAI Docs", "Test Reports", "Lab Reports", "Formulations", "Other"]

export function DocumentVault() {
 const { toast } = useToast()
 const [docs, setDocs] = useState<RDDemoDoc[]>([])
 const [isLoading, setIsLoading] = useState(true)
 const [isEditing, setIsEditing] = useState(false)
 const [isSaving, setIsSaving] = useState(false)
 const [form, setForm] = useState(emptyForm())

 const fetchData = async () => {
 try {
 setIsLoading(true)
 const { data, error } = await supabase.from("rd_documents").select("*").order("created_at", { ascending: false })
 if (error) throw error
 setDocs(data as any)
 } catch (e: any) { toast({ title: "Error loading documents", description: e.message, variant: "destructive" }) }
 finally { setIsLoading(false) }
 }

 useEffect(() => { fetchData() }, [])

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!form.title?.trim() || !form.file_url?.trim()) { toast({ title: "Title and URL required", variant: "destructive" }); return }
 try {
 setIsSaving(true)
 const payload = { ...form }
 if (form.id) {
 const { error } = await supabase.from("rd_documents").update(payload).eq("id", form.id)
 if (error) throw error
 toast({ title: "Document metadata updated" })
 } else {
 const { error } = await supabase.from("rd_documents").insert([payload])
 if (error) throw error
 toast({ title: "Document link saved" })
 }
 setIsEditing(false)
 fetchData()
 } catch (e: any) { toast({ title: "Error saving", description: e.message, variant: "destructive" }) }
 finally { setIsSaving(false) }
 }

 const handleDelete = async (id: string) => {
 if (!window.confirm("Delete this document link? (The actual file will not be deleted)")) return
 const { error } = await supabase.from("rd_documents").delete().eq("id", id)
 if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
 toast({ title: "Document record removed" })
 fetchData()
 }

 const handleEdit = (item: RDDemoDoc) => { setForm({ ...item }); setIsEditing(true) }
 const resetForm = () => { setForm(emptyForm()); setIsEditing(false) }

 const getIconForCategory = (cat: string) => {
 switch (cat) {
 case "COA": return <ShieldCheck className="h-5 w-5 text-foreground" />
 case "FSSAI Docs": return <FileBadge className="h-5 w-5 text-foreground" />
 case "MSDS": return <FileArchive className="h-5 w-5 text-foreground" />
 default: return <FileText className="h-5 w-5 text-gray-500" />
 }
 }

 if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-foreground" /></div>

 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <h2 className="text-xl font-bold text-foreground">Document Vault</h2>
 {!isEditing && <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-2" />Add Document Link</Button>}
 </div>

 {isEditing ? (
 <Card className=" ">
 <CardHeader className="pb-3">
 <div className="flex justify-between items-center">
 <CardTitle className="text-foreground">{form.id ? "Edit Document" : "New Document Record"}</CardTitle>
 <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
 </div>
 </CardHeader>
 <CardContent>
 <form onSubmit={handleSubmit} className="space-y-5">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5"><label className="text-sm font-medium">Document Title *</label>
 <Input required value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="E.g. Mango Powder COA Q1" /></div>
 
 <div className="space-y-1.5"><label className="text-sm font-medium">Drive/Storage URL *</label>
 <Input required type="url" value={form.file_url || ""} onChange={e => setForm({ ...form, file_url: e.target.value })} placeholder="https://..." /></div>
 
 <div className="space-y-1.5"><label className="text-sm font-medium">Category</label>
 <Select value={form.category || "COA"} onValueChange={v => setForm({ ...form, category: v })}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>{DOC_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
 </Select>
 </div>

 <div className="space-y-1.5"><label className="text-sm font-medium">File Type</label>
 <Select value={form.file_type || "PDF"} onValueChange={v => setForm({ ...form, file_type: v })}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent><SelectItem value="PDF">PDF</SelectItem><SelectItem value="Image">Image</SelectItem><SelectItem value="Doc">Word Doc</SelectItem><SelectItem value="Sheet">Spreadsheet</SelectItem></SelectContent>
 </Select>
 </div>
 
 <div className="space-y-1.5"><label className="text-sm font-medium">Related Product / Material</label>
 <Input value={form.related_product || ""} onChange={e => setForm({ ...form, related_product: e.target.value })} /></div>
 <div className="space-y-1.5"><label className="text-sm font-medium">Tags (comma separated)</label>
 <Input value={form.tags || ""} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="vendor, q1, approval" /></div>
 <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-medium">Uploaded By</label>
 <Input value={form.uploaded_by || ""} onChange={e => setForm({ ...form, uploaded_by: e.target.value })} /></div>
 </div>

 <div className="space-y-1.5"><label className="text-sm font-medium">Notes</label>
 <Textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>

 <div className="flex justify-end gap-2 pt-2">
 <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
 <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
 {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}{form.id ? "Update" : "Save Record"}
 </Button>
 </div>
 </form>
 </CardContent>
 </Card>
 ) : (
 <Card><CardContent className="p-0">
 {docs.length === 0 ? (
 <div className="p-12 text-center"><FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">The vault is empty.</p></div>
 ) : (
 <div className="overflow-x-auto w-full"><Table className="min-w-[600px] mb-4"><TableHeader><TableRow>
 <TableHead>Document</TableHead><TableHead>Category</TableHead><TableHead>Related To</TableHead><TableHead>Tags</TableHead><TableHead className="text-right">Actions</TableHead>
 </TableRow></TableHeader>
 <TableBody>{docs.map(d => (
 <TableRow key={d.id}>
 <TableCell>
 <div className="flex items-center gap-3">
 {getIconForCategory(d.category)}
 <div>
 <div className="font-medium text-foreground">{d.title}</div>
 <div className="text-[10px] text-gray-500">{new Date(d.created_at).toLocaleDateString()}</div>
 </div>
 </div>
 </TableCell>
 <TableCell><Badge variant="outline" className="bg-gray-50">{d.category}</Badge></TableCell>
 <TableCell className="text-sm">{d.related_product || "—"}</TableCell>
 <TableCell>
 <div className="flex gap-1 flex-wrap">
 {(d.tags || "").split(",").filter(Boolean).map((tag, i) => (
 <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase">{tag.trim()}</span>
 ))}
 </div>
 </TableCell>
 <TableCell className="text-right">
 <Button variant="ghost" size="icon" asChild>
 <a href={d.file_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 text-foreground" /></a>
 </Button>
 <Button variant="ghost" size="icon" onClick={() => handleEdit(d)}><Edit className="h-4 w-4 text-foreground" /></Button>
 <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
