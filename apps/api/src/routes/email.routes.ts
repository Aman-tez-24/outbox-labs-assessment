import { Router } from "express";

import {
  getEmail,
  getScheduledEmails,
  getSentEmails,
  getEmailAttachment,
  toggleStar,
  archiveEmailController,
  deleteEmailController,
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
router.patch(
  "/:id/star",
  requireAuth,
  toggleStar,
);

router.patch(
  "/:id/archive",
  requireAuth,
  archiveEmailController,
);

router.delete(
  "/:id",
  requireAuth,
  deleteEmailController,
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