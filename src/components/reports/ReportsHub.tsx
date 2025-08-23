import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  BarChart3,
  Megaphone,
  TrendingUp,
  Users,
  Activity,
  Calendar,
  Download
} from 'lucide-react';

interface ReportsHubProps {
  // Check-in reports data
  checkInResponses: any[];
  selectedMoodFilter: string;
  setSelectedMoodFilter: (filter: string) => void;
  selectedDepartment: string;
  setSelectedDepartment: (dept: string) => void;
  departments: string[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  
  // Poll reports data (we'll add this)
  polls: any[];
  
  // Announcement analytics data (we'll add this)
  announcements: any[];
}

export const ReportsHub: React.FC<ReportsHubProps> = ({
  checkInResponses,
  selectedMoodFilter,
  setSelectedMoodFilter,
  selectedDepartment,
  setSelectedDepartment,
  departments,
  currentPage,
  setCurrentPage,
  polls,
  announcements
}) => {
  const [activeTab, setActiveTab] = useState('checkins');

  // Calculate stats for each report type
  const checkInStats = {
    total: checkInResponses.length,
    positive: checkInResponses.filter(r => r.mood >= 7).length,
    neutral: checkInResponses.filter(r => r.mood >= 5 && r.mood < 7).length,
    attention: checkInResponses.filter(r => r.mood < 5).length
  };

  const pollStats = {
    total: polls.length,
    active: polls.filter(p => p.is_active).length,
    responses: polls.reduce((sum, p) => sum + (p.response_count || 0), 0)
  };

  const announcementStats = {
    total: announcements.length,
    published: announcements.filter(a => a.is_published).length,
    reads: announcements.reduce((sum, a) => sum + (a.read_count || 0), 0)
  };

  const renderCheckInReports = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card
          className={`bg-gradient-card border-0 shadow-soft cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
            selectedMoodFilter === "all" ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""
          }`}
          onClick={() => {
            setSelectedMoodFilter("all");
            setCurrentPage(1);
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Responses</p>
                <p className="text-xl font-bold">{checkInStats.total}</p>
              </div>
            </div>
            {selectedMoodFilter === "all" && (
              <div className="mt-2">
                <Badge variant="default" className="text-xs">Active Filter</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-card border-0 shadow-soft cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
            selectedMoodFilter === "positive" ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20" : ""
          }`}
          onClick={() => {
            setSelectedMoodFilter("positive");
            setCurrentPage(1);
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Positive (7-10)</p>
                <p className="text-xl font-bold">{checkInStats.positive}</p>
              </div>
            </div>
            {selectedMoodFilter === "positive" && (
              <div className="mt-2">
                <Badge variant="default" className="text-xs bg-green-100 text-green-700">Active Filter</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-card border-0 shadow-soft cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
            selectedMoodFilter === "neutral" ? "ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20" : ""
          }`}
          onClick={() => {
            setSelectedMoodFilter("neutral");
            setCurrentPage(1);
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Neutral (5-6)</p>
                <p className="text-xl font-bold">{checkInStats.neutral}</p>
              </div>
            </div>
            {selectedMoodFilter === "neutral" && (
              <div className="mt-2">
                <Badge variant="default" className="text-xs bg-orange-100 text-orange-700">Active Filter</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-card border-0 shadow-soft cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
            selectedMoodFilter === "attention" ? "ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20" : ""
          }`}
          onClick={() => {
            setSelectedMoodFilter("attention");
            setCurrentPage(1);
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Need Attention (1-4)</p>
                <p className="text-xl font-bold">{checkInStats.attention}</p>
              </div>
            </div>
            {selectedMoodFilter === "attention" && (
              <div className="mt-2">
                <Badge variant="destructive" className="text-xs">Active Filter</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Department Filter */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Filter by Department</h3>
              <p className="text-sm text-muted-foreground">
                {selectedDepartment === "all"
                  ? `Showing all departments (${checkInResponses.filter(r => {
                      if (selectedMoodFilter === "all") return true;
                      if (selectedMoodFilter === "positive") return r.mood >= 7;
                      if (selectedMoodFilter === "neutral") return r.mood >= 5 && r.mood < 7;
                      if (selectedMoodFilter === "attention") return r.mood < 5;
                      return true;
                    }).length} responses)`
                  : `Showing ${selectedDepartment} department (${checkInResponses.filter(r => {
                      const deptMatch = (r.employees?.department || r.department) === selectedDepartment;
                      if (selectedMoodFilter === "all") return deptMatch;
                      if (selectedMoodFilter === "positive") return deptMatch && r.mood >= 7;
                      if (selectedMoodFilter === "neutral") return deptMatch && r.mood >= 5 && r.mood < 7;
                      if (selectedMoodFilter === "attention") return deptMatch && r.mood < 5;
                      return deptMatch;
                    }).length} responses)`
                }
              </p>
            </div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm min-w-[200px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Employee Responses */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Employee Responses</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                Page {currentPage} of {Math.ceil(checkInResponses.filter(r => {
                  const deptMatch = selectedDepartment === "all" || (r.employees?.department || r.department) === selectedDepartment;
                  if (selectedMoodFilter === "all") return deptMatch;
                  if (selectedMoodFilter === "positive") return deptMatch && r.mood >= 7;
                  if (selectedMoodFilter === "neutral") return deptMatch && r.mood >= 5 && r.mood < 7;
                  if (selectedMoodFilter === "attention") return deptMatch && r.mood < 5;
                  return deptMatch;
                }).length / 10)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {checkInResponses.filter(r => {
                  const deptMatch = selectedDepartment === "all" || (r.employees?.department || r.department) === selectedDepartment;
                  if (selectedMoodFilter === "all") return deptMatch;
                  if (selectedMoodFilter === "positive") return deptMatch && r.mood >= 7;
                  if (selectedMoodFilter === "neutral") return deptMatch && r.mood >= 5 && r.mood < 7;
                  if (selectedMoodFilter === "attention") return deptMatch && r.mood < 5;
                  return deptMatch;
                }).length} total responses
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const filteredResponses = checkInResponses.filter(r => {
              const deptMatch = selectedDepartment === "all" || (r.employees?.department || r.department) === selectedDepartment;
              if (selectedMoodFilter === "all") return deptMatch;
              if (selectedMoodFilter === "positive") return deptMatch && r.mood >= 7;
              if (selectedMoodFilter === "neutral") return deptMatch && r.mood >= 5 && r.mood < 7;
              if (selectedMoodFilter === "attention") return deptMatch && r.mood < 5;
              return deptMatch;
            });

            const startIndex = (currentPage - 1) * 10;
            const paginatedResponses = filteredResponses.slice(startIndex, startIndex + 10);

            return paginatedResponses.length > 0 ? (
              <div className="space-y-4">
                {paginatedResponses.map((response) => (
                  <div
                    key={response.id}
                    className="p-4 border border-border/50 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge
                            variant={
                              response.mood >= 7
                                ? "default"
                                : response.mood >= 5
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            Mood: {response.mood}/10
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {response.employees?.department || response.department || "Unknown Department"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(response.submitted_at || response.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>{response.employees?.name || response.employee_name || "Anonymous"}:</strong>
                        </p>
                        <p className="text-sm leading-relaxed">{response.feedback || response.comment || "No feedback provided"}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-border/50">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(startIndex + 10, filteredResponses.length)} of {filteredResponses.length} responses
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(Math.ceil(filteredResponses.length / 10), currentPage + 1))}
                      disabled={currentPage === Math.ceil(filteredResponses.length / 10)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No responses found for the selected filters.</p>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );

  const renderPollReports = () => (
    <div className="space-y-6">
      {/* Poll Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Polls</p>
                <p className="text-xl font-bold">{pollStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Polls</p>
                <p className="text-xl font-bold">{pollStats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Responses</p>
                <p className="text-xl font-bold">{pollStats.responses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Poll Reports List */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Poll Reports</span>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Poll reports and analytics will be displayed here</p>
            <p className="text-sm mt-2">Each poll will show response rates, AI insights, and detailed analysis</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnnouncementAnalytics = () => (
    <div className="space-y-6">
      {/* Announcement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Megaphone className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Announcements</p>
                <p className="text-xl font-bold">{announcementStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-xl font-bold">{announcementStats.published}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reads</p>
                <p className="text-xl font-bold">{announcementStats.reads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcement Analytics */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Announcement Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Announcement analytics and delivery metrics will be displayed here</p>
            <p className="text-sm mt-2">Track read rates, engagement, and delivery success</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEngagementOverview = () => (
    <div className="space-y-6">
      {/* Combined Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-ins</p>
                <p className="text-xl font-bold">{checkInStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Poll Responses</p>
                <p className="text-xl font-bold">{pollStats.responses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Megaphone className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Announcements</p>
                <p className="text-xl font-bold">{announcementStats.published}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Engagement Rate</p>
                <p className="text-xl font-bold">
                  {((checkInStats.total + pollStats.responses) / Math.max(checkInStats.total + pollStats.total, 1) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Combined Engagement Dashboard */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Overall Engagement Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Combined engagement metrics and trends will be displayed here</p>
            <p className="text-sm mt-2">Holistic view of employee engagement across all channels</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-background to-background/95 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-border/50 shadow-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Reports Hub
            </h2>
            <p className="text-sm text-muted-foreground">Comprehensive employee engagement reporting</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="checkins" className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>Check-ins</span>
          </TabsTrigger>
          <TabsTrigger value="polls" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Polls</span>
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center space-x-2">
            <Megaphone className="w-4 h-4" />
            <span>Announcements</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkins" className="mt-6">
          {renderCheckInReports()}
        </TabsContent>

        <TabsContent value="polls" className="mt-6">
          {renderPollReports()}
        </TabsContent>

        <TabsContent value="announcements" className="mt-6">
          {renderAnnouncementAnalytics()}
        </TabsContent>

        <TabsContent value="overview" className="mt-6">
          {renderEngagementOverview()}
        </TabsContent>
      </Tabs>
    </div>
  );
};
