"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { apiFetch } from "@/lib/api";
import "./email-details.css";

interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string | null;
  size: number;
  url: string;
}

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

  attachments: EmailAttachment[];

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
function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
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

        setEmail({
          ...response.email,
          attachments: response.email.attachments ?? [],
        });
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
      <main className="email-details-loading">
        <p>Loading email...</p>
      </main>
    );
  }

  if (error || !email) {
    return (
      <main className="email-details-error-page">
        <div className="email-details-error-container">
          <Link href="/dashboard" className="email-details-back-link">
            ← Back to dashboard
          </Link>

          <div className="email-details-error-box">
            {error ?? "Email not found."}
          </div>
        </div>
      </main>
    );
  }

  const displayDate =
    email.status === "sent" && email.sentAt ? email.sentAt : email.scheduledAt;

  return (
    <main className="email-details-page">
      {/* Header */}
      <header className="email-details-header">
        <div className="email-details-header-left">
          <Link
            href="/dashboard"
            className="email-details-back-button"
            aria-label="Back to dashboard"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>

          <h1 className="email-details-title">{email.subject}</h1>
        </div>

        <div className="email-details-header-right">
          <div className="email-details-actions">
            <button type="button" aria-label="Star email">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>

            <button type="button" aria-label="Archive email">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="21 8 21 21 3 21 3 8" />
                <rect x="1" y="3" width="22" height="5" />
                <line x1="10" y1="12" x2="14" y2="12" />
              </svg>
            </button>

            <button type="button" aria-label="Delete email">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>

          <div className="email-details-profile">
            <div className="email-details-profile-fallback">
              {email.campaign.sender.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Email */}
      <section className="email-details-container">
        <div className="email-details-meta">
          <div className="email-details-sender">
            <div className="email-details-sender-avatar">
              {email.campaign.sender.name.charAt(0).toUpperCase()}
            </div>

            <div className="email-details-sender-info">
              <div className="email-details-sender-name-row">
                <span className="email-details-sender-name">
                  {email.campaign.sender.name}
                </span>

                <span className="email-details-sender-email">
                  &lt;{email.campaign.sender.email}&gt;
                </span>
              </div>

              <div className="email-details-to">
                to {email.recipient}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          <div className="email-details-date">{formatDate(displayDate)}</div>
        </div>

        {/* Status */}
        <div className="email-details-status-row">
          <span className={`email-details-status email-status-${email.status}`}>
            {email.status}
          </span>

          {email.status === "scheduled" && (
            <span className="email-details-scheduled-label">
              Scheduled for {formatDate(email.scheduledAt)}
            </span>
          )}
        </div>

        {/* Body */}
        <div
          className="email-details-body"
          dangerouslySetInnerHTML={{ __html: email.body }}
        />

        {/* Attachments */}
        {email.attachments.length > 0 && (
          <div className="email-details-attachments">
            {email.attachments.map((attachment) => {
              const isImage = attachment.contentType?.startsWith("image/");

              return (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="email-attachment"
                >
                  <div className="email-attachment-preview">
                    {isImage ? (
                      <img src={attachment.url} alt={attachment.filename} />
                    ) : (
                      <div className="email-attachment-file">
                        <span>FILE</span>
                      </div>
                    )}
                  </div>

                  <div className="email-attachment-info">
                    <p>{attachment.filename}</p>
                    <span>{formatFileSize(attachment.size)}</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* Delivery Error */}
        {email.errorMessage && (
          <div className="email-details-delivery-error">
            <p>Delivery error</p>
            <span>{email.errorMessage}</span>
          </div>
        )}
      </section>
    </main>
  );
}
