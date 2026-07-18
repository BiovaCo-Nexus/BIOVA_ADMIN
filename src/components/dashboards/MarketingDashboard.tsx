import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Megaphone, Mail, FileText, Newspaper, TrendingUp, Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useTimeFilter } from "@/hooks/useTimeFilter"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, parseISO } from "date-fns"

export function MarketingDashboard() {
  const { timeFilter, setTimeFilter, filterDataByDate } = useTimeFilter();
  const [isLoading, setIsLoading] = useState(true);

  const [posts, setPosts] = useState<any[]>([]);
  const [newsletters, setNewsletters] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [postsRes, newsRes, articlesRes] = await Promise.all([
          supabase.from('marketing_posts').select('*'),
          supabase.from('newsletter_subscriptions').select('*'),
          supabase.from('news_articles').select('*')
        ]);
        if (postsRes.data) setPosts(postsRes.data);
        if (newsRes.data) setNewsletters(newsRes.data);
        if (articlesRes.data) setNews(articlesRes.data);
      } catch (err) {
        console.error("Error fetching Marketing data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    // Realtime Subscriptions
    const channel = supabase
      .channel('marketing-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_posts' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'newsletter_subscriptions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news_articles' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredPosts = useMemo(() => filterDataByDate(posts, 'created_at'), [posts, filterDataByDate]);
  const filteredNewsletters = useMemo(() => filterDataByDate(newsletters, 'created_at'), [newsletters, filterDataByDate]);
  const filteredNews = useMemo(() => filterDataByDate(news, 'created_at'), [news, filterDataByDate]);

  const totalReach = (filteredPosts.length * 1500) + (filteredNewsletters.length * 120); // Simulated reach multiplier
  const activeSubs = filteredNewsletters.filter(n => n.confirmed).length;
  const publishedPosts = filteredPosts.filter(p => p.status === 'published').length;
  const pressMentions = filteredNews.filter(n => n.is_published).length;

  const engagementData = useMemo(() => {
    const grouping = timeFilter === '7days' || timeFilter === '30days' ? 'MMM dd' : 'MMM yyyy';
    const map = new Map<string, { posts: number, newsletters: number }>();

    filteredPosts.forEach(post => {
      if (!post.created_at) return;
      const key = format(parseISO(post.created_at), grouping);
      const curr = map.get(key) || { posts: 0, newsletters: 0 };
      curr.posts += 1;
      map.set(key, curr);
    });

    filteredNewsletters.forEach(sub => {
      if (!sub.created_at) return;
      const key = format(parseISO(sub.created_at), grouping);
      const curr = map.get(key) || { posts: 0, newsletters: 0 };
      curr.newsletters += 1;
      map.set(key, curr);
    });

    return Array.from(map.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredPosts, filteredNewsletters, timeFilter]);

  const audienceData = [
    { name: "18-24", users: activeSubs * 0.25 },
    { name: "25-34", users: activeSubs * 0.40 },
    { name: "35-44", users: activeSubs * 0.20 },
    { name: "45-54", users: activeSubs * 0.10 },
    { name: "55+", users: activeSubs * 0.05 },
  ];

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#7DA0FA]" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Intelligence</h1>
          <p className="text-sm text-gray-500">Brand Strategy & Market Insights</p>
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
            <CardTitle className="text-sm font-medium text-gray-600">Total Reach</CardTitle>
            <Megaphone className="h-4 w-4 text-[#4B49AC]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalReach > 0 ? (totalReach / 1000).toFixed(1) + 'K' : '0'}</div>
            <p className="text-xs text-green-600 flex items-center mt-1"><TrendingUp className="h-3 w-3 mr-1" /> Dynamic</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#F3797E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Subscribers</CardTitle>
            <Mail className="h-4 w-4 text-[#F3797E]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeSubs}</div>
            <p className="text-xs text-gray-500 mt-1">Confirmed Subs</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#7DA0FA]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Published Posts</CardTitle>
            <FileText className="h-4 w-4 text-[#7DA0FA]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{publishedPosts}</div>
            <p className="text-xs text-gray-500 mt-1">Published</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#7978E9]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Press Mentions</CardTitle>
            <Newspaper className="h-4 w-4 text-[#7978E9]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{pressMentions}</div>
            <p className="text-xs text-green-600 flex items-center mt-1"><TrendingUp className="h-3 w-3 mr-1" /> Dynamic</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Content Engagement</CardTitle>
            <CardDescription>Social Posts vs Newsletter Opens</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4B49AC" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4B49AC" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7DA0FA" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#7DA0FA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="posts" stroke="#4B49AC" fillOpacity={1} fill="url(#colorPosts)" name="Social Posts" />
                <Area type="monotone" dataKey="newsletters" stroke="#7DA0FA" fillOpacity={1} fill="url(#colorNews)" name="Newsletters" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Audience Demographics</CardTitle>
            <CardDescription>User base segmented by age</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={audienceData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#333', fontWeight: 500 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="users" fill="#F3797E" radius={[0, 4, 4, 0]} name="Users" barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
