import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Plus, Edit, Trash2, X, Check, Loader2, Factory } from "lucide-react"

interface Order {
  id: string; order_number: string; target_quantity: string; status: string; start_date: string; end_date: string; notes: string;
}

const emptyForm = (): Partial<Order> => ({
  order_number: `PO-${Math.floor(Math.random() * 10000)}`, target_quantity: "", status: "Planned", start_date: new Date().toISOString().split("T")[0]
})

export function ProductionOrders() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from("mfg_production_orders").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setOrders(data as any)
    } catch (e: any) { 
      toast({ title: "Error loading Orders", description: e.message, variant: "destructive" }) 
    } finally { 
      setIsLoading(false) 
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.target_quantity) { toast({ title: "Target quantity required", variant: "destructive" }); return }
    try {
      setIsSaving(true)
      const payload = { ...form }
      if (form.id) {
        const { error } = await supabase.from("mfg_production_orders").update(payload).eq("id", form.id)
        if (error) throw error
        toast({ title: "Order updated" })
      } else {
        const { error } = await supabase.from("mfg_production_orders").insert([payload])
        if (error) throw error
        toast({ title: "Order created" })
      }
      setIsEditing(false)
      fetchData()
    } catch (e: any) { toast({ title: "Error saving", description: e.message, variant: "destructive" }) }
    finally { setIsSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this Order?")) return
    const { error } = await supabase.from("mfg_production_orders").delete().eq("id", id)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Order deleted" })
    fetchData()
  }

  const handleEdit = (item: Order) => { setForm({ ...item }); setIsEditing(true) }
  const resetForm = () => { setForm(emptyForm()); setIsEditing(false) }

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-foreground" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground">Production Orders</h2>
        {!isEditing && <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />New Order</Button>}
      </div>

      {isEditing ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>{form.id ? "Edit Order" : "New Production Order"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-sm font-medium">Order Number *</label>
                  <Input required value={form.order_number || ""} onChange={e => setForm({ ...form, order_number: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Target Quantity *</label>
                  <Input required type="number" value={form.target_quantity || ""} onChange={e => setForm({ ...form, target_quantity: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Start Date</label>
                  <Input type="date" value={form.start_date || ""} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Status</label>
                  <select className="w-full p-2 border rounded-md text-sm" value={form.status || "Planned"} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
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
          {orders.length === 0 ? (
            <div className="p-12 text-center"><Factory className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No Orders found.</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Target Qty</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium text-blue-600">{o.order_number}</TableCell>
                    <TableCell>{o.target_quantity}</TableCell>
                    <TableCell>{o.start_date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={o.status === 'Completed' ? 'bg-green-100 text-green-700' : o.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}>
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(o)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(o.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
