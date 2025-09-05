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
import ReportsSummary from "@/components/molecules/ReportsSummary";
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

  return (
    <PageLayout
      title="Dashboard"
      description={`Welcome back, ${user?.name || "Admin"}`}
    >
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <Link href="/messages/broadcast" className="group animate-fadeIn">
          <Card className="card-modern group-hover:border-green-300/60">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:from-green-200 group-hover:to-green-300 transition-all duration-300 group-hover:scale-110">
                <Send className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Send Broadcast</h3>
              <p className="text-xs text-gray-600 leading-relaxed">Send messages to multiple contacts</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/contacts/onboarding" className="group animate-fadeIn" style={{animationDelay: '100ms'}}>
          <Card className="card-modern group-hover:border-blue-300/60">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300 group-hover:scale-110">
                <UserPlus className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Onboard Affiliates</h3>
              <p className="text-xs text-gray-600 leading-relaxed">Review new affiliate applications</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/messages/templates/new" className="group animate-fadeIn" style={{animationDelay: '200ms'}}>
          <Card className="card-modern group-hover:border-purple-300/60">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-300 group-hover:scale-110">
                <FileText className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Create Template</h3>
              <p className="text-xs text-gray-600 leading-relaxed">Design new message templates</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/messages/scheduled" className="group animate-fadeIn" style={{animationDelay: '300ms'}}>
          <Card className="card-modern group-hover:border-orange-300/60">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:from-orange-200 group-hover:to-orange-300 transition-all duration-300 group-hover:scale-110">
                <Calendar className="h-7 w-7 text-orange-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Schedule Messages</h3>
              <p className="text-xs text-gray-600 leading-relaxed">Manage scheduled campaigns</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* A/B Testing Quick Action */}
      <div className="mb-8 animate-slideInUp" style={{animationDelay: '400ms'}}>
        <Link href="/ab-testing" className="group block">
          <Card className="card-modern group-hover:border-indigo-300/60 overflow-hidden">
            <CardContent className="p-8 text-center relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-indigo-200 group-hover:to-purple-300 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <TrendingUp className="h-10 w-10 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">A/B Testing</h3>
              <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">Create and manage A/B testing experiments to optimize your messaging campaigns and improve conversion rates</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
                Start Testing
                <CheckCircle className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* New Affiliates */}
        <Card className="card-modern animate-slideInRight" style={{animationDelay: '500ms'}}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200">
                <PersonStanding className="h-6 w-6 text-indigo-600" />
              </div>
              {newAffiliatesCount > 0 && (
                <Link 
                  href="/contacts/onboarding" 
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors"
                >
                  Review →
                </Link>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                New Affiliates
              </p>
              {affiliatesLoading ? (
                <div className="skeleton h-8 w-16"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {newAffiliatesCount}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Affiliates */}
        <Card className="card-modern animate-slideInRight" style={{animationDelay: '600ms'}}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-100 to-green-200">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <Link 
                href="/contacts/affiliates" 
                className="text-green-600 hover:text-green-700 text-sm font-medium hover:bg-green-50 px-2 py-1 rounded-md transition-colors"
              >
                View →
              </Link>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Active Affiliates
              </p>
              {affiliatesLoading ? (
                <div className="skeleton h-8 w-16"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {activeAffiliatesCount}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Schedules */}
        <Card className="card-modern animate-slideInRight" style={{animationDelay: '700ms'}}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <Link 
                href="/messages/scheduled" 
                className="text-amber-600 hover:text-amber-700 text-sm font-medium hover:bg-amber-50 px-2 py-1 rounded-md transition-colors"
              >
                Manage →
              </Link>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Active Schedules
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {activeSchedules}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Templates */}
        <Card className="card-modern animate-slideInRight" style={{animationDelay: '800ms'}}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <Link 
                href="/messages/templates" 
                className="text-purple-600 hover:text-purple-700 text-sm font-medium hover:bg-purple-50 px-2 py-1 rounded-md transition-colors"
              >
                Browse →
              </Link>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Templates</p>
              <p className="text-2xl font-bold text-gray-900">
                {templates.length}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Reports Summary */}
        <div className="animate-slideInRight" style={{animationDelay: '900ms'}}>
          <ReportsSummary />
        </div>
      </div>
    </PageLayout>
  );
}
