import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Building2, Save, MapPin, Phone, Mail, Globe, Hash } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function CompanyProfile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const { data, error } = await supabase.from('company_profile').select('*').limit(1).single()
    if (data) setProfile(data)
    else if (!error) {
      // Create empty profile if none exists
      const newProfile = { company_name: "New Company", email: "", phone: "", website: "" }
      const { data: inserted } = await supabase.from('company_profile').insert(newProfile).select().single()
      setProfile(inserted || newProfile)
    }
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('company_profile').update(profile).eq('id', profile.id)
    setSaving(false)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Saved", description: "Company profile updated successfully." })
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-[#4B49AC]" /> Company Profile
          </h2>
          <p className="text-gray-500 mt-2">Manage your core enterprise identity and contact details.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#4B49AC] hover:bg-[#3b3a88]">
          <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>This information is used across invoices and official documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input name="company_name" value={profile?.company_name || ""} onChange={handleChange} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Registration / CIN Number</label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input name="registration_number" value={profile?.registration_number || ""} onChange={handleChange} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Official Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input name="email" value={profile?.email || ""} onChange={handleChange} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input name="phone" value={profile?.phone || ""} onChange={handleChange} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input name="website" value={profile?.website || ""} onChange={handleChange} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">GST / Tax ID</label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input name="tax_id" value={profile?.tax_id || ""} onChange={handleChange} className="pl-9" />
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <label className="text-sm font-medium">Headquarters Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input name="address" value={profile?.address || ""} onChange={handleChange} className="pl-9" placeholder="Street Address" />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <Input name="city" value={profile?.city || ""} onChange={handleChange} placeholder="City" />
              <Input name="state" value={profile?.state || ""} onChange={handleChange} placeholder="State" />
              <Input name="country" value={profile?.country || ""} onChange={handleChange} placeholder="Country" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
