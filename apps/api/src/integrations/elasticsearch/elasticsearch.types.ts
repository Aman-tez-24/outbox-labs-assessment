export interface EmailSearchDocument {
  emailId: string;
  userId: string;
  campaignId: string;
  senderId: string;

  recipient: string;
  subject: string;
  body: string;

  scheduledAt: string;
  sentAt: string | null;

  status: "scheduled" | "processing" | "sent" | "failed";

  createdAt: string;
  updatedAt: string;
}