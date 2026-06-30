'use client';

import { useEffect, useMemo, useState } from "react";
import Footer from "@/components/agentverse/Footer";
import GlassCard from "@/components/agentverse/GlassCard";
import NavBar from "@/components/agentverse/NavBar";
import { fetchCategories, fetchFeatured, fetchTrending, searchAssets } from "@/lib/api";
import type { Category, MarketplaceItem } from "@/lib/api";

const fallbackFeatured: MarketplaceItem[] = [
  {
    id: "featured-1",
    title: "Nova-7 Strategist",
    slug: "nova-7-strategist",
    category: "Featured Agent",
    creator: "NeuralLabs",
    creatorPublicKey: "GAAA…",
    rating: "4.9",
    price: "25 Credits",
    priceValue: 25,
    currency: "CR",
    tag: "AGENT",
    gradient: "from-accent/10 to-transparent",
    description: "AI strategy agent for market analysis.",
    imageUrl: "",
    executions: 1420,
  },
  {
    id: "featured-2",
    title: "CryptoPulse Flow",
    slug: "cryptopulse-flow",
    category: "Top Workflow",
    creator: "QuantCore",
    creatorPublicKey: "GBBB…",
    rating: "4.7",
    price: "50 Credits",
    priceValue: 50,
    currency: "CR",
    tag: "WORKFLOW",
    gradient: "from-accent/10 to-transparent",
    description: "Automated crypto trading workflow.",
    imageUrl: "",
    executions: 980,
  },
  {
    id: "featured-3",
    title: "EcoTrend Ledger",
    slug: "ecotrend-ledger",
    category: "New Dataset",
    creator: "GaiaSystems",
    creatorPublicKey: "GCCC…",
    rating: "5.0",
    price: "12 Credits",
    priceValue: 12,
    currency: "CR",
    tag: "DATASET",
    gradient: "from-accent/10 to-transparent",
    description: "Environmental trend dataset.",
    imageUrl: "",
    executions: 2340,
  },
];

const fallbackTrending: MarketplaceItem[] = [
  { title: "CodeArchitect v2", creator: "DevMaster", rating: "4.8", price: "320 CR", tag: "AGENT", id: "", slug: "", category: "", creatorPublicKey: "", priceValue: 320, currency: "CR", gradient: "", description: "", imageUrl: "", executions: 0 },
  { title: "LegalScryer Data", creator: "JurisData", rating: "4.9", price: "1,800 CR", tag: "DATASET", id: "", slug: "", category: "", creatorPublicKey: "", priceValue: 1800, currency: "CR", gradient: "", description: "", imageUrl: "", executions: 0 },
  { title: "Visionary Prompt", creator: "PixelMind", rating: "4.7", price: "85 CR", tag: "PROMPT", id: "", slug: "", category: "", creatorPublicKey: "", priceValue: 85, currency: "CR", gradient: "", description: "", imageUrl: "", executions: 0 },
  { title: "Salesforce Automata", creator: "OmniZense", rating: "4.6", price: "560 CR", tag: "WORKFLOW", id: "", slug: "", category: "", creatorPublicKey: "", priceValue: 560, currency: "CR", gradient: "", description: "", imageUrl: "", executions: 0 },
  { title: "MarketPulse AI", creator: "FinTech.ai", rating: "4.7", price: "30 CR", tag: "AGENT", id: "", slug: "", category: "", creatorPublicKey: "", priceValue: 30, currency: "CR", gradient: "", description: "", imageUrl: "", executions: 0 },
  { title: "OmniVision Agent", creator: "Visionary", rating: "4.9", price: "45 CR", tag: "AGENT", id: "", slug: "", category: "", creatorPublicKey: "", priceValue: 45, currency: "CR", gradient: "", description: "", imageUrl: "", executions: 0 },
];

const categoryDefs: Category[] = [
  { label: "Agents", icon: "smart_toy", type: "AGENT" },
  { label: "Prompts", icon: "terminal", type: "PROMPT" },
  { label: "Datasets", icon: "database", type: "DATASET" },
  { label: "Workflows", icon: "account_tree", type: "WORKFLOW" },
];

function assetIcon(tag: string) {
  if (tag === "AGENT") return "smart_toy";
  if (tag === "WORKFLOW") return "account_tree";
  if (tag === "PROMPT") return "terminal";
  return "database";
}

function MarketplaceCard({ item, featured = false }: { item: MarketplaceItem; featured?: boolean }) {
  return (
    <GlassCard className={`overflow-hidden ${featured ? "min-w-[320px] md:min-w-[420px]" : "h-full"}`}>
      <div className={`relative flex ${featured ? "h-[17rem]" : "h-52"} items-center justify-center overflow-hidden bg-gradient-to-br from-surface-container-low to-surface-container-high`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(95,251,241,0.18),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />
        <span className="material-symbols-outlined relative z-10 text-7xl text-white/10">
          {assetIcon(item.tag)}
        </span>
        <div className="absolute right-4 top-4 rounded-full border border-accent/20 bg-background/75 px-3 py-1 text-xs font-medium tracking-[0.18em] text-accent backdrop-blur-md">
          {item.category || item.tag}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h3 className={`${featured ? "text-2xl" : "text-xl"} font-heading font-semibold text-primary`}>{item.title}</h3>
            <p className="mt-1 text-sm text-on-surface-variant">by {item.creator}</p>
          </div>
          <div className="flex items-center gap-1 text-accent">
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-sm font-medium">{item.rating}</span>
          </div>
        </div>
        <p className="mb-4 min-h-[3rem] text-sm leading-relaxed text-on-surface-variant">{item.description || "Premium asset for high-signal workflows."}</p>
        <div className="mt-auto flex items-center justify-between border-t border-outline-variant/15 pt-4">
          <div>
            <div className="text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">Price</div>
            <div className="text-lg font-semibold text-primary">{item.price}</div>
          </div>
          <button className="focus-ring rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-all hover:opacity-90 active:scale-95">
            Execute
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

export default function MarketplacePage() {
  const [featuredItems, setFeaturedItems] = useState<MarketplaceItem[]>(fallbackFeatured);
  const [trendingItems, setTrendingItems] = useState<MarketplaceItem[]>(fallbackTrending);
  const [apiCategories, setApiCategories] = useState<Category[]>(categoryDefs);
  const [activeCategory, setActiveCategory] = useState("Agents");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchFeatured().then(setFeaturedItems).catch(console.error);
    fetchTrending().then(setTrendingItems).catch(console.error);
    fetchCategories().then(setApiCategories).catch(console.error);
  }, []);

  const categories = useMemo(
    () => apiCategories.map((category) => ({ ...category, active: category.label === activeCategory })),
    [apiCategories, activeCategory],
  );

  const activeType = useMemo(
    () => categories.find((category) => category.label === activeCategory)?.type,
    [activeCategory, categories],
  );

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.length > 2) {
      searchAssets(value, activeType)
        .then((res) => setTrendingItems(res.items))
        .catch(console.error);
      return;
    }

    if (value.length === 0) {
      fetchTrending().then(setTrendingItems).catch(console.error);
    }
  };

  const filteredTrending = useMemo(() => {
    if (!activeType) return trendingItems;
    return trendingItems.filter((item) => item.tag === activeType);
  }, [activeType, trendingItems]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <NavBar
        links={[
          { label: "Marketplace", href: "/marketplace", active: true },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Wallet", href: "/wallet" },
        ]}
        rightContent={
          <button className="focus-ring rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-all hover:opacity-90 active:scale-95">
            Launch App
          </button>
        }
      />

      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute left-[5%] top-[12%] h-[24rem] w-[24rem] rounded-full bg-accent/8 blur-[120px]" />
        <div className="absolute right-[7%] top-[22%] h-[18rem] w-[18rem] rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      <main className="page-shell pt-28 pb-24">
        <section className="mb-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-4">
            <p className="section-kicker">Marketplace</p>
            <h1 className="section-title text-4xl md:text-6xl">Discover premium AI assets</h1>
            <p className="section-copy max-w-2xl">
              Browse agents, prompts, datasets, and workflows with a cleaner hierarchy, tighter spacing, and product-grade presentation.
            </p>
          </div>
          <GlassCard className="p-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-semibold text-primary">{featuredItems.length}</div>
                <div className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">Featured</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-primary">{trendingItems.length}</div>
                <div className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">Trending</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-primary">24/7</div>
                <div className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">Live</div>
              </div>
            </div>
          </GlassCard>
        </section>

        <section className="mb-10 space-y-4">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline">
              <span className="material-symbols-outlined">search</span>
            </span>
            <input
              className="input-surface pl-12"
              placeholder="Search agents, prompts, workflows, or datasets"
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.label}
                onClick={() => setActiveCategory(category.label)}
                className={`focus-ring inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all ${
                  category.active
                    ? "border-accent/30 bg-accent/10 text-accent"
                    : "border-outline-variant/20 text-on-surface-variant hover:border-accent/25 hover:text-primary"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="section-kicker mb-2">Featured</p>
              <h2 className="section-title text-2xl md:text-3xl">Editor’s picks</h2>
            </div>
            <a className="text-sm font-medium text-accent hover:underline" href="#">
              View all
            </a>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {featuredItems.map((item) => (
              <div key={item.id || item.title} className="shrink-0">
                <MarketplaceCard item={item} featured />
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="section-kicker mb-2">Trending</p>
              <h2 className="section-title text-2xl md:text-3xl">High-signal assets</h2>
            </div>
            <span className="text-sm text-on-surface-variant">Showing {filteredTrending.length} results</span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTrending.map((item) => (
              <MarketplaceCard key={item.id || item.title} item={item} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
