import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Key, Eye, EyeOff, Copy, Plus, Check, RefreshCw, ShieldAlert, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import { getEmailConfig } from "@/utils/emailService"

interface APIKeyRecord {
  id: string
  name: string
  service: string
  keyMasked: string
  fullKey: string
  status: "Active" | "Revoked" | "Expired"
  lastUsed: string
  createdDate: string
}

export function APIKeysManagement() {
  const emailCfg = getEmailConfig()
  const realBrevoKey = emailCfg.apiKey || "xkeysib-92f7a10293847561029384756-8d31a"
  const maskedBrevoKey = `${realBrevoKey.substring(0, 10)}...${realBrevoKey.substring(Math.max(0, realBrevoKey.length - 5))}`

  const INITIAL_KEYS: APIKeyRecord[] = [
    {
      id: "key_brevo_1",
      name: "Brevo SMTP Bulk Email API Key",
      service: "Brevo Email API",
      keyMasked: maskedBrevoKey,
      fullKey: realBrevoKey,
      status: "Active",
      lastUsed: "Just now",
      createdDate: "2025-01-15"
    },
    {
      id: "key_supabase_anon",
      name: "Supabase Public Anon Key",
      service: "Supabase Database & Auth",
      keyMasked: "eyJhbGciOiJIUzI1Ni...2b8c9",
      fullKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0Y3p6b3l1cmZ4bGpkZWloYW5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE4MTIzNDUsImV4cCI6MjAzNzM4ODM0NX0.xxxxxx",
      status: "Active",
      lastUsed: "Continuous",
      createdDate: "2025-01-01"
    },
    {
      id: "key_openrouter_ai",
      name: "OpenRouter AI Compliance Lawyer Key",
      service: "AI Lawyer / LLM Engine",
      keyMasked: "sk-or-v1-84a...92b1",
      fullKey: "sk-or-v1-84a01928374650192837465-92b1",
      status: "Active",
      lastUsed: "10 mins ago",
      createdDate: "2025-02-10"
    },
    {
      id: "key_razorpay_pay",
      name: "Razorpay Payment Gateway Key",
      service: "Payment Processing",
      keyMasked: "rzp_live_89...102a",
      fullKey: "rzp_live_891029384756102a",
      status: "Active",
      lastUsed: " Yesterday",
      createdDate: "2025-03-01"
    }
  ]

  const [keys, setKeys] = useState<APIKeyRecord[]>(INITIAL_KEYS)
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyService, setNewKeyService] = useState("Internal Webhook")
  const { toast } = useToast()

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const copyToClipboard = (id: string, keyText: string) => {
    navigator.clipboard.writeText(keyText)
    setCopiedId(id)
    toast({
      title: "Key Copied",
      description: "API Key copied to clipboard securely."
    })
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleGenerateKey = () => {
    if (!newKeyName) {
      toast({ title: "Name Required", description: "Please enter a key identifier name.", variant: "destructive" })
      return
    }

    const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const generatedKey = `bv_live_${randomString}`
    const newRecord: APIKeyRecord = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      service: newKeyService,
      keyMasked: `${generatedKey.substring(0, 10)}...${generatedKey.substring(generatedKey.length - 4)}`,
      fullKey: generatedKey,
      status: "Active",
      lastUsed: "Never",
      createdDate: new Date().toISOString().slice(0, 10)
    }

    setKeys([newRecord, ...keys])
    setIsGenerateModalOpen(false)
    setNewKeyName("")
    toast({
      title: "API Key Created",
      description: `Generated new secret key for ${newKeyName}.`
    })
  }

  const revokeKey = (id: string) => {
    setKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: "Revoked" } : k))
    )
    toast({
      title: "Key Revoked",
      description: "The selected API key has been revoked and deactivated."
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#4B49AC] flex items-center gap-2">
            <Key className="h-7 w-7 text-[#7DA0FA]" />
            Enterprise API Keys Vault & Secret Manager
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Securely manage, generate, mask, and monitor third-party API credentials, secret tokens, and webhook keys.
          </p>
        </div>
        <Button onClick={() => setIsGenerateModalOpen(true)} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-medium">
          <Plus className="h-4 w-4 mr-1" /> Generate New Key
        </Button>
      </div>

      {/* Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground flex items-center justify-between">
            <span>Configured API Tokens ({keys.length})</span>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              🔒 TLS 1.3 Encryption Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead className="font-bold">Key Identifier</TableHead>
                  <TableHead className="font-bold">Service / Engine</TableHead>
                  <TableHead className="font-bold">Secret Key Token</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Last Activity</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => {
                  const isVisible = visibleKeys[k.id]
                  return (
                    <TableRow key={k.id}>
                      <TableCell className="font-semibold text-foreground">{k.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-[#7DA0FA]/15 text-[#4B49AC]">
                          {k.service}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded border">
                          {isVisible ? k.fullKey : k.keyMasked}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            k.status === "Active"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-red-100 text-red-800 border-red-200"
                          }
                        >
                          {k.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{k.lastUsed}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyVisibility(k.id)}
                            title={isVisible ? "Hide secret" : "Reveal secret"}
                          >
                            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(k.id, k.fullKey)}
                            title="Copy full key"
                          >
                            {copiedId === k.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          {k.status === "Active" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => revokeKey(k.id)}
                              className="text-red-600 hover:bg-red-50"
                              title="Revoke key"
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Generate Key Modal */}
      <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#4B49AC]">
              <Key className="h-5 w-5 text-[#7DA0FA]" />
              Generate Enterprise API Key
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Key Name / Description *</label>
              <Input
                placeholder="e.g. WhatsApp Bot API Secret"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Target Service</label>
              <Input
                placeholder="e.g. Webhook Service"
                value={newKeyService}
                onChange={(e) => setNewKeyService(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateKey} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white">
              Generate Key Token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
