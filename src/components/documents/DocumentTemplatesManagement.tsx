import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { FileText, Search, Sparkles, Download, Eye, Plus, ArrowRight, ShieldCheck, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DocumentTemplate {
  id: string
  title: string
  category: string
  description: string
  placeholders: string[]
  format: "PDF" | "DOCX" | "HTML"
  version: string
  lastUpdated: string
}

const DEFAULT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "tpl_offer_letter",
    title: "Standard Executive Offer Letter",
    category: "HR & Recruitment",
    description: "Official employment offer template including CTC breakup, joining date, probationary terms, and seal stamp.",
    placeholders: ["Candidate Name", "Designation", "Joining Date", "Annual CTC"],
    format: "PDF",
    version: "v2.4",
    lastUpdated: "2026-07-15"
  },
  {
    id: "tpl_nda_agreement",
    title: "Corporate Non-Disclosure Agreement (NDA)",
    category: "Legal & Compliance",
    description: "Bilingual mutual non-disclosure agreement protecting proprietary R&D formulas, trade secrets, and IP assets.",
    placeholders: ["Party A Name", "Party B Name", "Effective Date", "Jurisdiction"],
    format: "PDF",
    version: "v3.1",
    lastUpdated: "2026-06-20"
  },
  {
    id: "tpl_service_invoice",
    title: "Tax Invoice & Bill of Supply",
    category: "Finance & Accounting",
    description: "GST-compliant corporate tax invoice template with automatic tax breakdown, HSN/SAC codes, and QR code.",
    placeholders: ["Invoice No", "Customer GSTIN", "Line Items", "Total Amount"],
    format: "PDF",
    version: "v1.8",
    lastUpdated: "2026-07-01"
  },
  {
    id: "tpl_po_order",
    title: "Vendor Purchase Order (PO)",
    category: "Procurement",
    description: "Standardized procurement order agreement outlining delivery timelines, payment terms, and inspection checks.",
    placeholders: ["PO Number", "Vendor Name", "Material Specs", "Delivery Date"],
    format: "PDF",
    version: "v2.0",
    lastUpdated: "2026-05-10"
  },
  {
    id: "tpl_rd_trial_protocol",
    title: "R&D Bio-Formulation Testing Protocol",
    category: "Research & Development",
    description: "Standardized laboratory test sheet for recording trial batch stability, pH levels, and biological growth results.",
    placeholders: ["Trial ID", "Researcher Name", "Formulation Code", "Observations"],
    format: "DOCX",
    version: "v1.2",
    lastUpdated: "2026-04-12"
  }
]

interface Props {
  onNavigateToTab?: (tabId: string, payload?: any) => void
}

export function DocumentTemplatesManagement({ onNavigateToTab }: Props) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>(DEFAULT_TEMPLATES)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null)
  const { toast } = useToast()

  const handleUseTemplate = (tpl: DocumentTemplate) => {
    toast({
      title: "Template Loaded",
      description: `Loading "${tpl.title}" into Document Generator...`
    })

    if (onNavigateToTab) {
      onNavigateToTab("document_generator", {
        documentType: tpl.title.includes("Offer") ? "offer_letter" : "contract",
        templateName: tpl.title,
        category: tpl.category
      })
    }
  }

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      selectedCategory === "all" || t.category.toLowerCase().includes(selectedCategory.toLowerCase())

    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#4B49AC] flex items-center gap-2">
            <FileText className="h-7 w-7 text-[#7DA0FA]" />
            Enterprise Document Templates Vault
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Standardized corporate contracts, offer letters, tax invoices, purchase orders, and legal agreement templates.
          </p>
        </div>
      </div>

      {/* Filter & Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates by title, keyword, or placeholder..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="hr">HR & Recruitment</SelectItem>
                <SelectItem value="legal">Legal & Compliance</SelectItem>
                <SelectItem value="finance">Finance & Accounting</SelectItem>
                <SelectItem value="procurement">Procurement</SelectItem>
                <SelectItem value="research">Research & Development</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((tpl) => (
          <Card key={tpl.id} className="flex flex-col justify-between border transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="bg-[#f2f6ff] text-[#4B49AC] border-[#7DA0FA]/30">
                  {tpl.category}
                </Badge>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {tpl.version}
                </Badge>
              </div>
              <CardTitle className="text-base font-bold text-foreground mt-2">{tpl.title}</CardTitle>
              <CardDescription className="text-xs text-gray-600 line-clamp-2 mt-1">
                {tpl.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Dynamic Placeholders</div>
                <div className="flex flex-wrap gap-1.5">
                  {tpl.placeholders.map((ph) => (
                    <span key={ph} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded border">
                      {`{{${ph}}}`}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewTemplate(tpl)}
                  className="text-gray-600 hover:text-foreground text-xs"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleUseTemplate(tpl)}
                  className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white text-xs font-medium"
                >
                  Use Template <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#4B49AC]">
              <FileText className="h-5 w-5 text-[#7DA0FA]" />
              {previewTemplate?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3 text-xs text-gray-700">
            <div className="p-4 bg-gray-50 rounded-lg border font-mono space-y-2">
              <div className="font-bold text-sm text-[#4B49AC]">{previewTemplate?.title.toUpperCase()}</div>
              <div>Category: {previewTemplate?.category}</div>
              <div>Version: {previewTemplate?.version} (Updated: {previewTemplate?.lastUpdated})</div>
              <hr className="my-2" />
              <p className="text-gray-600 italic leading-relaxed">
                "{previewTemplate?.description}"
              </p>
              <div className="pt-2 font-bold text-gray-900">Fields to fill:</div>
              <ul className="list-disc pl-4 space-y-1">
                {previewTemplate?.placeholders.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
            {previewTemplate && (
              <Button onClick={() => { handleUseTemplate(previewTemplate); setPreviewTemplate(null); }} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white">
                Generate Document
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
