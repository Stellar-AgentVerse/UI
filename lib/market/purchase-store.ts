/**
 * Durable purchase state, one record per (buyer, asset) attempt.
 *
 * This is what makes the journey deterministic across a reload, a retry, a
 * second tab, or a browser that was closed between signing and confirmation.
 * The idempotency key is written here *before* the first request leaves the
 * browser, so any repeat of the flow reuses it and the backend answers with
 * the same purchase instead of opening a second one.
 *
 * Everything is defensive: storage can be unavailable (private mode), full
 * (quota), or hold data written by an older version of the app. None of those
 * may break the page, so every read falls back to "no record" and every write
 * fails silently rather than throwing into a click handler.
 */

import type { PurchaseRecord, PurchaseStage } from './purchase-state';

const STORAGE_KEY = 'agentverse.market.purchases.v1';

/** Records older than this are pruned on read; well past the 30 min intent TTL. */
const MAX_RECORD_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type StoredMap = Record<string, PurchaseRecord>;

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    // Access itself throws when site data is blocked.
    return null;
  }
}

function recordKey(buyerPublicKey: string, assetId: string): string {
  return `${buyerPublicKey}:${assetId}`;
}

function isRecord(value: unknown): value is PurchaseRecord {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PurchaseRecord>;
  return (
    candidate.version === 1 &&
    typeof candidate.assetId === 'string' &&
    typeof candidate.buyerPublicKey === 'string' &&
    typeof candidate.idempotencyKey === 'string' &&
    typeof candidate.stage === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string'
  );
}

function readAll(): StoredMap {
  const store = storage();
  if (!store) return {};
  let raw: string | null;
  try {
    raw = store.getItem(STORAGE_KEY);
  } catch {
    return {};
  }
  if (!raw) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== 'object') return {};

  const cutoff = Date.now() - MAX_RECORD_AGE_MS;
  const result: StoredMap = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!isRecord(value)) continue;
    const updated = Date.parse(value.updatedAt);
    if (Number.isFinite(updated) && updated < cutoff) continue;
    result[key] = value;
  }
  return result;
}

function writeAll(map: StoredMap): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Quota exceeded or storage disabled. The in-memory flow still works; only
    // resumability across a reload is lost, which is better than a thrown
    // exception in the middle of a purchase.
  }
}

export function readPurchaseRecord(
  buyerPublicKey: string,
  assetId: string,
): PurchaseRecord | null {
  if (!buyerPublicKey || !assetId) return null;
  return readAll()[recordKey(buyerPublicKey, assetId)] ?? null;
}

export function savePurchaseRecord(record: PurchaseRecord): PurchaseRecord {
  const next: PurchaseRecord = { ...record, updatedAt: new Date().toISOString() };
  const map = readAll();
  map[recordKey(next.buyerPublicKey, next.assetId)] = next;
  writeAll(map);
  return next;
}

export function updatePurchaseRecord(
  record: PurchaseRecord,
  patch: Partial<Omit<PurchaseRecord, 'version' | 'assetId' | 'buyerPublicKey' | 'idempotencyKey' | 'createdAt'>>,
): PurchaseRecord {
  return savePurchaseRecord({ ...record, ...patch });
}

export function clearPurchaseRecord(
  buyerPublicKey: string,
  assetId: string,
): void {
  const map = readAll();
  delete map[recordKey(buyerPublicKey, assetId)];
  writeAll(map);
}

/**
 * A fresh idempotency key.
 *
 * The backend accepts 8-64 characters; a UUID is 36. `randomUUID` needs a
 * secure context, so there is a `getRandomValues` fallback for the cases where
 * it is missing (plain http on a LAN address, for instance).
 */
export function newIdempotencyKey(): string {
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cryptoObj?.randomUUID) return cryptoObj.randomUUID();
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  throw new Error(
    'This browser cannot generate a secure idempotency key, so a purchase cannot be started safely.',
  );
}

/**
 * Return the record to continue, creating one only when there is nothing to
 * resume.
 *
 * `startNew` is the explicit "buy again" path: it is the only way a second
 * idempotency key is ever minted for the same buyer and asset.
 */
export function openAttempt(
  buyerPublicKey: string,
  assetId: string,
  options: { startNew?: boolean } = {},
): PurchaseRecord {
  const existing = readPurchaseRecord(buyerPublicKey, assetId);
  if (existing && !options.startNew) return existing;

  const now = new Date().toISOString();
  const record: PurchaseRecord = {
    version: 1,
    assetId,
    buyerPublicKey,
    idempotencyKey: newIdempotencyKey(),
    stage: 'idle',
    createdAt: now,
    updatedAt: now,
  };
  return savePurchaseRecord(record);
}

export function setStage(
  record: PurchaseRecord,
  stage: PurchaseStage,
  patch: Partial<PurchaseRecord> = {},
): PurchaseRecord {
  return savePurchaseRecord({ ...record, ...patch, stage });
}

/**
 * Notify when another tab changes the stored purchases, so two open tabs
 * cannot drift into believing they each own a separate attempt.
 */
export function subscribeToPurchaseRecords(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) listener();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
