import type { Request, Response } from "express";
import { createCampaign } from "../services/campaign.service.js";
import type { CreateCampaignInput } from "../types/campaign.types.js";

export async function createCampaignController(
  req: Request,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const files = Array.isArray(req.files)
      ? req.files
      : [];

    let leads: string[];

    try {
      leads =
        typeof req.body.leads === "string"
          ? JSON.parse(req.body.leads)
          : [];
    } catch {
      return res.status(400).json({
        message: "Invalid leads payload",
      });
    }

    if (!Array.isArray(leads)) {
      return res.status(400).json({
        message: "Leads must be an array",
      });
    }

    const input: CreateCampaignInput = {
      senderId: String(req.body.senderId),
      subject: String(req.body.subject),
      body: String(req.body.body),
      startTime: String(req.body.startTime),
      delayMs: Number(req.body.delayMs),
      hourlyLimit: Number(req.body.hourlyLimit),
      leads,
    };

    const result = await createCampaign(
      req.user.id,
      input,
      files,
    );

    return res.status(201).json(result);
  } catch (error) {
    console.error("Create campaign error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create campaign";

    return res.status(400).json({
      message,
    });
  }
}