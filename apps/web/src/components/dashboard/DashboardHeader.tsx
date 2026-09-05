"use client";

import Image from "next/image";
import { LogOut } from "lucide-react";
import type { User } from "@/lib/types";
import "./dashboard.css";
interface DashboardHeaderProps {
  user: User;
  onLogout: () => void;
}

export default function DashboardHeader({
  user,
  onLogout,
}: DashboardHeaderProps) {
  return (
    // lg:hidden ensures this disappears on desktop to match the screenshot
    <header className="mobile-dashboard-header">
      <div className="mobile-dashboard-logo">ONE</div>

      <div className="mobile-dashboard-user">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.name}
            width={32}
            height={32}
            className="mobile-dashboard-avatar"
          />
        ) : (
          <div className="mobile-dashboard-avatar-fallback">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="mobile-dashboard-user-info">
          <p>{user.name}</p>
          <span>{user.email}</span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          title="Logout"
          className="mobile-dashboard-logout"
        >
          <LogOut />
        </button>
      </div>
    </header>
  );
}
