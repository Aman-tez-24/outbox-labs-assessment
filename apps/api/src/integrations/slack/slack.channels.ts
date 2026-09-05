import { createSlackClient } from "./slack.client.js";
import { decrypt } from "../../utils/encryption.js";
import { getSlackConnection } from "../../services/slack.service.js";

export interface SlackChannel {
  id: string;
  name: string;
}

export async function listSlackChannels(
  userId: string,
): Promise<SlackChannel[]> {
  const connection =
    await getSlackConnection(userId);

  if (!connection) {
    return [];
  }

  const client = createSlackClient(
    decrypt(connection.accessToken),
  );

  const response =
    await client.conversations.list({
      types: "public_channel,private_channel",
      exclude_archived: true,
      limit: 200,
    });

  return (
    response.channels
      ?.filter(
        (channel) =>
          Boolean(channel.id) &&
          Boolean(channel.name),
      )
      .map((channel) => ({
        id: channel.id!,
        name: channel.name!,
      })) ?? []
  );
}