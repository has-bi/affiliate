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
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fadeIn">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Message Reports</h1>
          <p className="text-gray-600 text-lg">Track your WhatsApp messaging campaigns and performance</p>
        </div>
        <Button 
          onClick={loadData} 
          variant="outline" 
          className="btn-secondary flex items-center gap-2 hover:shadow-md transition-shadow"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Overall Stats */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slideInUp" style={{animationDelay: '200ms'}}>
          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Messages</p>
                <p className="text-3xl font-bold text-gray-900">{overallStats.totalMessages}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-100 to-green-200">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Successful</p>
                <p className="text-3xl font-bold text-green-600">{overallStats.successfulMessages}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-100 to-red-200">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Failed</p>
                <p className="text-3xl font-bold text-red-600">{overallStats.failedMessages}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Success Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {overallStats.totalMessages > 0 
                    ? Math.round((overallStats.successfulMessages / overallStats.totalMessages) * 100)
                    : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaigns List */}
      <Card className="card-modern animate-slideInUp" style={{animationDelay: '400ms'}}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            Recent Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-600">No campaigns found</p>
                <p className="text-sm text-gray-500 mt-1">Start sending messages to see reports here.</p>
              </div>
            ) : (
              campaigns.map((campaign, index) => (
                <div 
                  key={campaign.id} 
                  className="card-modern p-6 transition-all duration-200 hover:border-gray-300/80 animate-fadeIn"
                  style={{animationDelay: `${600 + index * 100}ms`}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-gray-900 text-lg">{campaign.name}</h3>
                        <Badge className={`${getStatusColor(campaign.status)} px-3 py-1 text-xs font-medium rounded-full`}>
                          {campaign.status}
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1 text-xs font-medium rounded-full border-gray-300">
                          {campaign.type}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span className="font-medium">{campaign.totalRecipients}</span>
                          <span className="text-gray-500">recipients</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="font-medium">{campaign.successfulSends}</span>
                          <span className="text-gray-500">sent</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="font-medium">{campaign.failedSends}</span>
                          <span className="text-gray-500">failed</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{new Date(campaign.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => loadCampaignReport(campaign.id)}
                      className="btn-secondary flex items-center gap-2 ml-6"
                    >
                      <Eye className="w-4 h-4" />
                      View Report
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Report Modal/Panel */}
      {campaignReport && (
        <Card className="card-modern animate-scaleIn border-2 border-primary-200/50">
          <CardHeader className="pb-4 border-b border-gray-200/60">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xl font-semibold">Campaign Report: {campaignReport.campaign.name}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCampaignReport(null)}
                className="hover:bg-red-50 hover:text-red-600 w-8 h-8 p-0 rounded-full"
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {reportLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200/50">
                    <p className="text-3xl font-bold text-gray-900 mb-2">{campaignReport.summary.total}</p>
                    <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200/50">
                    <p className="text-3xl font-bold text-green-600 mb-2">{campaignReport.summary.successful}</p>
                    <p className="text-sm font-medium text-gray-600">Successful ({campaignReport.summary.successRate}%)</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200/50">
                    <p className="text-3xl font-bold text-red-600 mb-2">{campaignReport.summary.failed}</p>
                    <p className="text-sm font-medium text-gray-600">Failed ({campaignReport.summary.failureRate}%)</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200/50">
                    <p className="text-3xl font-bold text-blue-600 mb-2">
                      {campaignReport.summary.duration ? Math.round(campaignReport.summary.duration / 60) : 'N/A'}
                    </p>
                    <p className="text-sm font-medium text-gray-600">Duration (minutes)</p>
                  </div>
                </div>

                {/* Error Analysis */}
                {Object.keys(campaignReport.errorAnalysis).length > 0 && (
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                      </div>
                      Error Analysis
                    </h4>
                    <div className="space-y-4">
                      {Object.entries(campaignReport.errorAnalysis).map(([errorType, data]) => (
                        <div key={errorType} className="card-modern p-5">
                          <div className="flex items-center justify-between mb-3">
                            <Badge className={`${getErrorTypeColor(errorType)} px-3 py-1 text-sm font-medium rounded-full`}>
                              {errorType.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm font-semibold bg-gray-100 px-3 py-1 rounded-full">{data.count} occurrences</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-3 p-3 bg-gray-50 rounded-lg">
                            <strong>Example:</strong> {data.examples[0]}
                          </p>
                          <details className="text-sm">
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
                              Show affected numbers ({data.recipients.length})
                            </summary>
                            <div className="mt-3 pl-4 bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                              {data.recipients.slice(0, 10).map(r => (
                                <div key={r} className="text-gray-700 py-1 font-mono text-xs">{r}</div>
                              ))}
                              {data.recipients.length > 10 && (
                                <div className="text-gray-500 py-1 italic">... and {data.recipients.length - 10} more</div>
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
                    <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-green-200">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      Recommendations
                    </h4>
                    <div className="space-y-4">
                      {campaignReport.recommendations.map((rec, index) => (
                        <div key={index} className={`p-5 rounded-xl border-l-4 ${
                          rec.type === 'critical' ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-500' :
                          rec.type === 'warning' ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-500' :
                          rec.type === 'success' ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-500' :
                          'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-500'
                        }`}>
                          <p className="font-semibold text-sm text-gray-900 mb-2">{rec.message}</p>
                          <p className="text-sm text-gray-700">{rec.action}</p>
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