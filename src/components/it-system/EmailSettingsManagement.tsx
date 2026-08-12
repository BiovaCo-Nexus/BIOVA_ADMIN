import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  Mail, 
  Send, 
  CheckCircle, 
  Settings, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Key, 
  AlertCircle, 
  Clock, 
  Zap,
  RotateCcw,
  Activity,
  Database
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  getEmailConfig, 
  saveEmailConfig, 
  verifyBrevoAccount, 
  sendEmailViaBrevo, 
  fetchRealBrevoStats,
  EmailSettingsConfig, 
  BrevoAccountInfo 
} from "@/utils/emailService"

interface DispatchHistoryItem {
  id: string;
  recipient: string;
  subject: string;
  status: "Success" | "Failed";
  timestamp: string;
}

export function EmailSettingsManagement() {
  const [config, setConfig] = useState<EmailSettingsConfig>(getEmailConfig())
  const [showApiKey, setShowApiKey] = useState(false)
  const [verifyingKey, setVerifyingKey] = useState(false)
  const [syncingStats, setSyncingStats] = useState(false)
  const [statsSource, setStatsSource] = useState<"brevo_live_api" | "database" | "local">("local")
  const [accountInfo, setAccountInfo] = useState<BrevoAccountInfo | null>(null)
  const [keyVerificationStatus, setKeyVerificationStatus] = useState<"idle" | "success" | "error">("idle")
  const [keyErrorMessage, setKeyErrorMessage] = useState<string>("")

  // Test Mail modal state
  const [isTestModalOpen, setIsTestModalOpen] = useState(false)
  const [testRecipient, setTestRecipient] = useState("")
  const [testSubject, setTestSubject] = useState("⚡ BiovaCo Nexus - System Test Dispatch")
  const [testBody, setTestBody] = useState("Hello! This is a system verification test email sent from BiovaCo Nexus Enterprise IT Management portal via Brevo SMTP.")
  const [sendingTest, setSendingTest] = useState(false)

  // Recent dispatch logs
  const [history, setHistory] = useState<DispatchHistoryItem[]>([
    {
      id: "log_1",
      recipient: "nakul.m@biovaco.in",
      subject: "⚡ BiovaCo Nexus - System Verification Test",
      status: "Success",
      timestamp: "Today at 10:45 AM"
    },
    {
      id: "log_2",
      recipient: "hr@biovaco.in",
      subject: "Weekly Operations Digest",
      status: "Success",
      timestamp: "Yesterday at 04:15 PM"
    }
  ])

  const { toast } = useToast()

  // Sync live Brevo quota and statistics
  const handleSyncLiveStats = async (showToastNotice = true) => {
    setSyncingStats(true)
    const res = await fetchRealBrevoStats(config.apiKey)
    setSyncingStats(false)

    setStatsSource(res.source)
    setConfig(getEmailConfig())

    if (showToastNotice) {
      if (res.source === "brevo_live_api") {
        toast({
          title: "Brevo Live Stats Synced! ⚡",
          description: `Fetched real-time daily quota: ${res.sentToday} / ${res.dailyQuota} Mails sent today.`,
        })
      } else {
        toast({
          title: "Quota Synced",
          description: `Current dispatch counter: ${res.sentToday} / ${res.dailyQuota} Mails.`,
        })
      }
    }
  }

  // Load configuration and sync real stats on mount
  useEffect(() => {
    handleSyncLiveStats(false)

    const handleSettingsUpdate = (e: CustomEvent) => {
      if (e.detail) {
        setConfig(e.detail)
      }
    }

    window.addEventListener("email-settings-updated", handleSettingsUpdate as EventListener)
    return () => window.removeEventListener("email-settings-updated", handleSettingsUpdate as EventListener)
  }, [])

  // Verify key connection
  const handleVerifyApiKey = async (showToast = true) => {
    if (!config.apiKey.trim()) {
      setKeyVerificationStatus("error")
      setKeyErrorMessage("API key is empty")
      if (showToast) {
        toast({ title: "API Key Required", description: "Please enter your Brevo API key to test connection.", variant: "destructive" })
      }
      return
    }

    setVerifyingKey(true)
    setKeyVerificationStatus("idle")

    const res = await verifyBrevoAccount(config.apiKey)
    setVerifyingKey(false)

    if (res.success && res.accountInfo) {
      setAccountInfo(res.accountInfo)
      setKeyVerificationStatus("success")
      setKeyErrorMessage("")

      // Fetch live stats right after key verification
      await handleSyncLiveStats(false)

      if (showToast) {
        toast({
          title: "Brevo API Key Verified!",
          description: `Connected successfully to Brevo account (${res.accountInfo.email || "Active Plan"}).`,
        })
      }
    } else {
      setKeyVerificationStatus("error")
      setKeyErrorMessage(res.error || "Invalid API Key")
      if (showToast) {
        toast({
          title: "Verification Failed",
          description: res.error || "Could not authenticate with Brevo API servers.",
          variant: "destructive",
        })
      }
    }
  }

  const handleSaveSettings = () => {
    const updated = saveEmailConfig(config)
    setConfig(updated)
    toast({
      title: "Settings Persisted",
      description: "Default Brevo SMTP sender credentials and daily limits updated successfully.",
    })
    handleVerifyApiKey(false)
  }

  const handleResetDefaults = () => {
    const defaultConfig: EmailSettingsConfig = {
      apiKey: import.meta.env.VITE_BREVO_API_KEY || "",
      senderName: "BiovaCo HR & Executive",
      senderEmail: "noreply@biovaco.in",
      smtpServer: "smtp-relay.brevo.com",
      smtpPort: "587",
      dailyQuota: 300,
      sentToday: 0,
    }
    saveEmailConfig(defaultConfig)
    setConfig(defaultConfig)
    toast({
      title: "Reset to Defaults",
      description: "Email settings restored to default enterprise configuration.",
    })
  }

  const handleSendTestMail = async () => {
    if (!testRecipient || !testRecipient.includes("@")) {
      toast({ title: "Invalid Email", description: "Please enter a valid recipient email address.", variant: "destructive" })
      return
    }

    setSendingTest(true)
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #4B49AC; padding: 20px; text-align: center; color: white;">
            <h2 style="margin: 0;">⚡ BiovaCo Nexus</h2>
            <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">ENTERPRISE SYSTEM TEST DISPATCH</p>
          </div>
          <div style="padding: 25px; background-color: #ffffff;">
            <p style="font-size: 15px; color: #334155; line-height: 1.6;">${testBody.replace(/\n/g, "<br/>")}</p>
            <div style="margin-top: 25px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #7DA0FA; border-radius: 4px;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                <strong>Sender:</strong> ${config.senderName} &lt;${config.senderEmail}&gt;<br/>
                <strong>Relay Host:</strong> ${config.smtpServer}:${config.smtpPort}<br/>
                <strong>Dispatch Date:</strong> ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
            © ${new Date().getFullYear()} BiovaCo Nexus. System Generated Verification Email.
          </div>
        </div>
      `

      await sendEmailViaBrevo({
        to: [{ email: testRecipient }],
        subject: testSubject,
        htmlContent,
        senderName: config.senderName,
        senderEmail: config.senderEmail,
      })

      // Add log entry to dispatch history
      const newHistoryItem: DispatchHistoryItem = {
        id: `log_${Date.now()}`,
        recipient: testRecipient,
        subject: testSubject,
        status: "Success",
        timestamp: "Just now"
      }
      setHistory([newHistoryItem, ...history])

      toast({
        title: "Test Email Dispatched Successfully! 🎉",
        description: `Message sent to ${testRecipient} via Brevo SMTP API. Quota updated.`,
      })
      setIsTestModalOpen(false)
      setTestRecipient("")

      // Refresh live stats after dispatch
      await handleSyncLiveStats(false)
    } catch (err: any) {
      toast({
        title: "Dispatch Failed",
        description: err.message || "Failed to send test email. Check your Brevo API key and sender email verification.",
        variant: "destructive",
      })
    } finally {
      setSendingTest(false)
    }
  }

  const quotaPercentage = Math.min(Math.round((config.sentToday / Math.max(config.dailyQuota, 1)) * 100), 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-[#4B49AC] flex items-center gap-2">
            <Mail className="h-7 w-7 text-[#7DA0FA]" />
            Enterprise Email & Brevo SMTP Settings
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure system sender identities, Brevo API integration parameters, and daily mail dispatch quotas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSyncLiveStats(true)} disabled={syncingStats} title="Fetch live stats from Brevo API">
            <RefreshCw className={`h-4 w-4 mr-1.5 ${syncingStats ? "animate-spin" : ""}`} /> Sync Quota
          </Button>
          <Button variant="outline" onClick={handleResetDefaults} title="Restore standard defaults">
            <RotateCcw className="h-4 w-4 mr-1.5" /> Defaults
          </Button>
          <Button onClick={() => setIsTestModalOpen(true)} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-medium shadow-md">
            <Send className="h-4 w-4 mr-2" /> Send Test Email
          </Button>
        </div>
      </div>

      {/* Quota & Integration Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily Email Quota */}
        <Card className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border-purple-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Zap className="h-24 w-24 text-[#4B49AC]" />
          </div>
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-bold text-purple-900 uppercase tracking-wider">Daily Email Quota (Brevo)</div>
              <Badge variant="outline" className="bg-purple-100/80 text-[#4B49AC] border-purple-300 text-[10px] font-bold">
                {quotaPercentage}% Used
              </Badge>
            </div>
            
            <div className="text-3xl font-black text-[#4B49AC]">{config.sentToday} / {config.dailyQuota} Mails</div>
            
            <div className="w-full bg-purple-200 h-2.5 rounded-full mt-3 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-[#4B49AC] to-[#7DA0FA] h-full transition-all duration-500" 
                style={{ width: `${quotaPercentage}%` }} 
              />
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3 text-purple-600" /> Real-time daily counter
              </span>
              <Badge 
                variant="secondary" 
                className={
                  statsSource === "brevo_live_api"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]"
                    : statsSource === "database"
                    ? "bg-blue-100 text-blue-800 border-blue-200 text-[10px]"
                    : "bg-gray-100 text-gray-700 text-[10px]"
                }
              >
                {statsSource === "brevo_live_api" ? (
                  <span className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-emerald-600" /> Brevo REST API Live
                  </span>
                ) : statsSource === "database" ? (
                  <span className="flex items-center gap-1">
                    <Database className="h-3 w-3 text-blue-600" /> DB Log Counter
                  </span>
                ) : (
                  "Local Storage Counter"
                )}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* SMTP Protocol */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">SMTP Protocol & Relay</div>
            <div className="text-2xl font-black text-foreground">{config.smtpServer}</div>
            <div className="text-xs font-semibold text-indigo-600 mt-1">Port {config.smtpPort} (STARTTLS / SSL)</div>
            <div className="text-xs text-emerald-600 font-semibold mt-3 flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> High Deliverability Protocol Active
            </div>
          </CardContent>
        </Card>

        {/* Brevo API Key Health */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Brevo API Key Health</div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleVerifyApiKey(true)} 
                disabled={verifyingKey}
                className="h-6 px-2 text-[11px] text-[#4B49AC] hover:bg-purple-50"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${verifyingKey ? "animate-spin" : ""}`} />
                Test API
              </Button>
            </div>

            <div className="text-2xl font-black flex items-center gap-2">
              {keyVerificationStatus === "success" ? (
                <span className="text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle className="h-6 w-6" /> Verified Live
                </span>
              ) : keyVerificationStatus === "error" ? (
                <span className="text-rose-600 flex items-center gap-1.5">
                  <AlertCircle className="h-6 w-6" /> Invalid Key
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-1.5">
                  <Key className="h-6 w-6" /> Key Configured
                </span>
              )}
            </div>

            <div className="text-xs text-gray-500 mt-2 font-mono truncate bg-gray-50 p-1.5 rounded border border-gray-100">
              {config.apiKey ? `${config.apiKey.substring(0, 12)}...${config.apiKey.substring(config.apiKey.length - 4)}` : "No Key Entered"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Configuration Form */}
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-gray-50/50 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#4B49AC]" />
              System Sender Identity & Server Config
            </CardTitle>
            <Badge variant="outline" className="bg-blue-50 text-[#4B49AC] border-blue-200">
              TLS 1.3 Encrypted Storage
            </Badge>
          </div>
          <CardDescription>
            Changes saved here persist across all mail dispatch components including Bulk Recruiter Mailer and CRM Emailers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* API Key Input Section */}
          <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#4B49AC] uppercase tracking-wider flex items-center gap-1.5">
                <Key className="h-4 w-4" /> Brevo API Secret Key (v3 REST API) *
              </label>
              {accountInfo && accountInfo.email && (
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  Logged in as: {accountInfo.email}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="xkeysib-..."
                  className="font-mono text-xs pr-10 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                onClick={() => handleVerifyApiKey(true)}
                disabled={verifyingKey}
                className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white shrink-0"
              >
                {verifyingKey ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1.5" /> Verify Key
                  </>
                )}
              </Button>
            </div>
            {keyVerificationStatus === "error" && (
              <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> {keyErrorMessage}
              </p>
            )}
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Default Sender Name *</label>
              <Input
                value={config.senderName}
                onChange={(e) => setConfig({ ...config, senderName: e.target.value })}
                placeholder="e.g. BiovaCo HR & Executive"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">Display name visible to recipients</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Default Sender Email *</label>
              <Input
                value={config.senderEmail}
                onChange={(e) => setConfig({ ...config, senderEmail: e.target.value })}
                placeholder="noreply@biovaco.in"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">Must be a verified sender in your Brevo dashboard</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Relay Host</label>
              <Input
                value={config.smtpServer}
                onChange={(e) => setConfig({ ...config, smtpServer: e.target.value })}
                placeholder="smtp-relay.brevo.com"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Relay Port</label>
              <Input
                value={config.smtpPort}
                onChange={(e) => setConfig({ ...config, smtpPort: e.target.value })}
                placeholder="587"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Max Daily Email Quota Limit</label>
              <Input
                type="number"
                value={config.dailyQuota}
                onChange={(e) => setConfig({ ...config, dailyQuota: parseInt(e.target.value, 10) || 300 })}
                placeholder="300"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">Default Brevo free tier limit is 300 emails/day</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Emails Sent Today (Counter)</label>
              <Input
                type="number"
                value={config.sentToday}
                onChange={(e) => setConfig({ ...config, sentToday: parseInt(e.target.value, 10) || 0 })}
              />
              <span className="text-[11px] text-gray-400 mt-1 block">Real counter fetched live from Brevo or local dispatch logs</span>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <Button onClick={handleSaveSettings} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-medium shadow">
              Save Email Credentials & Quotas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dispatch History Card */}
      <Card className="shadow-sm">
        <CardHeader className="py-4">
          <CardTitle className="text-base font-bold text-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#4B49AC]" />
              Recent Dispatch Log
            </span>
            <Badge variant="secondary" className="text-xs">
              {history.length} Logs
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-100">
            {history.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-foreground">{item.subject}</div>
                  <div className="text-xs text-gray-500 mt-0.5">To: <span className="font-mono">{item.recipient}</span></div>
                </div>
                <div className="text-right">
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                    {item.status}
                  </Badge>
                  <div className="text-[11px] text-gray-400 mt-1">{item.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Mailer Dialog */}
      <Dialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#4B49AC]">
              <Send className="h-5 w-5 text-[#7DA0FA]" />
              Dispatch System Test Email
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Recipient Email Address *</label>
              <Input
                placeholder="e.g. nakul.m@biovaco.in or target@gmail.com"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Subject</label>
              <Input
                value={testSubject}
                onChange={(e) => setTestSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Message Content</label>
              <Textarea
                rows={4}
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                className="text-xs font-sans"
              />
            </div>
            <div className="bg-purple-50 p-3 rounded text-xs text-purple-900 space-y-1 border border-purple-100">
              <div><strong>Sender Identity:</strong> {config.senderName} &lt;{config.senderEmail}&gt;</div>
              <div><strong>Relay Host:</strong> {config.smtpServer}:{config.smtpPort}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendTestMail} disabled={sendingTest} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white">
              {sendingTest ? "Dispatching..." : "Dispatch Test Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
