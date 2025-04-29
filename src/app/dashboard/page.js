// app/dashboard/page.js
"use client";

import React, { useState, useEffect } from "react";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { useTemplate } from "@/hooks/useTemplate";
import { useSchedule } from "@/hooks/useSchedule";
import {
  PersonStanding,
  Users,
  Clock,
  FileText,
  Send,
  LinkIcon,
} from "lucide-react";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import PageLayout from "@/components/templates/PageLayout";
import Link from "next/link";

export default function DashboardPage() {
  const { sessions } = useWhatsApp();
  const { templates } = useTemplate();
  const { schedules } = useSchedule();
  const [affiliateCount, setAffiliateCount] = useState(0);
  const [newAffiliateCount, setNewAffiliateCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);

  // Fetch affiliate count (you might need to create an API endpoint for this)
  useEffect(() => {
    const fetchAffiliateCount = async () => {
      try {
        const response = await fetch("/api/contacts");
        const data = await response.json();
        setAffiliateCount(data.contacts?.length || 0);
      } catch (error) {
        console.error("Error fetching affiliate count:", error);
      }
    };

    fetchAffiliateCount();
  }, []);

  useEffect(() => {
    const fetchNewAffiliateCount = async () => {
      try {
        const response = await fetch("/api/affiliates/new");
        const data = await response.json();
        setNewAffiliateCount(data.contacts?.length || 0);
      } catch (error) {
        console.error("Error fetching new affiliate count:", error);
      }
    };

    fetchNewAffiliateCount();
  }, []);

  // Mock recent activity - you can replace this with actual data
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

  const activeSchedules = schedules.filter((s) => s.status === "active").length;

  return (
    <PageLayout
      title="Dashboard"
      description="Overview of your WhatsApp operations"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Messages Sent - This would need an API endpoint */}
        <Card>
          <Card.Content>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100">
                <PersonStanding className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  New Affiliate
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {newAffiliateCount}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Active Affiliates */}
        <Card>
          <Card.Content>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Active Affiliates
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {affiliateCount}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Active Schedules */}
        <Card>
          <Card.Content>
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
          </Card.Content>
        </Card>

        {/* Templates */}
        <Card>
          <Card.Content>
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
          </Card.Content>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <Card.Content>
              <Link href="/broadcasts" className="block">
                <div className="flex items-center">
                  <Send className="h-8 w-8 text-indigo-600" />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Send Broadcast
                    </h3>
                    <p className="text-sm text-gray-500">
                      Send messages to multiple contacts
                    </p>
                  </div>
                </div>
              </Link>
            </Card.Content>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <Card.Content>
              <Link href="/templates/new" className="block">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Create Template
                    </h3>
                    <p className="text-sm text-gray-500">
                      Design a new message template
                    </p>
                  </div>
                </div>
              </Link>
            </Card.Content>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <Card.Content>
              <Link href="/schedules/new" className="block">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-amber-600" />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Schedule Message
                    </h3>
                    <p className="text-sm text-gray-500">
                      Set up automated messaging
                    </p>
                  </div>
                </div>
              </Link>
            </Card.Content>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <Card.Content>
              <Link href="/dashboard/connections" className="block">
                <div className="flex items-center">
                  <LinkIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Manage Connections
                    </h3>
                    <p className="text-sm text-gray-500">
                      Add / remove WhatsApp sessions
                    </p>
                  </div>
                </div>
              </Link>
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Recent Activity
        </h2>
        <Card>
          <Card.Content>
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
          </Card.Content>
        </Card>
      </div>
    </PageLayout>
  );
}
