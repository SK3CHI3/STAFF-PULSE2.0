import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Megaphone, 
  AlertTriangle, 
  PartyPopper, 
  FileText, 
  Calendar,
  Users,
  MessageSquare
} from 'lucide-react';

interface AnnouncementCreatorProps {
  onAnnouncementCreated?: (announcement: any) => void;
  onCancel?: () => void;
}

export const AnnouncementCreator: React.FC<AnnouncementCreatorProps> = ({ 
  onAnnouncementCreated, 
  onCancel 
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    // Simplified - no type, priority, duration needed
    announcement_type: 'general', // Default, not user-selectable
    priority: 'normal', // Default, not user-selectable
    target_type: 'all', // Always send to all employees
    send_via_whatsapp: true, // Always send via WhatsApp
    is_published: true // Always publish immediately
  });

  const announcementTypes = [
    { 
      value: 'general', 
      label: 'General', 
      icon: Megaphone, 
      description: 'General company announcements',
      color: 'text-blue-500'
    },
    { 
      value: 'urgent', 
      label: 'Urgent', 
      icon: AlertTriangle, 
      description: 'Important urgent messages',
      color: 'text-red-500'
    },
    { 
      value: 'celebration', 
      label: 'Celebration', 
      icon: PartyPopper, 
      description: 'Achievements and celebrations',
      color: 'text-green-500'
    },
    { 
      value: 'policy', 
      label: 'Policy', 
      icon: FileText, 
      description: 'Policy updates and changes',
      color: 'text-purple-500'
    },
    { 
      value: 'event', 
      label: 'Event', 
      icon: Calendar, 
      description: 'Company events and meetings',
      color: 'text-orange-500'
    }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'text-gray-500' },
    { value: 'normal', label: 'Normal', color: 'text-blue-500' },
    { value: 'high', label: 'High', color: 'text-orange-500' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-500' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.organization_id) {
      toast({
        title: "Error",
        description: "Organization not found",
        variant: "destructive"
      });
      return;
    }

    // Validation
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const announcementData = {
        organization_id: profile.organization_id,
        title: formData.title.trim(),
        content: formData.content.trim(),
        announcement_type: formData.announcement_type,
        priority: formData.priority,
        target_type: formData.target_type,
        target_departments: formData.target_type === 'department' ? formData.target_departments : null,
        send_via_whatsapp: formData.send_via_whatsapp,
        is_published: formData.is_published,
        published_at: formData.is_published ? new Date().toISOString() : null,
        expires_at: formData.expires_at || null,
        created_by: profile.user_id
      };

      const { data, error } = await supabase
        .from('announcements')
        .insert(announcementData)
        .select()
        .single();

      if (error) throw error;

      // Send announcement via WhatsApp immediately using Supabase Edge Function
      try {
        const sendResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-announcements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            announcement_id: data.id,
            organization_id: profile.organization_id
          })
        });

        if (sendResponse.ok) {
          const sendData = await sendResponse.json();
          toast({
            title: "Announcement Sent Successfully!",
            description: `Announcement sent to ${sendData.details.totalSent} employees via WhatsApp`,
          });
        } else {
          // Announcement created but sending failed
          toast({
            title: "Announcement Created",
            description: "Announcement created but failed to send via WhatsApp. You can send it manually from the announcements list.",
            variant: "destructive"
          });
        }
      } catch (sendError) {
        console.error('Error sending announcement:', sendError);
        toast({
          title: "Announcement Created",
          description: "Announcement created but failed to send via WhatsApp. You can send it manually from the announcements list.",
          variant: "destructive"
        });
      }

      onAnnouncementCreated?.(data);
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        announcement_type: 'general',
        priority: 'normal',
        target_type: 'all',
        send_via_whatsapp: true,
        is_published: true
      });

    } catch (error) {
      console.error('Error creating announcement:', error);
      toast({
        title: "Error",
        description: "Failed to create announcement. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedType = announcementTypes.find(type => type.value === formData.announcement_type);
  const selectedPriority = priorityLevels.find(priority => priority.value === formData.priority);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Megaphone className="w-5 h-5 text-blue-500" />
          <span>Create Announcement</span>
        </CardTitle>
        <CardDescription>
          Share important updates and news with your team
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., New Office Hours Policy, Team Building Event, Holiday Schedule Update"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="e.g., Starting Monday, our office hours will be 8:00 AM to 5:00 PM. Please plan your schedules accordingly. Contact HR if you have any questions."
                rows={6}
                required
              />
            </div>
          </div>

          {/* Simple and Clean - Just Title and Content */}
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              📢 Your announcement will be sent to all employees via WhatsApp immediately
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Sending Announcement...' : 'Send Announcement to All Employees'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
