"use client";

import React, { useState } from "react";
import { Toaster } from "react-hot-toast";
import SessionChecker from "@/components/session-checker";
import MessageSender from "@/components/message-sender";
import { MessageSquare, Users, CheckCircle } from "lucide-react";

// Tab enum
const TABS = {
  SESSIONS: "sessions",
  MESSAGES: "messages",
};

export default function Home() {
  const [activeTab, setActiveTab] = useState(TABS.SESSIONS);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toaster for notifications */}
      <Toaster position="top-right" />

      {/* Navbar */}
      <nav className="bg-green-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 mr-2" />
            <h1 className="text-xl font-bold">WAHA Dashboard Youvit</h1>
          </div>

          <div className="text-sm text-green-100">
            <span>WhatsApp API Status:</span>
            <span className="ml-2 bg-green-500 py-1 px-2 rounded-full text-white font-medium">
              Connected
            </span>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab(TABS.SESSIONS)}
            className={`flex items-center py-3 px-4 font-medium text-sm border-b-2 -mb-px ${
              activeTab === TABS.SESSIONS
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Users className="h-5 w-5 mr-2" />
            Sessions
          </button>

          <button
            onClick={() => setActiveTab(TABS.MESSAGES)}
            className={`flex items-center py-3 px-4 font-medium text-sm border-b-2 -mb-px ${
              activeTab === TABS.MESSAGES
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            Send Messages
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === TABS.SESSIONS && <SessionChecker />}
          {activeTab === TABS.MESSAGES && <MessageSender />}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 bg-gray-100 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p className="mb-2">Youvit WAHA Dashboard</p>
          <p>© {new Date().getFullYear()} Youvit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
