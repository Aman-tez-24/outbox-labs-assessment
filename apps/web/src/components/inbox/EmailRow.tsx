"use client";
import { ChevronRight } from "lucide-react";
export interface InboxEmail {
  id: string;
  recipient: string;
  subject: string;
  scheduledAt: string;
  sentAt?: string | null;
  status: string;
}
interface EmailRowProps {
  email: InboxEmail;
  type: "scheduled" | "sent";
  onClick: () => void;
}
function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}
export default function EmailRow({ email, type, onClick }: EmailRowProps) {
  const scheduledTime = new Date(email.scheduledAt).getTime();
  const hasReachedScheduledTime =
    type === "scheduled" && scheduledTime <= Date.now();
  const displayType =
    type === "sent" || hasReachedScheduledTime ? "sent" : "scheduled";
  const date =
    displayType === "sent"
      ? email.sentAt || email.scheduledAt
      : email.scheduledAt;
  return (
    <button type="button" className="email-row" onClick={onClick}>
      {" "}
      <div className="email-recipient">
        {" "}
        <span className={`email-status-dot ${displayType}`} />{" "}
        <span>{email.recipient}</span>{" "}
      </div>{" "}
      <div className="email-subject">
        {" "}
        <span>{email.subject || "(No subject)"}</span>{" "}
      </div>{" "}
      <div className="email-date"> {date ? formatDate(date) : "—"} </div>{" "}
      <ChevronRight size={12} className="email-chevron" />{" "}
    </button>
  );
}
