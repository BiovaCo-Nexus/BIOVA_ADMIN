"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Globe } from "lucide-react"

type SocialLinks = {
  instagram?: string
  youtube?: string
  linkedin?: string
}

export default function SocialLinksManagement() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [links, setLinks] = useState<SocialLinks>({ instagram: "", youtube: "", linkedin: "" })
  const [rowId, setRowId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("site_settings")
        .select("id, setting_value")
        .eq("setting_name", "social_links")
        .limit(1)
        .maybeSingle()

      if (!error && data) {
        setRowId(data.id)
        const v = (data.setting_value as any) || {}
        setLinks({
          instagram: v.instagram || "",
          youtube: v.youtube || "",
          linkedin: v.linkedin || "",
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        category: "social",
        setting_name: "social_links",
        setting_value: {
          instagram: links.instagram?.trim() || null,
          youtube: links.youtube?.trim() || null,
          linkedin: links.linkedin?.trim() || null,
        },
        is_active: true,
      }

      if (rowId) {
        const { error } = await supabase.from("site_settings").update(payload).eq("id", rowId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from("site_settings").insert(payload).select("id").single()
        if (error) throw error
        setRowId(data.id)
      }

      toast({ title: "Saved", description: "Social links updated successfully." })
    } catch (e) {
      console.error(e)
      toast({ title: "Error", description: "Failed to save social links.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-green-600" />
          <CardTitle>Social Links</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : (
          <>
            <div>
              <Label htmlFor="instagram">Instagram URL</Label>
              <Input
                id="instagram"
                placeholder="https://instagram.com/your-handle"
                value={links.instagram}
                onChange={(e) => setLinks((s) => ({ ...s, instagram: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="youtube">YouTube URL</Label>
              <Input
                id="youtube"
                placeholder="https://youtube.com/@your-channel"
                value={links.youtube}
                onChange={(e) => setLinks((s) => ({ ...s, youtube: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                placeholder="https://www.linkedin.com/company/your-company"
                value={links.linkedin}
                onChange={(e) => setLinks((s) => ({ ...s, linkedin: e.target.value }))}
              />
            </div>
            <div className="pt-2">
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
