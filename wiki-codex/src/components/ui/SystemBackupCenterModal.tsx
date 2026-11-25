"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Database,
  Download,
  HardDrive,
  RotateCcw,
  ShieldCheck,
  Upload,
  X
} from "lucide-react";
import type { BackupMetadataItem } from "@/lib/system-backup";
import { ImperialButton } from "./ImperialPrimitives";

export function SystemBackupCenterModal({
  onClose,
  onRestored
}: {
  onClose: () => void;
  onRestored: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [storage, setStorage] = useState<{
    backend: string;
    postgresConfigured: boolean;
    localDataBytes: number;
  } | null>(null);
  const [snapshots, setSnapshots] = useState<BackupMetadataItem[]>([]);

  async function loadInfo() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/backup");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể tải thông tin sao lưu.");
      } else {
        setStorage(data.storage);
        setSnapshots(data.snapshots || []);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInfo();
  }, []);

  async function handleCreateSnapshot() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_snapshot",
          note: note.trim() || "Sao lưu toàn hệ thống Aethel Codex V9.0"
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Tạo bản sao lưu thất bại.");
      } else {
        setNote("");
        setMessage(`Đã tạo bản chụp an toàn ${data.snapshot.backupId} (SHA-256 verified).`);
        await loadInfo();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRestoreSnapshot(backupId: string) {
    if (
      !window.confirm(
        `Khôi phục toàn hệ thống về bản sao lưu ${backupId}? Hệ thống sẽ tự động chụp một bản sao lưu an toàn hiện tại trước khi khôi phục.`
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore_by_id", backupId })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Khôi phục thất bại.");
      } else {
        setMessage(
          `Đã khôi phục thành công gói ${data.restoredBackupId} (Bản sao lưu phòng hộ: ${data.preRestoreSafetyBackupId}).`
        );
        await loadInfo();
        await onRestored();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleUploadRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const text = await file.text();
      const envelope = JSON.parse(text);
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore_envelope", envelope })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Tệp sao lưu không hợp lệ.");
      } else {
        setMessage(`Đã kiểm tra SHA-256 và khôi phục thành công từ tệp ${file.name}.`);
        await loadInfo();
        await onRestored();
      }
    } catch (err) {
      setError(`Lỗi đọc tệp sao lưu: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-5 v9-adaptive-modal-backdrop">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-4 shadow-2xl v9-adaptive-modal-panel animate-codex-scale-in">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[var(--accent)]" />
            <div>
              <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                Trung Tâm Sao Lưu &amp; Khôi Phục Thảm Họa (V9.0)
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Bảo vệ toàn bộ 8 kho dữ liệu (Wiki, Nhân vật, 360 Quốc gia, Huy hiệu, Quan hệ, Văn khố, AI &amp; Health) kèm kiểm tra SHA-256
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {storage && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3 flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] uppercase font-mono text-[var(--text-muted)]">Backend Lưu Trữ</div>
                <div className="font-semibold text-[var(--text-primary)]">
                  {storage.backend === "postgresql" ? "PostgreSQL (Bền vững Render)" : "Local Atomic JSON"}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3 flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <div className="text-[10px] uppercase font-mono text-[var(--text-muted)]">Dung Lượng Local (.data)</div>
                <div className="font-mono font-semibold text-[var(--text-primary)]">
                  {(storage.localDataBytes / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3 flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase font-mono text-[var(--text-muted)]">Tải Gói Đầy Đủ</div>
                <div className="font-semibold text-[var(--accent)]">8 Kho + SHA-256</div>
              </div>
              <a
                href="/api/backup?download=true"
                className="v9-sheen-btn px-2.5 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold text-xs inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Tải JSON
              </a>
            </div>
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/12 px-3.5 py-2.5 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/12 px-3.5 py-2.5 text-xs text-rose-200">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3.5 space-y-2.5">
          <div className="text-xs font-semibold text-[var(--accent)]">
            ✦ Tạo Bản Chụp Nhanh hoặc Nhập Gói Khôi Phục
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú bản sao lưu (VD: Trước khi biên tập Kỷ Nguyên Thứ Tư)..."
              className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs"
            />
            <ImperialButton disabled={busy} onClick={handleCreateSnapshot}>
              + Chụp Sao Lưu Ngay
            </ImperialButton>
            <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-cyan-500/40 bg-cyan-500/12 text-cyan-200 text-xs font-medium hover:bg-cyan-500/20 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Khôi phục từ tệp
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                disabled={busy}
                onChange={handleUploadRestoreFile}
              />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-[var(--text-secondary)]">
            Danh sách Bản Chụp Hệ Thống Gần Nhất ({snapshots.length})
          </div>
          {loading ? (
            <div className="v9-skeleton h-24 w-full" />
          ) : snapshots.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-4 text-center">
              Chưa có bản chụp lưu trữ nào. Hãy nhấn &ldquo;+ Chụp Sao Lưu Ngay&rdquo; để tạo điểm khôi phục đầu tiên.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto codex-scrollbar pr-1">
              {snapshots.map((snap) => (
                <div
                  key={snap.backupId}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[var(--accent)]">{snap.backupId}</span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        {new Date(snap.createdAt).toLocaleString("vi-VN")} · {snap.createdBy}
                      </span>
                    </div>
                    <div className="text-[var(--text-secondary)] truncate">{snap.note}</div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">
                      Hồ sơ: {snap.counts.entries} · Nhân vật: {snap.counts.characters} · Quan hệ: {snap.counts.universalRelations} · SHA256: {snap.checksumSha256.slice(0, 12)}…
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`/api/backup?download=true&backupId=${encodeURIComponent(snap.backupId)}`}
                      className="px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--accent)] text-[11px]"
                    >
                      Tải về
                    </a>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleRestoreSnapshot(snap.backupId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 hover:bg-amber-500/30 text-[11px] font-semibold cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Khôi phục
                    </button>
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
