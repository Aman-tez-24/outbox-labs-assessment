import { WebClient } from "@slack/web-api";
import { prisma } from "../config/prisma.js";

export interface SaveSlackConnectionInput {
  userId: string;
  teamId: string;
  teamName: string;
  accessToken: string;
}

export async function saveSlackConnection(
  input: SaveSlackConnectionInput
) {
  return prisma.slackConnection.upsert({
    where: {
      userId: input.userId,
    },

    create: {
      userId: input.userId,
      teamId: input.teamId,
      teamName: input.teamName,
      accessToken: input.accessToken,
    },

    update: {
      teamId: input.teamId,
      teamName: input.teamName,
      accessToken: input.accessToken,
    },
  });
}

export async function getSlackConnection(
  userId: string
) {
  return prisma.slackConnection.findUnique({
    where: {
      userId,
    },
  });
}

export async function disconnectSlack(
  userId: string
) {
  return prisma.slackConnection.deleteMany({
    where: {
      userId,
    },
  });
}

export async function setSlackChannel(
  userId: string,
  channelId: string,
  channelName?: string
) {
  return prisma.slackConnection.update({
    where: {
      userId,
    },

    data: {
      channelId,
      channelName: channelName ?? null,
    },
  });
}

export async function sendSlackNotification(
  userId: string,
  message: string
): Promise<boolean> {
  try {
    const connection =
      await getSlackConnection(userId);

    if (!connection) {
      console.warn(
        `Slack is not connected for user ${userId}`
      );

      return false;
    }

    if (!connection.channelId) {
      console.warn(
        `Slack channel is not configured for user ${userId}`
      );

      return false;
    }

    const client = new WebClient(
      connection.accessToken
    );

    const result =
      await client.chat.postMessage({
        channel: connection.channelId,
        text: message,
      });

    return result.ok === true;
  } catch (error) {
    console.error(
      "Slack notification failed:",
      error
    );

    return false;
  }
}