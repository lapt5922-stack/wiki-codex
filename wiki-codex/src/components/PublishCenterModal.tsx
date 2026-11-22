"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
  Plus,
  Rocket,
  Trash2,
  X
} from "lucide-react";
import type { PublishSnapshot, PublishTarget, Workspace } from "@/types/codex";

interface PublishCenterModalProps {
  workspace: Workspace;
  canPublish: boolean;
  onClose: () => void;
}

export function PublishCenterModal({
  workspace,
  canPublish,
  onClose
}: PublishCenterModalProps) {
  const [targets, setTargets] = useState<PublishTarget[]>([]);
  const [snapshots, setSnapshots] = useState<PublishSnapshot[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [note, setNote] = useState("");
  const [pushing, setPushing] = useState(false);
  const [lastResult, setLastResult] = useState<PublishSnapshot | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Add Webhook form
  const [showAddTarget, setShowAddTarget] = useState(false);
  const [tName, setTName] = useState("");
  const [tProvider, setTProvider] = useState<PublishTarget["provider"]>("vercel");
  const [tWebhook, setTWebhook] = useState("");
  const [tBaseUrl, setTBaseUrl] = useState("");

  async function loadPublishData() {
    const res = await fetch(`/api/publish?workspaceId=${workspace.id}`);
    const data = await res.json();
    setTargets(data.targets || []);
    setSnapshots(data.snapshots || []);
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
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspace.id,
          targetId: selectedTargetId || undefined,
          note
        })
      });
      const data = await res.json();
      if (res.ok && data.snapshot) {
        setLastResult(data.snapshot);
        setNote("");
        await loadPublishData();
      }
    } finally {
      setPushing(false);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-[var(--accent)] flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Xuất bản Công khai & 1-Click Push Tự động
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Đẩy tức thì không gian “{workspace.name}” lên Cổng Web Công khai (ai cũng truy cập được, tự động lọc sạch ghi chú riêng tư).
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Public Link Box */}
        <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--accent-soft)] p-4 space-y-2">
          <div className="text-xs font-semibold text-[var(--accent)]">
            ✦ Đường dẫn Cổng Web Công khai (Public Portal — SEO Ready)
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

        {/* 1-Click Push Action */}
        {canPublish && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Đích xuất bản / Deploy Webhook
                </label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-2 text-xs"
                >
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
                  placeholder="VD: Cập nhật 200 thẻ nhân vật mới..."
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
              <Rocket className="w-4 h-4" />
              {pushing
                ? "Đang đồng bộ & đẩy lên Web Công khai..."
                : "Đẩy tự động lên Web Công khai ngay (1-Click Push)"}
            </button>

            {lastResult && (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <div className="font-semibold">
                    Đã xuất bản thành công Phiên bản v{lastResult.version} ({lastResult.publicEntryCount} hồ sơ công khai)!
                  </div>
                  <div className="text-[11px] opacity-85 mt-0.5">
                    {lastResult.webhookStatus}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Webhook Targets CRUD */}
        {canPublish && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">
                Cấu hình Cloud Deploy Webhook (Vercel / Netlify / Cloudflare / GitHub)
              </span>
              <button
                type="button"
                onClick={() => setShowAddTarget((v) => !v)}
                className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Webhook
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
                  placeholder="Tên đích (VD: Vercel Production) *"
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs"
                />
                <select
                  value={tProvider}
                  onChange={(e) =>
                    setTProvider(e.target.value as PublishTarget["provider"])
                  }
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs"
                >
                  <option value="vercel">Vercel Deploy Hook</option>
                  <option value="netlify">Netlify Build Hook</option>
                  <option value="cloudflare">Cloudflare Pages Hook</option>
                  <option value="render">Render Deploy Hook</option>
                  <option value="github">GitHub Actions Webhook</option>
                  <option value="custom">Custom HTTP Webhook</option>
                </select>
                <input
                  type="url"
                  value={tWebhook}
                  onChange={(e) => setTWebhook(e.target.value)}
                  placeholder="https://api.vercel.com/v1/integrations/deploy/..."
                  className="sm:col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-mono"
                />
                <input
                  type="url"
                  value={tBaseUrl}
                  onChange={(e) => setTBaseUrl(e.target.value)}
                  placeholder="Tên miền công khai (VD: https://wiki-cua-ban.vercel.app)"
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold text-xs py-1.5 cursor-pointer"
                >
                  Lưu cấu hình Webhook
                </button>
              </form>
            )}

            <div className="space-y-1.5">
              {targets.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-medium">
                      {t.name}{" "}
                      <span className="font-mono text-[10px] text-[var(--accent)]">
                        [{t.provider}]
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-[var(--text-muted)] truncate">
                      {t.webhookUrl || "Đồng bộ cổng /public nội bộ (chưa gắn Webhook Cloud)"}
                    </div>
                  </div>
                  {targets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTarget(t.id)}
                      className="text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Publish History */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[var(--text-muted)] uppercase">
            Lịch sử Xuất bản ({snapshots.length})
          </div>
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {snapshots.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 px-3 py-2 text-xs flex items-center justify-between gap-2"
              >
                <div>
                  <span className="font-mono text-[var(--accent)] font-semibold">
                    v{s.version}
                  </span>{" "}
                  · {s.note}
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {s.webhookStatus} · bởi {s.publishedBy}
                  </div>
                </div>
                <span className="font-mono text-[10px] text-[var(--text-muted)] shrink-0">
                  {new Date(s.createdAt).toLocaleString("vi-VN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
