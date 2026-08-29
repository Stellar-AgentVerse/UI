/**
 * Market V1 scope.
 *
 * Market V1 deliberately sells exactly one curated product type: PROMPT.
 * Agents, datasets, workflows, models, oracles and credit packages are not
 * purchasable yet, so they must never be rendered as buyable products on the
 * market path.
 *
 * This module is the single source of truth for that decision. Every place
 * that filters, gates or explains the scope reads from here, so widening the
 * scope later is a one-line change rather than a hunt through the UI.
 */

/** Asset types Market V1 can actually sell and deliver. */
export const MARKET_V1_ASSET_TYPES = ['PROMPT'] as const;

export type MarketV1AssetType = (typeof MARKET_V1_ASSET_TYPES)[number];

/** Backend `type` value used to query the authoritative catalog. */
export const MARKET_V1_QUERY_TYPE: MarketV1AssetType = 'PROMPT';

export function isMarketV1AssetType(
  type: string | null | undefined,
): type is MarketV1AssetType {
  return (
    typeof type === 'string' &&
    (MARKET_V1_ASSET_TYPES as readonly string[]).includes(type)
  );
}

/**
 * Human label for an asset type. Only used to explain why something is not
 * for sale — never to advertise it.
 */
export function assetTypeLabel(type: string): string {
  const normalised = type.trim().toUpperCase();
  if (!normalised) return 'Asset';
  return normalised.charAt(0) + normalised.slice(1).toLowerCase();
}

export const MARKET_V1_SCOPE_NOTE =
  'Market V1 sells curated prompts only, on Stellar Testnet.';
