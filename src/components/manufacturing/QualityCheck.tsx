import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Plus, Edit, Trash2, X, Check, Loader2, ShieldCheck } from "lucide-react"

interface QC {
  id: string; inspector_name: string; status: string; comments: string; check_date: string;
}

const emptyForm = (): Partial<QC> => ({
  inspector_name: "", status: "Pending", comments: ""
})

export function QualityCheck() {
  const { toast } = useToast()
  const [checks, setChecks] = useState<QC[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from("mfg_quality_checks").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setChecks(data as any)
    } catch (e: any) { 
      toast({ title: "Error loading QC", description: e.message, variant: "destructive" }) 
    } finally { 
      setIsLoading(false) 
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.inspector_name?.trim()) { toast({ title: "Inspector name required", variant: "destructive" }); return }
    try {
      setIsSaving(true)
      const payload = { ...form }
      if (form.id) {
        const { error } = await supabase.from("mfg_quality_checks").update(payload).eq("id", form.id)
        if (error) throw error
        toast({ title: "QC updated" })
      } else {
        const { error } = await supabase.from("mfg_quality_checks").insert([payload])
        if (error) throw error
        toast({ title: "QC logged" })
      }
      setIsEditing(false)
      fetchData()
    } catch (e: any) { toast({ title: "Error saving", description: e.message, variant: "destructive" }) }
    finally { setIsSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this QC Record?")) return
    const { error } = await supabase.from("mfg_quality_checks").delete().eq("id", id)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "QC deleted" })
    fetchData()
  }

  const handleEdit = (item: QC) => { setForm({ ...item }); setIsEditing(true) }
  const resetForm = () => { setForm(emptyForm()); setIsEditing(false) }

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-foreground" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground">Quality Control Checks</h2>
        {!isEditing && <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Log QC</Button>}
      </div>

      {isEditing ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>{form.id ? "Edit QC" : "Log New QC"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-sm font-medium">Inspector Name *</label>
                  <Input required value={form.inspector_name || ""} onChange={e => setForm({ ...form, inspector_name: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Result</label>
                  <select className="w-full p-2 border rounded-md text-sm" value={form.status || "Pending"} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="Pending">Pending</option>
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-medium">Notes / Comments</label>
                  <Textarea value={form.comments || ""} onChange={e => setForm({ ...form, comments: e.target.value })} /></div>
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
          {checks.length === 0 ? (
            <div className="p-12 text-center"><ShieldCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No QC logs found.</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checks.map(q => (
                  <TableRow key={q.id}>
                    <TableCell className="text-sm">{new Date(q.check_date || new Date()).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">{q.inspector_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={q.status === 'Passed' ? 'bg-green-100 text-green-700' : q.status === 'Failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100'}>
                        {q.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{q.comments}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(q)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
