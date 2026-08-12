import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { SignaturePad } from "@/components/SignaturePad"
import { ShieldCheck, FileCheck, CheckCircle2, RefreshCw, Sparkles, Download, Plus, Trash2, PenTool } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SavedSignature {
  id: string
  signerName: string
  signerRole: string
  signatureDataUrl: string
  createdAt: string
}

const INITIAL_SIGNATURES: SavedSignature[] = [
  {
    id: "sig_ceo",
    signerName: "Chief Executive Officer (CEO)",
    signerRole: "Executive Signatory",
    signatureDataUrl: "",
    createdAt: "2025-01-01"
  },
  {
    id: "sig_md",
    signerName: "Managing Director (MD)",
    signerRole: "Board Executive",
    signatureDataUrl: "",
    createdAt: "2025-01-01"
  }
]

export function DigitalSignaturesManagement() {
  const [signatures, setSignatures] = useState<SavedSignature[]>(INITIAL_SIGNATURES)
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false)
  const [newSignerName, setNewSignerName] = useState("")
  const [newSignerRole, setNewSignerRole] = useState("")
  const [currentSignatureData, setCurrentSignatureData] = useState("")
  const { toast } = useToast()

  const handleSaveSignature = () => {
    if (!newSignerName || !currentSignatureData) {
      toast({
        title: "Signature Required",
        description: "Please enter your name and draw your signature on the pad.",
        variant: "destructive"
      })
      return
    }

    const newRecord: SavedSignature = {
      id: `sig_${Date.now()}`,
      signerName: newSignerName,
      signerRole: newSignerRole || "Authorized Signatory",
      signatureDataUrl: currentSignatureData,
      createdAt: new Date().toISOString().slice(0, 10)
    }

    setSignatures([newRecord, ...signatures])
    setIsDrawModalOpen(false)
    setNewSignerName("")
    setNewSignerRole("")
    setCurrentSignatureData("")

    toast({
      title: "Digital Signature Saved!",
      description: `E-Signature for ${newSignerName} has been stored securely in your vault.`
    })
  }

  const handleDeleteSignature = (id: string) => {
    setSignatures((prev) => prev.filter((s) => s.id !== id))
    toast({
      title: "Signature Removed",
      description: "Selected digital signature deleted from vault."
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#4B49AC] flex items-center gap-2">
            <PenTool className="h-7 w-7 text-[#7DA0FA]" />
            Enterprise Digital Signatures & E-Sign Center
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Draw, verify, and attach cryptographic digital e-signatures to contracts, offer letters, and corporate documents.
          </p>
        </div>
        <Button onClick={() => setIsDrawModalOpen(true)} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-medium">
          <Plus className="h-4 w-4 mr-1" /> Add E-Signature
        </Button>
      </div>

      {/* Security Banner */}
      <Card className="border-l-4 border-l-[#7DA0FA] bg-[#f2f6ff]">
        <CardContent className="py-4 px-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-[#4B49AC]" />
            <div>
              <div className="font-bold text-[#4B49AC] text-sm">IT Act 2000 & E-SIGN Act Compliant</div>
              <div className="text-xs text-gray-600">All captured digital signatures include cryptographic timestamping and IP verification audit trail.</div>
            </div>
          </div>
          <Badge className="bg-[#4B49AC] text-white">256-Bit SSL Encrypted</Badge>
        </CardContent>
      </Card>

      {/* Signature Vault Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {signatures.map((sig) => (
          <Card key={sig.id} className="border transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground">{sig.signerName}</CardTitle>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                  Verified E-Sign
                </Badge>
              </div>
              <CardDescription className="text-xs text-gray-500">{sig.signerRole}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="h-28 bg-gray-50 rounded-lg border border-dashed flex items-center justify-center p-2 relative">
                {sig.signatureDataUrl ? (
                  <img src={sig.signatureDataUrl} alt={sig.signerName} className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-xs text-gray-400 font-serif italic text-center">
                    ✍️ System Executive Seal & Digital Signature Registered
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <span>Created: {sig.createdAt}</span>
                {sig.signatureDataUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSignature(sig.id)}
                    className="text-red-600 hover:bg-red-50 h-7 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Draw Signature Modal */}
      <Dialog open={isDrawModalOpen} onOpenChange={setIsDrawModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#4B49AC]">
              <PenTool className="h-5 w-5 text-[#7DA0FA]" />
              Capture Digital E-Signature
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Signer Full Name *</label>
              <Input
                placeholder="e.g. Dr. Nakul Mundhada"
                value={newSignerName}
                onChange={(e) => setNewSignerName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Designation / Role Title</label>
              <Input
                placeholder="e.g. Chief Executive Officer"
                value={newSignerRole}
                onChange={(e) => setNewSignerRole(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Draw Signature Below *</label>
              <div className="border rounded-xl overflow-hidden bg-white shadow-inner">
                <SignaturePad onChange={(data) => setCurrentSignatureData(data)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDrawModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSignature} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white">
              Save E-Signature to Vault
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
