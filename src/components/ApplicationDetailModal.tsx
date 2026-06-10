"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  FileText,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Bot,
  Sparkles,
  Loader2,
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface JobApplication {
  id: string
  application_id: string
  full_name: string
  email: string
  phone: string
  role: string
  experience_years: number
  skills: string
  cover_letter: string
  resume_url: string
  status: string
  created_at: string
  updated_at: string
  signature_image?: string
}

interface ApplicationStatus {
  id: string
  application_id: string
  status: string
  changed_at: string
  notes: string
}

interface ApplicationDetailModalProps {
  application: JobApplication | null
  isOpen: boolean
  onClose: () => void
}

export function ApplicationDetailModal({ application, isOpen, onClose }: ApplicationDetailModalProps) {
  const [statusHistory, setStatusHistory] = useState<ApplicationStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<{
    score: number;
    summary: string;
    pros: string[];
    cons: string[];
  } | null>(null)
  const { toast } = useToast()

  const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ""

  const statusIcons = {
    submitted: <Clock className="h-4 w-4" />,
    under_review: <AlertCircle className="h-4 w-4" />,
    interview_scheduled: <Clock className="h-4 w-4" />,
    accepted: <CheckCircle className="h-4 w-4" />,
    rejected: <XCircle className="h-4 w-4" />,
  }

  const statusColors = {
    submitted: "bg-blue-100 text-blue-800 border-blue-300",
    under_review: "bg-yellow-100 text-yellow-800 border-yellow-300",
    interview_scheduled: "bg-purple-100 text-purple-800 border-purple-300",
    accepted: "bg-green-100 text-green-800 border-green-300",
    rejected: "bg-red-100 text-red-800 border-red-300",
  }

  const statusLabels = {
    submitted: "Submitted",
    under_review: "Under Review",
    interview_scheduled: "Interview Scheduled",
    accepted: "Accepted",
    rejected: "Rejected",
  }

  const getJobRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      embedded_system: "Embedded System Engineer",
      software_developer: "Software Developer",
      iot_handler: "IoT Handler",
      circuit_designer: "Circuit Designer",
      "3d_modeler": "3D Modeler",
      graphic_designer: "Graphic Designer",
    }
    return roleLabels[role] || role
  }

  useEffect(() => {
    if (application && isOpen) {
      fetchStatusHistory()
      setAiAnalysis(null) // Reset AI analysis on new open
    }
  }, [application, isOpen])

  const fetchStatusHistory = async () => {
    if (!application) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("application_status_history")
        .select("*")
        .eq("application_id", application.application_id)
        .order("changed_at", { ascending: false })

      if (error) throw error
      setStatusHistory(data || [])
    } catch (error) {
      console.error("Error fetching status history:", error)
      toast({
        title: "Error",
        description: "Failed to load status history",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadResume = (resumeUrl: string, applicantName: string) => {
    const link = document.createElement("a")
    link.href = resumeUrl
    link.download = `${applicantName}_Resume.pdf`
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Download Started",
      description: "Resume download has started",
    })
  }

  const analyzeWithAI = async () => {
    if (!application) return;
    if (!OPENROUTER_API_KEY) {
      toast({
        title: "API Key Missing",
        description: "OpenRouter API Key is not configured.",
        variant: "destructive"
      })
      return;
    }

    setAnalyzing(true);
    try {
      // 1. Fetch the exact job description from Supabase
      const { data: job, error: jobError } = await supabase
        .from("job_positions")
        .select("*")
        .eq("role_key", application.role)
        .single();

      if (jobError) throw jobError;

      const jobDetails = `
        Title: ${job.title}
        Requirements: ${job.requirements}
        Responsibilities: ${job.responsibilities}
        Experience Required: ${job.experience_level}
      `;

      const candidateDetails = `
        Name: ${application.full_name}
        Experience: ${application.experience_years} years
        Skills: ${application.skills}
        Cover Letter: ${application.cover_letter}
      `;

      const prompt = `
        You are an elite Tech Recruiter AI. Analyze the following candidate against the job description.
        You must output ONLY raw JSON data, exactly in this format:
        {
          "score": <number 0-100>,
          "summary": "<2-3 sentences evaluating the fit>",
          "pros": ["<pro 1>", "<pro 2>"],
          "cons": ["<con 1>", "<con 2>"]
        }
        
        Job Description:
        ${jobDetails}

        Candidate Details:
        ${candidateDetails}
      `;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct:free",
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (response.status === 402) {
        throw new Error("Insufficient OpenRouter credits. Please use a free model or add credits to your OpenRouter account.");
      }
      
      if (!response.ok) throw new Error("Failed to fetch from OpenRouter");

      const aiData = await response.json();
      let parsedAnalysis;
      try {
        parsedAnalysis = JSON.parse(aiData.choices[0].message.content);
      } catch (e) {
        // Fallback cleanup if the AI wrapped it in markdown codeblocks
        const cleaned = aiData.choices[0].message.content.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
        parsedAnalysis = JSON.parse(cleaned);
      }
      
      setAiAnalysis(parsedAnalysis);
      toast({ title: "Analysis Complete", description: "Deep AI scan finished successfully." });

    } catch (error) {
      console.error("AI Analysis Error:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not complete the AI analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  }

  if (!application) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Application Details - {application.full_name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detailed view of the applicant's submitted information and AI evaluation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Application Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Application Overview</CardTitle>
                <Badge className={`${statusColors[application.status]} flex items-center gap-1`}>
                  {statusIcons[application.status]}
                  {statusLabels[application.status]}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 font-mono">ID: {application.application_id}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personal Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Full Name</p>
                        <p className="font-medium">{application.full_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium">{application.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="font-medium">{application.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Professional Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Position</p>
                        <p className="font-medium">{getJobRoleLabel(application.role)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Experience</p>
                        <p className="font-medium">{application.experience_years} years</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Applied Date</p>
                        <p className="font-medium">{new Date(application.created_at).toLocaleDateString("en-IN")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resume Download */}
              {application.resume_url && (
                <div className="mt-6 pt-6 border-t">
                  <Button
                    onClick={() => downloadResume(application.resume_url, application.full_name)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Resume
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Deep Scan */}
          <Card className="border-indigo-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-indigo-600" />
                  <CardTitle className="text-lg text-indigo-900">Deep AI Scan (OpenRouter)</CardTitle>
                </div>
                {!aiAnalysis && (
                  <Button 
                    onClick={analyzeWithAI} 
                    disabled={analyzing}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {analyzing ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" /> Run Evaluation</>
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            <CardContent className="p-0">
              {aiAnalysis ? (
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-full border-4 border-indigo-100 flex items-center justify-center flex-shrink-0 bg-white shadow-inner">
                      <span className={`text-2xl font-bold ${aiAnalysis.score >= 75 ? 'text-green-600' : aiAnalysis.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {aiAnalysis.score}%
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Executive Summary</h4>
                      <p className="text-gray-800 text-sm leading-relaxed">{aiAnalysis.summary}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div className="bg-green-50/50 p-4 rounded-lg border border-green-100">
                      <h4 className="font-semibold text-green-800 flex items-center gap-2 mb-3 text-sm">
                        <CheckCircle className="h-4 w-4" /> Pros
                      </h4>
                      <ul className="space-y-2">
                        {aiAnalysis.pros?.map((pro, i) => (
                          <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span> {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-red-50/50 p-4 rounded-lg border border-red-100">
                      <h4 className="font-semibold text-red-800 flex items-center gap-2 mb-3 text-sm">
                        <XCircle className="h-4 w-4" /> Cons
                      </h4>
                      <ul className="space-y-2">
                        {aiAnalysis.cons?.map((con, i) => (
                          <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span> {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50/50">
                  <Sparkles className="h-8 w-8 text-indigo-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Run a deep AI scan to get a comprehensive semantic evaluation of this candidate's fit for the role.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills & Cover Letter */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Skills & Technologies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {application.skills || "No skills provided"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Cover Letter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {application.cover_letter || "No cover letter provided"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Digital Signature */}
          {application.signature_image && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Digital Signature</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <img
                    src={application.signature_image || "/placeholder.svg"}
                    alt="Digital Signature"
                    className="max-w-xs h-20 object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Status Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">Loading timeline...</p>
                </div>
              ) : statusHistory.length > 0 ? (
                <div className="space-y-4">
                  {statusHistory.map((status, index) => (
                    <div key={status.id} className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? "bg-green-100" : "bg-gray-100"
                        }`}
                      >
                        {statusIcons[status.status] || <Clock className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{statusLabels[status.status] || status.status}</p>
                          <p className="text-xs text-gray-500">{new Date(status.changed_at).toLocaleString("en-IN")}</p>
                        </div>
                        {status.notes && <p className="text-sm text-gray-600 mt-1">{status.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No status updates available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
