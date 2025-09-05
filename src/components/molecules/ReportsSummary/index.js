// src/components/molecules/ReportsSummary/index.js
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  ArrowRight,
  Activity
} from "lucide-react";
import Link from "next/link";

export default function ReportsSummary() {
  const [stats, setStats] = useState(null);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummaryData();
  }, []);

  const loadSummaryData = async () => {
    try {
      // Load overall stats
      const statsResponse = await fetch('/api/reports/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      // Load recent campaigns (last 5)
      const campaignsResponse = await fetch('/api/reports/campaigns?limit=5');
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        setRecentCampaigns(campaignsData.campaigns);
      }
    } catch (error) {
      console.error('Failed to load summary data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Message Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No message data available yet.</p>
            <p className="text-sm mt-1">Start sending messages to see reports here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const successRate = stats.totalMessages > 0 
    ? Math.round((stats.successfulMessages / stats.totalMessages) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Message Reports
        </CardTitle>
        <Link href="/reports">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            View All
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="text-lg font-bold text-blue-600">{stats.totalMessages}</span>
            </div>
            <p className="text-xs text-gray-600">Total Messages</p>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-lg font-bold text-green-600">{successRate}%</span>
            </div>
            <p className="text-xs text-gray-600">Success Rate</p>
          </div>
        </div>

        {/* Success/Failure Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>{stats.successfulMessages} Successful</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span>{stats.failedMessages} Failed</span>
            </div>
          </div>
          
          {/* Progress bar */}
          {stats.totalMessages > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${successRate}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {recentCampaigns.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Activity
            </h4>
            <div className="space-y-2">
              {recentCampaigns.slice(0, 3).map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between text-xs bg-gray-50 rounded p-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {campaign.name}
                    </p>
                    <p className="text-gray-500">
                      {campaign.successfulSends}/{campaign.totalRecipients} sent
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                    campaign.status === 'running' ? 'bg-blue-100 text-blue-800' :
                    campaign.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {campaign.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Campaign Stats */}
        {stats.totalCampaigns > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{stats.totalCampaigns} total campaigns</span>
              <span>{stats.activeCampaigns} active</span>
              <span>{stats.recentCampaigns} today</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}