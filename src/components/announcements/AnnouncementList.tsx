import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Announcement } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Megaphone, 
  AlertTriangle, 
  PartyPopper, 
  FileText, 
  Calendar,
  Clock, 
  Eye, 
  MoreVertical,
  Plus,
  Filter,
  Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AnnouncementWithStats extends Announcement {
  read_count?: number;
  read_rate?: number;
}

interface AnnouncementListProps {
  onCreateAnnouncement?: () => void;
  onViewAnnouncement?: (announcement: Announcement) => void;
  onEditAnnouncement?: (announcement: Announcement) => void;
}

export const AnnouncementList: React.FC<AnnouncementListProps> = ({ 
  onCreateAnnouncement, 
  onViewAnnouncement, 
  onEditAnnouncement 
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [announcements, setAnnouncements] = useState<AnnouncementWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'expired'>('all');

  useEffect(() => {
    if (profile?.organization_id) {
      fetchAnnouncements();
    }
  }, [profile?.organization_id, filter]);

  const fetchAnnouncements = async () => {
    if (!profile?.organization_id) return;

    try {
      setLoading(true);

      let query = supabase
        .from('announcements')
        .select(`
          *,
          announcement_reads(count)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter === 'published') {
        query = query.eq('is_published', true);
      } else if (filter === 'draft') {
        query = query.eq('is_published', false);
      } else if (filter === 'expired') {
        query = query.lt('expires_at', new Date().toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get total employee count for read rate calculation
      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id);

      // Process announcements with statistics
      const announcementsWithStats = data?.map(announcement => ({
        ...announcement,
        read_count: announcement.announcement_reads?.[0]?.count || 0,
        read_rate: totalEmployees ? ((announcement.announcement_reads?.[0]?.count || 0) / totalEmployees) * 100 : 0
      })) || [];

      setAnnouncements(announcementsWithStats);

    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({
        title: "Error",
        description: "Failed to load announcements",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'general':
        return <Megaphone className="w-4 h-4 text-blue-500" />;
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'celebration':
        return <PartyPopper className="w-4 h-4 text-green-500" />;
      case 'policy':
        return <FileText className="w-4 h-4 text-purple-500" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-orange-500" />;
      default:
        return <Megaphone className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge variant="default" className="bg-orange-500">High</Badge>;
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const getStatusBadge = (announcement: Announcement) => {
    const now = new Date();
    const expiresAt = announcement.expires_at ? new Date(announcement.expires_at) : null;
    
    if (!announcement.is_published) {
      return <Badge variant="outline">Draft</Badge>;
    } else if (expiresAt && now > expiresAt) {
      return <Badge variant="destructive">Expired</Badge>;
    } else {
      return <Badge variant="default">Published</Badge>;
    }
  };

  const handleTogglePublished = async (announcement: Announcement) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ 
          is_published: !announcement.is_published,
          published_at: !announcement.is_published ? new Date().toISOString() : null
        })
        .eq('id', announcement.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Announcement ${announcement.is_published ? 'unpublished' : 'published'} successfully`,
      });

      fetchAnnouncements(); // Refresh the list

    } catch (error) {
      console.error('Error updating announcement:', error);
      toast({
        title: "Error",
        description: "Failed to update announcement status",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAnnouncement = async (announcement: Announcement) => {
    if (!confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcement.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      });

      fetchAnnouncements(); // Refresh the list

    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: "Error",
        description: "Failed to delete announcement",
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
            <span className="ml-2">Loading announcements...</span>
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
          <h2 className="text-2xl font-bold">Announcements</h2>
          <p className="text-muted-foreground">
            Share important updates and news with your team
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Announcements</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          
          {onCreateAnnouncement && (
            <Button onClick={onCreateAnnouncement}>
              <Plus className="w-4 h-4 mr-2" />
              Create Announcement
            </Button>
          )}
        </div>
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No announcements yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first announcement to share updates with your team
            </p>
            {onCreateAnnouncement && (
              <Button onClick={onCreateAnnouncement}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Announcement
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getAnnouncementIcon(announcement.announcement_type)}
                    <div className="space-y-1">
                      <CardTitle className="text-lg line-clamp-1">{announcement.title}</CardTitle>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(announcement)}
                        {getPriorityBadge(announcement.priority)}
                        <Badge variant="outline" className="text-xs capitalize">
                          {announcement.announcement_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onViewAnnouncement && (
                        <DropdownMenuItem onClick={() => onViewAnnouncement(announcement)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      )}
                      {onEditAnnouncement && (
                        <DropdownMenuItem onClick={() => onEditAnnouncement(announcement)}>
                          Edit Announcement
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleTogglePublished(announcement)}>
                        {announcement.is_published ? 'Unpublish' : 'Publish'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteAnnouncement(announcement)}
                        className="text-red-600"
                      >
                        Delete Announcement
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Content Preview */}
                  <CardDescription className="line-clamp-2">
                    {announcement.content}
                  </CardDescription>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{announcement.read_count || 0} reads</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <span>{announcement.read_rate?.toFixed(1)}% rate</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDistanceToNow(new Date(announcement.created_at))} ago</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="capitalize">{announcement.target_type}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    {onViewAnnouncement && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onViewAnnouncement(announcement)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    )}
                    
                    {!announcement.is_published && (
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => handleTogglePublished(announcement)}
                      >
                        Publish Now
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
