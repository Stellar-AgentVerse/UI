'use client';

import { rpc, TransactionBuilder } from '@stellar/stellar-sdk';
import {
  mapGetTransactionStatus,
  mapSendStatus,
  type LedgerOutcome,
  type SubmitOutcome,
} from './purchase-state';

/**
 * Soroban RPC access for the purchase journey.
 *
 * Two rules drive everything here:
 *
 * 1. `sendTransaction` returns a hash for *every* status, including the ones
 *    that mean the transaction was not accepted. The hash is therefore never
 *    evidence of submission; only `status` is.
 * 2. A ledger has to close before the transaction exists to anyone else. On
 *    Testnet that is about five seconds. Confirming with the backend before
 *    then guarantees the backend's own RPC lookup returns NOT_FOUND, which it
 *    records as a terminal failure. So the UI polls to a definitive chain
 *    result first, and only then confirms.
 */

const DEFAULT_RPC_URL = 'https://soroban-testnet.stellar.org';

export function sorobanRpcUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL?.trim();
  return configured || DEFAULT_RPC_URL;
}

function server(): rpc.Server {
  return new rpc.Server(sorobanRpcUrl());
}

export interface SubmitResult {
  /** Present whenever RPC answered at all. Not proof of acceptance. */
  hash?: string;
  outcome: SubmitOutcome;
  /** Raw XDR of the failure result, for support. Only set on a rejection. */
  errorXdr?: string;
}

/**
 * Hand the signed envelope to RPC and classify the answer.
 *
 * A transport failure is reported as retryable: resubmitting the identical
 * signed envelope is safe, because a resubmission of something already in
 * flight comes back as DUPLICATE rather than creating a second payment.
 */
export async function submitSignedTransaction(
  signedXdr: string,
  networkPassphrase: string,
): Promise<SubmitResult> {
  let transaction;
  try {
    transaction = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
  } catch {
    return {
      outcome: {
        kind: 'rejected',
        message:
          'The signed transaction could not be decoded for this network. The wallet may be set to a different network than the marketplace quoted.',
      },
    };
  }

  // The hash is a pure function of the signed envelope, so it is known before
  // the network is touched. That matters: if the node accepts the transaction
  // and the response is then lost, this is the only way to find out what
  // happened instead of guessing -- and guessing "not submitted" is how a
  // buyer ends up paying twice.
  let localHash: string | undefined;
  try {
    localHash = transaction.hash().toString('hex');
  } catch {
    localHash = undefined;
  }

  let response;
  try {
    response = await server().sendTransaction(transaction);
  } catch (error) {
    return {
      hash: localHash,
      outcome: {
        kind: localHash ? 'unknown' : 'retry',
        message: localHash
          ? `The Stellar RPC node did not answer (${describe(error)}). The transaction may or may not have reached the network, so its hash is being checked against the ledger.`
          : `The Stellar RPC node could not be reached (${describe(error)}).`,
      },
    };
  }

  const detail =
    response.status === 'ERROR' ? transactionResultCode(response.errorResult) : undefined;

  return {
    hash: response.hash,
    outcome: mapSendStatus(response.status, detail),
    errorXdr: safeXdr(response.errorResult),
  };
}

export interface PollOptions {
  /** Called after every lookup so the UI can show progress honestly. */
  onAttempt?: (attempt: number, elapsedMs: number) => void;
  /** Stop polling early (component unmounted, buyer navigated away). */
  signal?: AbortSignal;
  /** How long to keep looking before handing control back to the buyer. */
  budgetMs?: number;
  intervalMs?: number;
}

export type PollResult =
  | LedgerOutcome
  /** The budget ran out. Not a failure: the transaction may still land. */
  | { kind: 'timeout' };

/**
 * Poll until the ledger has a definitive answer.
 *
 * NOT_FOUND is the normal answer for the first few seconds and is never
 * reported as a failure. Running out of budget is also not a failure -- the
 * caller offers "check again" rather than declaring the purchase dead.
 *
 * `rpc.Server.pollTransaction` exists, but it resolves only once, with no
 * per-attempt signal, so it cannot drive a progress display or be cancelled.
 */
export async function pollForLedgerResult(
  hash: string,
  options: PollOptions = {},
): Promise<PollResult> {
  const intervalMs = options.intervalMs ?? 2_000;
  const budgetMs = options.budgetMs ?? 90_000;
  const startedAt = Date.now();
  const client = server();
  let attempt = 0;

  while (Date.now() - startedAt < budgetMs) {
    if (options.signal?.aborted) return { kind: 'timeout' };

    attempt += 1;
    try {
      const response = await client.getTransaction(hash);
      const outcome = mapGetTransactionStatus(response.status);
      if (outcome.kind !== 'pending') return outcome;
    } catch {
      // A node that is unreachable tells us nothing about the ledger. Keep
      // waiting rather than inventing a result.
    }

    options.onAttempt?.(attempt, Date.now() - startedAt);
    await sleep(intervalMs, options.signal);
  }

  // Out of budget. Surfaced by the caller as "still unknown", never as "failed".
  return { kind: 'timeout' };
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

/**
 * Pull the protocol result code out of an RPC rejection.
 *
 * `String(errorResult)` yields "[object Object]" -- the value is an XDR union,
 * not a message -- so the switch name is read explicitly. Codes look like
 * `txTooLate` or `txInsufficientBalance` and are worth showing verbatim.
 */
function transactionResultCode(errorResult: unknown): string | undefined {
  if (!errorResult) return undefined;
  try {
    const result = (errorResult as { result?: () => { switch?: () => { name?: string } } }).result?.();
    const name = result?.switch?.()?.name;
    return typeof name === 'string' ? name : undefined;
  } catch {
    return undefined;
  }
}

function safeXdr(errorResult: unknown): string | undefined {
  if (!errorResult) return undefined;
  try {
    return (errorResult as { toXDR?: (format: string) => string }).toXDR?.('base64');
  } catch {
    return undefined;
  }
}

function describe(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'unknown error';
}

/**
 * Human copy for the protocol codes a buyer can realistically hit.
 *
 * `txTooLate` matters most: the marketplace fixes the transaction's time bound
 * when it builds the quote, before the buyer has approved anything, so a slow
 * approval in the wallet lands here.
 */
export function explainResultCode(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case 'txTooLate':
      return 'The transaction was approved after its time window closed. Start a new attempt and approve it in Freighter promptly.';
    case 'txTooEarly':
      return 'The transaction was submitted before its time window opened.';
    case 'txInsufficientBalance':
      return 'The account does not hold enough XLM to cover the transaction fee and reserve.';
    case 'txBadSeq':
      return 'The account sequence number moved on, usually because another transaction was sent from the same account. Start a new attempt.';
    case 'txBadAuth':
      return 'The signature did not authorise this transaction.';
    case 'txNoAccount':
      return 'The source account does not exist on this network. Fund it on Testnet before buying.';
    case 'txInsufficientFee':
      return 'The fee offered was below what the network required at that moment. Start a new attempt.';
    default:
      return null;
  }
}
