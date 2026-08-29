'use client';

import { useCallback, useEffect, useState } from 'react';
import { Callout, CopyableValue } from './primitives';
import { LockIcon } from './icons';
import { toServerFailure, type EncryptedDeliveryEnvelope } from '@/lib/api';
import { mapDeliveryFailure } from '@/lib/market/purchase-state';
import { useDeliveryResult, usePurchaseAccessRecord } from '@/lib/queries/useDelivery';

const POLL_INTERVAL_MS = 5_000;
/** 24 lookups at 5s is roughly two minutes of automatic checking. */
const MAX_POLL_ATTEMPTS = 24;

/**
 * What the buyer receives after settlement.
 *
 * Two things this deliberately does not do:
 *
 * - It never navigates to the access record's `deliveryReference`. That value
 *   is an `asset://` URN, which no browser resolves; the backend's own DTO
 *   describes it as a reference rather than content, so it is rendered as a
 *   reference.
 * - It never claims to show the prompt. The delivery API returns an AES-256-GCM
 *   envelope whose data key is wrapped by the backend's KMS, so a browser
 *   cannot decrypt it and no endpoint returns plaintext. What is shown is the
 *   authenticated receipt for that envelope, which is exactly what exists.
 */
export function DeliveryPanel({ purchaseId }: { purchaseId: string }) {
  const access = usePurchaseAccessRecord(purchaseId);
  const delivery = useDeliveryResult(purchaseId);
  const [attempts, setAttempts] = useState(0);

  const state = delivery.isError
    ? mapDeliveryFailure(toServerFailure(delivery.error))
    : null;
  const isPending = state?.kind === 'pending';
  const pollingActive = isPending && attempts < MAX_POLL_ATTEMPTS;

  // Destructured because react-query keeps `refetch` referentially stable,
  // while the query object itself is a new value on every render: depending on
  // the object would clear the pending timer on any unrelated re-render and
  // polling would never fire.
  const { refetch: refetchDelivery } = delivery;

  // Bounded polling. A delivery result that has not appeared within the budget
  // is still not a failure -- the buyer just gets an explicit control instead
  // of an indefinite spinner.
  useEffect(() => {
    if (!pollingActive) return;
    const handle = setTimeout(() => {
      setAttempts((current) => current + 1);
      void refetchDelivery();
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(handle);
  }, [refetchDelivery, pollingActive, attempts]);

  const checkAgain = useCallback(() => {
    setAttempts(0);
    void delivery.refetch();
    void access.refetch();
  }, [access, delivery]);

  return (
    <section aria-labelledby="delivery-heading" className="space-y-4">
      <h3 id="delivery-heading" className="font-heading text-xl font-semibold text-primary">
        Your delivery
      </h3>

      {access.isSuccess ? (
        <div className="space-y-2">
          <p className="text-sm text-on-surface-variant">
            Recorded by the marketplace on{' '}
            {new Date(access.data.purchasedAt).toLocaleString()}.
          </p>
          <CopyableValue label="Delivery reference" value={access.data.deliveryReference} />
          <p className="text-xs leading-relaxed text-on-surface-variant">
            This is an internal reference, not a link. Quote it to support if you need this
            purchase reconciled.
          </p>
        </div>
      ) : access.isError ? (
        <Callout tone="warning" title="The access record could not be read" live="polite">
          <p>{toServerFailure(access.error).message}</p>
        </Callout>
      ) : null}

      {delivery.isPending && !delivery.isError ? (
        <Callout tone="progress" title="Looking for your delivery result" live="polite" />
      ) : null}

      {delivery.isSuccess ? (
        <EncryptedReceipt
          envelope={delivery.data.encryptedResult}
          canonicalId={delivery.data.canonicalId}
          expiresAt={delivery.data.expiresAt}
        />
      ) : null}

      {state?.kind === 'pending' ? (
        <Callout
          tone="waiting"
          title="Your prompt has not been delivered yet"
          live="polite"
          actions={
            <button type="button" className="market-button-secondary" onClick={checkAgain}>
              Check again
            </button>
          }
        >
          <p>
            {access.isSuccess
              ? 'The payment is settled and your access is recorded. '
              : 'The payment is settled. '}
            The marketplace has not published a delivery result for this purchase yet, so there is
            nothing to show at this moment.
          </p>
          <p className="mt-2">
            {pollingActive
              ? 'This page keeps checking automatically for the next couple of minutes.'
              : 'Automatic checking has stopped. Use the button above, or return to this page later — the purchase is stored and resumes where it left off.'}
          </p>
        </Callout>
      ) : null}

      {state?.kind === 'expired' ? (
        <Callout tone="warning" title="The delivery result has expired" live="polite">
          <p>
            The marketplace keeps delivery results for a limited period and this one is past it.
            Your purchase record is unaffected — contact support with the references below to have
            it re-issued.
          </p>
        </Callout>
      ) : null}

      {state?.kind === 'unauthorized' ? (
        <Callout tone="error" title="This delivery is not available to the signed-in account" live="polite">
          <p>
            The marketplace refused the request, so no content was returned. Check that Freighter is
            on the account that made the purchase, then sign in again.
          </p>
        </Callout>
      ) : null}

      {state?.kind === 'error' ? (
        <Callout
          tone="error"
          title="The delivery result could not be read"
          live="polite"
          actions={
            state.retryable ? (
              <button type="button" className="market-button-secondary" onClick={checkAgain}>
                Try again
              </button>
            ) : undefined
          }
        >
          <p>{state.message}</p>
          {state.requestId ? (
            <p className="mt-2 font-label text-xs">Reference: {state.requestId}</p>
          ) : null}
        </Callout>
      ) : null}
    </section>
  );
}

function EncryptedReceipt({
  envelope,
  canonicalId,
  expiresAt,
}: {
  envelope: EncryptedDeliveryEnvelope;
  canonicalId: string;
  expiresAt: string;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-accent/25 bg-accent/8 p-4">
      <p className="inline-flex items-center gap-2 font-medium text-accent">
        <LockIcon className="h-5 w-5" />
        Delivered, encrypted by the marketplace
      </p>
      <p className="text-sm leading-relaxed text-on-surface-variant">
        The marketplace has produced your result and authenticated it to your wallet. It is sealed
        with {envelope.algorithm} under a key held by the marketplace&rsquo;s key service, so this
        page cannot decrypt it and does not pretend to: there is no endpoint yet that releases the
        plaintext to a buyer. Until there is, this receipt is the proof your delivery exists.
      </p>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <Row label="Cipher" value={`${envelope.algorithm} (v${envelope.version})`} />
        <Row label="Ciphertext size" value={`about ${approximateBytes(envelope.ciphertext)} bytes`} />
        <Row label="Available until" value={new Date(expiresAt).toLocaleString()} />
      </dl>
      <CopyableValue label="Delivery ID" value={canonicalId} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">{label}</dt>
      <dd className="mt-0.5 text-on-surface">{value}</dd>
    </div>
  );
}

/** base64url expands three bytes into four characters. */
function approximateBytes(base64url: string): number {
  return Math.floor((base64url.replace(/=+$/, '').length * 3) / 4);
}
