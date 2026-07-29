const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

const AUTH_TOKEN_KEY = 'agentverse.auth.token';
const AUTH_USER_KEY = 'agentverse.auth.user';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly details?: unknown,
  ) {
    super(`API ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
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
  const res = await fetch(url, {
    ...fetchOpts,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...fetchOpts.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    let details: unknown = body;
    try {
      details = body ? JSON.parse(body) : undefined;
    } catch {
      // Keep non-JSON error bodies as text.
    }
    throw new ApiError(res.status, res.statusText, details);
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
export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  description?: string;
  customer?: { email?: string; name?: string };
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

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

export function fetchPayments(params?: { limit?: number; skip?: number; status?: string }) {
  return request<Payment[]>('/api/payments', { params: params as Record<string, string | number | undefined> });
}

export function fetchPayment(id: string) {
  return request<Payment>(`/api/payments/${id}`);
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

// ── Tokens ──
export interface TokenItem {
  id: string;
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  supply: number;
  icon?: string;
  description?: string;
}

export interface TokenTransaction {
  id: string;
  tokenId: string;
  type: 'BUY' | 'SELL';
  amount: number;
  price: number;
  total: number;
  status: string;
  createdAt: string;
}

export function fetchTokens() {
  return request<TokenItem[]>('/api/tokens');
}

export function buyToken(tokenId: string, amount: number) {
  return request<TokenTransaction>('/api/tokens/buy', {
    method: 'POST',
    body: JSON.stringify({ tokenId, amount }),
  });
}

export function sellToken(tokenId: string, amount: number) {
  return request<TokenTransaction>('/api/tokens/sell', {
    method: 'POST',
    body: JSON.stringify({ tokenId, amount }),
  });
}

// ── Auth (traditional) ──
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName?: string;
}

export function login(payload: LoginPayload) {
  return request<AuthResult>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function register(payload: RegisterPayload) {
  return request<AuthResult>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchUserProfile() {
  return request<User>('/api/users/me');
}
