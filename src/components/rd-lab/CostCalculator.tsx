import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Plus, Edit, Trash2, X, Check, Loader2, Calculator } from "lucide-react"

interface CostCalc {
  id: string; product: string; recipe_id: string;
  ingredient_cost: number; packaging_cost: number; labour_cost: number;
  manufacturing_cost: number; logistics_cost: number; other_cost: number;
  total_cost: number; margin_percent: number; selling_price: number; notes: string;
  recipe?: { product_name: string; version: string }
}

const emptyForm = (): Partial<CostCalc> => ({
  product: "", recipe_id: "", ingredient_cost: 0, packaging_cost: 0, labour_cost: 0,
  manufacturing_cost: 0, logistics_cost: 0, other_cost: 0,
  total_cost: 0, margin_percent: 0, selling_price: 0, notes: ""
})

export function CostCalculator() {
  const { toast } = useToast()
  const [costs, setCosts] = useState<CostCalc[]>([])
  const [recipes, setRecipes] = useState<{id: string, product_name: string, version: string, cost_per_batch: number}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [costsRes, recipesRes] = await Promise.all([
        supabase.from("rd_cost_calculations").select("*, recipe:rd_recipes(product_name, version)").order("product", { ascending: true }),
        supabase.from("rd_recipes").select("id, product_name, version, cost_per_batch").order("product_name")
      ])
      if (costsRes.error) throw costsRes.error
      if (recipesRes.error) throw recipesRes.error
      setCosts(costsRes.data as any)
      setRecipes(recipesRes.data)
    } catch (e: any) { toast({ title: "Error loading costs", description: e.message, variant: "destructive" }) }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  // Auto-calculate totals whenever dependent fields change
  useEffect(() => {
    if (isEditing) {
      const totalCost = (form.ingredient_cost || 0) + (form.packaging_cost || 0) + 
                        (form.labour_cost || 0) + (form.manufacturing_cost || 0) + 
                        (form.logistics_cost || 0) + (form.other_cost || 0);
      
      const sellingPrice = totalCost * (1 + ((form.margin_percent || 0) / 100));
      
      setForm(prev => ({
        ...prev,
        total_cost: parseFloat(totalCost.toFixed(2)),
        selling_price: parseFloat(sellingPrice.toFixed(2))
      }))
    }
  }, [
    form.ingredient_cost, form.packaging_cost, form.labour_cost, 
    form.manufacturing_cost, form.logistics_cost, form.other_cost, 
    form.margin_percent, isEditing
  ])

  const handleRecipeSelect = (recipeId: string) => {
    const rec = recipes.find(r => r.id === recipeId)
    if (rec) {
      setForm({
        ...form, 
        recipe_id: rec.id, 
        product: rec.product_name,
        ingredient_cost: rec.cost_per_batch || 0 // Auto-fill from recipe if available
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.product?.trim()) { toast({ title: "Product name required", variant: "destructive" }); return }
    try {
      setIsSaving(true)
      const payload = {
        product: form.product, recipe_id: form.recipe_id || null,
        ingredient_cost: form.ingredient_cost, packaging_cost: form.packaging_cost,
        labour_cost: form.labour_cost, manufacturing_cost: form.manufacturing_cost,
        logistics_cost: form.logistics_cost, other_cost: form.other_cost,
        total_cost: form.total_cost, margin_percent: form.margin_percent,
        selling_price: form.selling_price, notes: form.notes
      }
      
      if (form.id) {
        const { error } = await supabase.from("rd_cost_calculations").update(payload).eq("id", form.id)
        if (error) throw error
        toast({ title: "Cost calculation updated" })
      } else {
        const { error } = await supabase.from("rd_cost_calculations").insert([payload])
        if (error) throw error
        toast({ title: "Cost calculation saved" })
      }
      setIsEditing(false)
      fetchData()
    } catch (e: any) { toast({ title: "Error saving", description: e.message, variant: "destructive" }) }
    finally { setIsSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this calculation?")) return
    const { error } = await supabase.from("rd_cost_calculations").delete().eq("id", id)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Calculation deleted" })
    fetchData()
  }

  const handleEdit = (item: CostCalc) => { setForm({ ...item, recipe: undefined }); setIsEditing(true) }
  const resetForm = () => { setForm(emptyForm()); setIsEditing(false) }

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#032E63]">Cost Calculator</h2>
        {!isEditing && <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-[#08A04B] hover:bg-[#069a43]"><Plus className="h-4 w-4 mr-2" />New Calculation</Button>}
      </div>

      {isEditing ? (
        <Card className="border-l-4 border-l-[#08A04B] shadow-md">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-[#032E63]">{form.id ? "Edit Calculation" : "New Cost Calculation"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-sm font-medium">Link Recipe (Optional)</label>
                  <Select value={form.recipe_id || ""} onValueChange={handleRecipeSelect}>
                    <SelectTrigger><SelectValue placeholder="Select recipe to auto-fill..." /></SelectTrigger>
                    <SelectContent>{recipes.map(r => <SelectItem key={r.id} value={r.id}>{r.product_name} ({r.version})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Product Name *</label>
                  <Input required value={form.product || ""} onChange={e => setForm({ ...form, product: e.target.value })} /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="space-y-4">
                  <h4 className="font-semibold text-[#032E63] border-b pb-2">Direct Costs (₹)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Ingredient Cost</label>
                      <Input type="number" step="0.01" value={form.ingredient_cost || 0} onChange={e => setForm({ ...form, ingredient_cost: parseFloat(e.target.value) || 0 })} /></div>
                    <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Packaging Cost</label>
                      <Input type="number" step="0.01" value={form.packaging_cost || 0} onChange={e => setForm({ ...form, packaging_cost: parseFloat(e.target.value) || 0 })} /></div>
                    <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Labour Cost</label>
                      <Input type="number" step="0.01" value={form.labour_cost || 0} onChange={e => setForm({ ...form, labour_cost: parseFloat(e.target.value) || 0 })} /></div>
                    <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Manufacturing (Power, etc)</label>
                      <Input type="number" step="0.01" value={form.manufacturing_cost || 0} onChange={e => setForm({ ...form, manufacturing_cost: parseFloat(e.target.value) || 0 })} /></div>
                    <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Logistics/Transport</label>
                      <Input type="number" step="0.01" value={form.logistics_cost || 0} onChange={e => setForm({ ...form, logistics_cost: parseFloat(e.target.value) || 0 })} /></div>
                    <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Other Overhead</label>
                      <Input type="number" step="0.01" value={form.other_cost || 0} onChange={e => setForm({ ...form, other_cost: parseFloat(e.target.value) || 0 })} /></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-[#032E63] border-b pb-2">Final Pricing</h4>
                  <div className="bg-white p-4 rounded-md border shadow-sm space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Cost</label>
                      <div className="text-2xl font-bold text-gray-900">₹{(form.total_cost || 0).toLocaleString()}</div>
                    </div>
                    <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Desired Margin (%)</label>
                      <Input type="number" step="0.1" value={form.margin_percent || 0} onChange={e => setForm({ ...form, margin_percent: parseFloat(e.target.value) || 0 })} className="bg-green-50 border-green-200" /></div>
                    <div className="pt-2 border-t">
                      <label className="text-xs font-medium text-green-600 uppercase tracking-wide">Suggested Selling Price</label>
                      <div className="text-3xl font-black text-green-600">₹{(form.selling_price || 0).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5"><label className="text-sm font-medium">Notes & Assumptions</label>
                <Textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={isSaving} className="bg-[#08A04B] hover:bg-[#069a43]">
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}{form.id ? "Update" : "Save Calculator"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="p-0">
          {costs.length === 0 ? (
            <div className="p-12 text-center"><Calculator className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No cost calculations.</p></div>
          ) : (
            <div className="overflow-x-auto w-full"><Table className="min-w-[600px] mb-4"><TableHeader><TableRow>
              <TableHead>Product</TableHead><TableHead>Total Cost</TableHead><TableHead>Margin</TableHead><TableHead>Selling Price</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
              <TableBody>{costs.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.product} {c.recipe && <span className="text-xs text-gray-400">({c.recipe.version})</span>}</TableCell>
                  <TableCell>₹{(c.total_cost || 0).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline" className="bg-blue-50 text-blue-700">{c.margin_percent}%</Badge></TableCell>
                  <TableCell className="font-bold text-green-600">₹{(c.selling_price || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Edit className="h-4 w-4 text-blue-600" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
