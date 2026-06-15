'use client';

import { useState, useEffect } from "react";
import GlassCard from "@/components/agentverse/GlassCard";
import Footer from "@/components/agentverse/Footer";
import { fetchAssetTypes, createAsset } from "@/lib/api";
import type { AssetType } from "@/lib/api";

const fallbackTypes: AssetType[] = [
  {
    id: "agent",
    icon: "smart_toy",
    title: "Agent",
    description: "Autonomous logic entities powered by LLMs.",
  },
  {
    id: "prompt",
    icon: "terminal",
    title: "Prompt",
    description: "Optimized instructions and reasoning chains.",
  },
  {
    id: "model",
    icon: "memory",
    title: "Model",
    description: "Custom fine-tunes or specialized weights.",
  },
  {
    id: "dataset",
    icon: "database",
    title: "Dataset",
    description: "High-signal training corpora or vector stores.",
  },
  {
    id: "tool",
    icon: "build",
    title: "Tool",
    description: "Custom API connectors and function calls.",
  },
  {
    id: "oracle",
    icon: "radar",
    title: "Oracle",
    description: "Real-world data validation for smart agents.",
  },
];

export default function PublishAsset() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>(fallbackTypes);

  useEffect(() => {
    fetchAssetTypes().then(setAssetTypes).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Top Navigation */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="max-w-container-max mx-auto px-md h-20 flex items-center justify-between">
          <div className="flex items-center gap-base">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-transparent border border-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg">
                auto_awesome
              </span>
            </div>
            <span className="font-headline-md text-headline-md font-bold tracking-tighter text-primary">
              AgentVerse
            </span>
          </div>
          <div className="hidden md:flex gap-lg">
            <a
              className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-300 font-label-sm text-label-sm"
              href="#"
            >
              MARKETPLACE
            </a>
            <a
              className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-300 font-label-sm text-label-sm"
              href="#"
            >
              DOCUMENTATION
            </a>
            <a
              className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-300 font-label-sm text-label-sm"
              href="#"
            >
              CREATORS
            </a>
          </div>
          <button className="bg-primary text-on-primary px-md py-xs font-label-sm text-label-sm hover:opacity-90 active:scale-95 transition-all">
            Launch App
          </button>
        </div>
      </header>

      <main className="min-h-screen pt-32 pb-40 flex flex-col items-center relative overflow-hidden">
        {/* Atmosphere */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

        <div className="w-full max-w-3xl px-md">
          {/* Progress Indicator */}
          <div className="mb-xl">
            <div className="flex justify-between items-center mb-base">
              <span className="font-label-sm text-label-sm text-primary">
                STEP 01
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                Asset Identity
              </span>
            </div>
            <div className="w-full h-1 bg-surface-container-highest overflow-hidden rounded-full">
              <div className="w-1/4 h-full bg-primary transition-all duration-700 ease-out rounded-full" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-lg">
            <div className="space-y-xs">
              <h1 className="font-headline-lg text-headline-lg text-primary">
                What are you building?
              </h1>
              <p className="text-on-surface-variant font-body-md">
                Select the core architecture for your new decentralized asset.
              </p>
            </div>

            {/* Asset Type Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
              {assetTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`glass-card border p-lg text-left transition-all duration-300 relative group overflow-hidden rounded-xl ${
                    selectedType === type.id
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/30 hover:border-white/30 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0)_100%),rgba(20,19,19,0.7)]"
                  }`}
                >
                  <div className="absolute top-0 right-0 p-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-primary/40 text-sm">
                      info
                    </span>
                  </div>
                  <div className="mb-md">
                    <span className="material-symbols-outlined text-primary text-4xl">
                      {type.icon}
                    </span>
                  </div>
                  <h3 className="text-primary font-headline-md text-headline-md mb-xs">
                    {type.title}
                  </h3>
                  <p className="text-on-surface-variant text-label-sm font-label-sm">
                    {type.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Form Section */}
            <div className="mt-xl space-y-md">
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                  Asset Name
                </label>
                <input
                  className="w-full bg-[#0A0E1A] border border-outline-variant/30 p-md text-primary focus:outline-none focus:border-primary transition-colors font-body-md rounded"
                  placeholder="e.g. Neural-Sentience-v1"
                  type="text"
                />
              </div>
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                  Initial Metadata Tag
                </label>
                <div className="flex gap-xs flex-wrap">
                  <span className="bg-primary/10 text-primary border border-primary/20 px-sm py-1 rounded-full text-label-sm font-label-sm">
                    beta
                  </span>
                  <span className="bg-surface-container-highest text-on-surface-variant px-sm py-1 rounded-full text-label-sm font-label-sm">
                    experimental
                  </span>
                  <span className="bg-surface-container-highest text-on-surface-variant px-sm py-1 rounded-full text-label-sm font-label-sm">
                    stable
                  </span>
                  <span className="bg-surface-container-highest text-on-surface-variant px-sm py-1 rounded-full text-label-sm font-label-sm">
                    deprecated
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Action Anchor */}
      <footer className="fixed bottom-0 w-full z-50 bg-background/80 backdrop-blur-xl border-t border-outline-variant/10 py-md">
        <div className="max-w-3xl mx-auto px-md flex items-center justify-between">
          <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-xs font-label-sm text-label-sm group">
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">
              arrow_back
            </span>
            Cancel
          </button>
          <div className="flex gap-md items-center">
            <span className="text-on-surface-variant font-label-sm text-label-sm opacity-50 hidden sm:block">
              Configuration pending...
            </span>
            <button className="bg-primary text-on-primary px-lg h-[52px] font-bold text-label-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-md uppercase tracking-widest rounded-sm">
              NEXT STEP
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </footer>

      <Footer />
    </div>
  );
}
