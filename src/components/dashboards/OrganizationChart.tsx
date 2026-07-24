import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Network, Users, UserCircle2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

export function OrganizationChart() {
  const [hierarchy, setHierarchy] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrg = async () => {
      // Grouping logic based on departments and teams tables
      const { data: dData } = await supabase.from('departments').select('*').order('name')
      const { data: tData } = await supabase.from('teams').select('*').order('name')
      
      if (dData && tData) {
        const orgTree = dData.map((d: any) => ({
          ...d,
          teams: tData.filter((t: any) => t.department_id === d.id)
        }))
        setHierarchy(orgTree)
      }
      setLoading(false)
    }
    fetchOrg()
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Network className="h-8 w-8 text-[#4B49AC]" /> Organization Chart
        </h2>
        <p className="text-gray-500 mt-2">Visual representation of corporate structure.</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading structure...</div>
        ) : hierarchy.map(dept => (
          <Card key={dept.id} className="border-l-4 border-l-[#4B49AC] shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center">
                    <UserCircle2 className="h-5 w-5 text-[#4B49AC]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{dept.name}</h3>
                    <p className="text-sm text-gray-500 font-medium">Head: {dept.head_name || 'Unassigned'}</p>
                  </div>
                </div>
              </div>
              
              {dept.teams?.length > 0 && (
                <div className="ml-6 pl-6 border-l-2 border-gray-100 space-y-3">
                  {dept.teams.map((team: any) => (
                    <div key={team.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <Users className="h-4 w-4 text-gray-400" />
                      <div>
                        <h4 className="font-semibold text-sm text-gray-800">{team.name}</h4>
                        <p className="text-xs text-gray-500">Lead: {team.leader_name || 'Unassigned'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
