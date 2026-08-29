'use client';

import { CopyableValue } from './primitives';
import { ExternalLinkIcon } from './icons';
import { describeNetwork, explorerTransactionUrl } from '@/lib/market/network';
import { supportUrl } from '@/lib/market/support';
import { describeStage, type PurchaseRecord } from '@/lib/market/purchase-state';

/**
 * Everything an operator needs to reconcile one purchase by hand.
 *
 * These identifiers are the difference between "my payment vanished" and a
 * support request that can actually be answered, so they are shown as soon as
 * they exist -- not only after something goes wrong.
 */
export function SupportReferences({
  record,
  requestId,
  errorXdr,
}: {
  record: PurchaseRecord;
  requestId?: string;
  errorXdr?: string;
}) {
  const network = describeNetwork(record.networkPassphrase);
  const receipt = explorerTransactionUrl(
    record.transactionHash,
    record.networkPassphrase,
  );

  return (
    <section aria-labelledby="purchase-references" className="space-y-3">
      <h3
        id="purchase-references"
        className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant"
      >
        Purchase references
      </h3>

      <div className="grid gap-2">
        {record.purchaseId ? (
          <CopyableValue label="Purchase ID" value={record.purchaseId} />
        ) : null}
        <CopyableValue label="Idempotency key" value={record.idempotencyKey} />
        {record.transactionHash ? (
          <CopyableValue
            label="Transaction hash"
            value={record.transactionHash}
            href={receipt}
          />
        ) : null}
        {record.contractId ? (
          <CopyableValue label="Contract" value={record.contractId} />
        ) : null}
        {requestId ? <CopyableValue label="Request ID" value={requestId} /> : null}
        {errorXdr ? (
          <CopyableValue label="Failure result (XDR)" value={errorXdr} />
        ) : null}
      </div>

      <p className="text-sm text-on-surface-variant">
        Network: {network.label}.
        {record.transactionHash && !receipt
          ? ' No explorer link is shown because the network could not be identified.'
          : ''}
      </p>

      {record.priorAttempts?.length ? (
        <div className="space-y-3 rounded-2xl border border-outline-variant/20 bg-white/4 p-3">
          <p className="text-sm text-on-surface-variant">
            Earlier attempts at this prompt. They are kept because an attempt can leave a real
            payment on chain even when the marketplace did not settle it.
          </p>
          {record.priorAttempts.map((attempt) => (
            <div key={attempt.idempotencyKey} className="grid gap-2">
              <p className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">
                {describeStage(attempt.stage).label} ·{' '}
                {new Date(attempt.at).toLocaleString()}
              </p>
              {attempt.purchaseId ? (
                <CopyableValue label="Purchase ID" value={attempt.purchaseId} />
              ) : null}
              {attempt.transactionHash ? (
                <CopyableValue
                  label="Transaction hash"
                  value={attempt.transactionHash}
                  href={explorerTransactionUrl(
                    attempt.transactionHash,
                    attempt.networkPassphrase,
                  )}
                />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <a
        className="focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-full text-sm font-medium text-accent underline underline-offset-4"
        href={supportUrl()}
        target="_blank"
        rel="noopener noreferrer"
      >
        Contact support with these references
        <ExternalLinkIcon className="h-4 w-4" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </section>
  );
}
