const fs = require('fs');

const companyProfile = `import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Building2, Save, MapPin, Phone, Mail, Globe, Hash } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function CompanyProfile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const { data, error } = await supabase.from('company_profile').select('*').limit(1).single()
    if (data) setProfile(data)
    else if (!error) {
      // Create empty profile if none exists
      const newProfile = { company_name: "New Company", email: "", phone: "", website: "" }
      const { data: inserted } = await supabase.from('company_profile').insert(newProfile).select().single()
      setProfile(inserted || newProfile)
    }
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('company_profile').update(profile).eq('id', profile.id)
    setSaving(false)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Saved", description: "Company profile updated successfully." })
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-[#4B49AC]" /> Company Profile
          </h2>
          <p className="text-gray-500 mt-2">Manage your core enterprise identity and contact details.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#4B49AC] hover:bg-[#3b3a88]">
          <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>This information is used across invoices and official documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input name="company_name" value={profile?.company_name || ""} onChange={handleChange} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Registration / CIN Number</label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input name="registration_number" value={profile?.registration_number || ""} onChange={handleChange} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Official Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input name="email" value={profile?.email || ""} onChange={handleChange} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input name="phone" value={profile?.phone || ""} onChange={handleChange} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input name="website" value={profile?.website || ""} onChange={handleChange} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">GST / Tax ID</label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input name="tax_id" value={profile?.tax_id || ""} onChange={handleChange} className="pl-9" />
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <label className="text-sm font-medium">Headquarters Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input name="address" value={profile?.address || ""} onChange={handleChange} className="pl-9" placeholder="Street Address" />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <Input name="city" value={profile?.city || ""} onChange={handleChange} placeholder="City" />
              <Input name="state" value={profile?.state || ""} onChange={handleChange} placeholder="State" />
              <Input name="country" value={profile?.country || ""} onChange={handleChange} placeholder="Country" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
`;

const departments = `import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Briefcase, Plus, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function Departments({ onNavigateToTab }: { onNavigateToTab?: (tabId: string) => void }) {
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newDept, setNewDept] = useState({ name: "", head_name: "" })
  const { toast } = useToast()

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('*').order('name')
    if (data) setDepartments(data)
    setLoading(false)
  }

  useEffect(() => { fetchDepartments() }, [])

  const handleAdd = async () => {
    if (!newDept.name) return
    const { error } = await supabase.from('departments').insert(newDept)
    if (!error) {
      toast({ title: "Success", description: "Department added." })
      setNewDept({ name: "", head_name: "" })
      fetchDepartments()
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('departments').delete().eq('id', id)
    fetchDepartments()
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-[#4B49AC]" /> Departments
        </h2>
        <p className="text-gray-500 mt-2">Manage organizational departments and heads.</p>
      </div>

      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="flex gap-4 mb-6">
            <Input placeholder="Department Name" value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} />
            <Input placeholder="Head Name" value={newDept.head_name} onChange={e => setNewDept({...newDept, head_name: e.target.value})} />
            <Button onClick={handleAdd} className="bg-[#4B49AC] hover:bg-[#3b3a88]"><Plus className="h-4 w-4 mr-2"/> Add</Button>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Head / Director</TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : departments.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{d.head_name || 'Unassigned'}</TableCell>
                    <TableCell>
                      <Button variant="link" className="text-[#4B49AC] h-auto p-0" onClick={() => onNavigateToTab?.('teams')}>View Teams</Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4"/></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {departments.length === 0 && !loading && (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">No departments found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
`;

const branches = `import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MapPin, Plus, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function Branches() {
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newBranch, setNewBranch] = useState({ name: "", city: "", branch_manager: "" })
  const { toast } = useToast()

  const fetchBranches = async () => {
    const { data } = await supabase.from('branches').select('*').order('name')
    if (data) setBranches(data)
    setLoading(false)
  }

  useEffect(() => { fetchBranches() }, [])

  const handleAdd = async () => {
    if (!newBranch.name) return
    const { error } = await supabase.from('branches').insert(newBranch)
    if (!error) {
      toast({ title: "Success", description: "Branch added." })
      setNewBranch({ name: "", city: "", branch_manager: "" })
      fetchBranches()
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('branches').delete().eq('id', id)
    fetchBranches()
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <MapPin className="h-8 w-8 text-[#4B49AC]" /> Branches
        </h2>
        <p className="text-gray-500 mt-2">Manage physical office locations and warehouses.</p>
      </div>

      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="flex gap-4 mb-6">
            <Input placeholder="Branch Name" value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} />
            <Input placeholder="City / Location" value={newBranch.city} onChange={e => setNewBranch({...newBranch, city: e.target.value})} />
            <Input placeholder="Manager Name" value={newBranch.branch_manager} onChange={e => setNewBranch({...newBranch, branch_manager: e.target.value})} />
            <Button onClick={handleAdd} className="bg-[#4B49AC] hover:bg-[#3b3a88]"><Plus className="h-4 w-4 mr-2"/> Add</Button>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Branch Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : branches.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{b.city}</TableCell>
                    <TableCell>{b.branch_manager || 'Unassigned'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4"/></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
`;

const teams = `import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Plus, Trash2, Shield } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function Teams({ onNavigateToTab }: { onNavigateToTab?: (tabId: string) => void }) {
  const [teams, setTeams] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newTeam, setNewTeam] = useState({ name: "", leader_name: "", department_id: "" })
  const { toast } = useToast()

  const fetchData = async () => {
    const [{ data: tData }, { data: dData }] = await Promise.all([
      supabase.from('teams').select('*, departments(name)'),
      supabase.from('departments').select('id, name')
    ])
    if (tData) setTeams(tData)
    if (dData) setDepartments(dData)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleAdd = async () => {
    if (!newTeam.name || !newTeam.department_id) return
    const { error } = await supabase.from('teams').insert(newTeam)
    if (!error) {
      toast({ title: "Success", description: "Team created." })
      setNewTeam({ name: "", leader_name: "", department_id: "" })
      fetchData()
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('teams').delete().eq('id', id)
    fetchData()
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="h-8 w-8 text-[#4B49AC]" /> Functional Teams
        </h2>
        <p className="text-gray-500 mt-2">Manage agile squads and sub-teams within departments.</p>
      </div>

      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input placeholder="Team Name (e.g., Core API Squad)" value={newTeam.name} onChange={e => setNewTeam({...newTeam, name: e.target.value})} className="flex-1" />
            <Select value={newTeam.department_id} onValueChange={v => setNewTeam({...newTeam, department_id: v})}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Select Department" /></SelectTrigger>
              <SelectContent>
                {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Team Lead" value={newTeam.leader_name} onChange={e => setNewTeam({...newTeam, leader_name: e.target.value})} className="flex-1" />
            <Button onClick={handleAdd} className="bg-[#4B49AC] hover:bg-[#3b3a88]"><Plus className="h-4 w-4 mr-2"/> Create</Button>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Team Lead</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : teams.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium flex items-center gap-2"><Shield className="h-4 w-4 text-gray-400" /> {t.name}</TableCell>
                    <TableCell>{t.departments?.name}</TableCell>
                    <TableCell>{t.leader_name || 'Unassigned'}</TableCell>
                    <TableCell>
                      <Button variant="link" className="text-[#4B49AC] h-auto p-0" onClick={() => onNavigateToTab?.('employees')}>View HR</Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4"/></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
`;

const orgChart = `import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Network, Users, UserCircle2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

export function OrganizationChart() {
  const [hierarchy, setHierarchy] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrg = async () => {
      // Grouping logic based on departments and teams tables
      const { data: dData } = await supabase.from('departments').select('*').order('name')
      const { data: tData } = await supabase.from('teams').select('*').order('name')
      
      if (dData && tData) {
        const orgTree = dData.map((d: any) => ({
          ...d,
          teams: tData.filter((t: any) => t.department_id === d.id)
        }))
        setHierarchy(orgTree)
      }
      setLoading(false)
    }
    fetchOrg()
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Network className="h-8 w-8 text-[#4B49AC]" /> Organization Chart
        </h2>
        <p className="text-gray-500 mt-2">Visual representation of corporate structure.</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading structure...</div>
        ) : hierarchy.map(dept => (
          <Card key={dept.id} className="border-l-4 border-l-[#4B49AC] shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center">
                    <UserCircle2 className="h-5 w-5 text-[#4B49AC]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{dept.name}</h3>
                    <p className="text-sm text-gray-500 font-medium">Head: {dept.head_name || 'Unassigned'}</p>
                  </div>
                </div>
              </div>
              
              {dept.teams?.length > 0 && (
                <div className="ml-6 pl-6 border-l-2 border-gray-100 space-y-3">
                  {dept.teams.map((team: any) => (
                    <div key={team.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <Users className="h-4 w-4 text-gray-400" />
                      <div>
                        <h4 className="font-semibold text-sm text-gray-800">{team.name}</h4>
                        <p className="text-xs text-gray-500">Lead: {team.leader_name || 'Unassigned'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
`;

fs.writeFileSync('src/components/dashboards/CompanyProfile.tsx', companyProfile);
fs.writeFileSync('src/components/dashboards/Departments.tsx', departments);
fs.writeFileSync('src/components/dashboards/Branches.tsx', branches);
fs.writeFileSync('src/components/dashboards/Teams.tsx', teams);
fs.writeFileSync('src/components/dashboards/OrganizationChart.tsx', orgChart);
console.log("Organization Modules created successfully.");
