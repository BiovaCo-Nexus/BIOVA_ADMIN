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
import { Plus, Edit, Trash2, X, Check, Loader2, Users } from "lucide-react"

interface Sample {
 id: string; customer: string; product: string; quantity: string;
 date: string; courier: string; tracking_no: string; feedback: string;
 status: string; notes: string;
}

const emptyForm = (): Partial<Sample> => ({
 customer: "", product: "", quantity: "", date: new Date().toISOString().split("T")[0],
 courier: "", tracking_no: "", feedback: "", status: "sent", notes: ""
})

export function SampleManagement() {
 const { toast } = useToast()
 const [samples, setSamples] = useState<Sample[]>([])
 const [isLoading, setIsLoading] = useState(true)
 const [isEditing, setIsEditing] = useState(false)
 const [isSaving, setIsSaving] = useState(false)
 const [form, setForm] = useState(emptyForm())

 const fetchData = async () => {
 try {
 setIsLoading(true)
 const { data, error } = await supabase.from("rd_samples").select("*").order("date", { ascending: false })
 if (error) throw error
 setSamples(data as any)
 } catch (e: any) { toast({ title: "Error loading samples", description: e.message, variant: "destructive" }) }
 finally { setIsLoading(false) }
 }

 useEffect(() => { fetchData() }, [])

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!form.customer?.trim()) { toast({ title: "Customer name required", variant: "destructive" }); return }
 try {
 setIsSaving(true)
 const payload = { ...form }
 if (form.id) {
 const { error } = await supabase.from("rd_samples").update(payload).eq("id", form.id)
 if (error) throw error
 toast({ title: "Sample updated" })
 } else {
 const { error } = await supabase.from("rd_samples").insert([payload])
 if (error) throw error
 toast({ title: "Sample dispatched" })
 }
 setIsEditing(false)
 fetchData()
 } catch (e: any) { toast({ title: "Error saving", description: e.message, variant: "destructive" }) }
 finally { setIsSaving(false) }
 }

 const handleDelete = async (id: string) => {
 if (!window.confirm("Delete this sample record?")) return
 const { error } = await supabase.from("rd_samples").delete().eq("id", id)
 if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
 toast({ title: "Sample deleted" })
 fetchData()
 }

 const handleEdit = (item: Sample) => { setForm({ ...item }); setIsEditing(true) }
 const resetForm = () => { setForm(emptyForm()); setIsEditing(false) }

 if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-foreground" /></div>

 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <h2 className="text-xl font-bold text-foreground">Sample Management</h2>
 {!isEditing && <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-2" />Dispatch Sample</Button>}
 </div>

 {isEditing ? (
 <Card className=" ">
 <CardHeader className="pb-3">
 <div className="flex justify-between items-center">
 <CardTitle className="text-foreground">{form.id ? "Edit Sample" : "New Sample Dispatch"}</CardTitle>
 <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
 </div>
 </CardHeader>
 <CardContent>
 <form onSubmit={handleSubmit} className="space-y-5">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="space-y-1.5"><label className="text-sm font-medium">Customer/Client *</label>
 <Input required value={form.customer || ""} onChange={e => setForm({ ...form, customer: e.target.value })} /></div>
 <div className="space-y-1.5"><label className="text-sm font-medium">Product Sent</label>
 <Input value={form.product || ""} onChange={e => setForm({ ...form, product: e.target.value })} /></div>
 <div className="space-y-1.5"><label className="text-sm font-medium">Quantity</label>
 <Input value={form.quantity || ""} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="E.g. 500g" /></div>
 
 <div className="space-y-1.5"><label className="text-sm font-medium">Date Dispatched</label>
 <Input type="date" required value={form.date || ""} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
 <div className="space-y-1.5"><label className="text-sm font-medium">Courier Service</label>
 <Input value={form.courier || ""} onChange={e => setForm({ ...form, courier: e.target.value })} /></div>
 <div className="space-y-1.5"><label className="text-sm font-medium">Tracking No.</label>
 <Input value={form.tracking_no || ""} onChange={e => setForm({ ...form, tracking_no: e.target.value })} /></div>
 
 <div className="space-y-1.5 md:col-span-3"><label className="text-sm font-medium">Status</label>
 <Select value={form.status || "sent"} onValueChange={v => setForm({ ...form, status: v })}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent><SelectItem value="sent">Dispatched / Sent</SelectItem><SelectItem value="delivered">Delivered</SelectItem><SelectItem value="feedback_received">Feedback Received</SelectItem></SelectContent>
 </Select>
 </div>
 </div>

 <div className="space-y-1.5"><label className="text-sm font-medium">Customer Feedback</label>
 <Textarea value={form.feedback || ""} onChange={e => setForm({ ...form, feedback: e.target.value })} rows={3} placeholder="Paste client feedback here once received..." /></div>
 <div className="space-y-1.5"><label className="text-sm font-medium">Internal Notes</label>
 <Textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>

 <div className="flex justify-end gap-2 pt-2">
 <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
 <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
 {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}{form.id ? "Update" : "Save Sample"}
 </Button>
 </div>
 </form>
 </CardContent>
 </Card>
 ) : (
 <Card><CardContent className="p-0">
 {samples.length === 0 ? (
 <div className="p-12 text-center"><Users className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No samples dispatched.</p></div>
 ) : (
 <div className="overflow-x-auto w-full"><Table className="min-w-[600px] mb-4"><TableHeader><TableRow>
 <TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead>Product</TableHead><TableHead>Tracking</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
 </TableRow></TableHeader>
 <TableBody>{samples.map(s => (
 <TableRow key={s.id}>
 <TableCell>{s.date}</TableCell>
 <TableCell className="font-medium">{s.customer}</TableCell>
 <TableCell>{s.product} <span className="text-xs text-gray-500">({s.quantity})</span></TableCell>
 <TableCell className="text-sm">{s.courier}<br/><span className="text-gray-500 font-mono text-xs">{s.tracking_no}</span></TableCell>
 <TableCell>
 <Badge variant="outline" className={s.status === 'delivered' ? "bg-primary text-primary-foreground text-foreground border-border" : s.status === 'feedback_received' ? "bg-primary/10 text-foreground border-border" : "bg-gray-100 text-gray-700"}>
 {s.status.replace("_", " ").toUpperCase()}
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
