export interface CreateCampaignInput {
  senderId: string;
  subject: string;
  body: string;

  startTime: string;
  delayMs: number;
  hourlyLimit: number;

  leads: string[];
}

export interface CampaignResponse {
  campaignId: string;
  totalEmails: number;
  startTime: string;
  delayMs: number;
  hourlyLimit: number;
}