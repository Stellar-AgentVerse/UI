/**
 * Stellar network identity for the market path.
 *
 * Kept dependency-free on purpose: these two passphrases are protocol
 * constants (identical to `Networks.TESTNET` / `Networks.PUBLIC` in
 * @stellar/stellar-sdk), and inlining them lets server components render a
 * network indicator without pulling the SDK into their bundle.
 *
 * Market V1 is Testnet-only. Anything else is surfaced to the user rather
 * than silently accepted.
 */

export const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
export const PUBLIC_PASSPHRASE = 'Public Global Stellar Network ; September 2015';

export type NetworkId = 'testnet' | 'public' | 'unknown';

export interface NetworkDescription {
  id: NetworkId;
  /** Short label for the network indicator. */
  label: string;
  /** True only for the network Market V1 supports. */
  isSupported: boolean;
}

export function describeNetwork(
  passphrase: string | null | undefined,
): NetworkDescription {
  if (passphrase === TESTNET_PASSPHRASE) {
    return { id: 'testnet', label: 'Stellar Testnet', isSupported: true };
  }
  if (passphrase === PUBLIC_PASSPHRASE) {
    return { id: 'public', label: 'Stellar Public network', isSupported: false };
  }
  return { id: 'unknown', label: 'Unrecognised network', isSupported: false };
}

/**
 * Explorer receipt for a settled transaction.
 *
 * Returns null when the network is unknown, because a link to the wrong
 * network's explorer is worse than no link: it renders "transaction not
 * found" for a transaction that exists.
 */
export function explorerTransactionUrl(
  transactionHash: string | null | undefined,
  passphrase: string | null | undefined,
): string | null {
  if (!transactionHash || !/^[0-9a-f]{64}$/i.test(transactionHash)) return null;
  const { id } = describeNetwork(passphrase);
  if (id === 'unknown') return null;
  const base = explorerBase();
  return `${base}/explorer/${id}/tx/${transactionHash.toLowerCase()}`;
}

const DEFAULT_EXPLORER = 'https://stellar.expert';

/**
 * Parsed rather than pattern-matched: a regex accepts strings the URL parser
 * rejects, and a malformed override would produce a link that goes nowhere.
 * Only the origin is used, since the path is built here.
 */
function explorerBase(): string {
  const configured = process.env.NEXT_PUBLIC_STELLAR_EXPLORER_URL?.trim();
  if (!configured) return DEFAULT_EXPLORER;
  try {
    const url = new URL(configured);
    if (url.protocol !== 'https:' || !url.hostname) return DEFAULT_EXPLORER;
    return url.origin;
  } catch {
    return DEFAULT_EXPLORER;
  }
}
