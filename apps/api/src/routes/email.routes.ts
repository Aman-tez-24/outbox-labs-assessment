import { Router } from "express";
import {
  getEmail,
  getScheduledEmails,
  getSentEmails,
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
  "/:id",
  requireAuth,
  getEmail,
);

export default router;