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
import { Plus, Edit, Trash2, X, Check, Loader2, CalendarClock } from "lucide-react"

interface Observation {
  day: string; moisture: string; color: string; aroma: string; clumping: string; taste: string; notes: string;
}

interface ShelfLifeTest {
  id: string; product: string; batch: string; packaging: string;
  temperature: string; humidity: string; observations: Record<string, Observation>;
  start_date: string; status: string; notes: string;
}

const emptyForm = (): Partial<ShelfLifeTest> => ({
  product: "", batch: "", packaging: "", temperature: "", humidity: "",
  observations: {}, start_date: new Date().toISOString().split("T")[0], status: "running", notes: ""
})

const DAYS = ["Day 0", "Day 15", "Day 30", "Day 60", "Day 90", "Day 180", "Day 365"]

export function ShelfLifeTesting() {
  const { toast } = useToast()
  const [tests, setTests] = useState<ShelfLifeTest[]>([])
  const [recipes, setRecipes] = useState<{product_name: string}[]>([])
  const [trials, setTrials] = useState<{trial_no: string}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [selectedDay, setSelectedDay] = useState("Day 0")

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [testsRes, recRes, trialsRes] = await Promise.all([
        supabase.from("rd_shelf_life_tests").select("*").order("start_date", { ascending: false }),
        supabase.from("rd_recipes").select("product_name").order("product_name"),
        supabase.from("rd_batch_trials").select("trial_no").order("trial_no")
      ])
      if (testsRes.error) throw testsRes.error
      if (recRes.error) throw recRes.error
      if (trialsRes.error) throw trialsRes.error

      const parsed = (testsRes.data || []).map((t: any) => ({
        ...t,
        observations: typeof t.observations === "string" ? JSON.parse(t.observations) : (t.observations || {})
      }))
      setTests(parsed)
      setRecipes(recRes.data || [])
      setTrials(trialsRes.data || [])
    } catch (e: any) { toast({ title: "Error loading tests", description: e.message, variant: "destructive" }) }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.product?.trim()) { toast({ title: "Product name required", variant: "destructive" }); return }
    try {
      setIsSaving(true)
      const payload = {
        product: form.product, batch: form.batch, packaging: form.packaging,
        temperature: form.temperature, humidity: form.humidity,
        observations: JSON.stringify(form.observations), start_date: form.start_date,
        status: form.status, notes: form.notes
      }
      if (form.id) {
        const { error } = await supabase.from("rd_shelf_life_tests").update(payload).eq("id", form.id)
        if (error) throw error
        toast({ title: "Shelf life test updated" })
      } else {
        const { error } = await supabase.from("rd_shelf_life_tests").insert([payload])
        if (error) throw error
        toast({ title: "Shelf life test started" })
      }
      setIsEditing(false)
      fetchData()
    } catch (e: any) { toast({ title: "Error saving", description: e.message, variant: "destructive" }) }
    finally { setIsSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this test record?")) return
    const { error } = await supabase.from("rd_shelf_life_tests").delete().eq("id", id)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Test deleted" })
    fetchData()
  }

  const handleEdit = (item: ShelfLifeTest) => { setForm({ ...item }); setIsEditing(true); setSelectedDay("Day 0") }
  const resetForm = () => { setForm(emptyForm()); setIsEditing(false); setSelectedDay("Day 0") }

  const handleObservationChange = (field: keyof Observation, value: string) => {
    const obs = form.observations || {}
    const current = obs[selectedDay] || { day: selectedDay, moisture: "", color: "", aroma: "", clumping: "", taste: "", notes: "" }
    setForm({ ...form, observations: { ...obs, [selectedDay]: { ...current, [field]: value } } })
  }

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>

  const currentObservation = (form.observations || {})[selectedDay] || { moisture: "", color: "", aroma: "", clumping: "", taste: "", notes: "" }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#032E63]">Shelf Life Testing</h2>
        {!isEditing && <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-[#08A04B] hover:bg-[#069a43]"><Plus className="h-4 w-4 mr-2" />Start Test</Button>}
      </div>

      {isEditing ? (
        <Card className="border-l-4 border-l-[#08A04B] shadow-md">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-[#032E63]">{form.id ? "Edit Test" : "New Shelf Life Test"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-medium">Product Name *</label>
                  <Select value={form.product || ""} onValueChange={v => setForm({ ...form, product: v })}>
                    <SelectTrigger><SelectValue placeholder="Select product..." /></SelectTrigger>
                    <SelectContent>
                      {recipes.map(r => <SelectItem key={r.product_name} value={r.product_name}>{r.product_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Batch No</label>
                  <Select value={form.batch || ""} onValueChange={v => setForm({ ...form, batch: v })}>
                    <SelectTrigger><SelectValue placeholder="Select batch trial..." /></SelectTrigger>
                    <SelectContent>
                      {trials.map(t => <SelectItem key={t.trial_no} value={t.trial_no}>{t.trial_no}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Start Date</label>
                  <Input type="date" required value={form.start_date || ""} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                
                <div className="space-y-1.5"><label className="text-sm font-medium">Packaging</label>
                  <Input value={form.packaging || ""} onChange={e => setForm({ ...form, packaging: e.target.value })} placeholder="PET Jar, Foil Pouch..." /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Temperature</label>
                  <Input value={form.temperature || ""} onChange={e => setForm({ ...form, temperature: e.target.value })} placeholder="25°C" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Humidity</label>
                  <Input value={form.humidity || ""} onChange={e => setForm({ ...form, humidity: e.target.value })} placeholder="65% RH" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Status</label>
                  <Select value={form.status || "running"} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="running">Running</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="failed">Failed / Terminated</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>

              {/* Day Observations */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-2 flex overflow-x-auto gap-2 border-b">
                  {DAYS.map(day => {
                    const hasData = (form.observations || {})[day]
                    return (
                      <Button key={day} type="button" variant={selectedDay === day ? "default" : "outline"}
                        className={`h-8 text-xs shrink-0 ${selectedDay === day ? "bg-[#032E63]" : ""} ${hasData && selectedDay !== day ? "border-blue-300 bg-blue-50 text-blue-700" : ""}`}
                        onClick={() => setSelectedDay(day)}>
                        {day} {hasData && <Check className="h-3 w-3 ml-1" />}
                      </Button>
                    )
                  })}
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
                  <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Moisture (%)</label>
                    <Input value={currentObservation.moisture || ""} onChange={e => handleObservationChange("moisture", e.target.value)} /></div>
                  <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Color Changes</label>
                    <Input value={currentObservation.color || ""} onChange={e => handleObservationChange("color", e.target.value)} /></div>
                  <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Aroma</label>
                    <Input value={currentObservation.aroma || ""} onChange={e => handleObservationChange("aroma", e.target.value)} /></div>
                  <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Clumping</label>
                    <Input value={currentObservation.clumping || ""} onChange={e => handleObservationChange("clumping", e.target.value)} /></div>
                  <div className="space-y-1.5"><label className="text-xs font-medium text-gray-500">Taste Profile</label>
                    <Input value={currentObservation.taste || ""} onChange={e => handleObservationChange("taste", e.target.value)} /></div>
                  <div className="space-y-1.5 md:col-span-2"><label className="text-xs font-medium text-gray-500">Day Notes</label>
                    <Textarea value={currentObservation.notes || ""} onChange={e => handleObservationChange("notes", e.target.value)} rows={2} /></div>
                </div>
              </div>

              <div className="space-y-1.5"><label className="text-sm font-medium">Overall Notes</label>
                <Textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={isSaving} className="bg-[#08A04B] hover:bg-[#069a43]">
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}{form.id ? "Update" : "Save Test"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="p-0">
          {tests.length === 0 ? (
            <div className="p-12 text-center"><CalendarClock className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No shelf life tests running.</p></div>
          ) : (
            <Table><TableHeader><TableRow>
              <TableHead>Start Date</TableHead><TableHead>Product</TableHead><TableHead>Batch</TableHead><TableHead>Conditions</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
              <TableBody>{tests.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{t.start_date}</TableCell>
                  <TableCell className="font-medium">{t.product}</TableCell>
                  <TableCell>{t.batch || "—"}</TableCell>
                  <TableCell className="text-sm text-gray-500">{t.packaging} | {t.temperature} | {t.humidity}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={t.status === 'running' ? "bg-blue-100 text-blue-700 border-blue-200" : t.status === 'completed' ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
                      {t.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}><Edit className="h-4 w-4 text-blue-600" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
