import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Plus, Edit, Trash2, X, Check, Loader2, ClipboardCheck } from "lucide-react"

interface ProductTest {
  id: string; product_name: string; batch_trial_id: string;
  taste: number; aroma: number; color: number; mouthfeel: number;
  dissolution: number; coating_quality: number; tester: string;
  test_date: string; notes: string;
  batch?: { trial_no: string }
}

const emptyForm = (): Partial<ProductTest> => ({
  product_name: "", batch_trial_id: "",
  taste: 0, aroma: 0, color: 0, mouthfeel: 0, dissolution: 0, coating_quality: 0,
  tester: "", test_date: new Date().toISOString().split("T")[0], notes: ""
})

export function ProductTesting() {
  const { toast } = useToast()
  const [tests, setTests] = useState<ProductTest[]>([])
  const [trials, setTrials] = useState<{id: string, trial_no: string, recipe_id: string}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [testsRes, trialsRes] = await Promise.all([
        supabase.from("rd_product_tests").select("*, batch:rd_batch_trials(trial_no)").order("test_date", { ascending: false }),
        supabase.from("rd_batch_trials").select("id, trial_no, recipe_id").order("trial_no")
      ])
      if (testsRes.error) throw testsRes.error
      if (trialsRes.error) throw trialsRes.error
      setTests(testsRes.data as any)
      setTrials(trialsRes.data)
    } catch (e: any) { toast({ title: "Error loading tests", description: e.message, variant: "destructive" }) }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.product_name?.trim()) { toast({ title: "Product name required", variant: "destructive" }); return }
    try {
      setIsSaving(true)
      const payload = {
        product_name: form.product_name, batch_trial_id: form.batch_trial_id || null,
        taste: form.taste || 0, aroma: form.aroma || 0, color: form.color || 0,
        mouthfeel: form.mouthfeel || 0, dissolution: form.dissolution || 0, coating_quality: form.coating_quality || 0,
        tester: form.tester, test_date: form.test_date, notes: form.notes
      }
      if (form.id) {
        const { error } = await supabase.from("rd_product_tests").update(payload).eq("id", form.id)
        if (error) throw error
        toast({ title: "Test updated" })
      } else {
        const { error } = await supabase.from("rd_product_tests").insert([payload])
        if (error) throw error
        toast({ title: "Test logged" })
      }
      setIsEditing(false)
      fetchData()
    } catch (e: any) { toast({ title: "Error saving", description: e.message, variant: "destructive" }) }
    finally { setIsSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this test record?")) return
    const { error } = await supabase.from("rd_product_tests").delete().eq("id", id)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Test deleted" })
    fetchData()
  }

  const handleEdit = (item: ProductTest) => { setForm({ ...item, batch: undefined }); setIsEditing(true) }
  const resetForm = () => { setForm(emptyForm()); setIsEditing(false) }

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#032E63]">Product Testing (Score Cards)</h2>
        {!isEditing && <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-[#08A04B] hover:bg-[#069a43]"><Plus className="h-4 w-4 mr-2" />Log Test</Button>}
      </div>

      {isEditing ? (
        <Card className="border-l-4 border-l-[#08A04B] shadow-md">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-[#032E63]">{form.id ? "Edit Test" : "New Test Record"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-medium">Product Name *</label>
                  <Input required value={form.product_name || ""} onChange={e => setForm({ ...form, product_name: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Link Trial Batch</label>
                  <Select value={form.batch_trial_id || ""} onValueChange={v => setForm({ ...form, batch_trial_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select trial..." /></SelectTrigger>
                    <SelectContent>{trials.map(t => <SelectItem key={t.id} value={t.id}>{t.trial_no}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Test Date</label>
                  <Input type="date" required value={form.test_date || ""} onChange={e => setForm({ ...form, test_date: e.target.value })} /></div>
                <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-medium">Tester Name</label>
                  <Input value={form.tester || ""} onChange={e => setForm({ ...form, tester: e.target.value })} /></div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="font-medium text-sm text-[#032E63] mb-3">Evaluation Scores (0-10)</h4>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Taste</label>
                    <Input type="number" min="0" max="10" value={form.taste || 0} onChange={e => setForm({ ...form, taste: parseInt(e.target.value) || 0 })} /></div>
                  <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Aroma</label>
                    <Input type="number" min="0" max="10" value={form.aroma || 0} onChange={e => setForm({ ...form, aroma: parseInt(e.target.value) || 0 })} /></div>
                  <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Color</label>
                    <Input type="number" min="0" max="10" value={form.color || 0} onChange={e => setForm({ ...form, color: parseInt(e.target.value) || 0 })} /></div>
                  <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Mouthfeel</label>
                    <Input type="number" min="0" max="10" value={form.mouthfeel || 0} onChange={e => setForm({ ...form, mouthfeel: parseInt(e.target.value) || 0 })} /></div>
                  <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Dissolution</label>
                    <Input type="number" min="0" max="10" value={form.dissolution || 0} onChange={e => setForm({ ...form, dissolution: parseInt(e.target.value) || 0 })} /></div>
                  <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Coating</label>
                    <Input type="number" min="0" max="10" value={form.coating_quality || 0} onChange={e => setForm({ ...form, coating_quality: parseInt(e.target.value) || 0 })} /></div>
                </div>
              </div>

              <div className="space-y-1.5"><label className="text-sm font-medium">Detailed Notes</label>
                <Textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} /></div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={isSaving} className="bg-[#08A04B] hover:bg-[#069a43]">
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}{form.id ? "Update" : "Save Record"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="p-0">
          {tests.length === 0 ? (
            <div className="p-12 text-center"><ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No product tests recorded.</p></div>
          ) : (
            <div className="overflow-x-auto w-full"><Table className="min-w-[600px] mb-4"><TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Product</TableHead><TableHead>Batch</TableHead><TableHead>Tester</TableHead><TableHead>Avg Score</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
              <TableBody>{tests.map(t => {
                const avg = ((t.taste + t.aroma + t.color + t.mouthfeel + t.dissolution + t.coating_quality) / 6).toFixed(1);
                return (
                <TableRow key={t.id}>
                  <TableCell>{t.test_date}</TableCell>
                  <TableCell className="font-medium">{t.product_name}</TableCell>
                  <TableCell>{t.batch?.trial_no || "—"}</TableCell>
                  <TableCell>{t.tester || "—"}</TableCell>
                  <TableCell><span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{avg}/10</span></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}><Edit className="h-4 w-4 text-blue-600" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              )
              })}</TableBody>
            </Table></div>
          )}
        </CardContent></Card>
      )}
    </div>
  )
}
