import React, { useState, useMemo } from "react"
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
  Copy,
  Sparkles,
  ExternalLink,
  Film
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  uploaded_at: string
}

const INITIAL_VIDEOS: VideoAssetItem[] = [
  {
    id: "vid_1",
    title: "Commercial Wheat Field Electroculture 4K Drone Footage",
    description: "4K aerial drone footage showing root depth expansion and soil ionization antenna layout across a 100-acre commercial farm.",
    category: "Field Demos",
    duration: "4:45",
    resolution: "4K UHD (3840x2160)",
    video_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    views_count: 38400,
    download_count: 1250,
    uploaded_at: "2026-08-02"
  },
  {
    id: "vid_2",
    title: "BiovaCo Precision Ionization Coil Setup & Wiring Tutorial",
    description: "Complete technical walkthrough showing copper coil winding ratios, atmospheric grounding, and frequency testing.",
    category: "Technical Tutorials",
    duration: "12:30",
    resolution: "1080p Full HD",
    video_url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80",
    views_count: 24900,
    download_count: 890,
    uploaded_at: "2026-07-25"
  },
  {
    id: "vid_3",
    title: "Farmer Testimonial: 42% Yield Boost in Sugarcane Harvest",
    description: "Farmer Interview from Kolhapur detailing chemical fertilizer savings, crop height, and profit surge after 1 season.",
    category: "Testimonials",
    duration: "3:15",
    resolution: "1080p Full HD",
    video_url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=1200&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80",
    views_count: 19200,
    download_count: 640,
    uploaded_at: "2026-07-18"
  }
]

export function VideosManager() {
  const [videos, setVideos] = useState<VideoAssetItem[]>(INITIAL_VIDEOS)
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

  const filteredVideos = useMemo(() => {
    return videos.filter(v =>
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleSaveVideo = () => {
    if (!form.title || !form.video_url) {
      toast({ title: "Validation Error", description: "Title and Video URL are required.", variant: "destructive" })
      return
    }

    const thumb = form.thumbnail_url || form.video_url

    if (editingVideo) {
      setVideos(prev => prev.map(v => v.id === editingVideo.id ? {
        ...v,
        ...form,
        thumbnail_url: thumb
      } : v))
      toast({ title: "Video Asset Updated", description: `"${form.title}" saved.` })
    } else {
      const newVid: VideoAssetItem = {
        id: `vid_${Date.now()}`,
        ...form,
        thumbnail_url: thumb,
        views_count: 100,
        download_count: 10,
        uploaded_at: new Date().toISOString().slice(0, 10)
      }
      setVideos(prev => [newVid, ...prev])
      toast({ title: "Video Added to Vault! 🎬", description: `"${form.title}" published.` })
    }
    setIsModalOpen(false)
  }

  const handleDeleteVideo = (id: string, title: string) => {
    setVideos(prev => prev.filter(v => v.id !== id))
    toast({ title: "Video Removed", description: `"${title}" deleted.` })
  }

  const totalViews = useMemo(() => videos.reduce((acc, v) => acc + v.views_count, 0), [videos])

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                <Film className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
                4K UHD Commercial Video Vault
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <VideoIcon className="h-7 w-7 text-[#7DA0FA]" />
              Video Vault & Commercial Demos
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Manage high-definition commercial videos, drone field trials, technical setup tutorials, and farmer testimonial recordings.
            </p>
          </div>

          <Button
            onClick={handleOpenAdd}
            className="bg-[#4B49AC] hover:bg-[#3b3a8c] text-white font-semibold shadow-md text-xs h-10 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Video
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Total Video Assets</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{videos.length} Videos</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Total Video Views</span>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{(totalViews / 1000).toFixed(1)}k Views</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Max Resolution</span>
            <span className="text-xl font-bold text-purple-300 mt-0.5 block">4K UHD 60fps</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] font-medium text-slate-400 block">Streaming CDN</span>
            <span className="text-xl font-bold text-cyan-300 mt-0.5 block">Active Fast CDN</span>
          </div>
        </div>
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
          <Card key={video.id} className="border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-lg flex flex-col justify-between overflow-hidden">
            <div>
              <div className="relative h-48 w-full bg-slate-950 overflow-hidden group">
                <img
                  src={video.thumbnail_url}
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
                <Eye className="h-3.5 w-3.5 text-slate-400" /> {video.views_count.toLocaleString()} views
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
                  className="h-8 px-3 text-xs bg-[#4B49AC] hover:bg-[#3b3a8c] text-white font-semibold flex items-center gap-1"
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
              <img src={playingVideo.thumbnail_url} alt={playingVideo.title} className="h-full w-full object-cover opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 text-white bg-slate-950/40">
                <Play className="h-16 w-16 fill-white" />
                <span className="text-xs font-semibold">Live 4K Stream Initialized</span>
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
