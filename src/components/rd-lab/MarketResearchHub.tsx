import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { 
  Lightbulb, 
  TrendingUp, 
  Target, 
  ShieldAlert, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Check, 
  Loader2, 
  Briefcase, 
  BrainCircuit, 
  DollarSign, 
  PieChart, 
  ExternalLink,
  Flame
} from "lucide-react"

interface MarketResearchItem {
  id: string;
  title: string;
  category: string; // 'competitor_intel', 'market_opportunity', 'consulting_advice', 'strategic_idea'
  source_or_consultant: string;
  description: string;
  competitors_pricing: string;
  key_takeaways: string[];
  action_plan: string;
  estimated_roi: string;
  status: string; // 'under_review', 'approved', 'in_progress', 'implemented', 'archived'
  created_at?: string;
  updated_at?: string;
}

const CATEGORIES = [
  { value: "market_opportunity", label: "Market Opportunity", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "competitor_intel", label: "Competitor Intelligence", color: "bg-red-100 text-red-800 border-red-200" },
  { value: "consulting_advice", label: "Consulting / Advisory", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "strategic_idea", label: "Strategic Idea", color: "bg-amber-100 text-amber-800 border-amber-200" }
]

const STATUSES = [
  { value: "under_review", label: "Under Review", color: "bg-slate-100 text-slate-800" },
  { value: "approved", label: "Approved", color: "bg-indigo-100 text-indigo-800" },
  { value: "in_progress", label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
  { value: "implemented", label: "Implemented", color: "bg-emerald-100 text-emerald-800" },
  { value: "archived", label: "Archived", color: "bg-gray-100 text-gray-800" }
]

const MOCK_ITEMS: MarketResearchItem[] = [
  {
    id: "mock-1",
    title: "High-Active Bio-Organic Fertilizers Market Expansion",
    category: "market_opportunity",
    source_or_consultant: "Director of Agri-Business Growth (Advisory)",
    description: "North Indian potato belt states are seeing a 30% YoY rise in organic product demand. Setting up localized distribution for electroculture kits and bio-sprays has potential high margins.",
    competitors_pricing: "Main competitors (AgriOrganic, GreenSoil) pricing premium kits at ₹2,500/kit. We can position at ₹1,800/kit.",
    key_takeaways: [
      "High concentration of potential organic certified farms in Punjab & Haryana.",
      "Vast market gap in low-cost electroculture copper coils.",
      "Government subsidy schemes can be leveraged for farmer onboarding."
    ],
    action_plan: "Conduct pilot demo camps in 5 central villages in Rohtak.",
    estimated_roi: "35% IRR, Payback in 9 months",
    status: "in_progress"
  },
  {
    id: "mock-2",
    title: "Premium Seasoning Brand: Cravora Launch Evaluation",
    category: "strategic_idea",
    source_or_consultant: "CEO Direct Research",
    description: "Launch secondary premium DTC seasoning label Cravora focusing on urban millennials. High-margin packaging (aluminum cans, glass grinders) and custom gourmet flavors (Mango-Chili, Truffle-Parmesan).",
    competitors_pricing: "Key brands (Keya, Sprig) price at ₹250-₹350 per 80g grinder. Cravora can launch introductory packs at ₹199.",
    key_takeaways: [
      "Direct-to-consumer (DTC) channels are yielding 65% gross margins on gourmet spices.",
      "Quick-commerce partnerships (Blinkit/Zepto) are essential for metro-cities penetration."
    ],
    action_plan: "Finalize brand layout and test 5 core seasoning formulations in R&D Lab.",
    estimated_roi: "Expected 120% YoY growth on DTC channel sales",
    status: "approved"
  },
  {
    id: "mock-3",
    title: "Corporate Restructuring: Supply-Chain Consultant Advice",
    category: "consulting_advice",
    source_or_consultant: "Dr. A. Verma (Senior Business Consultant)",
    description: "Implement raw material bulk agreements for spice powders (Amchur, Turmeric) with direct farm cooperatives. By-passing third-party distributors will drop R&D batch costs by 18-22%.",
    competitors_pricing: "Local distributors adding 15% margins + transportation overheads.",
    key_takeaways: [
      "Procurement contracts must be structured as 6-month futures to hedge price volatility.",
      "Logistics consolidation to one major carrier will lower inbound costs."
    ],
    action_plan: "Draft NDA & MOU templates for cooperative farming clusters in Maharashtra.",
    estimated_roi: "₹4.5 Lakhs annual saving in procurement costs",
    status: "under_review"
  }
]

const emptyForm = (): Partial<MarketResearchItem> => ({
  title: "",
  category: "market_opportunity",
  source_or_consultant: "",
  description: "",
  competitors_pricing: "",
  key_takeaways: [],
  action_plan: "",
  estimated_roi: "",
  status: "under_review"
})

export function MarketResearchHub() {
  const { toast } = useToast()
  const [items, setItems] = useState<MarketResearchItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isMockMode, setIsMockMode] = useState(false)
  
  const [form, setForm] = useState<Partial<MarketResearchItem>>(emptyForm())
  const [takeawayInput, setTakeawayInput] = useState("")
  const [activeSubTab, setActiveSubTab] = useState<string>("all")

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("rd_market_research")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        // Table probably doesn't exist yet, activate mock sandbox mode
        console.warn("rd_market_research table not found, switching to executive sandbox mode.", error)
        setItems(MOCK_ITEMS)
        setIsMockMode(true)
        toast({
          title: "Executive Sandbox Mode Active",
          description: "Database table not found. Showing pre-loaded executive research. Please execute migrations to go live.",
          variant: "default"
        })
      } else {
        setItems(data as MarketResearchItem[] || [])
        setIsMockMode(false)
      }
    } catch (e: any) {
      setItems(MOCK_ITEMS)
      setIsMockMode(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const addTakeaway = () => {
    if (!takeawayInput.trim()) return
    const current = form.key_takeaways || []
    setForm({ ...form, key_takeaways: [...current, takeawayInput.trim()] })
    setTakeawayInput("")
  }

  const removeTakeaway = (idx: number) => {
    const current = form.key_takeaways || []
    setForm({ ...form, key_takeaways: current.filter((_, i) => i !== idx) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title?.trim()) {
      toast({ title: "Title is required", variant: "destructive" })
      return
    }

    try {
      setIsSaving(true)
      const payload = {
        title: form.title,
        category: form.category,
        source_or_consultant: form.source_or_consultant || "",
        description: form.description || "",
        competitors_pricing: form.competitors_pricing || "",
        key_takeaways: form.key_takeaways || [],
        action_plan: form.action_plan || "",
        estimated_roi: form.estimated_roi || "",
        status: form.status || "under_review"
      }

      if (isMockMode) {
        // Handle mock mode updates locally
        if (form.id) {
          setItems(items.map(it => it.id === form.id ? { ...it, ...payload } : it))
          toast({ title: "Sandbox Mode: Item Updated!" })
        } else {
          const newItem: MarketResearchItem = {
            id: `mock-${Date.now()}`,
            ...payload,
            created_at: new Date().toISOString()
          }
          setItems([newItem, ...items])
          toast({ title: "Sandbox Mode: New Research Added!" })
        }
        setIsEditing(false)
      } else {
        // Go live to Supabase
        if (form.id) {
          const { error } = await supabase
            .from("rd_market_research")
            .update(payload)
            .eq("id", form.id)
          if (error) throw error
          toast({ title: "Market research item updated successfully!" })
        } else {
          const { error } = await supabase
            .from("rd_market_research")
            .insert(payload)
          if (error) throw error
          toast({ title: "Market research item added successfully!" })
        }
        setIsEditing(false)
        fetchData()
      }
    } catch (err: any) {
      toast({ title: "Error saving item", description: err.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this research item?")) return

    try {
      if (isMockMode) {
        setItems(items.filter(it => it.id !== id))
        toast({ title: "Sandbox Mode: Item Deleted." })
      } else {
        const { error } = await supabase
          .from("rd_market_research")
          .delete()
          .eq("id", id)
        if (error) throw error
        toast({ title: "Research item deleted." })
        fetchData()
      }
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" })
    }
  }

  const handleEdit = (item: MarketResearchItem) => {
    setForm(item)
    setIsEditing(true)
  }

  const resetForm = () => {
    setForm(emptyForm())
    setIsEditing(false)
    setTakeawayInput("")
  }

  const filteredItems = items.filter(it => {
    if (activeSubTab === "all") return true
    return it.category === activeSubTab
  })

  // KPIs
  const totalItems = items.length
  const opportunitiesCount = items.filter(i => i.category === "market_opportunity").length
  const competitorsCount = items.filter(i => i.category === "competitor_intel").length
  const ideasApproved = items.filter(i => i.category === "strategic_idea" && i.status === "approved").length

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#032E63] text-white p-6 rounded-xl relative overflow-hidden shadow-lg border-b-4 border-[#08A04B]">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-6">
          <Briefcase className="h-64 w-64" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#08A04B] text-xs font-bold uppercase px-2.5 py-1 rounded-full">CEO & MD Workspace</span>
            {isMockMode && (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 border-0">
                <ShieldAlert className="h-3 w-3" /> Sandbox Mode
              </Badge>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Market Research & Business Development Hub</h2>
          <p className="text-blue-100 max-w-2xl text-sm md:text-base">
            Track industry opportunities, monitor competitors pricing, store premium business advisory transcripts, and coordinate strategic innovations.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Research Files</p>
              <h3 className="text-2xl font-black text-[#032E63]">{totalItems}</h3>
            </div>
            <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500"><Briefcase className="h-5 w-5" /></div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Competitors</p>
              <h3 className="text-2xl font-black text-red-600">{competitorsCount}</h3>
            </div>
            <div className="h-10 w-10 bg-red-50 rounded-lg flex items-center justify-center text-red-500"><Target className="h-5 w-5" /></div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Advice Vault</p>
              <h3 className="text-2xl font-black text-purple-700">{items.filter(i => i.category === 'consulting_advice').length}</h3>
            </div>
            <div className="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-500"><BrainCircuit className="h-5 w-5" /></div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Approved Ideas</p>
              <h3 className="text-2xl font-black text-emerald-600">{ideasApproved}</h3>
            </div>
            <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500"><Lightbulb className="h-5 w-5" /></div>
          </CardContent>
        </Card>
      </div>

      {isEditing ? (
        <Card className="border border-indigo-100 shadow-md">
          <CardHeader className="bg-indigo-50/50 pb-4 border-b border-indigo-100/50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-[#032E63] text-lg font-bold flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-indigo-600" />
                {form.id ? "Edit Research / Advisory Note" : "Log Strategic Research & Advisory Item"}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Project / Research Title *</label>
                  <Input 
                    required 
                    value={form.title || ""} 
                    onChange={e => setForm({ ...form, title: e.target.value })} 
                    placeholder="E.g., North Organic Potato Belt Feasibility Study"
                    className="border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Category</label>
                  <Select 
                    value={form.category} 
                    onValueChange={v => setForm({ ...form, category: v })}
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Source / Consultant Name</label>
                  <Input 
                    value={form.source_or_consultant || ""} 
                    onChange={e => setForm({ ...form, source_or_consultant: e.target.value })} 
                    placeholder="E.g., Dr. Rajesh Gupta (Senior Advisor) / CEO Research"
                    className="border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Project Status</label>
                  <Select 
                    value={form.status} 
                    onValueChange={v => setForm({ ...form, status: v })}
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Detailed Description & Context</label>
                <Textarea 
                  value={form.description || ""} 
                  onChange={e => setForm({ ...form, description: e.target.value })} 
                  rows={4} 
                  placeholder="Detail the market analysis, business logic, opportunity parameters..."
                  className="border-gray-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    Estimated ROI / Impact
                  </label>
                  <Input 
                    value={form.estimated_roi || ""} 
                    onChange={e => setForm({ ...form, estimated_roi: e.target.value })} 
                    placeholder="E.g., 25% Increase in margins, ₹3L savings"
                    className="border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Competitors Pricing & Intelligence</label>
                  <Input 
                    value={form.competitors_pricing || ""} 
                    onChange={e => setForm({ ...form, competitors_pricing: e.target.value })} 
                    placeholder="E.g., Competitor X sells at ₹300/kg; Competitor Y at ₹280/kg"
                    className="border-gray-300"
                  />
                </div>
              </div>

              {/* Key Takeaways Array builder */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <h4 className="font-semibold text-sm text-[#032E63]">Key Takeaways & Core Findings</h4>
                <div className="flex gap-2">
                  <Input 
                    value={takeawayInput} 
                    onChange={e => setTakeawayInput(e.target.value)} 
                    placeholder="Add a core bullet point finding..."
                    className="bg-white border-gray-300"
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTakeaway() } }}
                  />
                  <Button type="button" onClick={addTakeaway} className="bg-[#032E63] text-white">Add</Button>
                </div>

                <div className="space-y-2">
                  {(form.key_takeaways || []).map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white px-3 py-1.5 rounded border border-gray-200 text-xs">
                      <span>• {t}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeTakeaway(idx)}>
                        <X className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  {(form.key_takeaways || []).length === 0 && (
                    <p className="text-xs text-gray-400 italic">No takeaways added yet. Use input above.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Immediate Action Plan</label>
                <Textarea 
                  value={form.action_plan || ""} 
                  onChange={e => setForm({ ...form, action_plan: e.target.value })} 
                  rows={2} 
                  placeholder="What is the next step to execute this plan?"
                  className="border-gray-300"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={isSaving} className="bg-[#08A04B] hover:bg-[#069a43] text-white font-semibold">
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  {form.id ? "Update Research" : "Save Research & Advice"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Filters Tab bar */}
          <div className="flex justify-between items-center flex-wrap gap-4 bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setActiveSubTab("all")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  activeSubTab === "all" ? "bg-[#032E63] text-white border-transparent" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                All Insights
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setActiveSubTab(cat.value)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    activeSubTab === cat.value ? "bg-[#032E63] text-white border-transparent" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-[#08A04B] hover:bg-[#069a43] text-white text-xs font-semibold">
              <Plus className="h-3.5 w-3.5 mr-1" /> Log Strategic Insight
            </Button>
          </div>

          {/* Table / Grid content */}
          {filteredItems.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No strategic insights or market research logged in this category.</p>
              <Button variant="outline" size="sm" onClick={() => { resetForm(); setIsEditing(true) }} className="mt-3">
                Create First Item
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredItems.map(item => {
                const categoryColor = CATEGORIES.find(c => c.value === item.category)?.color || "bg-gray-100 text-gray-800"
                const statusInfo = STATUSES.find(s => s.value === item.status)
                const categoryLabel = CATEGORIES.find(c => c.value === item.category)?.label || "Insight"

                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-[#032E63]">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`${categoryColor} border-0 px-2.5 py-0.5 font-bold uppercase text-[10px]`}>
                              {categoryLabel}
                            </Badge>
                            {statusInfo && (
                              <Badge variant="secondary" className={`${statusInfo.color} font-medium text-[10px]`}>
                                {statusInfo.label}
                              </Badge>
                            )}
                            {item.estimated_roi && (
                              <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[10px] flex items-center gap-0.5">
                                <TrendingUp className="h-3 w-3 text-emerald-600" /> ROI: {item.estimated_roi}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-[#032E63] text-lg font-bold hover:text-indigo-900 transition-colors">
                            {item.title}
                          </CardTitle>
                          {item.source_or_consultant && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <BrainCircuit className="h-3.5 w-3.5 text-indigo-500" />
                              <strong>Source / Advisory:</strong> {item.source_or_consultant}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-1.5">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-2 pb-5 space-y-4 text-sm text-gray-700">
                      {item.description && (
                        <p className="text-gray-600 leading-relaxed text-xs md:text-sm bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                          {item.description}
                        </p>
                      )}

                      {item.competitors_pricing && (
                        <div className="flex gap-2 items-start bg-rose-50/20 p-2.5 rounded-lg border border-rose-100 text-xs text-rose-950">
                          <Target className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <strong>Competitor Pricing & Intel:</strong> {item.competitors_pricing}
                          </div>
                        </div>
                      )}

                      {/* Key Takeaways List */}
                      {item.key_takeaways && item.key_takeaways.length > 0 && (
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Key Findings:</h4>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {item.key_takeaways.map((takeaway, idx) => (
                              <li key={idx} className="flex gap-2 items-start bg-slate-50 p-2 rounded text-xs border border-gray-100">
                                <span className="text-[#08A04B] font-extrabold text-sm leading-none">•</span>
                                <span className="text-gray-600">{takeaway}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.action_plan && (
                        <div className="flex gap-2 items-start bg-indigo-50/30 p-3 rounded-lg border border-indigo-100 text-xs">
                          <Flame className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <strong className="text-indigo-900">Execution Plan:</strong> {item.action_plan}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
