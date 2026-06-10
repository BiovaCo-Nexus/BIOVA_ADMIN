"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Save, Eye, Video, ImageIcon } from "lucide-react"

interface Story {
  title: string
  content: string
  image: string
  video_url: string
  video_description: string
  media_type: "image" | "video"
}

interface PageContent {
  id: string
  page_name: string
  title: string
  description: string
  content: {
    sections: Story[]
  }
  images: {
    [key: string]: string
  }
}

const PageContentManagement = () => {
  const [pageContent, setPageContent] = useState<PageContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    stories: [] as Story[],
  })

  useEffect(() => {
    fetchPageContent()
  }, [])

  const fetchPageContent = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("page_content").select("*").eq("page_name", "our-story").single()

      if (error && error.code !== "PGRST116") throw error

      if (data) {
        setPageContent(data as any)
        const content = data.content as any
        setFormData({
          title: data.title || "",
          description: data.description || "",
          stories: content?.sections || [],
        })
      }
    } catch (error) {
      console.error("Error fetching page content:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File, index: number) => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `story_images/${fileName}`

      const { error: uploadError } = await supabase.storage.from("page-images").upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("page-images").getPublicUrl(filePath)

      setFormData((prev) => {
        const updatedStories = [...prev.stories]
        updatedStories[index].image = data.publicUrl
        return { ...prev, stories: updatedStories }
      })

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const contentData = {
        page_name: "our-story",
        title: formData.title,
        description: formData.description,
        content: {
          sections: formData.stories,
        },
        images: JSON.stringify({}), // You can manage images separately if needed
      }

      let error
      if (pageContent) {
        ;({ error } = await supabase.from("page_content").update({
          ...contentData,
          content: contentData.content as any
        }).eq("id", pageContent.id))
      } else {
        ;({ error } = await supabase.from("page_content").insert([{
          ...contentData,
          content: contentData.content as any
        }]))
      }

      if (error) throw error

      toast({
        title: "Success",
        description: "Page content saved successfully",
      })

      fetchPageContent()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const addStory = () => {
    setFormData((prev) => ({
      ...prev,
      stories: [
        ...prev.stories,
        {
          title: "",
          content: "",
          image: "",
          video_url: "",
          video_description: "",
          media_type: "image",
        },
      ],
    }))
  }

  const isValidVideoUrl = (url: string) => {
    const videoPatterns = [
      /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/,
      /^https?:\/\/(www\.)?vimeo\.com/,
      /^https?:\/\/(www\.)?dailymotion\.com/,
      /\.(mp4|webm|ogg)$/i,
    ]
    return videoPatterns.some((pattern) => pattern.test(url))
  }

  const removeStory = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      stories: prev.stories.filter((_, i) => i !== index),
    }))
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Our Story Page Management</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => window.open("/our-story", "_blank")}>
            <Eye className="h-4 w-4 mr-2" />
            Preview Page
          </Button>
          <Button className="w-full sm:w-auto bg-[#032E63] hover:bg-[#032E63]/90" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Page Header</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Page Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Our Story"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Page Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Discover the journey behind ElectroCulture..."
            />
          </div>
        </CardContent>
      </Card>

      {formData.stories.map((story, index) => (
        <Card key={index}>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Story Section {index + 1}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 bg-transparent"
              onClick={() => removeStory(index)}
            >
              Remove
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Story Title</label>
              <Input
                value={story.title}
                onChange={(e) => {
                  const updatedStories = [...formData.stories]
                  updatedStories[index].title = e.target.value
                  setFormData((prev) => ({ ...prev, stories: updatedStories }))
                }}
                placeholder="Story Title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Story Content</label>
              <Textarea
                value={story.content}
                onChange={(e) => {
                  const updatedStories = [...formData.stories]
                  updatedStories[index].content = e.target.value
                  setFormData((prev) => ({ ...prev, stories: updatedStories }))
                }}
                placeholder="Story Content"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Media Type</label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={story.media_type === "image" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const updatedStories = [...formData.stories]
                    updatedStories[index].media_type = "image"
                    setFormData((prev) => ({ ...prev, stories: updatedStories }))
                  }}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Image
                </Button>
                <Button
                  type="button"
                  variant={story.media_type === "video" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const updatedStories = [...formData.stories]
                    updatedStories[index].media_type = "video"
                    setFormData((prev) => ({ ...prev, stories: updatedStories }))
                  }}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Video
                </Button>
              </div>
            </div>

            {story.media_type === "image" ? (
              <div>
                <label className="block text-sm font-medium mb-2">Story Image</label>
                <div className="flex gap-4 items-center">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file, index)
                    }}
                  />
                  {story.image && (
                    <div className="w-20 h-20 rounded border overflow-hidden">
                      <img
                        src={story.image || "/placeholder.svg"}
                        alt={`Story ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Video URL</label>
                  <Input
                    value={story.video_url}
                    onChange={(e) => {
                      const updatedStories = [...formData.stories]
                      updatedStories[index].video_url = e.target.value
                      setFormData((prev) => ({ ...prev, stories: updatedStories }))
                    }}
                    placeholder="https://www.youtube.com/watch?v=... or direct video URL"
                  />
                  {story.video_url && !isValidVideoUrl(story.video_url) && (
                    <p className="text-sm text-red-500 mt-1">
                      Please enter a valid video URL (YouTube, Vimeo, or direct video file)
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Video Description</label>
                  <Textarea
                    value={story.video_description}
                    onChange={(e) => {
                      const updatedStories = [...formData.stories]
                      updatedStories[index].video_description = e.target.value
                      setFormData((prev) => ({ ...prev, stories: updatedStories }))
                    }}
                    placeholder="Brief description of the video content"
                    rows={2}
                  />
                </div>
                {story.video_url && isValidVideoUrl(story.video_url) && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-green-600 mb-2">✓ Valid video URL detected</p>
                    <p className="text-xs text-gray-600">Video will be embedded and played on the Our Story page</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Button onClick={addStory} className="mt-4">
        Add Story
      </Button>
    </div>
  )
}

export default PageContentManagement
