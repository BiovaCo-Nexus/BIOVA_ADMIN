import { useState, useEffect, useRef } from "react"
import { supabase } from "@/integrations/supabase/client"

interface UseActiveTimeTrackerOptions {
  userEmail?: string
  enabled?: boolean
}

export interface ActiveTimeTrackerState {
  activeSeconds: number
  formattedActiveTime: string
  targetHours: number
  progressPercentage: number
  isCompleted: boolean
  userType: string
}

export function useActiveTimeTracker({ userEmail, enabled = true }: UseActiveTimeTrackerOptions): ActiveTimeTrackerState {
  const [activeSeconds, setActiveSeconds] = useState<number>(0)
  const [targetHours, setTargetHours] = useState<number>(8.0)
  const [userType, setUserType] = useState<string>("Team Member")
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const syncRef = useRef<NodeJS.Timeout | null>(null)
  const isWindowActiveRef = useRef<boolean>(true)

  // 1. Fetch initial user access time & target from database
  useEffect(() => {
    if (!enabled || !userEmail) return

    async function loadUserTimeData() {
      try {
        const { data, error } = await supabase
          .from("user_page_access")
          .select("logged_active_seconds, target_hours_per_day, user_type")
          .eq("user_email", userEmail.toLowerCase().trim())
          .maybeSingle()

        if (!error && data) {
          if (typeof data.logged_active_seconds === "number") {
            setActiveSeconds(data.logged_active_seconds)
          }
          if (typeof data.target_hours_per_day === "number" && data.target_hours_per_day > 0) {
            setTargetHours(data.target_hours_per_day)
          }
          if (data.user_type) {
            setUserType(data.user_type)
          }
        }
      } catch (err) {
        console.warn("Time tracker initial load notice:", err)
      }
    }

    loadUserTimeData()
  }, [userEmail, enabled])

  // 2. Track tab activity (window focus/blur & document visibility)
  useEffect(() => {
    if (!enabled || !userEmail) return

    const handleFocus = () => { isWindowActiveRef.current = true }
    const handleBlur = () => { isWindowActiveRef.current = false }
    const handleVisibilityChange = () => {
      isWindowActiveRef.current = !document.hidden
    }

    window.addEventListener("focus", handleFocus)
    window.addEventListener("blur", handleBlur)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Increment active seconds every 1 sec if window is active
    timerRef.current = setInterval(() => {
      if (isWindowActiveRef.current) {
        setActiveSeconds(prev => prev + 1)
      }
    }, 1000)

    // Periodically save active time to Supabase database every 30 seconds
    syncRef.current = setInterval(() => {
      setActiveSeconds(currentSecs => {
        if (currentSecs > 0 && userEmail) {
          supabase
            .from("user_page_access")
            .update({
              logged_active_seconds: currentSecs,
              last_active_at: new Date().toISOString()
            })
            .eq("user_email", userEmail.toLowerCase().trim())
            .then(() => {})
        }
        return currentSecs
      })
    }, 30000)

    return () => {
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("blur", handleBlur)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      if (timerRef.current) clearInterval(timerRef.current)
      if (syncRef.current) clearInterval(syncRef.current)
    }
  }, [userEmail, enabled])

  // Formatting helpers
  const hours = Math.floor(activeSeconds / 3600)
  const minutes = Math.floor((activeSeconds % 3600) / 60)
  const seconds = activeSeconds % 60

  const formattedActiveTime = `${hours}h ${minutes}m ${seconds}s`
  const targetSeconds = targetHours * 3600
  const progressPercentage = Math.min(100, Math.round((activeSeconds / (targetSeconds || 1)) * 100))
  const isCompleted = activeSeconds >= targetSeconds

  return {
    activeSeconds,
    formattedActiveTime,
    targetHours,
    progressPercentage,
    isCompleted,
    userType
  }
}
