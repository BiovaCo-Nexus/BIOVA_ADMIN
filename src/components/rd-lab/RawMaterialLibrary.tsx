import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { 
  Plus, Edit, Trash2, X, Check, Loader2, PackageSearch, ClipboardCheck, 
  Search, Copy, AlertTriangle, Filter, Layers, LayoutGrid, RefreshCw 
} from "lucide-react"

interface Spec { key: string; value: string }
interface RawMaterial {
  id: string; name: string; supplier: string; cost_per_kg: number;
  moq: string; shelf_life: string; fssai_category: string;
  coa_url: string; specifications: Spec[]; notes: string;
}

const emptyForm = (): Partial<RawMaterial> => ({
  name: "", supplier: "", cost_per_kg: 0, moq: "",
  shelf_life: "", fssai_category: "", coa_url: "",
  specifications: [{ key: "", value: "" }], notes: "",
})

export function RawMaterialLibrary() {
  const { toast } = useToast()
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isPasting, setIsPasting] = useState(false)
  const [pasteText, setPasteText] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(emptyForm())

  // Filtering states
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all")
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false)
  const [groupedView, setGroupedView] = useState(false)

  const [suppliers, setSuppliers] = useState<{name: string}[]>([])

  const fetchMaterials = async () => {
    try {
      setIsLoading(true)
      const [matRes, supRes] = await Promise.all([
        supabase.from("rd_raw_materials").select("*").order("name", { ascending: true }),
        supabase.from("rd_suppliers").select("name").order("name")
      ])
      if (matRes.error) throw matRes.error
      if (supRes.error) throw supRes.error
      
      const parsed = (matRes.data || []).map((m: any) => ({
        ...m,
        specifications: typeof m.specifications === "string" ? JSON.parse(m.specifications) : (m.specifications || []),
      }))
      setMaterials(parsed)
      setSuppliers(supRes.data || [])
    } catch (e: any) { 
      toast({ title: "Error loading materials", description: e.message, variant: "destructive" }) 
    } finally { 
      setIsLoading(false) 
    }
  }

  useEffect(() => { fetchMaterials() }, [])

  // Identify duplicate names (case-insensitive & trimmed)
  const duplicateMap = useMemo(() => {
    const map = new Map<string, number>()
    materials.forEach(m => {
      const normName = (m.name || "").trim().toLowerCase()
      if (normName) {
        map.set(normName, (map.get(normName) || 0) + 1)
      }
    })
    return map
  }, [materials])

  // Count duplicate items and unique names
  const stats = useMemo(() => {
    let duplicateItemsCount = 0
    let duplicateGroupsCount = 0

    duplicateMap.forEach((count) => {
      if (count > 1) {
        duplicateGroupsCount++
        duplicateItemsCount += count
      }
    })

    const totalCost = materials.reduce((acc, m) => acc + (m.cost_per_kg || 0), 0)
    const avgCost = materials.length > 0 ? totalCost / materials.length : 0

    return {
      total: materials.length,
      unique: duplicateMap.size,
      duplicateGroups: duplicateGroupsCount,
      duplicateItems: duplicateItemsCount,
      avgCost,
    }
  }, [materials, duplicateMap])

  // Filter materials based on search, supplier, and duplicate filter
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const normName = (m.name || "").trim().toLowerCase()
      const isDup = (duplicateMap.get(normName) || 0) > 1

      if (showDuplicatesOnly && !isDup) {
        return false
      }

      if (selectedSupplier !== "all" && m.supplier !== selectedSupplier) {
        return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesName = m.name.toLowerCase().includes(q)
        const matchesSupplier = (m.supplier || "").toLowerCase().includes(q)
        const matchesCategory = (m.fssai_category || "").toLowerCase().includes(q)
        const matchesNotes = (m.notes || "").toLowerCase().includes(q)
        if (!matchesName && !matchesSupplier && !matchesCategory && !matchesNotes) {
          return false
        }
      }

      return true
    })
  }, [materials, searchQuery, selectedSupplier, showDuplicatesOnly, duplicateMap])

  // Group materials by normalized name if groupedView is active
  const groupedMaterials = useMemo(() => {
    const groups: { [name: string]: RawMaterial[] } = {}
    filteredMaterials.forEach(m => {
      const key = (m.name || "").trim().toLowerCase()
      if (!groups[key]) groups[key] = []
      groups[key].push(m)
    })
    return Object.entries(groups).map(([normName, items]) => ({
      name: items[0]?.name || normName,
      items,
      isDuplicate: items.length > 1
    }))
  }, [filteredMaterials])

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
      name: ['name', 'materialname', 'ingredientname', 'material', 'ingredient', 'rawmaterial'],
      supplier: ['supplier', 'vendor', 'source'],
      cost_per_kg: ['costperkg', 'cost/kg', 'cost', 'rate', 'price', 'unitprice'],
      moq: ['moq', 'minimumorderquantity', 'minimumorder'],
      shelf_life: ['shelflife', 'shelf_life', 'expiry'],
      fssai_category: ['fssaicategory', 'fssai_category', 'category'],
      coa_url: ['coaurl', 'coa_url', 'coa'],
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
            if (dbCol === 'cost_per_kg') {
              const parsedNum = Number(val.replace(/[^0-9.-]+/g, ""));
              dbRow[dbCol] = isNaN(parsedNum) ? 0 : parsedNum;
            } else {
              dbRow[dbCol] = val;
            }
            break;
          }
        }
      });

      if (dbRow.name) {
        dbRow.specifications = JSON.stringify([]);
        dbRows.push(dbRow);
      }
    }

    if (dbRows.length === 0) {
      toast({ title: "Import Failed", description: "Could not auto-detect the 'name' column. Please check your headers.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    try {
      const { error } = await supabase.from("rd_raw_materials").insert(dbRows);
      if (error) throw error;
      toast({ title: "Import Successful", description: `Successfully imported ${dbRows.length} materials.` });
      fetchMaterials();
      setIsPasting(false);
      setPasteText("");
    } catch (err: any) {
      toast({ title: "Import Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name?.trim()) { toast({ title: "Name is required", variant: "destructive" }); return }
    try {
      setIsSaving(true)
      const payload = {
        name: form.name, supplier: form.supplier, cost_per_kg: form.cost_per_kg || 0,
        moq: form.moq, shelf_life: form.shelf_life, fssai_category: form.fssai_category,
        coa_url: form.coa_url, specifications: JSON.stringify(form.specifications), notes: form.notes,
      }
      if (form.id) {
        const { error } = await supabase.from("rd_raw_materials").update(payload).eq("id", form.id)
        if (error) throw error
        toast({ title: "Material updated" })
      } else {
        const { error } = await supabase.from("rd_raw_materials").insert([payload])
        if (error) throw error
        toast({ title: "Material added" })
      }
      setIsEditing(false)
      fetchMaterials()
    } catch (e: any) { toast({ title: "Error saving", description: e.message, variant: "destructive" }) }
    finally { setIsSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this material?")) return
    const { error } = await supabase.from("rd_raw_materials").delete().eq("id", id)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Material deleted" })
    fetchMaterials()
  }

  const handleEdit = (m: RawMaterial) => { setForm({ ...m }); setIsEditing(true) }
  const resetForm = () => { setForm(emptyForm()); setIsEditing(false) }

  // Spec helpers
  const addSpec = () => setForm({ ...form, specifications: [...(form.specifications || []), { key: "", value: "" }] })
  const removeSpec = (i: number) => setForm({ ...form, specifications: (form.specifications || []).filter((_, idx) => idx !== i) })
  const updateSpec = (i: number, field: keyof Spec, val: string) => {
    const updated = [...(form.specifications || [])]
    updated[i] = { ...updated[i], [field]: val }
    setForm({ ...form, specifications: updated })
  }

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-foreground" /></div>

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Raw Material Library
            {stats.duplicateGroups > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 font-normal text-xs py-0.5">
                <AlertTriangle className="h-3 w-3 mr-1 text-amber-600" />
                {stats.duplicateGroups} Duplicate Name {stats.duplicateGroups === 1 ? 'Group' : 'Groups'}
              </Badge>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage ingredients, suppliers, costs, and identify duplicate raw materials across formulations.
          </p>
        </div>

        {!isEditing && !isPasting && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={fetchMaterials} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button onClick={() => { setPasteText(""); setIsPasting(true) }} variant="outline" size="sm" className="border-border text-foreground hover:bg-muted/50">
              <ClipboardCheck className="h-4 w-4 mr-1.5 text-primary" />Bulk Paste (Excel)
            </Button>
            <Button onClick={() => { resetForm(); setIsEditing(true) }} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-1.5" />Add Material
            </Button>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      {!isEditing && !isPasting && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-white to-gray-50/50 border-gray-200/80 shadow-xs">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Items</p>
                <p className="text-xl font-bold text-foreground mt-0.5">{stats.total}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <PackageSearch className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-gray-50/50 border-gray-200/80 shadow-xs">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Unique Names</p>
                <p className="text-xl font-bold text-emerald-700 mt-0.5">{stats.unique}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all border-gray-200/80 shadow-xs ${showDuplicatesOnly ? 'ring-2 ring-amber-500 bg-amber-50/40' : 'hover:bg-amber-50/20'}`}
            onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
          >
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-amber-800 uppercase tracking-wider flex items-center gap-1">
                  Same Name Products
                </p>
                <p className="text-xl font-bold text-amber-700 mt-0.5">
                  {stats.duplicateItems} <span className="text-xs font-normal text-amber-600">({stats.duplicateGroups} groups)</span>
                </p>
              </div>
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${stats.duplicateGroups > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                <Copy className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-gray-50/50 border-gray-200/80 shadow-xs">
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Avg Cost / Kg</p>
                <p className="text-xl font-bold text-foreground mt-0.5">₹{Math.round(stats.avgCost).toLocaleString()}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                ₹
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter and Duplicate Identifier Controls */}
      {!isEditing && !isPasting && (
        <Card className="border-gray-200/80">
          <CardContent className="p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search raw material name, supplier, category, or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-sm h-9 bg-white"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")} 
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Supplier Filter */}
              <div className="w-full sm:w-48">
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <Filter className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                    <SelectValue placeholder="All Suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {suppliers.map(s => (
                      <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duplicate Filter Toggle Button */}
              <Button
                variant={showDuplicatesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
                className={`h-9 text-xs gap-1.5 transition-all ${
                  showDuplicatesOnly 
                    ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-sm" 
                    : "border-amber-200 text-amber-800 hover:bg-amber-50"
                }`}
              >
                <Copy className="h-3.5 w-3.5" />
                {showDuplicatesOnly ? "Showing Same Names Only" : "Filter Same Name Products"}
                {stats.duplicateGroups > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-800 border-none text-[10px] px-1.5 py-0 font-bold">
                    {stats.duplicateGroups}
                  </Badge>
                )}
              </Button>

              {/* Group View Toggle */}
              <Button
                variant={groupedView ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setGroupedView(!groupedView)}
                className="h-9 text-xs gap-1.5"
                title="Group products with identical names together"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                {groupedView ? "Grouped View" : "List View"}
              </Button>
            </div>

            {/* Active Filters Bar */}
            {(showDuplicatesOnly || selectedSupplier !== "all" || searchQuery) && (
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 text-xs text-muted-foreground">
                <span className="font-medium text-gray-600">Active Filters:</span>

                {showDuplicatesOnly && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 gap-1 text-[11px]">
                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                    Same Name / Duplicate Products Only
                    <X className="h-3 w-3 ml-1 cursor-pointer hover:text-red-600" onClick={() => setShowDuplicatesOnly(false)} />
                  </Badge>
                )}

                {selectedSupplier !== "all" && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 gap-1 text-[11px]">
                    Supplier: {selectedSupplier}
                    <X className="h-3 w-3 ml-1 cursor-pointer hover:text-red-600" onClick={() => setSelectedSupplier("all")} />
                  </Badge>
                )}

                {searchQuery && (
                  <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300 gap-1 text-[11px]">
                    Search: "{searchQuery}"
                    <X className="h-3 w-3 ml-1 cursor-pointer hover:text-red-600" onClick={() => setSearchQuery("")} />
                  </Badge>
                )}

                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-xs text-primary font-normal ml-auto"
                  onClick={() => {
                    setShowDuplicatesOnly(false)
                    setSelectedSupplier("all")
                    setSearchQuery("")
                  }}
                >
                  Reset all filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Forms & Table View */}
      {isPasting ? (
        <Card className=" ">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-foreground flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-foreground" /> Excel/Sheets Bulk Paste
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsPasting(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Copy rows from your Excel/Google Sheet (including the header row) and paste them below. 
              The system will auto-detect columns like <strong>Name, Supplier, Cost per Kg, MOQ, Shelf Life, Category, Notes</strong>.
            </p>
            <Textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder="Name&#9;Supplier&#9;Cost per Kg&#9;MOQ&#10;Sugar&#9;Local Vendor&#9;45&#9;50 kg&#10;Salt&#9;Tata Salt&#9;20&#9;100 kg"
              rows={10}
              className="font-mono text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsPasting(false)}>Cancel</Button>
              <Button onClick={handlePasteImport} disabled={isSaving || !pasteText.trim()} className="bg-secondary hover:bg-secondary text-white">
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />} Import Data
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : isEditing ? (
        <Card className=" ">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-foreground">{form.id ? "Edit Material" : "New Material"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Material Name *</label>
                  <Input required value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Mango Powder" />
                  {form.name && (duplicateMap.get(form.name.trim().toLowerCase()) || 0) > 0 && !form.id && (
                    <p className="text-[11px] text-amber-700 flex items-center gap-1 font-medium mt-1">
                      <AlertTriangle className="h-3 w-3" /> Material with this exact name already exists in library!
                    </p>
                  )}
                </div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Supplier</label>
                  <Select value={form.supplier || ""} onValueChange={v => setForm({ ...form, supplier: v })}>
                    <SelectTrigger><SelectValue placeholder="Select supplier..." /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Cost per Kg (₹)</label>
                  <Input type="number" value={form.cost_per_kg || 0} onChange={e => setForm({ ...form, cost_per_kg: parseFloat(e.target.value) || 0 })} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">MOQ</label>
                  <Input value={form.moq || ""} onChange={e => setForm({ ...form, moq: e.target.value })} placeholder="50 kg" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">Shelf Life</label>
                  <Input value={form.shelf_life || ""} onChange={e => setForm({ ...form, shelf_life: e.target.value })} placeholder="12 months" /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium">FSSAI Category</label>
                  <Input value={form.fssai_category || ""} onChange={e => setForm({ ...form, fssai_category: e.target.value })} placeholder="Spices & Condiments" /></div>
                <div className="space-y-1.5 md:col-span-3"><label className="text-sm font-medium">COA Upload URL</label>
                  <Input value={form.coa_url || ""} onChange={e => setForm({ ...form, coa_url: e.target.value })} placeholder="https://..." /></div>
              </div>

              {/* Specs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between"><label className="text-sm font-semibold text-foreground">Specifications</label>
                  <Button type="button" variant="outline" size="sm" onClick={addSpec}><Plus className="h-3 w-3 mr-1" />Add Spec</Button></div>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto w-full"><Table className="min-w-[600px] mb-4"><TableHeader><TableRow><TableHead>Property</TableHead><TableHead>Requirement</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                    <TableBody>
                      {(form.specifications || []).map((spec, i) => (
                        <TableRow key={i}>
                          <TableCell><Input className="h-8" value={spec.key} onChange={e => updateSpec(i, "key", e.target.value)} placeholder="Moisture" /></TableCell>
                          <TableCell><Input className="h-8" value={spec.value} onChange={e => updateSpec(i, "value", e.target.value)} placeholder="< 5%" /></TableCell>
                          <TableCell><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSpec(i)}><X className="h-3 w-3 text-red-400" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table></div>
                </div>
              </div>

              <div className="space-y-1.5"><label className="text-sm font-medium">Notes</label>
                <Textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}{form.id ? "Update" : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="p-0">
          {filteredMaterials.length === 0 ? (
            <div className="p-12 text-center">
              <PackageSearch className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No raw materials found matching your filter criteria.</p>
              {showDuplicatesOnly && (
                <p className="text-xs text-amber-700 mt-1">No products with duplicate / same names were detected.</p>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => {
                  setShowDuplicatesOnly(false)
                  setSearchQuery("")
                  setSelectedSupplier("all")
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : groupedView ? (
            /* GROUPED BY NAME VIEW */
            <div className="p-4 space-y-4">
              {groupedMaterials.map(group => (
                <div 
                  key={group.name} 
                  className={`border rounded-lg p-3 transition-all ${
                    group.isDuplicate ? "bg-amber-50/40 border-amber-200" : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-foreground">{group.name}</span>
                      {group.isDuplicate ? (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 font-semibold text-xs">
                          <Copy className="h-3 w-3 mr-1" /> {group.items.length} Same Name Variants
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs text-gray-600">Single Item</Badge>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto w-full">
                    <Table className="min-w-[600px]">
                      <TableHeader>
                        <TableRow className="bg-gray-50/50">
                          <TableHead className="text-xs">Supplier</TableHead>
                          <TableHead className="text-xs">Cost/kg</TableHead>
                          <TableHead className="text-xs">MOQ</TableHead>
                          <TableHead className="text-xs">Shelf Life</TableHead>
                          <TableHead className="text-xs">Category</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map(m => (
                          <TableRow key={m.id} className="hover:bg-white/80">
                            <TableCell className="font-medium text-sm">{m.supplier || "—"}</TableCell>
                            <TableCell className="font-bold text-sm text-foreground">₹{(m.cost_per_kg || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-xs">{m.moq || "—"}</TableCell>
                            <TableCell className="text-xs">{m.shelf_life || "—"}</TableCell>
                            <TableCell className="text-xs">{m.fssai_category || "—"}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(m)}><Edit className="h-4 w-4 text-foreground" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* STANDARD LIST TABLE VIEW */
            <div className="overflow-x-auto w-full">
              <Table className="min-w-[750px]">
                <TableHeader>
                  <TableRow className="bg-gray-50/70">
                    <TableHead>Material Name</TableHead>
                    <TableHead>Same Name Status</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Cost/kg</TableHead>
                    <TableHead>MOQ</TableHead>
                    <TableHead>Shelf Life</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map(m => {
                    const normName = (m.name || "").trim().toLowerCase()
                    const count = duplicateMap.get(normName) || 0
                    const isDuplicate = count > 1

                    return (
                      <TableRow 
                        key={m.id} 
                        className={`transition-colors ${isDuplicate ? "bg-amber-50/50 hover:bg-amber-100/50 border-l-4 border-l-amber-500" : "hover:bg-gray-50/50"}`}
                      >
                        <TableCell className="font-semibold text-foreground">
                          <div className="flex flex-col">
                            <span>{m.name}</span>
                            {m.fssai_category && (
                              <span className="text-[10px] text-muted-foreground font-normal">{m.fssai_category}</span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          {isDuplicate ? (
                            <Badge 
                              variant="outline" 
                              className="bg-amber-100 text-amber-800 border-amber-300 font-semibold text-[11px] gap-1 cursor-pointer hover:bg-amber-200"
                              onClick={() => {
                                setSearchQuery(m.name)
                                setGroupedView(true)
                              }}
                              title="Click to view all products with this same name"
                            >
                              <Copy className="h-3 w-3 text-amber-700" />
                              Same Name ({count})
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400 font-normal">Unique</span>
                          )}
                        </TableCell>

                        <TableCell className="text-sm font-medium">{m.supplier || "—"}</TableCell>
                        <TableCell className="font-bold text-sm text-foreground">₹{(m.cost_per_kg || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-gray-600">{m.moq || "—"}</TableCell>
                        <TableCell className="text-xs text-gray-600">{m.shelf_life || "—"}</TableCell>

                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(m)} title="Edit Material">
                            <Edit className="h-4 w-4 text-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} title="Delete Material">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent></Card>
      )}
    </div>
  )
}
