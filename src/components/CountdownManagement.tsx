import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, Plus } from "lucide-react";

interface CountdownSetting {
  id: string;
  target_date: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export function CountdownManagement() {
  const [countdowns, setCountdowns] = useState<CountdownSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    target_date: "",
    title: "",
    description: "",
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCountdowns();
  }, []);

  const fetchCountdowns = async () => {
    try {
      const { data, error } = await supabase
        .from('countdown_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCountdowns(data || []);
    } catch (error) {
      console.error('Error fetching countdowns:', error);
      toast({
        title: "Error",
        description: "Failed to fetch countdown settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Convert target_date to UTC
      const targetDateUTC = new Date(formData.target_date).toISOString();

      const dataToSave = {
        ...formData,
        target_date: targetDateUTC
      };

      if (editingId) {
        const { error } = await supabase
          .from('countdown_settings')
          .update(dataToSave)
          .eq('id', editingId);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Countdown updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('countdown_settings')
          .insert([dataToSave]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Countdown created successfully"
        });
      }

      setFormData({
        target_date: "",
        title: "",
        description: "",
        is_active: true
      });
      setEditingId(null);
      fetchCountdowns();
    } catch (error) {
      console.error('Error saving countdown:', error);
      toast({
        title: "Error",
        description: "Failed to save countdown",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (countdown: CountdownSetting) => {
    setEditingId(countdown.id);
    setFormData({
      target_date: countdown.target_date.split('T')[0] + 'T' + countdown.target_date.split('T')[1].split('+')[0],
      title: countdown.title,
      description: countdown.description || "",
      is_active: countdown.is_active
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this countdown?')) return;

    try {
      const { error } = await supabase
        .from('countdown_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Countdown deleted successfully"
      });
      fetchCountdowns();
    } catch (error) {
      console.error('Error deleting countdown:', error);
      toast({
        title: "Error",
        description: "Failed to delete countdown",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading countdown settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingId ? 'Edit Countdown' : 'Add New Countdown'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Launch Countdown"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="target_date">Target Date & Time</Label>
              <Input
                id="target_date"
                type="datetime-local"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional description for the countdown"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button type="submit" className="w-full sm:w-auto bg-[#032E63] hover:bg-[#032E63]/90">
                {editingId ? 'Update Countdown' : 'Create Countdown'}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      target_date: "",
                      title: "",
                      description: "",
                      is_active: true
                    });
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Existing Countdowns</h3>
        {countdowns.map((countdown) => (
          <Card key={countdown.id}>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <h4 className="font-medium">{countdown.title}</h4>
                    {countdown.is_active && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Target: {new Date(countdown.target_date).toLocaleString()}
                  </p>
                  {countdown.description && (
                    <p className="text-sm text-gray-500">{countdown.description}</p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => handleEdit(countdown)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full sm:w-auto"
                    onClick={() => handleDelete(countdown.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
