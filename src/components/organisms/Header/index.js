// src/components/organisms/Header/index.js
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import {
  LogOut,
  ChevronDown,
  Wifi,
  WifiOff,
  LayoutDashboard,
  MessageSquare,
  Users,
  Settings,
  FileText,
  Send,
  Clock,
  History,
  UserPlus,
} from "lucide-react";

// Navigation schema --------------------------------------------------
const NAVIGATION = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Messages",
    href: "/messages",
    icon: MessageSquare,
    children: [
      { name: "Templates", href: "/messages/templates", icon: FileText },
      { name: "Broadcast", href: "/messages/broadcast", icon: Send },
      { name: "Scheduled", href: "/messages/scheduled", icon: Clock },
    ],
  },
  {
    name: "Contacts",
    href: "/contacts",
    icon: Users,
    children: [
      { name: "Affiliates", href: "/contacts/affiliates", icon: Users },
      { name: "Onboarding", href: "/contacts/onboarding", icon: UserPlus },
    ],
  },
];

// Helper components --------------------------------------------------
const getSessionName = (s) => s?.name || "Unknown";

const DesktopNavItem = ({ item, isActive, pathname }) => {
  if (item.children) {
    return (
      <div className="relative group">
        <button
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors
          ${
            isActive
              ? "bg-indigo-50 text-indigo-700"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <item.icon className="h-5 w-5" />
          {item.name}
          <ChevronDown className="h-4 w-4" />
        </button>

        {/* Sub‑menu */}
        <div className="absolute left-0 mt-2 hidden w-56 rounded-md bg-white shadow-lg group-hover:block">
          {item.children.map((sub) => {
            const isSubActive = pathname === sub.href;
            return (
              <Link
                key={sub.name}
                href={sub.href}
                className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors
                ${
                  isSubActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {sub.icon && <sub.icon className="h-4 w-4" />} {sub.name}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors
      ${
        isActive
          ? "bg-indigo-50 text-indigo-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <item.icon className="h-5 w-5" /> {item.name}
    </Link>
  );
};

export default function Header() {
  const pathname = usePathname(); // Call usePathname at the top level of the component
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { sessions, fetchSessions, isLoading, defaultSession } = useWhatsApp();

  // Set up periodic session refresh
  useEffect(() => {
    fetchSessions();

    // Refresh session status every 30 seconds
    const intervalId = setInterval(() => {
      fetchSessions();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchSessions]);

  // Filter active sessions
  const connectedSessions = sessions.filter((s) => s.isConnected);
  const isDefaultSessionActive = connectedSessions.some(
    (s) => s.name === defaultSession
  );

  const sessionNames = connectedSessions.map(getSessionName);

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left ▾ Logo + Desktop nav */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-lg font-bold text-indigo-600">
            Youvit Affiliates
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex md:gap-1">
            {NAVIGATION.map((item) => (
              <DesktopNavItem
                key={item.name}
                item={item}
                isActive={pathname.startsWith(item.href)}
                pathname={pathname}
              />
            ))}
          </nav>
        </div>

        {/* Right – session indicator, user, hamburger */}
        <div className="flex items-center gap-4">
          {/* Connection status indicator */}
          <div
            className="hidden items-center gap-1 md:flex"
            title={`WhatsApp: ${defaultSession} (${
              sessions[0]?.status || "Unknown"
            })`}
          >
            {isLoading ? (
              <div className="h-2 w-2 rounded-full bg-gray-300 animate-pulse mr-2"></div>
            ) : isDefaultSessionActive ? (
              <>
                <Wifi className="h-5 w-5 text-green-500" />
                <span className="truncate text-sm text-gray-700 max-w-[12rem]">
                  WhatsApp Connected
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-500" />
                <span className="text-sm text-red-600">
                  WhatsApp Disconnected
                </span>
              </>
            )}
          </div>

          {/* User menu */}
          {user && (
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-full p-1 text-gray-500 transition-colors hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <span className="hidden text-sm md:block">
                {user.name || user.username}
              </span>
              <LogOut className="h-5 w-5" title="Sign out" />
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden"
            aria-label="Toggle navigation"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              {mobileOpen ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden">
          <div className="space-y-1 border-t bg-white px-4 pb-4 pt-2">
            {/* Connection status (mobile) */}
            <div className="flex items-center gap-2 border-b pb-2">
              {isLoading ? (
                <div className="h-2 w-2 rounded-full bg-gray-300 animate-pulse"></div>
              ) : isDefaultSessionActive ? (
                <>
                  <Wifi className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Connected: {defaultSession}</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-red-500" />
                  <span className="text-sm text-red-500">Disconnected</span>
                </>
              )}
            </div>

            {/* Nav items */}
            {NAVIGATION.map((item) => (
              <MobileNavItem
                key={item.name}
                item={item}
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}

            {/* Logout */}
            {user && (
              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" /> Sign out
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
