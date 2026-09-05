import { parse } from "csv-parse/sync";

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseLeadCsv(
  csvContent: string,
): string[] {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  if (records.length === 0) {
    return [];
  }

  const emailColumn = Object.keys(
    records[0],
  ).find(
    (key) => key.toLowerCase() === "email",
  );

  if (!emailColumn) {
    throw new Error(
      'CSV must contain an "email" column',
    );
  }

  const emails = records
    .map((record) => record[emailColumn])
    .filter(Boolean)
    .map((email) => email.trim().toLowerCase())
    .filter((email) => EMAIL_REGEX.test(email));

  return [...new Set(emails)];
}