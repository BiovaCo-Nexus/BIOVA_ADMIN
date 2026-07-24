import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Plus, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function OfferLetters() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState({ candidate_name: "", candidate_email: "", position: "", offered_salary: "", joining_date: "" })
  const { toast } = useToast()

  const fetchData = async () => {
    const { data } = await supabase.from('offer_letters').select('*').order('created_at', { ascending: false })
    if (data) setItems(data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleAdd = async () => {
    if (!newItem.candidate_name) {
      toast({ title: "Validation Error", description: "Required fields are missing.", variant: "destructive" })
      return
    }
    const { error } = await supabase.from('offer_letters').insert(newItem)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Success", description: "Record added successfully." })
      setNewItem({ candidate_name: "", candidate_email: "", position: "", offered_salary: "", joining_date: "" })
      fetchData()
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('offer_letters').delete().eq('id', id)
    fetchData()
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="h-8 w-8 text-[#4B49AC]" /> Offer Letters
        </h2>
        <p className="text-gray-500 mt-2">Draft and send job offers to candidates.</p>
      </div>

      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
            <Input placeholder="Candidate Name" value={newItem.candidate_name} onChange={e => setNewItem({...newItem, candidate_name: e.target.value})} className="mb-2" />
            <Input placeholder="Candidate Email" value={newItem.candidate_email} onChange={e => setNewItem({...newItem, candidate_email: e.target.value})} className="mb-2" />
            <Input placeholder="Position" value={newItem.position} onChange={e => setNewItem({...newItem, position: e.target.value})} className="mb-2" />
            <Input placeholder="Salary" value={newItem.offered_salary} onChange={e => setNewItem({...newItem, offered_salary: e.target.value})} className="mb-2" />
            <Input placeholder="Joining Date (YYYY-MM-DD)" value={newItem.joining_date} onChange={e => setNewItem({...newItem, joining_date: e.target.value})} className="mb-2" />
            </div>
            <Button onClick={handleAdd} className="bg-[#4B49AC] hover:bg-[#3b3a88] h-10"><Plus className="h-4 w-4 mr-2"/> Add</Button>
          </div>
          
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.candidate_name}</TableCell>
                    <TableCell>{item.position}</TableCell>
                    <TableCell>{item.offered_salary}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4"/></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && !loading && (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No records found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
