import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Plus, Edit, Trash2, X, Check, Loader2, FileText, Layers } from "lucide-react"

interface BOM {
  id: string; product_name: string; version: string; status: string; created_at: string;
}

const emptyForm = (): Partial<BOM> => ({
  product_name: "", version: "1.0", status: "Draft"
})

export function BillOfMaterials() {
  const { toast } = useToast()
  const [boms, setBoms] = useState<BOM[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from("mfg_bom").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setBoms(data as any)
    } catch (e: any) { 
      toast({ title: "Error loading BOMs", description: e.message, variant: "destructive" }) 
    } finally { 
      setIsLoading(false) 
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.product_name?.trim()) { toast({ title: "Product name required", variant: "destructive" }); return }
    try {
      setIsSaving(true)
      const payload = { ...form }
      if (form.id) {
        const { error } = await supabase.from("mfg_bom").update(payload).eq("id", form.id)
        if (error) throw error
        toast({ title: "BOM updated" })
      } else {
        const { error } = await supabase.from("mfg_bom").insert([payload])
        if (error) throw error
        toast({ title: "BOM created" })
      }
      setIsEditing(false)
      fetchData()
    } catch (e: any) { toast({ title: "Error saving", description: e.message, variant: "destructive" }) }
    finally { setIsSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this BOM?")) return
    const { error } = await supabase.from("mfg_bom").delete().eq("id", id)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "BOM deleted" })
    fetchData()
  }

  const handleEdit = (item: BOM) => { setForm({ ...item }); setIsEditing(true) }
  const resetForm = () => { setForm(emptyForm()); setIsEditing(false) }

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-foreground" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground">Bill of Materials (BOM)</h2>
        {!isEditing && <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />New BOM</Button>}
      </div>

      {isEditing ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>{form.id ? "Edit BOM" : "New BOM Definition"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5"><label className="text-sm font-medium">Product Name *</label>
                  <Input required value={form.product_name || ""} onChange={e => setForm({ ...form, product_name: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Version</label>
                  <Input value={form.version || ""} onChange={e => setForm({ ...form, version: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Status</label>
                  <select className="w-full p-2 border rounded-md text-sm" value={form.status || "Draft"} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="Draft">Draft</option>
                    <option value="Approved">Approved</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  {form.id ? "Update" : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="p-0">
          {boms.length === 0 ? (
            <div className="p-12 text-center"><Layers className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No BOMs found.</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boms.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.product_name}</TableCell>
                    <TableCell>v{b.version}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={b.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}>
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{new Date(b.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(b)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent></Card>
      )}
    </div>
  )
}
