import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/integrations/supabase/client"
import { logAdminActivity } from "@/utils/adminLogger"

export function MarketingPostsManagement() {
  const [posts, setPosts] = useState<any[]>([])
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    image: "",
    tags: "",
  })
  const [editingPost, setEditingPost] = useState<any>(null)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("marketing_posts")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error("Failed to load posts:", error)
    }
  }

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      return
    }

    try {
      const { data, error } = await supabase
        .from("marketing_posts")
        .insert({
          title: newPost.title.trim(),
          content: newPost.content.trim(),
          image_url: newPost.image.trim() || null,
          tags: newPost.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0),
          is_published: true,
        })
        .select()

      if (error) {
        console.error("Failed to create post:", error)
        throw error
      }

      logAdminActivity("CREATED_POST", `Post: ${newPost.title.trim()}`, "Marketing post created.");
      setNewPost({ title: "", content: "", image: "", tags: "" })
      await loadPosts()
    } catch (error) {
      console.error("Failed to create post:", error)
    }
  }

  const handleUpdatePost = async () => {
    if (!editingPost || !editingPost.title.trim() || !editingPost.content.trim()) return

    try {
      const { error } = await supabase
        .from("marketing_posts")
        .update({
          title: editingPost.title.trim(),
          content: editingPost.content.trim(),
          image_url: editingPost.image_url || null,
          tags: editingPost.tags || [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingPost.id)

      if (error) throw error

      logAdminActivity("UPDATED_POST", `Post: ${editingPost.title.trim()}`, "Marketing post content updated.");
      setEditingPost(null)
      await loadPosts()
    } catch (error) {
      console.error("Failed to update post:", error)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return

    try {
      const postToDelete = posts.find((p) => p.id === postId)
      const { error } = await supabase.from("marketing_posts").delete().eq("id", postId)

      if (error) throw error
      if (postToDelete) {
        logAdminActivity("DELETED_POST", `Post: ${postToDelete.title}`, "Marketing post deleted.");
      }
      await loadPosts()
    } catch (error) {
      console.error("Failed to delete post:", error)
    }
  }

  const togglePostStatus = async (postId: string) => {
    try {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      const { error } = await supabase
        .from("marketing_posts")
        .update({
          is_published: !post.is_published,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId)

      if (error) throw error
      
      logAdminActivity(
        "TOGGLED_POST_STATUS", 
        `Post: ${post.title}`, 
        `Status changed to ${!post.is_published ? "Published" : "Draft"}`
      );
      await loadPosts()
    } catch (error) {
      console.error("Failed to toggle post status:", error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Marketing Post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              placeholder="Enter post title..."
              value={editingPost ? editingPost.title : newPost.title}
              onChange={(e) =>
                editingPost
                  ? setEditingPost({ ...editingPost, title: e.target.value })
                  : setNewPost({ ...newPost, title: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              className="w-full p-2 border rounded-md"
              rows={4}
              placeholder="Write your post content..."
              value={editingPost ? editingPost.content : newPost.content}
              onChange={(e) =>
                editingPost
                  ? setEditingPost({ ...editingPost, content: e.target.value })
                  : setNewPost({ ...newPost, content: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Image URL (Optional)</label>
            <Input
              placeholder="https://example.com/image.jpg"
              value={editingPost ? editingPost.image_url : newPost.image}
              onChange={(e) =>
                editingPost
                  ? setEditingPost({ ...editingPost, image_url: e.target.value })
                  : setNewPost({ ...newPost, image: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
            <Input
              placeholder="marketing, updates, news"
              value={
                editingPost
                  ? Array.isArray(editingPost.tags)
                    ? editingPost.tags.join(", ")
                    : editingPost.tags
                  : newPost.tags
              }
              onChange={(e) => {
                if (editingPost) {
                  const tagArray = e.target.value.split(",").map((t) => t.trim())
                  setEditingPost({ ...editingPost, tags: tagArray })
                } else {
                  setNewPost({ ...newPost, tags: e.target.value })
                }
              }}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-gray-100">
            {editingPost ? (
              <>
                <Button onClick={handleUpdatePost} className="w-full sm:w-auto bg-[#08A04B] hover:bg-[#08A04B]/90 text-white">
                  Update Post
                </Button>
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setEditingPost(null)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={handleCreatePost} className="w-full sm:w-auto bg-[#08A04B] hover:bg-[#08A04B]/90 text-white">
                Create Post
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Posts ({posts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No posts created yet. Create your first marketing post above!
            </p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-2">
                    <div className="flex-1 pr-0 sm:pr-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-bold text-[#032E63] text-lg">{post.title}</h3>
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium shrink-0 ${post.is_published ? "bg-[#08A04B]/10 text-[#08A04B]" : "bg-gray-100 text-gray-800"}`}
                        >
                          {post.is_published ? "Published" : "Draft"}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm mb-3">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-gray-700 mb-3">{post.content}</p>
                      {post.image_url && (
                        <img
                          src={post.image_url || "/placeholder.svg"}
                          alt={post.title}
                          className="w-full max-w-sm h-48 object-cover rounded-md mb-3"
                        />
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {post.tags.map((tag: string, index: number) => (
                            <span key={index} className="bg-[#032E63]/10 text-[#032E63] text-xs font-medium px-2 py-1 rounded-md">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => togglePostStatus(post.id)}>
                        {post.is_published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => setEditingPost(post)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" className="w-full sm:w-auto" onClick={() => handleDeletePost(post.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
