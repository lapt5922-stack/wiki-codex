"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Coins,
  Copy,
  Download,
  ExternalLink,
  FolderTree,
  Globe,
  Plus,
  RefreshCw,
  Rocket,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import type { PublishSnapshot, PublishTarget, Workspace } from "@/types/codex";

interface PublishPreviewStats {
  totalActiveEntries: number;
  publishedPublicCount: number;
  draftOrReviewPublicCount: number;
  privateCount: number;
  changedSinceLastPush: number;
  economyCount: number;
  categoriesCount: number;
  collectionsCount: number;
  timelineCount: number;
  lastVersion: number;
  lastPublishedAt: string | null;
}

interface PublishCenterModalProps {
  workspace: Workspace;
  canPublish: boolean;
  onClose: () => void;
  onPublished?: () => Promise<void> | void;
}

export function PublishCenterModal({
  workspace,
  canPublish,
  onClose,
  onPublished
}: PublishCenterModalProps) {
  const [targets, setTargets] = useState<PublishTarget[]>([]);
  const [snapshots, setSnapshots] = useState<PublishSnapshot[]>([]);
  const [stats, setStats] = useState<PublishPreviewStats | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [note, setNote] = useState("");
  const [autoPromoteDrafts, setAutoPromoteDrafts] = useState(true);
  const [publishAllCollections, setPublishAllCollections] = useState(true);
  const [includePrivate, setIncludePrivate] = useState(false);

  const [pushing, setPushing] = useState(false);
  const [pushStep, setPushStep] = useState("");
  const [lastResult, setLastResult] = useState<PublishSnapshot | null>(null);
  const [pushError, setPushError] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Add Webhook form
  const [showAddTarget, setShowAddTarget] = useState(false);
  const [tName, setTName] = useState("");
  const [tProvider, setTProvider] = useState<PublishTarget["provider"]>("render");
  const [tWebhook, setTWebhook] = useState("");
  const [tBaseUrl, setTBaseUrl] = useState("");

  async function loadPublishData() {
    const res = await fetch(`/api/publish?workspaceId=${workspace.id}`);
    const data = await res.json();
    setTargets(data.targets || []);
    setSnapshots(data.snapshots || []);
    setStats(data.stats || null);
    if (!selectedTargetId && data.targets?.[0]) {
      setSelectedTargetId(data.targets[0].id);
    }
  }

  useEffect(() => {
    loadPublishData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id]);

  const publicPortalPath = `/public/${workspace.slug}`;

  async function handleOneClickPush() {
    setPushing(true);
    setPushError("");
    setPushStep("Đang gom toàn bộ hồ sơ, danh mục & kinh tế hiện tại...");
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspace.id,
          targetId: selectedTargetId || undefined,
          note,
          autoPromoteDrafts,
          includePrivate,
          publishAllCollections
        })
      });
      setPushStep("Đang đồng bộ Cổng Web Công khai & xóa bộ nhớ đệm SEO...");
      const data = await res.json();
      if (res.ok && data.snapshot) {
        setLastResult(data.snapshot);
        setNote("");
        await loadPublishData();
        if (onPublished) await onPublished();
      } else {
        setPushError(data.error || "Không thể đẩy bản xuất bản.");
      }
    } catch {
      setPushError("Lỗi kết nối máy chủ khi xuất bản.");
    } finally {
      setPushing(false);
      setPushStep("");
    }
  }

  async function handleSaveTarget(e: React.FormEvent) {
    e.preventDefault();
    if (!tName.trim()) return;
    await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_target",
        name: tName,
        provider: tProvider,
        webhookUrl: tWebhook,
        publicBaseUrl: tBaseUrl
      })
    });
    setTName("");
    setTWebhook("");
    setTBaseUrl("");
    setShowAddTarget(false);
    await loadPublishData();
  }

  async function handleDeleteTarget(id: string) {
    await fetch(`/api/publish?id=${id}`, { method: "DELETE" });
    await loadPublishData();
  }

  function copyShareLink() {
    const fullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${publicPortalPath}`
        : publicPortalPath;
    navigator.clipboard?.writeText(fullUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1800);
  }

  const willGoLiveCount = stats
    ? stats.publishedPublicCount +
      (autoPromoteDrafts ? stats.draftOrReviewPublicCount : 0) +
      (includePrivate ? stats.privateCount : 0)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-[var(--accent)] flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              1-Click Push — Đồng bộ Tự động lên Web Công khai
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Tự động đẩy toàn bộ nội dung hiện có của “{workspace.name}” (hồ sơ, bản nháp, kinh tế, danh mục &amp; bộ sưu tập) lên Cổng Web Công khai ngay lập tức.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Sync Radar */}
        {stats && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Trạng thái Dữ liệu Hiện tại trên Web
              </span>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">
                {stats.lastVersion > 0
                  ? `Bản mới nhất: v${stats.lastVersion}`
                  : "Chưa có bản snapshot"}
                {stats.changedSinceLastPush > 0 && (
                  <strong className="ml-2 text-emerald-300">
                    • {stats.changedSinceLastPush} thay đổi chờ đồng bộ
                  </strong>
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="rounded-lg bg-[var(--bg-base)]/75 border border-[var(--border-subtle)] p-2">
                <div className="text-[10px] text-[var(--text-muted)]">Sẽ lên Web Công khai</div>
                <div className="text-base font-mono font-bold text-emerald-300">
                  {willGoLiveCount.toLocaleString("vi-VN")}
                </div>
              </div>
              <div className="rounded-lg bg-[var(--bg-base)]/75 border border-[var(--border-subtle)] p-2">
                <div className="text-[10px] text-[var(--text-muted)]">Nháp / Chờ duyệt</div>
                <div className="text-base font-mono font-bold text-amber-300">
                  {stats.draftOrReviewPublicCount}
                </div>
              </div>
              <div className="rounded-lg bg-[var(--bg-base)]/75 border border-[var(--border-subtle)] p-2">
                <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                  <Coins className="w-3 h-3 text-amber-400" /> Hồ sơ Kinh tế
                </div>
                <div className="text-base font-mono font-bold text-sky-300">
                  {stats.economyCount}
                </div>
              </div>
              <div className="rounded-lg bg-[var(--bg-base)]/75 border border-[var(--border-subtle)] p-2">
                <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                  <FolderTree className="w-3 h-3 text-purple-400" /> Danh mục &amp; Mốc sử
                </div>
                <div className="text-base font-mono font-bold text-purple-300">
                  {stats.categoriesCount} / {stats.timelineCount}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Public Link Box */}
        <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--accent-soft)] p-3.5 space-y-2">
          <div className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            <span>Đường dẫn Web Công khai (Public Portal — SEO Ready)</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 font-mono text-xs px-3 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] truncate">
              {publicPortalPath}
            </code>
            <button
              type="button"
              onClick={copyShareLink}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[var(--border-strong)] text-xs text-[var(--accent)] hover:bg-white/10 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedUrl ? "Đã sao chép!" : "Sao chép link"}
            </button>
            <a
              href={publicPortalPath}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold text-xs hover:brightness-110"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Mở Web Công khai
            </a>
          </div>
        </div>

        {/* 1-Click Auto-Sync Push Action */}
        {canPublish && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-4 space-y-3">
            {/* Smart Auto-Sync Checkboxes */}
            <div className="space-y-2 text-xs">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPromoteDrafts}
                  onChange={(e) => setAutoPromoteDrafts(e.target.checked)}
                  className="mt-0.5 accent-amber-400"
                />
                <span>
                  <strong className="text-[var(--text-primary)]">
                    Tự động xuất bản toàn bộ Bản nháp &amp; Đang rà soát ({stats?.draftOrReviewPublicCount ?? 0} bài)
                  </strong>
                  <span className="block text-[11px] text-[var(--text-muted)]">
                    Mọi bài viết mới tạo hoặc đang chỉnh sửa trên web hiện tại sẽ tự động lên Web Công khai ngay khi bấm Push.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publishAllCollections}
                  onChange={(e) => setPublishAllCollections(e.target.checked)}
                  className="mt-0.5 accent-amber-400"
                />
                <span>
                  <strong className="text-[var(--text-primary)]">
                    Đồng bộ toàn bộ Bộ sưu tập, Danh mục &amp; Dữ liệu Kinh tế mới nhất
                  </strong>
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePrivate}
                  onChange={(e) => setIncludePrivate(e.target.checked)}
                  className="mt-0.5 accent-rose-400"
                />
                <span className="text-[var(--text-secondary)]">
                  Công khai luôn cả hồ sơ đang đặt Riêng tư ({stats?.privateCount ?? 0} bài) —{" "}
                  <span className="text-amber-300">tùy chọn</span>
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Đích xuất bản / Deploy Hook
                </label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-2 text-xs"
                >
                  <option value="">Cổng Web Công khai Nội bộ (/public) + Env Hook</option>
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.provider})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Ghi chú bản phát hành (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Đồng bộ 360 quốc gia + Kinh tế & Bản đồ 3D..."
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-2 text-xs"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={pushing}
              onClick={handleOneClickPush}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold text-sm hover:brightness-110 disabled:opacity-60 transition cursor-pointer shadow-lg shadow-[var(--accent)]/25"
            >
              {pushing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              <span>
                {pushing
                  ? pushStep || "Đang đồng bộ & đẩy lên Web Công khai..."
                  : `1-Click Push Tự động (${willGoLiveCount.toLocaleString("vi-VN")} hồ sơ lên Web Công khai)`}
              </span>
            </button>

            {pushError && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
                {pushError}
              </div>
            )}

            {lastResult && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-100 space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-emerald-200">
                      Đã Push thành công Phiên bản v{lastResult.version} — {lastResult.publicEntryCount.toLocaleString("vi-VN")} hồ sơ đã lên Web Công khai!
                    </div>
                    <div className="text-[11px] opacity-90 mt-0.5">{lastResult.webhookStatus}</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href={publicPortalPath}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-[11px] hover:brightness-110"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Xem Web Công khai ngay
                  </a>
                  <a
                    href={`/api/export?workspaceId=${workspace.id}&format=json`}
                    download={`public-wiki-${workspace.slug}-v${lastResult.version}.json`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/20 text-[11px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Tải Snapshot (.json)
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cloud Deploy Webhook Targets CRUD */}
        {canPublish && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">
                Cấu hình Cloud Deploy Hook (Render / Vercel / Netlify / Cloudflare / GitHub)
              </span>
              <button
                type="button"
                onClick={() => setShowAddTarget((v) => !v)}
                className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Deploy Hook
              </button>
            </div>

            {showAddTarget && (
              <form
                onSubmit={handleSaveTarget}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/70 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2"
              >
                <input
                  type="text"
                  required
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                  placeholder="Tên đích (VD: Render Production)"
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs"
                />
                <select
                  value={tProvider}
                  onChange={(e) => setTProvider(e.target.value as PublishTarget["provider"])}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs"
                >
                  <option value="render">Render.com Deploy Hook</option>
                  <option value="vercel">Vercel Deploy Hook</option>
                  <option value="netlify">Netlify Build Hook</option>
                  <option value="cloudflare">Cloudflare Pages Hook</option>
                  <option value="github">GitHub Actions Dispatch</option>
                  <option value="custom">Custom Webhook</option>
                </select>
                <input
                  type="url"
                  value={tWebhook}
                  onChange={(e) => setTWebhook(e.target.value)}
                  placeholder="URL Deploy Hook (https://api.render.com/deploy/...)"
                  className="sm:col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs"
                />
                <input
                  type="url"
                  value={tBaseUrl}
                  onChange={(e) => setTBaseUrl(e.target.value)}
                  placeholder="Tên miền công khai (VD: https://wiki-codex-atlas.onrender.com)"
                  className="sm:col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs"
                />
                <div className="sm:col-span-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTarget(false)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-xs cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer"
                  >
                    Lưu Deploy Hook
                  </button>
                </div>
              </form>
            )}

            {targets.length > 0 && (
              <div className="space-y-1.5">
                {targets.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--text-primary)] truncate">
                        {t.name}{" "}
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[var(--accent)]">
                          {t.provider}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate">
                        {t.publicBaseUrl || t.webhookUrl || "Xuất bản nội bộ (/public)"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteTarget(t.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                      title="Xóa đích xuất bản"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Publish History */}
        {snapshots.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase">
              Lịch sử Xuất bản Gần nhất ({snapshots.length})
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {snapshots.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[var(--text-primary)]">
                      v{s.version} · {s.publicEntryCount.toLocaleString("vi-VN")} hồ sơ công khai
                      {s.promotedCount ? (
                        <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                          +{s.promotedCount} mới đẩy
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate">{s.note}</div>
                  </div>
                  <span className="font-mono text-[10px] text-[var(--text-muted)] shrink-0">
                    {new Date(s.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
