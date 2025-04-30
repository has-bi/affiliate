// app/messages/page.js
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Send,
  Clock,
  History,
  MessageSquare,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/templates/PageLayout";
import { useTemplate } from "@/hooks/useTemplate";
import { useSchedule } from "@/hooks/useSchedule";

export default function MessagesPage() {
  const router = useRouter();
  const { templates } = useTemplate();
  const { schedules } = useSchedule();
  const [messageStats, setMessageStats] = useState({
    totalSent: 0,
    scheduledToday: 0,
    activeSchedules: 0,
  });

  useEffect(() => {
    // Calculate stats
    const activeSchedules = schedules.filter(
      (s) => s.status === "active"
    ).length;
    const scheduledToday = schedules.filter((s) => {
      if (!s.nextRun) return false;
      const nextRun = new Date(s.nextRun);
      const today = new Date();
      return nextRun.toDateString() === today.toDateString();
    }).length;

    setMessageStats({
      totalSent: 0, // You'll need to implement this with actual data
      scheduledToday,
      activeSchedules,
    });
  }, [schedules]);

  const sections = [
    {
      title: "Templates",
      description:
        "Create and manage message templates for consistent communication",
      icon: FileText,
      color: "indigo",
      link: "/messages/templates",
      stats: `${templates.length} templates`,
      action: "Manage Templates",
      quickActions: [
        { label: "Create New", href: "/messages/templates/new", icon: Plus },
        { label: "View All", href: "/messages/templates", icon: ArrowRight },
      ],
    },
    {
      title: "Broadcast",
      description: "Send messages to multiple recipients at once",
      icon: Send,
      color: "green",
      link: "/messages/broadcast",
      stats: null,
      action: "Send Broadcast",
      quickActions: [
        { label: "New Broadcast", href: "/messages/broadcast", icon: Plus },
      ],
    },
    {
      title: "Scheduled Messages",
      description: "Automate message delivery with scheduled campaigns",
      icon: Clock,
      color: "amber",
      link: "/messages/scheduled",
      stats: `${messageStats.activeSchedules} active`,
      action: "Manage Schedules",
      quickActions: [
        {
          label: "Create Schedule",
          href: "/messages/scheduled/new",
          icon: Plus,
        },
        { label: "View All", href: "/messages/scheduled", icon: ArrowRight },
      ],
    },
    {
      title: "History",
      description: "View all sent messages and delivery reports",
      icon: History,
      color: "purple",
      link: "/messages/history",
      stats: null,
      action: "View History",
      quickActions: [
        { label: "View Reports", href: "/messages/history", icon: ArrowRight },
      ],
    },
  ];

  return (
    <PageLayout
      title="Messages"
      description="Manage all your WhatsApp messaging activities"
    >
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <Card.Content>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Messages Sent
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {messageStats.totalSent}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Scheduled Today
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {messageStats.scheduledToday}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-amber-100">
                <Send className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Active Schedules
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {messageStats.activeSchedules}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <Card
            key={section.title}
            className="hover:shadow-md transition-shadow"
          >
            <Card.Content>
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className={`p-3 rounded-lg bg-${section.color}-100`}>
                    <section.icon
                      className={`h-6 w-6 text-${section.color}-600`}
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {section.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {section.description}
                    </p>
                    {section.stats && (
                      <p className="mt-2 text-sm font-medium text-gray-700">
                        {section.stats}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                {section.quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant={
                      action.label.includes("New") ||
                      action.label.includes("Create")
                        ? "primary"
                        : "secondary"
                    }
                    size="sm"
                    onClick={() => router.push(action.href)}
                    leftIcon={<action.icon className="h-4 w-4" />}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Recent Messages
        </h2>
        <Card>
          <Card.Content>
            <div className="text-center py-6 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No recent messages</p>
              <p className="text-sm">
                Your recent message activity will appear here
              </p>
            </div>
          </Card.Content>
        </Card>
      </div>
    </PageLayout>
  );
}
