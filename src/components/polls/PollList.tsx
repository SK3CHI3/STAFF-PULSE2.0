import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Poll } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart3,
  MessageSquare,
  Star,
  Users,
  Clock,
  Eye,
  MoreVertical,
  Plus,
  Filter,
  Brain
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PollWithStats extends Poll {
  response_count?: number;
  response_rate?: number;
}

interface PollListProps {
  onCreatePoll?: () => void;
  onViewResults?: (poll: Poll) => void;
  onEditPoll?: (poll: Poll) => void;
  onViewReport?: (poll: Poll) => void;
}

export const PollList: React.FC<PollListProps> = ({
  onCreatePoll,
  onViewResults,
  onEditPoll,
  onViewReport
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [polls, setPolls] = useState<PollWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchPolls();
    }
  }, [profile?.organization_id, filter]);

  const fetchPolls = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);

      let query = supabase
        .from('polls')
        .select(`
          *,
          poll_responses(count)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter === 'active') {
        query = query.eq('is_active', true);
      } else if (filter === 'expired') {
        query = query.or('is_active.eq.false,expires_at.lt.' + new Date().toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get total employee count for response rate calculation
      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id);

      // Process polls with statistics
      const pollsWithStats = data?.map(poll => ({
        ...poll,
        response_count: poll.poll_responses?.[0]?.count || 0,
        response_rate: totalEmployees ? ((poll.poll_responses?.[0]?.count || 0) / totalEmployees) * 100 : 0
      })) || [];

      setPolls(pollsWithStats);

    } catch (error) {
      console.error('Error fetching polls:', error);
      toast({
        title: "Error",
        description: "Failed to load polls",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPollTypeIcon = (type: string) => {
    switch (type) {
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

  const getPollTypeLabel = (type: string) => {
    switch (type) {
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

  const getStatusBadge = (poll: Poll) => {
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

  const handleToggleActive = async (poll: Poll) => {
    try {
      const { error } = await supabase
        .from('polls')
        .update({ is_active: !poll.is_active })
        .eq('id', poll.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Poll ${poll.is_active ? 'deactivated' : 'activated'} successfully`,
      });

      fetchPolls(); // Refresh the list

    } catch (error) {
      console.error('Error updating poll:', error);
      toast({
        title: "Error",
        description: "Failed to update poll status",
        variant: "destructive"
      });
    }
  };

  const handleDeletePoll = async (poll: Poll) => {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', poll.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Poll deleted successfully",
      });

      fetchPolls(); // Refresh the list

    } catch (error) {
      console.error('Error deleting poll:', error);
      toast({
        title: "Error",
        description: "Failed to delete poll",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading polls...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Polls & Surveys</h2>
          <p className="text-muted-foreground">
            Create and manage employee polls to boost engagement
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Polls</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          
          {onCreatePoll && (
            <Button onClick={onCreatePoll}>
              <Plus className="w-4 h-4 mr-2" />
              Create Poll
            </Button>
          )}
        </div>
      </div>

      {/* Polls Grid */}
      {polls.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No polls yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first poll to start engaging with your team
            </p>
            {onCreatePoll && (
              <Button onClick={onCreatePoll}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Poll
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll) => (
            <Card key={poll.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getPollTypeIcon(poll.poll_type)}
                    <Badge variant="outline" className="text-xs">
                      {getPollTypeLabel(poll.poll_type)}
                    </Badge>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onViewResults && (
                        <DropdownMenuItem onClick={() => onViewResults(poll)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Results
                        </DropdownMenuItem>
                      )}
                      {onViewReport && (
                        <DropdownMenuItem onClick={() => onViewReport(poll)}>
                          <Brain className="w-4 h-4 mr-2" />
                          AI Report
                        </DropdownMenuItem>
                      )}
                      {onEditPoll && (
                        <DropdownMenuItem onClick={() => onEditPoll(poll)}>
                          Edit Poll
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleToggleActive(poll)}>
                        {poll.is_active ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeletePoll(poll)}
                        className="text-red-600"
                      >
                        Delete Poll
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <CardTitle className="text-lg line-clamp-2">{poll.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {poll.question}
                  </CardDescription>
                </div>

                <div className="flex items-center space-x-2">
                  {getStatusBadge(poll)}
                  {poll.is_anonymous && (
                    <Badge variant="outline" className="text-xs">Anonymous</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{poll.response_count || 0} responses</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                      <span>{poll.response_rate?.toFixed(1)}% rate</span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>Created {formatDistanceToNow(new Date(poll.created_at))} ago</span>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    {onViewResults && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onViewResults(poll)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Results
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
