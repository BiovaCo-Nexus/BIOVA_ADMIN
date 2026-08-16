import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShieldCheck, Plus, Loader2, CheckCircle, XCircle, Clock, AlertTriangle, Search, Filter, IndianRupee, ArrowUpRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface OpsApproval {
  id: string; request_type: string; title: string; description: string | null
  requested_by: string; approver: string; amount: number | null
  status: string; comments: string | null; entity_type: string | null
  entity_id: string | null; submitted_at: string; resolved_at: string | null
  created_at: string
}

const TYPE_OPTIONS = ["Leave", "Expense", "Purchase", "Project", "Document", "General"]
const STATUS_OPTIONS = ["Pending", "Approved", "Rejected", "Escalated"]

const typeColor: Record<string, string> = {
  "Leave": "bg-cyan-100 text-cyan-700", "Expense": "bg-orange-100 text-orange-700",
  "Purchase": "bg-blue-100 text-blue-700", "Project": "bg-purple-100 text-purple-700",
  "Document": "bg-green-100 text-green-700", "General": "bg-gray-100 text-gray-600",
}

const statusColor: Record<string, string> = {
  "Pending": "bg-amber-100 text-amber-700 border-amber-200",
  "Approved": "bg-green-100 text-green-700 border-green-200",
  "Rejected": "bg-red-100 text-red-700 border-red-200",
  "Escalated": "bg-orange-100 text-orange-700 border-orange-200",
}

const statusIcon: Record<string, any> = {
  "Pending": Clock, "Approved": CheckCircle, "Rejected": XCircle, "Escalated": ArrowUpRight,
}

export function ApprovalsManagement() {
  const [approvals, setApprovals] = useState<OpsApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isActionOpen, setIsActionOpen] = useState(false)
  const [actionApproval, setActionApproval] = useState<OpsApproval | null>(null)
  const [actionType, setActionType] = useState<"Approved" | "Rejected" | "Escalated">("Approved")
  const [actionComment, setActionComment] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const { toast } = useToast()

  const [form, setForm] = useState({
    request_type: "General", title: "", description: "", requested_by: "",
    approver: "", amount: ""
  })

  const resetForm = () => setForm({
    request_type: "General", title: "", description: "", requested_by: "",
    approver: "", amount: ""
  })

  const fetchApprovals = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from("ops_approvals" as any).select("*").order("submitted_at", { ascending: false })
      if (data) setApprovals(data as any[])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchApprovals()
    const channel = supabase.channel("ops-approvals-realtime")
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "ops_approvals" }, () => fetchApprovals())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleCreate = async () => {
    if (!form.title || !form.requested_by || !form.approver) {
      toast({ title: "Validation Error", description: "Title, requester, and approver are required.", variant: "destructive" })
      return
    }
    const { error } = await supabase.from("ops_approvals" as any).insert({
      request_type: form.request_type, title: form.title,
      description: form.description || null, requested_by: form.requested_by,
      approver: form.approver, amount: form.amount ? Number(form.amount) : null,
      status: "Pending", submitted_at: new Date().toISOString()
    } as any)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: "Created", description: `Approval request "${form.title}" submitted.` })
    await supabase.from("ops_activity_log" as any).insert({ actor: form.requested_by, action: "Submitted Approval Request", entity_type: "approval", entity_name: form.title } as any)
    setIsModalOpen(false); resetForm(); fetchApprovals()
  }

  const handleAction = async () => {
    if (!actionApproval) return
    const { error } = await supabase.from("ops_approvals" as any).update({
      status: actionType, comments: actionComment || null,
      resolved_at: new Date().toISOString(), updated_at: new Date().toISOString()
    } as any).eq("id", actionApproval.id)
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return }
    toast({ title: actionType, description: `Request "${actionApproval.title}" ${actionType.toLowerCase()}.` })
    await supabase.from("ops_activity_log" as any).insert({ actor: "portal", action: `${actionType} Approval`, entity_type: "approval", entity_name: actionApproval.title, metadata: { comment: actionComment } } as any)
    setIsActionOpen(false); setActionComment(""); setActionApproval(null); fetchApprovals()
  }

  const handleDelete = async (a: OpsApproval) => {
    await supabase.from("ops_approvals" as any).delete().eq("id", a.id)
    toast({ title: "Deleted", description: `Request "${a.title}" deleted.` })
    fetchApprovals()
  }

  const openAction = (a: OpsApproval, type: "Approved" | "Rejected" | "Escalated") => {
    setActionApproval(a); setActionType(type); setActionComment(""); setIsActionOpen(true)
  }

  const filtered = useMemo(() => {
    return approvals.filter(a => {
      const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.requested_by.toLowerCase().includes(searchQuery.toLowerCase())
      const matchType = filterType === "all" || a.request_type === filterType
      const matchStatus = filterStatus === "all" || a.status === filterStatus
      return matchSearch && matchType && matchStatus
    })
  }, [approvals, searchQuery, filterType, filterStatus])

  const pendingCount = approvals.filter(a => a.status === "Pending").length
  const approvedCount = approvals.filter(a => a.status === "Approved").length
  const rejectedCount = approvals.filter(a => a.status === "Rejected").length
  const totalAmount = approvals.filter(a => a.status === "Pending" && a.amount).reduce((s, a) => s + (a.amount || 0), 0)

  const kpis = [
    { label: "Total Requests", value: approvals.length, icon: ShieldCheck, color: "#4B49AC" },
    { label: "Pending", value: pendingCount, icon: Clock, color: "#f59e0b" },
    { label: "Approved", value: approvedCount, icon: CheckCircle, color: "#22c55e" },
    { label: "Pending Amount", value: `₹${(totalAmount / 1000).toFixed(0)}K`, icon: IndianRupee, color: "#7DA0FA" },
  ]

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) }
    catch { return d }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#4B49AC]/10 rounded-xl flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-[#4B49AC]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Approvals</h2>
            <p className="text-sm text-gray-500">Review and manage approval requests across the organization</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true) }} className="bg-[#4B49AC] hover:bg-[#3b3a88]">
          <Plus className="h-4 w-4 mr-2" /> New Request
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="border-gray-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: `${k.color}15` }}>
                <k.icon className="h-5 w-5" style={{ color: k.color }} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{k.label}</p>
                <p className="text-xl font-bold text-gray-900">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search approvals..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {TYPE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Approver</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#4B49AC]" /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-gray-500">No approval requests found.</TableCell></TableRow>
                ) : filtered.map(a => {
                  const StatusIcon = statusIcon[a.status] || Clock
                  return (
                    <TableRow key={a.id} className="hover:bg-gray-50/50">
                      <TableCell><Badge className={`text-xs ${typeColor[a.request_type] || ""}`}>{a.request_type}</Badge></TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{a.title}</p>
                          {a.description && <p className="text-xs text-gray-400 truncate max-w-[250px]">{a.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{a.requested_by}</TableCell>
                      <TableCell className="text-sm text-gray-600">{a.approver}</TableCell>
                      <TableCell className="text-sm text-gray-700 font-medium">{a.amount ? `₹${Number(a.amount).toLocaleString("en-IN")}` : "—"}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs border ${statusColor[a.status] || ""}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(a.submitted_at)}</TableCell>
                      <TableCell className="text-right">
                        {a.status === "Pending" ? (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" onClick={() => openAction(a, "Approved")} className="h-7 text-xs bg-green-600 hover:bg-green-700">Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => openAction(a, "Rejected")} className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50">Reject</Button>
                            <Button size="sm" variant="ghost" onClick={() => openAction(a, "Escalated")} className="h-7 text-xs text-orange-500 hover:bg-orange-50">Escalate</Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            {a.comments && (
                              <span className="text-xs text-gray-400 italic max-w-[120px] truncate">"{a.comments}"</span>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(a)} className="h-7 w-7 p-0 text-gray-300 hover:text-red-500">×</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "Approved" ? "✅ Approve" : actionType === "Rejected" ? "❌ Reject" : "⬆️ Escalate"} — {actionApproval?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Comment (optional)</label>
            <Textarea value={actionComment} onChange={e => setActionComment(e.target.value)} rows={3} placeholder="Add a comment or reason..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionOpen(false)}>Cancel</Button>
            <Button onClick={handleAction} className={
              actionType === "Approved" ? "bg-green-600 hover:bg-green-700" :
              actionType === "Rejected" ? "bg-red-600 hover:bg-red-700" :
              "bg-orange-500 hover:bg-orange-600"
            }>{actionType === "Approved" ? "Approve" : actionType === "Rejected" ? "Reject" : "Escalate"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Request Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Approval Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Request Type</label>
              <Select value={form.request_type} onValueChange={v => setForm({ ...form, request_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Lab Equipment Purchase" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Requested By *</label>
              <Input value={form.requested_by} onChange={e => setForm({ ...form, requested_by: e.target.value })} placeholder="email@biovaco.in" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Approver *</label>
              <Input value={form.approver} onChange={e => setForm({ ...form, approver: e.target.value })} placeholder="ceo@biovaco.in" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Amount (₹)</label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="Optional" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Details about this request..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} className="bg-[#4B49AC] hover:bg-[#3b3a88]">Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
