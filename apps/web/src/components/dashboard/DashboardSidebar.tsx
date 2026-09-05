"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ChevronDown, Clock, Send } from "lucide-react";
import type { User } from "@/lib/types";
import "./dashboard.css";
interface DashboardSidebarProps {
  user?: User;
  scheduledCount?: number;
  sentCount?: number;
}

export default function DashboardSidebar({
  user,
  scheduledCount = 0,
  sentCount = 0,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentView = searchParams.get("view");

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" && !currentView;
    }
    if (href.includes("scheduled")) {
      return pathname === "/dashboard" && currentView === "scheduled";
    }
    if (href.includes("sent")) {
      return pathname === "/dashboard" && currentView === "sent";
    }
    return pathname === href;
  };

  const isScheduledActive = isActive("/dashboard?view=scheduled");
  const isSentActive = isActive("/dashboard?view=sent");

  return (
    <aside className="dashboard-sidebar">
      {/* Logo */}
      <div className="dashboard-sidebar-logo">
        <Link href="/dashboard">ONE</Link>
      </div>

      <div className="dashboard-sidebar-content">
        {/* User Profile */}
        <div className="dashboard-profile">
          <div className="dashboard-profile-left">
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.name}
                width={36}
                height={36}
                className="dashboard-profile-avatar"
              />
            ) : (
              <div className="dashboard-profile-avatar dashboard-profile-fallback">
                {user?.name?.charAt(0).toUpperCase() || "O"}
              </div>
            )}

            <div className="dashboard-profile-info">
              <span className="dashboard-profile-name">
                {user?.name || "Oliver Brown"}
              </span>

              <span className="dashboard-profile-email">
                {user?.email || "oliver.brown@domain.io"}
              </span>
            </div>
          </div>

          <ChevronDown className="dashboard-profile-chevron" />
        </div>

        {/* Compose */}
        <Link href="/dashboard/compose" className="dashboard-compose-button">
          Compose
        </Link>

        {/* Navigation */}
        <nav className="dashboard-navigation">
          <p className="dashboard-navigation-label">CORE</p>

          <Link
            href="/dashboard?view=scheduled"
            className={`dashboard-nav-item ${
              isScheduledActive ? "active" : ""
            }`}
          >
            <span className="dashboard-nav-left">
              <Clock />
              <span>Scheduled</span>
            </span>

            {scheduledCount > 0 && (
              <span className="dashboard-nav-count">{scheduledCount}</span>
            )}
          </Link>

          <Link
            href="/dashboard?view=sent"
            className={`dashboard-nav-item ${isSentActive ? "active" : ""}`}
          >
            <span className="dashboard-nav-left">
              <Send />
              <span>Sent</span>
            </span>

            {sentCount > 0 && (
              <span className="dashboard-nav-count">{sentCount}</span>
            )}
          </Link>
        </nav>
      </div>
    </aside>
  );
}
