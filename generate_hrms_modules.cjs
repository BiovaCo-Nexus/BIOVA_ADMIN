const fs = require('fs');

const createComponent = (name, icon, title, desc, table, cols, formFields) => {
  const insertFields = formFields.map(f => f.key);
  const inputEl = formFields.map(f => 
    `<Input placeholder="${f.label}" value={newItem.${f.key}} onChange={e => setNewItem({...newItem, ${f.key}: e.target.value})} className="mb-2" />`
  ).join('\n            ');
  
  const thEl = cols.map(c => `<TableHead>${c.label}</TableHead>`).join('\n                  ');
  const tdEl = cols.map(c => `<TableCell>{item.${c.key}}</TableCell>`).join('\n                    ');

  return `import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ${icon}, Plus, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function ${name}() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState({ ${insertFields.map(f => `${f}: ""`).join(', ')} })
  const { toast } = useToast()

  const fetchData = async () => {
    const { data } = await supabase.from('${table}').select('*').order('created_at', { ascending: false })
    if (data) setItems(data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleAdd = async () => {
    if (!newItem.${insertFields[0]}) {
      toast({ title: "Validation Error", description: "Required fields are missing.", variant: "destructive" })
      return
    }
    const { error } = await supabase.from('${table}').insert(newItem)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Success", description: "Record added successfully." })
      setNewItem({ ${insertFields.map(f => `${f}: ""`).join(', ')} })
      fetchData()
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('${table}').delete().eq('id', id)
    fetchData()
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <${icon} className="h-8 w-8 text-[#4B49AC]" /> ${title}
        </h2>
        <p className="text-gray-500 mt-2">${desc}</p>
      </div>

      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
            ${inputEl}
            </div>
            <Button onClick={handleAdd} className="bg-[#4B49AC] hover:bg-[#3b3a88] h-10"><Plus className="h-4 w-4 mr-2"/> Add</Button>
          </div>
          
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  ${thEl}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={${cols.length + 1}} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : items.map(item => (
                  <TableRow key={item.id}>
                    ${tdEl}
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4"/></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && !loading && (
                  <TableRow><TableCell colSpan={${cols.length + 1}} className="text-center py-8 text-gray-500">No records found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
`
};

fs.writeFileSync('src/components/dashboards/Employees.tsx', createComponent(
  'Employees', 'Users', 'Employee Directory', 'Manage all full-time and part-time employees.',
  'employees', 
  [{label: 'Emp ID', key: 'employee_id'}, {label: 'Name', key: 'name'}, {label: 'Email', key: 'email'}, {label: 'Designation', key: 'designation'}],
  [{label: 'Emp ID', key: 'employee_id'}, {label: 'Name', key: 'name'}, {label: 'Email', key: 'email'}, {label: 'Designation', key: 'designation'}]
));

fs.writeFileSync('src/components/dashboards/Attendance.tsx', createComponent(
  'Attendance', 'Clock', 'Attendance Tracking', 'Monitor daily check-ins and check-outs.',
  'attendance',
  [{label: 'Date', key: 'date'}, {label: 'Status', key: 'status'}],
  [{label: 'Date (YYYY-MM-DD)', key: 'date'}, {label: 'Status (present/absent)', key: 'status'}]
));

fs.writeFileSync('src/components/dashboards/LeaveManagement.tsx', createComponent(
  'LeaveManagement', 'Briefcase', 'Leave Management', 'Process and track employee leave requests.',
  'leave_requests',
  [{label: 'Type', key: 'leave_type'}, {label: 'Start Date', key: 'start_date'}, {label: 'End Date', key: 'end_date'}, {label: 'Status', key: 'status'}],
  [{label: 'Leave Type', key: 'leave_type'}, {label: 'Start Date', key: 'start_date'}, {label: 'End Date', key: 'end_date'}]
));

fs.writeFileSync('src/components/dashboards/Payroll.tsx', createComponent(
  'Payroll', 'CreditCard', 'Payroll Management', 'Manage monthly salary disbursements.',
  'payroll_records',
  [{label: 'Month', key: 'month'}, {label: 'Year', key: 'year'}, {label: 'Net Salary', key: 'net_salary'}, {label: 'Status', key: 'status'}],
  [{label: 'Month (e.g. July)', key: 'month'}, {label: 'Year', key: 'year'}, {label: 'Net Salary', key: 'net_salary'}]
));

fs.writeFileSync('src/components/dashboards/PerformanceReviews.tsx', createComponent(
  'PerformanceReviews', 'Star', 'Performance Reviews', 'Track employee ratings and feedback.',
  'performance_reviews',
  [{label: 'Period', key: 'review_period'}, {label: 'Rating (1-5)', key: 'rating'}, {label: 'Feedback', key: 'feedback'}],
  [{label: 'Review Period', key: 'review_period'}, {label: 'Rating (1-5)', key: 'rating'}, {label: 'Feedback summary', key: 'feedback'}]
));

fs.writeFileSync('src/components/dashboards/OfferLetters.tsx', createComponent(
  'OfferLetters', 'FileText', 'Offer Letters', 'Draft and send job offers to candidates.',
  'offer_letters',
  [{label: 'Candidate', key: 'candidate_name'}, {label: 'Position', key: 'position'}, {label: 'Salary', key: 'offered_salary'}, {label: 'Status', key: 'status'}],
  [{label: 'Candidate Name', key: 'candidate_name'}, {label: 'Candidate Email', key: 'candidate_email'}, {label: 'Position', key: 'position'}, {label: 'Salary', key: 'offered_salary'}, {label: 'Joining Date (YYYY-MM-DD)', key: 'joining_date'}]
));

fs.writeFileSync('src/components/dashboards/ExitManagement.tsx', createComponent(
  'ExitManagement', 'Trash2', 'Exit Management', 'Process employee resignations and clearances.',
  'exit_records',
  [{label: 'Resignation Date', key: 'resignation_date'}, {label: 'Last Day', key: 'last_working_day'}, {label: 'Status', key: 'status'}],
  [{label: 'Resignation Date', key: 'resignation_date'}, {label: 'Last Working Day', key: 'last_working_day'}, {label: 'Reason', key: 'reason'}]
));

fs.writeFileSync('src/components/dashboards/AssetsAssigned.tsx', createComponent(
  'AssetsAssigned', 'MapPin', 'Assets Assigned', 'Track hardware and equipment issued to staff.',
  'assets_assigned',
  [{label: 'Asset Tag', key: 'asset_tag'}, {label: 'Name', key: 'asset_name'}, {label: 'Category', key: 'category'}, {label: 'Status', key: 'status'}],
  [{label: 'Asset Tag (e.g. LPT-01)', key: 'asset_tag'}, {label: 'Asset Name', key: 'asset_name'}, {label: 'Category', key: 'category'}, {label: 'Assigned Date', key: 'assigned_date'}]
));

// Add HRDashboard
const hrDash = `import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, CreditCard, Star } from "lucide-react"

export function HRDashboard({ onNavigateToTab }: { onNavigateToTab?: (tabId: string) => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">HR Dashboard</h2>
        <p className="text-gray-500">Overview of Human Capital operations.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card onClick={() => onNavigateToTab?.('employees')} className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-blue-500">
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-500"/> Employees</CardTitle></CardHeader>
          <CardContent><p className="text-gray-500">Manage directory.</p></CardContent>
        </Card>
        <Card onClick={() => onNavigateToTab?.('leave_management')} className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-amber-500">
          <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-amber-500"/> Leave Requests</CardTitle></CardHeader>
          <CardContent><p className="text-gray-500">Review time-offs.</p></CardContent>
        </Card>
        <Card onClick={() => onNavigateToTab?.('payroll')} className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-emerald-500">
          <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-emerald-500"/> Payroll</CardTitle></CardHeader>
          <CardContent><p className="text-gray-500">Process salaries.</p></CardContent>
        </Card>
        <Card onClick={() => onNavigateToTab?.('performance_reviews')} className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-purple-500">
          <CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-purple-500"/> Reviews</CardTitle></CardHeader>
          <CardContent><p className="text-gray-500">Track performance.</p></CardContent>
        </Card>
      </div>
    </div>
  )
}
`;
fs.writeFileSync('src/components/dashboards/HRDashboard.tsx', hrDash);

console.log("HRMS Modules generated.");
