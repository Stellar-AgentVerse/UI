/**
 * Purchase state machine for the Market V1 prompt journey.
 *
 * Pure, framework-free and side-effect-free so the transitions can be reasoned
 * about (and tested) without a browser, a wallet or a backend.
 *
 * The journey crosses three systems that fail independently:
 *
 *   wallet  ->  Soroban RPC  ->  backend
 *
 * so "failed" is not one state. A wallet rejection, an RPC that has not seen
 * the ledger yet, and a backend that refused to settle are different things
 * with different remedies, and the UI must not collapse them into one red box.
 */

export type PurchaseStage =
  /** Nothing has been started for this asset by this buyer. */
  | 'idle'
  /** Asking the backend for an intent. */
  | 'creating_intent'
  /** Intent exists and is unexpired; the wallet must sign. */
  | 'awaiting_signature'
  /** Signed envelope is being handed to Soroban RPC. */
  | 'submitting'
  /** RPC accepted the envelope; waiting for a ledger to close over it. */
  | 'awaiting_ledger'
  /** The ledger executed the transaction successfully; backend is verifying. */
  | 'confirming'
  /** Backend settled the purchase. Terminal, and the only success. */
  | 'settled'
  /** Soroban RPC refused the signed envelope. No ledger saw it. */
  | 'submission_rejected'
  /** A ledger executed the transaction and it failed on chain. */
  | 'chain_failed'
  /** Backend refused to settle and closed the intent. Terminal. */
  | 'verification_failed'
  /** The intent window closed before the transaction settled. Terminal. */
  | 'expired'
  /** The hash is already bound to another purchase. Terminal, needs support. */
  | 'replay_blocked';

export type PurchaseErrorKind =
  /** Network/transport problem talking to RPC or the API. Always retryable. */
  | 'transport'
  /** The wallet refused, is locked, or is on the wrong network. */
  | 'wallet'
  /** The backend answered with a deliberate error. */
  | 'server'
  /** The ledger reported a definitive outcome. */
  | 'chain'
  /** The session is missing or no longer accepted. */
  | 'auth'
  /** The deployment is misconfigured (wrong network, missing API URL). */
  | 'config';

export interface PurchaseError {
  kind: PurchaseErrorKind;
  /** Message shown to the buyer. Prefer the server's own wording. */
  message: string;
  /** Whether repeating the same step is safe and might succeed. */
  retryable: boolean;
  /** Correlation id from the API envelope, for support. */
  requestId?: string;
  /** Stage the failure happened in. */
  stage: PurchaseStage;
  at: string;
}

/**
 * Everything that must survive a reload for the journey to be resumable and
 * for a retry to be impossible to turn into a second purchase.
 */
export interface PurchaseRecord {
  /** Storage schema version, so a future shape change can be migrated. */
  version: 1;
  assetId: string;
  buyerPublicKey: string;
  /**
   * Generated once per attempt and written before the first network call.
   * The backend keys purchases on (buyer, idempotencyKey), so reusing it is
   * what makes a retry idempotent instead of a second purchase.
   */
  idempotencyKey: string;
  stage: PurchaseStage;
  purchaseId?: string;
  transactionHash?: string;
  contractId?: string;
  networkPassphrase?: string;
  /** Atomic token amount quoted by the intent. */
  amount?: number;
  /** ISO timestamp; after this the intent can no longer be signed. */
  expiresAt?: string;
  lastError?: PurchaseError;
  /**
   * References from earlier attempts at the same asset. A buyer who paid on
   * chain and then had to start a fresh quote still needs the old purchase id
   * and transaction hash to get the first payment reconciled, so starting again
   * archives them instead of overwriting them.
   */
  priorAttempts?: PriorAttempt[];
  createdAt: string;
  updatedAt: string;
}

export interface PriorAttempt {
  idempotencyKey: string;
  purchaseId?: string;
  transactionHash?: string;
  networkPassphrase?: string;
  stage: PurchaseStage;
  at: string;
}

export interface StageDescriptor {
  label: string;
  /** One sentence explaining what is happening, in the buyer's terms. */
  detail: string;
  tone: 'idle' | 'progress' | 'waiting' | 'success' | 'warning' | 'error';
  /** Nothing more will happen without a new attempt. */
  isTerminal: boolean;
  /** We are waiting on a system outside the browser. Not a failure. */
  isPending: boolean;
}

const STAGES: Record<PurchaseStage, StageDescriptor> = {
  idle: {
    label: 'Not started',
    detail: 'Connect a wallet and sign in to buy this prompt.',
    tone: 'idle',
    isTerminal: false,
    isPending: false,
  },
  creating_intent: {
    label: 'Preparing purchase',
    detail:
      'Asking the marketplace to quote this purchase and build the transaction.',
    tone: 'progress',
    isTerminal: false,
    isPending: false,
  },
  awaiting_signature: {
    label: 'Waiting for your signature',
    detail: 'Review the transaction in Freighter and approve it to continue.',
    tone: 'waiting',
    isTerminal: false,
    isPending: false,
  },
  submitting: {
    label: 'Submitting to Stellar',
    detail: 'Sending the signed transaction to the Soroban RPC node.',
    tone: 'progress',
    isTerminal: false,
    isPending: false,
  },
  awaiting_ledger: {
    label: 'Waiting for the ledger',
    detail:
      'The network accepted the transaction and is closing a ledger over it. This is normal and usually takes a few seconds.',
    tone: 'waiting',
    isTerminal: false,
    isPending: true,
  },
  confirming: {
    label: 'Confirming with the marketplace',
    detail: 'The ledger executed the payment; the marketplace is verifying it.',
    tone: 'progress',
    isTerminal: false,
    isPending: false,
  },
  settled: {
    label: 'Purchase settled',
    detail: 'The marketplace verified the payment and recorded your access.',
    tone: 'success',
    isTerminal: true,
    isPending: false,
  },
  submission_rejected: {
    label: 'Stellar did not accept the transaction',
    detail:
      'The RPC node refused the signed transaction, so no ledger ever saw it and nothing was charged. Retrying reuses the same purchase, so it cannot become a second one.',
    tone: 'error',
    isTerminal: false,
    isPending: false,
  },
  chain_failed: {
    label: 'Transaction failed on chain',
    detail:
      'A ledger executed the transaction and it did not succeed, so the prompt was not purchased. Retrying reuses the same purchase, so it cannot become a second one.',
    tone: 'error',
    isTerminal: false,
    isPending: false,
  },
  verification_failed: {
    label: 'Marketplace could not verify the payment',
    detail:
      'The marketplace closed this purchase intent. If your transaction did succeed on chain, keep the references below and contact support before paying again.',
    tone: 'error',
    isTerminal: true,
    isPending: false,
  },
  expired: {
    label: 'Purchase intent expired',
    detail:
      'The marketplace closed the quote before it accepted the payment. Your transaction may already be on chain, so check the receipt below and contact support before paying again — a new attempt is a new payment.',
    tone: 'warning',
    isTerminal: true,
    isPending: false,
  },
  replay_blocked: {
    label: 'Transaction already used',
    detail:
      'This transaction is already bound to another purchase, so it was not counted twice. Contact support with the references below.',
    tone: 'warning',
    isTerminal: true,
    isPending: false,
  },
};

export function describeStage(stage: PurchaseStage): StageDescriptor {
  return STAGES[stage];
}

/**
 * Stages that need a brand new idempotency key.
 *
 * Only expiry qualifies. A rejected submission or a transaction that failed on
 * chain leaves the marketplace's purchase record PENDING and unbound to any
 * hash, so retrying with the *same* key returns that same record with a freshly
 * built transaction -- which is exactly the property that stops a retry from
 * becoming a second purchase. Minting a new key there would create the
 * duplicate this design exists to prevent.
 */
export function requiresNewAttempt(stage: PurchaseStage): boolean {
  return stage === 'expired';
}

/**
 * The one action the UI should offer next for a stored record.
 *
 * The `resume_*` values matter after a reload: they continue the existing
 * attempt with the stored purchase id and transaction hash instead of starting
 * a new one.
 */
export type NextAction =
  | 'start'
  | 'sign'
  | 'resume_ledger'
  | 'resume_confirm'
  | 'view_delivery'
  | 'new_attempt'
  | 'contact_support';

export function nextAction(
  record: PurchaseRecord | null,
  now: number = Date.now(),
): NextAction {
  if (!record) return 'start';
  switch (record.stage) {
    case 'idle':
    case 'creating_intent':
      return 'start';
    case 'awaiting_signature':
    case 'submitting':
      // The signed envelope is deliberately not persisted, so resuming means
      // signing again. The idempotency key is reused, so this cannot become a
      // second purchase.
      return isIntentExpired(record, now) ? 'new_attempt' : 'sign';
    case 'awaiting_ledger':
      return record.transactionHash ? 'resume_ledger' : 'sign';
    case 'confirming':
      return record.transactionHash ? 'resume_confirm' : 'sign';
    case 'settled':
      return 'view_delivery';
    case 'submission_rejected':
    case 'chain_failed':
      return isIntentExpired(record, now) ? 'new_attempt' : 'start';
    case 'expired':
      return 'new_attempt';
    case 'verification_failed':
    case 'replay_blocked':
      return 'contact_support';
  }
}

export function isIntentExpired(
  record: Pick<PurchaseRecord, 'expiresAt'>,
  now: number = Date.now(),
): boolean {
  if (!record.expiresAt) return false;
  const at = Date.parse(record.expiresAt);
  return Number.isFinite(at) && at <= now;
}

/* ------------------------------------------------------------------ *
 * Soroban RPC status mapping
 *
 * Values come from rpc.Api.SendTransactionStatus and
 * rpc.Api.GetTransactionStatus in @stellar/stellar-sdk. They are compared as
 * plain strings so this module stays importable without the SDK.
 * ------------------------------------------------------------------ */

export type SubmitOutcome =
  /** RPC has the envelope; poll for ledger inclusion. */
  | { kind: 'accepted' }
  /** RPC is busy or rate limited; the same envelope can be resent. */
  | { kind: 'retry'; message: string }
  /**
   * RPC never answered. The transaction may or may not have reached the
   * network, and saying "not submitted" here is how a buyer ends up paying
   * twice. The only safe reading is to go and look at the ledger.
   */
  | { kind: 'unknown'; message: string }
  /** RPC refused the envelope outright. */
  | { kind: 'rejected'; message: string };

export function mapSendStatus(
  status: string,
  errorDetail?: string,
): SubmitOutcome {
  switch (status) {
    case 'PENDING':
      return { kind: 'accepted' };
    case 'DUPLICATE':
      // Already submitted, almost certainly by an earlier attempt at this same
      // purchase. Treat it as accepted and let polling decide the outcome.
      return { kind: 'accepted' };
    case 'TRY_AGAIN_LATER':
      return {
        kind: 'retry',
        message: 'The Stellar RPC node asked us to try again shortly.',
      };
    case 'ERROR':
      return {
        kind: 'rejected',
        message: errorDetail
          ? `Stellar RPC rejected the transaction: ${errorDetail}`
          : 'Stellar RPC rejected the transaction.',
      };
    default:
      return {
        kind: 'rejected',
        message: `Stellar RPC returned an unrecognised status (${status}).`,
      };
  }
}

export type LedgerOutcome =
  /** No ledger has closed over the transaction yet. Keep polling. */
  | { kind: 'pending' }
  | { kind: 'success' }
  | { kind: 'failed'; message: string };

export function mapGetTransactionStatus(status: string): LedgerOutcome {
  switch (status) {
    case 'NOT_FOUND':
      return { kind: 'pending' };
    case 'SUCCESS':
      return { kind: 'success' };
    case 'FAILED':
      return {
        kind: 'failed',
        message: 'The ledger executed the transaction and it failed.',
      };
    default:
      // An unrecognised status is not evidence of failure. Keep waiting rather
      // than telling a buyer their payment failed on a status we do not know.
      return { kind: 'pending' };
  }
}

/* ------------------------------------------------------------------ *
 * Backend error mapping
 *
 * The backend answers with { statusCode, message, error }. Status codes are
 * reused for several distinct outcomes -- 409 covers "already settled",
 * "already failed" and "hash replayed" -- so the message is needed to tell
 * them apart. Matching is substring-based and case-insensitive, and every
 * branch falls back to a safe interpretation if the wording changes.
 * ------------------------------------------------------------------ */

export interface ServerFailure {
  /** HTTP status, or 0 when no response was received at all. */
  status: number;
  message: string;
  requestId?: string;
}

export type ConfirmOutcome =
  /** Settled, including the idempotent "already verified" answer. */
  | { kind: 'settled' }
  | { kind: 'stage'; stage: PurchaseStage; error: PurchaseError }
  /** Transient; repeating the same confirm call is safe. */
  | { kind: 'retry'; error: PurchaseError };

function mentions(message: string, needle: string): boolean {
  return message.toLowerCase().includes(needle);
}

function purchaseError(
  stage: PurchaseStage,
  kind: PurchaseErrorKind,
  message: string,
  retryable: boolean,
  requestId: string | undefined,
  now: () => string,
): PurchaseError {
  return { stage, kind, message, retryable, requestId, at: now() };
}

const isoNow = () => new Date().toISOString();

export function mapConfirmFailure(
  failure: ServerFailure,
  now: () => string = isoNow,
): ConfirmOutcome {
  const { status, message, requestId } = failure;
  const stage: PurchaseStage = 'confirming';
  const fail = (
    target: PurchaseStage,
    kind: PurchaseErrorKind = 'server',
  ): ConfirmOutcome => ({
    kind: 'stage',
    stage: target,
    error: purchaseError(stage, kind, message, false, requestId, now),
  });

  if (status === 409) {
    if (mentions(message, 'already verified')) return { kind: 'settled' };
    if (mentions(message, 'already been used')) return fail('replay_blocked');
    if (mentions(message, 'already expired')) return fail('expired');
    if (mentions(message, 'already failed')) return fail('verification_failed');
    return fail('verification_failed');
  }
  if (status === 400) {
    return mentions(message, 'expired')
      ? fail('expired')
      : fail('verification_failed');
  }
  if (status === 404) return fail('verification_failed');
  if (status === 401 || status === 403) {
    return {
      kind: 'retry',
      error: purchaseError(stage, 'auth', message, true, requestId, now),
    };
  }
  // 0 (no response), 5xx and anything unrecognised. The purchase may well have
  // settled, so never burn the attempt on an answer we did not receive.
  return {
    kind: 'retry',
    error: purchaseError(
      stage,
      status === 0 ? 'transport' : 'server',
      message,
      true,
      requestId,
      now,
    ),
  };
}

export type IntentOutcome =
  /** The marketplace says this buyer already owns the prompt. */
  | { kind: 'settled' }
  /**
   * The quote was refused. Nothing was signed and no transaction exists, so
   * this never persists a terminal purchase stage: the copy for those stages
   * talks about a payment that may be on chain, and here none can be.
   * `needsNewKey` marks the one refusal a fresh idempotency key resolves.
   */
  | { kind: 'refused'; error: PurchaseError; needsNewKey: boolean }
  | { kind: 'retry'; error: PurchaseError };

export function mapIntentFailure(
  failure: ServerFailure,
  now: () => string = isoNow,
): IntentOutcome {
  const { status, message, requestId } = failure;
  const stage: PurchaseStage = 'creating_intent';

  if (status === 409 && mentions(message, 'already completed')) {
    return { kind: 'settled' };
  }
  if (status === 409 || status === 400 || status === 404) {
    return {
      kind: 'refused',
      // "Idempotency key is already bound to another asset" is the only one a
      // buyer can clear themselves, by starting a genuinely new attempt.
      needsNewKey: status === 409 && mentions(message, 'already bound'),
      error: purchaseError(stage, 'server', message, false, requestId, now),
    };
  }
  if (status === 401 || status === 403) {
    return {
      kind: 'retry',
      error: purchaseError(stage, 'auth', message, true, requestId, now),
    };
  }
  return {
    kind: 'retry',
    error: purchaseError(
      stage,
      status === 0 ? 'transport' : 'server',
      message,
      true,
      requestId,
      now,
    ),
  };
}

export type DeliveryState =
  /** The backend has no result yet. Expected right after settlement. */
  | { kind: 'pending'; message: string }
  | { kind: 'expired'; message: string }
  | { kind: 'unauthorized'; message: string }
  | { kind: 'error'; message: string; retryable: boolean; requestId?: string };

export function mapDeliveryFailure(failure: ServerFailure): DeliveryState {
  const { status, message, requestId } = failure;
  if (status === 404) {
    return mentions(message, 'expired')
      ? { kind: 'expired', message }
      : {
          kind: 'pending',
          message:
            'The marketplace has not published a delivery result for this purchase yet.',
        };
  }
  if (status === 401 || status === 403) {
    return { kind: 'unauthorized', message };
  }
  return {
    kind: 'error',
    message,
    // 429 comes from the global throttler, and polling for a delivery result is
    // the request pattern most likely to trip it. Waiting and asking again is
    // exactly the right response, so it must not render as terminal.
    retryable: status === 0 || status === 429 || status >= 500,
    requestId,
  };
}
