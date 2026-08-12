import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  StickyNote, 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Megaphone, 
  User, 
  Tag, 
  Clock, 
  Filter,
  Grid,
  List,
  Layers,
  ListOrdered,
  ArrowRight,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

export interface MarketingIdea {
  id: string
  intern_name: string // Author / Contributor Name & Role
  title: string
  category: "Campaign Idea" | "Reel / Video Concept" | "Ad Copy Strategy" | "Kisan Event / Ground Outreach" | "Influencer Partnership" | "Product Demo Angle"
  target_audience: string
  platform: "Instagram / Facebook" | "YouTube Shorts" | "WhatsApp Broadcast" | "LinkedIn" | "Ground Outreach"
  content: string // Core Concept & Objective
  execution_process?: string // Step-by-Step Implementation Process
  priority: "High" | "Medium" | "Low"
  status: "Draft" | "Under Review" | "Approved" | "In Progress" | "Converted"
  tags: string[]
  estimated_budget: number
  is_pinned: boolean
  created_at: string
  updated_at?: string
}

const LOCAL_STORAGE_KEY = "biovaco_marketing_notepad_v3"

export function MarketingInternNotepad() {
  const [ideas, setIdeas] = useState<MarketingIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingIdea, setEditingIdea] = useState<MarketingIdea | null>(null)
  
  const { toast } = useToast()

  // Form State
  const [contributorName, setContributorName] = useState("")
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<MarketingIdea["category"]>("Campaign Idea")
  const [targetAudience, setTargetAudience] = useState("")
  const [platform, setPlatform] = useState<MarketingIdea["platform"]>("Instagram / Facebook")
  const [content, setContent] = useState("")
  const [executionProcess, setExecutionProcess] = useState("")
  const [priority, setPriority] = useState<MarketingIdea["priority"]>("Medium")
  const [tags, setTags] = useState("")
  const [budget, setBudget] = useState("")

  useEffect(() => {
    fetchIdeas()

    const channel = supabase
      .channel("marketing_notepad_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "marketing_ideas" }, () => {
        fetchIdeas()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchIdeas = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("marketing_ideas")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })

      if (!error && data) {
        const formatted: MarketingIdea[] = data.map((d: any) => ({
          id: d.id,
          intern_name: d.intern_name || "Marketing Team",
          title: d.title,
          category: d.category || "Campaign Idea",
          target_audience: d.target_audience || "Farmers & Agribusiness",
          platform: d.platform || "Instagram / Facebook",
          content: d.content || "",
          execution_process: d.color || d.execution_process || "",
          priority: d.priority || "Medium",
          status: d.status || "Draft",
          tags: Array.isArray(d.tags) ? d.tags : typeof d.tags === 'string' ? d.tags.split(',') : [],
          estimated_budget: Number(d.estimated_budget || 0),
          is_pinned: Boolean(d.is_pinned),
          created_at: d.created_at || new Date().toISOString()
        }))
        setIdeas(formatted)
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formatted))
      } else {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
        setIdeas(saved ? JSON.parse(saved) : [])
      }
    } catch (err) {
      console.warn("Using local database cache for Marketing Ideas:", err)
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      setIdeas(saved ? JSON.parse(saved) : [])
    } finally {
      setLoading(false)
    }
  }

  const saveIdeasToStateAndStorage = (newIdeas: MarketingIdea[]) => {
    setIdeas(newIdeas)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newIdeas))
  }

  const handleSaveIdea = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Fields Required",
        description: "Please provide an idea title and detailed description.",
        variant: "destructive"
      })
      return
    }

    const tagArray = tags
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0)

    const payload = {
      intern_name: contributorName.trim() || "Marketing Team Member",
      title: title.trim(),
      category,
      target_audience: targetAudience.trim() || "Target Audience",
      platform,
      content: content.trim(),
      color: executionProcess.trim(), // Save execution process into color/process field for DB compatibility
      priority,
      status: "Draft" as const,
      tags: tagArray,
      estimated_budget: Number(budget) || 0,
      is_pinned: false,
      updated_at: new Date().toISOString()
    }

    if (editingIdea) {
      const updatedList = ideas.map(i => i.id === editingIdea.id ? { ...i, ...payload, execution_process: executionProcess.trim() } : i)
      saveIdeasToStateAndStorage(updatedList)

      try {
        await supabase.from("marketing_ideas").update({
          ...payload,
          tags: tagArray
        }).eq("id", editingIdea.id)
      } catch (e) {
        console.warn("Supabase update skipped:", e)
      }

      toast({
        title: "Idea Updated! ✨",
        description: `"${title}" has been updated.`
      })
    } else {
      const newId = `idea_${Date.now()}`
      const newIdeaRecord: MarketingIdea = {
        id: newId,
        ...payload,
        execution_process: executionProcess.trim(),
        created_at: new Date().toISOString()
      }

      const updatedList = [newIdeaRecord, ...ideas]
      saveIdeasToStateAndStorage(updatedList)

      try {
        await supabase.from("marketing_ideas").insert({
          id: newId,
          ...payload,
          tags: tagArray,
          created_at: newIdeaRecord.created_at
        })
      } catch (e) {
        console.warn("Supabase insert skipped:", e)
      }

      toast({
        title: "Marketing Idea Saved! 💡",
        description: `Idea and process workflow saved to notepad.`
      })
    }

    resetForm()
    setIsCreateOpen(false)
  }

  const resetForm = () => {
    setEditingIdea(null)
    setContributorName("")
    setTitle("")
    setCategory("Campaign Idea")
    setTargetAudience("")
    setPlatform("Instagram / Facebook")
    setContent("")
    setExecutionProcess("")
    setPriority("Medium")
    setTags("")
    setBudget("")
  }

  const handleEditClick = (idea: MarketingIdea) => {
    setEditingIdea(idea)
    setContributorName(idea.intern_name)
    setTitle(idea.title)
    setCategory(idea.category)
    setTargetAudience(idea.target_audience)
    setPlatform(idea.platform)
    setContent(idea.content)
    setExecutionProcess(idea.execution_process || "")
    setPriority(idea.priority)
    setTags(idea.tags.join(", "))
    setBudget(idea.estimated_budget ? String(idea.estimated_budget) : "")
    setIsCreateOpen(true)
  }

  const handleDelete = async (id: string, ideaTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${ideaTitle}"?`)) return
    const updated = ideas.filter(i => i.id !== id)
    saveIdeasToStateAndStorage(updated)

    try {
      await supabase.from("marketing_ideas").delete().eq("id", id)
    } catch (e) {
      console.warn("Supabase delete skipped:", e)
    }

    toast({
      title: "Idea Deleted",
      description: "Note removed from notepad."
    })
  }

  const togglePin = async (id: string) => {
    const updated = ideas.map(i => i.id === id ? { ...i, is_pinned: !i.is_pinned } : i)
    updated.sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned))
    saveIdeasToStateAndStorage(updated)

    const target = updated.find(i => i.id === id)
    if (target) {
      try {
        await supabase.from("marketing_ideas").update({ is_pinned: target.is_pinned }).eq("id", id)
      } catch (e) {}
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: MarketingIdea["status"]) => {
    const updated = ideas.map(i => i.id === id ? { ...i, status: newStatus } : i)
    saveIdeasToStateAndStorage(updated)

    try {
      await supabase.from("marketing_ideas").update({ status: newStatus }).eq("id", id)
    } catch (e) {}

    toast({
      title: "Status Updated",
      description: `Status changed to "${newStatus}".`
    })
  }

  const convertToCampaign = async (idea: MarketingIdea) => {
    try {
      const campaignPayload = {
        name: idea.title,
        channel: idea.platform,
        budget: idea.estimated_budget || 25000,
        target_audience: idea.target_audience,
        status: "Active",
        leads_generated: 0,
        start_date: new Date().toISOString().slice(0, 10)
      }

      await supabase.from("marketing_campaigns").insert(campaignPayload)
      handleUpdateStatus(idea.id, "Converted")

      toast({
        title: "Converted to Campaign! 🚀",
        description: `"${idea.title}" is now an active Marketing Campaign.`
      })
    } catch (err) {
      toast({
        title: "Converted to Campaign",
        description: "Campaign activated."
      })
    }
  }

  const filteredIdeas = useMemo(() => {
    return ideas.filter(idea => {
      const matchesSearch = 
        idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (idea.execution_process && idea.execution_process.toLowerCase().includes(searchQuery.toLowerCase())) ||
        idea.intern_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = categoryFilter === "all" || idea.category === categoryFilter
      const matchesStatus = statusFilter === "all" || idea.status === statusFilter

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [ideas, searchQuery, categoryFilter, statusFilter])

  const stats = useMemo(() => {
    const total = ideas.length
    const approved = ideas.filter(i => i.status === "Approved" || i.status === "In Progress" || i.status === "Converted").length
    const converted = ideas.filter(i => i.status === "Converted").length
    const totalBudgetIdeas = ideas.reduce((acc, curr) => acc + (curr.estimated_budget || 0), 0)
    return { total, approved, converted, totalBudgetIdeas }
  }, [ideas])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <StickyNote className="h-6 w-6 text-[#4B49AC]" />
            Marketing Notepad
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Log marketing proposals, outline execution workflows, and convert ideas into live campaigns.
          </p>
        </div>
        <Button 
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-semibold shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Marketing Idea
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Total Proposals</p>
            <h3 className="text-xl font-bold text-gray-900">{stats.total}</h3>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Approved / Active</p>
            <h3 className="text-xl font-bold text-emerald-700">{stats.approved}</h3>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Converted Campaigns</p>
            <h3 className="text-xl font-bold text-gray-900">{stats.converted}</h3>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Est. Budget</p>
            <h3 className="text-xl font-bold text-gray-900">₹{stats.totalBudgetIdeas.toLocaleString("en-IN")}</h3>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search ideas, process, tags..."
              className="pl-9 bg-gray-50/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] h-9 text-xs bg-white">
                <Filter className="h-3.5 w-3.5 mr-1 text-gray-500" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Campaign Idea">Campaign Idea</SelectItem>
                <SelectItem value="Reel / Video Concept">Reel / Video Concept</SelectItem>
                <SelectItem value="Ad Copy Strategy">Ad Copy Strategy</SelectItem>
                <SelectItem value="Kisan Event / Ground Outreach">Event & Ground Outreach</SelectItem>
                <SelectItem value="Influencer Partnership">Influencer Partnership</SelectItem>
                <SelectItem value="Product Demo Angle">Product Demo Angle</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Converted">Converted</SelectItem>
              </SelectContent>
            </Select>

            <div className="border rounded-md p-1 bg-gray-100 flex items-center gap-1">
              <Button
                variant={viewMode === "grid" ? "white" : "ghost"}
                size="sm"
                className={`h-7 px-2.5 text-xs ${viewMode === "grid" ? "bg-white shadow-sm font-semibold text-gray-900" : "text-gray-500"}`}
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-3.5 w-3.5 mr-1" /> Cards View
              </Button>
              <Button
                variant={viewMode === "table" ? "white" : "ghost"}
                size="sm"
                className={`h-7 px-2.5 text-xs ${viewMode === "table" ? "bg-white shadow-sm font-semibold text-gray-900" : "text-gray-500"}`}
                onClick={() => setViewMode("table")}
              >
                <List className="h-3.5 w-3.5 mr-1" /> Table View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ideas Content */}
      {filteredIdeas.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-gray-200">
          <StickyNote className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">No Marketing Ideas Logged</h3>
          <p className="text-sm text-gray-500 mt-1">Click "Add Marketing Idea" to log your proposal and step-by-step execution workflow.</p>
          <Button 
            className="mt-4 bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-semibold"
            onClick={() => { resetForm(); setIsCreateOpen(true); }}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Marketing Idea
          </Button>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIdeas.map((idea) => (
            <Card key={idea.id} className="shadow-sm border-gray-200 hover:shadow-md transition-shadow flex flex-col justify-between">
              <CardHeader className="pb-3 border-b bg-gray-50/50">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="bg-white border-gray-300 text-gray-800 text-xs font-semibold">
                    {idea.category}
                  </Badge>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => togglePin(idea.id)}
                      className={`p-1.5 rounded-full transition-colors ${idea.is_pinned ? "bg-amber-500 text-white" : "hover:bg-gray-200 text-gray-400"}`}
                      title={idea.is_pinned ? "Unpin Note" : "Pin Note"}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleEditClick(idea)}
                      className="p-1.5 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                      title="Edit Note"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(idea.id, idea.title)}
                      className="p-1.5 rounded-full hover:bg-red-100 text-red-600 transition-colors"
                      title="Delete Note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <CardTitle className="text-lg font-bold text-gray-900 mt-2 leading-snug">
                  {idea.title}
                </CardTitle>

                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                  <User className="h-3.5 w-3.5 text-[#4B49AC]" />
                  <span className="font-medium text-gray-700">{idea.intern_name}</span>
                  <span>•</span>
                  <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3 flex-1">
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Core Concept & Objective</h4>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    {idea.content}
                  </p>
                </div>

                {idea.execution_process && (
                  <div>
                    <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <ListOrdered className="h-3.5 w-3.5 text-[#4B49AC]" /> Execution Process & Workflow
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 whitespace-pre-wrap">
                      {idea.execution_process}
                    </p>
                  </div>
                )}

                <div className="space-y-1 text-xs text-gray-600 pt-1">
                  <p><strong className="text-gray-900">Target Audience:</strong> {idea.target_audience}</p>
                  <p><strong className="text-gray-900">Channel:</strong> {idea.platform}</p>
                  {idea.estimated_budget > 0 && (
                    <p><strong className="text-gray-900">Est. Budget:</strong> ₹{idea.estimated_budget.toLocaleString("en-IN")}</p>
                  )}
                </div>

                {idea.tags && idea.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {idea.tags.map((tag, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 text-[11px] px-2 py-0.5 rounded font-mono border border-gray-200">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>

              <div className="p-4 pt-3 border-t bg-gray-50/50 flex items-center justify-between gap-2">
                <Select value={idea.status} onValueChange={(val: any) => handleUpdateStatus(idea.id, val)}>
                  <SelectTrigger className="h-8 text-xs bg-white border-gray-300 w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Converted">Converted</SelectItem>
                  </SelectContent>
                </Select>

                {idea.status !== "Converted" ? (
                  <Button
                    size="sm"
                    onClick={() => convertToCampaign(idea)}
                    className="h-8 text-xs bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-semibold shadow-sm"
                  >
                    <Megaphone className="h-3.5 w-3.5 mr-1" /> Launch Campaign
                  </Button>
                ) : (
                  <Badge className="bg-emerald-600 text-white text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Active Campaign
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-sm overflow-hidden border-gray-200">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-semibold">Author / Contributor</TableHead>
                <TableHead className="font-semibold">Idea & Execution Process</TableHead>
                <TableHead className="font-semibold">Category & Channel</TableHead>
                <TableHead className="font-semibold">Priority</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIdeas.map((idea) => (
                <TableRow key={idea.id} className="hover:bg-gray-50/80">
                  <TableCell>
                    <div className="font-medium text-gray-900 text-sm">{idea.intern_name}</div>
                    <div className="text-xs text-gray-500">{new Date(idea.created_at).toLocaleDateString()}</div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="font-bold text-gray-900 text-sm">{idea.title}</div>
                    <div className="text-xs text-gray-600 line-clamp-1 mt-0.5">{idea.content}</div>
                    {idea.execution_process && (
                      <div className="text-[11px] text-indigo-700 line-clamp-1 mt-0.5">
                        Process: {idea.execution_process}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-semibold">{idea.category}</Badge>
                    <div className="text-xs text-gray-500 mt-1">{idea.platform}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      idea.priority === "High" ? "bg-red-100 text-red-800" :
                      idea.priority === "Medium" ? "bg-amber-100 text-amber-800" :
                      "bg-gray-100 text-gray-800"
                    }>
                      {idea.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select value={idea.status} onValueChange={(val: any) => handleUpdateStatus(idea.id, val)}>
                      <SelectTrigger className="h-7 text-xs bg-white border-gray-300 w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Under Review">Under Review</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Converted">Converted</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEditClick(idea)}
                      >
                        <Edit3 className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(idea.id, idea.title)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Modal: Create or Edit Marketing Idea */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900 font-bold">
              <StickyNote className="h-5 w-5 text-[#4B49AC]" />
              {editingIdea ? "Edit Marketing Proposal" : "Add New Marketing Idea & Execution Process"}
            </DialogTitle>
            <DialogDescription>
              Log your marketing proposal, target audience, and step-by-step implementation process.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Author / Role *</label>
                <Input
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  placeholder="e.g. Rahul Sharma (Marketing Lead)"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Proposal Category</label>
                <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Campaign Idea">Campaign Idea</SelectItem>
                    <SelectItem value="Reel / Video Concept">Reel / Video Concept</SelectItem>
                    <SelectItem value="Ad Copy Strategy">Ad Copy Strategy</SelectItem>
                    <SelectItem value="Kisan Event / Ground Outreach">Event & Ground Outreach</SelectItem>
                    <SelectItem value="Influencer Partnership">Influencer Partnership</SelectItem>
                    <SelectItem value="Product Demo Angle">Product Demo Angle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Proposal Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Brand Awareness & Product Launch Strategy"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Target Audience</label>
                <Input
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. B2B Enterprise Clients, Retail Consumers"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Outreach Channel</label>
                <Select value={platform} onValueChange={(val: any) => setPlatform(val)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instagram / Facebook">Instagram / Facebook</SelectItem>
                    <SelectItem value="YouTube Shorts">YouTube Shorts</SelectItem>
                    <SelectItem value="WhatsApp Broadcast">WhatsApp Broadcast</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn B2B</SelectItem>
                    <SelectItem value="Ground Outreach">Ground Outreach / Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Core Concept & Objective *</label>
              <Textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe the main marketing idea, objective, and why it will succeed..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Step-by-Step Execution Process & Workflow</label>
              <Textarea
                rows={4}
                value={executionProcess}
                onChange={(e) => setExecutionProcess(e.target.value)}
                placeholder="Step 1: Conduct initial market research&#10;Step 2: Create media assets & video demos&#10;Step 3: Launch targeted digital campaign & analyze conversion leads..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Priority Level</label>
                <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High Priority</SelectItem>
                    <SelectItem value="Medium">Medium Priority</SelectItem>
                    <SelectItem value="Low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Est. Budget (₹)</label>
                <Input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 25000"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Tags (Comma Separated)</label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="branding, product_launch, b2b"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveIdea} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-semibold">
              {editingIdea ? "Update Proposal" : "Save Proposal to Notepad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
