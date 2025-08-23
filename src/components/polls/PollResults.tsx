import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Poll, PollResponse } from '@/lib/supabase';
import { BarChart3, Users, Clock, Eye, MessageSquare, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PollResultsProps {
  poll: Poll;
  onClose?: () => void;
}

interface PollStats {
  totalResponses: number;
  responseRate: number;
  averageRating?: number;
  responses: PollResponse[];
  optionCounts: Record<string, number>;
}

export const PollResults: React.FC<PollResultsProps> = ({ poll, onClose }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PollStats | null>(null);
  const [totalEmployees, setTotalEmployees] = useState(0);

  useEffect(() => {
    fetchPollResults();
  }, [poll.id]);

  const fetchPollResults = async () => {
    try {
      setLoading(true);

      // Fetch poll responses
      const { data: responses, error: responsesError } = await supabase
        .from('poll_responses')
        .select('*')
        .eq('poll_id', poll.id);

      if (responsesError) throw responsesError;

      // Fetch total employees for response rate calculation
      const { count: employeeCount, error: employeeError } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', poll.organization_id);

      if (employeeError) throw employeeError;

      // Calculate statistics
      const totalResponses = responses?.length || 0;
      const responseRate = employeeCount ? (totalResponses / employeeCount) * 100 : 0;
      
      // Calculate option counts for multiple choice and yes/no polls
      const optionCounts: Record<string, number> = {};
      let averageRating: number | undefined;

      if (poll.poll_type === 'multiple_choice' || poll.poll_type === 'yes_no') {
        responses?.forEach(response => {
          const choice = response.response_choice;
          if (choice) {
            optionCounts[choice] = (optionCounts[choice] || 0) + 1;
          }
        });
      } else if (poll.poll_type === 'rating') {
        const ratings = responses?.map(r => r.response_rating).filter(r => r !== null) as number[];
        if (ratings.length > 0) {
          averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        }
      }

      setStats({
        totalResponses,
        responseRate,
        averageRating,
        responses: responses || [],
        optionCounts
      });
      setTotalEmployees(employeeCount || 0);

    } catch (error) {
      console.error('Error fetching poll results:', error);
      toast({
        title: "Error",
        description: "Failed to load poll results",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPollTypeIcon = () => {
    switch (poll.poll_type) {
      case 'multiple_choice':
        return <BarChart3 className="w-4 h-4" />;
      case 'yes_no':
        return <MessageSquare className="w-4 h-4" />;
      case 'rating':
        return <Star className="w-4 h-4" />;
      case 'open_text':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getPollTypeLabel = () => {
    switch (poll.poll_type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'yes_no':
        return 'Yes/No';
      case 'rating':
        return 'Rating Scale';
      case 'open_text':
        return 'Open Text';
      default:
        return 'Poll';
    }
  };

  const getStatusBadge = () => {
    const now = new Date();
    const expiresAt = poll.expires_at ? new Date(poll.expires_at) : null;
    
    if (!poll.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    } else if (expiresAt && now > expiresAt) {
      return <Badge variant="destructive">Expired</Badge>;
    } else {
      return <Badge variant="default">Active</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading poll results...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {getPollTypeIcon()}
              <CardTitle className="text-xl">{poll.title}</CardTitle>
              {getStatusBadge()}
            </div>
            <CardDescription className="text-base">
              {poll.question}
            </CardDescription>
            {poll.description && (
              <p className="text-sm text-muted-foreground">{poll.description}</p>
            )}
          </div>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>

        {/* Poll Metadata */}
        <div className="flex flex-wrap items-center gap-4 pt-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>Created {formatDistanceToNow(new Date(poll.created_at))} ago</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{stats?.totalResponses || 0} responses</span>
          </div>
          <div className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{getPollTypeLabel()}</span>
          </div>
          {poll.is_anonymous && (
            <Badge variant="outline" className="text-xs">Anonymous</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Response Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {stats?.totalResponses || 0}
              </div>
              <p className="text-sm text-muted-foreground">Total Responses</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {stats?.responseRate.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Response Rate</p>
            </CardContent>
          </Card>

          {poll.poll_type === 'rating' && stats?.averageRating && (
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.averageRating.toFixed(1)}/{poll.rating_scale}
                </div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Visualization */}
        {(poll.poll_type === 'multiple_choice' || poll.poll_type === 'yes_no') && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Response Distribution</h3>
            <div className="space-y-3">
              {(poll.options as string[])?.map((option, index) => {
                const count = stats?.optionCounts[option] || 0;
                const percentage = stats?.totalResponses ? (count / stats.totalResponses) * 100 : 0;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{option}</span>
                      <span className="text-sm text-muted-foreground">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {poll.poll_type === 'rating' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Rating Distribution</h3>
            <div className="space-y-2">
              {Array.from({ length: poll.rating_scale || 10 }, (_, i) => i + 1).map(rating => {
                const count = stats?.responses.filter(r => r.response_rating === rating).length || 0;
                const percentage = stats?.totalResponses ? (count / stats.totalResponses) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center space-x-3">
                    <span className="w-8 text-sm font-medium">{rating}</span>
                    <div className="flex-1">
                      <Progress value={percentage} className="h-2" />
                    </div>
                    <span className="w-16 text-sm text-muted-foreground text-right">
                      {count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {poll.poll_type === 'open_text' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Text Responses</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats?.responses.map((response, index) => (
                <Card key={response.id}>
                  <CardContent className="p-4">
                    <p className="text-sm">{response.response_text}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(response.submitted_at))} ago
                    </p>
                  </CardContent>
                </Card>
              ))}
              {stats?.responses.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No responses yet
                </p>
              )}
            </div>
          </div>
        )}

        {/* Poll Details */}
        <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Target Audience:</span>
            <span className="capitalize">{poll.target_type}</span>
          </div>
          {poll.expires_at && (
            <div className="flex justify-between">
              <span>Expires:</span>
              <span>{new Date(poll.expires_at).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>WhatsApp Notifications:</span>
            <span>{poll.send_via_whatsapp ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
