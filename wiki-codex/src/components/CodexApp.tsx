"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Bookmark,
  BookOpen,
  Calendar,
  Download,
  FolderKanban,
  FolderTree,
  Hourglass,
  Image as ImageIcon,
  Keyboard,
  Languages,
  Layers,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  Network,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Printer,
  Rocket,
  ScrollText,
  Search,
  Settings2,
  Shield,
  Sparkles,
  StickyNote,
  Trash2,
  X
} from "lucide-react";
import type {
  ActivityLogItem,
  Category,
  CategoryTreeNode,
  CodexTemplate,
  ConlangLanguage,
  CuratedCollection,
  EditorialTask,
  Entry,
  EntryCardProjection,
  EntryStatus,
  EntryType,
  EntryVisibility,
  FantasyThemeId,
  GlossaryTerm,
  Loreboard,
  MediaAsset,
  SavedView,
  SessionUser,
  TimelineEvent,
  WorldCalendar,
  WorldUnit,
  Workspace
} from "@/types/codex";
import { DEFAULT_GUEST_USER } from "@/lib/auth";
import { SidebarTree } from "./SidebarTree";
import { GrandHallView } from "./GrandHallView";
import { DatabaseView } from "./DatabaseView";
import { EntryDetailView } from "./EntryDetailView";
import { EntryEditorModal } from "./EntryEditorModal";
import { EntryTypeManagerModal } from "./EntryTypeManagerModal";
import { KnowledgeGraphView } from "./KnowledgeGraphView";
import { TimelineView } from "./TimelineView";
import { AtlasView } from "./AtlasView";
import { AlmanacLoreTrailsPanel } from "./AlmanacLoreTrailsPanel";
import { CategorySliderRibbon } from "./CategorySliderRibbon";
import { ConlangStudioView } from "./ConlangStudioView";
import { LoreboardView } from "./LoreboardView";
import { CalendarView } from "./CalendarView";
import { MediaVaultView } from "./MediaVaultView";
import { WikiHealthView } from "./WikiHealthView";
import { PublishCenterModal } from "./PublishCenterModal";
import { CommandPalette } from "./CommandPalette";
import {
  CodexBookModeModal,
  MultiMatrixModal,
  QuickScratchpad,
  ShortcutsModal,
  V2KnowledgeHubView
} from "./V2HubViews";
import {
  ShowcaseDeckModal,
  V3OmniverseStudioView
} from "./V3OmniverseStudioView";
import { V4WorldStudioView } from "./V4WorldStudioView";
import { ChronicleReaderView } from "./ChronicleReaderView";
import { BookPublisherModal } from "./BookPublisherModal";
import { BatchCsvImportModal } from "./BatchCsvImportModal";
import { DeviceUISwitcher, useDeviceUI } from "@/lib/device-ui";
import { ReadingBreadcrumbTrail, type TrailItem } from "./EntityVisualWidgets";
import { MultiNationEconomyComparatorModal } from "./MultiNationEconomyComparatorModal";
import {
  AuthModal,
  ImportExportModal,
  TrashView,
  WorkspaceManagerModal
} from "./UtilityModals";

type MainSection =
  | "home"
  | "database"
  | "omniverse"
  | "v4studio"
  | "chronicles"
  | "graph"
  | "timeline"
  | "calendar"
  | "atlas"
  | "loreboard"
  | "conlang"
  | "media"
  | "collections"
  | "health"
  | "trash";

const THEMES: Array<{ id: FantasyThemeId; label: string; dot: string }> = [
  { id: "astral-grimoire", label: "Tinh Hà Cổ Thư", dot: "#D4AF37" },
  { id: "velvet-eclipse", label: "Huyết Nguyệt Nhung", dot: "#C084FC" },
  { id: "imperial-amber", label: "Hoàng Hôn Cổ Đô", dot: "#F59E0B" },
  { id: "sylvan-emerald", label: "Rừng Ngọc Cổ Đại", dot: "#34D399" },
  { id: "gilded-parchment", label: "Giấy Da Hoàng Kim", dot: "#9A6B20" },
  { id: "celestial-ivory", label: "Thiên Cung Bạch Ngọc", dot: "#2563EB" },
  { id: "astral-scifi", label: "Tinh Vân Sci-Fi", dot: "#38BDF8" },
  { id: "jade-ink", label: "Mực Tàu Ngọc Bích", dot: "#2DD4BF" }
];

interface OpenEntryTab {
  id: string;
  title: string;
  sigil: string;
}

export function CodexApp() {
  const [user, setUser] = useState<SessionUser>(DEFAULT_GUEST_USER);
  const [storageBackend, setStorageBackend] = useState<"postgresql" | "local-json">("local-json");
  const [theme, setTheme] = useState<FantasyThemeId>("astral-grimoire");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Core workspace & V1 + V2 state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [catFilter, setCatFilter] = useState("");
  const [entryTypes, setEntryTypes] = useState<EntryType[]>([]);
  const [conlangs, setConlangs] = useState<ConlangLanguage[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  // V2 collections state
  const [templates, setTemplates] = useState<CodexTemplate[]>([]);
  const [loreboards, setLoreboards] = useState<Loreboard[]>([]);
  const [calendars, setCalendars] = useState<WorldCalendar[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [collections, setCollections] = useState<CuratedCollection[]>([]);
  const [editorialTasks, setEditorialTasks] = useState<EditorialTask[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([]);
  const [worldUnits, setWorldUnits] = useState<WorldUnit[]>([]);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [activeConlangId, setActiveConlangId] = useState<string>("");
  const [showcaseOpen, setShowcaseOpen] = useState(false);

  // Paginated entries state
  const [entries, setEntries] = useState<EntryCardProjection[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  // Filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterTypeId, setFilterTypeId] = useState("");
  const [filterStatus, setFilterStatus] = useState<EntryStatus | "all">("all");
  const [filterVisibility, setFilterVisibility] = useState<EntryVisibility | "all">("all");
  const [filterTag, setFilterTag] = useState("");
  const [minPowerFilter, setMinPowerFilter] = useState<number | null>(null);
  const [maxPowerFilter, setMaxPowerFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"updatedAt" | "title" | "status" | "powerLevel">("updatedAt");

  // Navigation, Multi-Tab & Modals
  const [section, setSection] = useState<MainSection>("home");
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<OpenEntryTab[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [bookModeOpen, setBookModeOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const [editorState, setEditorState] = useState<{
    open: boolean;
    entry: Entry | null;
    initialTitle?: string;
    initialContent?: string;
  }>({ open: false, entry: null });
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [wsModalOpen, setWsModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [bookPublisherOpen, setBookPublisherOpen] = useState(false);
  const [batchCsvOpen, setBatchCsvOpen] = useState(false);
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [matrixIds, setMatrixIds] = useState<string[] | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [atlasFocusNationId, setAtlasFocusNationId] = useState<string | null>(null);
  const [perfMode, setPerfMode] = useState<"vivid" | "lite">("vivid");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("codex_perf_mode_v1");
      if (saved === "lite" || saved === "vivid") {
        setPerfMode(saved);
        document.documentElement.dataset.perf = saved;
      }
    } catch {
      // ignore
    }
  }, []);

  const togglePerfMode = () => {
    const next = perfMode === "vivid" ? "lite" : "vivid";
    setPerfMode(next);
    document.documentElement.dataset.perf = next;
    try {
      window.localStorage.setItem("codex_perf_mode_v1", next);
    } catch {
      // ignore
    }
  };

  const canEdit = user.role === "admin" || user.role === "editor";
  const isAdmin = user.role === "admin";
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];

  const categoryCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    const walk = (nodes: CategoryTreeNode[]) => {
      for (const n of nodes) {
        map[n.id] = n.totalUniqueCount ?? n.directCount ?? 0;
        if (n.children?.length) walk(n.children);
      }
    };
    walk(categoryTree);
    return map;
  }, [categoryTree]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("wiki_codex_theme") as FantasyThemeId | null;
    if (savedTheme && THEMES.some((t) => t.id === savedTheme)) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
    try {
      const bm = JSON.parse(localStorage.getItem("wiki_codex_bookmarks") || "[]");
      if (Array.isArray(bm)) setBookmarks(bm);
      const rc = JSON.parse(localStorage.getItem("wiki_codex_recent") || "[]");
      if (Array.isArray(rc)) setRecentIds(rc);
    } catch {}
  }, []);

  function applyTheme(next: FantasyThemeId) {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("wiki_codex_theme", next);
  }

  function toggleBookmark(id: string) {
    setBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      localStorage.setItem("wiki_codex_bookmarks", JSON.stringify(next));
      return next;
    });
  }

  // Global Keyboard Shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT");

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
        return;
      }
      if (isInput) return;

      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
      } else if (e.shiftKey && e.key.toLowerCase() === "n" && canEdit) {
        e.preventDefault();
        setEditorState({ open: true, entry: null });
      } else if (e.shiftKey && e.key.toLowerCase() === "g") {
        setSection("graph");
        setActiveEntryId(null);
      } else if (e.shiftKey && e.key.toLowerCase() === "m") {
        setSection("atlas");
        setActiveEntryId(null);
      } else if (e.shiftKey && e.key.toLowerCase() === "l") {
        setSection("conlang");
        setActiveEntryId(null);
      } else if (e.shiftKey && e.key.toLowerCase() === "b") {
        setBookModeOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canEdit]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadAuthAndWorkspaces = useCallback(async (preferWsId?: string) => {
    const [authRes, wsRes] = await Promise.all([
      fetch("/api/auth"),
      fetch("/api/workspaces")
    ]);
    const authData = await authRes.json();
    const wsData = await wsRes.json();
    if (authData.user) setUser(authData.user);
    if (authData.storage?.backend) setStorageBackend(authData.storage.backend);
    const wsList: Workspace[] = wsData.workspaces || [];
    setWorkspaces(wsList);
    setActiveWorkspaceId((curr) => {
      if (preferWsId && wsList.some((w) => w.id === preferWsId)) return preferWsId;
      if (curr && wsList.some((w) => w.id === curr)) return curr;
      return wsList[0]?.id || "";
    });
  }, []);

  useEffect(() => {
    loadAuthAndWorkspaces();
  }, [loadAuthAndWorkspaces]);

  const loadWorkspaceMeta = useCallback(async () => {
    if (!activeWorkspaceId) return;
    const [catRes, typeRes, langRes, tlRes, v2Res] = await Promise.all([
      fetch(`/api/categories?workspaceId=${activeWorkspaceId}&q=${encodeURIComponent(catFilter)}`),
      fetch(`/api/entry-types?workspaceId=${activeWorkspaceId}`),
      fetch(`/api/conlang?workspaceId=${activeWorkspaceId}`),
      fetch(`/api/timeline?workspaceId=${activeWorkspaceId}`),
      fetch(`/api/v2?workspaceId=${activeWorkspaceId}`)
    ]);
    const [catData, typeData, langData, tlData, v2Data] = await Promise.all([
      catRes.json(),
      typeRes.json(),
      langRes.json(),
      tlRes.json(),
      v2Res.json()
    ]);
    setCategories(catData.categories || []);
    setCategoryTree(catData.tree || []);
    setEntryTypes(typeData.entryTypes || []);
    setConlangs(langData.conlangs || []);
    setActiveConlangId((curr) =>
      curr && (langData.conlangs || []).some((c: ConlangLanguage) => c.id === curr)
        ? curr
        : langData.conlangs?.[0]?.id || ""
    );
    setTimelineEvents(tlData.events || []);
    setTemplates(v2Data.templates || []);
    setLoreboards(v2Data.loreboards || []);
    setCalendars(v2Data.calendars || []);
    setMediaAssets(v2Data.mediaAssets || []);
    setGlossaryTerms(v2Data.glossaryTerms || []);
    setCollections(v2Data.collections || []);
    setEditorialTasks(v2Data.editorialTasks || []);
    setActivityLog(v2Data.activityLog || []);
    setWorldUnits(v2Data.worldUnits || []);
    setSavedViews(v2Data.savedViews || []);
  }, [activeWorkspaceId, catFilter]);

  useEffect(() => {
    loadWorkspaceMeta();
  }, [loadWorkspaceMeta]);

  const loadEntries = useCallback(async () => {
    if (!activeWorkspaceId) return;
    setLoadingEntries(true);
    const params = new URLSearchParams({
      workspaceId: activeWorkspaceId,
      page: String(page),
      limit: "24",
      sortBy,
      status: filterStatus,
      visibility: filterVisibility
    });
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (selectedCategoryId) params.set("categoryId", selectedCategoryId);
    if (filterTypeId) params.set("entryTypeId", filterTypeId);
    if (filterTag) params.set("tag", filterTag);
    if (minPowerFilter !== null) params.set("minPower", String(minPowerFilter));
    if (maxPowerFilter !== null) params.set("maxPower", String(maxPowerFilter));

    try {
      const res = await fetch(`/api/entries?${params}`);
      const data = await res.json();
      setEntries(data.items || []);
      setTotalEntries(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setAllTags(data.allTags || []);
    } finally {
      setLoadingEntries(false);
    }
  }, [
    activeWorkspaceId,
    page,
    sortBy,
    filterStatus,
    filterVisibility,
    debouncedSearch,
    selectedCategoryId,
    filterTypeId,
    filterTag,
    minPowerFilter,
    maxPowerFilter
  ]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Sync openTabs titles & sigils whenever entries list refreshes
  useEffect(() => {
    if (entries.length === 0) return;
    setOpenTabs((prev) => {
      let changed = false;
      const next = prev.map((t) => {
        const hit = entries.find((e) => e.id === t.id);
        if (hit && (hit.title !== t.title || hit.sigil !== t.sigil)) {
          changed = true;
          return { ...t, title: hit.title, sigil: hit.sigil };
        }
        return t;
      });
      return changed ? next : prev;
    });
  }, [entries]);

  async function refreshAll() {
    await Promise.all([loadWorkspaceMeta(), loadEntries()]);
  }

  async function handleBulkAction(ids: string[], bulkAction: Record<string, unknown>) {
    await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bulk", entryIds: ids, bulkAction })
    });
    await refreshAll();
  }

  function handleOpenEntry(id: string) {
    setActiveEntryId(id);
    setSection("database");
    setMobileDrawerOpen(false);
    setMobileMoreOpen(false);

    // Track Multi-Tab bar & recent reads
    const found = entries.find((e) => e.id === id);
    setOpenTabs((prev) => {
      if (prev.some((t) => t.id === id)) return prev;
      return [
        ...prev.slice(-6),
        { id, title: found?.title || "Hồ sơ Codex", sigil: found?.sigil || "✦" }
      ];
    });
    setRecentIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 8);
      localStorage.setItem("wiki_codex_recent", JSON.stringify(next));
      return next;
    });
  }

  function closeTab(id: string) {
    setOpenTabs((prev) => prev.filter((t) => t.id !== id));
    if (activeEntryId === id) {
      const remaining = openTabs.filter((t) => t.id !== id);
      setActiveEntryId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
  }

  function handleCreateRedLink(missingTitle: string) {
    if (!canEdit) {
      setAuthModalOpen(true);
      return;
    }
    setEditorState({ open: true, entry: null, initialTitle: missingTitle });
  }

  function handleOpenRandom() {
    if (entries.length === 0) return;
    handleOpenEntry(entries[Math.floor(Math.random() * entries.length)].id);
  }

  const navItems: Array<{
    id: MainSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    editorOnly?: boolean;
  }> = [
    { id: "home", label: "Đại Sảnh", icon: LayoutDashboard },
    { id: "database", label: "Kho Hồ sơ", icon: BookOpen },
    { id: "v4studio", label: "Studio Thế Giới V4", icon: Layers },
    { id: "chronicles", label: "Phòng Đọc Truyện", icon: ScrollText },
    { id: "omniverse", label: "Power & Công cụ V3", icon: Sparkles },
    { id: "conlang", label: "Đa Ngôn Ngữ & Chữ Cái", icon: Languages },
    { id: "graph", label: "Đồ thị & Gia phả", icon: Network },
    { id: "loreboard", label: "Loreboard", icon: StickyNote },
    { id: "timeline", label: "Biên niên sử", icon: Hourglass },
    { id: "calendar", label: "Lịch Thế Giới", icon: Calendar },
    { id: "atlas", label: "Bản đồ Atlas", icon: MapIcon },
    { id: "media", label: "Media Vault", icon: ImageIcon },
    { id: "collections", label: "Tuyển tập & Glossary", icon: FolderKanban },
    { id: "health", label: "Sức khỏe Wiki", icon: Activity },
    { id: "trash", label: "Thùng rác", icon: Trash2, editorOnly: true }
  ];

  const { isMobile, isTablet, isDesktop, isManualOverride, resolved, setMode } = useDeviceUI();
  const [readingTrail, setReadingTrail] = useState<TrailItem[]>([]);
  const [comparatorState, setComparatorState] = useState<{ open: boolean; initialId: string | null }>({
    open: false,
    initialId: null
  });
  const [atlasSplitEntryId, setAtlasSplitEntryId] = useState<string | null>(null);
  const [atlasSplitMode, setAtlasSplitMode] = useState(false);

  const visibleNavItems = navItems.filter((item) => !item.editorOnly || canEdit);

  // Feature #5: Track last 8 visited entries in Reading Breadcrumb Trail
  useEffect(() => {
    if (!activeEntryId) return;
    const found = entries.find((e) => e.id === activeEntryId);
    if (!found) return;
    setReadingTrail((prev) => {
      const next = [...prev.filter((x) => x.id !== found.id), { id: found.id, title: found.title, sigil: found.sigil }];
      return next.slice(-8);
    });
  }, [activeEntryId, entries]);

  // Feature #11: Pro Desktop Keyboard Navigation (J / K next-prev entry, G Atlas)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement | null)?.isContentEditable) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "g" || e.key === "G") {
        setSection("atlas");
        setActiveEntryId(null);
      } else if ((e.key === "j" || e.key === "k") && activeEntryId && entries.length > 1) {
        const idx = entries.findIndex((x) => x.id === activeEntryId);
        if (idx >= 0) {
          const nextIdx = e.key === "j" ? (idx + 1) % entries.length : (idx - 1 + entries.length) % entries.length;
          handleOpenEntry(entries[nextIdx].id);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeEntryId, entries]);

  return (
    <div className={`codex-device-shell relative min-h-screen flex flex-col ${isMobile ? "pb-20" : "pb-20 lg:pb-0"}`}>
      <div className="codex-aurora-bg no-print" />
      {isManualOverride && (
        <div className="no-print bg-amber-500/15 border-b border-amber-500/35 px-3 py-1 text-[11px] text-amber-200 flex items-center justify-between gap-2">
          <span>
            ✦ Đang dùng giao diện chế độ <strong>{resolved === "mobile" ? "Điện thoại (Mobile Studio)" : resolved === "tablet" ? "Máy tính bảng (Tablet Studio)" : "Desktop Pro"}</strong>
          </span>
          <button
            type="button"
            onClick={() => setMode("auto")}
            className="px-2 py-0.5 rounded bg-amber-500/25 hover:bg-amber-500/40 text-amber-100 font-semibold cursor-pointer"
          >
            Về Tự động
          </button>
        </div>
      )}
      {/* Top Arcane Bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-xl no-print">
        <div className="max-w-[1720px] mx-auto px-3 sm:px-5 h-14 sm:h-15 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-[var(--border-subtle)] text-[var(--accent)]"
              aria-label="Mở cây danh mục"
            >
              <FolderTree className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              title={sidebarCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên (Slim Rail)"}
              className="hidden lg:flex p-2 rounded-xl border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer"
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl text-[var(--accent)] shrink-0">
                {activeWorkspace?.sigil || "✦"}
              </span>
              <select
                value={activeWorkspaceId}
                onChange={(e) => {
                  setActiveWorkspaceId(e.target.value);
                  setSelectedCategoryId(null);
                  setActiveEntryId(null);
                  setOpenTabs([]);
                  setPage(1);
                }}
                className="font-display font-bold text-sm sm:text-base bg-transparent text-[var(--text-primary)] focus:outline-none truncate max-w-[155px] sm:max-w-[270px] cursor-pointer"
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id} className="bg-[#090e1c] text-white">
                    {w.sigil} {w.name}
                  </option>
                ))}
              </select>
              {canEdit && (
                <button type="button" title="Quản lý Không gian" onClick={() => setWsModalOpen(true)} className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer">
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Center Ctrl+K */}
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/70 text-xs text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] transition w-64 xl:w-80 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="flex-1 text-left">Tìm toàn cục không dấu...</span>
            <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10">Ctrl K</kbd>
          </button>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5">
            <DeviceUISwitcher compact={isMobile} />
            {activeWorkspace && (
              <button
                type="button"
                onClick={() => setPublishModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs hover:brightness-110 transition cursor-pointer shadow-md shadow-[var(--accent)]/20"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">1-Click Push</span>
              </button>
            )}

            {canEdit && (
              <button
                type="button"
                title="Quản lý 10+ Loại Thực thể & Trường động"
                onClick={() => setTypeModalOpen(true)}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="hidden xl:inline">Loại thực thể</span>
              </button>
            )}

            {canEdit && (
              <button
                type="button"
                title="Nhập hàng loạt hồ sơ thực thể từ CSV"
                onClick={() => setBatchCsvOpen(true)}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-xs text-emerald-300 hover:bg-emerald-500/20 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Nhập CSV</span>
              </button>
            )}

            <button
              type="button"
              title="Xuất bản Sách Bách Khoa In Ấn / PDF V4.0"
              onClick={() => setBookPublisherOpen(true)}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="hidden xl:inline">Xuất Sách PDF</span>
            </button>

            <button type="button" title="Xuất / Nhập dữ liệu" onClick={() => setImportExportOpen(true)} className="p-2 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent)] cursor-pointer">
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={togglePerfMode}
              title={
                perfMode === "vivid"
                  ? "Đang bật Giao diện Sống động 60 FPS — bấm để chuyển Chế độ Siêu nhẹ tiết kiệm pin"
                  : "Đang bật Chế độ Siêu nhẹ — bấm để bật lại Giao diện Sống động"
              }
              className={`codex-press hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs cursor-pointer ${
                perfMode === "vivid"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-[var(--border-subtle)] text-[var(--text-muted)]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{perfMode === "vivid" ? "Sống động" : "Siêu nhẹ"}</span>
            </button>

            <button type="button" title="Phím tắt (?)" onClick={() => setShortcutsOpen(true)} className="hidden md:flex p-2 rounded-xl border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer">
              <Keyboard className="w-3.5 h-3.5" />
            </button>

            {/* 6 Fantasy Themes */}
            <div className="relative group">
              <button type="button" title="6 Giao diện Huyền ảo (Theme)" className="p-2 rounded-xl border border-[var(--border-subtle)] text-[var(--accent)] hover:border-[var(--accent)] cursor-pointer">
                <Palette className="w-3.5 h-3.5" />
              </button>
              <div className="hidden group-hover:block absolute right-0 top-full pt-1.5 z-40">
                <div className="w-52 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-1.5 shadow-2xl space-y-1">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTheme(t.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer ${
                        theme === t.id
                          ? "bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
                          : "text-[var(--text-secondary)] hover:bg-white/5"
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.dot }} />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button type="button" onClick={() => setAuthModalOpen(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 text-xs hover:border-[var(--accent)] cursor-pointer">
              <Shield className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="hidden sm:inline font-mono uppercase text-[11px]">{user.role}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Shell (Adaptive Collapsible Desktop Rail) */}
      <div className="flex-1 max-w-[1720px] w-full mx-auto px-3 sm:px-5 py-4 flex gap-5 items-start">
        {/* Desktop / Tablet Sidebar (Hidden in Mobile Studio, Slim Rail on Tablet, Full on Desktop) */}
        <aside
          className={`${isMobile ? "hidden" : "hidden lg:flex"} flex-col gap-3 sticky top-20 max-h-[calc(100vh-5.5rem)] shrink-0 transition-all duration-200 no-print ${
            sidebarCollapsed || isTablet ? "w-16" : "w-72"
          }`}
        >
          <nav className="codex-card rounded-2xl p-1.5 space-y-0.5 overflow-y-auto">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const active = section === item.id && !activeEntryId;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  onClick={() => {
                    setSection(item.id);
                    setActiveEntryId(null);
                  }}
                  className={`w-full flex items-center gap-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    sidebarCollapsed ? "justify-center p-2.5" : "px-3 py-2"
                  } ${
                    active
                      ? "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-strong)]"
                      : "text-[var(--text-secondary)] hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {!sidebarCollapsed && (
            <>
              <div className="codex-card rounded-2xl p-3 flex-1 min-h-[220px] overflow-hidden flex flex-col">
                <SidebarTree
                  workspaceId={activeWorkspaceId}
                  categories={categories}
                  tree={categoryTree}
                  selectedCategoryId={selectedCategoryId}
                  canEdit={canEdit}
                  totalVisibleEntries={totalEntries}
                  onSelectCategory={(cid) => {
                    setSelectedCategoryId(cid);
                    setSection("database");
                    setActiveEntryId(null);
                    setPage(1);
                  }}
                  onRefresh={refreshAll}
                  filterQuery={catFilter}
                  onFilterChange={setCatFilter}
                />
              </div>

              <div className="codex-card rounded-2xl p-2.5 space-y-1.5 text-[11px]">
                {bookmarks.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[var(--accent)] flex items-center gap-1 mr-1">
                      <Bookmark className="w-3 h-3" />
                    </span>
                    {bookmarks.slice(0, 3).map((bid) => (
                      <button key={bid} type="button" onClick={() => handleOpenEntry(bid)} className="px-1.5 py-0.5 rounded bg-white/5 hover:text-[var(--accent)] truncate max-w-[110px] cursor-pointer">
                        {entries.find((e) => e.id === bid)?.title || "Đã lưu"}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between font-mono text-[10px] text-[var(--text-muted)]">
                  <span>{storageBackend === "postgresql" ? "PostgreSQL" : "Local JSON"} · V2.0</span>
                  <span className="text-emerald-400">● 60fps</span>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Main Content Canvas */}
        <main className="flex-1 min-w-0 space-y-3">
          {/* Desktop Multi-Tab Codex Reading Bar */}
          {openTabs.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1 no-print">
              {openTabs.map((t) => {
                const isCurrent = activeEntryId === t.id;
                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs shrink-0 transition ${
                      isCurrent
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
                        : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <button type="button" onClick={() => handleOpenEntry(t.id)} className="flex items-center gap-1.5 cursor-pointer max-w-[160px] truncate">
                      <span>{t.sigil}</span>
                      <span className="truncate">{t.title}</span>
                    </button>
                    <button type="button" onClick={() => closeTab(t.id)} className="hover:text-rose-400 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeEntryId ? (
            <div className="space-y-3">
              <ReadingBreadcrumbTrail
                trail={readingTrail}
                currentEntryId={activeEntryId}
                onSelectEntry={handleOpenEntry}
              />
              <EntryDetailView
                entryId={activeEntryId}
                entryTypes={entryTypes}
                categories={categories}
                conlangs={conlangs}
                canEdit={canEdit}
                isBookmarked={bookmarks.includes(activeEntryId)}
                onToggleBookmark={toggleBookmark}
                onBack={() => setActiveEntryId(null)}
                onOpenEntry={handleOpenEntry}
                onEditEntry={(ent) => setEditorState({ open: true, entry: ent })}
                onCreateRedLink={handleCreateRedLink}
                onViewOnPlanetaryAtlas={(nationId) => {
                  setAtlasFocusNationId(nationId);
                  setSection("atlas");
                  setActiveEntryId(null);
                }}
                onOpenComparator={(id) => setComparatorState({ open: true, initialId: id })}
                allCards={entries}
                onMutated={refreshAll}
              />
            </div>
          ) : section === "home" && activeWorkspace ? (
            <div className="space-y-4 animate-codex-fade-up">
              <CategorySliderRibbon
                categories={categories}
                categoryCounts={categoryCounts}
                totalEntries={totalEntries}
                selectedCategoryId={selectedCategoryId || ""}
                onSelectCategory={(cid) => {
                  setSelectedCategoryId(cid || null);
                  setSection("database");
                  setPage(1);
                }}
              />
              <GrandHallView
                workspace={activeWorkspace}
                entries={entries}
                totalEntries={totalEntries}
                categoryCount={categories.length}
                entryTypeCount={entryTypes.length}
                collections={collections}
                activities={activityLog}
                recentIds={recentIds}
                onOpenEntry={handleOpenEntry}
                onNavigate={(sec) => setSection(sec as MainSection)}
              />
              <AlmanacLoreTrailsPanel
                onOpenEntry={handleOpenEntry}
                onOpenAtlas={() => {
                  setSection("atlas");
                  setActiveEntryId(null);
                }}
              />
            </div>
          ) : section === "database" ? (
            <div className="space-y-4 animate-codex-fade-up">
              <CategorySliderRibbon
                categories={categories}
                categoryCounts={categoryCounts}
                totalEntries={totalEntries}
                selectedCategoryId={selectedCategoryId || ""}
                onSelectCategory={(cid) => {
                  setSelectedCategoryId(cid || null);
                  setPage(1);
                }}
              />
              <DatabaseView
              workspaceId={activeWorkspaceId}
              entries={entries}
              total={totalEntries}
              page={page}
              totalPages={totalPages}
              loading={loadingEntries}
              entryTypes={entryTypes}
              categories={categories}
              allTags={allTags}
              canEdit={canEdit}
              searchQuery={searchQuery}
              filterTypeId={filterTypeId}
              filterStatus={filterStatus}
              filterVisibility={filterVisibility}
              filterTag={filterTag}
              minPowerFilter={minPowerFilter}
              maxPowerFilter={maxPowerFilter}
              onClearPowerFilter={() => {
                setMinPowerFilter(null);
                setMaxPowerFilter(null);
                setPage(1);
              }}
              sortBy={sortBy}
              savedViews={savedViews}
              onApplySavedView={(sv) => {
                if (sv.filters.query !== undefined) {
                  setSearchQuery(sv.filters.query);
                  setDebouncedSearch(sv.filters.query);
                }
                if (sv.filters.categoryId !== undefined) {
                  setSelectedCategoryId(sv.filters.categoryId ?? null);
                }
                setFilterTypeId(sv.filters.entryTypeId || "");
                setMinPowerFilter(sv.filters.minPower ?? null);
                setMaxPowerFilter(sv.filters.maxPower ?? null);
                setSortBy(sv.filters.sortBy || "powerLevel");
                setPage(1);
              }}
              onOpenShowcaseDeck={() => setShowcaseOpen(true)}
              onSearchChange={setSearchQuery}
              onFilterTypeChange={(v) => { setFilterTypeId(v); setPage(1); }}
              onFilterStatusChange={(v) => { setFilterStatus(v); setPage(1); }}
              onFilterVisibilityChange={(v) => { setFilterVisibility(v); setPage(1); }}
              onFilterTagChange={(v) => { setFilterTag(v); setPage(1); }}
              onSortByChange={setSortBy}
              onPageChange={setPage}
              onOpenEntry={handleOpenEntry}
              onCreateEntry={() => setEditorState({ open: true, entry: null })}
              onBulkAction={handleBulkAction}
              onCompareMatrix={(ids) => setMatrixIds(ids)}
              onOpenBookMode={() => setBookModeOpen(true)}
              onOpenRandom={handleOpenRandom}
            />
            </div>
          ) : section === "omniverse" ? (
            <V3OmniverseStudioView
              workspaceId={activeWorkspaceId}
              entries={entries}
              entryTypes={entryTypes}
              categories={categories}
              worldUnits={worldUnits}
              activeConlang={conlangs.find((c) => c.id === activeConlangId) ?? conlangs[0]}
              canEdit={canEdit}
              onOpenEntry={handleOpenEntry}
              onCreateEntryFromPrompt={(t, _s, md) =>
                setEditorState({ open: true, entry: null, initialTitle: t, initialContent: md })
              }
              onRefresh={refreshAll}
            />
          ) : section === "v4studio" ? (
            <V4WorldStudioView
              workspaceId={activeWorkspaceId}
              entries={entries}
              worldUnits={worldUnits}
              canEdit={canEdit}
              onOpenEntry={handleOpenEntry}
              onCreateMissingEntry={handleCreateRedLink}
            />
          ) : section === "chronicles" ? (
            <ChronicleReaderView
              workspaceId={activeWorkspaceId}
              entries={entries}
              canEdit={canEdit}
              onOpenEntry={handleOpenEntry}
              onCreateRedLink={handleCreateRedLink}
            />
          ) : section === "graph" ? (
            <KnowledgeGraphView workspaceId={activeWorkspaceId} entries={entries} onOpenEntry={handleOpenEntry} />
          ) : section === "loreboard" ? (
            <LoreboardView workspaceId={activeWorkspaceId} loreboards={loreboards} entries={entries} canEdit={canEdit} onOpenEntry={handleOpenEntry} onRefresh={loadWorkspaceMeta} />
          ) : section === "timeline" ? (
            <TimelineView workspaceId={activeWorkspaceId} entries={entries} canEdit={canEdit} onOpenEntry={handleOpenEntry} />
          ) : section === "calendar" ? (
            <CalendarView workspaceId={activeWorkspaceId} calendars={calendars} timelineEvents={timelineEvents} canEdit={canEdit} onRefresh={loadWorkspaceMeta} />
          ) : section === "atlas" ? (
            <div className="space-y-2">
              {isDesktop && (
                <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs">
                  <span className="text-[var(--text-muted)]">
                    ✦ <strong>Desktop Pro:</strong> Chia đôi Màn hình để xem Bản đồ 360 bên trái &amp; Hồ sơ Kinh tế song song bên phải.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAtlasSplitMode((v) => !v);
                      if (!atlasSplitEntryId) setAtlasSplitEntryId("ent-nation-1");
                    }}
                    className={`px-3 py-1 rounded-lg border font-semibold cursor-pointer transition-colors ${
                      atlasSplitMode
                        ? "bg-[var(--accent)] text-[#090e1c] border-[var(--accent)]"
                        : "border-[var(--border-strong)] text-[var(--accent)] hover:bg-[var(--accent-soft)]"
                    }`}
                  >
                    {atlasSplitMode ? "✓ Đang chia đôi (Atlas + Wiki)" : "Chia đôi: Atlas + Wiki"}
                  </button>
                </div>
              )}
              <div className={isDesktop && atlasSplitMode ? "grid grid-cols-12 gap-4 items-start" : ""}>
                <div className={isDesktop && atlasSplitMode ? "col-span-7" : ""}>
                  <AtlasView
                    workspaceId={activeWorkspaceId}
                    entries={entries}
                    canEdit={canEdit}
                    initialFocusNationId={atlasFocusNationId}
                    onOpenEntry={(id) => {
                      if (isDesktop && atlasSplitMode) {
                        setAtlasSplitEntryId(id);
                      } else {
                        handleOpenEntry(id);
                      }
                    }}
                    onCreateEntryFromAtlas={(t, _s, md) =>
                      setEditorState({ open: true, entry: null, initialTitle: t, initialContent: md })
                    }
                    onCreateTaskForNation={async (title, description) => {
                      try {
                        await fetch("/api/v2", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            resource: "task",
                            data: {
                              workspaceId: activeWorkspaceId,
                              title,
                              description,
                              status: "todo",
                              priority: "medium"
                            }
                          })
                        });
                        await loadWorkspaceMeta();
                        setSection("health");
                        setActiveEntryId(null);
                      } catch {
                        // ignore network error
                      }
                    }}
                  />
                </div>
                {isDesktop && atlasSplitMode && atlasSplitEntryId && (
                  <div className="col-span-5 max-h-[82vh] overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-base)] p-3">
                    <EntryDetailView
                      entryId={atlasSplitEntryId}
                      entryTypes={entryTypes}
                      categories={categories}
                      conlangs={conlangs}
                      canEdit={canEdit}
                      isBookmarked={bookmarks.includes(atlasSplitEntryId)}
                      onToggleBookmark={toggleBookmark}
                      onBack={() => setAtlasSplitMode(false)}
                      onOpenEntry={(id) => setAtlasSplitEntryId(id)}
                      onEditEntry={(ent) => setEditorState({ open: true, entry: ent })}
                      onCreateRedLink={handleCreateRedLink}
                      onOpenComparator={(id) => setComparatorState({ open: true, initialId: id })}
                      allCards={entries}
                      onMutated={refreshAll}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : section === "conlang" ? (
            <ConlangStudioView
              workspaceId={activeWorkspaceId}
              conlangs={conlangs}
              activeConlangId={activeConlangId}
              canEdit={canEdit}
              onSelectActiveConlang={setActiveConlangId}
              onRefresh={loadWorkspaceMeta}
              onCreateEntryFromName={(name) => setEditorState({ open: true, entry: null, initialTitle: name })}
            />
          ) : section === "media" ? (
            <MediaVaultView workspaceId={activeWorkspaceId} mediaAssets={mediaAssets} canEdit={canEdit} onRefresh={loadWorkspaceMeta} />
          ) : section === "collections" ? (
            <V2KnowledgeHubView
              workspaceId={activeWorkspaceId}
              collections={collections}
              glossaryTerms={glossaryTerms}
              editorialTasks={editorialTasks}
              entries={entries}
              canEdit={canEdit}
              onOpenEntry={handleOpenEntry}
              onCreateEntryFromTask={(t, d) =>
                setEditorState({ open: true, entry: null, initialTitle: t, initialContent: `## Tổng quan\n\n${d}` })
              }
              onRefresh={loadWorkspaceMeta}
            />
          ) : section === "health" ? (
            <WikiHealthView
              workspaceId={activeWorkspaceId}
              canEdit={canEdit}
              isAdmin={isAdmin}
              onOpenEntry={handleOpenEntry}
              onCreateRedLink={handleCreateRedLink}
              onMutated={refreshAll}
            />
          ) : (
            <TrashView workspaceId={activeWorkspaceId} isAdmin={isAdmin} onRestored={refreshAll} />
          )}
        </main>
      </div>

      {/* Mobile Category Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/70 backdrop-blur-sm flex" onClick={() => setMobileDrawerOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-80 max-w-[85vw] bg-[var(--bg-elevated)] border-r border-[var(--border-strong)] p-4 flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[var(--border-subtle)]">
              <span className="font-display font-semibold text-[var(--accent)]">✦ Cây Danh mục Đa cấp</span>
              <button type="button" onClick={() => setMobileDrawerOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SidebarTree
                workspaceId={activeWorkspaceId}
                categories={categories}
                tree={categoryTree}
                selectedCategoryId={selectedCategoryId}
                canEdit={canEdit}
                totalVisibleEntries={totalEntries}
                onSelectCategory={(cid) => {
                  setSelectedCategoryId(cid);
                  setSection("database");
                  setActiveEntryId(null);
                  setMobileDrawerOpen(false);
                }}
                onRefresh={refreshAll}
                filterQuery={catFilter}
                onFilterChange={setCatFilter}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Full-Feature Bottom Sheet */}
      {mobileMoreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/70 backdrop-blur-sm flex items-end" onClick={() => setMobileMoreOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full rounded-t-3xl border-t border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 pb-8 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="font-display font-semibold text-[var(--accent)]">✦ Tất cả Phân hệ Aethel Codex V2.0</span>
              <button type="button" onClick={() => setMobileMoreOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSection(item.id);
                      setActiveEntryId(null);
                      setMobileMoreOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 text-[11px] min-h-[72px] ${
                      section === item.id
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                        : "border-[var(--border-subtle)] bg-[var(--bg-base)]/60 text-[var(--text-secondary)]"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-center leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile-First Bottom Navigation Bar (48px+ touch targets + safe-area — also shown in manual Mobile override) */}
      <nav className={`${isMobile ? "grid" : "lg:hidden grid"} fixed bottom-0 inset-x-0 z-30 border-t border-[var(--border-strong)] bg-[var(--bg-surface)] backdrop-blur-xl px-2 pt-1.5 pb-safe grid-cols-5 gap-1 no-print`}>
        {(
          [
            ["home", LayoutDashboard, "Đại Sảnh"],
            ["database", BookOpen, "Hồ sơ"],
            ["atlas", MapIcon, "Bản đồ 360"]
          ] as const
        ).map(([id, Icon, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setSection(id);
              setActiveEntryId(null);
            }}
            className={`flex flex-col items-center justify-center min-h-[44px] rounded-xl text-[10px] ${
              section === id && !activeEntryId
                ? "text-[var(--accent)] bg-[var(--accent-soft)] font-semibold"
                : "text-[var(--text-muted)]"
            }`}
          >
            <Icon className="w-4 h-4 mb-0.5" />
            <span>{label}</span>
          </button>
        ))}
        <button type="button" onClick={() => setCmdOpen(true)} className="flex flex-col items-center justify-center min-h-[44px] rounded-xl text-[10px] text-[var(--text-muted)]">
          <Search className="w-4 h-4 mb-0.5 text-[var(--accent)]" />
          <span>Tìm kiếm</span>
        </button>
        <button type="button" onClick={() => setMobileMoreOpen(true)} className="flex flex-col items-center justify-center min-h-[44px] rounded-xl text-[10px] text-[var(--text-muted)]">
          <Menu className="w-4 h-4 mb-0.5 text-[var(--accent)]" />
          <span>Thêm</span>
        </button>
      </nav>

      {/* Floating Scratchpad */}
      <QuickScratchpad
        canEdit={canEdit}
        onConvertToEntry={(text) =>
          setEditorState({ open: true, entry: null, initialContent: text })
        }
      />

      {/* Feature #1: Multi-Nation Economy Comparator Modal */}
      <MultiNationEconomyComparatorModal
        open={comparatorState.open}
        onClose={() => setComparatorState({ open: false, initialId: null })}
        initialEntryId={comparatorState.initialId}
        allCards={entries}
      />

      {/* Modals */}
      <CommandPalette
        workspaceId={activeWorkspaceId}
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onSelectEntry={handleOpenEntry}
        onSelectCategory={(cid) => {
          setSelectedCategoryId(cid);
          setSection("database");
          setActiveEntryId(null);
        }}
        onOpenTab={(t) => {
          setSection(t);
          setActiveEntryId(null);
        }}
        onSelectPlanetaryNation={(nationId) => {
          setAtlasFocusNationId(nationId);
          setSection("atlas");
          setActiveEntryId(null);
        }}
      />

      {editorState.open && (
        <EntryEditorModal
          workspaceId={activeWorkspaceId}
          entry={editorState.entry}
          initialTitle={editorState.initialTitle}
          initialContent={editorState.initialContent}
          entryTypes={entryTypes}
          categories={categories}
          entriesForAutocomplete={entries}
          templates={templates}
          mediaAssets={mediaAssets}
          onClose={() => setEditorState({ open: false, entry: null })}
          onSaved={async (saved) => {
            setEditorState({ open: false, entry: null });
            setOpenTabs((prev) =>
              prev.map((t) =>
                t.id === saved.id ? { ...t, title: saved.title, sigil: saved.sigil } : t
              )
            );
            await refreshAll();
            handleOpenEntry(saved.id);
          }}
        />
      )}

      {typeModalOpen && (
        <EntryTypeManagerModal workspaceId={activeWorkspaceId} entryTypes={entryTypes} onClose={() => setTypeModalOpen(false)} onRefresh={loadWorkspaceMeta} />
      )}

      {wsModalOpen && (
        <WorkspaceManagerModal
          workspaces={workspaces}
          isAdmin={isAdmin}
          onClose={() => setWsModalOpen(false)}
          onSaved={async (newId) => {
            await loadAuthAndWorkspaces(newId);
            setWsModalOpen(false);
          }}
        />
      )}

      {publishModalOpen && activeWorkspace && (
        <PublishCenterModal
          workspace={activeWorkspace}
          canPublish={canEdit}
          onClose={() => setPublishModalOpen(false)}
          onPublished={refreshAll}
        />
      )}

      {batchCsvOpen && (
        <BatchCsvImportModal
          workspaceId={activeWorkspaceId}
          entryTypes={entryTypes}
          categories={categories}
          onClose={() => setBatchCsvOpen(false)}
          onImported={refreshAll}
        />
      )}

      {bookPublisherOpen && activeWorkspace && (
        <BookPublisherModal
          workspaceId={activeWorkspace.id}
          workspaceName={activeWorkspace.name}
          categories={categories}
          entryTypes={entryTypes}
          onClose={() => setBookPublisherOpen(false)}
        />
      )}

      {importExportOpen && (
        <ImportExportModal workspaceId={activeWorkspaceId} canEdit={canEdit} onClose={() => setImportExportOpen(false)} onImported={refreshAll} />
      )}

      {authModalOpen && (
        <AuthModal
          user={user}
          onClose={() => setAuthModalOpen(false)}
          onAuthChanged={async (nextUser) => {
            setUser(nextUser);
            await loadAuthAndWorkspaces();
            await refreshAll();
          }}
        />
      )}

      {matrixIds && (
        <MultiMatrixModal entryIds={matrixIds} entryTypes={entryTypes} onClose={() => setMatrixIds(null)} />
      )}

      {bookModeOpen && activeWorkspace && (
        <CodexBookModeModal
          workspaceId={activeWorkspace.id}
          workspaceName={activeWorkspace.name}
          categoryId={selectedCategoryId}
          conlang={conlangs[0]}
          onClose={() => setBookModeOpen(false)}
        />
      )}

      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}

      {showcaseOpen && entries.length > 0 && (
        <ShowcaseDeckModal entries={entries} onClose={() => setShowcaseOpen(false)} />
      )}
    </div>
  );
}
