import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Tag, 
  Calendar, 
  Image as ImageIcon,
  CheckCircle2,
  Share2,
  Globe
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { logAdminActivity } from "@/utils/adminLogger"
import { useToast } from "@/hooks/use-toast"

export function MarketingPostsManagement() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<any>(null)

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [tags, setTags] = useState("")

  const { toast } = useToast()

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("marketing_posts")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error("Failed to load posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreateModal = () => {
    setEditingPost(null)
    setTitle("")
    setContent("")
    setImageUrl("")
    setTags("")
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (post: any) => {
    setEditingPost(post)
    setTitle(post.title || "")
    setContent(post.content || "")
    setImageUrl(post.image_url || "")
    setTags(Array.isArray(post.tags) ? post.tags.join(", ") : post.tags || "")
    setIsModalOpen(true)
  }

  const handleSavePost = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Fields Required",
        description: "Please fill in post title and content.",
        variant: "destructive"
      })
      return
    }

    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    try {
      if (editingPost) {
        const { error } = await supabase
          .from("marketing_posts")
          .update({
            title: title.trim(),
            content: content.trim(),
            image_url: imageUrl.trim() || null,
            tags: tagList,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingPost.id)

        if (error) throw error

        logAdminActivity("UPDATED_POST", `Post: ${title.trim()}`, "Marketing post content updated.")
        toast({
          title: "Post Updated! ✨",
          description: `"${title}" has been updated.`
        })
      } else {
        const { error } = await supabase
          .from("marketing_posts")
          .insert({
            title: title.trim(),
            content: content.trim(),
            image_url: imageUrl.trim() || null,
            tags: tagList,
            is_published: true,
          })

        if (error) throw error

        logAdminActivity("CREATED_POST", `Post: ${title.trim()}`, "Marketing post created.")
        toast({
          title: "Post Published! 🚀",
          description: `"${title}" is now live in marketing posts database.`
        })
      }

      setIsModalOpen(false)
      loadPosts()
    } catch (error) {
      console.error("Failed to save post:", error)
      toast({
        title: "Error saving post",
        description: "Please check your connection and try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeletePost = async (postId: string, postTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${postTitle}"?`)) return

    try {
      const { error } = await supabase.from("marketing_posts").delete().eq("id", postId)
      if (error) throw error

      logAdminActivity("DELETED_POST", `Post: ${postTitle}`, "Marketing post deleted.")
      toast({
        title: "Post Deleted",
        description: `"${postTitle}" was removed.`
      })
      loadPosts()
    } catch (error) {
      console.error("Failed to delete post:", error)
    }
  }

  const togglePostStatus = async (post: any) => {
    try {
      const { error } = await supabase
        .from("marketing_posts")
        .update({
          is_published: !post.is_published,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post.id)

      if (error) throw error

      logAdminActivity(
        "TOGGLED_POST_STATUS",
        `Post: ${post.title}`,
        `Status changed to ${!post.is_published ? "Published" : "Draft"}`
      )
      loadPosts()
    } catch (error) {
      console.error("Failed to toggle post status:", error)
    }
  }

  const filteredPosts = useMemo(() => {
    return posts.filter(
      (p) =>
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (Array.isArray(p.tags) && p.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase())))
    )
  }, [posts, searchQuery])

  const publishedCount = useMemo(() => posts.filter((p) => p.is_published).length, [posts])
  const draftCount = useMemo(() => posts.filter((p) => !p.is_published).length, [posts])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="h-6 w-6 text-[#4B49AC]" />
            Marketing Posts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Publish social media posts, blog updates, announcements, and promotional copy.
          </p>
        </div>
        <Button
          onClick={handleOpenCreateModal}
          className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-semibold shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" /> Create New Post
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Total Posts</p>
            <h3 className="text-xl font-bold text-gray-900">{posts.length}</h3>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Published Live</p>
            <h3 className="text-xl font-bold text-emerald-700">{publishedCount}</h3>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Drafts</p>
            <h3 className="text-xl font-bold text-gray-900">{draftCount}</h3>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search posts by title, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-50/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-gray-200">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">No Marketing Posts Found</h3>
          <p className="text-sm text-gray-500 mt-1">Publish your first social post or story to see it here.</p>
          <Button onClick={handleOpenCreateModal} className="mt-4 bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white">
            <Plus className="h-4 w-4 mr-2" /> Create New Post
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="shadow-sm border-gray-200 hover:shadow-md transition-shadow flex flex-col justify-between">
              <CardHeader className="pb-3 border-b bg-gray-50/40">
                <div className="flex items-center justify-between gap-2">
                  <Badge className={post.is_published ? "bg-emerald-600 text-white text-xs" : "bg-amber-500 text-white text-xs"}>
                    {post.is_published ? "Live Published" : "Draft"}
                  </Badge>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-gray-900 mt-2 leading-snug">
                  {post.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 space-y-3 flex-1">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {post.content}
                </p>

                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-40 object-cover rounded-lg border border-gray-200"
                  />
                )}

                {Array.isArray(post.tags) && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {post.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 text-[11px] font-mono px-2 py-0.5 rounded border border-gray-200">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>

              <div className="p-4 pt-3 border-t bg-gray-50/30 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs text-gray-700"
                  onClick={() => togglePostStatus(post)}
                >
                  {post.is_published ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                  {post.is_published ? "Unpublish" : "Publish"}
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-gray-600"
                    onClick={() => handleOpenEditModal(post)}
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-red-600 hover:text-red-700"
                    onClick={() => handleDeletePost(post.id, post.title)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Create or Edit Post */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
              <FileText className="h-5 w-5 text-[#4B49AC]" />
              {editingPost ? "Edit Marketing Post" : "Create New Marketing Post"}
            </DialogTitle>
            <DialogDescription>
              Write content, add optional image URL, and publish directly to the live marketing database.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Post Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Monsoon Electroculture Offer Announcement"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Post Content *</label>
              <Textarea
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write out post copy, call to action, and details..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Image URL (Optional)</label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/banner-image.jpg"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Tags (Comma Separated)</label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="electroculture, organic, farmers, monsoon"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePost} className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-bold">
              <Sparkles className="h-4 w-4 mr-2" />
              {editingPost ? "Update Post" : "Publish Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
