"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"

interface MaintenanceSettings {
  is_maintenance_mode: boolean
  maintenance_title: string
  maintenance_message: string
  estimated_completion: string | null
}

export function useMaintenanceMode() {
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMaintenanceSettings()

    // Set up real-time subscription for maintenance settings
    const channel = supabase
      .channel("maintenance-settings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "maintenance_settings",
        },
        () => {
          fetchMaintenanceSettings()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchMaintenanceSettings = async () => {
    try {
      const { data, error } = await supabase.from("maintenance_settings").select("*").single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      setMaintenanceSettings(
        data || {
          is_maintenance_mode: false,
          maintenance_title: "Site Under Maintenance",
          maintenance_message: "We are currently performing scheduled maintenance. Please check back soon.",
          estimated_completion: null,
        },
      )
    } catch (error) {
      console.error("Error fetching maintenance settings:", error)
      setMaintenanceSettings({
        is_maintenance_mode: false,
        maintenance_title: "Site Under Maintenance",
        maintenance_message: "We are currently performing scheduled maintenance. Please check back soon.",
        estimated_completion: null,
      })
    } finally {
      setLoading(false)
    }
  }

  return { maintenanceSettings, loading }
}
