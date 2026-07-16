import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { saveWithOfflineSupport } from "./OfflineSyncManager"
import { Plus, Edit, Trash2, X, Check, Loader2, FlaskConical, ClipboardCheck } from "lucide-react"

interface Ingredient { name: string; percentage: string }
interface Recipe {
  id: string; product_name: string; version: string; category: string;
  batch_size: string; ingredients: Ingredient[]; steps: string[];
  mixing_sequence: string; notes: string; cost_per_batch: number;
  status: string; created_at: string; updated_at: string;
}

const CATEGORIES = ["Seasoning", "Spice Blend", "Dust", "Coating", "Marinade", "Sauce", "Other"]
const STATUSES = ["draft", "testing", "approved", "discontinued"]

const emptyForm = (): Partial<Recipe> => ({
  product_name: "", version: "V1.0", category: "Seasoning", batch_size: "",
  ingredients: [{ name: "", percentage: "" }], steps: [""],
  mixing_sequence: "", notes: "", cost_per_batch: 0, status: "draft",
})

export function RecipeFormulation() {
  const { toast } = useToast()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [materials, setMaterials] = useState<{name: string}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isPasting, setIsPasting] = useState(false)
  const [pasteText, setPasteText] = useState("")
  const [isPastingIngredients, setIsPastingIngredients] = useState(false)
  const [pasteIngredientsText, setPasteIngredientsText] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())

  const fetchRecipes = async () => {
    try {
      setIsLoading(true)
      const [recRes, matRes] = await Promise.all([
        supabase.from("rd_recipes").select("*").order("updated_at", { ascending: false }),
        supabase.from("rd_raw_materials").select("name").order("name")
      ])
      if (recRes.error) throw recRes.error
      if (matRes.error) throw matRes.error

      const parsed = (recRes.data || []).map((r: any) => ({
        ...r,
        ingredients: typeof r.ingredients === "string" ? JSON.parse(r.ingredients) : (r.ingredients || []),
        steps: typeof r.steps === "string" ? JSON.parse(r.steps) : (r.steps || []),
      }))
      setRecipes(parsed)
      setMaterials(matRes.data || [])
    } catch (e: any) { toast({ title: "Error loading recipes", description: e.message, variant: "destructive" }) }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchRecipes() }, [])

  const handlePasteImport = async () => {
    const lines = pasteText.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length < 2) {
      toast({ title: "Invalid Data", description: "Please paste a header row and at least one data row from Excel.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const headers = lines[0].split("\t").map(h => h.trim().toLowerCase());
    const rows = lines.slice(1);

    const mappings = {
      product_name: ['productname', 'product', 'name', 'recipe', 'recipename'],
      version: ['version', 'v', 'revision'],
      category: ['category', 'type', 'class'],
      batch_size: ['batchsize', 'batch_size', 'size'],
      cost_per_batch: ['costperbatch', 'cost', 'batchcost', 'price'],
      status: ['status', 'state'],
      notes: ['notes', 'note', 'description']
    };

    const dbRows: any[] = [];

    for (const row of rows) {
      const cols = row.split("\t");
      const dbRow: any = {};
      
      headers.forEach((header, index) => {
        const normHeader = header.replace(/[^a-z0-9]/g, '');
        const val = cols[index]?.trim() || '';

        for (const [dbCol, synonyms] of Object.entries(mappings)) {
          if (synonyms.includes(normHeader)) {
            if (dbCol === 'cost_per_batch') {
              const parsedNum = Number(val.replace(/[^0-9.-]+/g, ""));
              dbRow[dbCol] = isNaN(parsedNum) ? 0 : parsedNum;
            } else {
              dbRow[dbCol] = val;
            }
            break;
          }
        }
      });

      if (dbRow.product_name) {
        dbRow.ingredients = JSON.stringify([]);
        dbRow.steps = JSON.stringify([]);
        dbRows.push(dbRow);
      }
    }

    if (dbRows.length === 0) {
      toast({ title: "Import Failed", description: "Could not auto-detect the 'Product Name' column.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    try {
      const { error } = await supabase.from("rd_recipes").insert(dbRows);
      if (error) throw error;
      toast({ title: "Import Successful", description: `Successfully imported ${dbRows.length} recipes.` });
      fetchRecipes();
      setIsPasting(false);
      setPasteText("");
    } catch (err: any) {
      toast({ title: "Import Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasteIngredients = () => {
    const lines = pasteIngredientsText.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length === 0) return;

    const newIngredients: Ingredient[] = [];
    
    for (const line of lines) {
      const cols = line.split("\t");
      if (cols.length === 0) continue;
      
      const name = cols[0]?.trim();
      let percentage = cols[1]?.trim() || "";
      
      if (!name) continue;
      
      if (name.toLowerCase() === 'ingredient' || name.toLowerCase() === 'item' || name.toLowerCase() === 'name') {
        continue;
      }
      
      if (percentage && !percentage.includes('%') && !isNaN(Number(percentage))) {
        percentage = `${percentage}%`;
      }
      
      newIngredients.push({ name, percentage });
    }

    if (newIngredients.length > 0) {
      const current = form.ingredients || [];
      const filteredCurrent = current.filter(ing => ing.name !== "" || ing.percentage !== "");
      
      setForm({
        ...form,
        ingredients: [...filteredCurrent, ...newIngredients]
      });
      toast({ title: "Ingredients Pasted", description: `Added ${newIngredients.length} ingredients.` });
    } else {
      toast({ title: "No Ingredients Found", description: "Please ensure you copy two columns: Name and Percentage.", variant: "destructive" });
    }
    
    setIsPastingIngredients(false);
    setPasteIngredientsText("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.product_name?.trim()) { toast({ title: "Product name is required", variant: "destructive" }); return }
    try {
      setIsSaving(true)
      const payload = {
        product_name: form.product_name, version: form.version, category: form.category,
        batch_size: form.batch_size, ingredients: JSON.stringify(form.ingredients),
        steps: JSON.stringify(form.steps), mixing_sequence: form.mixing_sequence,
        notes: form.notes, cost_per_batch: form.cost_per_batch || 0, status: form.status,
      }
      if (form.id) {
        const { error, offline } = await saveWithOfflineSupport("rd_recipes", payload, "update", form.id)
        if (error) throw error
        toast({ title: offline ? "Saved offline" : "Recipe updated" })
      } else {
        const { error, offline } = await saveWithOfflineSupport("rd_recipes", payload, "insert")
        if (error) throw error
        toast({ title: offline ? "Saved offline" : "Recipe created" })
      }
      setIsEditing(false)
      if (navigator.onLine) fetchRecipes()
    } catch (e: any) { toast({ title: "Error saving recipe", description: e.message, variant: "destructive" }) }
    finally { setIsSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this recipe?")) return
    const { error } = await supabase.from("rd_recipes").delete().eq("id", id)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Recipe deleted" })
    fetchRecipes()
  }

  const handleEdit = (r: Recipe) => { setForm({ ...r }); setIsEditing(true) }
  const resetForm = () => { setForm(emptyForm()); setIsEditing(false) }

  // Ingredient row helpers
  const addIngredient = () => setForm({ ...form, ingredients: [...(form.ingredients || []), { name: "", percentage: "" }] })
  const removeIngredient = (i: number) => setForm({ ...form, ingredients: (form.ingredients || []).filter((_, idx) => idx !== i) })
  const updateIngredient = (i: number, field: keyof Ingredient, val: string) => {
    const updated = [...(form.ingredients || [])]
    updated[i] = { ...updated[i], [field]: val }
    setForm({ ...form, ingredients: updated })
  }

  // Step helpers
  const addStep = () => setForm({ ...form, steps: [...(form.steps || []), ""] })
  const removeStep = (i: number) => setForm({ ...form, steps: (form.steps || []).filter((_, idx) => idx !== i) })
  const updateStep = (i: number, val: string) => {
    const updated = [...(form.steps || [])]
    updated[i] = val
    setForm({ ...form, steps: updated })
  }

  const statusColor = (s: string) => {
    if (s === "approved") return "bg-green-100 text-green-800"
    if (s === "testing") return "bg-blue-100 text-blue-800"
    if (s === "discontinued") return "bg-gray-100 text-gray-600"
    return "bg-amber-100 text-amber-800"
  }

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#032E63]">Recipe Formulation</h2>
        {!isEditing && !isPasting && (
          <div className="flex gap-2">
            <Button onClick={() => { setPasteText(""); setIsPasting(true) }} variant="outline" className="border-indigo-500 text-indigo-600 hover:bg-indigo-50">
              <ClipboardCheck className="h-4 w-4 mr-2" />Bulk Paste (Excel)
            </Button>
            <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-[#08A04B] hover:bg-[#069a43]"><Plus className="h-4 w-4 mr-2" />New Recipe</Button>
          </div>
        )}
      </div>

      {isPasting ? (
        <Card className="border-l-4 border-l-indigo-500 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-[#032E63] flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-indigo-500" /> Excel/Sheets Recipe Import
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsPasting(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Copy rows from your Excel/Google Sheet (including the header row) and paste them below. 
              The system will auto-detect columns like <strong>Product Name, Version, Category, Batch Size, Cost, Notes, Status</strong>.
            </p>
            <Textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder="Product Name&#9;Version&#9;Category&#9;Batch Size&#9;Cost&#10;Sweet Seasoning&#9;V1.2&#9;Seasoning&#9;100 kg&#9;15000"
              rows={10}
              className="font-mono text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsPasting(false)}>Cancel</Button>
              <Button onClick={handlePasteImport} disabled={isSaving || !pasteText.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />} Import Recipes
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : isEditing ? (
        <Card className="border-l-4 border-l-[#08A04B] shadow-md">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-[#032E63]">{form.id ? "Edit Recipe" : "New Recipe"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5"><label className="text-sm font-medium">Product Name *</label>
                  <Input required value={form.product_name || ""} onChange={e => setForm({ ...form, product_name: e.target.value })} placeholder="Mango-Chilli Dust" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Version</label>
                  <Input value={form.version || ""} onChange={e => setForm({ ...form, version: e.target.value })} placeholder="V2.4" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Category</label>
                  <Select value={form.category || "Seasoning"} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Batch Size</label>
                  <Input value={form.batch_size || ""} onChange={e => setForm({ ...form, batch_size: e.target.value })} placeholder="50 kg" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Cost/Batch (₹)</label>
                  <Input type="number" value={form.cost_per_batch || 0} onChange={e => setForm({ ...form, cost_per_batch: parseFloat(e.target.value) || 0 })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Status</label>
                  <Select value={form.status || "draft"} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent></Select></div>
              </div>

              {/* Ingredients */}
              <div className="space-y-2">
                <div className="flex items-center justify-between"><label className="text-sm font-semibold text-[#032E63]">Ingredients</label>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => { setPasteIngredientsText(""); setIsPastingIngredients(true) }} className="border-indigo-500 text-indigo-600 hover:bg-indigo-50"><ClipboardCheck className="h-3 w-3 mr-1" />Paste List</Button>
                    <Button type="button" variant="outline" size="sm" onClick={addIngredient}><Plus className="h-3 w-3 mr-1" />Add</Button>
                  </div>
                </div>

                {isPastingIngredients && (
                  <Card className="border border-indigo-200 bg-indigo-50/30 p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-indigo-900">Paste Ingredients (Excel format: Ingredient [Tab] Percentage)</h4>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsPastingIngredients(false)}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                    <Textarea 
                      value={pasteIngredientsText}
                      onChange={e => setPasteIngredientsText(e.target.value)}
                      placeholder="Sugar&#9;45%&#10;Salt&#9;5%&#10;Garlic Powder&#9;20%"
                      rows={5}
                      className="font-mono text-xs bg-white"
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setIsPastingIngredients(false)}>Cancel</Button>
                      <Button type="button" size="sm" onClick={handlePasteIngredients} disabled={!pasteIngredientsText.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">Import List</Button>
                    </div>
                  </Card>
                )}

                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto w-full"><Table className="min-w-[600px] mb-4"><TableHeader><TableRow><TableHead className="w-8">#</TableHead><TableHead>Ingredient</TableHead><TableHead className="w-28">%</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                    <TableBody>
                      {(form.ingredients || []).map((ing, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs text-gray-400">{i + 1}</TableCell>
                          <TableCell>
                            <Select value={ing.name || ""} onValueChange={v => updateIngredient(i, "name", v)}>
                              <SelectTrigger className="h-8"><SelectValue placeholder="Select material..." /></SelectTrigger>
                              <SelectContent>
                                {materials.map(m => <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell><Input className="h-8" value={ing.percentage} onChange={e => updateIngredient(i, "percentage", e.target.value)} placeholder="22%" /></TableCell>
                          <TableCell><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeIngredient(i)}><X className="h-3 w-3 text-red-400" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table></div>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                <div className="flex items-center justify-between"><label className="text-sm font-semibold text-[#032E63]">Manufacturing Steps</label>
                  <Button type="button" variant="outline" size="sm" onClick={addStep}><Plus className="h-3 w-3 mr-1" />Add Step</Button></div>
                {(form.steps || []).map((step, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Badge variant="outline" className="shrink-0 h-6 w-6 justify-center p-0 text-xs">{i + 1}</Badge>
                    <Input value={step} onChange={e => updateStep(i, e.target.value)} placeholder={`Step ${i + 1}`} />
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeStep(i)}><X className="h-3 w-3 text-red-400" /></Button>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5"><label className="text-sm font-medium">Mixing Sequence</label>
                <Textarea value={form.mixing_sequence || ""} onChange={e => setForm({ ...form, mixing_sequence: e.target.value })} rows={2} placeholder="Order of mixing..." /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">Notes</label>
                <Textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={isSaving} className="bg-[#08A04B] hover:bg-[#069a43]">
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}{form.id ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="p-0">
          {recipes.length === 0 ? (
            <div className="p-12 text-center"><FlaskConical className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No recipes yet. Create your first recipe.</p></div>
          ) : (
            <div className="overflow-x-auto w-full"><Table className="min-w-[600px] mb-4"><TableHeader><TableRow>
              <TableHead>Product</TableHead><TableHead>Version</TableHead><TableHead>Category</TableHead><TableHead>Ingredients</TableHead><TableHead>Cost</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
              <TableBody>{recipes.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.product_name}</TableCell>
                  <TableCell><Badge variant="outline">{r.version}</Badge></TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell className="text-sm text-gray-500">{(r.ingredients || []).length} items</TableCell>
                  <TableCell>₹{(r.cost_per_batch || 0).toLocaleString()}</TableCell>
                  <TableCell><Badge className={statusColor(r.status)}>{r.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(r)}><Edit className="h-4 w-4 text-blue-600" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
