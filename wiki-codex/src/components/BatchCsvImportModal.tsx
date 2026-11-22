"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, FileSpreadsheet, Upload, X } from "lucide-react";
import type { Category, EntryType } from "@/types/codex";
import { parseBatchEntriesCsv } from "@/lib/wiki-auditor-pro";

interface BatchCsvImportModalProps {
  workspaceId: string;
  entryTypes: EntryType[];
  categories: Category[];
  onClose: () => void;
  onImported: () => Promise<void>;
}

const SAMPLE_CSV = `title,summary,tags,markdown
"Thư viện Cổ Solis","Kho lưu trữ bản đồ thiên văn cổ đại phía Nam Aurelia","thu-vien;dia-danh","## Tổng quan\n\nThư viện Cổ Solis lưu giữ hơn 12.000 cuộn bản đồ trắc địa."
"Học giả Orin Valen","Nhà địa chất học nổi tiếng của Liên minh Tam Biên","nhan-vat;hoc-gia","## Tiểu sử\n\nOrin Valen là người đầu tiên đo đạc chính xác độ cao dãy Xương Sống Aurelia."`;

export function BatchCsvImportModal({
  workspaceId,
  entryTypes,
  categories,
  onClose,
  onImported,
}: BatchCsvImportModalProps) {
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [entryTypeId, setEntryTypeId] = useState(entryTypes[0]?.id || "");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [importing, setImporting] = useState(false);
  const [doneCount, setDoneCount] = useState<number | null>(null);
  const [error, setError] = useState("");

  const parsedRows = useMemo(() => parseBatchEntriesCsv(csvText), [csvText]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setCsvText(reader.result);
    };
    reader.readAsText(file, "utf-8");
  };

  const handleImportAll = async () => {
    if (parsedRows.length === 0 || !entryTypeId) return;
    setImporting(true);
    setError("");
    let created = 0;
    try {
      for (const row of parsedRows) {
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId,
            entryTypeId,
            categoryId: categoryId || null,
            title: row.title,
            summary: row.summary,
            tags: row.tags,
            contentMarkdown: row.contentMarkdown.replace(/\\n/g, "\n"),
            status: "published",
            visibility: "public",
            canonStatus: "canon",
          }),
        });
        if (res.ok) created++;
      }
      setDoneCount(created);
      await onImported();
    } catch {
      setError("Có lỗi kết nối trong quá trình nhập hàng loạt.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="animate-codex-scale-in flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="font-display text-base font-bold text-[var(--accent)]">
                Nhập Hàng Loạt Thực Thể Từ CSV (Batch Importer)
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Định dạng cột: <code>title,summary,tags,markdown</code> (phân tách thẻ tag bằng dấu <code>;</code>).
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--text-muted)] mb-1">Loại thực thể áp dụng</label>
              <select
                value={entryTypeId}
                onChange={(e) => setEntryTypeId(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs"
              >
                {entryTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.sigil} {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[var(--text-muted)] mb-1">Danh mục lưu trữ</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs"
              >
                <option value="">Không phân danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.sigil} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[var(--text-muted)]">Dán nội dung CSV hoặc tải tệp .csv</label>
              <label className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1 text-[11px] text-[var(--accent)] hover:border-[var(--accent)] cursor-pointer">
                <Upload className="h-3.5 w-3.5" /> Chọn tệp .CSV
                <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3 font-mono text-[11px] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          {/* Preview parsed entries */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3 space-y-2">
            <div className="font-semibold text-[var(--text-primary)]">
              Xem trước ({parsedRows.length} thực thể hợp lệ sẵn sàng tạo)
            </div>
            <div className="max-h-40 overflow-y-auto divide-y divide-[var(--border-subtle)]">
              {parsedRows.map((row, idx) => (
                <div key={idx} className="py-1.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--text-primary)] truncate">
                      {idx + 1}. {row.title}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">{row.summary}</div>
                  </div>
                  <span className="shrink-0 text-[10px] font-mono text-cyan-300">
                    {row.tags.length} tag
                  </span>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-rose-400">{error}</p>}
          {doneCount !== null && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              <span>Đã tạo thành công {doneCount} hồ sơ thực thể mới vào kho Wiki!</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-xs cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={importing || parsedRows.length === 0}
            onClick={handleImportAll}
            className="codex-press rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
          >
            {importing ? "Đang tạo hồ sơ…" : `Tạo ngay ${parsedRows.length} thực thể`}
          </button>
        </div>
      </div>
    </div>
  );
}
