"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Settings, AlertTriangle, CheckCircle } from "lucide-react"

interface MaintenanceSettings {
  id: string
  is_maintenance_mode: boolean
  maintenance_title: string
  maintenance_message: string
  estimated_completion: string | null
}

export function MaintenanceManagement() {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    is_maintenance_mode: false,
    maintenance_title: "Site Under Maintenance",
    maintenance_message: "We are currently performing scheduled maintenance. Please check back soon.",
    estimated_completion: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("maintenance_settings").select("*").maybeSingle()

      if (error) {
        throw error
      }

      if (data) {
        setSettings(data)
        setFormData({
          is_maintenance_mode: data.is_maintenance_mode,
          maintenance_title: data.maintenance_title,
          maintenance_message: data.maintenance_message,
          estimated_completion: data.estimated_completion
            ? new Date(data.estimated_completion).toISOString().slice(0, 16)
            : "",
        })
      }
    } catch (error) {
      console.error("Error fetching maintenance settings:", error)
      toast({
        title: "Error",
        description: "Failed to fetch maintenance settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const dataToSave = {
        ...formData,
        estimated_completion: formData.estimated_completion
          ? new Date(formData.estimated_completion).toISOString()
          : null,
      }

      if (settings) {
        const { error } = await supabase.from("maintenance_settings").update(dataToSave).eq("id", settings.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("maintenance_settings").insert([dataToSave])

        if (error) throw error
      }

      toast({
        title: "Success",
        description: `Maintenance mode ${formData.is_maintenance_mode ? "enabled" : "disabled"} successfully`,
      })

      fetchSettings()
    } catch (error) {
      console.error("Error saving maintenance settings:", error)
      toast({
        title: "Error",
        description: "Failed to save maintenance settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading maintenance settings...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Maintenance Mode Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Maintenance Mode Toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">Maintenance Mode</Label>
                <p className="text-sm text-gray-600">Enable to show maintenance page to all visitors</p>
              </div>
              <Switch
                checked={formData.is_maintenance_mode}
                onCheckedChange={(checked) => setFormData({ ...formData, is_maintenance_mode: checked })}
              />
            </div>

            {/* Status Alert */}
            <Alert
              className={
                formData.is_maintenance_mode ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"
              }
            >
              <div className="flex items-center gap-2">
                {formData.is_maintenance_mode ? (
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <AlertDescription className={formData.is_maintenance_mode ? "text-orange-800" : "text-green-800"}>
                  {formData.is_maintenance_mode
                    ? "⚠️ Site is currently in maintenance mode - visitors will see the maintenance page"
                    : "✅ Site is live and accessible to all visitors"}
                </AlertDescription>
              </div>
            </Alert>

            {/* Maintenance Content */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="maintenance_title">Maintenance Page Title</Label>
                <Input
                  id="maintenance_title"
                  value={formData.maintenance_title}
                  onChange={(e) => setFormData({ ...formData, maintenance_title: e.target.value })}
                  placeholder="Site Under Maintenance"
                  required
                />
              </div>

              <div>
                <Label htmlFor="maintenance_message">Maintenance Message</Label>
                <Textarea
                  id="maintenance_message"
                  value={formData.maintenance_message}
                  onChange={(e) => setFormData({ ...formData, maintenance_message: e.target.value })}
                  placeholder="We are currently performing scheduled maintenance. Please check back soon."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="estimated_completion">Estimated Completion (Optional)</Label>
                <Input
                  id="estimated_completion"
                  type="datetime-local"
                  value={formData.estimated_completion}
                  onChange={(e) => setFormData({ ...formData, estimated_completion: e.target.value })}
                />
                <p className="text-sm text-gray-500 mt-1">Show visitors when maintenance is expected to complete</p>
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Maintenance Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
