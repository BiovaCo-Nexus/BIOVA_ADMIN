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
  loginTime: string | null
  lastActiveTime: string | null
  weeklyLoggedSeconds: number
  targetHoursPerWeek: number
  weeklyProgressPercentage: number
  isWeeklyCompleted: boolean
}

export function useActiveTimeTracker({ userEmail, enabled = true }: UseActiveTimeTrackerOptions): ActiveTimeTrackerState {
  const [activeSeconds, setActiveSeconds] = useState<number>(0)
  const [targetHours, setTargetHours] = useState<number>(8.0)
  const [targetHoursPerWeek, setTargetHoursPerWeek] = useState<number>(40.0)
  const [weeklyLoggedSeconds, setWeeklyLoggedSeconds] = useState<number>(0)
  const [userType, setUserType] = useState<string>("Team Member")
  const [loginTime, setLoginTime] = useState<string | null>(null)
  const [lastActiveTime, setLastActiveTime] = useState<string | null>(null)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const syncRef = useRef<NodeJS.Timeout | null>(null)
  const isWindowActiveRef = useRef<boolean>(true)

  // 1. Fetch initial user access time, login/logout, and targets from database
  useEffect(() => {
    if (!enabled || !userEmail) return

    async function loadUserTimeData() {
      try {
        const { data, error } = await supabase
          .from("user_page_access")
          .select("logged_active_seconds, target_hours_per_day, target_hours_per_week, weekly_logged_seconds, user_type, first_login_at, last_active_at")
          .eq("user_email", userEmail.toLowerCase().trim())
          .maybeSingle()

        const nowIso = new Date().toISOString()
        const nowFormattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

        if (!error && data) {
          if (typeof data.logged_active_seconds === "number") {
            setActiveSeconds(data.logged_active_seconds)
          }
          if (typeof data.weekly_logged_seconds === "number") {
            setWeeklyLoggedSeconds(data.weekly_logged_seconds)
          } else {
            setWeeklyLoggedSeconds((data.logged_active_seconds || 0) * 5)
          }
          if (typeof data.target_hours_per_day === "number" && data.target_hours_per_day > 0) {
            setTargetHours(data.target_hours_per_day)
            setTargetHoursPerWeek(data.target_hours_per_week || data.target_hours_per_day * 5)
          }
          if (data.user_type) {
            setUserType(data.user_type)
          }

          // Check first login time today
          if (data.first_login_at) {
            const loginDate = new Date(data.first_login_at)
            const isToday = loginDate.toDateString() === new Date().toDateString()
            if (isToday) {
              setLoginTime(loginDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
            } else {
              // New day first login
              setLoginTime(nowFormattedTime)
              supabase
                .from("user_page_access")
                .update({ first_login_at: nowIso, last_active_at: nowIso })
                .eq("user_email", userEmail.toLowerCase().trim())
                .then(() => {})
            }
          } else {
            // First time login ever
            setLoginTime(nowFormattedTime)
            supabase
              .from("user_page_access")
              .update({ first_login_at: nowIso, last_active_at: nowIso })
              .eq("user_email", userEmail.toLowerCase().trim())
              .then(() => {})
          }

          if (data.last_active_at) {
            setLastActiveTime(new Date(data.last_active_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
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
        setWeeklyLoggedSeconds(prev => prev + 1)
        setLastActiveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      }
    }, 1000)

    // Periodically save active time & last logout/active timestamp to Supabase every 30 seconds
    syncRef.current = setInterval(() => {
      setActiveSeconds(currentSecs => {
        if (currentSecs > 0 && userEmail) {
          const nowIso = new Date().toISOString()
          supabase
            .from("user_page_access")
            .update({
              logged_active_seconds: currentSecs,
              weekly_logged_seconds: currentSecs * 5,
              last_active_at: nowIso
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

  const targetWeeklySeconds = targetHoursPerWeek * 3600
  const weeklyProgressPercentage = Math.min(100, Math.round((weeklyLoggedSeconds / (targetWeeklySeconds || 1)) * 100))
  const isWeeklyCompleted = weeklyLoggedSeconds >= targetWeeklySeconds

  return {
    activeSeconds,
    formattedActiveTime,
    targetHours,
    progressPercentage,
    isCompleted,
    userType,
    loginTime,
    lastActiveTime,
    weeklyLoggedSeconds,
    targetHoursPerWeek,
    weeklyProgressPercentage,
    isWeeklyCompleted
  }
}
