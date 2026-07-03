import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Eye, Clock, Calendar, CheckCircle, XCircle, Download, FileText } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { ContactRemarkModal } from "@/components/ContactRemarkModal"
import { ApplicationDetailModal } from "@/components/ApplicationDetailModal"
import { logAdminActivity } from "@/utils/adminLogger"

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
  aiScore?: number
}

const supabasePublicBase = "https://utczzoyurfxljdeihann.supabase.co/storage/v1/object/public/resumes/"

const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || ""
const SENDER_EMAIL = "no-reply@biovaco.in"
const SENDER_NAME = "BiovaCo Nexus"

interface ApplicationsManagementProps {
  initialTargetId?: string;
  onClearTargetId?: () => void;
  onNavigateToTab?: (tab: string, payload?: string) => void;
}

export function ApplicationsManagement({ initialTargetId, onClearTargetId, onNavigateToTab }: ApplicationsManagementProps = {}) {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [optimisticStatus, setOptimisticStatus] = useState<{ [key: string]: string }>({})
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Modals state
  const [contactRemarkOpen, setContactRemarkOpen] = useState(false)
  const [selectedApplicant, setSelectedApplicant] = useState<{ name: string; email: string; id: string } | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchApplications()
  }, [])

  const pendingTargetRef = useRef<string | undefined>(undefined)

  // Store the target ID in a ref when it arrives
  useEffect(() => {
    if (initialTargetId) {
      pendingTargetRef.current = initialTargetId
      if (onClearTargetId) onClearTargetId() // Clear parent state immediately, ref keeps the value
    }
  }, [initialTargetId, onClearTargetId])

  // Once applications load, check if we have a pending target to open
  useEffect(() => {
    if (pendingTargetRef.current && applications.length > 0) {
      const targetApp = applications.find(a => a.application_id === pendingTargetRef.current)
      if (targetApp) {
        setSelectedApplication(targetApp)
        setShowDetailModal(true)
      }
      pendingTargetRef.current = undefined // Done, clear the ref
    }
  }, [applications])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const [appsRes, jobsRes] = await Promise.all([
        supabase.from("job_applications").select("*").order("created_at", { ascending: false }),
        supabase.from("job_positions").select("*")
      ])

      if (appsRes.error) throw appsRes.error
      if (jobsRes.error) throw jobsRes.error

      const jobs = jobsRes.data || []
      const data = appsRes.data || []

      // Deduplicate applications
      const apps = data || []
      const grouped = new Map<string, JobApplication[]>()
      
      apps.forEach((app) => {
        // Group by email as primary key, or full name if email is missing
        const key = (app.email || app.full_name || "").toLowerCase().trim()
        if (!grouped.has(key)) {
          grouped.set(key, [])
        }
        grouped.get(key)!.push(app)
      })

      const uniqueApps: JobApplication[] = []

      // Scoring system to pick the "best" application
      const getScore = (app: JobApplication) => {
        let score = 0
        if (app.resume_url) score += 3
        if (app.cover_letter && app.cover_letter.trim().length > 10) score += 2
        if (app.skills && app.skills.trim().length > 5) score += 2
        if (app.experience_years > 0) score += 1
        if (app.phone) score += 1
        return score
      }

      grouped.forEach((appGroup) => {
        if (appGroup.length === 1) {
          uniqueApps.push(appGroup[0])
        } else {
          // Sort by score (descending), then by most recent
          appGroup.sort((a, b) => {
            const scoreA = getScore(a)
            const scoreB = getScore(b)
            if (scoreA !== scoreB) {
              return scoreB - scoreA
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          })
          uniqueApps.push(appGroup[0]) // Push the highest scored application
        }
      })

      // Sort final result by date again to ensure overall chronological order
      uniqueApps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      // Calculate AI Score (Advanced Version 3.0 - Hyper Strict Offline Matcher)
      const calculateAIScore = (app: JobApplication, job: any) => {
        if (!job) return 0;
        
        let score = 0;
        
        // Stop words dictionary tailored for Job Descriptions
        const stopWords = new Set([
          "about", "above", "across", "after", "again", "against", "these", "those", "their", "there", 
          "where", "when", "who", "why", "how", "which", "required", "working", "looking", "company", 
          "please", "apply", "candidates", "candidate", "years", "experience", "knowledge", "skills", 
          "preferred", "qualifications", "strong", "ability", "understanding", "equivalent", "related",
          "with", "from", "have", "that", "this", "will", "your", "they", "them", "what", "must", 
          "good", "excellent", "basic", "advanced", "proven", "track", "record", "work", "team", 
          "environment", "fast", "paced", "develop", "maintain", "create", "build", "design", "test",
          "using", "under", "over", "between", "into", "through", "during", "before", "after", "other",
          "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
          "can", "will", "just", "should", "now", "role", "position", "join", "help", "support", "part",
          "time", "full", "remote", "onsite", "hybrid", "office", "based", "ensure", "provide", "within",
          "ideal", "opportunity", "growth", "career", "benefits", "salary", "we", "are", "you"
        ]);

        const jobText = `${job.title || ""} ${job.requirements || ""} ${job.responsibilities || ""}`.toLowerCase();
        
        // Extract technical keywords (ignore basic words)
        const rawKeywords = jobText.match(/\b[a-z0-9+#]{2,25}\b/g) || [];
        const validKeywords = rawKeywords.filter(word => !stopWords.has(word) && isNaN(Number(word)));
        
        // Count frequency
        const keywordFreq = new Map<string, number>();
        validKeywords.forEach(kw => keywordFreq.set(kw, (keywordFreq.get(kw) || 0) + 1));
        
        // Get Top 15 most important keywords (Core technical focus)
        const topKeywords = Array.from(keywordFreq.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15)
          .map(entry => entry[0]);

        const appSkills = (app.skills || "").toLowerCase();
        const appCover = (app.cover_letter || "").toLowerCase();
        const appTextTotalLength = appSkills.length + appCover.length;

        // Immediate Penalty for Spam/Empty applications
        if (appTextTotalLength < 20) {
          return Math.floor(Math.random() * 5) + 5; // Strict 5-9% score
        }

        // 1. SKILLS & COVER LETTER KEYWORD MATCHING (Max 65 Points)
        let skillMatchCount = 0;
        let coverMatchCount = 0;

        if (topKeywords.length > 0) {
          topKeywords.forEach((kw) => {
            // Regex to match exact word boundaries to avoid false positives (e.g. matching "in" inside "engineer")
            const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'i');
            if (regex.test(appSkills)) skillMatchCount++;
            if (regex.test(appCover)) coverMatchCount++;
          });
          
          // Skills are worth more than cover letter mentions
          const skillScorePercent = (skillMatchCount / topKeywords.length) * 45; // Max 45
          const coverScorePercent = (coverMatchCount / topKeywords.length) * 20; // Max 20
          
          // Boost score gently if they hit multiple keywords but cap at 65
          score += Math.min(65, (skillScorePercent + coverScorePercent) * 1.3);
        }

        // 2. EXPERIENCE MATCHING (Max 20 Points)
        const expMatch = (job.experience_level || "").match(/\d+/);
        const requiredExp = expMatch ? parseInt(expMatch[0]) : 0;
        const appExp = app.experience_years || 0;
        
        if (requiredExp === 0) {
          // Entry level: If they have *any* experience, it's a plus.
          score += 10 + Math.min(10, appExp * 2);
        } else {
          if (appExp >= requiredExp) {
            score += 20; // Perfect experience
          } else if (appExp >= requiredExp - 1 && appExp > 0) {
            score += 10; // 1 year short is acceptable
          } else {
            score += 0; // Too little experience -> 0 points
          }
        }

        // 3. PROFESSIONALISM / EFFORT (Max 15 Points)
        if (app.resume_url) {
          score += 10; // Attaching a resume is essential
        }
        
        if (app.cover_letter && app.cover_letter.length > 150) {
          score += 5; // Took time to write a proper letter
        }

        // 4. IRRELEVANCY PENALTY ("Kuch ka kuch likha ho")
        // If they wrote a massive essay (>500 chars) but hit less than 10% of keywords, penalize heavily.
        if (appTextTotalLength > 500 && (skillMatchCount + coverMatchCount) < (topKeywords.length * 0.1)) {
          score = score * 0.4; // Cut score by 60%
        }
        
        // If they wrote nothing related to the job at all (0 keywords hit)
        if (skillMatchCount === 0 && coverMatchCount === 0) {
          score = score * 0.15; // Massive penalty -> Maximum 15% of whatever they got from exp/resume
        }

        // Ensure bounds (2 to 99)
        return Math.max(2, Math.min(99, Math.round(score)));
      }

      const scoredApps = uniqueApps.map(app => {
        const matchingJob = jobs.find(j => j.role_key === app.role)
        return {
          ...app,
          aiScore: calculateAIScore(app, matchingJob)
        }
      })

      setApplications(scoredApps)
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendEmailNotification = async (email: string, name: string, status: string, applicationId: string) => {
    const emailData = {
      sender: {
        name: SENDER_NAME,
        email: SENDER_EMAIL,
      },
      to: [
        {
          email: email,
          name: name,
        },
      ],
      subject: `Application Status Updated - ${status}`,
      htmlContent: `
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
        <body style="margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e5e7eb;">
              <div style="background-color: #032E63; padding: 30px 40px; text-align: center; border-bottom: 4px solid #08A04B;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px;">BIOVACO</h1>
                <p style="color: #cbd5e1; margin: 4px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 4px;">NEXUS</p>
              </div>
            <div style="padding: 40px;">
              <h2 style="color: #032E63; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">Status Update Notification</h2>
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Dear ${name},</p>
              <div style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-left: 4px solid #08A04B; padding: 20px; margin-bottom: 24px; border-radius: 8px;">
                <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 12px 0;">Your application (ID: <strong>${applicationId}</strong>) has been updated to:</p>
                <div style="display: inline-block; background-color: #e0f2fe; color: #0369a1; font-weight: 600; padding: 8px 16px; border-radius: 9999px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">${status.replace(/_/g, ' ')}</div>
              </div>
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0;">
                Thank you for your continued interest and patience throughout this process.
              </p>
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0;">
                  Best regards,<br>
                  <strong style="color: #032E63;">The BiovaCo Nexus Team</strong>
                </p>
              </div>
            </div>
            <div style="background-color: #f1f5f9; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} BiovaCo Nexus Private Limited. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("Brevo API Error:", error)
      throw new Error("Failed to send email notification")
    }
  }

  const updateApplicationStatus = async (applicationId: string, newStatus: string, notes = "") => {
    try {
      setStatusUpdatingId(applicationId)
      setOptimisticStatus((prev) => ({ ...prev, [applicationId]: newStatus }))

      const { error: updateError } = await supabase
        .from("job_applications")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("application_id", applicationId)

      if (updateError) throw updateError

      // Add to status history
      const { error: historyError } = await supabase.from("application_status_history").insert({
        application_id: applicationId,
        status: newStatus,
        notes: notes,
      })

      if (historyError) {
        console.error("Error adding to status history:", historyError)
      }

      setApplications((prev) => prev.map((app) => (app.application_id === applicationId ? { ...app, status: newStatus } : app)))

      // Send email notification to applicant
      const applicant = applications.find((app) => app.application_id === applicationId)
      if (applicant) {
        await sendEmailNotification(applicant.email, applicant.full_name, newStatus, applicationId)
      }

      const targetApp = applications.find(a => a.application_id === applicationId);
      if (targetApp) {
        logAdminActivity(
          "STATUS_CHANGED",
          `${targetApp.full_name}'s Application [${applicationId}]`,
          `Status changed from ${targetApp.status} to ${newStatus}`
        );
      }

      toast({
        title: "Status Updated",
        description: `Application status changed to ${newStatus.replace("_", " ")} and email sent.`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Update Failed",
        description: "Could not update the application status",
        variant: "destructive",
      })
      setOptimisticStatus((prev) => {
        const newState = { ...prev }
        delete newState[applicationId]
        return newState
      })
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const bulkDeleteApplications = async (ids: string[]) => {
    try {
      const { error } = await supabase.from("job_applications").delete().in("id", ids)

      if (error) throw error

      toast({
        title: "Success",
        description: `Deleted ${ids.length} application(s).`,
      })
      setSelectedIds([])
      fetchApplications()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete applications",
        variant: "destructive",
      })
    }
  }

  const downloadResume = async (resumeUrl: string, applicantName: string) => {
    if (!resumeUrl) {
      toast({
        title: "No Resume",
        description: "This applicant did not provide a resume.",
        variant: "destructive",
      })
      return
    }

    try {
      let fileUrl = resumeUrl
      if (!resumeUrl.startsWith("http")) {
        fileUrl = `${supabasePublicBase}${resumeUrl.replace(/^\/+/, "")}`
      }

      const response = await fetch(fileUrl)
      if (!response.ok) {
        let errorText = `Download failed: HTTP ${response.status}`
        try {
          const errorJson = await response.json()
          errorText = errorJson.message || errorJson.error || errorText
        } catch (e) {
        }
        throw new Error(errorText)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url

      const ext = resumeUrl.split(".").pop() || "pdf"
      link.download = `Resume_${applicantName.replace(/\s+/g, "_")}.${ext}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Download Started",
        description: `Resume for ${applicantName} is being downloaded`,
      })
    } catch (error: any) {
      toast({
        title: "Download Error",
        description: `Failed to download resume. ${error?.message || ""}`,
        variant: "destructive",
      })
    }
  }

  const downloadApplicationsCSV = (rows: JobApplication[]) => {
    if (!rows.length) return

    const headers = ["Name", "Email", "Phone", "Role", "Experience (Yrs)", "Status", "Applied At"]
    const csvContent = [
      headers.join(","),
      ...rows.map((app) =>
        [
          `"${app.full_name.replace(/"/g, '""')}"`,
          `"${app.email}"`,
          `"${app.phone}"`,
          `"${app.role}"`,
          app.experience_years,
          `"${app.status}"`,
          `"${new Date(app.created_at).toLocaleDateString()}"`,
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `applications_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "text-blue-600 bg-blue-50"
      case "under_review":
        return "text-purple-600 bg-purple-50"
      case "interview_scheduled":
        return "text-yellow-600 bg-yellow-50"
      case "accepted":
        return "text-green-600 bg-green-50"
      case "rejected":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <Clock className="h-4 w-4" />
      case "under_review":
        return <Eye className="h-4 w-4" />
      case "interview_scheduled":
        return <Calendar className="h-4 w-4" />
      case "accepted":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getJobRoleLabel = (roleId: string) => {
    const roles: { [key: string]: string } = {
      "3d-generalist": "3D Generalist",
      "frontend-developer": "Frontend Developer",
      "backend-developer": "Backend Developer",
      "marketing-specialist": "Marketing Specialist",
      "business-development": "Business Development Executive",
      "video-editor": "Video Editor",
      "game-developer": "Game Developer",
      "project-manager": "Project Manager",
    }
    return roles[roleId] || roleId
  }

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.role.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <div className="text-center py-8">Loading applications...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-auto"
          />
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white flex-1 sm:flex-none text-sm min-w-[140px]"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
            <Button
              variant="outline"
              className="shrink-0"
              onClick={() => {
                const rowsToExport = selectedIds.length
                  ? applications.filter((a) => selectedIds.includes(a.id))
                  : filteredApplications
                downloadApplicationsCSV(rowsToExport)
              }}
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={async () => {
                if (!confirm(`Delete ${selectedIds.length} selected application(s)?`)) return
                await bulkDeleteApplications(selectedIds)
              }}
            >
              Delete Selected
            </Button>
          )}
        </div>
      </div>

      <div className="hidden xl:block overflow-hidden rounded-md border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f8fafc]">
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && filteredApplications.every((a) => selectedIds.includes(a.id))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(filteredApplications.map((a) => a.id))
                    } else {
                      setSelectedIds([])
                    }
                  }}
                />
              </TableHead>
              <TableHead className="text-[#032E63] font-bold">Name</TableHead>
              <TableHead className="text-[#032E63] font-bold">Email</TableHead>
              <TableHead className="text-[#032E63] font-bold">Role</TableHead>
              <TableHead className="text-[#032E63] font-bold">AI Fit</TableHead>
              <TableHead className="text-[#032E63] font-bold">Status</TableHead>
              <TableHead className="text-[#032E63] font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.map((app) => (
              <TableRow key={app.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(app.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds((s) => Array.from(new Set([...s, app.id])))
                      else setSelectedIds((s) => s.filter((id) => id !== app.id))
                    }}
                  />
                </TableCell>
                <TableCell className="font-medium text-[#032E63]">{app.full_name}</TableCell>
                <TableCell className="text-gray-600">{app.email}</TableCell>
                <TableCell>
                  <Badge className="bg-[#08A04B] hover:bg-[#08A04B]/90 font-normal">
                    {getJobRoleLabel(app.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${(app.aiScore || 0) >= 70 ? 'bg-green-500' : (app.aiScore || 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                        style={{ width: `${app.aiScore || 0}%` }} 
                      />
                    </div>
                    <span className="text-xs font-bold whitespace-nowrap">{app.aiScore || 0}% Match</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={optimisticStatus[app.application_id] || app.status}
                    onValueChange={(newStatus) => updateApplicationStatus(app.application_id, newStatus)}
                    disabled={statusUpdatingId === app.application_id}
                  >
                    <SelectTrigger
                      className={`w-40 ${getStatusColor(optimisticStatus[app.application_id] || app.status)}`}
                    >
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(optimisticStatus[app.application_id] || app.status)}
                          {optimisticStatus[app.application_id] || app.status}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submitted">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Submitted
                        </div>
                      </SelectItem>
                      <SelectItem value="under_review">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Under Review
                        </div>
                      </SelectItem>
                      <SelectItem value="interview_scheduled">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Interview Scheduled
                        </div>
                      </SelectItem>
                      <SelectItem value="accepted">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Accepted
                        </div>
                      </SelectItem>
                      <SelectItem value="rejected">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4" />
                          Rejected
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#032E63] text-[#032E63] hover:bg-[#032E63] hover:text-white"
                    onClick={() => {
                      setSelectedApplicant({ name: app.full_name, email: app.email, id: app.id })
                      setContactRemarkOpen(true)
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedApplication(app)
                      setShowDetailModal(true)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => downloadResume(app.resume_url, app.full_name)}>
                    <Download className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                  {(optimisticStatus[app.application_id] || app.status) === 'accepted' && onNavigateToTab && (
                    <Button 
                      size="sm" 
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => onNavigateToTab("documents", JSON.stringify({
                        type: 'offer_letter',
                        name: app.full_name,
                        role: getJobRoleLabel(app.role)
                      }))}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Offer
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Responsive Vertical Cards */}
      <div className="grid grid-cols-1 gap-4 xl:hidden">
        {filteredApplications.map((app) => (
          <Card key={app.id} className="p-4 border-l-4 border-l-[#032E63] shadow-sm flex flex-col space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selectedIds.includes(app.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds((s) => Array.from(new Set([...s, app.id])))
                    else setSelectedIds((s) => s.filter((id) => id !== app.id))
                  }}
                />
                <div>
                  <h3 className="font-bold text-[#032E63] leading-none">{app.full_name}</h3>
                  <p className="text-sm text-gray-500 mt-1 break-all">{app.email}</p>
                </div>
              </div>
              <Badge className="bg-[#08A04B] hover:bg-[#08A04B]/90 text-white shrink-0 font-normal">
                {getJobRoleLabel(app.role)}
              </Badge>
            </div>

            <div className="bg-[#f8fafc] p-3 rounded-md border border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#032E63]">AI Fit Score</span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${(app.aiScore || 0) >= 70 ? 'bg-green-500' : (app.aiScore || 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                    style={{ width: `${app.aiScore || 0}%` }} 
                  />
                </div>
                <span className="text-sm font-bold">{app.aiScore || 0}%</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Status</p>
              <Select
                value={optimisticStatus[app.application_id] || app.status}
                onValueChange={(newStatus) => updateApplicationStatus(app.application_id, newStatus)}
                disabled={statusUpdatingId === app.application_id}
              >
                <SelectTrigger className={`w-full ${getStatusColor(optimisticStatus[app.application_id] || app.status)}`}>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(optimisticStatus[app.application_id] || app.status)}
                      {optimisticStatus[app.application_id] || app.status}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-[#032E63] text-[#032E63]"
                onClick={() => {
                  setSelectedApplicant({ name: app.full_name, email: app.email, id: app.id })
                  setContactRemarkOpen(true)
                }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setSelectedApplication(app)
                  setShowDetailModal(true)
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => downloadResume(app.resume_url, app.full_name)}
              >
                <Download className="h-4 w-4 mr-2" />
                Resume
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <ContactRemarkModal
        open={contactRemarkOpen}
        onClose={() => setContactRemarkOpen(false)}
        applicantName={selectedApplicant?.name || ""}
        applicantEmail={selectedApplicant?.email || ""}
        applicationId={selectedApplicant?.id || ""}
      />

      <ApplicationDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        application={selectedApplication}
      />
    </div>
  )
}
