"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DraggableScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  showArrows?: boolean;
  showScrollbar?: boolean;
  /** Convert vertical mouse wheel into smooth horizontal scroll when hovering */
  wheelHorizontal?: boolean;
  ariaLabel?: string;
}

/**
 * Universal horizontal scroll container supporting:
 * 1) Desktop mouse click-and-drag (grab / grabbing) with 5px click protection
 * 2) Mobile & Tablet native touch swipe
 * 3) Auto-appearing Left/Right arrow buttons & edge fade when content overflows
 * 4) Visible, sleek custom scrollbar (.codex-scrollbar)
 */
export function DraggableScrollArea({
  children,
  className = "",
  innerClassName = "flex items-center gap-1.5",
  showArrows = true,
  showScrollbar = true,
  wheelHorizontal = true,
  ariaLabel
}: DraggableScrollAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    isDown: boolean;
    startX: number;
    scrollLeft: number;
    moved: boolean;
  }>({ isDown: false, startX: 0, scrollLeft: 0, moved: false });

  const [dragging, setDragging] = useState(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const syncOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    syncOverflow();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(syncOverflow);
    ro.observe(el);
    return () => ro.disconnect();
  }, [syncOverflow, children]);

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const el = scrollRef.current;
    if (!el) return;
    dragState.current = {
      isDown: true,
      startX: e.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
      moved: false
    };
  }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!dragState.current.isDown) return;
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = x - dragState.current.startX;
    if (Math.abs(walk) > 5) {
      dragState.current.moved = true;
      if (!dragging) setDragging(true);
      e.preventDefault();
      el.scrollLeft = dragState.current.scrollLeft - walk * 1.15;
    }
  }

  function endDrag() {
    dragState.current.isDown = false;
    if (dragging) {
      // Delay clearing slightly so click capture suppresses accidental click right after drag
      window.setTimeout(() => {
        dragState.current.moved = false;
        setDragging(false);
      }, 40);
    }
  }

  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function onWheel(e: React.WheelEvent<HTMLDivElement>) {
    if (!wheelHorizontal) return;
    const el = scrollRef.current;
    if (!el || el.scrollWidth <= el.clientWidth + 2) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
    }
  }

  function nudge(dir: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(220, el.clientWidth * 0.6), behavior: "smooth" });
  }

  return (
    <div className={`relative group/scroll ${className}`}>
      {showArrows && canLeft && (
        <button
          type="button"
          onClick={() => nudge(-1)}
          aria-label="Cuộn sang trái"
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[var(--bg-surface)]/95 border border-[var(--border-strong)] shadow-lg items-center justify-center text-[var(--accent)] hover:scale-105 transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      <div
        ref={scrollRef}
        role="region"
        aria-label={ariaLabel}
        onScroll={syncOverflow}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onClickCapture={onClickCapture}
        onWheel={onWheel}
        className={`overflow-x-auto touch-pan-x select-none ${
          showScrollbar ? "codex-scrollbar pb-1.5" : "hide-scrollbar"
        } ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <div className={`${innerClassName} w-max min-w-full`}>{children}</div>
      </div>

      {showArrows && canRight && (
        <button
          type="button"
          onClick={() => nudge(1)}
          aria-label="Cuộn sang phải"
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[var(--bg-surface)]/95 border border-[var(--border-strong)] shadow-lg items-center justify-center text-[var(--accent)] hover:scale-105 transition cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
