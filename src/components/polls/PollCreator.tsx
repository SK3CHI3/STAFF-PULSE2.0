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
import { Plus, X, MessageSquare, BarChart3, ThumbsUp, Type } from 'lucide-react';

interface PollOption {
  id: string;
  text: string;
}

interface PollCreatorProps {
  onPollCreated?: (poll: any) => void;
  onCancel?: () => void;
}

export const PollCreator: React.FC<PollCreatorProps> = ({ onPollCreated, onCancel }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    question: '',
    // Simplified - AI will determine the best poll type based on the question
    poll_type: 'open_text', // Default to open text for AI analysis
    is_anonymous: true, // Always anonymous
    target_type: 'all', // Always send to all employees
    send_via_whatsapp: true // Always send via WhatsApp
  });
  
  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' }
  ]);

  const pollTypes = [
    { value: 'multiple_choice', label: 'Multiple Choice', icon: BarChart3, description: 'e.g., Lunch vendor options, Meeting time preferences' },
    { value: 'yes_no', label: 'Yes/No', icon: ThumbsUp, description: 'e.g., Should we implement flexible hours?' },
    { value: 'rating', label: 'Rating Scale', icon: BarChart3, description: 'e.g., Rate our office facilities (1-10)' },
    { value: 'open_text', label: 'Open Text', icon: Type, description: 'e.g., Suggestions for team building activities' }
  ];

  const addOption = () => {
    const newId = (options.length + 1).toString();
    setOptions([...options, { id: newId, text: '' }]);
  };

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(opt => opt.id !== id));
    }
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, text } : opt));
  };

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
    if (!formData.title.trim() || !formData.question.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and question are required",
        variant: "destructive"
      });
      return;
    }

    if (formData.poll_type === 'multiple_choice' && options.filter(opt => opt.text.trim()).length < 2) {
      toast({
        title: "Validation Error",
        description: "Multiple choice polls need at least 2 options",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const pollData = {
        organization_id: profile.organization_id,
        title: formData.title.trim(),
        description: null, // No description field in simplified form
        question: formData.question.trim(),
        poll_type: formData.poll_type,
        options: null, // Always null for open text polls
        rating_scale: null, // Not used in simplified form
        is_anonymous: formData.is_anonymous,
        expires_at: null, // No expiry in simplified form
        target_type: formData.target_type,
        target_departments: null, // Always send to all employees
        send_via_whatsapp: formData.send_via_whatsapp,
        created_by: profile.user_id,
        is_active: true
      };

      const { data, error } = await supabase
        .from('polls')
        .insert(pollData)
        .select()
        .single();

      if (error) throw error;

      // Send poll via WhatsApp immediately using Supabase Edge Function
      try {
        const sendResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-polls`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            poll_id: data.id,
            organization_id: profile.organization_id
          })
        });

        if (sendResponse.ok) {
          const sendData = await sendResponse.json();
          toast({
            title: "Poll Sent Successfully!",
            description: `Poll sent to ${sendData.totalSent} employees via WhatsApp`,
          });
        } else {
          // Poll created but sending failed
          toast({
            title: "Poll Created",
            description: "Poll created but failed to send via WhatsApp. You can send it manually from the polls list.",
            variant: "destructive"
          });
        }
      } catch (sendError) {
        console.error('Error sending poll:', sendError);
        toast({
          title: "Poll Created",
          description: "Poll created but failed to send via WhatsApp. You can send it manually from the polls list.",
          variant: "destructive"
        });
      }

      onPollCreated?.(data);
      
      // Reset form
      setFormData({
        title: '',
        question: '',
        poll_type: 'open_text',
        is_anonymous: true,
        target_type: 'all',
        send_via_whatsapp: true
      });
      setOptions([{ id: '1', text: '' }, { id: '2', text: '' }]);

    } catch (error) {
      console.error('Error creating poll:', error);
      toast({
        title: "Error",
        description: "Failed to create poll. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          <span>Create New Poll</span>
        </CardTitle>
        <CardDescription>
          Create engaging polls and surveys to boost employee participation
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Simplified Poll Creation */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Poll Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Employee Satisfaction Survey, Office Lunch Preferences, Work From Home Policy"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="question">Your Question *</Label>
              <Textarea
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="e.g., How satisfied are you with our current office facilities and what improvements would you suggest? Please share your honest feedback about your work environment, team collaboration, and any challenges you're facing."
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                💡 Ask open-ended questions for better AI insights. Our AI will analyze all responses and generate detailed reports.
              </p>
            </div>
          </div>

          {/* AI-Powered Notice */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">AI-Powered Analysis</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  🤖 Your poll will be sent to all employees via WhatsApp<br/>
                  📊 AI will analyze all responses and generate insights<br/>
                  📈 View detailed reports with sentiment analysis and recommendations
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Sending Poll...' : 'Send Poll to All Employees'}
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
