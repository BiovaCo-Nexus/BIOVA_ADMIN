import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Users, UserPlus, Search, Shield, RefreshCw, Key, CheckCircle, XCircle, Mail, Sparkles } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface SystemUser {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  last_login?: string
  created_at: string
}

interface UserManagementProps {
  onNavigateToTab?: (tabId: string) => void
}

export function UserManagement({ onNavigateToTab }: UserManagementProps) {
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserName, setNewUserName] = useState("")
  const [newUserRole, setNewUserRole] = useState("Staff / Intern")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      // Fetch from profiles or user_page_access
      const [profilesRes, accessRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_page_access").select("*")
      ])

      const profilesMap = new Map<string, any>()
      if (profilesRes.data) {
        profilesRes.data.forEach((p) => profilesMap.set(p.email?.toLowerCase(), p))
      }

      const accessData = accessRes.data || []
      const combinedUsers: SystemUser[] = []

      // Standard executive system accounts
      const defaultAdmins: SystemUser[] = [
        {
          id: "ceo_admin",
          email: "ceo@biovaco.in",
          full_name: "Chief Executive Officer (CEO)",
          role: "Super Admin / Executive",
          is_active: true,
          last_login: new Date().toISOString(),
          created_at: "2025-01-01T00:00:00Z"
        },
        {
          id: "md_admin",
          email: "md@biovaco.in",
          full_name: "Managing Director (MD)",
          role: "Super Admin / Executive",
          is_active: true,
          last_login: new Date().toISOString(),
          created_at: "2025-01-01T00:00:00Z"
        }
      ]

      const addedEmails = new Set(defaultAdmins.map((a) => a.email))
      combinedUsers.push(...defaultAdmins)

      accessData.forEach((acc: any) => {
        const email = acc.user_email?.toLowerCase()
        if (email && !addedEmails.has(email)) {
          addedEmails.add(email)
          const profile = profilesMap.get(email)
          combinedUsers.push({
            id: acc.id || `user_${Math.random()}`,
            email: acc.user_email,
            full_name: acc.user_label || profile?.full_name || acc.user_email.split("@")[0],
            role: acc.user_label ? `${acc.user_label}` : profile?.role || "Staff User",
            is_active: acc.is_active !== false,
            created_at: acc.created_at || new Date().toISOString()
          })
        }
      })

      setUsers(combinedUsers)
    } catch (err: any) {
      console.error("Failed to fetch users:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserEmail.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from("user_page_access").insert({
        user_email: newUserEmail.toLowerCase().trim(),
        user_label: newUserRole,
        allowed_pages: ["dashboard", "my_work", "ai_business_assistant", "knowledge_tracker"],
        default_tab: "dashboard",
        is_active: true
      })

      if (error) throw error

      toast({
        title: "User Created",
        description: `Successfully provisioned system account for ${newUserEmail}.`
      })

      setIsAddModalOpen(false)
      setNewUserEmail("")
      setNewUserName("")
      fetchUsers()
    } catch (err: any) {
      toast({
        title: "Error Creating User",
        description: err.message || "Failed to create user account.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleUserStatus = async (user: SystemUser) => {
    try {
      const { error } = await supabase
        .from("user_page_access")
        .update({ is_active: !user.is_active })
        .eq("user_email", user.email)

      if (error) throw error

      setUsers((prev) =>
        prev.map((u) => (u.email === user.email ? { ...u, is_active: !u.is_active } : u))
      )

      toast({
        title: "Status Updated",
        description: `Account for ${user.email} is now ${!user.is_active ? "Active" : "Disabled"}.`
      })
    } catch (err: any) {
      toast({
        title: "Error Updating Status",
        description: err.message || "Failed to update user status.",
        variant: "destructive"
      })
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole =
      selectedRole === "all" ||
      u.role.toLowerCase().includes(selectedRole.toLowerCase())

    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#4B49AC] flex items-center gap-2">
            <Users className="h-7 w-7 text-[#7DA0FA]" />
            Enterprise User Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Provision, monitor, and configure system user accounts, credentials, and access rules across all portal modules.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          {onNavigateToTab && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToTab("access_control")}
              className="border-[#4B49AC] text-[#4B49AC] hover:bg-[#4B49AC]/10"
            >
              <Shield className="h-4 w-4 mr-1" /> Access Matrix
            </Button>
          )}
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-medium">
            <UserPlus className="h-4 w-4 mr-1" /> Add User
          </Button>
        </div>
      </div>

      {/* Filter & Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or role title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Super Admin / Executive</SelectItem>
                <SelectItem value="hr">HR & Recruitment</SelectItem>
                <SelectItem value="r&d">R&D Scientist</SelectItem>
                <SelectItem value="finance">Finance & CA</SelectItem>
                <SelectItem value="sales">Sales & CRM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* User Directory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground flex items-center justify-between">
            <span>User Directory ({filteredUsers.length})</span>
            <Badge variant="outline" className="bg-[#f2f6ff] text-[#4B49AC] border-[#7DA0FA]/30">
              Active Security Guard Enabled
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading user accounts...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead className="font-bold">User Identity</TableHead>
                    <TableHead className="font-bold">Role Title</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Created Date</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-semibold text-foreground">{user.full_name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-[#7DA0FA]/15 text-[#4B49AC] font-medium">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.is_active}
                            onCheckedChange={() => toggleUserStatus(user)}
                          />
                          <Badge className={user.is_active ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-gray-100 text-gray-700"}>
                            {user.is_active ? "Active" : "Disabled"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {onNavigateToTab && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onNavigateToTab("access_control")}
                              title="Edit tab permissions in Access Control"
                              className="text-[#4B49AC] hover:bg-[#4B49AC]/10"
                            >
                              <Shield className="h-4 w-4 mr-1" /> Permissions
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#4B49AC]">
              <UserPlus className="h-5 w-5 text-[#7DA0FA]" />
              Provision New System User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Email Address *</label>
              <Input
                placeholder="new.user@biovaco.in"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Full Name (Optional)</label>
              <Input
                placeholder="Full Name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Role Preset</label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="🔬 R&D Researcher / Scientist">🔬 R&D Researcher / Scientist</SelectItem>
                  <SelectItem value="👥 HR & Recruitment Manager">👥 HR & Recruitment Manager</SelectItem>
                  <SelectItem value="📦 Inventory & Warehouse Lead">📦 Inventory & Warehouse Lead</SelectItem>
                  <SelectItem value="💰 Finance & Accountant">💰 Finance & Accountant</SelectItem>
                  <SelectItem value="📈 Sales & CRM Specialist">📈 Sales & CRM Specialist</SelectItem>
                  <SelectItem value="🛠️ Operations Lead">🛠️ Operations Lead</SelectItem>
                  <SelectItem value="🎓 Staff / Intern">🎓 Staff / Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={saving} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white">
              {saving ? "Creating..." : "Provision User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
