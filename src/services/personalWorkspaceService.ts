import { supabase } from "@/integrations/supabase/client"

// Helper to get sanitized email key for reliable local isolation
export const getCleanEmail = (email?: string): string => {
  if (!email || email.trim() === "") return "guest@biovaco.in"
  return email.trim().toLowerCase()
}

// ─── 1. PERSONAL TASKS TYPES & STORAGE ───
export interface PersonalTask {
  id: string
  user_email: string
  title: string
  priority: "High" | "Medium" | "Low"
  dueDate: string
  category: string
  completed: boolean
  description?: string
  created_at?: string
}

export const PersonalWorkspaceService = {
  // ─── 1. TASKS CRUD ───
  getTasks: async (userEmail: string): Promise<PersonalTask[]> => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_tasks`
    
    // Query Supabase directly
    try {
      const { data, error } = await supabase
        .from('personal_tasks' as any)
        .select('*')
        .eq('user_email', clean)
        .order('created_at', { ascending: false })

      if (!error && data) {
        const mapped: PersonalTask[] = data.map((d: any) => ({
          id: String(d.id),
          user_email: clean,
          title: d.title,
          priority: d.priority || "Medium",
          dueDate: d.due_date || new Date().toISOString().slice(0, 10),
          category: d.category || "General",
          completed: Boolean(d.completed),
          description: d.description || ""
        }))
        localStorage.setItem(localKey, JSON.stringify(mapped))
        return mapped
      }
    } catch {
      // Fallback local
    }

    // Check localStorage cache
    const saved = localStorage.getItem(localKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }

    // Clean initial state (no dummy records)
    return []
  },

  saveTask: async (userEmail: string, task: Omit<PersonalTask, "id" | "user_email">): Promise<PersonalTask> => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_tasks`
    const generatedId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    
    const newTask: PersonalTask = {
      ...task,
      id: generatedId,
      user_email: clean,
      created_at: new Date().toISOString()
    }

    try {
      await supabase.from('personal_tasks' as any).insert({
        id: generatedId,
        user_email: clean,
        title: newTask.title,
        priority: newTask.priority,
        due_date: newTask.dueDate,
        category: newTask.category,
        completed: newTask.completed,
        description: newTask.description || ""
      })
    } catch {
      // Offline fallback
    }

    const current = await PersonalWorkspaceService.getTasks(clean)
    const updated = [newTask, ...current.filter(t => t.id !== generatedId)]
    localStorage.setItem(localKey, JSON.stringify(updated))
    return newTask
  },

  updateTask: async (userEmail: string, taskId: string, updates: Partial<PersonalTask>): Promise<void> => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_tasks`

    try {
      const dbUpdates: any = {}
      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate
      if (updates.category !== undefined) dbUpdates.category = updates.category
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed
      if (updates.description !== undefined) dbUpdates.description = updates.description

      await supabase.from('personal_tasks' as any).update(dbUpdates).eq('id', taskId)
    } catch {
      // Local fallback
    }

    const current = await PersonalWorkspaceService.getTasks(clean)
    const updated = current.map(t => t.id === taskId ? { ...t, ...updates } : t)
    localStorage.setItem(localKey, JSON.stringify(updated))
  },

  deleteTask: async (userEmail: string, taskId: string): Promise<void> => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_tasks`

    try {
      await supabase.from('personal_tasks' as any).delete().eq('id', taskId)
    } catch {
      // Local fallback
    }

    const current = await PersonalWorkspaceService.getTasks(clean)
    const updated = current.filter(t => t.id !== taskId)
    localStorage.setItem(localKey, JSON.stringify(updated))
  },

  // ─── 2. PERSONAL CALENDAR & SCHEDULE CRUD ───
  getCalendarEvents: async (userEmail: string) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_calendar`

    try {
      const { data, error } = await supabase
        .from('personal_calendar_events' as any)
        .select('*')
        .eq('user_email', clean)
        .order('event_date', { ascending: true })

      if (!error && data) {
        const mapped = data.map((d: any) => ({
          id: String(d.id),
          title: d.title,
          date: d.event_date || new Date().toISOString().slice(0, 10),
          time: d.event_time || "10:00 AM",
          type: d.event_type || "Meeting",
          priority: d.priority || "Medium",
          description: d.description || ""
        }))
        localStorage.setItem(localKey, JSON.stringify(mapped))
        return mapped
      }
    } catch {}

    const saved = localStorage.getItem(localKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }

    return []
  },

  saveCalendarEvent: async (userEmail: string, event: any) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_calendar`
    const generatedId = `cal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    
    const newEvt = {
      ...event,
      id: generatedId,
      user_email: clean
    }

    try {
      await supabase.from('personal_calendar_events' as any).insert({
        id: generatedId,
        user_email: clean,
        title: event.title,
        event_date: event.date,
        event_time: event.time,
        event_type: event.type,
        priority: event.priority
      })
    } catch {}

    const current = await PersonalWorkspaceService.getCalendarEvents(clean)
    const updated = [newEvt, ...current.filter((e: any) => e.id !== generatedId)]
    localStorage.setItem(localKey, JSON.stringify(updated))
    return newEvt
  },

  deleteCalendarEvent: async (userEmail: string, eventId: string) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_calendar`

    try {
      await supabase.from('personal_calendar_events' as any).delete().eq('id', eventId)
    } catch {}

    const current = await PersonalWorkspaceService.getCalendarEvents(clean)
    const updated = current.filter((e: any) => e.id !== eventId)
    localStorage.setItem(localKey, JSON.stringify(updated))
  },

  // ─── 3. PERSONAL DOCUMENTS & VAULT ───
  getDocuments: async (userEmail: string) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_documents`

    try {
      const { data, error } = await supabase
        .from('personal_documents' as any)
        .select('*')
        .eq('user_email', clean)
        .order('created_at', { ascending: false })

      if (!error && data) {
        const mapped = data.map((d: any) => ({
          id: String(d.id),
          name: d.name,
          type: d.file_type || "Private Document",
          size: d.file_size || "1 KB",
          date: d.created_at ? d.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          category: d.category || "General Notes",
          content: d.content || ""
        }))
        localStorage.setItem(localKey, JSON.stringify(mapped))
        return mapped
      }
    } catch {}

    const saved = localStorage.getItem(localKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }

    return []
  },

  saveDocument: async (userEmail: string, doc: any) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_documents`
    const generatedId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    
    const newDoc = {
      ...doc,
      id: generatedId,
      date: new Date().toISOString().slice(0, 10)
    }

    try {
      await supabase.from('personal_documents' as any).insert({
        id: generatedId,
        user_email: clean,
        name: doc.name,
        file_type: doc.type,
        file_size: doc.size,
        category: doc.category,
        content: doc.content
      })
    } catch {}

    const current = await PersonalWorkspaceService.getDocuments(clean)
    const updated = [newDoc, ...current.filter((d: any) => d.id !== generatedId)]
    localStorage.setItem(localKey, JSON.stringify(updated))
    return newDoc
  },

  deleteDocument: async (userEmail: string, docId: string) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_documents`

    try {
      await supabase.from('personal_documents' as any).delete().eq('id', docId)
    } catch {}

    const current = await PersonalWorkspaceService.getDocuments(clean)
    const updated = current.filter((d: any) => d.id !== docId)
    localStorage.setItem(localKey, JSON.stringify(updated))
  },

  // ─── 4. PERSONAL ATTENDANCE & PUNCH LOGS ───
  getAttendanceLogs: async (userEmail: string) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_attendance`

    try {
      const { data, error } = await supabase
        .from('personal_attendance' as any)
        .select('*')
        .eq('user_email', clean)
        .order('date', { ascending: false })

      if (!error && data) {
        const mapped = data.map((d: any) => ({
          id: String(d.id),
          date: d.date,
          checkIn: d.check_in || "--:--",
          checkOut: d.check_out || "--:--",
          status: d.status || "Present",
          totalHours: d.total_hours || "0h"
        }))
        localStorage.setItem(localKey, JSON.stringify(mapped))
        return mapped
      }
    } catch {}

    const saved = localStorage.getItem(localKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }

    return []
  },

  saveAttendancePunch: async (userEmail: string, punch: any) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_attendance`
    const generatedId = punch.id || `att_${Date.now()}`

    try {
      await supabase.from("personal_attendance" as any).upsert({
        id: generatedId,
        user_email: clean,
        date: punch.date,
        check_in: punch.checkIn,
        check_out: punch.checkOut,
        status: punch.status,
        total_hours: punch.totalHours
      })
    } catch {}

    const current = await PersonalWorkspaceService.getAttendanceLogs(clean)
    const updated = [punch, ...current.filter((a: any) => a.date !== punch.date)]
    localStorage.setItem(localKey, JSON.stringify(updated))
    return updated
  },

  // ─── 5. PERSONAL PERFORMANCE & OKR GOALS ───
  getPerformanceScorecard: async (userEmail: string) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_performance`

    try {
      const { data, error } = await supabase
        .from('personal_performance_goals' as any)
        .select('*')
        .eq('user_email', clean)
        .order('created_at', { ascending: false })

      if (!error && data) {
        const scorecard = {
          overallScore: data.length > 0 ? `${Math.round(data.reduce((acc: number, g: any) => acc + (g.progress || 0), 0) / data.length)}%` : "Ready",
          quarter: "Q3 2026",
          managerFeedback: "Active performance tracking in progress.",
          goals: data.map((g: any) => ({
            id: String(g.id),
            title: g.title,
            progress: g.progress || 0,
            target: g.target || "100%",
            status: g.status || "In Progress"
          }))
        }
        localStorage.setItem(localKey, JSON.stringify(scorecard))
        return scorecard
      }
    } catch {}

    const saved = localStorage.getItem(localKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }

    return {
      overallScore: "Ready",
      quarter: "Q3 2026",
      managerFeedback: "Set your quarterly goals and milestones to track performance.",
      goals: []
    }
  },

  savePerformanceGoal: async (userEmail: string, goal: any) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_performance`
    const generatedId = `goal_${Date.now()}`
    
    const newGoal = {
      ...goal,
      id: generatedId
    }

    try {
      await supabase.from('personal_performance_goals' as any).insert({
        id: generatedId,
        user_email: clean,
        title: goal.title,
        progress: goal.progress,
        target: goal.target || "100%",
        status: goal.status || "In Progress",
        quarter: "Q3 2026"
      })
    } catch {}

    const current = await PersonalWorkspaceService.getPerformanceScorecard(clean)
    const updated = {
      ...current,
      goals: [newGoal, ...current.goals]
    }
    localStorage.setItem(localKey, JSON.stringify(updated))
    return updated
  },

  updatePerformanceGoal: async (userEmail: string, goalId: string, progress: number) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_performance`

    try {
      await supabase.from('personal_performance_goals' as any).update({
        progress,
        status: progress >= 80 ? "Exceeding" : progress >= 50 ? "On Track" : "In Progress"
      }).eq('id', goalId)
    } catch {}

    const current = await PersonalWorkspaceService.getPerformanceScorecard(clean)
    const updated = {
      ...current,
      goals: current.goals.map((g: any) => g.id === goalId ? { ...g, progress } : g)
    }
    localStorage.setItem(localKey, JSON.stringify(updated))
    return updated
  },

  deletePerformanceGoal: async (userEmail: string, goalId: string) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_performance`

    try {
      await supabase.from('personal_performance_goals' as any).delete().eq('id', goalId)
    } catch {}

    const current = await PersonalWorkspaceService.getPerformanceScorecard(clean)
    const updated = {
      ...current,
      goals: current.goals.filter((g: any) => g.id !== goalId)
    }
    localStorage.setItem(localKey, JSON.stringify(updated))
    return updated
  },

  // ─── 6. PERSONAL NOTIFICATIONS ───
  getNotifications: async (userEmail: string) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_notifications`

    try {
      const { data, error } = await supabase
        .from('personal_notifications' as any)
        .select('*')
        .eq('user_email', clean)
        .order('created_at', { ascending: false })

      if (!error && data) {
        const mapped = data.map((d: any) => ({
          id: String(d.id),
          title: d.title,
          desc: d.description || "",
          time: d.time_label || "Recent",
          read: Boolean(d.is_read)
        }))
        localStorage.setItem(localKey, JSON.stringify(mapped))
        return mapped
      }
    } catch {}

    const saved = localStorage.getItem(localKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }

    return []
  },

  markNotificationRead: async (userEmail: string, notifId: string) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_notifications`

    try {
      await supabase.from('personal_notifications' as any).update({ is_read: true }).eq('id', notifId)
    } catch {}

    const current = await PersonalWorkspaceService.getNotifications(clean)
    const updated = current.map((n: any) => n.id === notifId ? { ...n, read: true } : n)
    localStorage.setItem(localKey, JSON.stringify(updated))
    return updated
  },

  deleteNotification: async (userEmail: string, notifId: string) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_notifications`

    try {
      await supabase.from('personal_notifications' as any).delete().eq('id', notifId)
    } catch {}

    const current = await PersonalWorkspaceService.getNotifications(clean)
    const updated = current.filter((n: any) => n.id !== notifId)
    localStorage.setItem(localKey, JSON.stringify(updated))
    return updated
  },

  // ─── 7. PERSONAL PROFILE ───
  getProfile: async (userEmail: string) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_profile`

    try {
      const { data, error } = await supabase
        .from('user_profiles' as any)
        .select('*')
        .eq('email', clean)
        .single()

      if (!error && data) {
        const prof = {
          name: data.name || clean.split("@")[0].toUpperCase(),
          email: clean,
          role: data.role || "Team Member",
          department: data.department || "General",
          phone: data.phone || "",
          employeeId: data.employee_id || `EMP-${clean.slice(0, 4).toUpperCase()}`,
          bio: data.bio || "",
          location: data.location || "Head Office",
          avatarInitials: clean.slice(0, 2).toUpperCase()
        }
        localStorage.setItem(localKey, JSON.stringify(prof))
        return prof
      }
    } catch {}

    const saved = localStorage.getItem(localKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }

    const fallback = {
      name: clean.split("@")[0].replace(".", " ").toUpperCase(),
      email: clean,
      role: "Team Member",
      department: "General Operations",
      phone: "",
      employeeId: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      bio: "",
      location: "Head Office",
      avatarInitials: clean.slice(0, 2).toUpperCase()
    }
    localStorage.setItem(localKey, JSON.stringify(fallback))
    return fallback
  },

  saveProfile: async (userEmail: string, profileData: any) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_profile`
    localStorage.setItem(localKey, JSON.stringify(profileData))

    try {
      await supabase.from("user_profiles" as any).upsert({
        email: clean,
        name: profileData.name,
        role: profileData.role,
        department: profileData.department,
        phone: profileData.phone,
        employee_id: profileData.employeeId,
        bio: profileData.bio,
        location: profileData.location,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' })
    } catch {}

    return profileData
  }
}
