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
            <div className="flex-1 flex gap-2 overflow-x-auto pb-2">
            ${inputEl}
            </div>
            <Button onClick={handleAdd} className="bg-[#4B49AC] hover:bg-[#3b3a88] h-10 shrink-0"><Plus className="h-4 w-4 mr-2"/> Add</Button>
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

const components = [
  { name: 'Leads', icon: 'Target', title: 'Lead Generation', desc: 'Manage potential prospects before they become accounts.', table: 'leads', cols: [{label: 'First Name', key: 'first_name'}, {label: 'Company', key: 'company'}, {label: 'Status', key: 'status'}], fields: [{label: 'First Name', key: 'first_name'}, {label: 'Last Name', key: 'last_name'}, {label: 'Company', key: 'company'}] },
  { name: 'Accounts', icon: 'Building2', title: 'Accounts & Companies', desc: 'Manage B2B company profiles and customer entities.', table: 'accounts', cols: [{label: 'Company Name', key: 'company_name'}, {label: 'Industry', key: 'industry'}, {label: 'City', key: 'city'}], fields: [{label: 'Company Name', key: 'company_name'}, {label: 'Industry', key: 'industry'}, {label: 'City', key: 'city'}] },
  { name: 'Contacts', icon: 'Users', title: 'Contact Directory', desc: 'Key individuals associated with your accounts.', table: 'contacts', cols: [{label: 'First Name', key: 'first_name'}, {label: 'Last Name', key: 'last_name'}, {label: 'Email', key: 'email'}], fields: [{label: 'First Name', key: 'first_name'}, {label: 'Last Name', key: 'last_name'}, {label: 'Email', key: 'email'}] },
  { name: 'Deals', icon: 'Briefcase', title: 'Deals & Opportunities', desc: 'Track sales opportunities through the pipeline.', table: 'deals', cols: [{label: 'Deal Name', key: 'deal_name'}, {label: 'Amount (₹)', key: 'amount'}, {label: 'Stage', key: 'stage'}], fields: [{label: 'Deal Name', key: 'deal_name'}, {label: 'Amount', key: 'amount'}, {label: 'Stage (e.g. prospecting)', key: 'stage'}] },
  { name: 'Meetings', icon: 'Calendar', title: 'Meetings & Calls', desc: 'Schedule and log CRM activities.', table: 'meetings', cols: [{label: 'Subject', key: 'subject'}, {label: 'Date/Time', key: 'meeting_date'}, {label: 'Status', key: 'status'}], fields: [{label: 'Subject', key: 'subject'}, {label: 'Date (YYYY-MM-DD HH:MM)', key: 'meeting_date'}, {label: 'Status', key: 'status'}] },
  { name: 'CustomerSupport', icon: 'Headset', title: 'Support & Tickets', desc: 'Manage customer complaints and feedback tickets.', table: 'customer_support', cols: [{label: 'Ticket #', key: 'ticket_number'}, {label: 'Subject', key: 'subject'}, {label: 'Status', key: 'status'}], fields: [{label: 'Ticket Number', key: 'ticket_number'}, {label: 'Subject', key: 'subject'}, {label: 'Description', key: 'description'}] },
  { name: 'Contracts', icon: 'FileText', title: 'Contracts & Quotations', desc: 'Track active legal and sales contracts.', table: 'contracts', cols: [{label: 'Title', key: 'contract_title'}, {label: 'Value', key: 'value'}, {label: 'Status', key: 'status'}], fields: [{label: 'Contract Title', key: 'contract_title'}, {label: 'Start Date (YYYY-MM-DD)', key: 'start_date'}, {label: 'End Date', key: 'end_date'}, {label: 'Value', key: 'value'}] }
];

components.forEach(c => {
  fs.writeFileSync(`src/components/dashboards/${c.name}.tsx`, createComponent(c.name, c.icon, c.title, c.desc, c.table, c.cols, c.fields));
});

// Create Aliases for the other tabs
const aliases = [
  { original: 'Deals', alias: 'Opportunities', title: 'Sales Opportunities' },
  { original: 'Accounts', alias: 'Customers', title: 'Active Customers' },
  { original: 'Contracts', alias: 'Quotations', title: 'Sent Quotations' },
  { original: 'Meetings', alias: 'FollowUps', title: 'Follow-ups' },
  { original: 'Meetings', alias: 'Calls', title: 'Call Logs' },
  { original: 'Meetings', alias: 'Emails', title: 'Email Tracking' },
  { original: 'CustomerSupport', alias: 'Complaints', title: 'Complaints Register' },
  { original: 'CustomerSupport', alias: 'Feedback', title: 'Customer Feedback' },
];

aliases.forEach(a => {
  let content = fs.readFileSync(`src/components/dashboards/${a.original}.tsx`, 'utf-8');
  content = content.replace(`export function ${a.original}()`, `export function ${a.alias}()`);
  content = content.replace(`> ${components.find(c=>c.name===a.original).title}`, `> ${a.title}`);
  fs.writeFileSync(`src/components/dashboards/${a.alias}.tsx`, content);
});

// Add CRMDashboard
const crmDash = `import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Users, Briefcase, Headset } from "lucide-react"

export function CRMDashboard({ onNavigateToTab }: { onNavigateToTab?: (tabId: string) => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">CRM Command Center</h2>
        <p className="text-gray-500">Manage customer relationships, sales pipelines, and support.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card onClick={() => onNavigateToTab?.('leads')} className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-indigo-500">
          <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-indigo-500"/> Leads</CardTitle></CardHeader>
          <CardContent><p className="text-gray-500">Track new prospects.</p></CardContent>
        </Card>
        <Card onClick={() => onNavigateToTab?.('accounts')} className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-blue-500">
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-500"/> Accounts</CardTitle></CardHeader>
          <CardContent><p className="text-gray-500">Manage clients.</p></CardContent>
        </Card>
        <Card onClick={() => onNavigateToTab?.('deals')} className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-emerald-500">
          <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-emerald-500"/> Deals</CardTitle></CardHeader>
          <CardContent><p className="text-gray-500">Sales pipeline.</p></CardContent>
        </Card>
        <Card onClick={() => onNavigateToTab?.('customer_support')} className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-orange-500">
          <CardHeader><CardTitle className="flex items-center gap-2"><Headset className="h-5 w-5 text-orange-500"/> Support</CardTitle></CardHeader>
          <CardContent><p className="text-gray-500">Resolve tickets.</p></CardContent>
        </Card>
      </div>
    </div>
  )
}
`;
fs.writeFileSync('src/components/dashboards/CRMDashboard.tsx', crmDash);

// Add SalesPipeline
const pipeline = `import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export function SalesPipeline({ onNavigateToTab }: { onNavigateToTab?: (tabId: string) => void }) {
  const stages = [
    { name: 'Prospecting', count: 12, value: 450000, color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { name: 'Proposal Sent', count: 5, value: 250000, color: 'bg-amber-100 text-amber-800 border-amber-200' },
    { name: 'Negotiation', count: 3, value: 300000, color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { name: 'Closed Won', count: 8, value: 850000, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><BarChart3 className="h-8 w-8 text-[#4B49AC]" /> Sales Pipeline</h2>
          <p className="text-gray-500 mt-2">Visual overview of all active deals.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stages.map(s => (
          <Card key={s.name} onClick={() => onNavigateToTab?.('deals')} className="cursor-pointer hover:shadow-md transition-all">
            <CardHeader className={\`pb-2 border-b \${s.color} bg-opacity-50\`}>
              <CardTitle className="text-sm font-bold">{s.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-gray-900">{s.count} Deals</div>
              <p className="text-sm font-medium text-gray-500 mt-1">₹{s.value.toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
`;
fs.writeFileSync('src/components/dashboards/SalesPipeline.tsx', pipeline);

console.log("CRM Modules generated.");
