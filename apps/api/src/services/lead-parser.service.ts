const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeLeads(
  leads: string[],
): string[] {
  const normalized = leads
    .map((lead) => lead.trim().toLowerCase())
    .filter(Boolean);

  const invalid = normalized.filter(
    (email) => !EMAIL_REGEX.test(email),
  );

  if (invalid.length > 0) {
    throw new Error(
      `Invalid email addresses: ${invalid
        .slice(0, 5)
        .join(", ")}`,
    );
  }

  return [...new Set(normalized)];
}