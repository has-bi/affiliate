"use client";

import React, { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageLayout from "@/components/templates/PageLayout";
import { useRouter } from "next/navigation";
import { 
  Play, 
  Pause, 
  Square,
  BarChart3, 
  Users, 
  MessageSquare,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  AlertCircle
} from "lucide-react";
import InfoTooltip from "@/components/molecules/InfoTooltip";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  active: "bg-green-100 text-green-800", 
  paused: "bg-yellow-100 text-yellow-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800"
};

export default function ABTestDetailPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const [experiment, setExperiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchExperiment();
    const interval = setInterval(fetchExperiment, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [id]);

  const fetchExperiment = async () => {
    try {
      const response = await fetch(`/api/ab-testing/experiments/${id}`);
      if (response.ok) {
        const data = await response.json();
        setExperiment(data);
      } else {
        setError("Experiment not found");
      }
    } catch (error) {
      setError("Failed to fetch experiment");
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (action) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/ab-testing/experiments/${id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        await fetchExperiment(); // Refresh data
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (error) {
      setError(`Failed to ${action} experiment`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Loading..." description="Loading experiment details...">
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageLayout>
    );
  }

  if (error || !experiment) {
    return (
      <PageLayout title="Error" description="Failed to load experiment">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-500 mb-4">{error || "Experiment not found"}</p>
            <Button onClick={() => router.push("/ab-testing")}>
              Back to A/B Tests
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  // Calculate overall metrics
  const totalSent = experiment.variants.reduce((sum, v) => sum + (v.analytics?.sent || 0), 0);
  const totalFailed = experiment.variants.reduce((sum, v) => sum + (v.analytics?.failed || 0), 0);
  const totalDelivered = experiment.variants.reduce((sum, v) => sum + (v.analytics?.delivered || 0), 0);
  const totalRead = experiment.variants.reduce((sum, v) => sum + (v.analytics?.read || 0), 0);

  return (
    <PageLayout 
      title={experiment.name}
      description={experiment.description || "A/B Testing Experiment"}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Badge className={statusColors[experiment.status]}>
              {experiment.status}
            </Badge>
            <span className="text-sm text-gray-500">
              Created {new Date(experiment.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {experiment.status === 'draft' && (
              <Button
                onClick={() => executeAction('start')}
                disabled={actionLoading}
              >
                <Play className="h-4 w-4 mr-1" />
                Start Experiment
              </Button>
            )}
            
            {experiment.status === 'active' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => executeAction('send_batch')}
                  disabled={actionLoading}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Send Next Batch
                </Button>
                <Button
                  variant="outline"
                  onClick={() => executeAction('pause')}
                  disabled={actionLoading}
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
                <Button
                  variant="outline"
                  onClick={() => executeAction('stop')}
                  disabled={actionLoading}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              </>
            )}
            
            {experiment.status === 'paused' && (
              <>
                <Button
                  onClick={() => executeAction('resume')}
                  disabled={actionLoading}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </Button>
                <Button
                  variant="outline"
                  onClick={() => executeAction('stop')}
                  disabled={actionLoading}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Recipients</p>
                  <p className="text-xl font-semibold">{experiment.totalRecipients}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Messages Sent</p>
                  <p className="text-xl font-semibold">{totalSent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Delivered</p>
                  <p className="text-xl font-semibold">{totalDelivered}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Read</p>
                  <p className="text-xl font-semibold">{totalRead}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Variants Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Variant Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {experiment.variants.map((variant) => {
                const analytics = variant.analytics || {};
                const sent = analytics.sent || 0;
                const delivered = analytics.delivered || 0;
                const read = analytics.read || 0;
                const failed = analytics.failed || 0;
                
                const deliveryRate = sent > 0 ? ((delivered / sent) * 100).toFixed(1) : 0;
                const readRate = delivered > 0 ? ((read / delivered) * 100).toFixed(1) : 0;
                
                return (
                  <div key={variant.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Variant {variant.name}
                        </h3>
                        <div className="text-sm text-gray-500">
                          {variant.allocationPercentage}% allocation • {variant._count?.recipients || 0} recipients
                        </div>
                        {variant.template && (
                          <p className="text-sm text-gray-500">
                            Using template: {variant.template.name}
                          </p>
                        )}
                      </div>
                      <div className={`w-4 h-4 rounded-full ${
                        variant.name === 'A' ? 'bg-blue-500' : 
                        variant.name === 'B' ? 'bg-green-500' : 'bg-purple-500'
                      }`}></div>
                    </div>
                    
                    {/* Message Content */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        {variant.customMessage || variant.template?.content || "No message content"}
                      </p>
                    </div>
                    
                    {/* Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-gray-900">{sent}</div>
                        <div className="text-sm text-gray-500">Sent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-green-600">{delivered}</div>
                        <div className="text-sm text-gray-500">Delivered</div>
                        <div className="text-xs text-gray-400">{deliveryRate}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-blue-600">{read}</div>
                        <div className="text-sm text-gray-500">Read</div>
                        <div className="text-xs text-gray-400">{readRate}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-red-600">{failed}</div>
                        <div className="text-sm text-gray-500">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-gray-600">
                          {analytics.pending || 0}
                        </div>
                        <div className="text-sm text-gray-500">Pending</div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{sent + failed} / {variant._count?.recipients || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            variant.name === 'A' ? 'bg-blue-500' : 
                            variant.name === 'B' ? 'bg-green-500' : 'bg-purple-500'
                          }`}
                          style={{ 
                            width: `${variant._count?.recipients > 0 
                              ? ((sent + failed) / variant._count.recipients) * 100 
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {experiment.recentActivity && experiment.recentActivity.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {experiment.recentActivity.slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'sent' ? 'bg-green-500' : 
                        activity.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                      }`}></div>
                      <span className="text-gray-600">
                        Variant {activity.variant.name} → {activity.recipient.phoneNumber}
                      </span>
                      <Badge 
                        className={
                          activity.status === 'sent' ? 'bg-green-100 text-green-800' :
                          activity.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {activity.status}
                      </Badge>
                    </div>
                    <span className="text-gray-400">
                      {activity.sentAt ? new Date(activity.sentAt).toLocaleTimeString() : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Experiment Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Experiment Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Session</p>
                <p className="text-gray-600">{experiment.sessionName}</p>
              </div>
              <div>
                <div className="font-medium text-gray-700 flex items-center gap-1">
                  Batch Size
                  <InfoTooltip
                    title="Batch Size"
                    description="Number of messages sent together in each batch. This helps manage sending rates and prevents overwhelming WhatsApp servers."
                    examples={[
                      `Current setting sends ${experiment.batchSize} messages at once`,
                      `Total batches needed: ~${Math.ceil((experiment.totalRecipients || 0) / experiment.batchSize)}`
                    ]}
                    position="top"
                  />
                </div>
                <p className="text-gray-600">{experiment.batchSize} messages</p>
              </div>
              <div>
                <div className="font-medium text-gray-700 flex items-center gap-1">
                  Cooldown
                  <InfoTooltip
                    title="Cooldown Period"
                    description="Waiting time between batches to prevent rate limiting. This ensures your WhatsApp account stays in good standing."
                    examples={[
                      `Current setting waits ${experiment.cooldownMinutes} minutes between batches`,
                      `Estimated completion: ~${Math.ceil((experiment.totalRecipients || 0) / experiment.batchSize * experiment.cooldownMinutes)} minutes total`
                    ]}
                    position="top"
                  />
                </div>
                <p className="text-gray-600">{experiment.cooldownMinutes} minutes</p>
              </div>
              {experiment.startedAt && (
                <div>
                  <p className="font-medium text-gray-700">Started</p>
                  <p className="text-gray-600">{new Date(experiment.startedAt).toLocaleString()}</p>
                </div>
              )}
              {experiment.endedAt && (
                <div>
                  <p className="font-medium text-gray-700">Ended</p>
                  <p className="text-gray-600">{new Date(experiment.endedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}