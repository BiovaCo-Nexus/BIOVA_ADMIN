import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { AlertCircle, Send, Loader2, CheckCircle2 } from "lucide-react"

const URGENCIES = ["Low", "Medium", "High", "CRITICAL"]
const CATEGORIES = ["Raw Material Shortage", "Equipment Breakdown", "Formulation Issue", "Budget Request", "Other"]

export function DemandToDirectors() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [form, setForm] = useState({
    title: "",
    category: "Raw Material Shortage",
    urgency: "Medium",
    details: ""
  })

  const sendEmailNotification = async (userEmail: string) => {
    const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY
    if (!BREVO_API_KEY) {
      console.error("Brevo API key missing")
      return
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #ddd; border-top: 4px solid #032E63;">
        <h2 style="color: #032E63;">BiovaCo Nexus R&D Lab - New Demand Raised</h2>
        <p>A new demand/issue has been reported by the Food Technologist (<strong>${userEmail}</strong>).</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr><td style="padding: 8px; border: 1px solid #eee; background: #f9f9f9; width: 120px;"><strong>Subject</strong></td><td style="padding: 8px; border: 1px solid #eee;">${form.title}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #eee; background: #f9f9f9;"><strong>Category</strong></td><td style="padding: 8px; border: 1px solid #eee;">${form.category}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #eee; background: #f9f9f9;"><strong>Urgency</strong></td><td style="padding: 8px; border: 1px solid #eee;">
            <span style="color: ${form.urgency === 'CRITICAL' ? 'red' : form.urgency === 'High' ? 'orange' : 'black'}; font-weight: bold;">${form.urgency}</span>
          </td></tr>
          <tr><td style="padding: 8px; border: 1px solid #eee; background: #f9f9f9;"><strong>Details</strong></td><td style="padding: 8px; border: 1px solid #eee;">${form.details}</td></tr>
        </table>
        <p style="color: #777; font-size: 12px; margin-top: 20px;">This is an automated notification from the BiovaCo Nexus R&D Operating System.</p>
      </div>
    `

    const payload = {
      sender: { name: "BiovaCo Nexus OS", email: "no-reply@biovaco.in" },
      to: [
        { email: "ceo@biovaco.in", name: "CEO" },
        { email: "richarajan@biovaco.in", name: "Richa Rajan" },
        { email: "biovaconexuspvtltd@gmail.com", name: "BiovaCo Pvt Ltd" }
      ],
      subject: `[R&D Demand] ${form.urgency.toUpperCase()}: ${form.title}`,
      htmlContent: emailHtml
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": BREVO_API_KEY
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error("Failed to send email notification")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.details.trim()) {
      toast({ title: "Incomplete Form", description: "Please provide a subject and details.", variant: "destructive" })
      return
    }

    try {
      setIsSubmitting(true)

      // 1. Get current user
      const { data: { session } } = await supabase.auth.getSession()
      const userEmail = session?.user?.email || "food@biovaco.in"

      // 2. Log to global Admin Activity Logs
      const logDetails = `Category: ${form.category} | Urgency: ${form.urgency}\n\n${form.details}`
      const { error: logError } = await supabase.from('admin_activity_logs').insert([{
        admin_email: userEmail,
        action_type: "DEMAND_TO_DIRECTORS",
        entity_name: `[R&D] ${form.title}`,
        details: logDetails
      }])
      
      if (logError) throw logError

      // 3. Send Emails via Brevo API
      await sendEmailNotification(userEmail)

      setSuccess(true)
      toast({ 
        title: "Demand Submitted", 
        description: "Your request has been logged and the Directors have been notified via email.",
        className: "bg-green-50 border-green-200"
      })
      
      // Reset form after delay
      setTimeout(() => {
        setSuccess(false)
        setForm({ title: "", category: "Raw Material Shortage", urgency: "Medium", details: "" })
      }, 3000)

    } catch (e: any) {
      toast({ title: "Submission Failed", description: e.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Card className="border-t-4 border-t-red-600 shadow-lg">
        <CardHeader className="bg-red-50/50 border-b border-red-100">
          <CardTitle className="flex items-center gap-2 text-xl text-red-800">
            <AlertCircle className="h-6 w-6" />
            Demand To Directors
          </CardTitle>
          <CardDescription className="text-red-600/80">
            Directly escalate raw material shortages, equipment issues, or critical R&D blockers to the Executive Board. This will alert the CEO and MD instantly via Email and Audit Logs.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Demand Sent Successfully!</h3>
              <p className="text-gray-500 max-w-md">The directors have been notified via email and this record is now permanently logged in the master audit trail.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Subject / Demand Title *</label>
                <Input 
                  placeholder="E.g. Urgent shortage of Paprika Powder for Batch #402" 
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Category</label>
                  <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Urgency Level</label>
                  <Select value={form.urgency} onValueChange={v => setForm({...form, urgency: v})}>
                    <SelectTrigger className={
                      form.urgency === 'CRITICAL' ? 'border-red-500 text-red-700 bg-red-50 font-bold' : 
                      form.urgency === 'High' ? 'border-orange-500 text-orange-700 bg-orange-50 font-bold' : ''
                    }>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {URGENCIES.map(u => (
                        <SelectItem key={u} value={u} className={u === 'CRITICAL' ? 'text-red-600 font-bold' : ''}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Detailed Description *</label>
                <Textarea 
                  rows={6}
                  placeholder="Describe the exact problem, the requested materials, and why it is blocking the R&D lab..."
                  value={form.details}
                  onChange={e => setForm({...form, details: e.target.value})}
                  required
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Submit Demand to Directors
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
