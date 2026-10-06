// The API only ever stores one `name` string (same as the web's own
// `profileSchema`) — splitting it into first/last name is a display-only
// convenience on this screen, not a schema change on either side. Pure and
// unit-tested, like every other small parsing rule in this app.

/**
 * First word is the first name, everything after it is the last name — the
 * common heuristic for splitting a single "full name" string. A one-word
 * name (no space) keeps it as the first name and leaves the last name empty.
 */
export function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, spaceIndex), lastName: trimmed.slice(spaceIndex + 1).trim() };
}

/** The inverse of `splitName` — what gets sent back as the single `name` field. */
export function joinName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}
