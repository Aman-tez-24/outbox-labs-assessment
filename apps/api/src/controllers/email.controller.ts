import type { Request, Response } from "express";
import {
  getEmailById,
  listScheduledEmails,
  listSentEmails,
} from "../services/email.service.js";

function parsePagination(req: Request) {
  const page = Math.max(
    1,
    Number.parseInt(String(req.query.page ?? "1"), 10) || 1,
  );

  const limit = Math.min(
    100,
    Math.max(
      1,
      Number.parseInt(String(req.query.limit ?? "20"), 10) || 20,
    ),
  );

  return { page, limit };
}

function getSearch(req: Request): string | undefined {
  const value = req.query.q;

  if (typeof value !== "string") {
    return undefined;
  }

  const search = value.trim();

  return search.length > 0 ? search : undefined;
}

export async function getScheduledEmails(
  req: Request,
  res: Response,
) {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const { page, limit } = parsePagination(req);
  const search = getSearch(req);

  const result = await listScheduledEmails({
    userId: req.user.id,
    page,
    limit,
    search,
  });

  return res.json(result);
}

export async function getSentEmails(
  req: Request,
  res: Response,
) {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const { page, limit } = parsePagination(req);
  const search = getSearch(req);

  const result = await listSentEmails({
    userId: req.user.id,
    page,
    limit,
    search,
  });

  return res.json(result);
}

export async function getEmail(
  req: Request,
  res: Response,
) {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

 const emailId = String(req.params.id);

  if (!emailId) {
    return res.status(400).json({
      message: "Email ID is required",
    });
  }

  const email = await getEmailById(
    emailId,
    req.user.id,
  );

  if (!email) {
    return res.status(404).json({
      message: "Email not found",
    });
  }

  return res.json({
    email,
  });
}