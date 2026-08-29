'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Callout, StatusBadge } from './primitives';
import { SupportReferences } from './SupportReferences';
import { DeliveryPanel } from './DeliveryPanel';
import { LockIcon, ShieldIcon, SpinnerIcon, WalletIcon } from './icons';
import {
  confirmPurchase,
  createPurchaseIntent,
  toServerFailure,
  type AssetDetail,
  type PurchaseIntent,
} from '@/lib/api';
import { describeNetwork } from '@/lib/market/network';
import { useMarketSession } from '@/lib/market/session';
import {
  describeStage,
  mapConfirmFailure,
  mapIntentFailure,
  nextAction,
  requiresNewAttempt,
  type PurchaseRecord,
  type PurchaseStage,
} from '@/lib/market/purchase-state';
import {
  openAttempt,
  readPurchaseRecord,
  savePurchaseRecord,
  subscribeToPurchaseRecords,
} from '@/lib/market/purchase-store';
import {
  explainResultCode,
  pollForLedgerResult,
  submitSignedTransaction,
} from '@/lib/market/stellar';
import { signPurchaseTransaction, WalletError } from '@/lib/market/wallet';

interface Failure {
  message: string;
  requestId?: string;
  detail?: string;
}

/**
 * The purchase journey for one prompt.
 *
 * The ordering is deliberate. Consent is taken *before* the intent is created,
 * because the marketplace fixes a 30-second time bound on the transaction when
 * it builds the quote: any step inserted between "quote" and "approve" eats
 * that budget and produces a txTooLate failure the buyer cannot understand.
 *
 * After submission the UI polls the ledger to a definitive result before it
 * tells the backend anything. Confirming earlier is not merely racy: the
 * backend looks the transaction up exactly once, and a NOT_FOUND answer makes
 * it mark the purchase FAILED permanently.
 */
export function PurchasePanel({ asset }: { asset: AssetDetail }) {
  const session = useMarketSession();
  const address = session.wallet?.address ?? null;
  const authenticated = session.status === 'authenticated';

  const [record, setRecord] = useState<PurchaseRecord | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [errorXdr, setErrorXdr] = useState<string | undefined>(undefined);

  const abort = useRef<AbortController | null>(null);
  const statusHeading = useRef<HTMLParagraphElement | null>(null);
  const running = useRef(false);

  /* ---------------- record loading and cross-tab sync ---------------- */

  const reload = useCallback(() => {
    if (!address) {
      setRecord(null);
      return;
    }
    setRecord(readPurchaseRecord(address, asset.id));
  }, [address, asset.id]);

  useEffect(reload, [reload]);
  useEffect(() => subscribeToPurchaseRecords(reload), [reload]);

  useEffect(
    () => () => {
      abort.current?.abort();
    },
    [],
  );

  const commit = useCallback(
    (next: PurchaseRecord, stage: PurchaseStage, patch: Partial<PurchaseRecord> = {}) => {
      const saved = savePurchaseRecord({ ...next, ...patch, stage });
      setRecord(saved);
      return saved;
    },
    [],
  );

  /* ------------------------------- steps ------------------------------- */

  const confirmWithBackend = useCallback(
    async (current: PurchaseRecord): Promise<void> => {
      if (!current.purchaseId || !current.transactionHash) return;
      let state = commit(current, 'confirming');
      setNote('Verifying the payment with the marketplace…');

      try {
        const result = await confirmPurchase(state.purchaseId!, state.transactionHash!);
        if (result.status === 'VERIFIED') {
          commit(state, 'settled');
          setNote(null);
          return;
        }
        setFailure({
          message: `The marketplace answered with status "${result.status}" instead of settling the purchase.`,
        });
        commit(state, 'verification_failed');
      } catch (error) {
        const outcome = mapConfirmFailure(toServerFailure(error));
        if (outcome.kind === 'settled') {
          commit(state, 'settled');
          setNote(null);
          return;
        }
        if (outcome.kind === 'retry') {
          if (outcome.error.kind === 'auth') session.invalidate();
          state = commit(state, 'confirming', { lastError: outcome.error });
          setFailure({
            message: outcome.error.message,
            requestId: outcome.error.requestId,
            detail:
              'Nothing was lost. The transaction is already on chain and confirming again is safe — it cannot create a second purchase.',
          });
          return;
        }
        commit(state, outcome.stage, { lastError: outcome.error });
        setFailure({
          message: outcome.error.message,
          requestId: outcome.error.requestId,
        });
      } finally {
        setNote(null);
      }
    },
    [commit, session],
  );

  const watchLedger = useCallback(
    async (current: PurchaseRecord): Promise<void> => {
      if (!current.transactionHash) return;
      const state = commit(current, 'awaiting_ledger');
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;

      setNote('Waiting for a ledger to close over the transaction…');
      const outcome = await pollForLedgerResult(state.transactionHash!, {
        signal: controller.signal,
        onAttempt: (_attempt, elapsedMs) => {
          setNote(
            `Still waiting for the ledger — ${Math.round(elapsedMs / 1000)}s elapsed. This is normal.`,
          );
        },
      });

      if (controller.signal.aborted) return;

      if (outcome.kind === 'success') {
        await confirmWithBackend(state);
        return;
      }
      if (outcome.kind === 'failed') {
        setFailure({ message: outcome.message });
        commit(state, 'chain_failed');
        setNote(null);
        return;
      }
      // Timed out. The transaction may still land, so the stage stays
      // "awaiting ledger" and the buyer is offered another look.
      setNote(null);
      setFailure({
        message:
          'The transaction has not appeared in a closed ledger yet. It has not failed — Stellar can take longer when the network is busy.',
        detail: 'Check again, or come back to this page later; the purchase resumes where it left off.',
      });
    },
    [commit, confirmWithBackend],
  );

  const signAndSubmit = useCallback(
    async (current: PurchaseRecord, intent: PurchaseIntent): Promise<void> => {
      const walletPassphrase = session.wallet?.networkPassphrase;
      if (walletPassphrase && walletPassphrase !== intent.networkPassphrase) {
        setFailure({
          message: `Freighter is on ${describeNetwork(walletPassphrase).label} but this purchase settles on ${describeNetwork(intent.networkPassphrase).label}. Switch networks in Freighter and try again.`,
        });
        commit(current, 'awaiting_signature');
        return;
      }

      let state = commit(current, 'awaiting_signature');
      setNote('Approve the transaction in Freighter. The quote is only valid for a short window.');

      let signedXdr: string;
      try {
        signedXdr = await signPurchaseTransaction(
          intent.unsignedXdr,
          intent.networkPassphrase,
          state.buyerPublicKey,
        );
      } catch (error) {
        setFailure({
          message:
            error instanceof WalletError
              ? error.message
              : 'The wallet could not sign the transaction.',
        });
        setNote(null);
        return;
      }

      state = commit(state, 'submitting');
      setNote('Submitting the signed transaction to Stellar…');
      const submission = await submitSignedTransaction(
        signedXdr,
        intent.networkPassphrase,
      );
      setErrorXdr(submission.errorXdr);

      if (submission.outcome.kind === 'accepted') {
        if (!submission.hash) {
          setFailure({
            message: 'Stellar accepted the transaction but did not return its hash, so it cannot be tracked.',
            detail: 'Try again — the same purchase is reused, so this cannot become a second one.',
          });
          commit(state, 'awaiting_signature');
          setNote(null);
          return;
        }
        await watchLedger(commit(state, 'awaiting_ledger', { transactionHash: submission.hash }));
        return;
      }
      if (submission.outcome.kind === 'retry') {
        setFailure({
          message: submission.outcome.message,
          detail: 'Nothing has been submitted. Try again in a moment.',
        });
        commit(state, 'awaiting_signature');
        setNote(null);
        return;
      }

      const code = submission.outcome.message.split(': ').pop();
      setFailure({
        message: submission.outcome.message,
        detail: explainResultCode(code) ?? undefined,
      });
      commit(state, 'submission_rejected');
      setNote(null);
    },
    [commit, session.wallet?.networkPassphrase, watchLedger],
  );

  const startPurchase = useCallback(
    async (options: { startNew?: boolean } = {}): Promise<void> => {
      if (!address || !authenticated) return;
      setFailure(null);
      setErrorXdr(undefined);

      let state: PurchaseRecord;
      try {
        state = openAttempt(address, asset.id, options);
      } catch (error) {
        setFailure({
          message: error instanceof Error ? error.message : 'A purchase could not be started.',
        });
        return;
      }

      state = commit(state, 'creating_intent');
      setNote('Asking the marketplace to quote this purchase…');

      let intent: PurchaseIntent;
      try {
        intent = await createPurchaseIntent(asset.id, state.idempotencyKey);
      } catch (error) {
        const outcome = mapIntentFailure(toServerFailure(error));
        setNote(null);
        if (outcome.kind === 'settled') {
          commit(state, 'settled');
          return;
        }
        if (outcome.error.kind === 'auth') session.invalidate();
        commit(state, outcome.kind === 'retry' ? 'idle' : outcome.stage, {
          lastError: outcome.error,
        });
        setFailure({
          message: outcome.error.message,
          requestId: outcome.error.requestId,
        });
        return;
      }

      const quoted = commit(state, 'awaiting_signature', {
        purchaseId: intent.purchaseId,
        contractId: intent.contractId,
        networkPassphrase: intent.networkPassphrase,
        amount: intent.amount,
        expiresAt: new Date(intent.expiresAt).toISOString(),
      });

      await signAndSubmit(quoted, intent);
    },
    [address, asset.id, authenticated, commit, session, signAndSubmit],
  );

  const guard = useCallback(
    async (work: () => Promise<void>) => {
      if (running.current) return;
      running.current = true;
      setBusy(true);
      try {
        await work();
      } finally {
        running.current = false;
        setBusy(false);
        statusHeading.current?.focus();
      }
    },
    [],
  );

  /* -------------------------------- render -------------------------------- */

  const stage = record?.stage ?? 'idle';
  const descriptor = describeStage(stage);
  const action = nextAction(record);
  const network = record?.networkPassphrase
    ? describeNetwork(record.networkPassphrase)
    : session.wallet
      ? describeNetwork(session.wallet.networkPassphrase)
      : null;

  if (stage === 'settled' && record?.purchaseId) {
    return (
      <div className="space-y-4">
        <StatusBadge tone="success" label={descriptor.label} />
        <p className="text-sm leading-relaxed text-on-surface-variant">{descriptor.detail}</p>
        <DeliveryPanel purchaseId={record.purchaseId} />
        <SupportReferences record={record} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-primary">Buy this prompt</h2>
        <dl className="mt-4 space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-on-surface-variant">Listed price</dt>
            <dd className="text-2xl font-semibold text-primary">
              {asset.price > 0 ? `${asset.price.toLocaleString()} credits` : 'Free'}
            </dd>
          </div>
          {record?.amount !== undefined ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-sm text-on-surface-variant">Quoted amount</dt>
              <dd className="font-label text-sm text-on-surface">{record.amount}</dd>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-on-surface-variant">Settles on</dt>
            <dd className="text-sm text-on-surface">
              {network ? network.label : 'Connect a wallet to see the network'}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
          &ldquo;Credits&rdquo; is the marketplace&rsquo;s own catalogue unit. The payment itself is a
          Soroban contract call, and Freighter shows you its exact effects before you approve
          anything.
        </p>
      </div>

      {network && !network.isSupported ? (
        <Callout tone="warning" title="This wallet is not on a supported network" live="assertive">
          <p>
            Market V1 settles on Stellar Testnet. Switch Freighter to Testnet before buying.
          </p>
        </Callout>
      ) : null}

      {/* Status region. One live area for the whole flow, so a screen reader
          hears each transition once rather than one announcement per element. */}
      <div className="rounded-2xl border border-outline-variant/20 bg-white/4 p-4">
        <div role="status" aria-live="polite">
          <StatusBadge tone={descriptor.tone} label={descriptor.label} />
          <p
            ref={statusHeading}
            tabIndex={-1}
            className="focus-ring mt-3 rounded text-sm leading-relaxed text-on-surface-variant"
          >
            {note ?? descriptor.detail}
          </p>
        </div>
        {busy ? (
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-secondary">
            <SpinnerIcon className="h-4 w-4" />
            Working…
          </p>
        ) : null}
      </div>

      {failure ? (
        <Callout tone={descriptor.tone === 'error' ? 'error' : 'warning'} title={failure.message} live="assertive">
          {failure.detail ? <p>{failure.detail}</p> : null}
          {failure.requestId ? (
            <p className="mt-2 font-label text-xs">Reference: {failure.requestId}</p>
          ) : null}
        </Callout>
      ) : null}

      {!authenticated ? (
        <Callout
          tone="idle"
          title="Sign in before buying"
          actions={
            session.status === 'connected' || session.status === 'authenticating' ? (
              <button
                type="button"
                className="market-button-primary"
                onClick={() => void session.signIn()}
                disabled={session.status === 'authenticating'}
              >
                <ShieldIcon className="h-4 w-4" />
                {session.status === 'authenticating' ? 'Signing in…' : 'Sign in with Freighter'}
              </button>
            ) : (
              <button
                type="button"
                className="market-button-primary"
                onClick={() => void session.connect()}
                disabled={session.status === 'loading'}
              >
                <WalletIcon className="h-4 w-4" />
                {session.status === 'loading' ? 'Checking wallet…' : 'Connect Freighter'}
              </button>
            )
          }
        >
          <p>
            Buying requires a signed-in session, not just a connected wallet: the marketplace only
            accepts purchase requests that carry proof you control this account.
          </p>
        </Callout>
      ) : action === 'start' || action === 'new_attempt' ? (
        <div className="space-y-4">
          <label className="flex items-start gap-3 rounded-2xl border border-outline-variant/20 bg-white/4 p-4">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="focus-ring mt-1 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
            />
            <span className="text-sm leading-relaxed text-on-surface-variant">
              I understand this submits a real transaction to {network?.label ?? 'the Stellar network'}{' '}
              from my own wallet, that Stellar payments cannot be reversed, and that the prompt is
              delivered by the marketplace after the payment settles.
            </span>
          </label>

          <button
            type="button"
            className="market-button-primary w-full"
            disabled={!consent || busy || (network ? !network.isSupported : false)}
            onClick={() =>
              void guard(() => startPurchase({ startNew: requiresNewAttempt(stage) }))
            }
          >
            <LockIcon className="h-4 w-4" />
            {stage === 'idle' ? 'Buy prompt' : 'Try again'}
          </button>

          <p className="text-xs leading-relaxed text-on-surface-variant">
            Freighter opens as soon as the quote is ready. Approve it promptly — the marketplace
            fixes a short time window on the transaction when it builds the quote.
          </p>
        </div>
      ) : action === 'sign' ? (
        <button
          type="button"
          className="market-button-primary w-full"
          disabled={busy}
          onClick={() => void guard(() => startPurchase())}
        >
          Resume purchase
        </button>
      ) : action === 'resume_ledger' ? (
        <button
          type="button"
          className="market-button-secondary w-full"
          disabled={busy}
          onClick={() =>
            void guard(async () => {
              if (record) await watchLedger(record);
            })
          }
        >
          Check the ledger again
        </button>
      ) : action === 'resume_confirm' ? (
        <button
          type="button"
          className="market-button-primary w-full"
          disabled={busy}
          onClick={() =>
            void guard(async () => {
              if (record) await confirmWithBackend(record);
            })
          }
        >
          Confirm the payment again
        </button>
      ) : null}

      {record && record.stage !== 'idle' ? (
        <SupportReferences record={record} errorXdr={errorXdr} requestId={failure?.requestId} />
      ) : null}
    </div>
  );
}
