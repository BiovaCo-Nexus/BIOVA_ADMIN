import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Plus, Edit, Trash2, X, Check, Loader2, Factory } from "lucide-react"

interface Machine {
  id: string; name: string; serial_number: string; status: string; last_maintenance: string; next_maintenance: string;
}

const emptyForm = (): Partial<Machine> => ({
  name: "", serial_number: "", status: "Operational", last_maintenance: "", next_maintenance: ""
})

export function Machines() {
  const { toast } = useToast()
  const [machines, setMachines] = useState<Machine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from("mfg_machines").select("*").order("name")
      if (error) throw error
      setMachines(data as any)
    } catch (e: any) { 
      toast({ title: "Error loading machines", description: e.message, variant: "destructive" }) 
    } finally { 
      setIsLoading(false) 
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name?.trim()) { toast({ title: "Machine name required", variant: "destructive" }); return }
    try {
      setIsSaving(true)
      const payload = { ...form }
      if (form.id) {
        const { error } = await supabase.from("mfg_machines").update(payload).eq("id", form.id)
        if (error) throw error
        toast({ title: "Machine updated" })
      } else {
        const { error } = await supabase.from("mfg_machines").insert([payload])
        if (error) throw error
        toast({ title: "Machine added" })
      }
      setIsEditing(false)
      fetchData()
    } catch (e: any) { toast({ title: "Error saving", description: e.message, variant: "destructive" }) }
    finally { setIsSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this Machine?")) return
    const { error } = await supabase.from("mfg_machines").delete().eq("id", id)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Machine deleted" })
    fetchData()
  }

  const handleEdit = (item: Machine) => { setForm({ ...item }); setIsEditing(true) }
  const resetForm = () => { setForm(emptyForm()); setIsEditing(false) }

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-foreground" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground">Machines & Equipment</h2>
        {!isEditing && <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Add Machine</Button>}
      </div>

      {isEditing ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>{form.id ? "Edit Machine" : "Register Machine"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-sm font-medium">Machine Name *</label>
                  <Input required value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Serial Number</label>
                  <Input value={form.serial_number || ""} onChange={e => setForm({ ...form, serial_number: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Last Maintenance</label>
                  <Input type="date" value={form.last_maintenance || ""} onChange={e => setForm({ ...form, last_maintenance: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Next Maintenance</label>
                  <Input type="date" value={form.next_maintenance || ""} onChange={e => setForm({ ...form, next_maintenance: e.target.value })} /></div>
                <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-medium">Status</label>
                  <select className="w-full p-2 border rounded-md text-sm" value={form.status || "Operational"} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="Operational">Operational</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Broken">Broken</option>
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
          {machines.length === 0 ? (
            <div className="p-12 text-center"><Factory className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No machines registered.</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Maintenance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {machines.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-sm text-gray-500 font-mono">{m.serial_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={m.status === 'Operational' ? 'bg-green-100 text-green-700' : m.status === 'Under Maintenance' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}>
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{m.next_maintenance || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(m)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
