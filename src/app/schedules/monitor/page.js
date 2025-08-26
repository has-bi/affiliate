"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/templates/PageLayout";
import {
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Users,
  MessageSquare,
  Calendar,
  TrendingUp,
  Pause,
  Play
} from "lucide-react";

const statusColors = {
  active: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800", 
  completed: "bg-blue-100 text-blue-800",
  failed: "bg-red-100 text-red-800",
  error: "bg-red-100 text-red-800"
};

const messageStatusColors = {
  sent: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  failed: "bg-red-100 text-red-800"
};

export default function ScheduleMonitorPage() {
  const [schedules, setSchedules] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    completed: 0,
    failed: 0
  });
  const [messageStats, setMessageStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    retryRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  useEffect(() => {
    fetchMonitoringData();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchMonitoringData, 10000); // Refresh every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchMonitoringData = async () => {
    try {
      const [schedulesResponse, statsResponse] = await Promise.all([
        fetch('/api/schedules/monitor'),
        fetch('/api/schedules/stats')
      ]);

      if (schedulesResponse.ok) {
        const schedulesData = await schedulesResponse.json();
        setSchedules(schedulesData);
        
        // Calculate schedule stats
        const scheduleStats = schedulesData.reduce((acc, schedule) => {
          acc.total++;
          acc[schedule.status] = (acc[schedule.status] || 0) + 1;
          return acc;
        }, { total: 0, active: 0, pending: 0, completed: 0, failed: 0, error: 0 });
        
        setStats(scheduleStats);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setMessageStats(statsData);
      }

    } catch (error) {
      console.error("Error fetching monitoring data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleAction = async (scheduleId, action) => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        fetchMonitoringData(); // Refresh data
      }
    } catch (error) {
      console.error(`Error ${action} schedule:`, error);
    }
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatNextRun = (nextRun) => {
    if (!nextRun) return "Not scheduled";
    
    const now = new Date();
    const next = new Date(nextRun);
    const diff = next - now;
    
    if (diff < 0) return "Overdue";
    if (diff < 60000) return "In < 1 minute";
    if (diff < 3600000) return `In ${Math.floor(diff / 60000)} minutes`;
    if (diff < 86400000) return `In ${Math.floor(diff / 3600000)} hours`;
    
    return next.toLocaleDateString();
  };

  return (
    <PageLayout 
      title="Schedule Monitor" 
      description="Real-time monitoring of scheduled message campaigns"
    >
      <div className="space-y-6">
        {/* Control Bar */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMonitoringData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Disable Auto-refresh
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Enable Auto-refresh
                </>
              )}
            </Button>
          </div>
          
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Schedules</p>
                  <p className="text-2xl font-semibold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-2xl font-semibold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-semibold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg mr-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Failed/Error</p>
                  <p className="text-2xl font-semibold">{(stats.failed || 0) + (stats.error || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Message Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{messageStats.total?.toLocaleString() || 0}</div>
                <div className="text-sm text-gray-500">Total Messages</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{messageStats.sent?.toLocaleString() || 0}</div>
                <div className="text-sm text-gray-500">Successfully Sent</div>
                <div className="text-xs text-gray-400">
                  {messageStats.total > 0 ? ((messageStats.sent / messageStats.total) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{messageStats.failed?.toLocaleString() || 0}</div>
                <div className="text-sm text-gray-500">Failed</div>
                <div className="text-xs text-gray-400">
                  {messageStats.total > 0 ? ((messageStats.failed / messageStats.total) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{messageStats.pending?.toLocaleString() || 0}</div>
                <div className="text-sm text-gray-500">Pending</div>
                <div className="text-xs text-gray-400">Retry Rate: {messageStats.retryRate?.toFixed(1) || 0}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Schedules List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Schedules</h3>
                <p className="text-gray-500">All scheduled messages are completed or inactive.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div 
                    key={schedule.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {schedule.name}
                          </h3>
                          <Badge className={statusColors[schedule.status]}>
                            {schedule.status}
                          </Badge>
                          {schedule.scheduleType && (
                            <Badge variant="outline">
                              {schedule.scheduleType}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Next Run</p>
                            <p className="font-medium">{formatNextRun(schedule.nextRun)}</p>
                          </div>
                          
                          <div>
                            <p className="text-gray-500">Progress</p>
                            <p className="font-medium">
                              {schedule.messageStats ? (
                                <>
                                  {schedule.messageStats.sent} / {schedule.messageStats.total} sent
                                  <span className="text-xs text-gray-400 ml-1">
                                    ({schedule.messageStats.total > 0 
                                      ? ((schedule.messageStats.sent / schedule.messageStats.total) * 100).toFixed(0)
                                      : 0}%)
                                  </span>
                                </>
                              ) : (
                                "No data"
                              )}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-gray-500">Batch Progress</p>
                            <p className="font-medium">
                              {schedule.batchStats ? (
                                `${schedule.batchStats.completed} / ${schedule.batchStats.total} batches`
                              ) : (
                                "No batches"
                              )}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-gray-500">Success Rate</p>
                            <p className="font-medium">
                              {schedule.messageStats && schedule.messageStats.total > 0 ? (
                                <>
                                  {((schedule.messageStats.sent / schedule.messageStats.total) * 100).toFixed(1)}%
                                  {schedule.messageStats.failed > 0 && (
                                    <span className="text-red-500 ml-2">
                                      ({schedule.messageStats.failed} failed)
                                    </span>
                                  )}
                                </>
                              ) : (
                                "N/A"
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {schedule.messageStats && schedule.messageStats.total > 0 && (
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${(schedule.messageStats.sent / schedule.messageStats.total) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 ml-4">
                        {schedule.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleScheduleAction(schedule.id, 'pause')}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {schedule.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleScheduleAction(schedule.id, 'start')}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedSchedule(schedule)}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}