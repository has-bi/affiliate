// src/app/reports/page.js
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  AlertTriangle,
  RefreshCw,
  Download,
  Eye
} from "lucide-react";

export default function ReportsPage() {
  const [overallStats, setOverallStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignReport, setCampaignReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load overall stats
      const statsResponse = await fetch('/api/reports/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setOverallStats(statsData.stats);
      }

      // Load recent campaigns
      const campaignsResponse = await fetch('/api/reports/campaigns?limit=20');
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        setCampaigns(campaignsData.campaigns);
      }
    } catch (error) {
      console.error('Failed to load reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaignReport = async (campaignId) => {
    setReportLoading(true);
    setSelectedCampaign(campaignId);
    try {
      const response = await fetch(`/api/reports/campaigns/${campaignId}?report=true&includeMessages=true`);
      if (response.ok) {
        const data = await response.json();
        setCampaignReport(data.report);
      }
    } catch (error) {
      console.error('Failed to load campaign report:', error);
    } finally {
      setReportLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getErrorTypeColor = (errorType) => {
    switch (errorType) {
      case 'server_unavailable': return 'bg-red-100 text-red-800';
      case 'session_disconnected': return 'bg-orange-100 text-orange-800';
      case 'timeout': return 'bg-yellow-100 text-yellow-800';
      case 'rate_limited': return 'bg-purple-100 text-purple-800';
      case 'invalid_number': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Message Reports</h1>
          <p className="text-gray-500 mt-1">Track your WhatsApp messaging campaigns and performance</p>
        </div>
        <Button onClick={loadData} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Overall Stats */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{overallStats.totalMessages}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Successful</p>
                  <p className="text-2xl font-bold text-green-600">{overallStats.successfulMessages}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{overallStats.failedMessages}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overallStats.totalMessages > 0 
                      ? Math.round((overallStats.successfulMessages / overallStats.totalMessages) * 100)
                      : 0}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Recent Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No campaigns found. Start sending messages to see reports here.</p>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      <Badge variant="outline">
                        {campaign.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {campaign.totalRecipients} recipients
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {campaign.successfulSends} sent
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="w-4 h-4 text-red-500" />
                        {campaign.failedSends} failed
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadCampaignReport(campaign.id)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Report
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Report Modal/Panel */}
      {campaignReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Campaign Report: {campaignReport.campaign.name}</span>
              <Button variant="ghost" size="sm" onClick={() => setCampaignReport(null)}>
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{campaignReport.summary.total}</p>
                    <p className="text-sm text-gray-600">Total Messages</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{campaignReport.summary.successful}</p>
                    <p className="text-sm text-gray-600">Successful ({campaignReport.summary.successRate}%)</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{campaignReport.summary.failed}</p>
                    <p className="text-sm text-gray-600">Failed ({campaignReport.summary.failureRate}%)</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {campaignReport.summary.duration ? Math.round(campaignReport.summary.duration / 60) : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">Duration (minutes)</p>
                  </div>
                </div>

                {/* Error Analysis */}
                {Object.keys(campaignReport.errorAnalysis).length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Error Analysis
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(campaignReport.errorAnalysis).map(([errorType, data]) => (
                        <div key={errorType} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getErrorTypeColor(errorType)}>
                              {errorType.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm font-medium">{data.count} occurrences</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">Example: {data.examples[0]}</p>
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-500">
                              Show affected numbers ({data.recipients.length})
                            </summary>
                            <div className="mt-2 pl-4">
                              {data.recipients.slice(0, 10).map(r => (
                                <div key={r} className="text-gray-600">{r}</div>
                              ))}
                              {data.recipients.length > 10 && (
                                <div className="text-gray-500">... and {data.recipients.length - 10} more</div>
                              )}
                            </div>
                          </details>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {campaignReport.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
                    <div className="space-y-2">
                      {campaignReport.recommendations.map((rec, index) => (
                        <div key={index} className={`p-3 rounded-lg border-l-4 ${
                          rec.type === 'critical' ? 'bg-red-50 border-red-500' :
                          rec.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                          rec.type === 'success' ? 'bg-green-50 border-green-500' :
                          'bg-blue-50 border-blue-500'
                        }`}>
                          <p className="font-medium text-sm text-gray-900">{rec.message}</p>
                          <p className="text-sm text-gray-600 mt-1">{rec.action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}