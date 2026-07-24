import React, { useState, useEffect } from "react"
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
    if (!newTeam.name || !newTeam.department_id) { toast({ title: "Validation Error", description: "Team name and department are required.", variant: "destructive" }); return; }
    const { error } = await supabase.from('teams').insert(newTeam)
    if (error) {
      console.error(error);
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
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
