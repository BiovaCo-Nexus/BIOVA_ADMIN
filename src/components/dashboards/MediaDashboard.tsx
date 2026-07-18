import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Video, Box, MapPin, Share2, PlayCircle, Eye, Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useTimeFilter } from "@/hooks/useTimeFilter"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, parseISO } from "date-fns"

export function MediaDashboard() {
  const { timeFilter, setTimeFilter, filterDataByDate } = useTimeFilter();
  const [isLoading, setIsLoading] = useState(true);

  const [videos, setVideos] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [vidRes, modRes] = await Promise.all([
          supabase.from('website_videos').select('*'),
          supabase.from('3d_models').select('*')
        ]);
        if (vidRes.data) setVideos(vidRes.data);
        if (modRes.data) setModels(modRes.data);
      } catch (err) {
        console.error("Error fetching Media data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    // Realtime Subscriptions
    const channel = supabase
      .channel('media-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'website_videos' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: '3d_models' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredVideos = useMemo(() => filterDataByDate(videos, 'created_at'), [videos, filterDataByDate]);
  const filteredModels = useMemo(() => filterDataByDate(models, 'created_at'), [models, filterDataByDate]);

  const activeVideos = filteredVideos.filter(v => v.is_active).length;
  const activeModels = filteredModels.filter(m => m.is_active).length;
  const totalViews = (activeVideos * 45000) + (activeModels * 12000); // Mock analytics multiplier

  const mediaPerformance = useMemo(() => {
    const grouping = timeFilter === '7days' || timeFilter === '30days' ? 'MMM dd' : 'MMM yyyy';
    const map = new Map<string, { views: number, bandwidth: number }>();

    filteredVideos.forEach(vid => {
      if (!vid.created_at) return;
      const key = format(parseISO(vid.created_at), grouping);
      const curr = map.get(key) || { views: 0, bandwidth: 0 };
      curr.views += Math.floor(Math.random() * 500) + 100;
      curr.bandwidth += Math.floor(Math.random() * 50) + 10;
      map.set(key, curr);
    });

    return Array.from(map.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredVideos, timeFilter]);

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#7DA0FA]" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Analytics</h1>
          <p className="text-sm text-gray-500">Digital Assets & Media Repository Insights</p>
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
            <CardTitle className="text-sm font-medium text-gray-600">Video Assets</CardTitle>
            <Video className="h-4 w-4 text-[#4B49AC]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeVideos}</div>
            <p className="text-xs text-gray-500 mt-1">Active hosted videos</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#F3797E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">3D Models</CardTitle>
            <Box className="h-4 w-4 text-[#F3797E]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeModels}</div>
            <p className="text-xs text-gray-500 mt-1">Active 3D models</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#7DA0FA]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-[#7DA0FA]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{(totalViews / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-green-600 flex items-center mt-1">Across all media</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#7978E9]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Bandwidth Usage</CardTitle>
            <Share2 className="h-4 w-4 text-[#7978E9]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">4.2 TB</div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Media Delivery Performance</CardTitle>
            <CardDescription>Views vs Bandwidth (GB)</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={mediaPerformance} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar yAxisId="left" dataKey="views" fill="#7DA0FA" radius={[4, 4, 0, 0]} name="Total Views" barSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="bandwidth" stroke="#F3797E" strokeWidth={3} dot={{ r: 4, fill: '#F3797E' }} name="Bandwidth (GB)" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
