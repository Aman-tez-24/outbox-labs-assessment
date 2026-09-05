import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { searchEmails } from "../services/email-search.service.js";

const router = Router();

router.get("/emails", requireAuth, async (req, res) => {
  try {
    const query =
      typeof req.query.q === "string"
        ? req.query.q
        : "";

    const page =
      typeof req.query.page === "string"
        ? Number(req.query.page)
        : 1;

    const limit =
      typeof req.query.limit === "string"
        ? Number(req.query.limit)
        : 20;

    const result = await searchEmails(
      req.user!.id,
      query,
      Number.isFinite(page) ? page : 1,
      Number.isFinite(limit) ? limit : 20,
    );

    res.json(result);
  } catch (error) {
    console.error("Email search failed:", error);

    res.status(500).json({
      message: "Failed to search emails",
    });
  }
});

export default router;
