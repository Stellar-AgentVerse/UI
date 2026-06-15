'use client';

import { useState, useEffect } from "react";
import NavBar from "@/components/agentverse/NavBar";
import Footer from "@/components/agentverse/Footer";
import GlassCard from "@/components/agentverse/GlassCard";
import { fetchFeatured, fetchTrending, fetchCategories } from "@/lib/api";
import type { MarketplaceItem, Category } from "@/lib/api";

const fallbackFeatured: MarketplaceItem[] = [
  {
    title: "Nova-7 Strategist",
    category: "Featured Agent",
    creator: "NeuralLabs",
    rating: "4.9",
    price: "25 Credits",
    gradient: "from-accent/10 to-transparent",
    tag: "AGENT",
  },
  {
    title: "CryptoPulse Flow",
    category: "Top Workflow",
    creator: "QuantCore",
    rating: "4.7",
    price: "50 Credits",
    gradient: "from-accent/10 to-transparent",
    tag: "WORKFLOW",
  },
  {
    title: "EcoTrend Ledger",
    category: "New Dataset",
    creator: "GaiaSystems",
    rating: "5.0",
    price: "12 Credits",
    gradient: "from-accent/10 to-transparent",
    tag: "DATASET",
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

const fallbackCategories = [
  { label: "Agents", icon: "smart_toy", active: true },
  { label: "Prompts", icon: "terminal", active: false },
  { label: "Datasets", icon: "database", active: false },
  { label: "Workflows", icon: "account_tree", active: false },
];

export default function MarketplacePage() {
  const [featuredItems, setFeaturedItems] = useState<MarketplaceItem[]>(fallbackFeatured);
  const [trendingItems, setTrendingItems] = useState<MarketplaceItem[]>(fallbackTrending);
  const [categories, setCategories] = useState<({ label: string; icon: string; active: boolean })[]>(fallbackCategories);
  const [activeCategory, setActiveCategory] = useState("Agents");

  useEffect(() => {
    fetchFeatured().then(setFeaturedItems).catch(console.error);
    fetchTrending().then(setTrendingItems).catch(console.error);
    fetchCategories().then((apiCats) => {
      setCategories(apiCats.map((c) => ({ label: c.label, icon: c.icon, active: c.label === activeCategory })));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    setCategories((prev) => prev.map((c) => ({ ...c, active: c.label === activeCategory })));
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-[#050816] overflow-x-hidden">
      <NavBar
        links={[
          { label: "Marketplace", href: "/marketplace", active: true },
          { label: "Documentation", href: "#" },
          { label: "Creators", href: "#" },
        ]}
      />

      <main className="pt-20 pb-xl">
        {/* Search + Filters */}
        <section className="max-w-container-max mx-auto px-md pt-lg pb-md">
          <div className="flex flex-col gap-lg">
            <div className="relative group">
              <div className="absolute inset-y-0 left-md flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline">
                  search
                </span>
              </div>
              <input
                className="w-full bg-[#0A0E1A] border border-outline-variant/30 rounded-xl py-lg pl-xl pr-md text-body-lg font-body-lg focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                placeholder="Search for intelligent agents, prompts, or data..."
                type="text"
              />
            </div>
            <div className="flex flex-wrap gap-sm">
              {categories.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(cat.label)}
                  className={`px-md py-sm rounded-full border font-label-sm text-label-sm flex items-center gap-xs transition-all ${
                    cat.active
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-outline-variant/30 text-on-surface-variant hover:border-accent hover:text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {cat.icon}
                  </span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Section */}
        <section className="mt-lg">
          <div className="max-w-container-max mx-auto px-md mb-md flex justify-between items-end">
            <h2 className="font-headline-lg text-headline-lg text-primary">
              Featured
            </h2>
            <a
              className="text-accent font-label-sm text-label-sm flex items-center gap-xs hover:underline decoration-accent underline-offset-4"
              href="#"
            >
              View All{" "}
              <span className="material-symbols-outlined">arrow_forward</span>
            </a>
          </div>
          <div className="flex overflow-x-auto gap-md px-md pb-lg snap-x scroll-smooth" style={{ scrollbarWidth: "thin", scrollbarColor: "#5FFBF1 transparent" }}>
            {featuredItems.map((item) => (
              <div
                key={item.title}
                className="min-w-[320px] md:min-w-[440px] snap-start glass-card rounded-xl overflow-hidden flex-shrink-0 group"
              >
                <div className="relative h-56 overflow-hidden bg-gradient-to-br from-surface-container-high to-surface">
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-7xl text-primary/10">
                      {item.tag === "AGENT"
                        ? "smart_toy"
                        : item.tag === "WORKFLOW"
                          ? "account_tree"
                          : "database"}
                    </span>
                  </div>
                  <div className="absolute top-sm right-sm bg-background/80 backdrop-blur-md px-sm py-xs rounded-full border border-accent/20">
                    <span className="text-accent font-label-sm text-label-sm">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="p-md">
                  <div className="flex justify-between items-start mb-sm">
                    <h3 className="font-headline-md text-[24px] text-primary">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-xs text-[#FFD700]">
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span className="font-label-sm text-label-sm">
                        {item.rating}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-sm mb-lg">
                    <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-accent text-[16px]">
                        verified
                      </span>
                    </div>
                    <span className="font-body-md text-on-surface-variant">
                      by {item.creator}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-accent font-headline-md text-[20px]">
                      {item.price}
                    </span>
                    <button className="bg-accent text-background px-lg py-sm rounded-lg font-label-sm text-label-sm font-bold hover:brightness-110 active:scale-95 transition-all">
                      Execute
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trending Now */}
        <section className="max-w-container-max mx-auto px-md mt-xl">
          <div className="flex items-center justify-between mb-lg border-b border-outline-variant/30 pb-sm">
            <div className="flex gap-lg">
              <button className="font-headline-md text-headline-md text-primary border-b-2 border-accent pb-sm">
                Trending Now
              </button>
              <button className="font-headline-md text-headline-md text-on-surface-variant hover:text-primary transition-colors pb-sm">
                Top Rated
              </button>
              <button className="font-headline-md text-headline-md text-on-surface-variant hover:text-primary transition-colors pb-sm">
                Recent
              </button>
            </div>
            <button className="text-accent font-body-md text-body-md flex items-center gap-xs hover:underline">
              View All Assets{" "}
              <span className="material-symbols-outlined text-[18px]">
                open_in_new
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
            {trendingItems.map((item) => (
              <GlassCard
                key={item.title}
                className="rounded-xl overflow-hidden flex flex-col h-full group"
              >
                <div className="h-48 overflow-hidden relative bg-gradient-to-br from-surface-container-high to-surface flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-primary/10">
                    {item.tag === "AGENT"
                      ? "smart_toy"
                      : item.tag === "DATASET"
                        ? "database"
                        : item.tag === "PROMPT"
                          ? "terminal"
                          : "account_tree"}
                  </span>
                  <div className="absolute top-sm right-sm bg-background/80 backdrop-blur-md px-sm py-xs rounded text-accent font-label-sm text-label-sm border border-accent/20">
                    {item.tag}
                  </div>
                </div>
                <div className="p-md flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-sm">
                    <h3 className="font-headline-md text-[20px] leading-tight text-primary">
                      {item.title}
                    </h3>
                    <div className="flex items-center text-accent text-label-sm font-label-sm">
                      <span
                        className="material-symbols-outlined text-[14px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span className="ml-xs">{item.rating}</span>
                    </div>
                  </div>
                  <p className="text-on-surface-variant font-body-md text-body-md mb-md flex-1">
                    by {item.creator}
                  </p>
                  <div className="flex items-center justify-between border-t border-outline-variant/20 pt-md mt-auto">
                    <div className="flex flex-col">
                      <span className="text-on-surface-variant font-label-sm text-label-sm uppercase opacity-50">
                        PRICE
                      </span>
                      <span className="font-bold text-primary">
                        {item.price}
                      </span>
                    </div>
                    <button className="bg-primary text-background px-md py-sm rounded font-semibold hover:bg-accent hover:text-background transition-colors active:scale-95">
                      Execute
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          <div className="mt-lg flex justify-center">
            <button className="px-xl py-md border border-outline-variant/30 text-primary font-label-sm text-label-sm rounded-lg hover:border-accent transition-all flex items-center gap-base">
              Load More Assets
              <span className="material-symbols-outlined">expand_more</span>
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
