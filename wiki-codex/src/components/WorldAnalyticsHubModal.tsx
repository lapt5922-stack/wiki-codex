"use client";

import React, { useMemo, useState } from "react";
import { BookOpen, Globe2, Handshake, History, Languages, Package, Search, X } from "lucide-react";
import { DIPLOMACY_META } from "@/lib/planetary-atlas/climate-geology";
import { CONTINENT_NAME_VI } from "@/lib/planetary-atlas/nations-data";
import { analyzeNationToponymy } from "@/lib/wiki-auditor-pro";
import type { DiplomacyStatus, PlanetaryAtlasBundle, PlanetaryNation } from "@/lib/planetary-atlas/types";

interface WorldAnalyticsHubModalProps {
  bundle: PlanetaryAtlasBundle;
  onClose: () => void;
  onFocusNation: (nation: PlanetaryNation) => void;
  onOpenWikiEntry: (entryId: string) => void;
}

type HubTab = "diplomacy" | "trade" | "timeline" | "toponymy";

const PARALLEL_TIMELINE_LANES = [
  {
    lane: "Aurelia (Tam Biên)",
    color: "#3b82f6",
    events: [
      { tick: 0, title: "Thành lập Valoria, Zog-Koth & Ignisia", desc: "Ba trụ cột văn minh hình thành quanh Ngã Ba Tam Biên." },
      { tick: 250, title: "Ký kết Hiệp ước Liên minh Tam Biên", desc: "Thống nhất thương lộ, lưu trữ sử liệu và bảo vệ hòa bình khu vực." },
      { tick: 500, title: "Thành lập Vùng Đệm Lưu Trữ #201", desc: "Concordia Spire trở thành văn khố hiệp ước trung lập." },
      { tick: 750, title: "Khánh thành Học Viện Ngã Ba #203", desc: "Quy tụ 40.000 học giả, nhà trắc địa và ngôn ngữ học." },
    ],
  },
  {
    lane: "Occidentalis (Phương Tây)",
    color: "#6366f1",
    events: [
      { tick: 0, title: "Cộng hòa Ngân Hà Occidentia (#4)", desc: "Thiết lập hệ thống ngân hàng bạc và đài thiên văn Argentum." },
      { tick: 250, title: "Khai thông Kênh đào Trung Hải", desc: "Rút ngắn 4.200 km tuyến hàng hải sang Aurelia." },
      { tick: 500, title: "Liên bang Phương Tây chuẩn hóa hải đồ", desc: "Ban hành bộ quy tắc hàng hải chung 53 quốc gia." },
      { tick: 750, title: "Đại hội Khoa học Argentum", desc: "Chuẩn hóa đơn vị đo đạc kinh vĩ tuyến 360°." },
    ],
  },
  {
    lane: "Orientis (Viễn Đông)",
    color: "#10b981",
    events: [
      { tick: 0, title: "Thiên Triều Ngọc Lĩnh (#5)", desc: "Xây dựng hệ thống đê điều Long Mạch và chế độ khoa cử." },
      { tick: 250, title: "Mở Con đường Tơ lụa Aurelia–Orientis", desc: "Kết nối giao thương gốm men ngọc qua Eo biển Ngọc Bích." },
      { tick: 500, title: "Biên soạn Đại Sử Ký Viễn Đông", desc: "Ghi chép liên tục lịch sử 43 quốc gia Orientis." },
      { tick: 750, title: "Hiệp ước Bảo tồn Rừng Nam Đông", desc: "Thiết lập vùng bảo tồn dược liệu và trà cổ." },
    ],
  },
  {
    lane: "Solara, Hesperia & Australis",
    color: "#f59e0b",
    events: [
      { tick: 0, title: "Vương quốc Lục Bảo Solara (#7)", desc: "Xây dựng vườn thực vật cổ và đài quan sát nhật thực Heliopolis." },
      { tick: 250, title: "Đại Hải Trình kết nối Hesperia & Australis", desc: "Quần đảo Trung Dương Pelagia (#9) thành trung tâm hải hành." },
      { tick: 500, title: "Hiệp ước Khoa học Bắc & Nam Cực", desc: "Thành lập 17 trạm khảo sát khí hậu và băng hà." },
      { tick: 750, title: "Mạng lưới 12 Viện Lưu Trữ Hải Đảo", desc: "Hoàn tất đồng bộ 360 hồ sơ quốc gia toàn hành tinh." },
    ],
  },
];

export function WorldAnalyticsHubModal({
  bundle,
  onClose,
  onFocusNation,
  onOpenWikiEntry,
}: WorldAnalyticsHubModalProps) {
  const [tab, setTab] = useState<HubTab>("diplomacy");
  const [dipFilter, setDipFilter] = useState<DiplomacyStatus | "ALL">("ALL");
  const [query, setQuery] = useState("");

  const nationsById = useMemo(() => {
    const map = new Map<string, PlanetaryNation>();
    for (const n of bundle.nations) map.set(n.id, n);
    return map;
  }, [bundle.nations]);

  const dipCounts = useMemo(() => {
    const counts: Record<DiplomacyStatus, number> = {
      ALLIANCE: 0,
      FEDERATION: 0,
      TRADE_PACT: 0,
      NEUTRAL_PACT: 0,
      DISPUTED: 0,
      RIVALRY: 0,
    };
    for (const d of bundle.diplomacy) counts[d.status]++;
    return counts;
  }, [bundle.diplomacy]);

  const filteredDip = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bundle.diplomacy
      .filter((d) => {
        if (dipFilter !== "ALL" && d.status !== dipFilter) return false;
        if (!q) return true;
        const a = nationsById.get(d.polityAId);
        const b = nationsById.get(d.polityBId);
        return (
          d.treatyTitle.toLowerCase().includes(q) ||
          (a?.name.toLowerCase().includes(q) ?? false) ||
          (b?.name.toLowerCase().includes(q) ?? false)
        );
      })
      .slice(0, 80);
  }, [bundle.diplomacy, dipFilter, query, nationsById]);

  const filteredFlows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bundle.resourceFlows
      .filter((r) => {
        if (!q) return true;
        const src = nationsById.get(r.sourceNationId);
        const tgt = nationsById.get(r.targetNationId);
        return (
          r.resourceName.toLowerCase().includes(q) ||
          (src?.name.toLowerCase().includes(q) ?? false) ||
          (tgt?.name.toLowerCase().includes(q) ?? false)
        );
      })
      .slice(0, 80);
  }, [bundle.resourceFlows, query, nationsById]);

  const filteredToponymy = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bundle.nations
      .filter((n) => {
        if (!q) return true;
        return (
          `#${n.nationNum}`.includes(q) ||
          n.name.toLowerCase().includes(q) ||
          n.capital.toLowerCase().includes(q) ||
          n.primaryLanguage.toLowerCase().includes(q)
        );
      })
      .slice(0, 60)
      .map(analyzeNationToponymy);
  }, [bundle.nations, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-sm">
      <div className="animate-codex-scale-in flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/95 px-4 py-3">
          <div className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">
                Trung Tâm Phân Tích Thế Giới — Aethelgard Prime
              </h3>
              <p className="text-[11px] text-slate-400">
                Mạng lưới {bundle.diplomacy.length} Hiệp ước • {bundle.resourceFlows.length} Luồng Tài nguyên • Biên niên sử Đa làn • Từ nguyên học 360 Quốc gia
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs & Search */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/60 px-4 py-2">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["diplomacy", Handshake, `Ngoại giao (${bundle.diplomacy.length})`],
                ["trade", Package, `Giao thương (${bundle.resourceFlows.length})`],
                ["timeline", History, "Biên niên sử Đa làn"],
                ["toponymy", Languages, "Từ nguyên học 360 QG"],
              ] as const
            ).map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                  tab === id
                    ? "bg-cyan-600 text-white shadow"
                    : "border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {tab !== "timeline" && (
            <div className="relative w-64">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm quốc gia, hiệp ước, sản vật..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-2.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4">
          {tab === "diplomacy" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setDipFilter("ALL")}
                  className={`rounded-lg px-2.5 py-1 text-xs border cursor-pointer ${
                    dipFilter === "ALL"
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-200 font-semibold"
                      : "border-slate-700 text-slate-300"
                  }`}
                >
                  Tất cả ({bundle.diplomacy.length})
                </button>
                {(Object.keys(DIPLOMACY_META) as DiplomacyStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setDipFilter(st)}
                    className={`rounded-lg px-2.5 py-1 text-xs border cursor-pointer ${
                      dipFilter === st ? "font-semibold" : "opacity-80 hover:opacity-100"
                    }`}
                    style={{
                      borderColor: dipFilter === st ? DIPLOMACY_META[st].color : "#334155",
                      backgroundColor: dipFilter === st ? `${DIPLOMACY_META[st].color}22` : "transparent",
                      color: DIPLOMACY_META[st].color,
                    }}
                  >
                    {DIPLOMACY_META[st].shortLabel} ({dipCounts[st]})
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredDip.map((d) => {
                  const a = nationsById.get(d.polityAId);
                  const b = nationsById.get(d.polityBId);
                  const meta = DIPLOMACY_META[d.status];
                  return (
                    <div
                      key={d.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-white truncate">{d.treatyTitle}</span>
                        <span
                          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
                        >
                          {meta.shortLabel}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300">
                        {a && (
                          <button
                            type="button"
                            onClick={() => {
                              onFocusNation(a);
                              onClose();
                            }}
                            className="rounded bg-slate-800 px-2 py-0.5 hover:bg-cyan-600 hover:text-white cursor-pointer"
                          >
                            #{a.nationNum} {a.shortName}
                          </button>
                        )}
                        <span className="text-slate-500">↔</span>
                        {b && (
                          <button
                            type="button"
                            onClick={() => {
                              onFocusNation(b);
                              onClose();
                            }}
                            className="rounded bg-slate-800 px-2 py-0.5 hover:bg-cyan-600 hover:text-white cursor-pointer"
                          >
                            #{b.nationNum} {b.shortName}
                          </button>
                        )}
                        <span className="ml-auto font-mono text-[10px] text-slate-500">
                          Mốc {d.fromTick}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "trade" && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="py-2 pr-3">Xuất khẩu từ</th>
                    <th className="py-2 px-3">Sản vật / Tài nguyên</th>
                    <th className="py-2 px-3">Nhập khẩu tới</th>
                    <th className="py-2 px-3">Sản lượng</th>
                    <th className="py-2 pl-3">Phụ thuộc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-200">
                  {filteredFlows.map((r) => {
                    const src = nationsById.get(r.sourceNationId);
                    const tgt = nationsById.get(r.targetNationId);
                    return (
                      <tr key={r.id} className="hover:bg-slate-900/70">
                        <td className="py-2 pr-3 font-medium text-emerald-300">
                          {src ? `#${src.nationNum} ${src.shortName}` : r.sourceNationId}
                        </td>
                        <td className="py-2 px-3 font-semibold text-white">{r.resourceName}</td>
                        <td className="py-2 px-3 text-sky-300">
                          {tgt ? `#${tgt.nationNum} ${tgt.shortName}` : r.targetNationId}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-300">{r.volumeLabel}</td>
                        <td className="py-2 pl-3 font-mono text-amber-300">{r.dependencyPct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === "timeline" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {PARALLEL_TIMELINE_LANES.map((lane) => (
                <div
                  key={lane.lane}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-3"
                >
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: lane.color }}
                    />
                    <h4 className="font-semibold text-xs text-white">{lane.lane}</h4>
                  </div>
                  <div className="space-y-2.5">
                    {lane.events.map((ev, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-slate-800/80 bg-slate-950/70 p-2.5 text-xs space-y-1"
                      >
                        <div className="font-mono text-[10px]" style={{ color: lane.color }}>
                          Mốc lịch sử {ev.tick}
                        </div>
                        <div className="font-semibold text-slate-100">{ev.title}</div>
                        <div className="text-[11px] text-slate-400 leading-relaxed">{ev.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "toponymy" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredToponymy.map((t) => (
                <div
                  key={t.nationNum}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white">
                      #{t.nationNum} {t.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenWikiEntry(`ent-nation-${t.nationNum}`);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
                    >
                      <BookOpen className="h-3 w-3" /> Hồ sơ
                    </button>
                  </div>
                  <div className="text-[11px] text-cyan-300">{t.linguisticFamily}</div>
                  <div className="text-[11px] text-slate-300">
                    <b>Cấu trúc danh xưng:</b> {t.prefixMeaning}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <b>Thủ đô {t.capital}:</b> {t.capitalEtymology}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
