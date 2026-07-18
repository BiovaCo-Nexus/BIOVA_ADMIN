import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { 
 FolderOpen, 
 Link2, 
 UserCheck, 
 Phone, 
 Plus, 
 Search, 
 FileText, 
 ExternalLink, 
 Copy, 
 Edit, 
 Trash2, 
 Loader2, 
 Info,
 Check,
 User
} from "lucide-react"
import { triggerPushNotification } from "@/utils/pushNotifications"

type FileType = "drive_link" | "investor_doc" | "contact_sheet" | "specification" | "sop" | "other"

interface SharedFile {
 id: string
 title: string
 file_type: FileType
 url: string
 investor_name?: string
 contact_number?: string
 notes?: string
 uploaded_by: string
 created_by?: string
 assigned_to?: string
 created_at: string
 updated_at: string
}

const FILE_TYPES: { value: FileType; label: string; icon: any; color: string }[] = [
 { value: "drive_link", label: "Google Drive Link", icon: Link2, color: "bg-primary text-primary-foreground text-foreground border-border" },
 { value: "investor_doc", label: "Investor Document", icon: UserCheck, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
 { value: "contact_sheet", label: "Contact Sheet", icon: Phone, color: "bg-secondary text-foreground border-border" },
 { value: "specification", label: "Specification Sheet", icon: FileText, color: "bg-secondary text-foreground border-border" },
 { value: "sop", label: "SOP / Manual", icon: FileText, color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
 { value: "other", label: "Other Document", icon: FolderOpen, color: "bg-gray-100 text-gray-800 border-gray-200" },
]

export function SharedFilesManager() {
 const { toast } = useToast()
 const [files, setFiles] = useState<SharedFile[]>([])
 const [isLoading, setIsLoading] = useState(true)
 const [isSaving, setIsSaving] = useState(false)
 const [userEmail, setUserEmail] = useState<string>("")
 const [isSandboxMode, setIsSandboxMode] = useState(false)

 // Form states
 const [isEditing, setIsEditing] = useState(false)
 const [editId, setEditId] = useState<string | null>(null)
 const [title, setTitle] = useState("")
 const [fileType, setFileType] = useState<FileType>("drive_link")
 const [url, setUrl] = useState("")
 const [investorName, setInvestorName] = useState("")
 const [contactNumber, setContactNumber] = useState("")
 const [notes, setNotes] = useState("")
 const [assignedTo, setAssignedTo] = useState("")

 // Search & Filter
 const [searchQuery, setSearchQuery] = useState("")
 const [filterType, setFilterType] = useState<string>("all")

 // Interns list for email broadcast and assignment
 const [interns, setInterns] = useState<{ name: string; email: string }[]>([])

 useEffect(() => {
 // Get logged in user email
 supabase.auth.getSession().then(({ data }) => {
 if (data.session?.user?.email) {
 setUserEmail(data.session.user.email)
 }
 })

 // Fetch active interns for mailing list & assignments
 supabase
 .from("interns")
 .select("name, email")
 .eq("status", "Active")
 .then(({ data }) => {
 if (data) setInterns(data)
 })

 fetchFiles()
 }, [])

 const isExecutive = userEmail === "ceo@biovaco.in" || userEmail === "md@biovaco.in"

 const fetchFiles = async () => {
 try {
 setIsLoading(true)
 const { data, error } = await supabase
 .from("shared_files")
 .select("*")
 .order("created_at", { ascending: false })

 if (error) {
 // If table doesn't exist or migration failed, fallback to sandbox localStorage
 console.warn("DB table not found, falling back to LocalStorage Sandbox Mode.")
 setIsSandboxMode(true)
 const localData = localStorage.getItem("sandbox_shared_files")
 if (localData) {
 setFiles(JSON.parse(localData))
 } else {
 setFiles([])
 }
 } else {
 setFiles(data || [])
 setIsSandboxMode(false)
 }
 } catch (err) {
 console.error(err)
 setIsSandboxMode(true)
 } finally {
 setIsLoading(false)
 }
 }

 // Trigger Brevo email notification to all users
 const sendUpdateNotification = async (updatedFile: SharedFile, isNew: boolean) => {
 const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY
 if (!BREVO_API_KEY) {
 console.warn("Brevo API key not found in environment.")
 return
 }

 // Build recipient list: CEO, MD, FoodTech, and all Active Interns
 const coreEmails = [
 { name: "CEO", email: "ceo@biovaco.in" },
 { name: "MD", email: "md@biovaco.in" },
 { name: "Food Tech R&D", email: "food@biovaco.in" }
 ]

 const internEmails = interns.map(i => ({ name: i.name, email: i.email }))
 
 // Combine and remove duplicate emails
 const allRecipientsMap = new Map<string, string>()
 coreEmails.forEach(c => allRecipientsMap.set(c.email.toLowerCase(), c.name))
 internEmails.forEach(i => allRecipientsMap.set(i.email.toLowerCase(), i.name))
 
 // Filter recipients list by who is actually assigned/has permission
 const recipientsList = Array.from(allRecipientsMap.entries())
 .map(([email, name]) => ({ email, name }))
 .filter(recipient => {
 // CEO/MD always get email, otherwise only get email if assigned or created
 const emailLower = recipient.email.toLowerCase()
 const isCoreExec = emailLower === "ceo@biovaco.in" || emailLower === "md@biovaco.in"
 const isAssigned = (updatedFile.assigned_to || '').toLowerCase().includes(emailLower)
 const isCreator = (updatedFile.created_by || '').toLowerCase() === emailLower
 
 return isCoreExec || isAssigned || isCreator
 })

 const senderName = userEmail.split("@")[0]
 const actionText = isNew ? "added a new resource to" : "updated a resource in"

 const emailHtml = `
 <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; max-width: 600px; border: 1px solid #e2e8f0; border-top: 5px solid #18181b; border-radius: 8px; background-color: #ffffff;">
 <h2 style="color: #18181b; margin-top: 0;">BiovaCo Nexus — File Portal Update</h2>
 <p style="font-size: 15px; color: #334155;">Hello Team,</p>
 <p style="font-size: 15px; color: #334155; line-height: 1.5;">
 <strong>${senderName} (${userEmail})</strong> has ${actionText} the Shared Files & Document Management Portal.
 </p>
 
 <div style="margin: 20px 0; padding: 15px; background-color: #fafafa; border-left: 4px solid #71717a; border-radius: 4px;">
 <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 16px;">${updatedFile.title}</h3>
 <p style="margin: 4px 0; font-size: 13px; color: #64748b;"><strong>Type:</strong> ${updatedFile.file_type.replace('_', ' ').toUpperCase()}</p>
 ${updatedFile.investor_name ? `<p style="margin: 4px 0; font-size: 13px; color: #64748b;"><strong>Investor:</strong> ${updatedFile.investor_name}</p>` : ''}
 ${updatedFile.contact_number ? `<p style="margin: 4px 0; font-size: 13px; color: #64748b;"><strong>Contact Number:</strong> ${updatedFile.contact_number}</p>` : ''}
 ${updatedFile.notes ? `<p style="margin: 4px 0; font-size: 13px; color: #64748b;"><strong>Notes:</strong> ${updatedFile.notes}</p>` : ''}
 </div>
 
 ${updatedFile.url ? `
 <div style="text-align: center; margin-top: 25px; margin-bottom: 10px;">
 <a href="${updatedFile.url}" target="_blank" style="display: inline-block; padding: 10px 20px; font-weight: bold; font-size: 14px; text-decoration: none; color: #ffffff; background-color: #18181b; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
 Open Document / Link
 </a>
 </div>
 ` : ''}
 
 <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px; margin-bottom: 15px;" />
 <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
 This is an automated notification from BiovaCo Nexus Portal. Please do not reply directly to this email.
 </p>
 </div>
 `

 // Broadcast email to all allowed recipients
 try {
 await fetch("https://api.brevo.com/v3/smtp/email", {
 method: "POST",
 headers: {
 "accept": "application/json",
 "content-type": "application/json",
 "api-key": BREVO_API_KEY
 },
 body: JSON.stringify({
 sender: { name: "BiovaCo Nexus Portal", email: "no-reply@biovaco.in" },
 to: recipientsList,
 subject: `[BiovaCo Portal Update] ${senderName} updated files`,
 htmlContent: emailHtml
 })
 })
 console.log(`Notification broadcasted to ${recipientsList.length} users.`)
 } catch (err) {
 console.error("Failed to send Brevo broadcast email:", err)
 }

 // Trigger Chrome Mobile & Desktop Push notifications for authorized users
 try {
 const pushEmails = recipientsList.map(r => r.email)
 await triggerPushNotification(
 isNew ? "📁 New File Uploaded" : "📝 File Updated",
 `"${updatedFile.title}" (${updatedFile.file_type.replace('_', ' ').toUpperCase()}) by ${senderName}.`,
 pushEmails,
 "/admin"
 )
 } catch (err) {
 console.error("Push notification dispatch failed:", err)
 }
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!title.trim()) {
 toast({ title: "Title is required", variant: "destructive" })
 return
 }

 setIsSaving(true)

 const payload = {
 title,
 file_type: fileType,
 url: url || "",
 investor_name: fileType === "investor_doc" ? investorName : "",
 contact_number: (fileType === "contact_sheet" || fileType === "investor_doc") ? contactNumber : "",
 notes,
 uploaded_by: userEmail || "Anonymous",
 created_by: userEmail,
 assigned_to: isExecutive ? (assignedTo || userEmail) : userEmail,
 updated_at: new Date().toISOString()
 }

 try {
 if (isSandboxMode) {
 // LocalStorage logic
 let updatedList: SharedFile[] = []
 if (editId) {
 updatedList = files.map(f => {
 if (f.id === editId) {
 const updatedFile = { ...f, ...payload }
 sendUpdateNotification(updatedFile, false)
 return updatedFile
 }
 return f
 })
 toast({ title: "Document updated successfully (Sandbox Mode)" })
 } else {
 const newFile: SharedFile = {
 id: crypto.randomUUID(),
 ...payload,
 created_at: new Date().toISOString()
 }
 updatedList = [newFile, ...files]
 sendUpdateNotification(newFile, true)
 toast({ title: "Document added successfully (Sandbox Mode)" })
 }
 localStorage.setItem("sandbox_shared_files", JSON.stringify(updatedList))
 setFiles(updatedList)
 resetForm()
 } else {
 // Supabase logic
 if (editId) {
 const { data, error } = await supabase
 .from("shared_files")
 .update(payload)
 .eq("id", editId)
 .select()

 if (error) throw error
 if (data && data[0]) {
 sendUpdateNotification(data[0] as SharedFile, false)
 }
 toast({ title: "Document updated successfully" })
 } else {
 const { data, error } = await supabase
 .from("shared_files")
 .insert([{ ...payload, created_at: new Date().toISOString() }])
 .select()

 if (error) throw error
 if (data && data[0]) {
 sendUpdateNotification(data[0] as SharedFile, true)
 }
 toast({ title: "Document added successfully" })
 }
 fetchFiles()
 resetForm()
 }
 } catch (err: any) {
 toast({
 title: "Error saving document",
 description: err.message,
 variant: "destructive"
 })
 } finally {
 setIsSaving(false)
 }
 }

 const handleDelete = async (id: string) => {
 if (!window.confirm("Are you sure you want to delete this resource?")) return

 try {
 if (isSandboxMode) {
 const updatedList = files.filter(f => f.id !== id)
 localStorage.setItem("sandbox_shared_files", JSON.stringify(updatedList))
 setFiles(updatedList)
 toast({ title: "Resource deleted (Sandbox Mode)" })
 } else {
 const { error } = await supabase
 .from("shared_files")
 .delete()
 .eq("id", id)

 if (error) throw error
 toast({ title: "Resource deleted successfully" })
 fetchFiles()
 }
 } catch (err: any) {
 toast({
 title: "Delete failed",
 description: err.message,
 variant: "destructive"
 })
 }
 }

 const handleEdit = (file: SharedFile) => {
 setEditId(file.id)
 setTitle(file.title)
 setFileType(file.file_type)
 setUrl(file.url)
 setInvestorName(file.investor_name || "")
 setContactNumber(file.contact_number || "")
 setNotes(file.notes || "")
 setAssignedTo(file.assigned_to || "")
 setIsEditing(true)
 }

 const resetForm = () => {
 setEditId(null)
 setTitle("")
 setFileType("drive_link")
 setUrl("")
 setInvestorName("")
 setContactNumber("")
 setNotes("")
 setAssignedTo("")
 setIsEditing(false)
 }

 const copyToClipboard = (link: string) => {
 navigator.clipboard.writeText(link)
 toast({ title: "Copied to clipboard!", description: link })
 }

 const filteredFiles = useMemo(() => {
 return files.filter(file => {
 // SECURITY: Admins (CEO/MD) can see all. Other users see what they created or what is explicitly assigned to them.
 const isUserExecutive = userEmail === "ceo@biovaco.in" || userEmail === "md@biovaco.in"
 
 const hasAccess = 
 isUserExecutive || 
 (file.created_by === userEmail) || 
 (file.uploaded_by === userEmail) || 
 (file.assigned_to || '').includes(userEmail)

 if (!hasAccess) return false

 const matchSearch = 
 file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
 (file.investor_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
 (file.notes || "").toLowerCase().includes(searchQuery.toLowerCase())

 const matchType = filterType === "all" || file.file_type === filterType

 return matchSearch && matchType
 })
 }, [files, searchQuery, filterType, userEmail])

 const stats = useMemo(() => {
 return {
 total: filteredFiles.length,
 driveLinks: filteredFiles.filter(f => f.file_type === "drive_link").length,
 investors: filteredFiles.filter(f => f.file_type === "investor_doc").length,
 contacts: filteredFiles.filter(f => f.file_type === "contact_sheet").length,
 }
 }, [filteredFiles])

 return (
 <div className="space-y-6">
 {/* Sandbox Mode Alert Banner */}
 {isSandboxMode && (
 <div className="bg-muted/50 p-4 rounded-r-lg flex items-start gap-3">
 <Info className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
 <div>
 <h4 className="font-bold text-amber-950 text-sm">Sandbox Mode Active</h4>
 <p className="text-xs text-foreground">
 The `shared_files` database migration has not been applied to the database yet. 
 We are storing and simulating all actions securely in your browser's LocalStorage so you can keep working immediately.
 </p>
 </div>
 </div>
 )}

 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
 <div>
 <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
 <FolderOpen className="h-6 w-6 text-muted-foreground" />
 Shared Files & Document Management
 </h2>
 <p className="text-sm text-gray-500 mt-1">
 Store and access Google Drive links, investor documentation, and company contact directories.
 </p>
 </div>
 {!isEditing && (
 <Button onClick={() => { resetForm(); setIsEditing(true) }} className="bg-primary text-primary-foreground hover:bg-primary/90">
 <Plus className="h-4 w-4 mr-2" /> Add Resource
 </Button>
 )}
 </div>

 {/* KPI Stats Grid */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {[
 { label: "Total Assets", value: stats.total, color: "text-foreground bg-muted/50 border-border" },
 { label: "Drive Links", value: stats.driveLinks, color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
 { label: "Investor Docs", value: stats.investors, color: "text-foreground bg-muted/50 border-border" },
 { label: "Contacts", value: stats.contacts, color: "text-foreground bg-muted/50 border-border" }
 ].map((item, idx) => (
 <Card key={idx} className="border border-slate-100 ">
 <CardContent className="p-4 flex items-center justify-between">
 <div>
 <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.label}</p>
 <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
 </div>
 <div className={`p-2 rounded-lg ${item.color}`}>
 <FolderOpen className="h-5 w-5" />
 </div>
 </CardContent>
 </Card>
 ))}
 </div>

 {/* Form Card */}
 {isEditing && (
 <Card className=" animate-in slide-in-from-top-2 duration-300">
 <CardHeader className="pb-3 flex flex-row items-center justify-between">
 <div>
 <CardTitle className="text-foreground">{editId ? "Edit Resource" : "Add New Resource"}</CardTitle>
 <CardDescription className="text-xs">Provide details for the shared document or link.</CardDescription>
 </div>
 <Button variant="ghost" size="icon" onClick={resetForm}><Trash2 className="h-4 w-4" /></Button>
 </CardHeader>
 <CardContent>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-sm font-medium text-gray-700">Document/Link Title *</label>
 <Input 
 required 
 value={title} 
 onChange={e => setTitle(e.target.value)} 
 placeholder="e.g. Master Investor Drive, SOP Seasoning Formulation" 
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-sm font-medium text-gray-700">Resource Category *</label>
 <Select 
 value={fileType} 
 onValueChange={v => {
 setFileType(v as FileType)
 }}
 >
 <SelectTrigger>
 <SelectValue placeholder="Select type" />
 </SelectTrigger>
 <SelectContent>
 {FILE_TYPES.map(t => (
 <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1.5 md:col-span-2">
 <label className="text-sm font-medium text-gray-700">Google Drive / File URL *</label>
 <Input 
 required 
 type="url" 
 value={url} 
 onChange={e => setUrl(e.target.value)} 
 placeholder="https://drive.google.com/... or dropbox link" 
 />
 </div>

 {/* Conditional Fields depending on selected type */}
 {fileType === "investor_doc" && (
 <div className="space-y-1.5 animate-in fade-in duration-200">
 <label className="text-sm font-medium text-gray-700">Investor Name</label>
 <Input 
 value={investorName} 
 onChange={e => setInvestorName(e.target.value)} 
 placeholder="e.g. Nexus Capital, Mr. Nakul Mundhada" 
 />
 </div>
 )}

 {(fileType === "contact_sheet" || fileType === "investor_doc") && (
 <div className="space-y-1.5 animate-in fade-in duration-200">
 <label className="text-sm font-medium text-gray-700">Contact Number</label>
 <Input 
 value={contactNumber} 
 onChange={e => setContactNumber(e.target.value)} 
 placeholder="e.g. +91 98765 43210" 
 />
 </div>
 )}

 {/* Assignment selection (CEO/MD only) */}
 {isExecutive && (
 <div className="space-y-1.5 md:col-span-2">
 <label className="text-sm font-medium text-gray-700">Assign/Restrict Visibility to (Select Multiple)</label>
 <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-gray-50/50 max-h-40 overflow-y-auto">
 {[
 { label: 'CEO', email: 'ceo@biovaco.in' },
 { label: 'MD', email: 'md@biovaco.in' },
 { label: 'Food Technologist (R&D)', email: 'food@biovaco.in' },
 ...interns.map(i => ({ label: `${i.name} (Intern)`, email: i.email }))
 ].map(opt => {
 const isSelected = (assignedTo || '').split(',').includes(opt.email);
 return (
 <Badge 
 key={opt.email} 
 variant={isSelected ? "default" : "outline"} 
 className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary/90 text-white' : 'hover:bg-gray-100 bg-white'}`}
 onClick={() => {
 let current = (assignedTo || '').split(',').filter(Boolean);
 if (current.includes(opt.email)) current = current.filter(e => e !== opt.email);
 else current.push(opt.email);
 setAssignedTo(current.join(','));
 }}
 >
 {opt.label}
 </Badge>
 );
 })}
 </div>
 <p className="text-[10px] text-gray-400 mt-1">If no options are selected, only you (the creator) will have visibility.</p>
 </div>
 )}
 </div>

 <div className="space-y-1.5">
 <label className="text-sm font-medium text-gray-700">Description / Access Notes</label>
 <Textarea 
 value={notes} 
 onChange={e => setNotes(e.target.value)} 
 placeholder="Password or permission details, folder path info..." 
 rows={2} 
 />
 </div>

 <div className="flex justify-end gap-2 pt-2 border-t">
 <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
 <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90">
 {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
 {editId ? "Update & Notify Team" : "Publish & Notify Team"}
 </Button>
 </div>
 </form>
 </CardContent>
 </Card>
 )}

 {/* Filter and Search Bar */}
 <Card className=" border border-slate-100">
 <CardContent className="p-3">
 <div className="flex flex-col sm:flex-row gap-3">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
 <Input 
 className="pl-9 bg-transparent" 
 placeholder="Search by Title, Investor Name, Notes..." 
 value={searchQuery} 
 onChange={e => setSearchQuery(e.target.value)} 
 />
 </div>
 <Select value={filterType} onValueChange={setFilterType}>
 <SelectTrigger className="w-full sm:w-[180px]">
 <SelectValue placeholder="Filter Category" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Categories</SelectItem>
 {FILE_TYPES.map(t => (
 <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </CardContent>
 </Card>

 {/* Files List */}
 {isLoading ? (
 <div className="flex justify-center items-center h-48">
 <Loader2 className="h-8 w-8 animate-spin text-foreground" />
 </div>
 ) : filteredFiles.length === 0 ? (
 <Card className=" border border-dashed border-slate-200 py-12 text-center">
 <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
 <p className="text-gray-500 font-semibold">No assets found</p>
 <p className="text-xs text-gray-400 mt-1">Try resetting the filter or click "Add Resource" to upload.</p>
 </Card>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {filteredFiles.map(file => {
 const meta = FILE_TYPES.find(x => x.value === file.file_type) || FILE_TYPES[5]
 const TypeIcon = meta.icon

 return (
 <Card key={file.id} className="shadow-sm hover: border border-slate-100 flex flex-col justify-between">
 <CardContent className="p-4 space-y-3">
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-start gap-2.5">
 <div className={`p-2 rounded-lg ${meta.color} shrink-0 mt-0.5`}>
 <TypeIcon className="h-4 w-4" />
 </div>
 <div className="space-y-0.5 min-w-0">
 <h3 className="font-bold text-sm text-slate-800 leading-snug break-words">
 {file.title}
 </h3>
 <div className="flex items-center gap-1.5 flex-wrap">
 <Badge variant="outline" className={`text-[10px] px-1 py-0 ${meta.color}`}>
 {meta.label}
 </Badge>
 {file.investor_name && (
 <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 border-slate-200">
 Investor: {file.investor_name}
 </Badge>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Document Attributes */}
 {(file.contact_number || file.notes) && (
 <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
 {file.contact_number && (
 <p className="text-slate-600 flex items-center gap-1.5">
 <Phone className="h-3 w-3 text-slate-400" />
 <strong>Phone:</strong> {file.contact_number}
 </p>
 )}
 {file.notes && (
 <p className="text-slate-600 leading-normal break-words">
 <strong>Notes:</strong> {file.notes}
 </p>
 )}
 </div>
 )}

 {/* Assignees badges */}
 {file.assigned_to && (
 <div className="space-y-1">
 <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Authorized Viewers</p>
 <div className="flex flex-wrap gap-1">
 {file.assigned_to.split(',').filter(Boolean).map(email => (
 <Badge key={email} variant="outline" className="bg-muted/50 text-foreground border-border text-[10px] px-1.5 py-0">
 <User className="h-3 w-3 mr-1" />
 {email.split('@')[0]}
 </Badge>
 ))}
 </div>
 </div>
 )}

 <div className="flex justify-between items-center text-[10px] text-slate-400 border-t pt-2.5 mt-2">
 <span>Uploaded by: {file.uploaded_by.split("@")[0]}</span>
 <span>{new Date(file.created_at).toLocaleDateString()}</span>
 </div>
 </CardContent>

 <div className="bg-slate-50/50 px-4 py-2.5 rounded-b-lg border-t border-slate-100 flex items-center justify-between gap-2">
 <div className="flex items-center gap-1">
 <Button 
 variant="ghost" 
 size="icon" 
 className="h-8 w-8 text-foreground hover:text-foreground" 
 onClick={() => handleEdit(file)}
 >
 <Edit className="h-3.5 w-3.5" />
 </Button>
 <Button 
 variant="ghost" 
 size="icon" 
 className="h-8 w-8 text-red-500 hover:text-red-600" 
 onClick={() => handleDelete(file.id)}
 >
 <Trash2 className="h-3.5 w-3.5" />
 </Button>
 </div>
 
 <div className="flex items-center gap-1.5">
 {file.url && (
 <>
 <Button 
 variant="outline" 
 size="sm" 
 className="h-8 text-xs gap-1 border-slate-200"
 onClick={() => copyToClipboard(file.url)}
 >
 <Copy className="h-3 w-3" />
 Copy
 </Button>
 <a href={file.url} target="_blank" rel="noreferrer">
 <Button size="sm" className="h-8 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90">
 <ExternalLink className="h-3 w-3" />
 Open
 </Button>
 </a>
 </>
 )}
 </div>
 </div>
 </Card>
 )
 })}
 </div>
 )}
 </div>
 )
}
