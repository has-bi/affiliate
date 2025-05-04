// src/app/contacts/page.js
"use client";

import React from "react";
import PageLayout from "@/components/templates/PageLayout";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactsPage() {
  const router = useRouter();

  const sections = [
    {
      title: "Active Affiliates",
      description: "View and manage all active affiliates",
      icon: Users,
      color: "blue",
      path: "/contacts/affiliates",
    },
    {
      title: "Onboarding Affiliates",
      description: "Process new affiliates waiting for approval",
      icon: UserPlus,
      color: "green",
      path: "/contacts/onboarding",
    },
  ];

  return (
    <PageLayout
      title="Contacts Management"
      description="Manage your affiliates and onboarding processes"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <Card
            key={section.title}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push(section.path)}
          >
            <div className="p-6">
              <div className="flex items-start mb-4">
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
                </div>
              </div>

              <Button
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(section.path);
                }}
                className="w-full"
              >
                View {section.title}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}
