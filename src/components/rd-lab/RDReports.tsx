import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Download, FileSpreadsheet, FileText, Printer, Loader2, Database } from "lucide-react"

const MODULES = [
  { id: "rd_recipes", name: "Recipe Formulations", label: "Recipes" },
  { id: "rd_batch_trials", name: "Batch Trials", label: "Batch Trials" },
  { id: "rd_raw_materials", name: "Raw Material Library", label: "Raw Materials" },
  { id: "rd_inventory", name: "Ingredient Inventory", label: "Inventory" },
  { id: "rd_product_tests", name: "Product Testing", label: "Product Testing" },
  { id: "rd_shelf_life_tests", name: "Shelf Life Tests", label: "Shelf Life Tests" },
  { id: "rd_qc_checklists", name: "QC Checklists", label: "QC Checklists" },
  { id: "rd_manufacturing_sops", name: "Manufacturing SOPs", label: "Mfg SOPs" },
  { id: "rd_suppliers", name: "Supplier Database", label: "Suppliers" },
  { id: "rd_samples", name: "Sample Dispatches", label: "Samples" },
  { id: "rd_cost_calculations", name: "Cost Calculations", label: "Costing" }
]

export function RDReports() {
  const { toast } = useToast()
  const [selectedModule, setSelectedModule] = useState(MODULES[0].id)
  const [isExporting, setIsExporting] = useState(false)

  const formatValCSV = (key: string, val: any): string => {
    if (val === null || val === undefined) return '';
    
    let parsed = val;
    if (typeof val === 'string' && (val.trim().startsWith('[') || val.trim().startsWith('{'))) {
      try {
        parsed = JSON.parse(val);
      } catch (e) {
        // Fallback to original
      }
    }

    if (typeof parsed === 'object') {
      try {
        if (key === 'ingredients' && Array.isArray(parsed)) {
          return parsed.map((ing: any) => `${ing.name || ing}${ing.percentage ? ` (${ing.percentage})` : ''}`).join('; ');
        }
        if (key === 'steps' && Array.isArray(parsed)) {
          return parsed.map((step: any, idx: number) => `${idx + 1}. ${step}`).join('; ');
        }
        if (key === 'specifications') {
          if (Array.isArray(parsed)) {
            return parsed.map((spec: any) => `${spec.key || spec.property || ''}: ${spec.value || spec.requirement || ''}`).join('; ');
          }
          if (typeof parsed === 'object') {
            return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join('; ');
          }
        }
        if (Array.isArray(parsed)) {
          return parsed.join('; ');
        }
        return JSON.stringify(parsed);
      } catch (err) {
        return JSON.stringify(val);
      }
    }
    return String(val);
  };

  const formatValHTML = (key: string, val: any): string => {
    if (val === null || val === undefined) return `<span style="color:#cbd5e1">-</span>`;
    if (typeof val === 'boolean') {
      return `<strong style="color: ${val ? '#08A04B' : '#e53e3e'}">${val ? 'YES' : 'NO'}</strong>`;
    }

    let parsed = val;
    if (typeof val === 'string' && (val.trim().startsWith('[') || val.trim().startsWith('{'))) {
      try {
        parsed = JSON.parse(val);
      } catch (e) {
        // Fallback to original
      }
    }

    if (typeof parsed === 'object') {
      try {
        if (key === 'ingredients' && Array.isArray(parsed)) {
          if (parsed.length === 0) return `<span style="color:#cbd5e1">-</span>`;
          return `<ul style="margin: 0; padding-left: 15px; font-size: 8.5pt; text-align: left; list-style-type: disc;">
            ${parsed.map((ing: any) => `<li>${ing.name || ing} ${ing.percentage ? `<strong>(${ing.percentage})</strong>` : ''}</li>`).join('')}
          </ul>`;
        }
        
        if (key === 'steps' && Array.isArray(parsed)) {
          if (parsed.length === 0) return `<span style="color:#cbd5e1">-</span>`;
          return `<ol style="margin: 0; padding-left: 15px; font-size: 8.5pt; text-align: left;">
            ${parsed.map((step: any) => `<li>${step}</li>`).join('')}
          </ol>`;
        }

        if (key === 'specifications') {
          if (Array.isArray(parsed)) {
            if (parsed.length === 0) return `<span style="color:#cbd5e1">-</span>`;
            return `<ul style="margin: 0; padding-left: 15px; font-size: 8.5pt; text-align: left; list-style-type: square;">
              ${parsed.map((spec: any) => `<li><strong>${spec.key || spec.property || ''}:</strong> ${spec.value || spec.requirement || ''}</li>`).join('')}
            </ul>`;
          }
          if (typeof parsed === 'object') {
            const entries = Object.entries(parsed);
            if (entries.length === 0) return `<span style="color:#cbd5e1">-</span>`;
            return `<ul style="margin: 0; padding-left: 15px; font-size: 8.5pt; text-align: left;">
              ${entries.map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('')}
            </ul>`;
          }
        }

        if (Array.isArray(parsed)) {
          return parsed.join(', ');
        }
        
        return `<div class="json-block">${JSON.stringify(parsed, null, 2)}</div>`;
      } catch (err) {
        return `<div class="json-block">${JSON.stringify(val, null, 2)}</div>`;
      }
    }
    return String(val);
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true)
      const moduleName = MODULES.find(m => m.id === selectedModule)?.name || "Report"
      
      const { data, error } = await supabase.from(selectedModule).select("*")
      if (error) throw error
      
      if (!data || data.length === 0) {
        toast({ title: "No data available", description: "This module has no records to export." })
        return
      }

      // Convert objects/JSON to formatted strings for CSV
      const processedData = data.map(row => {
        const newRow: any = {}
        Object.keys(row).forEach(key => {
          newRow[key] = formatValCSV(key, row[key])
        })
        return newRow
      })

      // Generate CSV
      const headers = Object.keys(processedData[0])
      const csvRows = [
        headers.map(h => `"${h.replace(/_/g, ' ').toUpperCase()}"`).join(","),
        ...processedData.map(row => 
          headers.map(header => {
            const val = row[header]
            if (val === null || val === undefined) return '""'
            // Escape quotes and wrap in quotes for CSV safety
            const strVal = String(val).replace(/"/g, '""')
            return `"${strVal}"`
          }).join(",")
        )
      ]
      
      const csvContent = csvRows.join("\n")
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      
      link.setAttribute("href", url)
      link.setAttribute("download", `${moduleName.replace(/\s+/g, '_')}_Export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({ title: "Export Successful", description: "CSV file has been downloaded. You can open this in Excel." })
    } catch (e: any) {
      toast({ title: "Export Failed", description: e.message, variant: "destructive" })
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = async () => {
    try {
      setIsExporting(true)
      const moduleInfo = MODULES.find(m => m.id === selectedModule)
      const { data, error } = await supabase.from(selectedModule).select("*")
      if (error) throw error
      
      if (!data || data.length === 0) {
        toast({ title: "No data to print" }); return
      }

      // Filter out internal system columns for the print report
      const excludeCols = ["id", "created_at", "updated_at"];
      const headers = Object.keys(data[0]).filter(h => !excludeCols.includes(h));
      
      let html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${moduleInfo?.name} Report - BiovaCo Nexus</title>
            <style>
              @page { size: landscape; margin: 15mm; }
              body { 
                font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
                padding: 0; margin: 0; color: #1a1a1a; 
                font-size: 10pt; line-height: 1.4;
              }
              .header { 
                display: flex; justify-content: space-between; align-items: flex-end;
                border-bottom: 3px solid #032E63; padding-bottom: 15px; margin-bottom: 25px;
              }
              .brand { color: #032E63; font-size: 24pt; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
              .brand span { color: #08A04B; }
              .report-title { font-size: 16pt; color: #4a5568; font-weight: 600; margin: 5px 0 0 0; }
              .meta-info { text-align: right; font-size: 9pt; color: #718096; }
              
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; vertical-align: top; }
              th { 
                background-color: #f8fafc; color: #032E63; font-weight: 700; 
                text-transform: uppercase; font-size: 8pt; letter-spacing: 0.5px;
              }
              tr:nth-child(even) { background-color: #f8fafc; }
              
              .json-block {
                font-family: monospace; font-size: 8pt; white-space: pre-wrap;
                word-break: break-word; max-width: 300px;
                background: #f1f5f9; padding: 6px; border-radius: 4px;
              }
              
              .footer { 
                margin-top: 40px; font-size: 8pt; color: #a0aec0; text-align: center;
                border-top: 1px solid #e2e8f0; padding-top: 15px;
              }
              
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
                thead { display: table-header-group; }
                tfoot { display: table-footer-group; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1 class="brand">BiovaCo <span>Nexus</span></h1>
                <h2 class="report-title">R&D Lab: ${moduleInfo?.name} Master Report</h2>
              </div>
              <div class="meta-info">
                <strong>Generated On:</strong> ${new Date().toLocaleString()}<br/>
                <strong>Status:</strong> CONFIDENTIAL
              </div>
            </div>
            
            <table>
              <thead>
                <tr>${headers.map(h => `<th>${h.replace(/_/g, ' ')}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${data.map(row => `
                  <tr>
                    ${headers.map(h => `<td>${formatValHTML(h, row[h])}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <strong>BiovaCo Nexus R&D OS</strong> &bull; Proprietary & Confidential Document &bull; Do Not Distribute
            </div>
          </body>
        </html>
      `
      
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        // Small delay to allow CSS to render
        setTimeout(() => {
          printWindow.print()
        }, 250)
      }
    } catch (e: any) {
      toast({ title: "Print Failed", description: e.message, variant: "destructive" })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#032E63]">R&D Data Reports</h2>
          <p className="text-sm text-gray-500">Export and print master data from across the lab system.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-t-4 border-t-[#032E63] shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><Database className="h-5 w-5 mr-2 text-[#032E63]" /> Data Extraction</CardTitle>
            <CardDescription>Select a module to export its entire master record set.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select R&D Module</label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select module..." />
                </SelectTrigger>
                <SelectContent>
                  {MODULES.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleExportCSV} 
                disabled={isExporting}
                className="flex-1 bg-[#08A04B] hover:bg-[#069a43] text-white"
              >
                {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                Export CSV (Excel)
              </Button>
              <Button 
                onClick={handlePrint} 
                disabled={isExporting}
                variant="outline"
                className="flex-1 border-[#032E63] text-[#032E63] hover:bg-blue-50"
              >
                {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
                Print / Save as PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
            <Download className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Professional OS Reporting</h3>
            <p className="text-sm">
              Use <strong>Export CSV</strong> to manipulate lab data directly in Microsoft Excel or Google Sheets. 
              <br/><br/>
              Use <strong>Print / PDF</strong> to generate formatted HTML tables suitable for physical documentation or sharing as strict PDF reports.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
