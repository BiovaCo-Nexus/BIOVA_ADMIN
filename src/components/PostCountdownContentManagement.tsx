import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Eye } from 'lucide-react';

interface PostCountdownContent {
 id: number;
 title: string;
 subtitle: string;
 hero_video_url: string;
 hero_video_description: string;
 cta1_text: string;
 cta1_link: string;
 cta2_text: string;
 cta2_link: string;
 cta3_text: string;
 cta3_link: string;
 roadmap_title: string;
 roadmap_subtitle: string;
 video_story_title: string;
 video_story_subtitle: string;
 join_movement_title: string;
 join_movement_cta1_text: string;
 join_movement_cta1_link: string;
 join_movement_cta2_text: string;
 join_movement_cta2_link: string;
 join_movement_cta3_text: string;
 join_movement_cta3_link: string;
}

const PostCountdownContentManagement = () => {
 const [content, setContent] = useState<PostCountdownContent | null>(null);
 const [loading, setLoading] = useState(false);
 const [saving, setSaving] = useState(false);
 const { toast } = useToast();

 const [formData, setFormData] = useState<Partial<PostCountdownContent>>({});

 useEffect(() => {
 fetchContent();
 }, []);

 const fetchContent = async () => {
 setLoading(true);
 try {
 const { data, error } = await supabase
 .from('post_countdown_content')
 .select('*')
 .maybeSingle();

 if (error) throw error;

 if (data) {
 setContent(data);
 setFormData(data);
 }
 } catch (error) {
 console.error('Error fetching post countdown content:', error);
 } finally {
 setLoading(false);
 }
 };

 const handleSave = async () => {
 setSaving(true);
 try {
 const { id, ...rest } = formData;
 let error;
 if (content) {
 ({ error } = await supabase
 .from('post_countdown_content')
 .update(rest)
 .eq('id', content.id));
 } else {
 ({ error } = await supabase
 .from('post_countdown_content')
 .insert(rest));
 }

 if (error) throw error;

 toast({
 title: "Success",
 description: "Content saved successfully",
 });

 fetchContent();
 } catch (error: any) {
 toast({
 title: "Error",
 description: error.message,
 variant: "destructive"
 });
 } finally {
 setSaving(false);
 }
 };
 
 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
 const { name, value } = e.target;
 setFormData(prev => ({ ...prev, [name]: value }));
 };

 if (loading) {
 return <div className="flex justify-center p-8">Loading...</div>;
 }

 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <h2 className="text-2xl font-bold">Post Countdown Page Management</h2>
 <div className="flex gap-2">
 <Button variant="outline" onClick={() => window.open('/', '_blank')}>
 <Eye className="h-4 w-4 mr-2" />
 Preview Page
 </Button>
 <Button onClick={handleSave} disabled={saving}>
 <Save className="h-4 w-4 mr-2" />
 {saving ? 'Saving...' : 'Save Changes'}
 </Button>
 </div>
 </div>

 <Card>
 <CardHeader>
 <CardTitle>Hero Section</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div>
 <label className="block text-sm font-medium mb-2">Title</label>
 <Input name="title" value={formData.title || ''} onChange={handleInputChange} />
 </div>
 <div>
 <label className="block text-sm font-medium mb-2">Subtitle</label>
 <Input name="subtitle" value={formData.subtitle || ''} onChange={handleInputChange} />
 </div>
 <div>
 <label className="block text-sm font-medium mb-2">Hero Video URL</label>
 <Input name="hero_video_url" value={formData.hero_video_url || ''} onChange={handleInputChange} />
 </div>
 <div>
 <label className="block text-sm font-medium mb-2">Hero Video Description</label>
 <Textarea name="hero_video_description" value={formData.hero_video_description || ''} onChange={handleInputChange} />
 </div>
 </CardContent>
 </Card>
 
 <Card>
 <CardHeader>
 <CardTitle>Hero CTA Buttons</CardTitle>
 </CardHeader>
 <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div>
 <label className="block text-sm font-medium mb-2">CTA 1 Text</label>
 <Input name="cta1_text" value={formData.cta1_text || ''} onChange={handleInputChange} />
 <label className="block text-sm font-medium mb-2 mt-2">CTA 1 Link</label>
 <Input name="cta1_link" value={formData.cta1_link || ''} onChange={handleInputChange} />
 </div>
 <div>
 <label className="block text-sm font-medium mb-2">CTA 2 Text</label>
 <Input name="cta2_text" value={formData.cta2_text || ''} onChange={handleInputChange} />
 <label className="block text-sm font-medium mb-2 mt-2">CTA 2 Link</label>
 <Input name="cta2_link" value={formData.cta2_link || ''} onChange={handleInputChange} />
 </div>
 <div>
 <label className="block text-sm font-medium mb-2">CTA 3 Text</label>
 <Input name="cta3_text" value={formData.cta3_text || ''} onChange={handleInputChange} />
 <label className="block text-sm font-medium mb-2 mt-2">CTA 3 Link</label>
 <Input name="cta3_link" value={formData.cta3_link || ''} onChange={handleInputChange} />
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader>
 <CardTitle>Roadmap Section</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div>
 <label className="block text-sm font-medium mb-2">Roadmap Title</label>
 <Input name="roadmap_title" value={formData.roadmap_title || ''} onChange={handleInputChange} />
 </div>
 <div>
 <label className="block text-sm font-medium mb-2">Roadmap Subtitle</label>
 <Input name="roadmap_subtitle" value={formData.roadmap_subtitle || ''} onChange={handleInputChange} />
 </div>
 </CardContent>
 </Card>
 
 <Card>
 <CardHeader>
 <CardTitle>Video Story Section</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div>
 <label className="block text-sm font-medium mb-2">Video Story Title</label>
 <Input name="video_story_title" value={formData.video_story_title || ''} onChange={handleInputChange} />
 </div>
 <div>
 <label className="block text-sm font-medium mb-2">Video Story Subtitle</label>
 <Input name="video_story_subtitle" value={formData.video_story_subtitle || ''} onChange={handleInputChange} />
 </div>
 </CardContent>
 </Card>
 
 <Card>
 <CardHeader>
 <CardTitle>Join the Movement Section</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div>
 <label className="block text-sm font-medium mb-2">Join Movement Title</label>
 <Input name="join_movement_title" value={formData.join_movement_title || ''} onChange={handleInputChange} />
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div>
 <label className="block text-sm font-medium mb-2">CTA 1 Text</label>
 <Input name="join_movement_cta1_text" value={formData.join_movement_cta1_text || ''} onChange={handleInputChange} />
 <label className="block text-sm font-medium mb-2 mt-2">CTA 1 Link</label>
 <Input name="join_movement_cta1_link" value={formData.join_movement_cta1_link || ''} onChange={handleInputChange} />
 </div>
 <div>
 <label className="block text-sm font-medium mb-2">CTA 2 Text</label>
 <Input name="join_movement_cta2_text" value={formData.join_movement_cta2_text || ''} onChange={handleInputChange} />
 <label className="block text-sm font-medium mb-2 mt-2">CTA 2 Link</label>
 <Input name="join_movement_cta2_link" value={formData.join_movement_cta2_link || ''} onChange={handleInputChange} />
 </div>
 <div>
 <label className="block text-sm font-medium mb-2">CTA 3 Text</label>
 <Input name="join_movement_cta3_text" value={formData.join_movement_cta3_text || ''} onChange={handleInputChange} />
 <label className="block text-sm font-medium mb-2 mt-2">CTA 3 Link</label>
 <Input name="join_movement_cta3_link" value={formData.join_movement_cta3_link || ''} onChange={handleInputChange} />
 </div>
 </div>
 </CardContent>
 </Card>

 </div>
 );
};

export default PostCountdownContentManagement;