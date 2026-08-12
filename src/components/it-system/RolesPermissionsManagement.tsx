import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Shield, Lock, CheckCircle2, XCircle, Sparkles, RefreshCw, Save, Layers } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SystemRole {
  id: string
  name: string
  description: string
  usersCount: number
  isSystem?: boolean
  permissions: {
    module: string
    read: boolean
    write: boolean
    delete: boolean
    export: boolean
  }[]
}

const DEFAULT_ROLES: SystemRole[] = [
  {
    id: "super_admin",
    name: "Super Admin (Executive)",
    description: "Full read/write/delete access across all corporate modules & database tables",
    usersCount: 2,
    isSystem: true,
    permissions: [
      { module: "Executive & Strategy", read: true, write: true, delete: true, export: true },
      { module: "HRMS & Applications", read: true, write: true, delete: true, export: true },
      { module: "Finance & Accounting", read: true, write: true, delete: true, export: true },
      { module: "Research & Development", read: true, write: true, delete: true, export: true },
      { module: "IT & System Settings", read: true, write: true, delete: true, export: true }
    ]
  },
  {
    id: "hr_manager",
    name: "HR & Talent Lead",
    description: "Full recruitment, applicant review, intern oversight, and payroll read privileges",
    usersCount: 4,
    permissions: [
      { module: "Executive & Strategy", read: false, write: false, delete: false, export: false },
      { module: "HRMS & Applications", read: true, write: true, delete: true, export: true },
      { module: "Finance & Accounting", read: true, write: false, delete: false, export: true },
      { module: "Research & Development", read: false, write: false, delete: false, export: false },
      { module: "IT & System Settings", read: false, write: false, delete: false, export: false }
    ]
  },
  {
    id: "rd_scientist",
    name: "R&D Researcher & Scientist",
    description: "Access to formulations, trials, testing, knowledge tracker, and IP patents vault",
    usersCount: 6,
    permissions: [
      { module: "Executive & Strategy", read: false, write: false, delete: false, export: false },
      { module: "HRMS & Applications", read: false, write: false, delete: false, export: false },
      { module: "Finance & Accounting", read: false, write: false, delete: false, export: false },
      { module: "Research & Development", read: true, write: true, delete: true, export: true },
      { module: "IT & System Settings", read: false, write: false, delete: false, export: false }
    ]
  },
  {
    id: "finance_officer",
    name: "Finance & Accounting Lead",
    description: "Full billing, ledger, tax center, profit & loss statement, and invoice generator access",
    usersCount: 3,
    permissions: [
      { module: "Executive & Strategy", read: true, write: false, delete: false, export: true },
      { module: "HRMS & Applications", read: true, write: false, delete: false, export: true },
      { module: "Finance & Accounting", read: true, write: true, delete: true, export: true },
      { module: "Research & Development", read: false, write: false, delete: false, export: false },
      { module: "IT & System Settings", read: false, write: false, delete: false, export: false }
    ]
  }
]

export function RolesPermissionsManagement() {
  const [roles, setRoles] = useState<SystemRole[]>(DEFAULT_ROLES)
  const [selectedRoleId, setSelectedRoleId] = useState<string>("super_admin")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0]

  const togglePermission = (moduleName: string, action: "read" | "write" | "delete" | "export") => {
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== selectedRoleId) return role
        return {
          ...role,
          permissions: role.permissions.map((p) => {
            if (p.module !== moduleName) return p
            return { ...p, [action]: !p[action] }
          })
        }
      })
    )
  }

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast({
        title: "Permissions Saved",
        description: `Granular security matrix for role "${selectedRole.name}" updated successfully.`
      })
    }, 600)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#4B49AC] flex items-center gap-2">
            <Shield className="h-7 w-7 text-[#7DA0FA]" />
            Enterprise Roles & Permissions Matrix
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure role-based access control (RBAC), permission levels, and data export restrictions for all organizational tiers.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-medium">
          <Save className="h-4 w-4 mr-1" />
          {saving ? "Saving..." : "Save Matrix Settings"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role List Selection Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-bold text-foreground">System Security Roles</CardTitle>
            <CardDescription className="text-xs">Select a role to edit granular privileges</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {roles.map((role) => {
              const isSelected = role.id === selectedRoleId
              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`p-3.5 rounded-lg cursor-pointer border transition-all ${
                    isSelected
                      ? "border-[#4B49AC] bg-[#f2f6ff] shadow-sm"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-[#4B49AC]">{role.name}</span>
                    {role.isSystem && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                        System Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{role.description}</p>
                  <div className="mt-2 text-[11px] text-gray-400 flex items-center gap-1 font-medium">
                    <Lock className="h-3 w-3 text-emerald-600" /> {role.usersCount} Active User(s) Assigned
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Granular Permission Checkbox Matrix */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b bg-muted/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-[#4B49AC]">
                  Permission Matrix: {selectedRole.name}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {selectedRole.description}
                </CardDescription>
              </div>
              <Badge className="bg-[#7DA0FA]/15 text-[#4B49AC] border-0 font-semibold">
                {selectedRole.permissions.filter((p) => p.read).length} Modules Permitted
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead className="font-bold">Module Name</TableHead>
                    <TableHead className="text-center font-bold">Read / View</TableHead>
                    <TableHead className="text-center font-bold">Write / Edit</TableHead>
                    <TableHead className="text-center font-bold">Delete</TableHead>
                    <TableHead className="text-center font-bold">CSV Export</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedRole.permissions.map((perm) => (
                    <TableRow key={perm.module}>
                      <TableCell className="font-semibold text-foreground">{perm.module}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={perm.read}
                          onCheckedChange={() => togglePermission(perm.module, "read")}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={perm.write}
                          onCheckedChange={() => togglePermission(perm.module, "write")}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={perm.delete}
                          onCheckedChange={() => togglePermission(perm.module, "delete")}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={perm.export}
                          onCheckedChange={() => togglePermission(perm.module, "export")}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
