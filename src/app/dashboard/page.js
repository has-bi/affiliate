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
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* New Affiliates */}
        <Card>
          <CardContent className="p-4">
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
          </CardContent>
        </Card>

        {/* Active Affiliates */}
        <Card>
          <CardContent className="p-4">
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
          </CardContent>
        </Card>

        {/* Active Schedules */}
        <Card>
          <CardContent className="p-4">
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
          </CardContent>
        </Card>

        {/* Templates */}
        <Card>
          <CardContent className="p-4">
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
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              href: "/broadcasts",
              icon: Send,
              title: "Send Broadcast",
              desc: "Send messages to multiple contacts",
            },
            {
              href: "/templates/new",
              icon: FileText,
              title: "Create Template",
              desc: "Design a new message template",
            },
            {
              href: "/schedules/new",
              icon: Clock,
              title: "Schedule Message",
              desc: "Set up automated messaging",
            },
          ].map((action, idx) => (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <Link href={action.href} className="block">
                  <div className="flex items-center">
                    <action.icon className="h-8 w-8 text-indigo-600" />
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-500">{action.desc}</p>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Recent Activity
        </h2>
        <Card>
          <CardContent className="p-4">
            <ul className="divide-y divide-gray-200">
              {recentActivity.map((activity, index) => (
                <li key={index} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.event}
                      </p>
                      <p className="text-sm text-gray-500">
                        Template: {activity.template}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {activity.recipients} recipients
                      </p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
