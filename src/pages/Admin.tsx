"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BiovaCoLogo } from "@/components/BiovaCoLogo"
import {
  Mail,
  FileText,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  Download,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  BarChart3,
  Users,
  Settings,
  MapPin,
  Video,
  Briefcase,
  Calendar,
  Wrench,
  Box,
  Share2,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { ContactRemarkModal } from "@/components/ContactRemarkModal"
import { VideoManagement } from "@/components/VideoManagement"
import { CountdownManagement } from "@/components/CountdownManagement"
import { JobPositionsManagement } from "@/components/JobPositionsManagement"
import InternManagement from "@/components/InternManagement"
import PageContentManagement from "@/components/PageContentManagement"
import PostCountdownManagement from "@/components/PostCountdownManagement"
import { LocationManagement } from "@/components/LocationManagement"
import { MaintenanceManagement } from "@/components/MaintenanceManagement"
import { ApplicationDetailModal } from "@/components/ApplicationDetailModal"
import { Model3DManagement } from "@/components/Model3DManagement"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SocialLinksManagement from "@/components/SocialLinksManagement"

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
}

interface NewsletterSubscription {
  id: string
  email: string
  confirmed: boolean
  subscribed_at: string
}

interface ApplicationStatus {
  application_id: string
  status: string
  changed_at: string
  notes: string
}

const supabasePublicBase = "https://utczzoyurfxljdeihann.supabase.co/storage/v1/object/public/resumes/"

const Admin = () => {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [newsletters, setNewsletters] = useState<NewsletterSubscription[]>([])
  const [statusHistory, setStatusHistory] = useState<ApplicationStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [optimisticStatus, setOptimisticStatus] = useState<{ [key: string]: string }>({})
  const [contactRemarkOpen, setContactRemarkOpen] = useState(false)
  const [selectedApplicant, setSelectedApplicant] = useState<{ name: string; email: string; id: string } | null>(null)
  const [showThreadModal, setShowThreadModal] = useState(false)
  const [threadApplicationId, setThreadApplicationId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const navigate = useNavigate()
  const { toast } = useToast()

  const [posts, setPosts] = useState<any[]>([])
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    image: "",
    tags: "",
  })
  const [editingPost, setEditingPost] = useState<any>(null)

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("marketing_posts")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error("Failed to load posts:", error)
    }
  }

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      return
    }

    try {
      const { data, error } = await supabase
        .from("marketing_posts")
        .insert({
          title: newPost.title.trim(),
          content: newPost.content.trim(),
          image_url: newPost.image.trim() || null,
          tags: newPost.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0),
          is_published: true,
        })
        .select()

      if (error) {
        console.error("Failed to create post:", error)
        throw error
      }

      setNewPost({ title: "", content: "", image: "", tags: "" })
      await loadPosts()
    } catch (error) {
      console.error("Failed to create post:", error)
    }
  }

  const handleUpdatePost = async () => {
    if (!editingPost || !editingPost.title.trim() || !editingPost.content.trim()) return

    try {
      const { error } = await supabase
        .from("marketing_posts")
        .update({
          title: editingPost.title.trim(),
          content: editingPost.content.trim(),
          image_url: editingPost.image_url || null,
          tags: editingPost.tags || [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingPost.id)

      if (error) throw error

      setEditingPost(null)
      await loadPosts()
    } catch (error) {
      console.error("Failed to update post:", error)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return

    try {
      const { error } = await supabase.from("marketing_posts").delete().eq("id", postId)

      if (error) throw error
      await loadPosts()
    } catch (error) {
      console.error("Failed to delete post:", error)
    }
  }

  const togglePostStatus = async (postId: string) => {
    try {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      const { error } = await supabase
        .from("marketing_posts")
        .update({
          is_published: !post.is_published,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId)

      if (error) throw error
      await loadPosts()
    } catch (error) {
      console.error("Failed to toggle post status:", error)
    }
  }

  const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || ""
  const SENDER_EMAIL = "no-reply@biovaco.in"
  const SENDER_NAME = "BiovaCo Nexus"
  const ADMIN_EMAIL = "biovaconexuspvtltd@gmail.com"

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    // Check authentication first
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        navigate("/auth")
        return
      }
      setUser(session.user)
      fetchData()
    }

    checkAuth()
  }, [navigate])

  useEffect(() => {
    loadPosts()
  }, [])

  const fetchData = async () => {
    try {
      console.log("Fetching admin data...")

      // Fetch job applications
      const { data: appsData, error: appsError } = await supabase
        .from("job_applications")
        .select("*")
        .order("created_at", { ascending: false })

      if (appsError) {
        console.error("Error fetching applications:", appsError)
        throw appsError
      }

      // Fetch newsletter subscriptions
      const { data: newsletterData, error: newsletterError } = await supabase
        .from("newsletter_subscriptions")
        .select("*")
        .order("subscribed_at", { ascending: false })

      if (newsletterError) {
        console.error("Error fetching newsletters:", newsletterError)
        throw newsletterError
      }

      // Fetch status history
      const { data: statusData, error: statusError } = await supabase
        .from("application_status_history")
        .select("*")
        .order("changed_at", { ascending: false })

      if (statusError) {
        console.error("Error fetching status history:", statusError)
        throw statusError
      }

      console.log("Data fetched successfully:", {
        applications: appsData?.length,
        newsletters: newsletterData?.length,
        statusHistory: statusData?.length,
      })

      setApplications((appsData || []).map((a: any) => ({ ...a, status: (a.status || "").toLowerCase() })))
      setNewsletters(newsletterData || [])
      setStatusHistory(statusData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive",
      })
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

  const sendAdminNotification = async (applicationId: string, applicantName: string, applicantEmail: string) => {
    const emailData = {
      sender: {
        name: SENDER_NAME,
        email: SENDER_EMAIL,
      },
      to: [
        {
          email: ADMIN_EMAIL,
          name: "Admin",
        },
      ],
      subject: `New Application Received - ${applicantName}`,
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
              <h2 style="color: #032E63; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">New Application Received</h2>
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Dear Admin,</p>
              <div style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-left: 4px solid #08A04B; padding: 20px; margin-bottom: 24px; border-radius: 8px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
                  <tr>
                    <td style="padding-bottom: 12px; color: #64748b; width: 130px;">Applicant Name:</td>
                    <td style="padding-bottom: 12px; color: #0f172a; font-weight: 500;">${applicantName}</td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 12px; color: #64748b;">Email Address:</td>
                    <td style="padding-bottom: 12px; color: #0f172a; font-weight: 500;">${applicantEmail}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b;">Application ID:</td>
                    <td style="color: #0f172a; font-weight: 500;">${applicationId}</td>
                  </tr>
                </table>
              </div>
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0;">
                Please log in to the administrative portal to review the candidate's profile and resume.
              </p>
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0;">
                  Best regards,<br>
                  <strong style="color: #032E63;">BiovaCo Nexus System</strong>
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
      throw new Error("Failed to send admin notification email")
    }
  }

  const updateApplicationStatus = async (applicationId: string, newStatus: string, notes = "") => {
    setStatusUpdatingId(applicationId)
    setOptimisticStatus((os) => ({ ...os, [applicationId]: newStatus }))

    try {
      console.log("Updating status for application:", applicationId, "to:", newStatus)
      // Supabase update
      const { error: updateError } = await supabase
        .from("job_applications")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("application_id", applicationId)

      if (updateError) {
        console.error("Error updating application status:", updateError)
        toast({
          title: "Error",
          description: "Failed to update application status",
          variant: "destructive",
        })
        setStatusUpdatingId(null)
        setOptimisticStatus((os) => {
          const clone = { ...os }
          delete clone[applicationId]
          return clone
        })
        return
      }

      // Add to status history
      const { error: historyError } = await supabase.from("application_status_history").insert({
        application_id: applicationId,
        status: newStatus,
        notes: notes,
      })

      if (historyError) {
        console.error("Error adding to status history:", historyError)
        toast({
          title: "Error",
          description: "Failed to log status change",
          variant: "destructive",
        })
        setStatusUpdatingId(null)
        setOptimisticStatus((os) => {
          const clone = { ...os }
          delete clone[applicationId]
          return clone
        })
        return
      }

      // Send email notification to applicant
      const applicant = applications.find((app) => app.application_id === applicationId)
      if (applicant) {
        await sendEmailNotification(applicant.email, applicant.full_name, newStatus, applicationId)
      }


      toast({
        title: "Status Updated",
        description: `Application ${applicationId} status changed to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      })
    } finally {
      setStatusUpdatingId(null)
      // Remove optimistic status after a delay for smoothness (optional, ~1.5s)
      setTimeout(() => {
        setOptimisticStatus((os) => {
          const clone = { ...os }
          delete clone[applicationId]
          return clone
        })
      }, 1500)
    }
  }

  const downloadResume = async (resumeUrl: string, applicantName: string) => {
    if (!resumeUrl) {
      toast({
        title: "No Resume",
        description: "This application doesn't have a resume attached",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("Requested resume download:", resumeUrl)

      // Determine if resumeUrl is a full URL or just a file path
      let fileUrl = resumeUrl.trim()
      if (!/^https?:\/\//.test(resumeUrl)) {
        // It's just a path, generate full public URL
        // remove any leading '/' if present
        if (fileUrl.startsWith("/")) fileUrl = fileUrl.slice(1)
        fileUrl = supabasePublicBase + fileUrl.replace(/^resumes\//, "")
      }

      console.log("Trying download via:", fileUrl)

      const response = await fetch(fileUrl)

      if (!response.ok) {
        let errorText = `Download failed: HTTP ${response.status}`
        try {
          errorText = await response.text()
        } catch {}
        throw new Error(errorText)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      // Try to keep the extension if possible
      let ext = ".pdf"
      const pathParts = resumeUrl.split("/")
      if (pathParts.length) {
        const filename = pathParts[pathParts.length - 1]
        const match = filename.match(/\.([a-zA-Z0-9]+)$/)
        if (match) ext = "." + match[1]
      }
      link.href = url
      link.download = `Resume_${applicantName.replace(/\s+/g, "_")}${ext}`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(url)

      toast({
        title: "Download Started",
        description: `Resume for ${applicantName} is being downloaded`,
      })
    } catch (error: any) {
      console.error("Error downloading resume:", error)
      toast({
        title: "Download Error",
        description: `Failed to download resume. ${error?.message || ""}`,
        variant: "destructive",
      })
    }
  }

  const downloadApplicationsCSV = (rows: JobApplication[]) => {
    if (!rows || rows.length === 0) {
      toast({ title: "No data", description: "No applications to export", variant: "destructive" })
      return
    }

    const headers = ["application_id", "full_name", "email", "phone", "role", "experience_years", "skills", "status", "created_at"]
    const csvRows = [headers.join(",")]
    for (const r of rows) {
      const values = [
        r.application_id || "",
        r.full_name || "",
        r.email || "",
        r.phone || "",
        r.role || "",
        String(r.experience_years || ""),
        `"${(r.skills || "").replace(/"/g, '""')}"`,
        r.status || "",
        r.created_at || "",
      ]
      csvRows.push(values.join(","))
    }

    const csvContent = csvRows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `applications_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({ title: "Export Started", description: `Exported ${rows.length} applications` })
  }

  const bulkDeleteApplications = async (ids: string[]) => {
    if (!ids || ids.length === 0) return
    try {
      const { error } = await supabase.from("job_applications").delete().in("id", ids)
      if (error) throw error
      toast({ title: "Deleted", description: `Deleted ${ids.length} applications` })
      setSelectedIds([])
      fetchData()
    } catch (error) {
      console.error("Error deleting applications:", error)
      toast({ title: "Error", description: "Failed to delete applications", variant: "destructive" })
    }
  }

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      (app.full_name ? app.full_name.toLowerCase() : "").includes(searchTerm.toLowerCase()) ||
      (app.email ? app.email.toLowerCase() : "").includes(searchTerm.toLowerCase()) ||
      (app.application_id ? app.application_id.toLowerCase() : "").includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "submitted":
        return "bg-blue-100 text-blue-800"
      case "under_review":
        return "bg-yellow-100 text-yellow-800"
      case "interview_scheduled":
        return "bg-purple-100 text-purple-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "submitted":
        return <Clock className="h-4 w-4" />
      case "under_review":
        return <Eye className="h-4 w-4" />
      case "interview_scheduled":
        return <UserCheck className="h-4 w-4" />
      case "accepted":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "Signed out successfully",
        description: "You have been logged out.",
      })
      navigate("/auth")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center">
          <BiovaCoLogo className="h-16 w-auto mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-[#032E63] font-medium">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white shadow-sm border-b-4 border-[#08A04B] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <BiovaCoLogo className="h-10 w-auto" />
              <span className="text-xl font-bold text-[#032E63] hidden sm:block">BiovaCo Nexus Admin</span>
              <span className="text-lg font-bold text-[#032E63] sm:hidden">Admin</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-600 font-medium">Welcome, {user?.email?.split("@")[0]}</span>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="text-green-700 hover:text-green-800 bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button variant="ghost" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
              <Link to="/" className="block">
                <Button variant="ghost" className="w-full justify-start text-green-700">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="px-4 py-2 text-sm text-gray-600">Welcome, {user?.email?.split("@")[0]}</div>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full justify-start text-green-700 bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="flex min-h-screen">
        <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white shadow-sm border-r border-gray-200">
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("dashboard")}
            >
              <BarChart3 className="h-4 w-4 mr-3" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === "applications" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("applications")}
            >
              <FileText className="h-4 w-4 mr-3" />
              Applications
            </Button>
            <Button
              variant={activeTab === "newsletter" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("newsletter")}
            >
              <Mail className="h-4 w-4 mr-3" />
              Newsletter
            </Button>
            <Button
              variant={activeTab === "interns" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("interns")}
            >
              <Users className="h-4 w-4 mr-3" />
              Interns
            </Button>
            <Button
              variant={activeTab === "content" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("content")}
            >
              <FileText className="h-4 w-4 mr-3" />
              Our Story
            </Button>
            <Button
              variant={activeTab === "jobs" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("jobs")}
            >
              <Briefcase className="h-4 w-4 mr-3" />
              Job Positions
            </Button>
            <Button
              variant={activeTab === "videos" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("videos")}
            >
              <Video className="h-4 w-4 mr-3" />
              Videos
            </Button>
            <Button
              variant={activeTab === "location" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("location")}
            >
              <MapPin className="h-4 w-4 mr-3" />
              Location
            </Button>
            <Button
              variant={activeTab === "countdown" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("countdown")}
            >
              <Calendar className="h-4 w-4 mr-3" />
              Countdown
            </Button>
            <Button
              variant={activeTab === "postcountdown" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("postcountdown")}
            >
              <Settings className="h-4 w-4 mr-3" />
              Post Countdown
            </Button>
            <Button
              variant={activeTab === "maintenance" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("maintenance")}
            >
              <Wrench className="h-4 w-4 mr-3" />
              Maintenance
            </Button>
            <Button
              variant={activeTab === "posts" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("posts")}
            >
              <FileText className="h-4 w-4 mr-3" />
              Marketing Posts
            </Button>
            <Button
              variant={activeTab === "models3d" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("models3d")}
            >
              <Box className="h-4 w-4 mr-3" />
              3D Models
            </Button>
            <Button
              variant={activeTab === "social" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("social")}
            >
              <Share2 className="h-4 w-4 mr-3" />
              Social Links
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h1 className="text-2xl font-bold text-[#032E63]">Dashboard Overview</h1>
                  <p className="text-sm text-gray-600 mt-1 sm:mt-0">Welcome back, {user?.email?.split("@")[0]}</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="bg-[#032E63] text-white shadow-md border-t-4 border-t-[#08A04B]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                      <FileText className="h-4 w-4 text-[#08A04B]" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{applications.length}</div>
                      <p className="text-xs opacity-80">
                        {applications.filter((app) => app.status === "submitted").length} new submissions
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white text-[#032E63] shadow-md border-t-4 border-t-[#08A04B]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-bold">Newsletter Subscribers</CardTitle>
                      <Mail className="h-4 w-4 text-[#08A04B]" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{newsletters.length}</div>
                      <p className="text-xs opacity-80 font-medium">
                        {newsletters.filter((sub) => sub.confirmed).length} confirmed subscribers
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#f8fafc] text-[#032E63] shadow-md border-t-4 border-t-[#032E63]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-bold">Status Changes</CardTitle>
                      <AlertCircle className="h-4 w-4 text-[#032E63]" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{statusHistory.length}</div>
                      <p className="text-xs opacity-80 font-medium">Recent activity</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card className="border-l-4 border-l-[#032E63] shadow-md">
                  <CardHeader>
                    <CardTitle className="text-[#032E63]">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      <Button
                        variant="outline"
                        className="h-20 flex-col space-y-2 bg-transparent"
                        onClick={() => setActiveTab("applications")}
                      >
                        <FileText className="h-6 w-6" />
                        <span className="text-xs">Applications</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col space-y-2 bg-transparent"
                        onClick={() => setActiveTab("content")}
                      >
                        <Settings className="h-6 w-6" />
                        <span className="text-xs">Content</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col space-y-2 bg-transparent"
                        onClick={() => setActiveTab("jobs")}
                      >
                        <Briefcase className="h-6 w-6" />
                        <span className="text-xs">Jobs</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col space-y-2 bg-transparent"
                        onClick={() => setActiveTab("maintenance")}
                      >
                        <Wrench className="h-6 w-6" />
                        <span className="text-xs">Maintenance</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="lg:hidden mb-6">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="dashboard">Dashboard</option>
                <option value="applications">Applications</option>
                <option value="newsletter">Newsletter</option>
                <option value="interns">Interns</option>
                <option value="content">Our Story</option>
                <option value="jobs">Job Positions</option>
                <option value="videos">Videos</option>
                <option value="location">Location</option>
                <option value="countdown">Countdown</option>
                <option value="postcountdown">Post Countdown</option>
                <option value="maintenance">Maintenance</option>
                <option value="posts">Marketing Posts</option>
                <option value="models3d">3D Models</option>
                <option value="social">Social Links</option>
              </select>
            </div>

            {/* Content Sections */}
            {activeTab === "posts" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Marketing Post</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Title</label>
                      <Input
                        placeholder="Enter post title..."
                        value={editingPost ? editingPost.title : newPost.title}
                        onChange={(e) =>
                          editingPost
                            ? setEditingPost({ ...editingPost, title: e.target.value })
                            : setNewPost({ ...newPost, title: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Content</label>
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 min-h-[120px]"
                        placeholder="Write your post content..."
                        value={editingPost ? editingPost.content : newPost.content}
                        onChange={(e) =>
                          editingPost
                            ? setEditingPost({ ...editingPost, content: e.target.value })
                            : setNewPost({ ...newPost, content: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Image URL (optional)</label>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={editingPost ? editingPost.image_url || "" : newPost.image}
                        onChange={(e) =>
                          editingPost
                            ? setEditingPost({ ...editingPost, image_url: e.target.value })
                            : setNewPost({ ...newPost, image: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
                      <Input
                        placeholder="agriculture, technology, farming"
                        value={editingPost ? editingPost.tags.join(", ") : newPost.tags}
                        onChange={(e) =>
                          editingPost
                            ? setEditingPost({
                                ...editingPost,
                                tags: e.target.value.split(",").map((tag) => tag.trim()),
                              })
                            : setNewPost({ ...newPost, tags: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-gray-100">
                      {editingPost ? (
                        <>
                          <Button onClick={handleUpdatePost} className="w-full sm:w-auto bg-[#08A04B] hover:bg-[#08A04B]/90 text-white">
                            Update Post
                          </Button>
                          <Button variant="outline" className="w-full sm:w-auto" onClick={() => setEditingPost(null)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button onClick={handleCreatePost} className="w-full sm:w-auto bg-[#08A04B] hover:bg-[#08A04B]/90 text-white">
                          Create Post
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Manage Posts ({posts.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {posts.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No posts created yet. Create your first marketing post above!
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {posts.map((post) => (
                          <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-2">
                              <div className="flex-1 pr-0 sm:pr-4">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <h3 className="font-bold text-[#032E63] text-lg">{post.title}</h3>
                                  <span
                                    className={`px-2 py-1 rounded-md text-xs font-medium shrink-0 ${post.is_published ? "bg-[#08A04B]/10 text-[#08A04B]" : "bg-gray-100 text-gray-800"}`}
                                  >
                                    {post.is_published ? "Published" : "Draft"}
                                  </span>
                                </div>
                                <p className="text-gray-500 text-sm mb-3">
                                  {new Date(post.created_at).toLocaleDateString()}
                                </p>
                                <p className="text-gray-700 mb-3">{post.content}</p>
                                {post.image_url && (
                                  <img
                                    src={post.image_url || "/placeholder.svg"}
                                    alt={post.title}
                                    className="w-full max-w-sm h-48 object-cover rounded-md mb-3"
                                  />
                                )}
                                {post.tags && post.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {post.tags.map((tag: string, index: number) => (
                                      <span key={index} className="bg-[#032E63]/10 text-[#032E63] text-xs font-medium px-2 py-1 rounded-md">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => togglePostStatus(post.id)}>
                                  {post.is_published ? "Unpublish" : "Publish"}
                                </Button>
                                <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => setEditingPost(post)}>
                                  Edit
                                </Button>
                                <Button size="sm" variant="destructive" className="w-full sm:w-auto" onClick={() => handleDeletePost(post.id)}>
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "applications" && (
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
              </div>
            )}

            {activeTab === "newsletter" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-[#032E63]">Newsletter Subscribers</h1>
                
                <div className="hidden md:block overflow-hidden rounded-md border border-gray-200 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#f8fafc]">
                        <TableHead className="text-[#032E63] font-bold">Email</TableHead>
                        <TableHead className="text-[#032E63] font-bold">Confirmed</TableHead>
                        <TableHead className="text-[#032E63] font-bold">Subscribed At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newsletters.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.email}</TableCell>
                          <TableCell>
                            <Badge className={sub.confirmed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                              {sub.confirmed ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">{new Date(sub.subscribed_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Responsive Vertical Cards */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {newsletters.map((sub) => (
                    <Card key={sub.id} className="p-4 border-l-4 border-l-[#08A04B] shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-[#032E63] break-all mr-2">{sub.email}</span>
                        <Badge className={sub.confirmed ? "bg-green-100 text-green-800 shrink-0" : "bg-red-100 text-red-800 shrink-0"}>
                          {sub.confirmed ? "Confirmed" : "Pending"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">
                        <span className="text-xs uppercase tracking-wider mr-1">Date:</span> 
                        {new Date(sub.subscribed_at).toLocaleDateString()}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "interns" && <InternManagement />}

            {activeTab === "content" && <PageContentManagement />}

            {activeTab === "jobs" && <JobPositionsManagement />}

            {activeTab === "videos" && <VideoManagement />}

            {activeTab === "location" && <LocationManagement />}

            {activeTab === "countdown" && <CountdownManagement />}

            {activeTab === "postcountdown" && <PostCountdownManagement />}

            {activeTab === "maintenance" && <MaintenanceManagement />}

            {activeTab === "models3d" && <Model3DManagement />}

            {activeTab === "social" && (
              <div className="space-y-6">
                <SocialLinksManagement />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {contactRemarkOpen && (
        <ContactRemarkModal
          open={contactRemarkOpen}
          onClose={() => setContactRemarkOpen(false)}
          applicantName={selectedApplicant?.name || ""}
          applicantEmail={selectedApplicant?.email || ""}
          applicationId={selectedApplicant?.id || ""}
        />
      )}

      {showDetailModal && selectedApplication && (
        <ApplicationDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          application={selectedApplication}
        />
      )}
    </div>
  )
}

export default Admin
