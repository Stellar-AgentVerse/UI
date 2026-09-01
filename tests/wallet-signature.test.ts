// @vitest-environment node
//
// Pure cryptography plus one string: no DOM is needed, and under jsdom the
// Buffer and Uint8Array realms differ from the ones @noble/ed25519 checks
// against, which makes key construction throw.
import { Keypair, hash } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';
import { explainRejectedSignature } from '@/lib/market/wallet';

/**
 * The backend's `AuthService.verifyWallet` does
 * `Keypair.verify(Buffer.from(challenge, 'utf-8'), Buffer.from(signature, 'hex'))`
 * — a raw Ed25519 signature over the challenge bytes, and nothing else.
 *
 * Freighter's `signMessage` follows SEP-53 and signs
 * `SHA-256("Stellar Signed Message:\n" + challenge)`. The first test proves
 * those can never agree, so the sign-in copy must not tell a buyer to re-check
 * their account and retry: retrying cannot succeed, and sending someone after a
 * fault that is not theirs is the dead end this journey exists to remove.
 *
 * If the backend later accepts SEP-53, the first test still passes — it is pure
 * cryptography — and the second is the one to update, deliberately.
 *
 * Everything here uses real `Uint8Array`s rather than `Buffer`. Under jsdom the
 * two are different realms and @noble/ed25519 rejects the foreign one; the
 * stellar-sdk types name `Buffer` but accept any `Uint8Array` at runtime.
 */
type Bytes = Parameters<Keypair['sign']>[0];

const bytes = (value: Uint8Array) => value as unknown as Bytes;
const utf8 = (value: string) => new TextEncoder().encode(value);
const sha256 = hash as unknown as (data: Uint8Array) => Uint8Array;

describe('wallet challenge signature schemes', () => {
  it('a SEP-53 signature can never verify against the raw challenge bytes', () => {
    // A fixed seed keeps this deterministic; the property holds for every key,
    // so randomness would buy nothing.
    const keypair = Keypair.fromRawEd25519Seed(bytes(new Uint8Array(32).fill(7)));
    const message = utf8('b3b0c1d2-0000-4000-8000-000000000abc');

    const prefix = utf8('Stellar Signed Message:\n');
    const prefixed = new Uint8Array(prefix.length + message.length);
    prefixed.set(prefix, 0);
    prefixed.set(message, prefix.length);
    const sep53Payload = sha256(prefixed);

    const legacySignature = keypair.sign(bytes(message));
    const sep53Signature = keypair.sign(bytes(sep53Payload));

    // Exactly what the backend checks.
    expect(keypair.verify(bytes(message), legacySignature)).toBe(true);
    expect(keypair.verify(bytes(message), sep53Signature)).toBe(false);

    // The payloads differ by a hash, so no client-side transform bridges them.
    expect(keypair.verify(bytes(sep53Payload), sep53Signature)).toBe(true);
  });

  it('does not tell a SEP-53 buyer that the marketplace supports their signature', () => {
    const explanation = explainRejectedSignature('sep53');

    expect(explanation).toBeTruthy();
    expect(explanation).toMatch(/SEP-53/);
    // Must not claim support, and must not send the buyer round a retry loop
    // that cannot succeed.
    expect(explanation).not.toMatch(/which the marketplace supports/i);
    expect(explanation).toMatch(/cannot accept|server-side gap/i);
  });

  it('says nothing when the wallet used the scheme the backend accepts', () => {
    expect(explainRejectedSignature('legacy')).toBeNull();
  });
});
