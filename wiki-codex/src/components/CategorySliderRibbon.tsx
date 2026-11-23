"use client";

import React from "react";
import { Layers, Sparkles } from "lucide-react";
import type { Category } from "@/types/codex";
import { DraggableScrollArea } from "./DraggableScrollArea";

interface CategorySliderRibbonProps {
  categories: Category[];
  categoryCounts: Record<string, number>;
  totalEntries: number;
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  showFeaturedQuickFilter?: boolean;
  featuredOnly?: boolean;
  onToggleFeatured?: () => void;
}

export function CategorySliderRibbon({
  categories,
  categoryCounts,
  totalEntries,
  selectedCategoryId,
  onSelectCategory,
  showFeaturedQuickFilter = false,
  featuredOnly = false,
  onToggleFeatured
}: CategorySliderRibbonProps) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-md px-2.5 py-2 animate-codex-fade-up">
      <DraggableScrollArea
        ariaLabel="Danh mục hồ sơ"
        innerClassName="flex items-center gap-2 px-1"
      >
        {/* All entries pill */}
        <button
          type="button"
          onClick={() => onSelectCategory("")}
          className={`shrink-0 min-h-[38px] inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer border ${
            selectedCategoryId === "" && !featuredOnly
              ? "border-[var(--accent)] bg-[var(--accent)] text-[#090e1c] font-semibold shadow-md"
              : "border-[var(--border-subtle)] bg-[var(--bg-base)]/60 text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Tất cả hồ sơ</span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono ${
              selectedCategoryId === "" && !featuredOnly
                ? "bg-black/20 text-[#090e1c]"
                : "bg-white/10 text-[var(--text-muted)]"
            }`}
          >
            {totalEntries}
          </span>
        </button>

        {/* Featured quick filter */}
        {showFeaturedQuickFilter && onToggleFeatured && (
          <button
            type="button"
            onClick={onToggleFeatured}
            className={`shrink-0 min-h-[38px] inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer border ${
              featuredOnly
                ? "border-amber-400 bg-amber-400/20 text-amber-200 font-semibold shadow"
                : "border-[var(--border-subtle)] bg-[var(--bg-base)]/60 text-[var(--text-secondary)] hover:border-amber-400/60"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Nổi bật</span>
          </button>
        )}

        {/* Category Pills */}
        {categories.map((cat) => {
          const isActive = selectedCategoryId === cat.id;
          const count = categoryCounts[cat.id] ?? 0;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(isActive ? "" : cat.id)}
              className={`shrink-0 min-h-[38px] inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer border ${
                isActive
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[#090e1c] font-semibold shadow-md"
                  : "border-[var(--border-subtle)] bg-[var(--bg-base)]/60 text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span>{cat.sigil}</span>
              <span>{cat.name}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono ${
                  isActive
                    ? "bg-black/20 text-[#090e1c]"
                    : "bg-white/10 text-[var(--text-muted)]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </DraggableScrollArea>
    </div>
  );
}
