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

const DEFAULT_TASKS_BY_EMAIL = (email: string): PersonalTask[] => [
  { id: `task_${Date.now()}_1`, user_email: email, title: "Review quarterly objectives & team deliverables", priority: "High", dueDate: new Date().toISOString().slice(0, 10), category: "Operations", completed: false },
  { id: `task_${Date.now()}_2`, user_email: email, title: "Submit weekly progress log & activity summary", priority: "Medium", dueDate: new Date().toISOString().slice(0, 10), category: "General", completed: false },
  { id: `task_${Date.now()}_3`, user_email: email, title: "Verify workspace documents & compliance signatures", priority: "Low", dueDate: new Date().toISOString().slice(0, 10), category: "Admin", completed: true }
]

export const PersonalWorkspaceService = {
  // ─── TASKS CRUD ───
  getTasks: async (userEmail: string): Promise<PersonalTask[]> => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_tasks`
    
    // Try Supabase first
    try {
      const { data, error } = await supabase
        .from('personal_tasks')
        .select('*')
        .eq('user_email' as any, clean)
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
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

    // Check localStorage
    const saved = localStorage.getItem(localKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        // Fallback
      }
    }

    // Initial default for this user
    const initial = DEFAULT_TASKS_BY_EMAIL(clean)
    localStorage.setItem(localKey, JSON.stringify(initial))
    return initial
  },

  saveTask: async (userEmail: string, task: Omit<PersonalTask, "id" | "user_email">): Promise<PersonalTask> => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_tasks`
    const newTask: PersonalTask = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      user_email: clean,
      created_at: new Date().toISOString()
    }

    try {
      await supabase.from('personal_tasks').insert({
        title: newTask.title,
        priority: newTask.priority,
        due_date: newTask.dueDate,
        category: newTask.category,
        completed: newTask.completed,
        user_email: clean
      } as any)
    } catch {
      // Offline fallback
    }

    const current = await PersonalWorkspaceService.getTasks(clean)
    const updated = [newTask, ...current]
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

      await supabase.from('personal_tasks').update(dbUpdates).eq('id', taskId)
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
      await supabase.from('personal_tasks').delete().eq('id', taskId)
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

    const saved = localStorage.getItem(localKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }

    const initial = [
      { id: `cal_1`, title: "Weekly Team Standup & Sync", date: new Date().toISOString().slice(0, 10), time: "10:00 AM", type: "Meeting", priority: "High" },
      { id: `cal_2`, title: "Focus Work: Project Deliverables", date: new Date().toISOString().slice(0, 10), time: "02:30 PM", type: "Focus Block", priority: "Medium" }
    ]
    localStorage.setItem(localKey, JSON.stringify(initial))
    return initial
  },

  saveCalendarEvent: async (userEmail: string, event: any) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_calendar`
    const newEvt = {
      ...event,
      id: `cal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    }
    const current = await PersonalWorkspaceService.getCalendarEvents(clean)
    const updated = [newEvt, ...current]
    localStorage.setItem(localKey, JSON.stringify(updated))
    return newEvt
  },

  deleteCalendarEvent: async (userEmail: string, eventId: string) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_calendar`
    const current = await PersonalWorkspaceService.getCalendarEvents(clean)
    const updated = current.filter((e: any) => e.id !== eventId)
    localStorage.setItem(localKey, JSON.stringify(updated))
  },

  // ─── 3. PERSONAL DOCUMENTS & VAULT ───
  getDocuments: async (userEmail: string) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_documents`

    const saved = localStorage.getItem(localKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }

    const initial = [
      { id: `doc_1`, name: "Welcome_Onboarding_Kit.pdf", type: "Onboarding", size: "1.2 MB", date: new Date().toISOString().slice(0, 10), category: "Company" },
      { id: `doc_2`, name: "Personal_KPI_Worksheet_2026.docx", type: "Worksheet", size: "450 KB", date: new Date().toISOString().slice(0, 10), category: "Performance" }
    ]
    localStorage.setItem(localKey, JSON.stringify(initial))
    return initial
  },

  saveDocument: async (userEmail: string, doc: any) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_documents`
    const newDoc = {
      ...doc,
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      date: new Date().toISOString().slice(0, 10)
    }
    const current = await PersonalWorkspaceService.getDocuments(clean)
    const updated = [newDoc, ...current]
    localStorage.setItem(localKey, JSON.stringify(updated))
    return newDoc
  },

  deleteDocument: async (userEmail: string, docId: string) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_documents`
    const current = await PersonalWorkspaceService.getDocuments(clean)
    const updated = current.filter((d: any) => d.id !== docId)
    localStorage.setItem(localKey, JSON.stringify(updated))
  },

  // ─── 4. PERSONAL ATTENDANCE & PUNCH LOGS ───
  getAttendanceLogs: async (userEmail: string) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_attendance`

    const saved = localStorage.getItem(localKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }

    const todayStr = new Date().toISOString().slice(0, 10)
    const initial = [
      { id: `att_1`, date: todayStr, checkIn: "09:02 AM", checkOut: "06:15 PM", status: "Present", totalHours: "9.2h" }
    ]
    localStorage.setItem(localKey, JSON.stringify(initial))
    return initial
  },

  saveAttendancePunch: async (userEmail: string, punch: any) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_attendance`
    const current = await PersonalWorkspaceService.getAttendanceLogs(clean)
    const updated = [punch, ...current.filter((a: any) => a.date !== punch.date)]
    localStorage.setItem(localKey, JSON.stringify(updated))

    try {
      await supabase.from("attendance").insert({
        date: punch.date,
        status: punch.status
      })
    } catch {}

    return updated
  },

  // ─── 5. PERSONAL PERFORMANCE & OKR GOALS ───
  getPerformanceScorecard: async (userEmail: string) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_performance`

    const saved = localStorage.getItem(localKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }

    const initial = {
      overallScore: "94%",
      quarter: "Q3 2026",
      managerFeedback: "Exceptional ownership, proactive communication, and high-impact execution across core initiatives.",
      goals: [
        { id: "g_1", title: "Complete Q3 Core Deliverables & Milestones", progress: 85, target: "100%", status: "On Track" },
        { id: "g_2", title: "Ensure 100% On-Time System Compliance", progress: 95, target: "100%", status: "Exceeding" },
        { id: "g_3", title: "Cross-Functional Collaboration & Documentation", progress: 75, target: "100%", status: "In Progress" }
      ]
    }
    localStorage.setItem(localKey, JSON.stringify(initial))
    return initial
  },

  savePerformanceGoal: async (userEmail: string, goal: any) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_performance`
    const current = await PersonalWorkspaceService.getPerformanceScorecard(clean)
    const newGoal = {
      ...goal,
      id: `g_${Date.now()}`
    }
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

    const saved = localStorage.getItem(localKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }

    const initial = [
      { id: `notif_1`, title: "Welcome to BiovaCo Workspace", desc: `Personal workspace initialized for ${clean}.`, time: "Just now", read: false },
      { id: `notif_2`, title: "System Security Check", desc: "Your session is secured with active TLS encryption.", time: "1 hour ago", read: true }
    ]
    localStorage.setItem(localKey, JSON.stringify(initial))
    return initial
  },

  markNotificationRead: async (userEmail: string, notifId: string) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_notifications`
    const current = await PersonalWorkspaceService.getNotifications(clean)
    const updated = current.map((n: any) => n.id === notifId ? { ...n, read: true } : n)
    localStorage.setItem(localKey, JSON.stringify(updated))
    return updated
  },

  deleteNotification: async (userEmail: string, notifId: string) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_notifications`
    const current = await PersonalWorkspaceService.getNotifications(clean)
    const updated = current.filter((n: any) => n.id !== notifId)
    localStorage.setItem(localKey, JSON.stringify(updated))
    return updated
  },

  // ─── 7. PERSONAL PROFILE ───
  getProfile: async (userEmail: string) => {
    const clean = getCleanEmail(userEmail)
    const localKey = `biovaco_workspace_${clean}_profile`

    const saved = localStorage.getItem(localKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }

    // Dynamic initial profile based on user role
    const isCEO = clean.includes("ceo") || clean.includes("nakul")
    const isIntern = clean.includes("intern")
    const isMD = clean.includes("md")

    const initial = {
      name: isCEO ? "Dr. Nakul Mundhada" : isMD ? "Managing Director" : isIntern ? "Research Intern" : clean.split("@")[0].replace(".", " ").toUpperCase(),
      email: clean,
      role: isCEO ? "Chief Executive Officer / Founder" : isMD ? "Managing Director" : isIntern ? "Biotech R&D Intern" : "Team Member",
      department: isCEO || isMD ? "Executive Leadership & Strategy" : isIntern ? "Agricultural R&D Lab" : "Operations",
      phone: "+91 98765 43210",
      employeeId: isCEO ? "EMP-EXEC-001" : isIntern ? "INT-2026-08" : `EMP-${Math.floor(100 + Math.random() * 900)}`,
      bio: isCEO ? "Leading BiovaCo Nexus biotechnology research, enterprise operations, and innovation." : `Team Member at BiovaCo Nexus - Dedicated to excellence in biotechnology.`,
      location: "Amravati / Head Office",
      theme: "system",
      avatarInitials: clean.slice(0, 2).toUpperCase()
    }

    localStorage.setItem(localKey, JSON.stringify(initial))
    return initial
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
        bio: profileData.bio,
        location: profileData.location,
        updated_at: new Date().toISOString()
      })
    } catch {}

    return profileData
  }
}
