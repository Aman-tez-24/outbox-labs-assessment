import { elasticsearch, EMAIL_INDEX } from "../integrations/elasticsearch/elasticsearch.client.js";
import type { EmailSearchDocument } from "../integrations/elasticsearch/elasticsearch.types.js";

export async function ensureEmailIndex(): Promise<void> {
  try {
    const exists = await elasticsearch.indices.exists({
      index: EMAIL_INDEX,
    });

    if (exists) {
      return;
    }

    await elasticsearch.indices.create({
      index: EMAIL_INDEX,
      mappings: {
        properties: {
          emailId: { type: "keyword" },
          userId: { type: "keyword" },
          campaignId: { type: "keyword" },
          senderId: { type: "keyword" },

          recipient: {
            type: "text",
            fields: {
              keyword: {
                type: "keyword",
              },
            },
          },

          subject: {
            type: "text",
            fields: {
              keyword: {
                type: "keyword",
              },
            },
          },

          body: {
            type: "text",
          },

          scheduledAt: {
            type: "date",
          },

          sentAt: {
            type: "date",
          },

          status: {
            type: "keyword",
          },

          createdAt: {
            type: "date",
          },

          updatedAt: {
            type: "date",
          },
        },
      },
    });

    console.log(
      `Elasticsearch index "${EMAIL_INDEX}" created`,
    );
  } catch (error) {
    console.error(
      "Elasticsearch unavailable. Starting API without search index:",
      error,
    );
  }
}

export async function indexEmail(
  document: EmailSearchDocument,
): Promise<void> {
  try {
    await elasticsearch.index({
      index: EMAIL_INDEX,
      id: document.emailId,
      document,
      refresh: false,
    });
  } catch (error) {
    console.error(
      `Failed to index email ${document.emailId} in Elasticsearch:`,
      error,
    );
  }
}

export interface EmailSearchResult {
  emailId: string;
  userId: string;
  campaignId: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function searchEmails(
  userId: string,
  query: string,
  page = 1,
  limit = 20,
) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);

  const result = await elasticsearch.search<EmailSearchDocument>({
    index: EMAIL_INDEX,
    from: (safePage - 1) * safeLimit,
    size: safeLimit,

    query: {
      bool: {
        must: query.trim()
          ? [
              {
                multi_match: {
                  query: query.trim(),
                  fields: [
                    "recipient^3",
                    "subject^3",
                    "body",
                  ],
                  fuzziness: "AUTO",
                },
              },
            ]
          : [
              {
                match_all: {},
              },
            ],

        filter: [
          {
            term: {
              userId,
            },
          },
        ],
      },
    },

    sort: [
      {
        createdAt: {
          order: "desc",
        },
      },
    ],
  });

  return {
    total:
      typeof result.hits.total === "number"
        ? result.hits.total
        : result.hits.total?.value ?? 0,

    page: safePage,
    limit: safeLimit,

    results: result.hits.hits
      .map((hit) => hit._source)
      .filter(
        (email): email is EmailSearchDocument =>
          email !== undefined,
      ),
  };
}