// Payload format decided with the backend: a QR glued on a space encodes the
// plain string "repere:space:{id}" — see docs/api-mobile.md (web repo).
const SPACE_QR_PREFIX = "repere:space:";

/**
 * Validates a scanned code BEFORE any network call: a QR not issued by
 * Repère (Wi-Fi, a product barcode, anything else) must fail instantly and
 * for free, not round-trip to the server to learn it's garbage.
 */
export function parseSpaceQrPayload(data: string): string | null {
  if (!data.startsWith(SPACE_QR_PREFIX)) return null;
  const id = data.slice(SPACE_QR_PREFIX.length).trim();
  return id.length > 0 ? id : null;
}
