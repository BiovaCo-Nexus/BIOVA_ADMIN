import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Receipt, Download, ShieldCheck, CheckCircle2, AlertCircle, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Props {
  initialTab?: "gst" | "tax"
}

export function TaxGSTCenter({ initialTab = "gst" }: Props) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const { toast } = useToast()

  const handleExportGSTReport = () => {
    toast({
      title: "GST Return Summary Exported",
      description: "Downloaded GSTR-1 & GSTR-3B tax report in Excel format."
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#4B49AC] flex items-center gap-2">
            <Receipt className="h-7 w-7 text-[#7DA0FA]" />
            GST Portal & Corporate Tax Compliance Center
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            GSTR-1, GSTR-3B, Input Tax Credit (ITC) reconciliation, TDS deductions, and advance corporate tax filing.
          </p>
        </div>
        <Button onClick={handleExportGSTReport} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-medium">
          <Download className="h-4 w-4 mr-1" /> Export GSTR Report
        </Button>
      </div>

      {/* Mode Switcher */}
      <div className="flex gap-2 border-b pb-3">
        <Button
          variant={activeTab === "gst" ? "default" : "outline"}
          onClick={() => setActiveTab("gst")}
          className={activeTab === "gst" ? "bg-[#4B49AC] text-white" : ""}
        >
          GST Returns & Input Tax Credit (ITC)
        </Button>
        <Button
          variant={activeTab === "tax" ? "default" : "outline"}
          onClick={() => setActiveTab("tax")}
          className={activeTab === "tax" ? "bg-[#4B49AC] text-white" : ""}
        >
          Corporate Income Tax & TDS Center
        </Button>
      </div>

      {activeTab === "gst" ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-blue-500 bg-blue-50/20">
              <CardContent className="pt-6">
                <div className="text-xs font-bold text-blue-900 uppercase">Output GST Collected (Sales)</div>
                <div className="text-3xl font-black text-[#4B49AC] mt-2">₹2,30,400</div>
                <div className="text-xs text-blue-700 mt-1">18% GST Rate Applied</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/20">
              <CardContent className="pt-6">
                <div className="text-xs font-bold text-emerald-900 uppercase">Input Tax Credit (ITC Paid)</div>
                <div className="text-3xl font-black text-emerald-900 mt-2">₹1,36,800</div>
                <div className="text-xs text-emerald-700 mt-1">Raw Material & Equipment Purchases</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 bg-purple-50/20">
              <CardContent className="pt-6">
                <div className="text-xs font-bold text-purple-900 uppercase">Net GST Liability Payable</div>
                <div className="text-3xl font-black text-purple-900 mt-2">₹93,600</div>
                <div className="text-xs text-purple-700 mt-1">Due Date: 20th August 2026</div>
              </CardContent>
            </Card>
          </div>

          {/* GST Return Filings Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground">GST Filing Schedule & Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead className="font-bold">Filing Period</TableHead>
                    <TableHead className="font-bold">Return Form</TableHead>
                    <TableHead className="font-bold">Taxable Turnover</TableHead>
                    <TableHead className="font-bold">Net GST Paid</TableHead>
                    <TableHead className="font-bold">ARN / Reference</TableHead>
                    <TableHead className="text-right font-bold">Filing Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold">July 2026</TableCell>
                    <TableCell><Badge variant="outline">GSTR-1</Badge></TableCell>
                    <TableCell className="font-mono">₹12,80,000</TableCell>
                    <TableCell className="font-mono">₹2,30,400</TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">AA2707260194821</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Filed & Verified</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold">July 2026</TableCell>
                    <TableCell><Badge variant="outline">GSTR-3B</Badge></TableCell>
                    <TableCell className="font-mono">₹12,80,000</TableCell>
                    <TableCell className="font-mono">₹93,600</TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">AA2707260849201</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Filed & Verified</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground">Corporate Income Tax & TDS Liability Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
                <div>
                  <div className="font-bold text-sm text-foreground">Corporate Income Tax Rate (Section 115BAA)</div>
                  <div className="text-xs text-gray-500">Concessional 22% tax rate for domestic manufacturing companies</div>
                </div>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">22% Base + Surcharge</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
                <div>
                  <div className="font-bold text-sm text-foreground">TDS Under Section 194C (Contractor Payments)</div>
                  <div className="text-xs text-gray-500">2% TDS deducted on vendor lab fabrication contracts</div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Deposited to Govt</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
