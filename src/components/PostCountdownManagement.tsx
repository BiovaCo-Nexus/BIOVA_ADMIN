import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, Eye, Plus, Trash2, Clock } from 'lucide-react';

interface CountdownSetting {
  id: string;
  title: string;
  target_date: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

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
  selected_countdown_id?: string;
}

const PostCountdownManagement = () => {
  const [content, setContent] = useState<PostCountdownContent | null>(null);
  const [countdowns, setCountdowns] = useState<CountdownSetting[]>([]);
  const [selectedCountdownId, setSelectedCountdownId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<PostCountdownContent>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        { data: contentData, error: contentError },
        { data: countdownsData, error: countdownsError }
      ] = await Promise.all([
        supabase.from('post_countdown_content').select('*').single(),
        supabase.from('countdown_settings').select('*').order('created_at', { ascending: false })
      ]);

      if (contentError && contentError.code !== 'PGRST116') throw contentError;
      if (countdownsError) throw countdownsError;

      if (contentData) {
        setContent(contentData);
        setFormData(contentData);
        setSelectedCountdownId(contentData.selected_countdown_id || '');
      }

      setCountdowns(countdownsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        selected_countdown_id: selectedCountdownId
      };

      const { id, ...rest } = dataToSave;
      let error;
      
      if (content && content.id) {
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

      fetchData();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

      {/* Countdown Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Select Active Countdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label htmlFor="countdown-select">Choose which countdown to display on the post countdown page:</Label>
            <Select value={selectedCountdownId} onValueChange={setSelectedCountdownId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a countdown..." />
              </SelectTrigger>
              <SelectContent>
                {countdowns.map((countdown) => (
                  <SelectItem key={countdown.id} value={countdown.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{countdown.title}</span>
                      <span className="text-sm text-muted-foreground">
                        Target: {formatDate(countdown.target_date)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCountdownId && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">
                  Selected countdown will be displayed on the post countdown page
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input name="title" value={formData.title || ''} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input name="subtitle" value={formData.subtitle || ''} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="hero_video_url">Hero Video URL</Label>
            <Input name="hero_video_url" value={formData.hero_video_url || ''} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="hero_video_description">Hero Video Description</Label>
            <Input name="hero_video_description" value={formData.hero_video_description || ''} onChange={handleInputChange} />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Hero CTA Buttons</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="cta1_text">CTA 1 Text</Label>
            <Input name="cta1_text" value={formData.cta1_text || ''} onChange={handleInputChange} />
            <Label htmlFor="cta1_link" className="mt-2 block">CTA 1 Link</Label>
            <Input name="cta1_link" value={formData.cta1_link || ''} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="cta2_text">CTA 2 Text</Label>
            <Input name="cta2_text" value={formData.cta2_text || ''} onChange={handleInputChange} />
            <Label htmlFor="cta2_link" className="mt-2 block">CTA 2 Link</Label>
            <Input name="cta2_link" value={formData.cta2_link || ''} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="cta3_text">CTA 3 Text</Label>
            <Input name="cta3_text" value={formData.cta3_text || ''} onChange={handleInputChange} />
            <Label htmlFor="cta3_link" className="mt-2 block">CTA 3 Link</Label>
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
            <Label htmlFor="roadmap_title">Roadmap Title</Label>
            <Input name="roadmap_title" value={formData.roadmap_title || ''} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="roadmap_subtitle">Roadmap Subtitle</Label>
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
            <Label htmlFor="video_story_title">Video Story Title</Label>
            <Input name="video_story_title" value={formData.video_story_title || ''} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="video_story_subtitle">Video Story Subtitle</Label>
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
            <Label htmlFor="join_movement_title">Join Movement Title</Label>
            <Input name="join_movement_title" value={formData.join_movement_title || ''} onChange={handleInputChange} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="join_movement_cta1_text">CTA 1 Text</Label>
              <Input name="join_movement_cta1_text" value={formData.join_movement_cta1_text || ''} onChange={handleInputChange} />
              <Label htmlFor="join_movement_cta1_link" className="mt-2 block">CTA 1 Link</Label>
              <Input name="join_movement_cta1_link" value={formData.join_movement_cta1_link || ''} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="join_movement_cta2_text">CTA 2 Text</Label>
              <Input name="join_movement_cta2_text" value={formData.join_movement_cta2_text || ''} onChange={handleInputChange} />
              <Label htmlFor="join_movement_cta2_link" className="mt-2 block">CTA 2 Link</Label>
              <Input name="join_movement_cta2_link" value={formData.join_movement_cta2_link || ''} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="join_movement_cta3_text">CTA 3 Text</Label>
              <Input name="join_movement_cta3_text" value={formData.join_movement_cta3_text || ''} onChange={handleInputChange} />
              <Label htmlFor="join_movement_cta3_link" className="mt-2 block">CTA 3 Link</Label>
              <Input name="join_movement_cta3_link" value={formData.join_movement_cta3_link || ''} onChange={handleInputChange} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostCountdownManagement;