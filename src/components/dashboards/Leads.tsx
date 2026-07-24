import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Target, Plus, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function Leads() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState({ first_name: "", last_name: "", company: "" })
  const { toast } = useToast()

  const fetchData = async () => {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    if (data) setItems(data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleAdd = async () => {
    if (!newItem.first_name) {
      toast({ title: "Validation Error", description: "Required fields are missing.", variant: "destructive" })
      return
    }
    const { error } = await supabase.from('leads').insert(newItem)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Success", description: "Record added successfully." })
      setNewItem({ first_name: "", last_name: "", company: "" })
      fetchData()
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('leads').delete().eq('id', id)
    fetchData()
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Target className="h-8 w-8 text-[#4B49AC]" /> Lead Generation
        </h2>
        <p className="text-gray-500 mt-2">Manage potential prospects before they become accounts.</p>
      </div>

      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2 overflow-x-auto pb-2">
            <Input placeholder="First Name" value={newItem.first_name} onChange={e => setNewItem({...newItem, first_name: e.target.value})} className="mb-2" />
            <Input placeholder="Last Name" value={newItem.last_name} onChange={e => setNewItem({...newItem, last_name: e.target.value})} className="mb-2" />
            <Input placeholder="Company" value={newItem.company} onChange={e => setNewItem({...newItem, company: e.target.value})} className="mb-2" />
            </div>
            <Button onClick={handleAdd} className="bg-[#4B49AC] hover:bg-[#3b3a88] h-10 shrink-0"><Plus className="h-4 w-4 mr-2"/> Add</Button>
          </div>
          
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>First Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.first_name}</TableCell>
                    <TableCell>{item.company}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4"/></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && !loading && (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">No records found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
