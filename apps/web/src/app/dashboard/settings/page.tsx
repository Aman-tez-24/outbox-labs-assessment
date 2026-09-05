"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

interface SlackConnection {
  connected: boolean;
  teamName?: string;
  channelId?: string | null;
  channelName?: string | null;
}

interface SlackChannel {
  id: string;
  name: string;
}

export default function SettingsPage() {
  const [slack, setSlack] = useState<SlackConnection | null>(null);

  const [channels, setChannels] = useState<SlackChannel[]>([]);

  const [selectedChannel, setSelectedChannel] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  async function loadSlack() {
    try {
      const response = await apiFetch<SlackConnection>("/api/slack/connection");

      setSlack(response);

      if (response.channelId) {
        setSelectedChannel(response.channelId);
      }

      if (response.connected) {
        const channelResponse = await apiFetch<{
          channels: SlackChannel[];
        }>("/api/slack/channels");

        setChannels(channelResponse.channels);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load Slack settings.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlack();
  }, []);

  async function disconnect() {
    setMessage(null);

    try {
      await apiFetch("/api/slack/connection", {
        method: "DELETE",
      });

      setSlack({
        connected: false,
      });

      setChannels([]);
      setSelectedChannel("");

      setMessage("Slack disconnected successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to disconnect Slack.",
      );
    }
  }

  async function saveChannel() {
    if (!selectedChannel) {
      return;
    }

    const channel = channels.find((item) => item.id === selectedChannel);

    if (!channel) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await apiFetch("/api/slack/channel", {
        method: "POST",
        body: JSON.stringify({
          channelId: channel.id,
          channelName: channel.name,
        }),
      });

      setSlack((current) =>
        current
          ? {
              ...current,
              channelId: channel.id,
              channelName: channel.name,
            }
          : current,
      );

      setMessage("Notification channel saved.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save channel.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-500">Loading settings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <Link
          href="/dashboard"
          className="text-sm text-neutral-500 hover:text-neutral-950"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-8">
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
            Settings
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
            Notifications
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Configure Slack notifications for email rate-limit events.
          </p>
        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
            {message}
          </div>
        )}

        <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold text-neutral-950">Slack</h2>

              <p className="mt-1 text-sm text-neutral-500">
                Receive an alert whenever an email sender reaches its hourly
                limit.
              </p>
            </div>

            {slack?.connected ? (
              <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
                Connected
              </span>
            ) : (
              <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-500">
                Not connected
              </span>
            )}
          </div>

          {!slack?.connected ? (
            <a
              href="http://localhost:4000/api/slack/oauth/start"
              className="mt-6 inline-flex rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Connect Slack
            </a>
          ) : (
            <>
              <div className="mt-6 rounded-xl bg-neutral-50 p-4">
                <p className="text-xs uppercase tracking-wide text-neutral-400">
                  Workspace
                </p>

                <p className="mt-1 text-sm font-medium text-neutral-900">
                  {slack.teamName}
                </p>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="slack-channel"
                  className="mb-2 block text-sm font-medium text-neutral-800"
                >
                  Notification channel
                </label>

                <select
                  id="slack-channel"
                  value={selectedChannel}
                  onChange={(event) => setSelectedChannel(event.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-500"
                >
                  <option value="">Select a channel</option>

                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={saving || !selectedChannel}
                  onClick={saveChannel}
                  className="mt-3 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save channel"}
                </button>
              </div>

              <div className="mt-8 border-t border-neutral-100 pt-6">
                <button
                  type="button"
                  onClick={disconnect}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Disconnect Slack
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
