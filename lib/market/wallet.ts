'use client';

import {
  getAddress,
  getNetworkDetails,
  isConnected,
  requestAccess,
  signMessage,
  signTransaction,
} from '@stellar/freighter-api';
import { hash, Keypair } from '@stellar/stellar-sdk';

/**
 * Freighter access for the market path.
 *
 * Connecting a wallet and being signed in are deliberately separate here: the
 * extension can tell us an address without the backend having ever accepted a
 * signature from it, and treating those as the same thing is how a UI ends up
 * calling a JWT-protected endpoint with no session.
 */

export const FREIGHTER_INSTALL_URL = 'https://www.freighter.app/';

export class WalletError extends Error {
  constructor(
    message: string,
    readonly reason:
      | 'missing'
      | 'rejected'
      | 'locked'
      | 'network'
      | 'unknown' = 'unknown',
  ) {
    super(message);
    this.name = 'WalletError';
  }
}

export interface WalletConnection {
  address: string;
  /** Freighter's own label, e.g. "TESTNET". */
  network: string;
  networkPassphrase: string;
}

export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const { isConnected: installed } = await isConnected();
    return Boolean(installed);
  } catch {
    return false;
  }
}

/** Read the wallet without prompting. Returns null when access was never granted. */
export async function readWallet(): Promise<WalletConnection | null> {
  if (!(await isFreighterInstalled())) return null;
  try {
    const { address, error } = await getAddress();
    if (error || !address) return null;
    return { address, ...(await readNetwork()) };
  } catch {
    return null;
  }
}

/** Prompt for access. This is the only call that opens the extension popup. */
export async function connectWallet(): Promise<WalletConnection> {
  if (!(await isFreighterInstalled())) {
    throw new WalletError(
      'Freighter was not detected in this browser. Install the extension, then reload this page.',
      'missing',
    );
  }
  const { address, error } = await requestAccess();
  if (error || !address) {
    throw new WalletError(
      error?.message ?? 'Freighter did not return an address.',
      'rejected',
    );
  }
  return { address, ...(await readNetwork()) };
}

async function readNetwork(): Promise<{ network: string; networkPassphrase: string }> {
  try {
    const details = await getNetworkDetails();
    if (details.error) throw new Error(details.error.message);
    return {
      network: details.network,
      networkPassphrase: details.networkPassphrase,
    };
  } catch (error) {
    throw new WalletError(
      `Freighter did not report which network it is on (${
        error instanceof Error ? error.message : 'unknown error'
      }).`,
      'network',
    );
  }
}

/**
 * How the wallet interpreted the message it signed.
 *
 * `legacy` is a raw Ed25519 signature over the challenge bytes, which is what
 * this backend verifies. `sep53` is SHA-256 over
 * "Stellar Signed Message:\n" + challenge, per SEP-53, which is what current
 * Freighter builds produce. Knowing which one we got turns an opaque
 * "Invalid signature" into a diagnosis.
 */
export type SignatureScheme = 'legacy' | 'sep53' | 'unknown';

export interface ChallengeSignature {
  /** Hex-encoded 64-byte signature, the encoding the backend parses. */
  signatureHex: string;
  scheme: SignatureScheme;
}

export async function signChallenge(
  challenge: string,
  address: string,
): Promise<ChallengeSignature> {
  let result;
  try {
    result = await signMessage(challenge, { address });
  } catch (error) {
    throw new WalletError(
      error instanceof Error ? error.message : 'Freighter could not sign the challenge.',
      'rejected',
    );
  }
  if (result.error || !result.signedMessage) {
    throw new WalletError(
      result.error?.message ?? 'The signature request was rejected in Freighter.',
      'rejected',
    );
  }

  const bytes = toSignatureBytes(result.signedMessage);
  if (bytes.length !== 64) {
    throw new WalletError(
      `Freighter returned a ${bytes.length}-byte signature; a Stellar signature is 64 bytes.`,
      'unknown',
    );
  }

  return {
    signatureHex: toHex(bytes),
    scheme: detectScheme(address, challenge, bytes),
  };
}

export async function signPurchaseTransaction(
  unsignedXdr: string,
  networkPassphrase: string,
  address: string,
): Promise<string> {
  let result;
  try {
    result = await signTransaction(unsignedXdr, { address, networkPassphrase });
  } catch (error) {
    throw new WalletError(
      error instanceof Error ? error.message : 'Freighter could not sign the transaction.',
      'rejected',
    );
  }
  if (result.error || !result.signedTxXdr) {
    throw new WalletError(
      result.error?.message ?? 'The transaction was rejected in Freighter.',
      'rejected',
    );
  }
  return result.signedTxXdr;
}

/* ------------------------------------------------------------------ *
 * Encoding helpers
 *
 * Freighter v3 hands back a Buffer, v4+ hands back a base64 string; the
 * installed @stellar/freighter-api types both. The backend parses hex, so
 * whatever arrives is normalised to hex here rather than at the call site.
 * ------------------------------------------------------------------ */

function toSignatureBytes(signedMessage: string | Uint8Array): Uint8Array {
  if (typeof signedMessage !== 'string') return new Uint8Array(signedMessage);
  if (/^[0-9a-f]{128}$/i.test(signedMessage)) return fromHex(signedMessage);
  try {
    return fromBase64(signedMessage);
  } catch {
    // atob throws on anything that is not base64. Letting that escape would
    // surface as a generic network error and send the buyer looking in the
    // wrong place.
    throw new WalletError(
      'Freighter returned a signature in a format this app does not recognise.',
      'unknown',
    );
  }
}

function fromHex(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function fromBase64(value: string): Uint8Array {
  // base64url tolerated: Freighter returns standard base64, but a padded or
  // url-safe variant should not blow up the sign-in flow.
  const normalised = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalised);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

const SEP53_PREFIX = 'Stellar Signed Message:\n';

/**
 * Both stellar-sdk helpers accept Uint8Array at runtime even though their
 * types name Buffer, so no Buffer polyfill is pulled into the client bundle.
 */
const sha256 = hash as unknown as (data: Uint8Array) => Uint8Array;

function detectScheme(
  address: string,
  challenge: string,
  signature: Uint8Array,
): SignatureScheme {
  try {
    const keypair = Keypair.fromPublicKey(address) as unknown as {
      verify(data: Uint8Array, signature: Uint8Array): boolean;
    };
    const encoder = new TextEncoder();
    const message = encoder.encode(challenge);
    if (keypair.verify(message, signature)) return 'legacy';

    const prefix = encoder.encode(SEP53_PREFIX);
    const prefixed = new Uint8Array(prefix.length + message.length);
    prefixed.set(prefix, 0);
    prefixed.set(message, prefix.length);
    if (keypair.verify(sha256(prefixed), signature)) return 'sep53';
  } catch {
    // A malformed address or an unavailable primitive must not block sign-in;
    // the backend remains the authority on whether the signature is valid.
  }
  return 'unknown';
}

/**
 * Explain a rejected sign-in when we can see why.
 *
 * The backend verifies a raw Ed25519 signature over the challenge bytes. A
 * wallet that follows SEP-53 signs a hash of a prefixed message instead, so
 * its signature can never verify there. That is a contract mismatch between
 * the two repositories, not something the buyer did wrong, and saying so is
 * more useful than repeating "Invalid signature".
 */
export function explainRejectedSignature(scheme: SignatureScheme): string | null {
  if (scheme === 'sep53') {
    return 'Freighter signed the challenge using SEP-53 (a SHA-256 hash of the message with a "Stellar Signed Message:" prefix). The marketplace verifies a raw signature over the challenge itself, so it cannot accept this signature. This is a server-side gap tracked in Backend #9, not a problem with your wallet.';
  }
  if (scheme === 'unknown') {
    return 'The signature could not be matched to the challenge locally, so the marketplace could not verify it either. Check that Freighter is on the same account you signed in with.';
  }
  return null;
}
