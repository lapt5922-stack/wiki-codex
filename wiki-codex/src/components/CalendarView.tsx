"use client";

import React, { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Moon } from "lucide-react";
import type { TimelineEvent, WorldCalendar } from "@/types/codex";
import { getAbsoluteDayInYear, getMoonPhaseForDay } from "@/lib/v2-engines";

interface CalendarViewProps {
  workspaceId: string;
  calendars: WorldCalendar[];
  timelineEvents: TimelineEvent[];
  canEdit: boolean;
  onRefresh: () => Promise<void>;
}

export function CalendarView({
  workspaceId,
  calendars,
  timelineEvents,
  canEdit,
  onRefresh
}: CalendarViewProps) {
  const calendar = calendars[0] ?? {
    id: "cal-default",
    workspaceId,
    name: "Lịch Thế Giới Mặc Định",
    eraName: "Kỷ Nguyên Mới",
    currentYear: 1,
    moonCycleDays: 28,
    weekdays: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"],
    months: Array.from({ length: 12 }, (_, i) => ({
      name: `Tháng ${i + 1}`,
      days: 30,
      season: i < 3 ? "Xuân" : i < 6 ? "Hạ" : i < 9 ? "Thu" : "Đông",
      sigil: "✦"
    }))
  };

  const [monthIdx, setMonthIdx] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [calName, setCalName] = useState(calendar.name);
  const [eraName, setEraName] = useState(calendar.eraName);

  const month = calendar.months[monthIdx] ?? calendar.months[0];

  const monthEvents = timelineEvents.filter(
    (ev) => ev.calendarMonthIndex === monthIdx
  );

  async function saveCalendarMeta(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "calendar",
        data: { ...calendar, name: calName, eraName }
      })
    });
    setEditingName(false);
    await onRefresh();
  }

  return (
    <div className="space-y-4">
      <div className="codex-card arcane-corners rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-[var(--accent)] flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {calendar.name} — {calendar.eraName}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Hệ thống Lịch pháp thế giới riêng với Chu kỳ Mặt trăng ({calendar.moonCycleDays} ngày) và ánh xạ trực tiếp sự kiện Biên niên sử.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonthIdx((m) => (m - 1 + calendar.months.length) % calendar.months.length)}
            className="p-2 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--accent)] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-display font-semibold text-sm px-3 py-1.5 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            {month.sigil} {month.name} ({month.season})
          </span>
          <button
            type="button"
            onClick={() => setMonthIdx((m) => (m + 1) % calendar.months.length)}
            className="p-2 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--accent)] cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditingName((v) => !v)}
              className="px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs hover:border-[var(--accent)] cursor-pointer"
            >
              Cấu hình Lịch
            </button>
          )}
        </div>
      </div>

      {editingName && canEdit && (
        <form onSubmit={saveCalendarMeta} className="codex-card rounded-2xl p-4 flex flex-wrap gap-2 text-xs">
          <input type="text" value={calName} onChange={(e) => setCalName(e.target.value)} placeholder="Tên Bộ Lịch" className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5" />
          <input type="text" value={eraName} onChange={(e) => setEraName(e.target.value)} placeholder="Tên Kỷ nguyên" className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5" />
          <button type="submit" className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold cursor-pointer">
            Lưu cấu hình
          </button>
        </form>
      )}

      {/* Calendar Grid */}
      <div className="codex-card rounded-2xl p-4 space-y-3 overflow-x-auto">
        <div className="grid grid-cols-7 gap-1.5 min-w-[520px] text-center text-[11px] font-mono text-[var(--accent)]">
          {calendar.weekdays.map((wd) => (
            <div key={wd} className="py-1.5 rounded-lg bg-white/5">{wd}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 min-w-[520px]">
          {Array.from({ length: month.days }, (_, idx) => {
            const day = idx + 1;
            const absDay = getAbsoluteDayInYear(calendar, monthIdx, day);
            const moon = getMoonPhaseForDay(absDay, calendar.moonCycleDays);
            const dayEvents = monthEvents.filter((e) => e.calendarDay === day);
            const isSelected = selectedDay === day;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`min-h-[72px] rounded-xl border p-2 text-left flex flex-col justify-between transition cursor-pointer ${
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : dayEvents.length > 0
                    ? "border-[var(--border-strong)] bg-[var(--bg-base)]/80"
                    : "border-[var(--border-subtle)] bg-[var(--bg-base)]/40 hover:border-[var(--border-strong)]"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono text-xs font-bold">{day}</span>
                  <span title={moon.label} className="text-sm">{moon.glyph}</span>
                </div>
                {dayEvents.length > 0 && (
                  <div className="text-[10px] text-[var(--accent)] truncate font-medium">
                    ✦ {dayEvents[0].title}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Events */}
      <div className="codex-card rounded-2xl p-4 space-y-2">
        <div className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1.5">
          <Moon className="w-4 h-4" />
          {selectedDay
            ? `Sự kiện trong Ngày ${selectedDay} ${month.name}`
            : `Tất cả sự kiện xảy ra trong ${month.name} (${monthEvents.length})`}
        </div>
        {(selectedDay ? monthEvents.filter((e) => e.calendarDay === selectedDay) : monthEvents).length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">Không có biến cố biên niên sử nào được ghi nhận vào ngày này.</p>
        ) : (
          (selectedDay ? monthEvents.filter((e) => e.calendarDay === selectedDay) : monthEvents).map((ev) => (
            <div key={ev.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 text-xs">
              <div className="font-mono text-[var(--accent)]">{ev.dateLabel} · {ev.era}</div>
              <div className="font-display font-semibold text-sm mt-0.5">{ev.sigil} {ev.title}</div>
              <p className="text-[var(--text-secondary)] mt-1">{ev.summary}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
