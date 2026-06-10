"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Upload, 
  Box, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Heart, 
  MessageCircle,
  ToggleLeft,
  ToggleRight
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Model3D {
  id: string
  title: string
  description: string
  file_url: string
  file_type: string
  file_size: number
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export const Model3DManagement = () => {
  const [models, setModels] = useState<Model3D[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editingModel, setEditingModel] = useState<Model3D | null>(null)
  const [newModel, setNewModel] = useState({
    title: "",
    description: "",
    file: null as File | null,
    display_order: 0
  })
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const { toast } = useToast()

  const loadModels = async () => {
    try {
      const { data, error } = await supabase
        .from("model_3d")
        .select("*")
        .order("display_order", { ascending: true })

      if (error) throw error
      setModels(data || [])
    } catch (error) {
      console.error("Failed to load 3D models:", error)
      toast({
        title: "Error",
        description: "Failed to load 3D models",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadModels()
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream']
    const allowedExtensions = ['.glb', '.gltf', '.stl', '.step', '.obj']
    
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedExtensions.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a .glb, .gltf, .stl, .step, or .obj file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 50MB",
        variant: "destructive",
      })
      return
    }

    setNewModel(prev => ({ ...prev, file }))
  }

  const uploadModel = async () => {
    if (!newModel.file || !newModel.title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and select a file",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      // Upload file to Supabase Storage
      const fileExt = newModel.file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('3d-models')
        .upload(fileName, newModel.file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('3d-models')
        .getPublicUrl(fileName)

      // Save model info to database
      const { error: dbError } = await supabase
        .from('model_3d')
        .insert({
          title: newModel.title.trim(),
          description: newModel.description.trim() || null,
          file_url: publicUrl,
          file_type: fileExt?.toLowerCase() || 'glb',
          file_size: newModel.file.size,
          display_order: newModel.display_order,
          is_active: true
        })

      if (dbError) throw dbError

      toast({
        title: "Success",
        description: "3D model uploaded successfully",
      })

      // Reset form
      setNewModel({
        title: "",
        description: "",
        file: null,
        display_order: 0
      })
      setUploadDialogOpen(false)
      
      // Reload models
      await loadModels()

    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload 3D model. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const updateModel = async () => {
    if (!editingModel) return

    try {
      const { error } = await supabase
        .from('model_3d')
        .update({
          title: editingModel.title.trim(),
          description: editingModel.description?.trim() || null,
          display_order: editingModel.display_order,
          is_active: editingModel.is_active
        })
        .eq('id', editingModel.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "3D model updated successfully",
      })

      setEditDialogOpen(false)
      setEditingModel(null)
      await loadModels()

    } catch (error) {
      console.error("Update error:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update 3D model",
        variant: "destructive",
      })
    }
  }

  const deleteModel = async (model: Model3D) => {
    if (!confirm(`Are you sure you want to delete "${model.title}"?`)) return

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('model_3d')
        .delete()
        .eq('id', model.id)

      if (dbError) throw dbError

      // Delete file from storage
      const fileName = model.file_url.split('/').pop()
      if (fileName) {
        await supabase.storage
          .from('3d-models')
          .remove([fileName])
      }

      toast({
        title: "Success",
        description: "3D model deleted successfully",
      })

      await loadModels()

    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete 3D model",
        variant: "destructive",
      })
    }
  }

  const toggleModelStatus = async (model: Model3D) => {
    try {
      const { error } = await supabase
        .from('model_3d')
        .update({ is_active: !model.is_active })
        .eq('id', model.id)

      if (error) throw error

      toast({
        title: "Success",
        description: `3D model ${!model.is_active ? 'activated' : 'deactivated'}`,
      })

      await loadModels()

    } catch (error) {
      console.error("Toggle error:", error)
      toast({
        title: "Error",
        description: "Failed to update model status",
        variant: "destructive",
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading 3D models...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Box className="h-5 w-5 text-blue-600" />
              <CardTitle>3D Model Management</CardTitle>
            </div>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload 3D Model
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload New 3D Model</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newModel.title}
                      onChange={(e) => setNewModel(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter model title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newModel.description}
                      onChange={(e) => setNewModel(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter model description (optional)"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={newModel.display_order}
                      onChange={(e) => setNewModel(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="file">3D Model File</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".glb,.gltf,.stl,.step,.obj"
                      onChange={handleFileSelect}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: .glb, .gltf, .stl, .step, .obj (Max 50MB)
                    </p>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={uploadModel} 
                      disabled={uploading || !newModel.file || !newModel.title.trim()}
                      className="flex-1"
                    >
                      {uploading ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No 3D models uploaded yet</p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-hidden rounded-md border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#f8fafc]">
                      <TableHead className="text-[#032E63] font-bold">Title</TableHead>
                      <TableHead className="text-[#032E63] font-bold">Type</TableHead>
                      <TableHead className="text-[#032E63] font-bold">Size</TableHead>
                      <TableHead className="text-[#032E63] font-bold">Status</TableHead>
                      <TableHead className="text-[#032E63] font-bold">Order</TableHead>
                      <TableHead className="text-[#032E63] font-bold">Created</TableHead>
                      <TableHead className="text-[#032E63] font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {models.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-[#032E63]">{model.title}</div>
                            {model.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {model.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="uppercase bg-gray-100">
                            {model.file_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(model.file_size)}</TableCell>
                        <TableCell>
                          <Badge className={model.is_active ? "bg-[#08A04B] hover:bg-[#08A04B]/90 text-white" : "bg-gray-400 text-white"}>
                            {model.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{model.display_order}</TableCell>
                        <TableCell>
                          {new Date(model.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingModel(model)
                                setEditDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleModelStatus(model)}
                            >
                              {model.is_active ? (
                                <ToggleRight className="h-4 w-4 text-[#08A04B]" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteModel(model)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Mobile View */}
              <div className="grid grid-cols-1 gap-4 lg:hidden mt-4">
                {models.map((model) => (
                  <Card key={model.id} className="p-4 border-l-4 border-l-[#032E63] shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="pr-4">
                        <h3 className="font-bold text-[#032E63] leading-tight mb-1">{model.title}</h3>
                        <p className="text-xs text-gray-500 font-medium">
                          {formatFileSize(model.file_size)} • {model.file_type.toUpperCase()}
                        </p>
                      </div>
                      <Badge className={`shrink-0 ${model.is_active ? "bg-[#08A04B] hover:bg-[#08A04B]/90 text-white" : "bg-gray-400 text-white"}`}>
                        {model.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    {model.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{model.description}</p>
                    )}
                    
                    <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-100">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Order: {model.display_order}</span>
                        <span className="text-xs text-gray-400">{new Date(model.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-1 bg-gray-50 rounded-md p-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingModel(model); setEditDialogOpen(true); }}>
                          <Edit className="h-4 w-4 text-[#032E63]" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleModelStatus(model)}>
                          {model.is_active ? <ToggleRight className="h-4 w-4 text-[#08A04B]" /> : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700" onClick={() => deleteModel(model)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit 3D Model</DialogTitle>
          </DialogHeader>
          {editingModel && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_title">Title</Label>
                <Input
                  id="edit_title"
                  value={editingModel.title}
                  onChange={(e) => setEditingModel(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={editingModel.description || ""}
                  onChange={(e) => setEditingModel(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit_display_order">Display Order</Label>
                <Input
                  id="edit_display_order"
                  type="number"
                  value={editingModel.display_order}
                  onChange={(e) => setEditingModel(prev => prev ? { ...prev, display_order: parseInt(e.target.value) || 0 } : null)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={editingModel.is_active}
                  onChange={(e) => setEditingModel(prev => prev ? { ...prev, is_active: e.target.checked } : null)}
                />
                <Label htmlFor="edit_is_active">Active</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={updateModel} className="flex-1">
                  Update
                </Button>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}