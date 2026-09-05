"use client";

import type { EmailListItem } from "@/lib/types";
import Spinner from "../ui/Spinner";
import EmptyState from "./EmptyState";
import Link from "next/link";
import { Star, Clock } from "lucide-react";
import "./dashboard.css";
interface EmailTableProps {
  emails: EmailListItem[];
  loading: boolean;
  type: "scheduled" | "sent";
}

function formatCustomDate(date: string) {
  const d = new Date(date);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = days[d.getDay()];
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const seconds = d.getSeconds().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${dayName} ${hours}:${minutes}:${seconds} ${ampm}`;
}

export default function EmailTable({ emails, loading, type }: EmailTableProps) {
  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <EmptyState
        title={type === "scheduled" ? "No scheduled emails" : "No sent emails"}
        description={
          type === "scheduled"
            ? "Emails you schedule will appear here."
            : "Emails that have been processed will appear here."
        }
      />
    );
  }

  return (
    <div className="email-table">
      {emails.map((email) => {
        const dateToUse =
          type === "scheduled"
            ? email.scheduledAt
            : (email.sentAt ?? email.scheduledAt);

        const namePart = email.recipient.split("@")[0];

        const displayName = namePart
          .split(/[._-]/)
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");
        return (
          <Link
            href={`/dashboard/emails/${email.id}`}
            key={email.id}
            className="email-row"
          >
            {/* Recipient */}
            <div className="email-recipient">To: {displayName}</div>

            {/* Date / Status */}
            <div className="email-date-wrapper">
              <div
                className={
                  type === "scheduled"
                    ? "email-date email-date-scheduled"
                    : "email-date email-date-sent"
                }
              >
                {type === "scheduled" && <Clock />}
                <span>{formatCustomDate(dateToUse)}</span>
              </div>
            </div>

            {/* Subject + Preview */}
            <div className="email-content">
              <span className="email-subject">{email.subject}</span>

              <span className="email-preview">
                {" "}
                - Hi {displayName}, just wanted to follow up on our meeting...
              </span>
            </div>

            {/* Star */}
            <div className="email-star-wrapper">
              <Star className="email-star" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
