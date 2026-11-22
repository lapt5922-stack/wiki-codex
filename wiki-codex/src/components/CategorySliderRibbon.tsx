"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Layers, Sparkles } from "lucide-react";
import type { Category } from "@/types/codex";

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
  onToggleFeatured,
}: CategorySliderRibbonProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 6);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [categories.length, updateScrollButtons]);

  const scrollByAmount = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="relative group/ribbon rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-md px-2 py-2 animate-codex-fade-up">
      {/* Left Scroll Arrow */}
      {canLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount(-260)}
          aria-label="Trượt danh mục sang trái"
          className="hidden sm:flex absolute left-1.5 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)]/95 text-[var(--accent)] shadow-lg hover:scale-105 transition cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Horizontal Scrollable Pill Strip */}
      <div
        ref={scrollerRef}
        className="codex-ribbon-scroll flex items-center gap-2 overflow-x-auto px-1 sm:px-2"
      >
        {/* All entries pill */}
        <button
          type="button"
          onClick={() => onSelectCategory("")}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer border ${
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
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer border ${
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
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer border ${
                isActive
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold shadow-sm"
                  : "border-[var(--border-subtle)] bg-[var(--bg-base)]/50 text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span
                className="inline-block h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.color || "var(--accent)" }}
              />
              {cat.sigil && <span className="text-[11px]">{cat.sigil}</span>}
              <span className="whitespace-nowrap">{cat.name}</span>
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-muted)]">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right Scroll Arrow */}
      {canRight && (
        <button
          type="button"
          onClick={() => scrollByAmount(260)}
          aria-label="Trượt danh mục sang phải"
          className="hidden sm:flex absolute right-1.5 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)]/95 text-[var(--accent)] shadow-lg hover:scale-105 transition cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
