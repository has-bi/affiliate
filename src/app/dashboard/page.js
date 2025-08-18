"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { useTemplate } from "@/hooks/useTemplate";
import { useSchedule } from "@/hooks/useSchedule";
import { useAffiliates } from "@/hooks/useAffiliates";
import {
  PersonStanding,
  Users,
  Clock,
  FileText,
  Send,
  LinkIcon,
  MessageSquare,
  UserPlus,
  Calendar,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import PageLayout from "@/components/templates/PageLayout";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { sessions } = useWhatsApp();
  const { templates } = useTemplate();
  const { schedules } = useSchedule();
  const {
    newAffiliatesCount,
    activeAffiliatesCount,
    isLoading: affiliatesLoading,
    error: affiliatesError,
    fetchAllAffiliateData,
  } = useAffiliates();
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    setRecentActivity([
      {
        event: "Sent broadcast message",
        template: "Monthly Update",
        recipients: 125,
        time: "2 hours ago",
      },
      {
        event: "Created new template",
        template: "Welcome Message",
        recipients: 0,
        time: "5 hours ago",
      },
      {
        event: "Scheduled message",
        template: "Weekly Tips",
        recipients: 89,
        time: "1 day ago",
      },
    ]);
  }, []);

  // Derived data
  const activeSchedules = schedules.filter((s) => s.status === "active").length;
  const activeConnections = sessions.filter(
    (s) => s.status === "CONNECTED"
  ).length;

  return (
    <PageLayout
      title="Dashboard"
      description={`Welcome back, ${user?.name || "Admin"}`}
    >
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/messages/broadcast" className="group">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-green-200 transition-colors">
                <Send className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">Send Broadcast</p>
              <p className="text-xs text-gray-500">Send messages to multiple contacts</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/contacts/onboarding" className="group">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-200 transition-colors">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">Onboard Affiliates</p>
              <p className="text-xs text-gray-500">Review new affiliate applications</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/messages/templates/new" className="group">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-200 transition-colors">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">Create Template</p>
              <p className="text-xs text-gray-500">Design new message templates</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/messages/scheduled" className="group">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-orange-200 transition-colors">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">Schedule Messages</p>
              <p className="text-xs text-gray-500">Manage scheduled campaigns</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* A/B Testing Quick Action */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-8">
        <Link href="/ab-testing" className="group">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-200 transition-colors">
                <TrendingUp className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">A/B Testing</h3>
              <p className="text-sm text-gray-500">Create and manage A/B testing experiments to optimize your messaging campaigns</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* New Affiliates */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-indigo-100">
                  <PersonStanding className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    New Affiliates
                  </p>
                  {affiliatesLoading ? (
                    <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">
                      {newAffiliatesCount}
                    </p>
                  )}
                </div>
              </div>
              {newAffiliatesCount > 0 && (
                <div className="flex items-center">
                  <Link href="/contacts/onboarding" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    Review →
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Affiliates */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Active Affiliates
                  </p>
                  {affiliatesLoading ? (
                    <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">
                      {activeAffiliatesCount}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <Link href="/contacts/affiliates" className="text-green-600 hover:text-green-800 text-sm font-medium">
                  View →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Schedules */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-amber-100">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Active Schedules
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {activeSchedules}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Link href="/messages/scheduled" className="text-amber-600 hover:text-amber-800 text-sm font-medium">
                  Manage →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Templates</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {templates.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Link href="/messages/templates" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                  Browse →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          System Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* WhatsApp Connections */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">WhatsApp Connections</h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activeConnections > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {activeConnections > 0 ? `${activeConnections} Active` : 'Disconnected'}
                </div>
              </div>
              <div className="space-y-2">
                {sessions.slice(0, 3).map((session, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{session.name}</span>
                    <div className={`flex items-center ${
                      session.status === 'CONNECTED' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        session.status === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      {session.status === 'CONNECTED' ? 'Connected' : 'Disconnected'}
                    </div>
                  </div>
                ))}
                {sessions.length > 3 && (
                  <p className="text-xs text-gray-500 mt-2">+{sessions.length - 3} more sessions</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Recent Activity</h3>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </div>
              <div className="space-y-3">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{activity.event}</p>
                      <p className="text-xs text-gray-500">{activity.template} • {activity.time}</p>
                    </div>
                    {activity.recipients > 0 && (
                      <span className="text-xs text-gray-400">{activity.recipients}</span>
                    )}
                  </div>
                ))}
                <Link href="/dashboard/activity" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                  View all activity →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
