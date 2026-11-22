"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Languages, Printer } from "lucide-react";
import type { ConlangLanguage, Entry, EntryType } from "@/types/codex";
import { translateVietnameseToConlang } from "@/lib/conlang";
import { classifyPowerTier, formatUnboundedPower } from "@/lib/v3-engines";
import { entrySupportsPower } from "@/lib/v5-properties";
import { RenderDynamicPropertyValue } from "./DynamicPropertiesPanel";
import {
  MarkdownCodexRenderer,
  type LinkLookupItem
} from "./MarkdownCodexRenderer";

export function PublicEntryArticleClient({
  workspaceSlug,
  entry,
  entryType,
  linkLookup,
  conlang
}: {
  workspaceSlug: string;
  entry: Entry;
  entryType?: EntryType;
  linkLookup: LinkLookupItem[];
  conlang?: ConlangLanguage;
}) {
  const router = useRouter();
  const [conlangMode, setConlangMode] = useState<
    "vi" | "bilingual" | "romanized" | "runic"
  >("vi");

  function cycleConlang() {
    const order: Array<"vi" | "bilingual" | "romanized" | "runic"> = [
      "vi",
      "bilingual",
      "romanized",
      "runic"
    ];
    setConlangMode(order[(order.indexOf(conlangMode) + 1) % order.length]);
  }

  const title =
    conlangMode === "vi"
      ? entry.title
      : conlangMode === "runic"
      ? translateVietnameseToConlang(entry.title, conlang).runic
      : translateVietnameseToConlang(entry.title, conlang).romanized;

  return (
    <article className="codex-card arcane-corners rounded-2xl p-6 sm:p-8 space-y-5">
      {entry.coverImage && (
        <img
          src={entry.coverImage}
          alt={entry.title}
          className="w-full h-56 object-cover rounded-xl border border-[var(--border-subtle)]"
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 no-print">
        <span className="text-xs font-mono text-[var(--accent)]">
          {entryType?.sigil || "✦"} {entryType?.name || "Hồ sơ Codex"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cycleConlang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-strong)] text-xs text-[var(--accent)] hover:bg-[var(--accent-soft)] cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5" />
            {conlangMode === "vi"
              ? `Dịch 1-Click: ${conlang?.nativeName || "Aethel'va"}`
              : `Chế độ: ${conlangMode}`}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="p-1.5 rounded-xl border border-[var(--border-subtle)] text-[var(--text-muted)] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <header className="space-y-1.5">
        <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
          <span className="text-[var(--accent)] mr-2">{entry.sigil}</span>
          {title}
        </h1>
        {entry.subtitle && (
          <p className="italic text-sm text-[var(--text-muted)]">{entry.subtitle}</p>
        )}
        {entry.aliases && entry.aliases.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-[var(--text-muted)]">
            <span className="font-mono uppercase">Còn gọi là:</span>
            {entry.aliases.map((al) => (
              <span
                key={al}
                className="px-2 py-0.5 rounded-md bg-white/8 border border-[var(--border-subtle)] text-[var(--text-secondary)]"
              >
                {al}
              </span>
            ))}
          </div>
        )}
      </header>

      {entry.epigraph?.quote && (
        <blockquote className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-base)]/60 px-4 py-3 text-xs sm:text-sm italic text-[var(--text-primary)]">
          “{entry.epigraph.quote}”
          <footer className="not-italic text-[11px] text-[var(--accent)] mt-1 font-medium">
            — {entry.epigraph.author}
            {entry.epigraph.source ? `, ${entry.epigraph.source}` : ""}
          </footer>
        </blockquote>
      )}

      {entry.summary && (
        <p className="text-sm bg-[var(--accent-soft)] border-l-2 border-[var(--accent)] px-4 py-2.5 rounded-r-xl">
          {entry.summary}
        </p>
      )}

      {/* Public Infobox Summary */}
      {(() => {
        const supportsPower = entrySupportsPower(entry, entryType);
        const schemaFields = (entryType?.fieldSchema ?? []).filter(
          (f) =>
            f.showInInfobox &&
            f.type !== "private_note" &&
            f.type !== "table" &&
            entry.customFields?.[f.key] !== undefined &&
            entry.customFields?.[f.key] !== null &&
            entry.customFields?.[f.key] !== ""
        );
        const extraInfobox = (entry.extraFields ?? []).filter(
          (f) => f.showInInfobox && f.kind !== "private_note" && f.value.trim()
        );
        const hasPowerBadge =
          supportsPower && (entry.powerLevel !== undefined || entry.powerInfinite);

        if (!hasPowerBadge && schemaFields.length === 0 && extraInfobox.length === 0) {
          return null;
        }

        const tier = hasPowerBadge
          ? classifyPowerTier(entry.powerLevel, entry.powerInfinite, entry.powerTierOverride)
          : null;

        return (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2">
              <span className="font-display font-semibold text-xs text-[var(--accent)]">
                ✦ Thông số Tóm tắt (Infobox)
              </span>
              {tier && (
                <span
                  className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border"
                  style={{ borderColor: tier.color, color: tier.color }}
                >
                  ⚡ {formatUnboundedPower(entry.powerLevel, entry.powerInfinite)} · {tier.code} ({tier.label})
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
              {schemaFields.map((field) => {
                const val = entry.customFields?.[field.key];
                return (
                  <div
                    key={field.key}
                    className="flex justify-between gap-3 border-b border-[var(--border-subtle)]/50 pb-1"
                  >
                    <span className="text-[var(--text-muted)]">{field.label}</span>
                    <span className="font-medium text-right">
                      {Array.isArray(val)
                        ? val.join(", ")
                        : typeof val === "number"
                        ? `${val.toLocaleString("vi-VN")}${field.unit ? ` ${field.unit}` : ""}`
                        : String(val)}
                    </span>
                  </div>
                );
              })}
              {extraInfobox.map((prop) => (
                <div
                  key={prop.id}
                  className="flex justify-between items-center gap-3 border-b border-[var(--border-subtle)]/50 pb-1"
                >
                  <span className="text-[var(--text-muted)]">{prop.label}</span>
                  <div className="text-right font-medium">
                    <RenderDynamicPropertyValue prop={prop} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="codex-divider text-xs">✦</div>

      <MarkdownCodexRenderer
        markdown={entry.contentMarkdown}
        linkLookup={linkLookup}
        conlang={conlang}
        conlangDisplayMode={conlangMode}
        onOpenEntry={(id) => {
          const target = linkLookup.find((x) => x.id === id);
          if (target) router.push(`/public/${workspaceSlug}/${target.slug}`);
        }}
      />

      {entry.customSections && entry.customSections.length > 0 && (
        <section className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
          {entry.customSections.map((sec) => (
            <div
              key={sec.id}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 p-4 space-y-1.5"
            >
              <h2 className="font-display text-lg font-semibold text-[var(--accent)]">
                {sec.sigil} {sec.title}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                {sec.content}
              </p>
            </div>
          ))}
        </section>
      )}

      {entry.sourcesMarkdown && (
        <section className="pt-4 border-t border-[var(--border-subtle)] space-y-1.5">
          <h2 className="font-display text-base text-[var(--accent)]">
            ✦ Nguồn & Tài liệu tham khảo
          </h2>
          <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap">
            {entry.sourcesMarkdown}
          </p>
        </section>
      )}
    </article>
  );
}
