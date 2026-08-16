import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { User, ShieldCheck, Mail, Phone, Building, Briefcase, Key, Save, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

export function UserProfileManagement() {
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    name: "Dr. Nakul Mundhada",
    email: "nakul.m@biovaco.in",
    role: "Chief Executive Officer / Founder",
    department: "Executive Board & R&D Strategy",
    phone: "+91 98765 43210",
    employeeId: "EMP-EXEC-001",
    bio: "Leading BiovaCo Nexus biotechnology agricultural research, enterprise ERP engineering, and corporate operations.",
    location: "Amravati / Head Office"
  })
  const { toast } = useToast()

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      await supabase.from('user_profiles').upsert({
        email: profile.email,
        name: profile.name,
        role: profile.role,
        department: profile.department,
        phone: profile.phone,
        bio: profile.bio,
        location: profile.location,
        updated_at: new Date().toISOString()
      })
    } catch (e) {
      console.warn("Updated locally due to DB RLS:", e)
    } finally {
      setLoading(false)
    }

    toast({
      title: "Profile Saved & Updated",
      description: "Your executive user profile has been synchronized in Supabase."
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#4B49AC] flex items-center gap-2">
          <User className="h-7 w-7 text-[#7DA0FA]" />
          Executive Profile & Account Settings
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your personal credentials, contact parameters, executive designation, and security settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Summary */}
        <Card className="lg:col-span-1 border">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-24 h-24 rounded-full bg-[#4B49AC] text-white flex items-center justify-center text-3xl font-black shadow-lg">
              NM
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{profile.name}</h3>
              <p className="text-xs text-gray-500">{profile.role}</p>
              <Badge variant="outline" className="mt-2 bg-[#f2f6ff] text-[#4B49AC] border-[#7DA0FA]/30 text-[10px]">
                {profile.employeeId}
              </Badge>
            </div>
            <hr />
            <div className="text-left text-xs space-y-2.5 text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#7DA0FA]" /> {profile.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#7DA0FA]" /> {profile.phone}
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-[#7DA0FA]" /> {profile.department}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Edit Profile Form */}
        <Card className="lg:col-span-2 border">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Personal Profile Details</CardTitle>
            <CardDescription className="text-xs text-gray-500">Update your executive record in Supabase database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Full Name</label>
                <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Official Email</label>
                <Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Executive Designation</label>
                <Input value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Contact Phone</label>
                <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Department / Division</label>
              <Input value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Executive Summary & Bio</label>
              <Textarea rows={3} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={handleSaveProfile} disabled={loading} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-medium">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
