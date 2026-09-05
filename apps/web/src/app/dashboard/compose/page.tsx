"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "./compose.css";
import { apiFetch } from "@/lib/api";
import type { Sender, User } from "@/lib/types";

interface CampaignResponse {
  campaignId: string;
  totalEmails: number;
  startTime: string;
  delayMs: number;
  hourlyLimit: number;
}

interface UserResponse {
  user?: User;
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

export default function ComposePage() {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [activeFormat, setActiveFormat] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [senderId, setSenderId] = useState("");
  const recipientFileInputRef = useRef<HTMLInputElement | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [leads, setLeads] = useState<string[]>([]);
  const [pasteLeads, setPasteLeads] = useState("");

  const [startTime, setStartTime] = useState("");
  const [delaySeconds, setDelaySeconds] = useState("2");
  const [hourlyLimit, setHourlyLimit] = useState("200");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      console.log("[Compose] Loading started");

      // Load user independently
      try {
        const response = await withTimeout(
          apiFetch<UserResponse | User>("/api/user/me"),
          8000,
          "Loading user information timed out.",
        );

        if (!mounted) return;

        const loadedUser =
          "user" in response && response.user
            ? response.user
            : (response as User);

        setUser(loadedUser);

        console.log("[Compose] User loaded");
      } catch (err) {
        console.error("[Compose] User loading failed:", err);

        if (!mounted) return;

        const message =
          err instanceof Error ? err.message : "Unable to load your account.";

        if (
          message.toLowerCase().includes("unauthorized") ||
          message.includes("401")
        ) {
          router.replace("/login");
          return;
        }

        setError(message);
      }

      // Load senders independently
      // Load senders independently
      try {
        const senderResponse = await withTimeout(
          apiFetch<Sender[] | { senders: Sender[] } | { data: Sender[] }>(
            "/api/senders",
          ),
          8000,
          "Loading senders timed out.",
        );

        if (!mounted) return;

        let senderList: Sender[] = [];

        if (Array.isArray(senderResponse)) {
          senderList = senderResponse;
        } else if (
          senderResponse &&
          "senders" in senderResponse &&
          Array.isArray(senderResponse.senders)
        ) {
          senderList = senderResponse.senders;
        } else if (
          senderResponse &&
          "data" in senderResponse &&
          Array.isArray(senderResponse.data)
        ) {
          senderList = senderResponse.data;
        }

        setSenders(senderList);

        if (senderList.length > 0) {
          setSenderId(senderList[0].id);
        }

        console.log("[Compose] Senders loaded:", senderList);
      } catch (err) {
        console.error("[Compose] Sender loading failed:", err);

        if (!mounted) return;

        const message =
          err instanceof Error ? err.message : "Unable to load senders.";

        if (
          message.toLowerCase().includes("unauthorized") ||
          message.includes("401")
        ) {
          router.replace("/login");
          return;
        }

        setError(
          "Unable to load your senders. Please check the sender configuration.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
          console.log("[Compose] Loading finished");
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [router]);

  const totalLeads = leads.length;

  const estimatedFinishTime = useMemo(() => {
    if (!startTime || totalLeads === 0) {
      return null;
    }

    const start = new Date(startTime);

    if (Number.isNaN(start.getTime())) {
      return null;
    }

    const delayMs = Math.max(0, Number.parseInt(delaySeconds, 10) || 0) * 1000;

    return new Date(start.getTime() + Math.max(0, totalLeads - 1) * delayMs);
  }, [startTime, totalLeads, delaySeconds]);

  function parsePastedLeads(value: string) {
    const emails = value
      .split(/[\s,;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    const valid = emails.filter((email) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    );

    setLeads([...new Set(valid)]);
  }
  function focusEditor() {
    editorRef.current?.focus();
  }

  function execEditorCommand(command: string, value?: string) {
    focusEditor();

    document.execCommand(command, false, value);

    if (editorRef.current) {
      setBody(editorRef.current.innerHTML);
    }

    setActiveFormat(command);
  }

  function handleEditorInput() {
    if (!editorRef.current) return;

    setBody(editorRef.current.innerHTML);
  }

  function toggleFormat(command: string) {
    execEditorCommand(command);
  }

  function insertLink() {
    focusEditor();

    const url = window.prompt("Enter URL");

    if (!url) return;

    document.execCommand("createLink", false, url);

    if (editorRef.current) {
      setBody(editorRef.current.innerHTML);
    }
  }

  function insertQuote() {
    focusEditor();

    document.execCommand("formatBlock", false, "blockquote");

    if (editorRef.current) {
      setBody(editorRef.current.innerHTML);
    }
  }
  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const content = String(reader.result ?? "");

      const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        setLeads([]);
        return;
      }

      const headerIndex = lines.findIndex((line) =>
        line
          .split(",")
          .some((column) => column.trim().toLowerCase() === "email"),
      );

      if (headerIndex >= 0) {
        const headers = lines[headerIndex]
          .split(",")
          .map((header) => header.trim().toLowerCase());

        const emailIndex = headers.indexOf("email");

        const parsed = lines
          .slice(headerIndex + 1)
          .map((line) => line.split(",")[emailIndex]?.trim() ?? "")
          .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          .map((email) => email.toLowerCase());

        setLeads([...new Set(parsed)]);
        return;
      }

      const parsed = lines
        .flatMap((line) => line.split(","))
        .map((email) => email.trim().toLowerCase())
        .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

      setLeads([...new Set(parsed)]);
    };

    reader.readAsText(file);
    event.target.value = "";
  }
  function addManualLead(event: React.KeyboardEvent<HTMLInputElement>) {
    const input = event.currentTarget;

    if (event.key !== "Enter" && event.key !== ",") {
      return;
    }

    event.preventDefault();

    const value = input.value.trim().replace(/,$/, "");

    if (!value) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(value)) {
      setError(`Invalid email address: ${value}`);
      return;
    }

    if (leads.includes(value.toLowerCase())) {
      input.value = "";
      return;
    }

    setLeads((current) => [...current, value.toLowerCase()]);
    input.value = "";
    setError(null);
  }
  async function handleSchedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    if (!senderId) {
      setError("Please select a sender.");
      return;
    }

    if (!subject.trim()) {
      setError("Please enter a subject.");
      return;
    }

    if (!body.trim()) {
      setError("Please enter an email body.");
      return;
    }

    if (leads.length === 0) {
      setError("Please add at least one recipient.");
      return;
    }

    if (!startTime) {
      setError("Please select a start time.");
      return;
    }

    const start = new Date(startTime);

    if (Number.isNaN(start.getTime())) {
      setError("Invalid start time.");
      return;
    }

    if (start.getTime() < Date.now()) {
      setError("Start time must be in the future.");
      return;
    }

    const delayMs = Math.max(0, Number.parseInt(delaySeconds, 10) || 0) * 1000;

    const limit = Number.parseInt(hourlyLimit, 10) || 0;

    if (limit <= 0) {
      setError("Hourly limit must be greater than 0.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await apiFetch<CampaignResponse>("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({
          senderId,
          subject: subject.trim(),
          body: body.trim(),
          startTime: start.toISOString(),
          delayMs,
          hourlyLimit: limit,
          leads,
        }),
      });

      setSuccess(
        `Campaign scheduled successfully. ${response.totalEmails} emails added to the queue.`,
      );

      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to schedule campaign.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-[#3CA76E]" />
          <p className="text-sm text-neutral-500">Loading compose...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="compose-page">
      <div className="compose-header">
        <div className="compose-header-left">
          <Link
            href="/dashboard"
            className="compose-back"
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

          <h1 className="compose-title">Compose New Email</h1>
        </div>

        <div className="compose-header-actions">
          <label
            className="compose-icon-button compose-file-button"
            title="Upload recipients"
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
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>

            <input
              type="file"
              accept=".csv,.txt"
              className="compose-hidden-input"
              onChange={handleFileUpload}
            />
          </label>

          <button
            type="button"
            className="compose-icon-button"
            title="Schedule email"
            onClick={() => {
              const tomorrow = new Date();

              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(9, 0, 0, 0);

              const formatted = new Date(
                tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000,
              )
                .toISOString()
                .slice(0, 16);

              setStartTime(formatted);
            }}
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
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>

          <button
            type="submit"
            form="compose-form"
            disabled={submitting || senders.length === 0}
            className="compose-send-button"
          >
            {submitting ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      <div className="compose-container">
        {error && (
          <div className="compose-alert compose-alert-error">{error}</div>
        )}

        {success && (
          <div className="compose-alert compose-alert-success">{success}</div>
        )}

        <form id="compose-form" onSubmit={handleSchedule}>
          <div className="compose-fields">
            {/* FROM */}
            <div className="compose-field">
              <span className="compose-field-label">From</span>

              <div className="compose-field-content">
                <select
                  value={senderId}
                  onChange={(event) => setSenderId(event.target.value)}
                  disabled={senders.length === 0}
                  className="compose-select"
                >
                  {senders.length === 0 ? (
                    <option value="">No sender available</option>
                  ) : (
                    senders.map((sender) => (
                      <option key={sender.id} value={sender.id}>
                        {sender.name} &lt;{sender.email}&gt;
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* TO */}
            <div className="compose-field compose-recipient-field">
              <div className="compose-field-label">To</div>

              <div className="compose-field-content">
                <div className="compose-recipient-box">
                  <div className="compose-recipient-chips">
                    {leads.slice(0, 3).map((email) => (
                      <span key={email} className="compose-recipient-chip">
                        <span className="compose-recipient-email">{email}</span>

                        <button
                          type="button"
                          className="compose-recipient-remove"
                          title={`Remove ${email}`}
                          onClick={() => {
                            setLeads((current) =>
                              current.filter((item) => item !== email),
                            );
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    {leads.length > 3 && (
                      <span className="compose-recipient-more">
                        +{leads.length - 3}
                      </span>
                    )}

                    <input
                      type="text"
                      className="compose-recipient-input"
                      placeholder={
                        leads.length === 0
                          ? "Enter email addresses..."
                          : "Add another..."
                      }
                      onKeyDown={addManualLead}
                    />
                  </div>

                  <label
                    htmlFor="recipient-csv-upload"
                    className="compose-upload-button"
                    title="Upload CSV or TXT file"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 3v12" />
                      <path d="m7 8 5-5 5 5" />
                      <path d="M5 14v4a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-4" />
                    </svg>

                    <span>Upload List</span>

                    <input
                      ref={recipientFileInputRef}
                      id="recipient-csv-upload"
                      type="file"
                      accept=".csv,.txt,text/csv,text/plain"
                      className="compose-hidden-input"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>

                {leads.length > 0 && (
                  <div className="compose-recipient-count">
                    {leads.length} recipient
                    {leads.length !== 1 ? "s" : ""} added
                  </div>
                )}
              </div>
            </div>

            {leads.length > 0 && (
              <div className="compose-recipient-count">
                {leads.length} recipient
                {leads.length === 1 ? "" : "s"} added
              </div>
            )}

            {/* SUBJECT */}
            <div className="compose-field">
              <span className="compose-field-label">Subject</span>

              <input
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Subject"
                className="compose-input"
              />
            </div>

            {/* SETTINGS */}
            <div className="compose-settings">
              <div className="compose-setting-group">
                <span className="compose-setting-label">
                  Delay between 2 emails
                </span>

                <input
                  type="number"
                  min="0"
                  value={delaySeconds}
                  onChange={(event) => setDelaySeconds(event.target.value)}
                  className="compose-number-input"
                />
              </div>

              <div className="compose-setting-group">
                <span className="compose-setting-label">Hourly Limit</span>

                <input
                  type="number"
                  min="1"
                  value={hourlyLimit}
                  onChange={(event) => setHourlyLimit(event.target.value)}
                  className="compose-number-input"
                />
              </div>
            </div>

            {estimatedFinishTime && (
              <p className="compose-estimated-time">
                Estimated completion: {estimatedFinishTime.toLocaleString()}
              </p>
            )}

            {/* EDITOR */}
            <div className="compose-editor">
              <div
                ref={editorRef}
                className="compose-rich-editor"
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Type your email..."
                onInput={handleEditorInput}
                onFocus={() => setActiveFormat(null)}
              />

              <div className="compose-toolbar">
                {/* Undo / Redo */}
                <button
                  type="button"
                  className="compose-tool"
                  title="Undo"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => execEditorCommand("undo")}
                >
                  ↶
                </button>

                <button
                  type="button"
                  className="compose-tool"
                  title="Redo"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => execEditorCommand("redo")}
                >
                  ↷
                </button>

                <span className="compose-divider" />

                {/* Font */}
                <select
                  className="compose-font-select"
                  title="Font"
                  defaultValue="Inter"
                  onChange={(event) => {
                    execEditorCommand("fontName", event.target.value);
                  }}
                >
                  <option value="Inter">Inter</option>
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Times New Roman">Times</option>
                </select>

                <span className="compose-divider" />

                {/* Bold */}
                <button
                  type="button"
                  className={`compose-tool compose-bold ${
                    activeFormat === "bold" ? "active" : ""
                  }`}
                  title="Bold"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => toggleFormat("bold")}
                >
                  B
                </button>

                {/* Italic */}
                <button
                  type="button"
                  className={`compose-tool compose-italic ${
                    activeFormat === "italic" ? "active" : ""
                  }`}
                  title="Italic"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => toggleFormat("italic")}
                >
                  I
                </button>

                {/* Underline */}
                <button
                  type="button"
                  className={`compose-tool compose-underline ${
                    activeFormat === "underline" ? "active" : ""
                  }`}
                  title="Underline"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => toggleFormat("underline")}
                >
                  U
                </button>

                <span className="compose-divider" />

                {/* Alignment */}
                <button
                  type="button"
                  className="compose-tool"
                  title="Align left"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => execEditorCommand("justifyLeft")}
                >
                  ≡
                </button>

                <button
                  type="button"
                  className="compose-tool"
                  title="Align center"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => execEditorCommand("justifyCenter")}
                >
                  ≡
                </button>

                <button
                  type="button"
                  className="compose-tool"
                  title="Align right"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => execEditorCommand("justifyRight")}
                >
                  ≡
                </button>

                <span className="compose-divider" />

                {/* Lists */}
                <button
                  type="button"
                  className="compose-tool"
                  title="Bulleted list"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => execEditorCommand("insertUnorderedList")}
                >
                  •
                </button>

                <button
                  type="button"
                  className="compose-tool"
                  title="Numbered list"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => execEditorCommand("insertOrderedList")}
                >
                  1.
                </button>

                <span className="compose-divider" />

                {/* Quote */}
                <button
                  type="button"
                  className="compose-tool compose-quote"
                  title="Quote"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={insertQuote}
                >
                  "
                </button>

                {/* Link */}
                <button
                  type="button"
                  className="compose-tool"
                  title="Insert link"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={insertLink}
                >
                  ↗
                </button>

                <span className="compose-divider" />

                {/* Clear formatting */}
                <button
                  type="button"
                  className="compose-tool"
                  title="Clear formatting"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => execEditorCommand("removeFormat")}
                >
                  Tx
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* SEND LATER */}
        <div className="compose-schedule-panel">
          <div className="compose-schedule-header">
            <div>
              <span className="compose-schedule-eyebrow">DELIVERY</span>

              <h3 className="compose-schedule-title">Send later</h3>

              <p className="compose-schedule-description">
                Choose when your campaign should start.
              </p>
            </div>

            <div className="compose-schedule-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <rect x="3" y="4" width="18" height="17" rx="3" />
                <path d="M16 2v4M8 2v4M3 10h18" />
                <path d="M12 14v3l2 1" />
              </svg>
            </div>
          </div>

          <div className="compose-selected-date">
            <div className="compose-selected-date-icon">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </div>

            <div className="compose-selected-date-content">
              <span className="compose-selected-date-label">Scheduled for</span>

              <strong>
                {startTime
                  ? new Date(startTime).toLocaleString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "Not scheduled"}
              </strong>
            </div>
          </div>

          <div className="compose-date-input-wrapper">
            <label className="compose-date-label">Custom date & time</label>

            <input
              type="datetime-local"
              value={startTime}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              onChange={(event) => setStartTime(event.target.value)}
              className="compose-date-input"
            />
          </div>

          <div className="compose-preset-heading">Quick schedule</div>

          <div className="compose-presets">
            {[
              ["Tomorrow", "9:00 AM", 9],
              ["Tomorrow", "10:00 AM", 10],
              ["Tomorrow", "11:00 AM", 11],
              ["Tomorrow", "3:00 PM", 15],
            ].map(([day, time, hour]) => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(Number(hour), 0, 0, 0);

              const value = new Date(
                tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000,
              )
                .toISOString()
                .slice(0, 16);

              const selected = startTime === value;

              return (
                <button
                  key={String(hour)}
                  type="button"
                  className={`compose-preset ${selected ? "selected" : ""}`}
                  onClick={() => setStartTime(value)}
                >
                  <span className="compose-preset-left">
                    <span className="compose-preset-day">{day}</span>

                    <span className="compose-preset-time">{time}</span>
                  </span>

                  <span className="compose-preset-check">
                    {selected ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="compose-schedule-summary">
            <div className="compose-summary-row">
              <span>Recipients</span>
              <strong>{totalLeads}</strong>
            </div>

            <div className="compose-summary-row">
              <span>Delay</span>
              <strong>{delaySeconds}s</strong>
            </div>

            <div className="compose-summary-row">
              <span>Hourly limit</span>
              <strong>{hourlyLimit}</strong>
            </div>
          </div>

          <div className="compose-schedule-actions">
            <button
              type="button"
              className="compose-cancel-button"
              onClick={() => setStartTime("")}
            >
              Clear
            </button>

            <button
              type="button"
              className="compose-done-button"
              disabled={!startTime}
              onClick={() => {
                if (!startTime) {
                  setError("Please select a start time.");
                  return;
                }

                setError(null);

                document.getElementById("compose-form")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
