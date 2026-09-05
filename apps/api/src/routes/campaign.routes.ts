import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  createCampaignController,
} from "../controllers/campaign.controller.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  createCampaignController,
);

export default router;