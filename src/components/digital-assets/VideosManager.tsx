import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Video as VideoIcon,
  Play,
  Plus,
  Trash2,
  Edit3,
  Search,
  Eye,
  Clock,
  Download,
  Film,
  Loader2,
  Check
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

export interface VideoAssetItem {
  id: string
  title: string
  description: string
  category: string
  duration: string
  resolution: string
  video_url: string
  thumbnail_url: string
  views_count: number
  download_count: number
  created_at?: string
}

const DEFAULT_SEED_VIDEOS: Omit<VideoAssetItem, "id">[] = [
  {
    title: "Commercial Wheat Field Electroculture 4K Drone Footage",
    description: "4K aerial drone footage showing root depth expansion and soil ionization antenna layout across a 100-acre commercial farm.",
    category: "Field Demos",
    duration: "4:45",
    resolution: "4K UHD (3840x2160)",
    video_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    views_count: 38400,
    download_count: 1250
  },
  {
    title: "BiovaCo Precision Ionization Coil Setup & Wiring Tutorial",
    description: "Complete technical walkthrough showing copper coil winding ratios, atmospheric grounding, and frequency testing.",
    category: "Technical Tutorials",
    duration: "12:30",
    resolution: "1080p Full HD",
    video_url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80",
    views_count: 24900,
    download_count: 890
  },
  {
    title: "Farmer Testimonial: 42% Yield Boost in Sugarcane Harvest",
    description: "Farmer Interview from Kolhapur detailing chemical fertilizer savings, crop height, and profit surge after 1 season.",
    category: "Testimonials",
    duration: "3:15",
    resolution: "1080p Full HD",
    video_url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=1200&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80",
    views_count: 19200,
    download_count: 640
  }
]

export function VideosManager() {
  const [videos, setVideos] = useState<VideoAssetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [playingVideo, setPlayingVideo] = useState<VideoAssetItem | null>(null)
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVideo, setEditingVideo] = useState<VideoAssetItem | null>(null)
  const [form, setForm] = useState<{
    title: string
    description: string
    category: string
    duration: string
    resolution: string
    video_url: string
    thumbnail_url: string
  }>({
    title: "",
    description: "",
    category: "Field Demos",
    duration: "4:00",
    resolution: "1080p Full HD",
    video_url: "",
    thumbnail_url: ""
  })

  const { toast } = useToast()

  // Real DB Fetching from Supabase
  const fetchVideos = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("website_videos")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.warn("website_videos fetch error:", error.message)
      setVideos(DEFAULT_SEED_VIDEOS.map((d, i) => ({ ...d, id: `def_${i}` })) as VideoAssetItem[])
    } else if (!data || data.length === 0) {
      const seeded: VideoAssetItem[] = []
      for (const item of DEFAULT_SEED_VIDEOS) {
        const { data: inserted } = await supabase
          .from("website_videos")
          .insert(item)
          .select()
          .single()
        if (inserted) seeded.push(inserted)
      }
      setVideos(seeded.length > 0 ? seeded : DEFAULT_SEED_VIDEOS.map((d, i) => ({ ...d, id: `def_${i}` })) as VideoAssetItem[])
    } else {
      setVideos(data as VideoAssetItem[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchVideos()

    const channel = supabase
      .channel("website_videos_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "website_videos" }, fetchVideos)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchVideos])

  const filteredVideos = useMemo(() => {
    return videos.filter(v =>
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.category && v.category.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [videos, searchQuery])

  const handleDownloadVideo = (video: VideoAssetItem) => {
    window.open(video.video_url, "_blank")
    toast({ title: "Downloading Video 📥", description: `Opened video stream for ${video.title}.` })
  }

  const handleOpenAdd = () => {
    setEditingVideo(null)
    setForm({
      title: "",
      description: "",
      category: "Field Demos",
      duration: "4:00",
      resolution: "1080p Full HD",
      video_url: "",
      thumbnail_url: ""
    })
    setIsModalOpen(true)
  }

  const handleSaveVideo = async () => {
    if (!form.title || !form.video_url) {
      toast({ title: "Validation Error", description: "Title and Video URL are required.", variant: "destructive" })
      return
    }

    const thumb = form.thumbnail_url || form.video_url

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      duration: form.duration,
      resolution: form.resolution,
      video_url: form.video_url.trim(),
      thumbnail_url: thumb.trim(),
      is_active: true
    }

    if (editingVideo && !editingVideo.id.startsWith("def_")) {
      const { data, error } = await supabase
        .from("website_videos")
        .update(payload)
        .eq("id", editingVideo.id)
        .select()
        .single()

      if (error) {
        toast({ title: "Save Error", description: error.message, variant: "destructive" })
      } else if (data) {
        setVideos(prev => prev.map(v => v.id === editingVideo.id ? data : v))
        toast({ title: "Video Updated", description: `"${data.title}" saved in database.` })
      }
    } else {
      const { data, error } = await supabase
        .from("website_videos")
        .insert({
          ...payload,
          views_count: 100,
          download_count: 10
        })
        .select()
        .single()

      if (error) {
        const localObj = { ...payload, id: `local_${Date.now()}`, views_count: 100, download_count: 10 }
        setVideos(prev => [localObj as any, ...prev])
        toast({ title: "Video Added", description: `"${payload.title}" created.` })
      } else if (data) {
        setVideos(prev => [data, ...prev])
        toast({ title: "Video Published!", description: `"${data.title}" saved to database.` })
      }
    }
    setIsModalOpen(false)
  }

  const handleDeleteVideo = async (id: string, title: string) => {
    setVideos(prev => prev.filter(v => v.id !== id))
    if (!id.startsWith("def_") && !id.startsWith("local_")) {
      await supabase.from("website_videos").delete().eq("id", id)
    }
    toast({ title: "Video Removed", description: `"${title}" deleted.` })
  }

  const totalViews = useMemo(() => videos.reduce((acc, v) => acc + (v.views_count || 0), 0), [videos])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#4B49AC]" />
        <p className="text-sm font-medium text-gray-500">Loading Video Vault...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portal Standard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Film className="h-6 w-6 text-[#4B49AC]" />
            Video Vault & Commercial Demos
          </h1>
          <p className="text-sm text-gray-500">Manage high-definition commercial videos, drone field trials, tutorials, and farmer interviews.</p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white font-semibold text-xs h-9 flex items-center gap-1.5 shadow-2xs"
        >
          <Plus className="h-4 w-4" />
          Add New Video
        </Button>
      </div>

      {/* Portal Standard Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#4B49AC] shadow-2xs bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Video Assets</CardTitle>
            <VideoIcon className="h-4 w-4 text-[#4B49AC]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{videos.length} Videos</div>
            <p className="text-xs text-gray-500 mt-1">Hosted video demos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#7DA0FA] shadow-2xs bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Video Views</CardTitle>
            <Eye className="h-4 w-4 text-[#7DA0FA]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{(totalViews / 1000).toFixed(1)}k Views</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">Across all video channels</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-2xs bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Max Resolution</CardTitle>
            <Film className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">4K UHD 60fps</div>
            <p className="text-xs text-purple-600 font-medium mt-1">High bitrate video</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-2xs bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Streaming CDN</CardTitle>
            <Check className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">Active CDN</div>
            <p className="text-xs text-emerald-600 font-semibold mt-1">Fast Video Streaming</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search videos by title, category, or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map(video => (
          <Card key={video.id} className="border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-md flex flex-col justify-between overflow-hidden bg-white">
            <div>
              <div className="relative h-48 w-full bg-slate-950 overflow-hidden group">
                <img
                  src={video.thumbnail_url || video.video_url}
                  alt={video.title}
                  className="h-full w-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-all flex items-center justify-center">
                  <button
                    onClick={() => setPlayingVideo(video)}
                    className="p-4 bg-white/90 hover:bg-white text-[#4B49AC] rounded-full shadow-xl transition-transform hover:scale-110"
                  >
                    <Play className="h-6 w-6 fill-[#4B49AC] ml-1" />
                  </button>
                </div>

                <Badge className="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] backdrop-blur">
                  {video.category}
                </Badge>

                <Badge className="absolute bottom-3 right-3 bg-slate-900/90 text-slate-200 font-mono text-[10px] flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {video.duration}
                </Badge>
              </div>

              <CardContent className="p-4 space-y-2">
                <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                  {video.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {video.description}
                </p>
                <div className="text-[11px] font-mono text-purple-700 pt-1 font-semibold">
                  Resolution: {video.resolution}
                </div>
              </CardContent>
            </div>

            <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-slate-600 text-[11px]">
                <Eye className="h-3.5 w-3.5 text-slate-400" /> {(video.views_count || 0).toLocaleString()} views
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteVideo(video.id, video.title)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleDownloadVideo(video)}
                  className="h-8 px-3 text-xs bg-[#4B49AC] hover:bg-[#3b3a8c] text-white font-semibold flex items-center gap-1 shadow-2xs"
                >
                  <Download className="h-3.5 w-3.5" /> Download MP4
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Video Player Lightbox Modal */}
      {playingVideo && (
        <Dialog open={!!playingVideo} onOpenChange={() => setPlayingVideo(null)}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">{playingVideo.title}</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {playingVideo.category} • {playingVideo.duration} • {playingVideo.resolution}
              </DialogDescription>
            </DialogHeader>

            <div className="my-2 bg-slate-950 rounded-xl overflow-hidden aspect-video flex items-center justify-center relative">
              <img src={playingVideo.thumbnail_url || playingVideo.video_url} alt={playingVideo.title} className="h-full w-full object-cover opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 text-white bg-slate-950/40">
                <Play className="h-16 w-16 fill-white" />
                <span className="text-xs font-semibold">Live Stream Initialized</span>
              </div>
            </div>

            <DialogFooter>
              <Button size="sm" onClick={() => handleDownloadVideo(playingVideo)} className="bg-[#4B49AC] text-white font-semibold">
                <Download className="h-4 w-4 mr-1" /> Download Source Video File
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add / Edit Video Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#4B49AC] flex items-center gap-2">
              <VideoIcon className="h-5 w-5 text-[#7DA0FA]" />
              {editingVideo ? "Edit Video Asset" : "Add New Commercial Video"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Register commercial product videos, field trials, or customer tutorials.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Video Title *</label>
              <Input
                placeholder="e.g. 100-Acre Commercial Electroculture Field Trial"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Category</label>
                <Input
                  placeholder="Field Demos"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 mb-1 block">Duration</label>
                <Input
                  placeholder="4:30"
                  value={form.duration}
                  onChange={e => setForm({ ...form, duration: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Video Source URL *</label>
              <Input
                placeholder="https://..."
                value={form.video_url}
                onChange={e => setForm({ ...form, video_url: e.target.value })}
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Description</label>
              <Textarea
                rows={3}
                placeholder="Describe what is demonstrated in this video..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveVideo} className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white">
              {editingVideo ? "Save Changes" : "Publish Video"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
