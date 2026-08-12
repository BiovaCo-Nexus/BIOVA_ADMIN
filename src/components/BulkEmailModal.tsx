import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { logAdminActivity } from "@/utils/adminLogger";
import { Mail, Send, Loader2, Users, FileText, CheckCircle2, AlertCircle, Sparkles, X } from "lucide-react";

import { getEmailConfig, incrementSentCount } from "@/utils/emailService";

const SENDER_NAME_DEFAULT = "BiovaCo Nexus HR";

export interface ApplicantTarget {
  id: string;
  application_id: string;
  full_name: string;
  email: string;
  role?: string;
}

interface BulkEmailModalProps {
  open: boolean;
  onClose: () => void;
  selectedApplicants: ApplicantTarget[];
  onSuccess?: () => void;
}

const EMAIL_TEMPLATES = [
  {
    id: "custom",
    label: "✏️ Custom Message",
    subject: "",
    body: "",
  },
  {
    id: "interview",
    label: "📅 Interview Invitation",
    subject: "Interview Invitation - BiovaCo Nexus",
    body: `Dear \${name},

We are pleased to inform you that your application for \${role} (ID: \${app_id}) has passed our initial screening!

We would like to invite you for an interview. Please let us know your convenient time slots over the next few days.

Best regards,
BiovaCo Nexus HR Team`,
  },
  {
    id: "under_review",
    label: "⏳ Application Under Review",
    subject: "Application Update: Under Review - BiovaCo Nexus",
    body: `Dear \${name},

Thank you for your interest in joining BiovaCo Nexus for the \${role} position (ID: \${app_id}).

Your application is currently under active evaluation by our hiring managers. We will reach out as soon as the review is complete.

Best regards,
BiovaCo Nexus HR Team`,
  },
  {
    id: "documents",
    label: "📋 Document Verification Request",
    subject: "Action Required: Document Verification - BiovaCo Nexus",
    body: `Dear \${name},

Regarding your application (\${app_id}) for \${role}, please reply to this email with soft copies of the following documents:

1. Updated Resume / Portfolio
2. Highest Degree Marksheet / Certificate
3. Government Issued ID Proof (Aadhaar / PAN)

Best regards,
BiovaCo Nexus HR Team`,
  },
  {
    id: "offer",
    label: "🎉 Job Offer Notification",
    subject: "Congratulations! Job Offer - BiovaCo Nexus",
    body: `Dear \${name},

We are delighted to extend a formal job offer for the \${role} position at BiovaCo Nexus!

Your application (\${app_id}) demonstrated impressive technical qualifications and values alignment. Our HR team will follow up with detailed offer letter documents shortly.

Welcome aboard!

Best regards,
BiovaCo Nexus Management`,
  },
];

export function BulkEmailModal({
  open,
  onClose,
  selectedApplicants,
  onSuccess,
}: BulkEmailModalProps) {
  const [senderName, setSenderName] = useState(() => getEmailConfig().senderName || SENDER_NAME_DEFAULT);
  const [toInput, setToInput] = useState("");
  const [ccInput, setCcInput] = useState("");
  const [bccInput, setBccInput] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const cfg = getEmailConfig();
      setSenderName(cfg.senderName || SENDER_NAME_DEFAULT);
      // Pre-fill To input with emails of selected applicants
      const emails = selectedApplicants.map((a) => a.email).filter(Boolean);
      setToInput(emails.join(", "));
      setCcInput("");
      setBccInput("");
      setSubject("");
      setBody("");
      setSelectedTemplate("custom");
      setSendProgress({ current: 0, total: 0 });
    }
  }, [open, selectedApplicants]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tmpl = EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (tmpl && tmpl.id !== "custom") {
      setSubject(tmpl.subject);
      setBody(tmpl.body);
    }
  };

  const parseEmails = (input: string): string[] => {
    return input
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 3 && e.includes("@"));
  };

  const generateHtmlEmail = (recipientName: string, messageBody: string, emailSubject: string) => {
    const formattedBody = messageBody.replace(/\n/g, "<br/>");
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="light">
  <style>
    :root { color-scheme: light; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 30px auto; padding: 0 15px;">
    <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
      
      <!-- Header -->
      <div style="background-color: #1e1b4b; padding: 32px 24px; text-align: center; border-bottom: 4px solid #4f46e5;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2px;">BIOVACO</h1>
        <p style="color: #a5b4fc; margin: 4px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 3px;">NEXUS ENTERPRISE</p>
      </div>

      <!-- Content -->
      <div style="padding: 36px 30px;">
        <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 20px 0;">${emailSubject}</h2>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
          <p style="color: #334155; font-size: 15px; line-height: 1.7; margin: 0;">${formattedBody}</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
          <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">
            Best regards,<br>
            <strong style="color: #0f172a;">${senderName || SENDER_NAME_DEFAULT}</strong><br>
            <span style="color: #4f46e5; font-size: 12px;">BiovaCo Nexus Private Limited</span>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f1f5f9; padding: 18px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} BiovaCo Nexus. This email was sent securely via BiovaCo HR Portal.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
    `;
  };

  const handleSendBulkEmail = async () => {
    const toEmails = parseEmails(toInput);
    const ccEmails = parseEmails(ccInput);
    const bccEmails = parseEmails(bccInput);

    if (toEmails.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please enter at least one valid 'To' email address.",
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        title: "Subject Missing",
        description: "Please enter an email subject.",
        variant: "destructive",
      });
      return;
    }

    if (!body.trim()) {
      toast({
        title: "Message Body Empty",
        description: "Please write an email message.",
        variant: "destructive",
      });
      return;
    }

    const emailConfig = getEmailConfig();
    const brevoApiKey = emailConfig.apiKey.trim();

    if (!brevoApiKey) {
      toast({
        title: "Brevo API Key Missing",
        description: "Please configure your Brevo API key in IT & System > Email Settings.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    // Build recipient mapping for dynamic placeholder replacement
    const applicantMap = new Map<string, ApplicantTarget>();
    selectedApplicants.forEach((app) => {
      if (app.email) applicantMap.set(app.email.toLowerCase().trim(), app);
    });

    const totalTo = toEmails.length;
    setSendProgress({ current: 0, total: totalTo });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < toEmails.length; i++) {
      const email = toEmails[i];
      setSendProgress({ current: i + 1, total: totalTo });

      const appData = applicantMap.get(email);
      const recipientName = appData?.full_name || email.split("@")[0];
      const appId = appData?.application_id || appData?.id || "N/A";
      const roleTitle = appData?.role || "Position";

      // Replace dynamic placeholders per applicant
      const personalizedSubject = subject
        .replace(/\${name}/gi, recipientName)
        .replace(/\${app_id}/gi, appId)
        .replace(/\${role}/gi, roleTitle);

      const personalizedBody = body
        .replace(/\${name}/gi, recipientName)
        .replace(/\${app_id}/gi, appId)
        .replace(/\${role}/gi, roleTitle);

      const htmlContent = generateHtmlEmail(recipientName, personalizedBody, personalizedSubject);

      const emailPayload: any = {
        sender: { 
          name: senderName.trim() || emailConfig.senderName, 
          email: emailConfig.senderEmail 
        },
        to: [{ email: email, name: recipientName }],
        subject: personalizedSubject,
        htmlContent: htmlContent,
      };

      if (ccEmails.length > 0) {
        emailPayload.cc = ccEmails.map((e) => ({ email: e }));
      }
      if (bccEmails.length > 0) {
        emailPayload.bcc = bccEmails.map((e) => ({ email: e }));
      }

      try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            accept: "application/json",
            "api-key": brevoApiKey,
            "content-type": "application/json",
          },
          body: JSON.stringify(emailPayload),
        });

        if (response.ok) {
          successCount++;
        } else {
          const errData = await response.json().catch(() => null);
          console.error(`Brevo error for ${email}:`, errData);
          failCount++;
        }
      } catch (err) {
        console.error(`Fetch exception for ${email}:`, err);
        failCount++;
      }
    }

    if (successCount > 0) {
      incrementSentCount(successCount);
    }

    setSending(false);

    if (successCount > 0) {
      logAdminActivity(
        "BULK_EMAIL_SENT",
        `Sent ${successCount} emails via Brevo`,
        `Subject: ${subject} | Recipients: ${toEmails.length}`
      );

      toast({
        title: "Bulk Mail Sent Successfully!",
        description: `Delivered to ${successCount} recipient(s)${
          failCount > 0 ? ` (${failCount} failed)` : ""
        }.`,
      });

      if (onSuccess) onSuccess();
      onClose();
    } else {
      toast({
        title: "Bulk Sending Failed",
        description: "Could not deliver emails. Please check Brevo configuration.",
        variant: "destructive",
      });
    }
  };

  const parsedToList = parseEmails(toInput);
  const parsedCcList = parseEmails(ccInput);
  const parsedBccList = parseEmails(bccInput);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-[#4B49AC]">
            <span className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#4B49AC]" />
              Brevo Bulk Mail System
            </span>
            <Badge variant="outline" className="bg-purple-50 text-[#4B49AC] border-purple-200">
              {parsedToList.length} Target Recipient(s)
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Compose and dispatch professional emails to applicants via Brevo API with CC/BCC and dynamic placeholders.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Template Selector & Sender Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-gray-700">Quick Email Template</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger className="mt-1 bg-white">
                  <SelectValue placeholder="Select template..." />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TEMPLATES.map((tmpl) => (
                    <SelectItem key={tmpl.id} value={tmpl.id}>
                      {tmpl.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-700">Sender Display Name</Label>
              <Input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. BiovaCo Nexus HR Team"
                className="mt-1"
              />
            </div>
          </div>

          {/* To Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs font-semibold text-gray-700">
                To (Recipients) <span className="text-red-500">*</span>
              </Label>
              <span className="text-[11px] text-gray-400">
                Comma / line separated ({parsedToList.length} valid)
              </span>
            </div>
            <Textarea
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              placeholder="Paste email addresses separated by commas or lines..."
              rows={2}
              className="font-mono text-xs"
            />
          </div>

          {/* CC & BCC Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs font-semibold text-gray-700">CC (Carbon Copy)</Label>
                <span className="text-[11px] text-gray-400">Optional ({parsedCcList.length})</span>
              </div>
              <Input
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                placeholder="hr@biovaco.in, admin@biovaco.in"
                className="font-mono text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs font-semibold text-gray-700">BCC (Blind Copy)</Label>
                <span className="text-[11px] text-gray-400">Optional ({parsedBccList.length})</span>
              </div>
              <Input
                value={bccInput}
                onChange={(e) => setBccInput(e.target.value)}
                placeholder="biovaconexuspvtltd@gmail.com"
                className="font-mono text-xs"
              />
            </div>
          </div>

          {/* Subject Field */}
          <div>
            <Label className="text-xs font-semibold text-gray-700">
              Subject <span className="text-red-500">*</span>
            </Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Interview Schedule - BiovaCo Nexus"
              className="mt-1 font-medium"
            />
          </div>

          {/* Message Body Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs font-semibold text-gray-700">
                Message Body (Supports {"${name}"}, {"${app_id}"}, {"${role}"}) <span className="text-red-500">*</span>
              </Label>
              <span className="text-[11px] text-purple-600 font-mono">Dynamic Placeholders Enabled</span>
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email body here..."
              rows={6}
              className="text-sm font-sans"
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span className="text-[11px] text-gray-400">Click to insert:</span>
              <button
                type="button"
                onClick={() => setBody((prev) => prev + " ${name}")}
                className="text-[11px] bg-purple-50 text-[#4B49AC] border border-purple-200 px-1.5 py-0.5 rounded hover:bg-purple-100 font-mono"
              >
                + {"${name}"}
              </button>
              <button
                type="button"
                onClick={() => setBody((prev) => prev + " ${app_id}")}
                className="text-[11px] bg-purple-50 text-[#4B49AC] border border-purple-200 px-1.5 py-0.5 rounded hover:bg-purple-100 font-mono"
              >
                + {"${app_id}"}
              </button>
              <button
                type="button"
                onClick={() => setBody((prev) => prev + " ${role}")}
                className="text-[11px] bg-purple-50 text-[#4B49AC] border border-purple-200 px-1.5 py-0.5 rounded hover:bg-purple-100 font-mono"
              >
                + {"${role}"}
              </button>
            </div>
          </div>

          {/* Sending Progress Bar */}
          {sending && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-1.5">
              <div className="flex justify-between text-xs text-[#4B49AC] font-semibold">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Dispatching emails via Brevo...
                </span>
                <span>
                  {sendProgress.current} / {sendProgress.total}
                </span>
              </div>
              <div className="w-full bg-purple-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#4B49AC] h-full transition-all duration-300"
                  style={{
                    width: `${
                      sendProgress.total > 0
                        ? (sendProgress.current / sendProgress.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-col-reverse sm:flex-row pt-2 border-t">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button
            className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-medium"
            onClick={handleSendBulkEmail}
            disabled={sending || parsedToList.length === 0}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending ({sendProgress.current}/{sendProgress.total})...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Bulk Email ({parsedToList.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
