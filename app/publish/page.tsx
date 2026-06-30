'use client';

import { useEffect, useMemo, useState } from "react";
import Footer from "@/components/agentverse/Footer";
import GlassCard from "@/components/agentverse/GlassCard";
import NavBar from "@/components/agentverse/NavBar";
import { createAsset, fetchAssetTypes, fetchTags } from "@/lib/api";
import type { AssetType } from "@/lib/api";

const fallbackTypes: AssetType[] = [
  { id: "agent", icon: "smart_toy", title: "Agent", description: "Autonomous logic entities powered by LLMs." },
  { id: "prompt", icon: "terminal", title: "Prompt", description: "Optimized instructions and reasoning chains." },
  { id: "model", icon: "memory", title: "Model", description: "Custom fine-tunes or specialized weights." },
  { id: "dataset", icon: "database", title: "Dataset", description: "High-signal training corpora or vector stores." },
  { id: "tool", icon: "build", title: "Tool", description: "Custom API connectors and function calls." },
  { id: "oracle", icon: "radar", title: "Oracle", description: "Real-world data validation for smart agents." },
];

const defaultTags = ["beta", "experimental", "stable", "deprecated"];

export default function PublishAsset() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>(fallbackTypes);
  const [assetName, setAssetName] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["beta"]);
  const [status, setStatus] = useState<"idle" | "creating" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [availableTags, setAvailableTags] = useState<string[]>(defaultTags);

  useEffect(() => {
    fetchAssetTypes().then(setAssetTypes).catch(console.error);
    fetchTags().then((tags) => setAvailableTags(tags.map((tag) => tag.name))).catch(console.error);
  }, []);

  const currentStep = useMemo(() => {
    if (!selectedType) return 1;
    if (!assetName.trim()) return 2;
    return 3;
  }, [assetName, selectedType]);

  const toggleTag = (tag: string) => {
    setSelectedTags((current) => {
      if (current.includes(tag)) return current.filter((item) => item !== tag);
      return [...current, tag];
    });
  };

  const handleCreate = async () => {
    if (!selectedType || !assetName.trim()) {
      setStatus("error");
      setMessage("Select an asset type and provide a name before continuing.");
      return;
    }

    setStatus("creating");
    setMessage("Creating asset and preparing the detail page...");

    try {
      const result = await createAsset({
        name: assetName,
        type: selectedType,
        tags: selectedTags,
      });
      window.location.href = `/assets/${result.id}`;
    } catch (err) {
      setStatus("error");
      setMessage(`Failed to create asset: ${(err as Error).message}`);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <NavBar
        links={[
          { label: "Marketplace", href: "/marketplace" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Publish", href: "/publish", active: true },
        ]}
        rightContent={<button className="focus-ring rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-all hover:opacity-90 active:scale-95">Launch App</button>}
      />

      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-24 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-accent/8 blur-[120px]" />
      </div>

      <main className="page-shell pt-28 pb-32">
        <section className="mb-10 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
          <div className="space-y-4">
            <p className="section-kicker">Publish flow</p>
            <h1 className="section-title text-4xl md:text-6xl">Build and ship a new asset</h1>
            <p className="section-copy max-w-2xl">
              A cleaner creation flow with explicit steps, stronger states, and a better visual hierarchy for serious creators.
            </p>
          </div>

          <GlassCard className="p-5">
            <div className="flex items-center justify-between">
              {[
                { step: 1, label: "Type" },
                { step: 2, label: "Identity" },
                { step: 3, label: "Review" },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center gap-2 text-center">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${currentStep >= item.step ? "border-accent/30 bg-accent/10 text-accent" : "border-outline-variant/20 text-on-surface-variant"}`}>
                    {item.step}
                  </div>
                  <span className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">{item.label}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <GlassCard className="p-6">
            <div className="mb-6">
              <p className="section-kicker mb-2">Step 1</p>
              <h2 className="section-title text-2xl md:text-3xl">Choose the asset type</h2>
              <p className="mt-2 text-sm text-on-surface-variant">Select the core architecture for your new decentralized asset.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {assetTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`focus-ring relative rounded-2xl border p-5 text-left transition-all ${selectedType === type.id ? "border-accent/35 bg-accent/10 shadow-[0_18px_50px_rgba(95,251,241,0.07)]" : "border-outline-variant/20 bg-white/3 hover:border-accent/25 hover:bg-white/5"}`}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-accent">
                    <span className="material-symbols-outlined text-[24px]">{type.icon}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-primary">{type.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{type.description}</p>
                  {selectedType === type.id ? <span className="absolute right-4 top-4 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-on-primary">Selected</span> : null}
                </button>
              ))}
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <label className="section-kicker mb-3 block">Asset name</label>
                <input
                  className="input-surface"
                  placeholder="e.g. Neural-Sentience-v1"
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                />
              </div>

              <div>
                <label className="section-kicker mb-3 block">Metadata tags</label>
                <div className="flex flex-wrap gap-3">
                  {availableTags.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`focus-ring rounded-full border px-4 py-2 text-sm transition-all ${active ? "border-accent/30 bg-accent/10 text-accent" : "border-outline-variant/20 text-on-surface-variant hover:border-accent/25 hover:text-primary"}`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </GlassCard>

          <div className="space-y-4">
            <GlassCard className="p-6">
              <p className="section-kicker mb-2">Review</p>
              <h2 className="section-title text-2xl">Asset summary</h2>
              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant/15 bg-white/3 p-4">
                  <span className="text-on-surface-variant">Type</span>
                  <span className="font-medium text-primary">{selectedType ?? "Not selected"}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant/15 bg-white/3 p-4">
                  <span className="text-on-surface-variant">Name</span>
                  <span className="font-medium text-primary">{assetName.trim() || "Untitled asset"}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant/15 bg-white/3 p-4">
                  <span className="text-on-surface-variant">Tags</span>
                  <span className="font-medium text-primary">{selectedTags.length ? selectedTags.join(", ") : "No tags"}</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <p className="section-kicker mb-2">State</p>
              <h2 className="section-title text-2xl">Creation status</h2>
              <div className={`mt-4 rounded-2xl border p-4 text-sm ${status === "error" ? "border-danger/30 bg-danger/10 text-danger" : status === "creating" ? "border-accent/30 bg-accent/10 text-accent" : "border-outline-variant/20 bg-white/3 text-on-surface-variant"}`}>
                {message || "Ready to create your asset."}
              </div>
            </GlassCard>
          </div>
        </section>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/10 bg-background/85 backdrop-blur-2xl">
        <div className="page-shell flex items-center justify-between gap-4 py-4">
          <button className="focus-ring inline-flex items-center gap-2 rounded-full border border-outline-variant/25 px-4 py-3 text-sm text-on-surface-variant transition-colors hover:border-accent/25 hover:text-primary">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Cancel
          </button>

          <button
            onClick={handleCreate}
            className="focus-ring inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition-all hover:opacity-90 active:scale-95"
          >
            {status === "creating" ? "Creating..." : selectedType && assetName.trim() ? "Create asset" : "Continue"}
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </footer>

      <Footer />
    </div>
  );
}
