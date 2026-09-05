"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

import EmailTable from "@/components/dashboard/EmailTable";
import EmailSearch from "@/components/dashboard/EmailSearch";
import Pagination from "@/components/dashboard/Pagination";

import { apiFetch } from "@/lib/api";

import type { PaginatedEmailsResponse, User } from "@/lib/types";

import "../globals.css";
type View = "overview" | "scheduled" | "sent";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const viewParam = searchParams.get("view");

  const activeView: View =
    viewParam === "scheduled"
      ? "scheduled"
      : viewParam === "sent"
        ? "sent"
        : "overview";

  const [user, setUser] = useState<User | null>(null);

  const [scheduled, setScheduled] = useState<PaginatedEmailsResponse | null>(
    null,
  );

  const [sent, setSent] = useState<PaginatedEmailsResponse | null>(null);

  const [scheduledPage, setScheduledPage] = useState(1);

  const [sentPage, setSentPage] = useState(1);

  const [search, setSearch] = useState("");

  const [loadingUser, setLoadingUser] = useState(true);

  const [loadingScheduled, setLoadingScheduled] = useState(true);

  const [loadingSent, setLoadingSent] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const loadEmails = useCallback(async () => {
    try {
      setError(null);

      setLoadingScheduled(true);
      setLoadingSent(true);

      const [scheduledResponse, sentResponse] = await Promise.all([
        apiFetch<PaginatedEmailsResponse>("/api/emails/scheduled", {
          params: {
            page: scheduledPage,
            limit: 20,
            q: search || undefined,
          },
        }),

        apiFetch<PaginatedEmailsResponse>("/api/emails/sent", {
          params: {
            page: sentPage,
            limit: 20,
            q: search || undefined,
          },
        }),
      ]);

      setScheduled(scheduledResponse);

      setSent(sentResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load emails.");
    } finally {
      setLoadingScheduled(false);
      setLoadingSent(false);
    }
  }, [scheduledPage, sentPage, search]);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await apiFetch<{
          user: User;
        }>("/api/user/me");

        setUser(response.user);
      } catch {
        router.replace("/login");
      } finally {
        setLoadingUser(false);
      }
    }

    loadUser();
  }, [router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    loadEmails();
  }, [user, loadEmails]);

  function handleSearch(value: string) {
    setSearch(value);
    setScheduledPage(1);
    setSentPage(1);
  }

  async function handleLogout() {
    try {
      await apiFetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  if (loadingUser || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-500">Loading dashboard...</p>
      </main>
    );
  }

  const scheduledCount = scheduled?.pagination.total ?? 0;

  const sentCount = sent?.pagination.total ?? 0;

  const showScheduled = activeView === "overview" || activeView === "scheduled";

  const showSent = activeView === "overview" || activeView === "sent";

  return (
    <main className="dashboard-layout">
      <DashboardSidebar
        user={user}
        scheduledCount={scheduledCount}
        sentCount={sentCount}
      />

      <div className="dashboard-main">
        <DashboardHeader user={user} onLogout={handleLogout} />

        <div className="dashboard-content">
          {error && <div className="dashboard-error">{error}</div>}

          <div className="dashboard-toolbar">
            <div className="search-bar">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#999"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search"
                className="search-input"
              />
            </div>

            <div className="toolbar-actions">
              <button className="toolbar-btn">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
              </button>
              <button className="toolbar-btn">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 2v6h-6"></path>
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 2v6h6"></path>
                </svg>
              </button>
            </div>
          </div>

          <div className="email-list-container">
            {activeView === "scheduled" && (
              <EmailTable
                emails={scheduled?.emails ?? []}
                loading={loadingScheduled}
                type="scheduled"
              />
            )}
            {activeView === "sent" && (
              <EmailTable
                emails={sent?.emails ?? []}
                loading={loadingSent}
                type="sent"
              />
            )}
            {activeView === "overview" && (
              <>
                <EmailTable
                  emails={scheduled?.emails ?? []}
                  loading={loadingScheduled}
                  type="scheduled"
                />
                <EmailTable
                  emails={sent?.emails ?? []}
                  loading={loadingSent}
                  type="sent"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
