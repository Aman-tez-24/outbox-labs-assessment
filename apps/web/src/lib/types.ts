export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export type EmailStatus =
  | "scheduled"
  | "processing"
  | "sent"
  | "failed";

export interface EmailListItem {
  id: string;
  recipient: string;
  subject: string;
  scheduledAt: string;
  sentAt: string | null;
  status: EmailStatus;
  errorMessage: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedEmailsResponse {
  emails: EmailListItem[];
  pagination: Pagination;
}

export interface Sender {
  id: string;
  name: string;
  email: string;
}