import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Plus, Edit, Trash2, X, Check, Loader2, Truck, Star } from "lucide-react"

interface Supplier {
  id: string; name: string; material: string; rate: number; lead_time_days: number;
  rating: number; documents_url: string; contact: string; email: string;
  gst_no: string; address: string; notes: string;
}

const emptyForm = (): Partial<Supplier> => ({
  name: "", material: "", rate: 0, lead_time_days: 0, rating: 0,
  documents_url: "", contact: "", email: "", gst_no: "", address: "", notes: ""
})

export function SupplierManagement() {
  const { toast } = useToast()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from("rd_suppliers").select("*").order("name", { ascending: true })
      if (error) throw error
      setSuppliers(data as any)
    } catch (e: any) { toast({ title: "Error loading suppliers", description: e.message, variant: "destructive" }) }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name?.trim()) { toast({ title: "Supplier name required", variant: "destructive" }); return }
    try {
      setIsSaving(true)
      const payload = { ...form }
      if (form.id) {
        const { error } = await supabase.from("rd_suppliers").update(payload).eq("id", form.id)
        if (error) throw error
        toast({ title: "Supplier updated" })
      } else {
        const { error } = await supabase.from("rd_suppliers").insert([payload])
        if (error) throw error
        toast({ title: "Supplier added" })
      }
      setIsEditing(false)
      fetchData()
    } catch (e: any) { toast({ title: "Error saving", description: e.message, variant: "destructive" }) }
    finally { setIsSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this supplier?")) return
    const { error } = await supabase.from("rd_suppliers").delete().eq("id", id)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Supplier deleted" })
    fetchData()
  }

  const handleEdit = (item: Supplier) => { setForm({ ...item }); setIsEditing(true) }
  const resetForm = () => { setForm(emptyForm()); setIsEditing(false) }

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#032E63]">Supplier Management</h2>
        {!isEditing && <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-[#08A04B] hover:bg-[#069a43]"><Plus className="h-4 w-4 mr-2" />Add Supplier</Button>}
      </div>

      {isEditing ? (
        <Card className="border-l-4 border-l-[#08A04B] shadow-md">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-[#032E63]">{form.id ? "Edit Supplier" : "New Supplier"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5"><label className="text-sm font-medium">Supplier Name *</label>
                  <Input required value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Material Provided</label>
                  <Input value={form.material || ""} onChange={e => setForm({ ...form, material: e.target.value })} placeholder="E.g. Spices, Packaging" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">GST No.</label>
                  <Input value={form.gst_no || ""} onChange={e => setForm({ ...form, gst_no: e.target.value })} /></div>
                
                <div className="space-y-1.5"><label className="text-sm font-medium">Contact Person</label>
                  <Input value={form.contact || ""} onChange={e => setForm({ ...form, contact: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Email</label>
                  <Input type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Lead Time (Days)</label>
                  <Input type="number" value={form.lead_time_days || 0} onChange={e => setForm({ ...form, lead_time_days: parseInt(e.target.value) || 0 })} /></div>
                
                <div className="space-y-1.5"><label className="text-sm font-medium">Avg Rate (₹)</label>
                  <Input type="number" value={form.rate || 0} onChange={e => setForm({ ...form, rate: parseFloat(e.target.value) || 0 })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Rating (0-5)</label>
                  <Input type="number" min="0" max="5" value={form.rating || 0} onChange={e => setForm({ ...form, rating: parseInt(e.target.value) || 0 })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Documents Drive URL</label>
                  <Input value={form.documents_url || ""} onChange={e => setForm({ ...form, documents_url: e.target.value })} /></div>
              </div>

              <div className="space-y-1.5"><label className="text-sm font-medium">Address</label>
                <Textarea value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">Notes</label>
                <Textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={isSaving} className="bg-[#08A04B] hover:bg-[#069a43]">
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}{form.id ? "Update" : "Save Supplier"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="p-0">
          {suppliers.length === 0 ? (
            <div className="p-12 text-center"><Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No suppliers added.</p></div>
          ) : (
            <Table><TableHeader><TableRow>
              <TableHead>Supplier</TableHead><TableHead>Material</TableHead><TableHead>Lead Time</TableHead><TableHead>Rating</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
              <TableBody>{suppliers.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.name}
                    {s.contact && <div className="text-xs text-gray-500 font-normal">{s.contact}</div>}
                  </TableCell>
                  <TableCell>{s.material}</TableCell>
                  <TableCell>{s.lead_time_days} days</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Star className={`h-4 w-4 ${s.rating > 0 ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} />
                      <span className="ml-1 text-sm font-medium">{s.rating}/5</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Edit className="h-4 w-4 text-blue-600" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </CardContent></Card>
      )}
    </div>
  )
}
