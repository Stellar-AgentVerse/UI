const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

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

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...fetchOpts.headers },
    ...fetchOpts,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${res.statusText} — ${body}`);
  }

  const json = await res.json();

  // Unwrap { data, meta } envelope used by backend ResponseInterceptor
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data;
  }

  return json;
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

export function fetchAssetTypes() {
  return request<AssetType[]>('/api/assets/types');
}

export function fetchTags() {
  return request<{ id: string; name: string; slug: string }[]>('/api/assets/tags');
}

export function fetchAsset(id: string) {
  return request<AssetDetail>(`/api/assets/${id}`);
}

export function createAsset(payload: CreateAssetPayload, creator?: string) {
  return request<AssetDetail>('/api/assets', {
    method: 'POST',
    body: JSON.stringify(payload),
    params: { creator },
  });
}
