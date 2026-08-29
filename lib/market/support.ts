/**
 * Where a buyer goes when a purchase needs human reconciliation.
 *
 * The configured value is validated before it is trusted. If it is missing or
 * malformed we fall back to the repository issue tracker, which is a real
 * destination — a placeholder address would be the same dead end as `href="#"`.
 */

const FALLBACK_SUPPORT_URL = 'https://github.com/Stellar-AgentVerse/UI/issues';

export function supportUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SUPPORT_URL?.trim();
  if (configured && /^https:\/\/[^\s]+$/i.test(configured)) return configured;
  return FALLBACK_SUPPORT_URL;
}

/** True when the operator has configured a real support destination. */
export function hasDedicatedSupportChannel(): boolean {
  return supportUrl() !== FALLBACK_SUPPORT_URL;
}
