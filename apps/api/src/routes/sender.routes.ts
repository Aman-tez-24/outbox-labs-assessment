import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { prisma } from "../config/prisma.js";
import { createEtherealAccount } from "../integrations/ethereal/ethereal.account.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const senders = await prisma.sender.findMany({
      where: {
        userId: req.user!.id,
      },

      select: {
        id: true,
        name: true,
        email: true,
      },

      orderBy: {
        createdAt: "asc",
      },
    });

    return res.json({ senders });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch senders",
    });
  }
});

router.post(
  "/ethereal",
  requireAuth,
  async (req, res) => {
    try {
      const name =
        typeof req.body.name === "string" &&
        req.body.name.trim()
          ? req.body.name.trim()
          : req.user!.name;

      const account =
        await createEtherealAccount();

      const sender = await prisma.sender.create({
        data: {
          userId: req.user!.id,

          name,

          email: account.user,

          etherealUser: account.user,
          etherealPassword: account.pass,
        },

        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      return res.status(201).json({
        sender,
      });
    } catch (error) {
      console.error(
        "Failed to create Ethereal sender:",
        error,
      );

      return res.status(500).json({
        message:
          "Failed to create Ethereal sender",
      });
    }
  },
);

export default router;