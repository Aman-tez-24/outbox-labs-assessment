import { Router } from "express";
import multer from "multer";

import { requireAuth } from "../middleware/auth.middleware.js";
import { createCampaignController } from "../controllers/campaign.controller.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post(
  "/",
  requireAuth,
  upload.array("attachments"),
  createCampaignController,
);

export default router;