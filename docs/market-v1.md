# Market V1 — the prompt purchase and delivery journey

Market V1 sells exactly one product: a curated **PROMPT**, paid for from the
buyer's own Stellar wallet. This document describes what the UI does, what it
refuses to do, and what still depends on the backend.

## Scope

`lib/market/scope.ts` is the single source of truth. Everything that filters,
gates or explains the scope reads from it, so widening Market V1 later is a
one-line change rather than a hunt through the UI.

| Product | Market V1 |
| --- | --- |
| Prompts | Listed, purchasable, delivered |
| Agents, datasets, workflows, models, oracles | Not listed, not purchasable, explained where a buyer might look for them |
| Credit packages | Removed from the wallet page |

The catalog is queried as `GET /api/marketplace/assets?type=PROMPT`, so an
unsupported type cannot reach the grid even if the catalog grows one. Opening an
unsupported asset by its direct URL renders an explanation and no purchase UI.

**No fallback data anywhere on this path.** Loading, empty and error are three
distinct rendered states. If the marketplace cannot be reached, the page says so
and offers a retry; it never substitutes sample assets, metrics, balances,
wallet addresses or transactions.

## The journey

```
browse  ->  detail  ->  connect  ->  sign in  ->  consent  ->  quote
        ->  approve  ->  submit   ->  ledger   ->  confirm  ->  deliver
```

Two orderings in there are deliberate, and both come from the backend's
behaviour rather than from taste.

### Consent is taken before the quote

`PurchasesService.createIntent` builds the transaction with `.setTimeout(30)`,
so the envelope is only valid for 30 seconds — and that clock starts *before*
the buyer has seen anything. Any step inserted between "quote" and "approve"
spends that budget and produces a `txTooLate` failure the buyer cannot explain.
So consent is collected first, and Freighter opens immediately after the quote
arrives.

### The chain is polled before the marketplace is told anything

`PurchasesService.verifyTransaction` looks the transaction up through Soroban
RPC exactly once. Any status that is not `SUCCESS` — including `NOT_FOUND`,
which is the normal answer for the first few seconds — makes it write
`status = FAILED` and bind the transaction hash. That write is terminal: the
retry path then hits `Purchase is already failed`, and a fresh intent hits
`Transaction hash has already been used`.

So the UI polls `getTransaction` to a definitive result first and only then
calls `confirm`. Testnet ledgers close in about five seconds; the poll runs
every two seconds for up to ninety, and running out of budget is reported as
"still pending", never as a failure.

## Purchase states

`lib/market/purchase-state.ts` is pure and framework-free, so the transitions
can be reasoned about without a browser, a wallet or a backend.

| Stage | Meaning | What the buyer is offered |
| --- | --- | --- |
| `idle` | Nothing started | Buy |
| `creating_intent` | Quoting | Nothing; the action is disabled while it runs |
| `awaiting_signature` | Quote ready, wallet must approve | Resume |
| `submitting` | Handing the envelope to RPC | Nothing; the action is disabled while it runs |
| `awaiting_ledger` | Submitted, no ledger yet — **not a failure** | Check the ledger again |
| `confirming` | Ledger succeeded, marketplace verifying | Confirm again |
| `settled` | Verified. The only success | View delivery |
| `submission_rejected` | RPC refused it; no ledger saw it | Try again |
| `chain_failed` | A ledger executed it and it failed | Try again |
| `verification_failed` | Marketplace closed the intent | Contact support |
| `expired` | Quote window closed | Try again, which mints a new quote |
| `replay_blocked` | Hash already bound elsewhere | Contact support |

## Why a retry cannot become a second purchase

The idempotency key is generated once per attempt and written **before the
first request leaves the browser** (`lib/market/purchase-store.ts`). The backend
keys purchases on `(buyerPublicKey, idempotencyKey)` with a unique index, so
every repeat of the flow — a reload, a retry, a second tab, a browser closed
between signing and confirmation — resolves to the same purchase record.

Writes go to `localStorage` and are mirrored in memory. The mirror matters when
storage is unavailable (private mode, blocked site data, a quota error): without
it every read would come back empty and each retry would mint a new key, which
is exactly the duplicate this design prevents. With storage unavailable the tab
still stays consistent with itself; what is lost is resumption **after a
reload**, since there is nowhere durable to resume from.

A new key is minted in exactly one case: the quote expired. After a rejected
submission or a chain failure the marketplace's record is still `PENDING` and
bound to no hash, so reusing the key returns that same record with a freshly
built transaction. Minting a new key there would create the duplicate this
design exists to prevent.

Purchase records are also synchronised across tabs through the `storage` event,
so two open tabs cannot each believe they own a separate attempt.

## Delivery

After settlement the UI reads `GET /api/prompt-delivery/{purchaseId}` with the
buyer's JWT.

It does **not** open the `deliveryReference` from
`GET /api/marketplace/purchases/{id}/access`. That value is
`asset://{assetId}/purchase/{purchaseId}` — a URN no browser resolves, and the
backend's own DTO calls it a reference rather than content. It is rendered as a
copyable support reference instead.

It also does not claim to show the prompt. The delivery endpoint returns an
AES-256-GCM envelope whose data key is wrapped by the backend's key service, so
a browser cannot decrypt it and no endpoint releases plaintext to a buyer. What
is rendered is the authenticated receipt for that envelope — cipher, size,
expiry, delivery id — which is exactly what exists today.

`404` from that endpoint is the normal "not produced yet" answer and is rendered
as pending with bounded automatic polling, not as an error. `401`/`403` is
rendered without exposing anything.

## Support and reconciliation

Every purchase surfaces its references as soon as they exist — purchase id,
idempotency key, transaction hash with an explorer receipt, contract id and
network — each individually copyable. When the marketplace reports a problem,
the API request id from the `x-request-id` header is shown alongside them, so a
support request can be tied to a specific server-side event. `NEXT_PUBLIC_SUPPORT_URL` sets the support destination; if it is unset
or malformed the UI falls back to this repository's issue tracker, which is a
real destination. No placeholder address is ever rendered.

An explorer link is omitted rather than guessed when the network passphrase is
unrecognised: a link to the wrong network's explorer reports "transaction not
found" for a transaction that exists.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | yes | Backend origin. Also the target of the `/api/*` rewrite in `next.config.ts` |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | no | Soroban RPC used for submission and polling. Defaults to `https://soroban-testnet.stellar.org` |
| `NEXT_PUBLIC_SUPPORT_URL` | no | Support destination. Falls back to the repository issue tracker |
| `NEXT_PUBLIC_STELLAR_EXPLORER_URL` | no | Origin of a stellar.expert-compatible explorer. Only the origin is used; the path is built as `/explorer/{network}/tx/{hash}`, so a different explorer's URL scheme will not work. Defaults to `https://stellar.expert` |

All are inlined at build time, so a change needs a rebuild.

## Known dependencies and gaps

These are server-side and outside this repository. They are listed because the
journey cannot be completed end to end on Testnet until they are closed.

1. **Wallet sign-in cannot succeed with a current Freighter build.**
   `AuthService.verifyWallet` verifies a raw Ed25519 signature over the
   challenge bytes, hex encoded. Freighter's `signMessage` follows SEP-53: it
   signs `SHA-256("Stellar Signed Message:\n" + message)` and returns base64.
   The UI normalises the encoding to hex, but the *payload* differs, and no
   client-side transform can bridge a hash preimage. When the backend answers
   `401`, the UI verifies the signature locally against both schemes and names
   the mismatch instead of repeating "Invalid signature". Tracked in Backend #9.

2. **Delivery results are never produced for purchases made through the API.**
   `PromptDeliveryService.acceptVerifiedEvent` is not called from the confirm
   path, so `GET /api/prompt-delivery/{purchaseId}` returns `404` indefinitely
   for a purchase settled over HTTP. The UI treats that as pending — which is
   the honest reading — but it will stay pending until the backend publishes the
   verified-purchase event.

3. **A transient RPC failure during confirmation is recorded as terminal.**
   `verifyTransaction` catches every error and returns `false`, which writes
   `status = FAILED`. Polling to a definitive chain result before confirming
   avoids the common case, but a backend-side RPC outage during confirmation
   still burns the intent. The UI does not present that as certain: it reports
   what the server said and points at the transaction receipt.

## Not addressed here

- **Test runner and CI** belong to UI #7, whose pull request is now merged:
  `npm test`, `npm run test:e2e` and the CI workflow live on `main`.
  `lib/market/purchase-state.ts` is deliberately pure and fully exported so that
  suite can cover it.
- **Full session lifecycle** — route protection, live account and network
  watching, restoring an interrupted action after sign-in — belongs to UI #5.
  `lib/market/session.tsx` implements the minimum the purchase gate needs.
- **The Material Symbols icon font is not loaded anywhere in this repository**,
  so `<span class="material-symbols-outlined">payments</span>` paints the word
  "payments". The market path avoids the problem entirely by shipping inline
  SVG, but `/publish` still shows the raw names. Fixing it properly needs a
  decision about self-hosting, since the backend supplies icon names as data.
