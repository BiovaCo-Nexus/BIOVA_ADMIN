import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreditCard, Plus, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function Payroll() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState({ month: "", year: "", net_salary: "" })
  const { toast } = useToast()

  const fetchData = async () => {
    const { data } = await supabase.from('payroll_records').select('*').order('created_at', { ascending: false })
    if (data) setItems(data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleAdd = async () => {
    if (!newItem.month) {
      toast({ title: "Validation Error", description: "Required fields are missing.", variant: "destructive" })
      return
    }
    const { error } = await supabase.from('payroll_records').insert(newItem)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Success", description: "Record added successfully." })
      setNewItem({ month: "", year: "", net_salary: "" })
      fetchData()
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('payroll_records').delete().eq('id', id)
    fetchData()
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-[#4B49AC]" /> Payroll Management
        </h2>
        <p className="text-gray-500 mt-2">Manage monthly salary disbursements.</p>
      </div>

      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
            <Input placeholder="Month (e.g. July)" value={newItem.month} onChange={e => setNewItem({...newItem, month: e.target.value})} className="mb-2" />
            <Input placeholder="Year" value={newItem.year} onChange={e => setNewItem({...newItem, year: e.target.value})} className="mb-2" />
            <Input placeholder="Net Salary" value={newItem.net_salary} onChange={e => setNewItem({...newItem, net_salary: e.target.value})} className="mb-2" />
            </div>
            <Button onClick={handleAdd} className="bg-[#4B49AC] hover:bg-[#3b3a88] h-10"><Plus className="h-4 w-4 mr-2"/> Add</Button>
          </div>
          
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.month}</TableCell>
                    <TableCell>{item.year}</TableCell>
                    <TableCell>{item.net_salary}</TableCell>
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
