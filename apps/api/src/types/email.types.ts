export interface EmailListItem {
  id: string;
  recipient: string;
  subject: string;
  scheduledAt: string;
  sentAt: string | null;
  status: "scheduled" | "processing" | "sent" | "failed";
  errorMessage: string | null;
}

export interface PaginatedEmailsResponse {
  emails: EmailListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}