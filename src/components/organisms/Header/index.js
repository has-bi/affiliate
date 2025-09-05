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
  TrendingUp,
  BarChart3,
  Menu,
  X,
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
  {
    name: "A/B Testing",
    href: "/ab-testing",
    icon: TrendingUp,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
];

// Helper components --------------------------------------------------
const getSessionName = (s) => s?.name || "Unknown";

const DesktopNavItem = ({ item, isActive, pathname }) => {
  if (item.children) {
    return (
      <div className="relative group">
        <button
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:shadow-sm
          ${
            isActive
              ? "bg-primary-50 text-primary-700 shadow-sm"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <item.icon className="h-5 w-5" />
          {item.name}
          <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
        </button>

        {/* Sub‑menu */}
        <div className="absolute left-0 mt-2 hidden w-56 glass-effect rounded-lg shadow-xl border group-hover:block animate-scaleIn">
          <div className="p-1">
            {item.children.map((sub) => {
              const isSubActive = pathname === sub.href;
              return (
                <Link
                  key={sub.name}
                  href={sub.href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200
                  ${
                    isSubActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50 hover:shadow-sm"
                  }`}
                >
                  {sub.icon && <sub.icon className="h-4 w-4" />}
                  {sub.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5
      ${
        isActive
          ? "bg-primary-50 text-primary-700 shadow-sm"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <item.icon className="h-5 w-5" />
      {item.name}
    </Link>
  );
};

export default function Header() {
  const pathname = usePathname();
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

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <header className="sticky top-0 z-30 w-full glass-effect border-b border-gray-200/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left ▾ Logo + Desktop nav */}
        <div className="flex items-center gap-8">
          <Link 
            href="/dashboard" 
            className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent hover:from-primary-700 hover:to-primary-800 transition-all duration-200"
          >
            Youvit Affiliates
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex md:gap-2">
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
            className="hidden items-center gap-2 md:flex px-3 py-1.5 rounded-full text-sm transition-all duration-200"
            style={{
              background: isDefaultSessionActive 
                ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' 
                : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
            }}
            title={`WhatsApp: ${defaultSession} (${
              sessions[0]?.isConnected ? "Connected" : sessions[0]?.status || "Unknown"
            })`}
          >
            {isLoading ? (
              <div className="h-2 w-2 rounded-full bg-gray-300 animate-pulse"></div>
            ) : isDefaultSessionActive ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-700">
                  Connected
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-700">
                  Disconnected
                </span>
              </>
            )}
          </div>

          {/* User menu */}
          {user && (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm font-medium text-gray-700 md:block">
                {user.name || user.username}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-lg p-2 text-gray-500 transition-all duration-200 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden animate-slideInUp">
          <div className="space-y-2 glass-effect border-t border-gray-200/60 px-4 pb-4 pt-4">
            {/* Connection status (mobile) */}
            <div 
              className="flex items-center gap-3 border-b border-gray-200/60 pb-3 px-3 py-2 rounded-lg"
              style={{
                background: isDefaultSessionActive 
                  ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' 
                  : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
              }}
            >
              {isLoading ? (
                <div className="h-2 w-2 rounded-full bg-gray-300 animate-pulse"></div>
              ) : isDefaultSessionActive ? (
                <>
                  <Wifi className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Connected: {defaultSession}</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-700">Disconnected</span>
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
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:shadow-sm mt-4 border-t border-gray-200/60 pt-4"
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

// Mobile nav item (with accordion support) ---------------------------
function MobileNavItem({ item, pathname, onNavigate }) {
  const [open, setOpen] = useState(false);

  const active = pathname.startsWith(item.href);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all duration-200
          ${
            active
              ? "bg-primary-50 text-primary-700 shadow-sm"
              : "text-gray-600 hover:bg-gray-50 hover:shadow-sm"
          }`}
        >
          <item.icon className="h-5 w-5" />
          {item.name}
          <ChevronDown
            className={`ml-auto h-5 w-5 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
        {open && (
          <div className="ml-6 space-y-1 animate-slideInUp">
            {item.children.map((sub) => (
              <Link
                key={sub.name}
                href={sub.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200
                ${
                  pathname === sub.href
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50 hover:shadow-sm"
                }`}
              >
                {sub.icon && <sub.icon className="h-4 w-4" />}
                {sub.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all duration-200 hover:shadow-sm
      ${
        active
          ? "bg-primary-50 text-primary-700 shadow-sm"
          : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      <item.icon className="h-5 w-5" />
      {item.name}
    </Link>
  );
}
