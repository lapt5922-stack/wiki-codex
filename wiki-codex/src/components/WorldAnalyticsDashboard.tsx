"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, BookOpen, Crown, Image as ImageIcon, Map as MapIcon, Users } from "lucide-react";

interface WorldAnalyticsDashboardProps {
  workspaceId: string;
  totalEntries: number;
  mediaCount: number;
  onNavigate: (section: string) => void;
}

export function WorldAnalyticsDashboard({
  workspaceId,
  totalEntries,
  mediaCount,
  onNavigate
}: WorldAnalyticsDashboardProps) {
  const [charTotal, setCharTotal] = useState<number | null>(null);
  const [kingTotal, setKingTotal] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(`/api/characters?workspaceId=${encodeURIComponent(workspaceId)}&limit=1`).then((r) => r.json()).catch(() => null),
      fetch(`/api/kingdoms?workspaceId=${encodeURIComponent(workspaceId)}&limit=1`).then((r) => r.json()).catch(() => null)
    ]).then(([cData, kData]) => {
      if (!alive) return;
      if (typeof cData?.total === "number") setCharTotal(cData.total);
      if (typeof kData?.total === "number") setKingTotal(kData.total);
    });
    return () => {
      alive = false;
    };
  }, [workspaceId]);

  const cards = [
    {
      label: "Hồ sơ Wiki",
      value: totalEntries.toLocaleString("vi-VN"),
      sub: "Cơ sở tri thức",
      icon: BookOpen,
      section: "database",
      tone: "text-amber-300 border-amber-500/30 bg-amber-500/10"
    },
    {
      label: "Character Codex",
      value: charTotal !== null ? charTotal.toLocaleString("vi-VN") : "—",
      sub: "17 nhóm dữ liệu",
      icon: Users,
      section: "characters",
      tone: "text-cyan-300 border-cyan-500/30 bg-cyan-500/10"
    },
    {
      label: "Kingdom Codex",
      value: kingTotal !== null ? kingTotal.toLocaleString("vi-VN") : "360",
      sub: "18 nhóm địa chính trị",
      icon: Crown,
      section: "kingdoms",
      tone: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
    },
    {
      label: "Thư viện Ảnh",
      value: mediaCount.toLocaleString("vi-VN"),
      sub: "Upload trực tiếp",
      icon: ImageIcon,
      section: "media",
      tone: "text-purple-300 border-purple-500/30 bg-purple-500/10"
    }
  ];

  return (
    <div className="codex-card rounded-2xl p-4 space-y-3 animate-codex-fade-up">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)]">
          <BarChart3 className="w-4 h-4" />
          <span>Bảng Điều khiển Thống kê Thế giới (Live World Analytics)</span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("atlas")}
          className="text-[11px] text-cyan-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <MapIcon className="w-3.5 h-3.5" /> Mở Atlas 360
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => onNavigate(c.section)}
              className={`rounded-xl border p-3 text-left transition hover:scale-[1.01] cursor-pointer ${c.tone}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium opacity-85">{c.label}</span>
                <Icon className="w-4 h-4 opacity-90" />
              </div>
              <div className="font-display text-xl sm:text-2xl font-bold mt-1">{c.value}</div>
              <div className="text-[10px] opacity-75 mt-0.5">{c.sub}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
