import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Play, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Video {
  id: string;
  title: string;
  embed_url: string;
  video_type: 'hero' | 'story' | 'intro';
  is_active: boolean;
  display_order: number;
  description?: string;
  created_at: string;
}

export const VideoManagement: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    embed_url: '',
    video_type: 'story' as 'hero' | 'story' | 'intro',
    is_active: true,
    display_order: 0,
    description: ''
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('website_videos')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setVideos((data || []).map(v => ({
        ...v,
        video_type: v.video_type as 'hero' | 'story' | 'intro'
      })));
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Error",
        description: "Failed to fetch videos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      if (editingVideo) {
        // Update existing video
        const { error } = await supabase
          .from('website_videos')
          .update(formData)
          .eq('id', editingVideo.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Video updated successfully"
        });
      } else {
        // Create new video
        const { error } = await supabase
          .from('website_videos')
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Video added successfully"
        });
      }

      resetForm();
      fetchVideos();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving video:', error);
      toast({
        title: "Error",
        description: "Failed to save video",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('website_videos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Video deleted successfully"
      });
      
      fetchVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('website_videos')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Video ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
      
      fetchVideos();
    } catch (error) {
      console.error('Error toggling video status:', error);
      toast({
        title: "Error",
        description: "Failed to update video status",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      embed_url: '',
      video_type: 'story',
      is_active: true,
      display_order: 0,
      description: ''
    });
    setEditingVideo(null);
  };

  const openEditDialog = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      embed_url: video.embed_url,
      video_type: video.video_type,
      is_active: video.is_active,
      display_order: video.display_order,
      description: video.description || ''
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getVideoTypeColor = (type: string) => {
    switch (type) {
      case 'hero': return 'bg-red-100 text-red-800';
      case 'story': return 'bg-blue-100 text-blue-800';
      case 'intro': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Video Management</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Video
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingVideo ? 'Edit Video' : 'Add New Video'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="video_type">Video Type</Label>
                    <Select 
                      value={formData.video_type} 
                      onValueChange={(value: 'hero' | 'story' | 'intro') => 
                        setFormData({...formData, video_type: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hero">Hero Video</SelectItem>
                        <SelectItem value="story">Story Video</SelectItem>
                        <SelectItem value="intro">Intro Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="embed_url">Embed URL</Label>
                  <Input
                    id="embed_url"
                    value={formData.embed_url}
                    onChange={(e) => setFormData({...formData, embed_url: e.target.value})}
                    placeholder="https://www.youtube.com/embed/VIDEO_ID or https://player.vimeo.com/video/VIDEO_ID"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Optional description for the video"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                    {loading ? 'Saving...' : editingVideo ? 'Update' : 'Add'} Video
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading && videos.length === 0 ? (
          <div className="text-center py-8">Loading videos...</div>
        ) : (
          <div className="hidden lg:block overflow-hidden rounded-md border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f8fafc]">
                  <TableHead className="text-[#032E63] font-bold">Title</TableHead>
                  <TableHead className="text-[#032E63] font-bold">Type</TableHead>
                  <TableHead className="text-[#032E63] font-bold">Status</TableHead>
                  <TableHead className="text-[#032E63] font-bold">Order</TableHead>
                  <TableHead className="text-[#032E63] font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell className="font-medium text-[#032E63]">{video.title}</TableCell>
                    <TableCell>
                      <Badge className={getVideoTypeColor(video.video_type)}>
                        {video.video_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={video.is_active}
                        onCheckedChange={() => handleToggleActive(video.id, video.is_active)}
                      />
                    </TableCell>
                    <TableCell>{video.display_order}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(video.embed_url, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(video)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(video.id)}
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
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {videos.map((video) => (
              <Card key={video.id} className="p-4 border-l-4 border-l-[#032E63] shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-[#032E63] pr-2">{video.title}</h3>
                  <Badge className={`shrink-0 ${getVideoTypeColor(video.video_type)}`}>
                    {video.video_type}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                  <span className="text-sm font-medium text-gray-600">Active Status</span>
                  <Switch
                    checked={video.is_active}
                    onCheckedChange={() => handleToggleActive(video.id, video.is_active)}
                  />
                </div>

                <div className="flex justify-between items-center mt-1 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Order: {video.display_order}</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => window.open(video.embed_url, '_blank')}>
                      <Eye className="h-4 w-4 text-[#032E63]" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => openEditDialog(video)}>
                      <Edit className="h-4 w-4 text-[#032E63]" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700 border-red-200" onClick={() => handleDelete(video.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {videos.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No videos added yet. Click "Add Video" to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
};