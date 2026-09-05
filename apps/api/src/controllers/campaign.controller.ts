import type { Request, Response } from "express";
import { createCampaign } from "../services/campaign.service.js";

export async function createCampaignController(
  req: Request,
  res: Response,
) {
  try {
    const result = await createCampaign(
      req.user!.id,
      req.body,
    );

    return res.status(201).json(result);
  } catch (error) {
    console.error(
      "Create campaign error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create campaign";

    return res.status(400).json({
      message,
    });
  }
}