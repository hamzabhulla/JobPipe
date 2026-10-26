/**
 * UUID generation without a dependency. crypto.randomUUID is
 * available in every modern browser and in secure contexts; the
 * fallback covers non-secure contexts (plain http on a LAN) where
 * randomUUID is undefined but getRandomValues still exists.
 * IDs are random, not sequential — sequential IDs would leak how
 * many applications a user has tracked if data is ever shared.
 */
export function newId(): string {
  const cryptoObj = globalThis.crypto;
  if (typeof cryptoObj?.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }
  const bytes = new Uint8Array(16);
  cryptoObj.getRandomValues(bytes);
  // Set version (4) and variant (10xx) bits per RFC 4122.
  const b6 = bytes[6];
  const b8 = bytes[8];
  if (b6 !== undefined) bytes[6] = (b6 & 0x0f) | 0x40;
  if (b8 !== undefined) bytes[8] = (b8 & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return (
    `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}` +
    `-${hex.slice(16, 20)}-${hex.slice(20)}`
  );
}
