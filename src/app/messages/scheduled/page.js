// src/app/schedules/page.js
import React from "react";
import ScheduleManager from "../../../components/organisms/ScheduleManager";
import Header from "../../../components/organisms/Header";

export const metadata = {
  title: "Scheduled Messages | Youvit Affiliate",
  description: "Manage scheduled WhatsApp messages",
};

export default function SchedulesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:leading-9">
                Scheduled Messages
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Create and manage automated message schedules
              </p>
            </div>
          </div>

          <ScheduleManager />
        </div>
      </main>
    </div>
  );
}
