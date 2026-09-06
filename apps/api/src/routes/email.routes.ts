import { Router } from "express";

import {
  getEmail,
  getScheduledEmails,
  getSentEmails,
  getEmailAttachment,
} from "../controllers/email.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/scheduled",
  requireAuth,
  getScheduledEmails,
);

router.get(
  "/sent",
  requireAuth,
  getSentEmails,
);

router.get(
  "/:id/attachments/:attachmentId",
  requireAuth,
  getEmailAttachment,
);

router.get(
  "/:id",
  requireAuth,
  getEmail,
);

export default router;