import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Edit, Trash2, X, Check } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import MDEditor from "@uiw/react-md-editor"

export interface NewsArticle {
 id: string
 created_at: string
 title: string
 slug: string
 date: string
 category: string
 summary: string
 content: string
 image: string
 author: string
 is_published: boolean
 seo_keywords?: string
}

export function NewsManagement() {
 const [articles, setArticles] = useState<NewsArticle[]>([])
 const [isLoading, setIsLoading] = useState(true)
 const [isEditing, setIsEditing] = useState(false)
 const [isSaving, setIsSaving] = useState(false)
 const { toast } = useToast()

 const [formData, setFormData] = useState<Partial<NewsArticle>>({
 title: "",
 slug: "",
 date: new Date().toISOString().split("T")[0],
 category: "Company News",
 summary: "",
 content: "",
 image: "",
 author: "BiovaCo Nexus Corporate Communications",
 is_published: true,
 seo_keywords: "",
 })

 useEffect(() => {
 fetchArticles()
 }, [])

 const fetchArticles = async () => {
 try {
 setIsLoading(true)
 const { data, error } = await supabase
 .from("news_articles")
 .select("*")
 .order("date", { ascending: false })

 if (error) throw error
 setArticles(data || [])
 } catch (error: any) {
 toast({
 title: "Error fetching news articles",
 description: error.message,
 variant: "destructive",
 })
 } finally {
 setIsLoading(false)
 }
 }

 const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const title = e.target.value
 // Only auto-generate slug if we are creating a new article or if the user hasn't manually edited the slug
 // Here we'll just auto-generate it if it's currently empty or matches a simple lowercased version of the old title
 setFormData((prev) => {
 const isAutoSlug = !prev.slug || prev.slug === prev.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
 return {
 ...prev,
 title,
 slug: isAutoSlug ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : prev.slug,
 }
 })
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 try {
 setIsSaving(true)
 if (formData.id) {
 // Update
 const { error } = await supabase
 .from("news_articles")
 .update(formData)
 .eq("id", formData.id)
 if (error) throw error
 toast({ title: "Article updated successfully" })
 } else {
 // Insert
 const { error } = await supabase
 .from("news_articles")
 .insert([formData])
 if (error) throw error
 toast({ title: "Article created successfully" })
 }
 setIsEditing(false)
 fetchArticles()
 } catch (error: any) {
 toast({
 title: "Error saving article",
 description: error.message,
 variant: "destructive",
 })
 } finally {
 setIsSaving(false)
 }
 }

 const handleDelete = async (id: string) => {
 if (!window.confirm("Are you sure you want to delete this article?")) return
 try {
 const { error } = await supabase.from("news_articles").delete().eq("id", id)
 if (error) throw error
 toast({ title: "Article deleted successfully" })
 fetchArticles()
 } catch (error: any) {
 toast({
 title: "Error deleting article",
 description: error.message,
 variant: "destructive",
 })
 }
 }

 const handleEdit = (article: NewsArticle) => {
 setFormData(article)
 setIsEditing(true)
 }

 const resetForm = () => {
 setFormData({
 title: "",
 slug: "",
 date: new Date().toISOString().split("T")[0],
 category: "Company News",
 summary: "",
 content: "",
 image: "",
 author: "BiovaCo Nexus Corporate Communications",
 is_published: true,
 seo_keywords: "",
 })
 setIsEditing(true)
 }

 if (isLoading) {
 return (
 <div className="flex justify-center items-center h-64">
 <Loader2 className="h-8 w-8 animate-spin text-foreground" />
 </div>
 )
 }

 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <h2 className="text-2xl font-bold text-gray-900">News & Press Releases</h2>
 {!isEditing && (
 <Button onClick={resetForm} className="bg-primary/10 hover:bg-primary/10">
 <Plus className="h-4 w-4 mr-2" />
 Create Article
 </Button>
 )}
 </div>

 {isEditing ? (
 <Card>
 <CardHeader>
 <div className="flex justify-between items-center">
 <CardTitle>{formData.id ? "Edit Article" : "Create New Article"}</CardTitle>
 <Button variant="ghost" onClick={() => setIsEditing(false)}>
 <X className="h-4 w-4 mr-2" />
 Cancel
 </Button>
 </div>
 </CardHeader>
 <CardContent>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-sm font-medium">Title *</label>
 <Input 
 required 
 value={formData.title || ""} 
 onChange={handleTitleChange} 
 placeholder="Article title"
 />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium">Slug *</label>
 <Input 
 required 
 value={formData.slug || ""} 
 onChange={(e) => setFormData({ ...formData, slug: e.target.value })} 
 placeholder="article-slug"
 />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium">Date *</label>
 <Input 
 type="date" 
 required 
 value={formData.date || ""} 
 onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
 />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium">Category *</label>
 <Select 
 value={formData.category || "Company News"} 
 onValueChange={(val) => setFormData({ ...formData, category: val })}
 >
 <SelectTrigger>
 <SelectValue placeholder="Select a category" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="Press Release">Press Release</SelectItem>
 <SelectItem value="Company News">Company News</SelectItem>
 <SelectItem value="Product Update">Product Update</SelectItem>
 <SelectItem value="Media Mention">Media Mention</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium">Author *</label>
 <Input 
 required 
 value={formData.author || ""} 
 onChange={(e) => setFormData({ ...formData, author: e.target.value })} 
 />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium">Image URL</label>
 <Input 
 value={formData.image || ""} 
 onChange={(e) => setFormData({ ...formData, image: e.target.value })} 
 placeholder="https://example.com/image.jpg"
 />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium">SEO Keywords</label>
 <Input 
 value={formData.seo_keywords || ""} 
 onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })} 
 placeholder="e.g. commencement, operations, future"
 />
 <p className="text-xs text-gray-500">Comma-separated list of words for Google indexing</p>
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-sm font-medium">Summary *</label>
 <Textarea 
 required 
 value={formData.summary || ""} 
 onChange={(e) => setFormData({ ...formData, summary: e.target.value })} 
 placeholder="Brief summary of the article"
 rows={2}
 />
 </div>

 <div className="space-y-2">
 <label className="text-sm font-medium">Content *</label>
 <div data-color-mode="light">
 <MDEditor
 value={formData.content || ""}
 onChange={(val) => setFormData({ ...formData, content: val || "" })}
 height={400}
 preview="live"
 />
 </div>
 </div>

 <div className="flex items-center space-x-2 pt-2">
 <input
 type="checkbox"
 id="is_published"
 checked={formData.is_published ?? true}
 onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
 className="h-4 w-4 text-foreground rounded border-gray-300"
 />
 <label htmlFor="is_published" className="text-sm font-medium">
 Published
 </label>
 </div>

 <div className="flex justify-end pt-4">
 <Button type="submit" disabled={isSaving} className="bg-primary/10 hover:bg-primary/10">
 {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
 Save Article
 </Button>
 </div>
 </form>
 </CardContent>
 </Card>
 ) : (
 <Card>
 <CardContent className="p-0">
 {articles.length === 0 ? (
 <div className="p-6 text-center text-gray-500">
 No articles found. Click "Create Article" to add one.
 </div>
 ) : (
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Title</TableHead>
 <TableHead>Category</TableHead>
 <TableHead>Date</TableHead>
 <TableHead>Status</TableHead>
 <TableHead className="text-right">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {articles.map((article) => (
 <TableRow key={article.id}>
 <TableCell className="font-medium">
 <div className="truncate max-w-xs" title={article.title}>
 {article.title}
 </div>
 </TableCell>
 <TableCell>
 <Badge variant="outline">{article.category}</Badge>
 </TableCell>
 <TableCell>{article.date}</TableCell>
 <TableCell>
 {article.is_published ? (
 <Badge className="bg-primary/10 text-foreground hover:bg-primary/10">Published</Badge>
 ) : (
 <Badge variant="secondary">Draft</Badge>
 )}
 </TableCell>
 <TableCell className="text-right">
 <Button variant="ghost" size="icon" onClick={() => handleEdit(article)}>
 <Edit className="h-4 w-4 text-foreground" />
 </Button>
 <Button variant="ghost" size="icon" onClick={() => handleDelete(article.id)}>
 <Trash2 className="h-4 w-4 text-red-600" />
 </Button>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 )}
 </CardContent>
 </Card>
 )}
 </div>
 )
}
