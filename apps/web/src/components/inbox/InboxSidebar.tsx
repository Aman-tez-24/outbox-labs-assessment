"use client";

import {
  CalendarClock,
  ChevronDown,
  Inbox,
  Plus,
  Send,
  Settings,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface User {
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface InboxSidebarProps {
  user: User;
}

export default function InboxSidebar({ user }: InboxSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentView = searchParams.get("view") || "scheduled";

  const navigate = (view: string) => {
    router.push(`/dashboard?view=${view}`);
  };

  return (
    <aside className="inbox-sidebar">
      <div className="sidebar-logo">ONB</div>

      <div className="sidebar-user">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="sidebar-avatar" />
        ) : (
          <div className="sidebar-avatar sidebar-avatar-fallback">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user.name}</div>

          <div className="sidebar-user-email">{user.email}</div>
        </div>

        <ChevronDown size={12} />
      </div>

      <button
        className="compose-button"
        onClick={() => router.push("/dashboard/compose")}
      >
        <Plus size={14} />
        Compose
      </button>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-nav-item ${
            currentView === "scheduled" ? "active" : ""
          }`}
          onClick={() => navigate("scheduled")}
        >
          <CalendarClock size={13} />
          <span>Scheduled</span>
        </button>

        <button
          className={`sidebar-nav-item ${
            currentView === "sent" ? "active" : ""
          }`}
          onClick={() => navigate("sent")}
        >
          <Send size={13} />
          <span>Sent</span>
        </button>
      </nav>

      <div className="sidebar-bottom">
        <button
          className={`sidebar-nav-item ${
            pathname === "/dashboard/settings" ? "active" : ""
          }`}
          onClick={() => router.push("/dashboard/settings")}
        >
          <Settings size={13} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
