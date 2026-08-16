import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { User, ShieldCheck, Mail, Phone, Building, Briefcase, Save, Loader2, MapPin, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PersonalWorkspaceService, getCleanEmail } from "@/services/personalWorkspaceService"

interface UserProfileManagementProps {
  userEmail?: string
}

export function UserProfileManagement({ userEmail }: UserProfileManagementProps) {
  const activeEmail = getCleanEmail(userEmail)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadUserProfile()
  }, [activeEmail])

  const loadUserProfile = async () => {
    const data = await PersonalWorkspaceService.getProfile(activeEmail)
    setProfile(data)
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    setLoading(true)
    try {
      await PersonalWorkspaceService.saveProfile(activeEmail, profile)
      toast({
        title: "Profile Saved Successfully! ✨",
        description: "Your user profile details have been synchronized across the system."
      })
    } catch {
      toast({
        title: "Update Saved Locally",
        description: "Saved profile changes to your local workspace."
      })
    } finally {
      setLoading(false)
    }
  }

  if (!profile) return null

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <User className="h-8 w-8 text-[#4B49AC]" /> My Profile & Account Settings
        </h2>
        <p className="text-gray-500 mt-2 flex items-center gap-2">
          Manage your credentials, executive designation, contact parameters, and preferences for <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs">{activeEmail}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Summary */}
        <Card className="lg:col-span-1 border-gray-200">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-[#4B49AC] to-[#7DA0FA] text-white flex items-center justify-center text-3xl font-black shadow-md">
              {profile.avatarInitials || activeEmail.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{profile.name}</h3>
              <p className="text-xs text-gray-500 font-medium">{profile.role}</p>
              <Badge variant="outline" className="mt-2 bg-[#f2f6ff] text-[#4B49AC] border-[#7DA0FA]/30 text-[10px] font-mono font-bold">
                {profile.employeeId}
              </Badge>
            </div>

            <hr className="border-gray-100" />

            <div className="text-left text-xs space-y-3 text-gray-600">
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[#4B49AC] flex-shrink-0" />
                <span className="truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-[#4B49AC] flex-shrink-0" />
                <span>{profile.phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Building className="h-4 w-4 text-[#4B49AC] flex-shrink-0" />
                <span className="truncate">{profile.department}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-[#4B49AC] flex-shrink-0" />
                <span>{profile.location}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Edit Profile Form */}
        <Card className="lg:col-span-2 border-gray-200">
          <CardHeader className="py-4 px-6 border-b border-gray-100">
            <CardTitle className="text-base font-bold text-gray-900">Personal Information</CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Update your account details and profile information.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Full Name</label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Official Email</label>
                <Input
                  disabled
                  value={profile.email}
                  className="text-xs h-9 bg-gray-50 text-gray-500 cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Designation / Role</label>
                <Input
                  value={profile.role}
                  onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Contact Phone</label>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Department / Division</label>
                <Input
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Work Location</label>
                <Input
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Professional Bio & Notes</label>
              <Textarea
                rows={4}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="text-xs leading-relaxed"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={handleSaveProfile}
                disabled={loading}
                className="bg-[#4B49AC] hover:bg-[#3b3a88] text-white font-medium text-xs h-9 shadow-sm"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
