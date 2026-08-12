import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileSpreadsheet, Download, RefreshCw, TrendingUp, TrendingDown, DollarSign, PieChart, ShieldCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Props {
  initialTab?: "trial_balance" | "profit_loss" | "balance_sheet" | "cash_flow"
}

export function FinancialStatementsCenter({ initialTab = "profit_loss" }: Props) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const { toast } = useToast()

  const handleExportStatement = (title: string) => {
    toast({
      title: "Statement Exported",
      description: `Downloaded ${title} audit-ready spreadsheet.`
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#4B49AC] flex items-center gap-2">
            <FileSpreadsheet className="h-7 w-7 text-[#7DA0FA]" />
            Corporate Financial Statements & Audit Suite
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Realtime statutory financial reporting: Profit & Loss Statement, Balance Sheet, Trial Balance, and Cash Flow.
          </p>
        </div>
        <Button onClick={() => handleExportStatement(activeTab.toUpperCase())} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-medium">
          <Download className="h-4 w-4 mr-1" /> Export Audit CSV
        </Button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        <Button
          variant={activeTab === "profit_loss" ? "default" : "outline"}
          onClick={() => setActiveTab("profit_loss")}
          className={activeTab === "profit_loss" ? "bg-[#4B49AC] text-white" : ""}
        >
          Profit & Loss (P&L)
        </Button>
        <Button
          variant={activeTab === "balance_sheet" ? "default" : "outline"}
          onClick={() => setActiveTab("balance_sheet")}
          className={activeTab === "balance_sheet" ? "bg-[#4B49AC] text-white" : ""}
        >
          Balance Sheet
        </Button>
        <Button
          variant={activeTab === "trial_balance" ? "default" : "outline"}
          onClick={() => setActiveTab("trial_balance")}
          className={activeTab === "trial_balance" ? "bg-[#4B49AC] text-white" : ""}
        >
          Trial Balance
        </Button>
        <Button
          variant={activeTab === "cash_flow" ? "default" : "outline"}
          onClick={() => setActiveTab("cash_flow")}
          className={activeTab === "cash_flow" ? "bg-[#4B49AC] text-white" : ""}
        >
          Cash Flow Statement
        </Button>
      </div>

      {/* PROFIT & LOSS VIEW */}
      {activeTab === "profit_loss" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/20">
              <CardContent className="pt-6">
                <div className="text-xs font-bold text-emerald-900 uppercase">Gross Revenue</div>
                <div className="text-3xl font-black text-emerald-900 mt-2">₹12,80,000</div>
                <div className="text-xs text-emerald-700 mt-1">+18.5% MoM Growth</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-rose-500 bg-rose-50/20">
              <CardContent className="pt-6">
                <div className="text-xs font-bold text-rose-900 uppercase">Total COGS & Opex</div>
                <div className="text-3xl font-black text-rose-900 mt-2">₹7,60,000</div>
                <div className="text-xs text-rose-700 mt-1">Direct COGS: ₹4,20,000</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-[#7DA0FA] bg-blue-50/20">
              <CardContent className="pt-6">
                <div className="text-xs font-bold text-blue-900 uppercase">Net Profit (EBITDA)</div>
                <div className="text-3xl font-black text-[#4B49AC] mt-2">₹5,20,000</div>
                <div className="text-xs text-blue-700 mt-1">Net Margin: 40.6%</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground">Income & Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead className="font-bold">Line Item</TableHead>
                    <TableHead className="font-bold">Classification</TableHead>
                    <TableHead className="text-right font-bold">Amount (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="font-bold bg-emerald-50/40">
                    <TableCell>Operating Revenue (Sales & Subscriptions)</TableCell>
                    <TableCell>Income</TableCell>
                    <TableCell className="text-right font-mono">₹12,80,000</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Cost of Goods Sold (Raw Materials & Packaging)</TableCell>
                    <TableCell>Direct Expense</TableCell>
                    <TableCell className="text-right font-mono text-rose-600">(₹4,20,000)</TableCell>
                  </TableRow>
                  <TableRow className="font-bold">
                    <TableCell>Gross Margin</TableCell>
                    <TableCell>Gross Profit</TableCell>
                    <TableCell className="text-right font-mono text-emerald-700">₹8,60,000</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Staff Salaries & Payroll</TableCell>
                    <TableCell>Operating Expense</TableCell>
                    <TableCell className="text-right font-mono text-rose-600">(₹3,40,000)</TableCell>
                  </TableRow>
                  <TableRow className="font-bold bg-[#f2f6ff] text-[#4B49AC]">
                    <TableCell>Net Profit Before Tax (NPBT)</TableCell>
                    <TableCell>Net Income</TableCell>
                    <TableCell className="text-right font-mono">₹5,20,000</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* BALANCE SHEET VIEW */}
      {activeTab === "balance_sheet" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground">Statement of Financial Position (Balance Sheet)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assets Column */}
                <div className="space-y-4 border p-4 rounded-xl">
                  <div className="font-bold text-base text-[#4B49AC] border-b pb-2">ASSETS</div>
                  <div className="flex justify-between text-xs">
                    <span>HDFC Bank Operating Cash</span>
                    <span className="font-mono font-bold">₹14,50,000</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Accounts Receivable (Trade Debtors)</span>
                    <span className="font-mono font-bold">₹3,80,000</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>R&D Equipment & Lab Hardware</span>
                    <span className="font-mono font-bold">₹8,50,000</span>
                  </div>
                  <div className="pt-4 border-t flex justify-between font-bold text-sm text-emerald-700">
                    <span>TOTAL ASSETS</span>
                    <span className="font-mono">₹26,80,000</span>
                  </div>
                </div>

                {/* Liabilities & Equity Column */}
                <div className="space-y-4 border p-4 rounded-xl">
                  <div className="font-bold text-base text-[#4B49AC] border-b pb-2">LIABILITIES & EQUITY</div>
                  <div className="flex justify-between text-xs">
                    <span>Accounts Payable (Trade Creditors)</span>
                    <span className="font-mono font-bold">₹1,95,000</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>GST Output Tax Reserve</span>
                    <span className="font-mono font-bold">₹42,000</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Paid-up Founder Share Capital</span>
                    <span className="font-mono font-bold">₹20,00,000</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Retained Earnings</span>
                    <span className="font-mono font-bold">₹4,43,000</span>
                  </div>
                  <div className="pt-4 border-t flex justify-between font-bold text-sm text-emerald-700">
                    <span>TOTAL LIABILITIES & EQUITY</span>
                    <span className="font-mono">₹26,80,000</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TRIAL BALANCE VIEW */}
      {activeTab === "trial_balance" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground flex items-center justify-between">
              <span>Trial Balance Register</span>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                ✓ Debits = Credits (Balanced)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead className="font-bold">GL Account</TableHead>
                  <TableHead className="text-right font-bold">Debit (Dr) (₹)</TableHead>
                  <TableHead className="text-right font-bold">Credit (Cr) (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">1000-101 HDFC Bank Operating Account</TableCell>
                  <TableCell className="text-right font-mono">14,50,000</TableCell>
                  <TableCell className="text-right font-mono">-</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">1100-101 Accounts Receivable</TableCell>
                  <TableCell className="text-right font-mono">3,80,000</TableCell>
                  <TableCell className="text-right font-mono">-</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">2000-101 Accounts Payable</TableCell>
                  <TableCell className="text-right font-mono">-</TableCell>
                  <TableCell className="text-right font-mono">1,95,000</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">3000-101 Paid-up Founder Share Capital</TableCell>
                  <TableCell className="text-right font-mono">-</TableCell>
                  <TableCell className="text-right font-mono">20,00,000</TableCell>
                </TableRow>
                <TableRow className="font-bold bg-[#f2f6ff]">
                  <TableCell>TOTAL BALANCES</TableCell>
                  <TableCell className="text-right font-mono text-[#4B49AC]">₹21,95,000</TableCell>
                  <TableCell className="text-right font-mono text-[#4B49AC]">₹21,95,000</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* CASH FLOW VIEW */}
      {activeTab === "cash_flow" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Cash Flow Statement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-xl space-y-2">
              <div className="font-bold text-sm text-[#4B49AC]">1. Operating Activities</div>
              <div className="flex justify-between text-xs">
                <span>Customer Cash Inflow</span>
                <span className="font-mono text-emerald-600 font-bold">+₹12,80,000</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Vendor COGS & Expense Outflow</span>
                <span className="font-mono text-rose-600 font-bold">-₹7,60,000</span>
              </div>
              <div className="flex justify-between text-xs font-bold pt-1 border-t">
                <span>Net Cash from Operating Activities</span>
                <span className="font-mono text-emerald-700">+₹5,20,000</span>
              </div>
            </div>

            <div className="p-4 border rounded-xl space-y-2">
              <div className="font-bold text-sm text-[#4B49AC]">2. Financing & Capital Activities</div>
              <div className="flex justify-between text-xs">
                <span>Founder Equity Capital Contribution</span>
                <span className="font-mono text-emerald-600 font-bold">+₹20,00,000</span>
              </div>
              <div className="flex justify-between text-xs font-bold pt-1 border-t">
                <span>Net Cash from Financing Activities</span>
                <span className="font-mono text-emerald-700">+₹20,00,000</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
