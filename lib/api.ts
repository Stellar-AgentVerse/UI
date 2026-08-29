const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

const AUTH_TOKEN_KEY = 'agentverse.auth.token';
const AUTH_USER_KEY = 'agentverse.auth.user';

export class ApiError extends Error {
  /**
   * The message the backend actually sent, when it sent one. The backend's
   * error filter answers `{ statusCode, message, error }`, and that `message`
   * is the only thing that distinguishes several outcomes that share a status
   * code, so it is kept rather than flattened into `API 409: Conflict`.
   */
  public readonly serverMessage: string;

  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly details?: unknown,
    /** Correlation id from the response envelope, for support and reconciliation. */
    public readonly requestId?: string,
  ) {
    const serverMessage = extractServerMessage(details);
    super(serverMessage || `API ${status}: ${statusText}`);
    this.name = 'ApiError';
    this.serverMessage = serverMessage;
  }
}

function extractServerMessage(details: unknown): string {
  if (typeof details === 'string') return details.trim();
  if (!details || typeof details !== 'object') return '';
  const message = (details as { message?: unknown }).message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.map(String).join('; ');
  return '';
}

/**
 * Flatten any thrown value into the shape the purchase state machine maps.
 * A status of 0 means the request never got an answer, which is retryable and
 * must never be read as a refusal.
 */
export function toServerFailure(error: unknown): {
  status: number;
  message: string;
  requestId?: string;
} {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      message:
        error.serverMessage || `The marketplace returned ${error.status}.`,
      requestId: error.requestId,
    };
  }
  return {
    status: 0,
    message:
      error instanceof Error && error.message
        ? error.message
        : 'The marketplace could not be reached.',
  };
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') window.sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
    window.sessionStorage.removeItem(AUTH_USER_KEY);
  }
}

export function getAuthToken() {
  return typeof window === 'undefined' ? undefined : window.sessionStorage.getItem(AUTH_TOKEN_KEY) ?? undefined;
}

export function getAuthUser<T>() {
  if (typeof window === 'undefined') return undefined;
  const value = window.sessionStorage.getItem(AUTH_USER_KEY);
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

/**
 * A request that never answers is indistinguishable from a slow one, and a UI
 * that waits forever shows a skeleton forever. Every call gets a deadline so a
 * stalled backend becomes a visible, retryable error state instead.
 */
const REQUEST_TIMEOUT_MS = 15_000;

function timeoutSignal(): AbortSignal | undefined {
  // AbortSignal.timeout is unavailable in older runtimes; losing the deadline
  // is acceptable, throwing on a missing API is not.
  return typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
    ? AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    : undefined;
}

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOpts } = options;

  let url = `${API_BASE}${path}`;
  if (params) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) search.set(k, String(v));
    });
    const qs = search.toString();
    if (qs) url += `?${qs}`;
  }

  const authToken = getAuthToken();
  let res: Response;
  try {
    res = await fetch(url, {
      signal: fetchOpts.signal ?? timeoutSignal(),
      ...fetchOpts,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...fetchOpts.headers,
      },
    });
  } catch (error) {
    // fetch rejects for DNS, CORS, connection refused and timeouts alike. None
    // of them carry a status, so they are normalised into one honest message
    // rather than surfacing as an unhandled rejection.
    const timedOut =
      error instanceof DOMException && error.name === 'TimeoutError';
    throw new Error(
      timedOut
        ? `The marketplace did not answer within ${REQUEST_TIMEOUT_MS / 1000} seconds.`
        : 'The marketplace could not be reached.',
      { cause: error },
    );
  }

  const requestId = res.headers.get('x-request-id') ?? undefined;

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    let details: unknown = body;
    try {
      details = body ? JSON.parse(body) : undefined;
    } catch {
      // Keep non-JSON error bodies as text.
    }
    throw new ApiError(res.status, res.statusText, details, requestId);
  }

  if (res.status === 204) return undefined as T;

  const json = await res.json();

  // Unwrap { data, meta } envelope used by backend ResponseInterceptor
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data;
  }

  return json;
}

// ── Auth ──
export interface User {
  publicKey: string;
  status: 'ACTIVE' | 'SUSPENDED';
  displayName: string;
  avatar: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthResult {
  token: string;
  user: User;
}

export function requestAuthChallenge(publicKey: string) {
  return request<{ challenge: string }>('/api/auth/challenge', {
    method: 'POST',
    body: JSON.stringify({ publicKey }),
  });
}

export async function verifyWalletAuth(publicKey: string, signature: string) {
  const result = await request<AuthResult>('/api/auth/wallet', {
    method: 'POST',
    body: JSON.stringify({ publicKey, signature }),
  });
  setAuthToken(result.token);
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.user));
  }
  return result;
}

// ── Dashboard ──
export interface DashboardMetrics {
  totalRevenue: number;
  assetsPublished: number;
  totalExecutions: number;
  reliability: string;
  revenueTrend: string;
  pendingVerification: number;
}

export interface TopAsset {
  name: string;
  category: string;
  revenue: string;
  calls: string;
  gradient: string;
  assetId: string;
}

export interface ActivityLogItem {
  event: string;
  asset: string;
  status: string;
  statusClass: string;
  revenue: string;
  time: string;
}

export function fetchDashboardMetrics(creator?: string) {
  return request<DashboardMetrics>('/api/dashboard/metrics', {
    params: { creator },
  });
}

export function fetchTopAssets(creator?: string, limit?: number) {
  return request<TopAsset[]>('/api/dashboard/top-assets', {
    params: { creator, limit },
  });
}

export function fetchActivityLogs(creator?: string, limit?: number) {
  return request<ActivityLogItem[]>('/api/dashboard/activity-logs', {
    params: { creator, limit },
  });
}

// ── Marketplace ──
export interface MarketplaceItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  creator: string;
  creatorPublicKey: string;
  rating: string;
  price: string;
  priceValue: number;
  currency: string;
  tag: string;
  gradient: string;
  description: string;
  imageUrl: string;
  executions: number;
}

export interface MarketplaceSearchResult {
  items: MarketplaceItem[];
  total: number;
}

export interface Category {
  label: string;
  icon: string;
  type: string;
}

export function fetchFeatured(limit?: number) {
  return request<MarketplaceItem[]>('/api/marketplace/featured', {
    params: { limit },
  });
}

export function fetchTrending(limit?: number) {
  return request<MarketplaceItem[]>('/api/marketplace/trending', {
    params: { limit },
  });
}

export function fetchCategories() {
  return request<Category[]>('/api/marketplace/categories');
}

export function searchAssets(search?: string, type?: string, skip?: number, take?: number) {
  return request<MarketplaceSearchResult>('/api/marketplace/assets', {
    params: { search, type, skip, take },
  });
}

// ── Wallet ──
export interface WalletBalance {
  credits: number;
  xlmBalance: number;
  monthlyUsage: number;
  monthlyAllocation: number;
  usagePercent: number;
  xlmUsdEstimate: number;
}

export interface CreditPackage {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  credits: number;
  price: number;
  originalPrice: number | null;
  features: string[] | null;
  popular: boolean;
}

export interface WalletTransaction {
  id: string;
  type: string;
  description: string;
  txid: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface PurchaseResult {
  transaction: WalletTransaction;
  credits: number;
  message: string;
}

export function fetchWalletBalance(user?: string) {
  return request<WalletBalance>('/api/wallet/balance', { params: { user } });
}

export function fetchCreditPackages() {
  return request<CreditPackage[]>('/api/wallet/packages');
}

export function fetchWalletTransactions(user?: string, limit?: number, skip?: number) {
  return request<WalletTransaction[]>('/api/wallet/transactions', {
    params: { user, limit, skip },
  });
}

export function purchasePackage(packageId: string, user?: string) {
  return request<PurchaseResult>('/api/wallet/purchase', {
    method: 'POST',
    body: JSON.stringify({ packageId }),
    params: { user },
  });
}

// ── Assets ──
export interface AssetType {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface AssetDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  creatorPublicKey: string;
  price: number;
  status: string;
  imageUrl: string;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
  metrics?: {
    executions: number;
    revenue: number;
    activeUsers: number;
    rating: number;
    reliability: number;
  };
  capabilities?: { icon: string; title: string; description: string; sortOrder: number }[];
  workflow?: { stepOrder: number; icon: string; label: string; isActive: boolean; isFilled: boolean }[];
  specs?: { parameter: string; value: string; notes: string; sortOrder: number }[];
}

export interface CreateAssetPayload {
  name: string;
  type: string;
  description?: string;
  price?: number;
  tags?: string[];
}

export interface PurchaseIntent {
  purchaseId: string;
  unsignedXdr: string;
  expiresAt: string;
  contractId: string;
  networkPassphrase: string;
  assetId: string;
  amount: number;
  idempotencyKey: string;
}

export interface PurchaseAccess {
  purchaseId: string;
  assetId: string;
  deliveryReference: string;
  purchasedAt: string;
}

export function createPurchaseIntent(assetId: string, idempotencyKey?: string) {
  return request<PurchaseIntent>('/api/marketplace/purchases', {
    method: 'POST',
    body: JSON.stringify({ assetId, idempotencyKey }),
  });
}

export function confirmPurchase(purchaseId: string, transactionHash: string) {
  return request<{ purchaseId: string; status: string }>(`/api/marketplace/purchases/${purchaseId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ transactionHash }),
  });
}

export function fetchPurchaseAccess(purchaseId: string) {
  return request<PurchaseAccess>(`/api/marketplace/purchases/${purchaseId}/access`);
}

// ── Prompt delivery ──

/**
 * AES-256-GCM envelope produced by the backend delivery worker. The data key
 * is wrapped by the backend's KMS, so this ciphertext is not decryptable in a
 * browser; the UI renders it as a receipt, never as content.
 */
export interface EncryptedDeliveryEnvelope {
  version: number;
  algorithm: string;
  nonce: string;
  ciphertext: string;
  tag: string;
}

export interface DeliveryResult {
  id: string;
  canonicalId: string;
  commandId: string;
  purchaseId: string;
  buyerPublicKey: string;
  tenantId: string;
  encryptedResult: EncryptedDeliveryEnvelope;
  expiresAt: string;
  createdAt: string;
}

/**
 * Authenticated delivery result for a settled purchase.
 *
 * 404 here is the normal "not produced yet" answer, not an error state; the
 * caller distinguishes pending from expired using the message.
 */
export function fetchDeliveryResult(purchaseId: string) {
  return request<DeliveryResult>(`/api/prompt-delivery/${purchaseId}`);
}

export function fetchAssetTypes() {
  return request<AssetType[]>('/api/assets/types');
}

export function fetchTags() {
  return request<{ id: string; name: string; slug: string }[]>('/api/assets/tags');
}

export function fetchAsset(id: string) {
  return request<AssetDetail>(`/api/assets/${id}`);
}

export function createAsset(payload: CreateAssetPayload) {
  return request<AssetDetail>('/api/assets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ── Payments ──
export interface PaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  currency: string;
  provider: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface CreatePaymentPayload {
  amount: number;
  currency: string;
  provider?: string;
  description?: string;
  customer?: { email?: string; name?: string };
  metadata?: Record<string, unknown>;
}

export interface CreateRefundPayload {
  transactionId: string;
  amount?: number;
  reason?: string;
  provider?: string;
}

export function createPayment(payload: CreatePaymentPayload) {
  return request<PaymentResult>('/api/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createRefund(payload: CreateRefundPayload) {
  return request<PaymentResult>('/api/payments/refund', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function verifyPayment(transactionId: string, provider?: string) {
  return request<PaymentResult>(`/api/payments/verify/${transactionId}`, {
    params: { provider },
  });
}

export function fetchPaymentProviders() {
  return request<{ providers: string[] }>('/api/payments/providers');
}
