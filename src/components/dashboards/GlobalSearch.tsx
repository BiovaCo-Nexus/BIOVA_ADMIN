import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Users, Briefcase, BookOpen, AlertCircle, Loader2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Badge } from "@/components/ui/badge"

export function GlobalSearch({ onNavigateToTab }: { onNavigateToTab?: (tabId: string) => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{ type: string, title: string, subtitle: string, icon: any }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!query.trim()) {
        setResults([])
        return
      }
      setLoading(true)
      const searchQuery = `%${query}%`

      try {
        // Search multiple tables in parallel
        const [internsRes, tasksRes, appsRes, rdRes] = await Promise.all([
          supabase.from('interns').select('*').or(`name.ilike.${searchQuery},email.ilike.${searchQuery},contact.ilike.${searchQuery}`).limit(5),
          supabase.from('ceo_md_timetable').select('*').ilike('activity_name', searchQuery).limit(5),
          supabase.from('job_applications').select('*').or(`full_name.ilike.${searchQuery},email.ilike.${searchQuery},phone.ilike.${searchQuery}`).limit(5),
          supabase.from('knowledge_items').select('*').ilike('title', searchQuery).limit(5)
        ])

        const combined: any[] = []

        if (internsRes.data) {
          combined.push(...internsRes.data.map(i => ({
            type: 'Intern',
            title: i.name,
            subtitle: `${i.contact ? i.contact + ' • ' : ''}${i.email || ''}`,
            icon: <Users className="h-4 w-4 text-purple-500" />
          })))
        }
        if (tasksRes.data) {
          combined.push(...tasksRes.data.map(t => ({
            type: 'Task',
            title: t.activity_name,
            subtitle: t.assigned_email || 'Unassigned',
            icon: <Briefcase className="h-4 w-4 text-blue-500" />
          })))
        }
        if (appsRes.data) {
          combined.push(...appsRes.data.map(a => ({
            type: 'Applicant',
            title: a.full_name || a.name || 'Applicant',
            subtitle: `${a.phone ? a.phone + ' • ' : ''}${a.email || a.role || ''}`,
            icon: <AlertCircle className="h-4 w-4 text-amber-500" />
          })))
        }
        if (rdRes.data) {
          combined.push(...rdRes.data.map(r => ({
            type: 'Knowledge Base',
            title: r.title,
            subtitle: r.category,
            icon: <BookOpen className="h-4 w-4 text-emerald-500" />
          })))
        }

        setResults(combined)
      } catch (err) {
        console.error("Search error", err)
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  const handleResultClick = (type: string) => {
    if (type === 'Intern') onNavigateToTab?.('intern_management')
    else if (type === 'Task') onNavigateToTab?.('executive_calendar')
    else if (type === 'Applicant') onNavigateToTab?.('applications')
    else if (type === 'Knowledge Base') onNavigateToTab?.('knowledge_tracker')
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center justify-center gap-3">
          <Search className="h-8 w-8 text-[#4B49AC]" /> Global Search
        </h2>
        <p className="text-gray-500 mt-2 max-w-lg mx-auto">Instantly find interns, tasks, applications, and documents across the entire enterprise database.</p>
      </div>

      <div className="relative mb-8 shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-gray-400" />
        </div>
        <Input 
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for 'Rahul', 'Marketing', 'Q3 Review'..."
          className="pl-14 h-16 text-lg rounded-2xl border-2 border-gray-200 focus-visible:ring-0 focus-visible:border-[#4B49AC] shadow-sm bg-white"
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <Loader2 className="h-5 w-5 text-[#4B49AC] animate-spin" />
          </div>
        )}
      </div>

      {query.trim() && (
        <Card className="border-gray-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-0">
            {results.length === 0 && !loading ? (
              <div className="p-12 text-center text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                No results found for "{query}"
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {results.map((result, idx) => (
                  <div key={idx} onClick={() => handleResultClick(result.type)} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4 cursor-pointer">
                    <div className="h-10 w-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                      {result.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">{result.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{result.subtitle}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 border-0">
                      {result.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
