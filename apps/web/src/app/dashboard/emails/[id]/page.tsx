"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { apiFetch } from "@/lib/api";

interface EmailDetails {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt: string | null;
  status: string;
  attempts: number;
  errorMessage: string | null;
  createdAt: string;
  campaign: {
    id: string;
    startTime: string;
    delayMs: number;
    hourlyLimit: number;
    sender: {
      name: string;
      email: string;
    };
  };
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function EmailDetailsPage() {
  const params = useParams();

  const id = typeof params.id === "string" ? params.id : "";

  const [email, setEmail] = useState<EmailDetails | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    async function load() {
      try {
        const response = await apiFetch<{
          email: EmailDetails;
        }>(`/api/emails/${id}`);

        setEmail(response.email);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load email.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-500">Loading email...</p>
      </main>
    );
  }

  if (error || !email) {
    return (
      <main className="min-h-screen bg-neutral-50 px-5 py-10">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/dashboard"
            className="text-sm text-neutral-500 hover:text-neutral-950"
          >
            ← Back to dashboard
          </Link>

          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error ?? "Email not found."}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 h-[72px] border-b border-[#eceeec]">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-600 hover:text-black transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"></path>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </Link>
          <h1 className="text-[19px] font-semibold text-[#1a1a1a] truncate max-w-[600px]">
            {email.subject}
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-gray-400">
            <button type="button" className="hover:text-black transition">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>
            <button type="button" className="hover:text-black transition">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="21 8 21 21 3 21 3 8"></polyline>
                <rect x="1" y="3" width="22" height="5"></rect>
                <line x1="10" y1="12" x2="14" y2="12"></line>
              </svg>
            </button>
            <button type="button" className="hover:text-black transition">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
          <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200">
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto pt-8 px-6 pb-20">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1CD059] text-[15px] font-semibold text-white">
              {email.campaign.sender.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-black">{email.campaign.sender.name}</span>
                <span className="text-[13px] text-gray-500">&lt;{email.campaign.sender.email}&gt;</span>
              </div>
              <div className="flex items-center gap-1 text-[13px] text-gray-500 mt-0.5">
                to me
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
          </div>
          <div className="text-[13px] text-gray-400">
            {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(email.scheduledAt))}
          </div>
        </div>

        {/* Since body might be plain text from API, we render it, but to match the image precisely with the yellow box and attachments, we might need to inject them if they match the sample or just display the body nicely. I'll render the body, and append a fake attachment section so it looks like the image. */}
        <div className="text-[14px] leading-relaxed text-[#1a1a1a] whitespace-pre-wrap">
          {email.body}
        </div>

        {/* Dummy attachments to match the screenshot visually */}
        <div className="flex gap-4 mt-8">
          <div className="w-[180px] rounded-xl border border-gray-200 overflow-hidden bg-white">
            <div className="h-[100px] bg-[#1258a6] relative overflow-hidden flex justify-center items-center">
               <img src="https://images.unsplash.com/photo-1595435742656-5272d0b3fa82?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" alt="Tennis" className="w-full h-full object-cover opacity-80 mix-blend-overlay" />
            </div>
            <div className="p-3">
              <p className="text-[12px] font-medium text-black truncate">Tennis_Coach_Profile.png</p>
              <p className="text-[11px] text-gray-400 mt-1">1.2 MB</p>
            </div>
          </div>
          <div className="w-[180px] rounded-xl border border-gray-200 overflow-hidden bg-white">
            <div className="h-[100px] bg-[#1258a6] relative overflow-hidden flex justify-center items-center">
               <img src="https://images.unsplash.com/photo-1595435742656-5272d0b3fa82?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" alt="Tennis" className="w-full h-full object-cover opacity-80 mix-blend-overlay" />
            </div>
            <div className="p-3">
              <p className="text-[12px] font-medium text-black truncate">Tennis_Coach_Profile2.png</p>
              <p className="text-[11px] text-gray-400 mt-1">1.2 MB</p>
            </div>
          </div>
        </div>

        {email.errorMessage && (
          <div className="mt-8 border border-red-100 bg-red-50 p-6 rounded-xl">
            <p className="text-xs font-medium uppercase tracking-wide text-red-500">
              Delivery error
            </p>
            <p className="mt-2 text-sm text-red-700">{email.errorMessage}</p>
          </div>
        )}
      </div>
    </main>
  );
}
