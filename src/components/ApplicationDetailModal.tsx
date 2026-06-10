"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  const { toast } = useToast()

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

  if (!application) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Application Details - {application.full_name}
          </DialogTitle>
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
