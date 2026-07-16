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
import { saveWithOfflineSupport } from "./OfflineSyncManager"
import { Plus, Edit, Trash2, X, Check, Loader2, TestTubes } from "lucide-react"

interface BatchTrial {
  id: string; trial_no: string; recipe_id: string; recipe_version: string;
  date: string; made_by: string; taste_score: number; aroma_score: number;
  color_score: number; texture_score: number; problems: string;
  final_decision: string; notes: string;
  recipe?: { product_name: string }
}

const emptyForm = (): Partial<BatchTrial> => ({
  trial_no: "", recipe_id: "", recipe_version: "V1.0",
  date: new Date().toISOString().split("T")[0], made_by: "",
  taste_score: 0, aroma_score: 0, color_score: 0, texture_score: 0,
  problems: "", final_decision: "pending", notes: ""
})

export function BatchTrials() {
  const { toast } = useToast()
  const [trials, setTrials] = useState<BatchTrial[]>([])
  const [recipes, setRecipes] = useState<{id: string, product_name: string, version: string}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [trialsRes, recipesRes] = await Promise.all([
        supabase.from("rd_batch_trials").select("*, recipe:rd_recipes(product_name)").order("date", { ascending: false }),
        supabase.from("rd_recipes").select("id, product_name, version").order("product_name")
      ])
      if (trialsRes.error) throw trialsRes.error
      if (recipesRes.error) throw recipesRes.error
      setTrials(trialsRes.data as any)
      setRecipes(recipesRes.data)
    } catch (e: any) { toast({ title: "Error loading trials", description: e.message, variant: "destructive" }) }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.trial_no?.trim()) { toast({ title: "Trial number required", variant: "destructive" }); return }
    try {
      setIsSaving(true)
      const payload = {
        trial_no: form.trial_no, recipe_id: form.recipe_id || null, recipe_version: form.recipe_version,
        date: form.date, made_by: form.made_by, taste_score: form.taste_score || 0,
        aroma_score: form.aroma_score || 0, color_score: form.color_score || 0, texture_score: form.texture_score || 0,
        problems: form.problems, final_decision: form.final_decision, notes: form.notes
      }
      if (form.id) {
        const { error, offline } = await saveWithOfflineSupport("rd_batch_trials", payload, "update", form.id)
        if (error) throw error
        toast({ title: offline ? "Saved offline" : "Trial updated" })
      } else {
        const { error, offline } = await saveWithOfflineSupport("rd_batch_trials", payload, "insert")
        if (error) throw error
        toast({ title: offline ? "Saved offline" : "Trial created" })
      }
      setIsEditing(false)
      if (navigator.onLine) fetchData()
    } catch (e: any) { toast({ title: "Error saving", description: e.message, variant: "destructive" }) }
    finally { setIsSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this trial?")) return
    const { error } = await supabase.from("rd_batch_trials").delete().eq("id", id)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Trial deleted" })
    fetchData()
  }

  const handleRecipeSelect = (recipeId: string) => {
    const rec = recipes.find(r => r.id === recipeId)
    if (rec) setForm({ ...form, recipe_id: rec.id, recipe_version: rec.version })
  }

  const handleEdit = (item: BatchTrial) => { setForm({ ...item, recipe: undefined }); setIsEditing(true) }
  const resetForm = () => { setForm(emptyForm()); setIsEditing(false) }

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#032E63]">Batch Trials</h2>
        {!isEditing && <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-[#08A04B] hover:bg-[#069a43]"><Plus className="h-4 w-4 mr-2" />Log New Trial</Button>}
      </div>

      {isEditing ? (
        <Card className="border-l-4 border-l-[#08A04B] shadow-md">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-[#032E63]">{form.id ? "Edit Trial" : "New Batch Trial"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5"><label className="text-sm font-medium">Trial No *</label>
                  <Input required value={form.trial_no || ""} onChange={e => setForm({ ...form, trial_no: e.target.value })} placeholder="TRL-001" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Link Recipe</label>
                  <Select value={form.recipe_id || ""} onValueChange={handleRecipeSelect}>
                    <SelectTrigger><SelectValue placeholder="Select recipe..." /></SelectTrigger>
                    <SelectContent>{recipes.map(r => <SelectItem key={r.id} value={r.id}>{r.product_name} ({r.version})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Recipe Version</label>
                  <Input value={form.recipe_version || ""} onChange={e => setForm({ ...form, recipe_version: e.target.value })} /></div>
                
                <div className="space-y-1.5"><label className="text-sm font-medium">Date</label>
                  <Input type="date" required value={form.date || ""} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Made By</label>
                  <Input value={form.made_by || ""} onChange={e => setForm({ ...form, made_by: e.target.value })} placeholder="John Doe" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Final Decision</label>
                  <Select value={form.final_decision || "pending"} onValueChange={v => setForm({ ...form, final_decision: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem><SelectItem value="needs_tweaking">Needs Tweaking</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="font-medium text-sm text-[#032E63] mb-3">Organoleptic Scores (0-10)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Taste</label>
                    <Input type="number" min="0" max="10" value={form.taste_score || 0} onChange={e => setForm({ ...form, taste_score: parseInt(e.target.value) || 0 })} /></div>
                  <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Aroma</label>
                    <Input type="number" min="0" max="10" value={form.aroma_score || 0} onChange={e => setForm({ ...form, aroma_score: parseInt(e.target.value) || 0 })} /></div>
                  <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Color</label>
                    <Input type="number" min="0" max="10" value={form.color_score || 0} onChange={e => setForm({ ...form, color_score: parseInt(e.target.value) || 0 })} /></div>
                  <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Texture</label>
                    <Input type="number" min="0" max="10" value={form.texture_score || 0} onChange={e => setForm({ ...form, texture_score: parseInt(e.target.value) || 0 })} /></div>
                </div>
              </div>

              <div className="space-y-1.5"><label className="text-sm font-medium">Observed Problems</label>
                <Textarea value={form.problems || ""} onChange={e => setForm({ ...form, problems: e.target.value })} rows={2} placeholder="E.g. Too salty, color too pale..." /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">Notes</label>
                <Textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={isSaving} className="bg-[#08A04B] hover:bg-[#069a43]">
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}{form.id ? "Update" : "Save Trial"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="p-0">
          {trials.length === 0 ? (
            <div className="p-12 text-center"><TestTubes className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No trials recorded. Log your first batch trial.</p></div>
          ) : (
            <div className="overflow-x-auto w-full"><Table className="min-w-[600px] mb-4"><TableHeader><TableRow>
              <TableHead>Trial No</TableHead><TableHead>Date</TableHead><TableHead>Product</TableHead><TableHead>Scores (Avg)</TableHead><TableHead>Decision</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
              <TableBody>{trials.map(t => {
                const avgScore = ((t.taste_score + t.aroma_score + t.color_score + t.texture_score) / 4).toFixed(1);
                return (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.trial_no}</TableCell>
                  <TableCell>{t.date}</TableCell>
                  <TableCell>{t.recipe?.product_name || "Unknown"} <Badge variant="outline" className="ml-1 text-[10px]">{t.recipe_version}</Badge></TableCell>
                  <TableCell><span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{avgScore}/10</span></TableCell>
                  <TableCell>
                    <Badge variant="outline" className={t.final_decision === 'approved' ? "bg-green-100 text-green-700 border-green-200" : t.final_decision === 'rejected' ? "bg-red-100 text-red-700 border-red-200" : t.final_decision === 'needs_tweaking' ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-gray-100 text-gray-700"}>
                      {t.final_decision.replace("_", " ").toUpperCase()}
                    </Badge>
                  </TableCell>
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
