import React, { useState, useEffect } from "react"
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
    if (!newBranch.name) { toast({ title: "Validation Error", description: "Branch name is required.", variant: "destructive" }); return; }
    const { error } = await supabase.from('branches').insert(newBranch)
    if (error) {
      console.error(error);
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
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
