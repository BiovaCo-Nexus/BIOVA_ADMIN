
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { logAdminActivity } from "@/utils/adminLogger";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Brevo / sender configuration (kept client-side consistent with Admin.tsx)
const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || ""
const SENDER_EMAIL = "no-reply@biovaco.in"
const SENDER_NAME = "BiovaCo Nexus"
const ADMIN_EMAIL = "biovaconexuspvtltd@gmail.com"

interface ContactRemarkModalProps {
 open: boolean;
 onClose: () => void;
 applicantName: string;
 applicantEmail: string;
 applicationId: string;
 isApplicant?: boolean;
 onRemarkSent?: () => void;
}

export function ContactRemarkModal({
 open,
 onClose,
 applicantName,
 applicantEmail,
 applicationId,
 isApplicant,
 onRemarkSent,
}: ContactRemarkModalProps) {
 const [subject, setSubject] = useState("");
 const [body, setBody] = useState("");
 // If isApplicant is false (admin), default to BiovaCo Nexus
 const [signName, setSignName] = useState(
 isApplicant ? applicantName : "BiovaCo Nexus"
 );
 const [sending, setSending] = useState(false);
 const { toast } = useToast();

 const handleSend = async () => {
 if (!subject.trim() || !body.trim() || (isApplicant && !signName.trim())) {
 toast({
 title: "Required",
 description: isApplicant
 ? "Please fill Subject, Body, and Sign fields."
 : "Please fill Subject and Body fields.",
 variant: "destructive",
 });
 return;
 }
 setSending(true);

 // For admins: if signName is blank, use "BiovaCo Nexus"
 const useSignName =
 !isApplicant && (!signName.trim() || signName === "")
 ? "BiovaCo Nexus"
 : signName;

 let insertResult: any = null
 try {
 const payload = {
 application_id: String(applicationId || "").trim(),
 to_email: String(isApplicant ? "biovaconexuspvtltd@gmail.com" : applicantEmail || "").trim(),
 subject: String(subject || "").trim(),
 body: String(body || "").trim(),
 admin_name: useSignName,
 sender_type: isApplicant ? "applicant" : "admin",
 }

 console.log("Inserting application_remarks payload:", payload)

 if (!payload.application_id || !payload.to_email || !payload.subject || !payload.body) {
 setSending(false)
 toast({ title: "Validation", description: "Application ID, To Email, Subject and Body are required.", variant: "destructive" })
 return
 }

 // use array form to ensure PostgREST accepts payload
 const { data, error } = await supabase.from("application_remarks").insert([payload]).select()

 setSending(false)

 console.log("application_remarks insert result:", { data, error })

 if (error) {
 toast({
 title: "Failed",
 description: `Could not send remark: ${error.message || JSON.stringify(error)}`,
 variant: "destructive",
 })
 return
 }

 insertResult = data
 } catch (e: any) {
 setSending(false)
 console.error("Exception inserting remark:", e)
 toast({ title: "Failed", description: `Could not send remark: ${e.message || e}`, variant: "destructive" })
 return
 }

 // Try to send an email notification via Brevo
 (async () => {
 try {
 const toEmail = isApplicant ? ADMIN_EMAIL : applicantEmail;
 const toName = isApplicant ? "Admin" : applicantName;

 const htmlContent = `
 <!DOCTYPE html>
 <html lang="en">
 <head>
 <meta charset="utf-8">
 <meta name="color-scheme" content="light">
 <meta name="supported-color-schemes" content="light">
 <style>
 :root { color-scheme: light; }
 </style>
 </head>
 <body style="margin: 0; padding: 0; background-color: #fafafa;">
 <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
 <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e5e7eb;">
 <div style="background-color: #18181b; padding: 30px 40px; text-align: center; border-bottom: 4px solid #71717a;">
 <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px;">BIOVACO</h1>
 <p style="color: #cbd5e1; margin: 4px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 4px;">NEXUS</p>
 </div>
 <div style="padding: 40px;">
 <h2 style="color: #18181b; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">${subject}</h2>
 <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Dear ${toName},</p>
 <div style="background-color: #fafafa; border-left: 4px solid #71717a; padding: 16px 20px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
 <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0;">${body.replace(/\n/g, '<br/>')}</p>
 </div>
 <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0;">
 From: <strong>${useSignName}</strong>
 </p>
 <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
 <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0;">
 Best regards,<br>
 <strong style="color: #18181b;">The BiovaCo Nexus Team</strong>
 </p>
 </div>
 </div>
 <div style="background-color: #f1f5f9; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
 <p style="color: #64748b; font-size: 12px; margin: 0;">
 © ${new Date().getFullYear()} BiovaCo Nexus Private Limited. All rights reserved.
 </p>
 </div>
 </div>
 </div>
 </body>
 </html>
 `;

 const emailData = {
 sender: { name: isApplicant ? SENDER_NAME : useSignName, email: SENDER_EMAIL },
 to: [{ email: toEmail, name: toName }],
 subject: isApplicant ? `Applicant Remark: ${subject}` : `Remark from Team: ${subject}`,
 htmlContent,
 };

 const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
 method: "POST",
 headers: {
 accept: "application/json",
 "api-key": BREVO_API_KEY,
 "content-type": "application/json",
 },
 body: JSON.stringify(emailData),
 });

 if (!resp.ok) {
 const err = await resp.json().catch(() => null);
 console.error("Brevo send remark error:", err || resp.statusText);
 toast({ title: "Remark saved", description: "Remark saved but email failed to send.", variant: "destructive" });
 } else {
 logAdminActivity("EMAIL_SENT", `Applicant: ${applicantName}`, `Subject: ${subject}`);
 toast({ title: "Email Sent", description: "Notification email delivered." });
 }
 } catch (e) {
 console.error("Error sending remark email:", e);
 toast({ title: "Remark saved", description: "Remark saved but email failed to send.", variant: "destructive" });
 }
 })();
 setSubject("");
 setBody("");
 setSignName(isApplicant ? applicantName : "BiovaCo Nexus");
 toast({
 title: "Message Sent!",
 description: isApplicant
 ? "Your message to admin has been sent. You'll see the reply here."
 : "Remark sent! Applicant will be notified.",
 });
 onClose();
 if (onRemarkSent) onRemarkSent();
 };

 return (
 <Dialog open={open} onOpenChange={onClose}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>
 {isApplicant
 ? "Contact Admin (BiovaCo Nexus Team)"
 : `Contact Applicant: ${applicantName}`}
 </DialogTitle>
 <DialogDescription className="sr-only">
 Send an email or remark to the selected applicant.
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-3">
 <div>
 <Label>Name</Label>
 <Input
 value={signName}
 onChange={e => setSignName(e.target.value)}
 disabled={!!isApplicant}
 placeholder="Your name"
 />
 </div>
 <div>
 <Label>{isApplicant ? "Your Email" : "To Email"}</Label>
 <Input value={applicantEmail} disabled />
 </div>
 <div>
 <Label>Subject *</Label>
 <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Enter subject..." />
 </div>
 <div>
 <Label>Body *</Label>
 <Textarea
 value={body}
 onChange={e => setBody(e.target.value)}
 rows={4}
 placeholder="Type your message here..."
 />
 </div>
 <div>
 <Label>
 Sign{isApplicant ? " *" : ""}
 {!isApplicant && (
 <span className="ml-1 text-xs text-gray-400">(optional — defaults to BiovaCo Nexus)</span>
 )}
 </Label>
 <Input
 value={signName}
 onChange={e => setSignName(e.target.value)}
 placeholder="Your name"
 disabled={!!isApplicant}
 />
 </div>
 </div>
 <DialogFooter className="mt-4">
 <Button
 onClick={handleSend}
 disabled={sending}
 className={isApplicant
 ? "bg-primary/10 hover:bg-primary/10 text-white"
 : "bg-primary/10 hover:bg-primary/10 text-white"
 }
 >
 {sending
 ? (isApplicant ? "Sending..." : "Sending...")
 : (isApplicant ? "Send to Admin" : "Send Remark")
 }
 </Button>
 <DialogClose asChild>
 <Button variant="outline" type="button">Cancel</Button>
 </DialogClose>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}
