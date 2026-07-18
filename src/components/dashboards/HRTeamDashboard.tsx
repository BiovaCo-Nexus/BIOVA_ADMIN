import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Users, FileText, FlaskConical, BookOpen, UserPlus, GraduationCap, Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useTimeFilter } from "@/hooks/useTimeFilter"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, parseISO } from "date-fns"

const COLORS = ['#4B49AC', '#F3797E', '#7DA0FA', '#7978E9', '#FFA726', '#66BB6A'];

export function HRTeamDashboard() {
  const { timeFilter, setTimeFilter, filterDataByDate } = useTimeFilter();
  const [isLoading, setIsLoading] = useState(true);

  // Raw Data States
  const [applications, setApplications] = useState<any[]>([]);
  const [interns, setInterns] = useState<any[]>([]);
  const [jobPositions, setJobPositions] = useState<any[]>([]);
  const [rdProjects, setRdProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllHRData = async () => {
      setIsLoading(true);
      try {
        const [appsRes, internsRes, jobsRes, rdRes] = await Promise.all([
          supabase.from('job_applications').select('*'),
          supabase.from('interns').select('*'),
          supabase.from('job_positions').select('*'),
          supabase.from('knowledge_items').select('*')
        ]);

        if (appsRes.data) setApplications(appsRes.data);
        if (internsRes.data) setInterns(internsRes.data);
        if (jobsRes.data) setJobPositions(jobsRes.data);
        if (rdRes.data) setRdProjects(rdRes.data);
      } catch (err) {
        console.error("Error fetching HR data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllHRData();

    // Realtime Subscriptions
    const channel = supabase
      .channel('hr-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_applications' }, () => fetchAllHRData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interns' }, () => fetchAllHRData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_positions' }, () => fetchAllHRData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'knowledge_items' }, () => fetchAllHRData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filtered Data based on time
  const filteredApps = useMemo(() => filterDataByDate(applications, 'created_at'), [applications, filterDataByDate]);
  const filteredInterns = useMemo(() => filterDataByDate(interns, 'created_at'), [interns, filterDataByDate]);
  
  // KPIs
  const totalInterns = filteredInterns.length;
  const activeJobs = jobPositions.filter(j => j.is_active).length;
  const pendingApps = filteredApps.filter(a => a.status === 'New' || a.status === 'Pending').length;
  const activeRd = rdProjects.filter(r => r.status !== 'validated' && r.status !== 'rejected').length;

  // Chart Data: Recruitment Funnel (Grouped by Month/Day depending on filter)
  const hiringData = useMemo(() => {
    const grouping = timeFilter === '7days' || timeFilter === '30days' ? 'MMM dd' : 'MMM yyyy';
    const map = new Map<string, { applied: number, hired: number }>();

    filteredApps.forEach(app => {
      if (!app.created_at) return;
      const key = format(parseISO(app.created_at), grouping);
      const curr = map.get(key) || { applied: 0, hired: 0 };
      curr.applied += 1;
      if (app.status === 'Accepted') curr.hired += 1;
      map.set(key, curr);
    });

    return Array.from(map.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredApps, timeFilter]);

  // Chart Data: Department Distribution
  const departmentData = useMemo(() => {
    const deptMap = new Map<string, number>();
    filteredInterns.forEach(intern => {
      const pos = intern.position || 'Unassigned';
      deptMap.set(pos, (deptMap.get(pos) || 0) + 1);
    });
    return Array.from(deptMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6
  }, [filteredInterns]);

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#7DA0FA]" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workforce Analytics</h1>
          <p className="text-sm text-gray-500">Human Capital & Resource Insights</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <Select value={timeFilter} onValueChange={(v: any) => setTimeFilter(v)}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-white">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last 1 Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#4B49AC]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Interns</CardTitle>
            <Users className="h-4 w-4 text-[#4B49AC]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalInterns}</div>
            <p className="text-xs text-gray-500 mt-1">Onboarded staff</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#F3797E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Open Positions</CardTitle>
            <UserPlus className="h-4 w-4 text-[#F3797E]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeJobs}</div>
            <p className="text-xs text-green-600 mt-1">Currently hiring</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#7DA0FA]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Apps</CardTitle>
            <FileText className="h-4 w-4 text-[#7DA0FA]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{pendingApps}</div>
            <p className="text-xs text-gray-500 mt-1">Waiting for review</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#7978E9]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">R&D Lab Projects</CardTitle>
            <FlaskConical className="h-4 w-4 text-[#7978E9]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeRd}</div>
            <p className="text-xs text-gray-500 flex items-center mt-1">Active research tasks</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recruitment Funnel</CardTitle>
            <CardDescription>Applications vs Hires (Last 6 Months)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hiringData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="applied" fill="#7DA0FA" radius={[4, 4, 0, 0]} name="Applications" barSize={30} />
                <Bar dataKey="hired" fill="#4B49AC" radius={[4, 4, 0, 0]} name="Hired" barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Team Distribution</CardTitle>
            <CardDescription>Employee count by department</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-gray-900">{totalInterns}</span>
              <span className="text-xs text-gray-500">Total Interns</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
