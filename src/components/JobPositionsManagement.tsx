"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Briefcase, Plus, ArrowUp, ArrowDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface JobPosition {
  id: string
  role_key: string
  title: string
  department: string
  location: string
  job_type: string
  description: string
  is_active: boolean
  display_order: number
  created_at: string
  salary_range: string
  experience_level: string
  contact_email: string
  application_deadline: string
  remote_work_available: boolean
  detailed_description: string
  requirements: string
  responsibilities: string
  qualifications: string
  benefits: string
}

const defaultFormData = {
  role_key: "",
  title: "",
  department: "",
  location: "",
  job_type: "Full-time",
  description: "",
  is_active: true,
  display_order: 0,
  salary_range: "",
  experience_level: "",
  contact_email: "",
  application_deadline: "",
  remote_work_available: false,
  detailed_description: "",
  requirements: "",
  responsibilities: "",
  qualifications: "",
  benefits: "",
}

const extractValue = (text: string, patterns: RegExp[]) => {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      return match[1].trim()
    }
  }
  return ""
}

const normalizeListBlock = (value: string) =>
  value
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean)
    .join("\n")

const extractSection = (text: string, labels: string[]) => {
  const labelPattern = labels.join("|")
  const match = text.match(
    new RegExp(`(?:^|\\n)\\s*(?:${labelPattern})\\s*[:\-]?\\s*([\\s\\S]*?)(?=\\n\\s*[A-Z][^\\n]{0,80}\\s*[:\-]|$)`, "i"),
  )
  return match?.[1] ? normalizeListBlock(match[1].trim()) : ""
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")

const buildDescription = (form: typeof defaultFormData) => {
  const sections = [
    form.detailed_description,
    form.requirements && `Requirements:\n${form.requirements}`,
    form.responsibilities && `Responsibilities:\n${form.responsibilities}`,
    form.qualifications && `Qualifications:\n${form.qualifications}`,
    form.benefits && `Benefits:\n${form.benefits}`,
  ].filter(Boolean)

  return sections.join("\n\n") || form.description
}

const parseJobPaste = (text: string) => {
  const cleanedText = text.trim()

  if (!cleanedText) {
    return defaultFormData
  }

  const title = extractValue(cleanedText, [
    /(?:job title|title|position|role)\s*[:\-]\s*(.+)/i,
    /^(?!.*[:\-]).{3,80}$/m,
  ])
  const department = extractValue(cleanedText, [/department\s*[:\-]\s*(.+)/i])
  const location = extractValue(cleanedText, [/location\s*[:\-]\s*(.+)/i])
  const jobType = extractValue(cleanedText, [/(?:job type|employment type|type)\s*[:\-]\s*(.+)/i])
  const salaryRange = extractValue(cleanedText, [/(?:salary range|salary|compensation)\s*[:\-]\s*(.+)/i])
  const experienceLevel = extractValue(cleanedText, [/(?:experience level|experience)\s*[:\-]\s*(.+)/i])
  const contactEmail = extractValue(cleanedText, [/(?:contact email|email)\s*[:\-]\s*([^\n]+)/i])
  const applicationDeadline = extractValue(cleanedText, [
    /(?:application deadline|deadline|apply by)\s*[:\-]\s*(\d{4}-\d{2}-\d{2})/i,
    /(?:application deadline|deadline|apply by)\s*[:\-]\s*(.+)/i,
  ])

  const detailedDescription = extractSection(cleanedText, ["Detailed Description", "Job Description", "Description"])
  const requirements = extractSection(cleanedText, ["Requirements", "Qualifications", "Prerequisites"])
  const responsibilities = extractSection(cleanedText, ["Responsibilities", "Key Responsibilities", "Duties"])
  const qualifications = extractSection(cleanedText, ["Preferred Qualifications", "Qualifications", "Nice to have"])
  const benefits = extractSection(cleanedText, ["Benefits", "Perks", "Benefits & Perks"])

  const inferredTitle = title || ""
  const inferredDepartment = department || ""

  return {
    ...defaultFormData,
    role_key: slugify(inferredTitle || inferredDepartment || "new_position"),
    title: inferredTitle,
    department: inferredDepartment,
    location,
    job_type: jobType || "Full-time",
    description: detailedDescription || cleanedText,
    salary_range: salaryRange,
    experience_level: experienceLevel,
    contact_email: contactEmail,
    application_deadline: applicationDeadline,
    remote_work_available: /remote/i.test(cleanedText),
    detailed_description: detailedDescription,
    requirements,
    responsibilities,
    qualifications,
    benefits,
  }
}

export function JobPositionsManagement() {
  const [positions, setPositions] = useState<JobPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(defaultFormData)
  const [pasteText, setPasteText] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchPositions()
  }, [])

  const fetchPositions = async () => {
    try {
      const { data, error } = await supabase
        .from("job_positions")
        .select("*")
        .order("display_order", { ascending: true })

      if (error) throw error
      setPositions(data || [])
    } catch (error) {
      console.error("Error fetching positions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch job positions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const roleKey = formData.role_key.trim() || slugify(formData.title || formData.department || "new_position")
      const coreData = {
        role_key: roleKey,
        title: formData.title.trim(),
        department: formData.department.trim(),
        location: formData.location.trim(),
        job_type: formData.job_type,
        description: buildDescription(formData).trim(),
        is_active: formData.is_active,
        display_order: formData.display_order,
      }

      if (editingId) {
        const { data, error } = await supabase
          .from("job_positions")
          .update(coreData)
          .eq("id", editingId)
          .select("*")
          .single()

        if (error) throw error
        if (!data) {
          toast({
            title: "Not updated",
            description: "No changes were saved. Please check permissions or the record ID.",
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Success",
          description: "Job position updated successfully",
        })
      } else {
        // Set display_order to max + 1 for new positions
        const maxOrder = Math.max(...positions.map((p) => p.display_order), 0)
        const insertData = {
          ...coreData,
          display_order: maxOrder + 1,
        }
        const { error } = await supabase.from("job_positions").insert([insertData])

        if (error) throw error
        toast({
          title: "Success",
          description: "Job position created successfully",
        })
      }

      setFormData({
        ...defaultFormData,
      })
      setPasteText("")
      setEditingId(null)
      fetchPositions()
    } catch (error) {
      console.error("Error saving position:", error)
      toast({
        title: "Error",
        description: "Failed to save job position",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (position: JobPosition) => {
    setEditingId(position.id)
    const normalizedDeadline = position.application_deadline ? position.application_deadline.slice(0, 10) : ""

    setFormData({
      role_key: position.role_key,
      title: position.title,
      department: position.department,
      location: position.location,
      job_type: position.job_type,
      description: position.description,
      is_active: position.is_active,
      display_order: position.display_order,
      salary_range: position.salary_range || "",
      experience_level: position.experience_level || "",
      contact_email: position.contact_email || "",
      application_deadline: normalizedDeadline,
      remote_work_available: position.remote_work_available || false,
      detailed_description: position.detailed_description || "",
      requirements: position.requirements || "",
      responsibilities: position.responsibilities || "",
      qualifications: position.qualifications || "",
      benefits: position.benefits || "",
    })
    setPasteText("")
  }

  const handlePasteExtract = () => {
    const parsed = parseJobPaste(pasteText)
    setFormData(parsed)

    toast({
      title: "Extracted",
      description: "Pasted content se fields fill ho gaye.",
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job position?")) return

    try {
      const { error } = await supabase.from("job_positions").delete().eq("id", id)

      if (error) throw error
      toast({
        title: "Success",
        description: "Job position deleted successfully",
      })
      fetchPositions()
    } catch (error) {
      console.error("Error deleting position:", error)
      toast({
        title: "Error",
        description: "Failed to delete job position",
        variant: "destructive",
      })
    }
  }

  const updateDisplayOrder = async (id: string, newOrder: number) => {
    try {
      const { error } = await supabase.from("job_positions").update({ display_order: newOrder }).eq("id", id)

      if (error) throw error
      fetchPositions()
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        title: "Error",
        description: "Failed to update position order",
        variant: "destructive",
      })
    }
  }

  const movePosition = (id: string, direction: "up" | "down") => {
    const currentIndex = positions.findIndex((p) => p.id === id)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= positions.length) return

    const currentPosition = positions[currentIndex]
    const targetPosition = positions[newIndex]

    updateDisplayOrder(currentPosition.id, targetPosition.display_order)
    updateDisplayOrder(targetPosition.id, currentPosition.display_order)
  }

  if (loading) {
    return <div className="text-center py-4">Loading job positions...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingId ? "Edit Job Position" : "Add New Job Position"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
              <Label htmlFor="paste_job_text">Paste full job post here</Label>
              <Textarea
                id="paste_job_text"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste the full job post here and click Extract & Fill"
                rows={6}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={handlePasteExtract} disabled={!pasteText.trim()}>
                  Extract & Fill
                </Button>
                <Button type="button" variant="ghost" onClick={() => setPasteText("")} disabled={!pasteText}>
                  Clear Paste Box
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* row 1 */}
              <div>
                <Label htmlFor="role_key">Role Key</Label>
                <Input
                  id="role_key"
                  value={formData.role_key}
                  onChange={(e) => setFormData({ ...formData, role_key: e.target.value })}
                  placeholder="embedded_system"
                  required
                />
              </div>

              <div>
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Embedded System Engineer"
                  required
                />
              </div>

              {/* row 2 */}
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Engineering"
                  required
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Nagpur, Maharashtra"
                  required
                />
              </div>

              {/* row 3 */}
              <div>
                <Label htmlFor="job_type">Job Type</Label>
                <Select
                  value={formData.job_type}
                  onValueChange={(value) => setFormData({ ...formData, job_type: value })}
                >
                  <SelectTrigger id="job_type">
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Internship">Internship</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="salary_range">Salary Range</Label>
                <Input
                  id="salary_range"
                  value={formData.salary_range}
                  onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                  placeholder="₹3-6 LPA"
                />
              </div>

              {/* row 4 */}
              <div>
                <Label htmlFor="experience_level">Experience Level</Label>
                <Input
                  id="experience_level"
                  value={formData.experience_level}
                  onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                  placeholder="Entry to Mid-level"
                />
              </div>

              <div>
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="careers@electroculture.in"
                />
              </div>

              {/* row 5 */}
              <div>
                <Label htmlFor="application_deadline">Application Deadline</Label>
                <Input
                  id="application_deadline"
                  type="date"
                  value={formData.application_deadline}
                  onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="remote_work_available"
                  checked={formData.remote_work_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, remote_work_available: checked })}
                />
                <Label htmlFor="remote_work_available">Remote Work Available</Label>
              </div>

              {/* row 6 */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="detailed_description">Detailed Description</Label>
                <Textarea
                  id="detailed_description"
                  value={formData.detailed_description}
                  onChange={(e) => setFormData({ ...formData, detailed_description: e.target.value })}
                  placeholder="Comprehensive job description..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="requirements">Requirements (one per line)</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Bachelor's degree in Engineering\n2+ years experience\nStrong programming skills"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="responsibilities">Key Responsibilities (one per line)</Label>
                <Textarea
                  id="responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  placeholder="Design and develop embedded systems\nCollaborate with cross-functional teams\nTest and debug hardware/software"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="qualifications">Preferred Qualifications (one per line)</Label>
                <Textarea
                  id="qualifications"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                  placeholder="Master's degree preferred\nExperience with IoT systems\nKnowledge of agricultural technology"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="benefits">Benefits & Perks (one per line)</Label>
                <Textarea
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="Health insurance\nFlexible working hours\nProfessional development opportunities\nPerformance bonuses"
                  rows={4}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed job description..."
                rows={4}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">{editingId ? "Update Position" : "Create Position"}</Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null)
                    setFormData({
                      ...defaultFormData,
                    })
                    setPasteText("")
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Existing Positions</h3>
        {positions.map((position, index) => (
          <Card key={position.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <h4 className="font-medium">{position.title}</h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {position.job_type}
                    </span>
                    {position.is_active && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {position.department} • {position.location}
                  </p>
                  <p className="text-sm text-gray-500 line-clamp-2">{position.description}</p>
                </div>
                <div className="flex gap-2 flex-col">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => movePosition(position.id, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => movePosition(position.id, "down")}
                      disabled={index === positions.length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(position)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(position.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
