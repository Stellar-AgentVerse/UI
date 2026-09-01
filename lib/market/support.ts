/**
 * Where a buyer goes when a purchase needs human reconciliation.
 *
 * The configured value is validated before it is trusted. If it is missing or
 * malformed we fall back to the repository issue tracker, which is a real
 * destination — a placeholder address would be the same dead end as `href="#"`.
 */

const FALLBACK_SUPPORT_URL = 'https://github.com/Stellar-AgentVerse/UI/issues';

export function supportUrl(): string {
  return httpsOrigin(process.env.NEXT_PUBLIC_SUPPORT_URL) ?? FALLBACK_SUPPORT_URL;
}

/**
 * Parse rather than pattern-match. A regex accepts strings the URL parser
 * rejects, and rendering an unusable address is the dead end this gate exists
 * to prevent.
 */
function httpsOrigin(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' || !url.hostname) return null;
    return url.toString();
  } catch {
    return null;
  }
}
