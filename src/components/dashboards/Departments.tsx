import React, { useState, useEffect } from "react"
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
    if (!newDept.name) { toast({ title: "Validation Error", description: "Department name is required.", variant: "destructive" }); return; }
    const { error } = await supabase.from('departments').insert(newDept)
    if (error) {
      console.error(error);
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
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
