import { Router } from "express";
import { getSystemHealth } from "../services/health.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const health = await getSystemHealth();

    const healthy =
      health.database === "ok" &&
      health.redis === "ok";

    res.status(healthy ? 200 : 503).json({
      success: healthy,
      status: healthy ? "ok" : "degraded",
      services: health,
    });
  }),
);

export default router;