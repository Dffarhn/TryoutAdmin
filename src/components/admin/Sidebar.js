"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  Package,
  Users,
  X,
  Menu,
  CreditCard,
  Calendar,
  Receipt,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const menuItems = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/tryouts",
    label: "Tryouts",
    icon: BookOpen,
  },
  {
    href: "/admin/categories",
    label: "Kategori",
    icon: FolderTree,
  },
  {
    href: "/admin/packages",
    label: "Paket",
    icon: Package,
  },
  {
    href: "/admin/subscription-types",
    label: "Subscription Types",
    icon: CreditCard,
  },
  {
    href: "/admin/tryout-sessions",
    label: "Tryout Sessions",
    icon: Calendar,
  },
  {
    href: "/admin/transactions",
    label: "Transactions",
    icon: Receipt,
  },
  {
    href: "/admin/user-subscriptions",
    label: "User Subscriptions",
    icon: UserCheck,
  },
  {
    href: "/admin/admins",
    label: "Admin",
    icon: Users,
  },
];

export function Sidebar({ isOpen, onToggle }) {
  const pathname = usePathname();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024 && isOpen) {
      onToggle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-50",
          "transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "w-64 shadow-lg lg:shadow-none"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Branding */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
            <Link
              href="/admin/dashboard"
              className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  onToggle();
                }
              }}
            >
              Tryout Admin
            </Link>
            {/* Close button for mobile */}
            <button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin/dashboard" &&
                  pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    "hover:bg-gray-50 hover:shadow-sm",
                    isActive
                      ? "bg-blue-50 text-blue-600 shadow-sm border-l-4 border-blue-600"
                      : "text-gray-700 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
