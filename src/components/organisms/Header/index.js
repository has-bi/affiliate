// Update in src/components/organisms/Header/index.js

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, ChevronDown } from "lucide-react";

const Header = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Scheduled Messages", href: "/schedules" },
    { name: "Affiliate Onboarding", href: "/affiliate-onboarding" },
    {
      name: "Templates",
      href: "/templates/list",
      submenu: [
        { name: "List Templates", href: "/templates/list" },
        { name: "Create Template", href: "/templates/new" },
        { name: "Send Template", href: "/templates/send" },
        { name: "Seed Database", href: "/templates/seed" },
      ],
    },
  ];

  return (
    <header className="bg-white shadow">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-blue-600">
                WAHA Control
              </span>
            </div>

            {/* Desktop navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="flex space-x-4">
                {navigation.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.submenu &&
                      item.submenu.some(
                        (subItem) => pathname === subItem.href
                      ));

                  // If item has submenu, render dropdown
                  if (item.submenu) {
                    return (
                      <div className="relative group" key={item.name}>
                        <button
                          className={`
                            px-3 py-2 rounded-md text-sm font-medium flex items-center
                            ${
                              isActive
                                ? "bg-blue-100 text-blue-700"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }
                          `}
                        >
                          {item.name}
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </button>

                        <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
                          <div className="py-1 rounded-md bg-white shadow-xs">
                            {item.submenu.map((subItem) => {
                              const isSubItemActive = pathname === subItem.href;
                              return (
                                <Link
                                  key={subItem.name}
                                  href={subItem.href}
                                  className={`
                                    block px-4 py-2 text-sm
                                    ${
                                      isSubItemActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-gray-700 hover:bg-gray-100"
                                    }
                                  `}
                                >
                                  {subItem.name}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Otherwise render normal link
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        px-3 py-2 rounded-md text-sm font-medium
                        ${
                          isActive
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }
                      `}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* User menu */}
          {user && (
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-3">
                  {user.name || user.username}
                </span>
                <button
                  onClick={logout}
                  className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${isMobileMenuOpen ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${isMobileMenuOpen ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, toggle based on menu state */}
      <div
        className={`${isMobileMenuOpen ? "block" : "hidden"} sm:hidden`}
        id="mobile-menu"
      >
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.submenu &&
                item.submenu.some((subItem) => pathname === subItem.href));

            // If has submenu, render collapsible section
            if (item.submenu) {
              const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

              return (
                <div key={item.name}>
                  <button
                    className={`
                      w-full flex justify-between items-center px-3 py-2 rounded-md text-base font-medium
                      ${
                        isActive
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }
                    `}
                    onClick={() => setIsSubmenuOpen(!isSubmenuOpen)}
                  >
                    <span>{item.name}</span>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${
                        isSubmenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isSubmenuOpen && (
                    <div className="pl-4 mt-1 mb-1 space-y-1">
                      {item.submenu.map((subItem) => {
                        const isSubItemActive = pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={`
                              block px-3 py-2 rounded-md text-base font-medium
                              ${
                                isSubItemActive
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              }
                            `}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Otherwise render normal link
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  block px-3 py-2 rounded-md text-base font-medium
                  ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            );
          })}

          {user && (
            <button
              onClick={() => {
                logout();
                setIsMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
            >
              <div className="flex items-center">
                <LogOut className="h-5 w-5 mr-2" />
                Sign out
              </div>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
