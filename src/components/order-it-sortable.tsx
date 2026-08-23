"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { reorderItems } from "./order-it-reorder";

export interface OrderItItem {
  orig: number;
  text: string;
}

const HOLD_MS = 180;
const SCROLL_CANCEL_PX = 10;
const MOUSE_DRAG_PX = 5;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function DragHandle() {
  return (
    <span
      className="flex h-9 w-8 shrink-0 flex-col items-center justify-center gap-[3px] rounded-xl"
      style={{ background: "var(--rp-bg-muted)" }}
      aria-hidden="true"
    >
      {[0, 1, 2].map((row) => (
        <span key={row} className="flex gap-[3px]">
          {[0, 1].map((dot) => (
            <span
              key={dot}
              className="h-1 w-1 rounded-full"
              style={{ background: "var(--rp-text-secondary)", opacity: 0.5 }}
            />
          ))}
        </span>
      ))}
    </span>
  );
}

interface OrderItSortableProps {
  items: OrderItItem[];
  onChange: (next: OrderItItem[]) => void;
}

export function OrderItSortable({ items, onChange }: OrderItSortableProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const itemsRef = useRef(items);
  const onChangeRef = useRef(onChange);

  const pendingRef = useRef<{
    pointerId: number;
    index: number;
    startX: number;
    startY: number;
    timer: number;
    el: HTMLButtonElement;
    isTouch: boolean;
  } | null>(null);

  const dragRef = useRef<{
    pointerId: number;
    from: number;
    startY: number;
    pitch: number;
    grabEl: HTMLButtonElement;
  } | null>(null);

  const overIndexRef = useRef(0);

  const [draggingFrom, setDraggingFrom] = useState<number | null>(null);
  const [pressingIndex, setPressingIndex] = useState<number | null>(null);

  const resetRowTransforms = useCallback(() => {
    rowRefs.current.forEach((row) => {
      if (!row) return;
      gsap.killTweensOf(row);
      gsap.set(row, { y: 0, scale: 1, zIndex: 1 });
    });
  }, []);

  const clearPending = useCallback(() => {
    const pending = pendingRef.current;
    if (pending) {
      window.clearTimeout(pending.timer);
      pendingRef.current = null;
    }
    setPressingIndex(null);
  }, []);

  const applySiblingShifts = useCallback((from: number, over: number, pitch: number) => {
    rowRefs.current.forEach((row, i) => {
      if (!row || i === from) return;
      let shift = 0;
      if (from < over && i > from && i <= over) shift = -pitch;
      else if (over < from && i >= over && i < from) shift = pitch;
      gsap.to(row, { y: shift, duration: 0.18, ease: "power2.out", overwrite: "auto" });
    });
  }, []);

  const activateDrag = useCallback(
    (index: number, pointerId: number, clientY: number, el: HTMLButtonElement) => {
      const pending = pendingRef.current;
      if (pending) {
        window.clearTimeout(pending.timer);
        pendingRef.current = null;
      }
      setPressingIndex(null);

      const rows = rowRefs.current.filter(Boolean) as HTMLButtonElement[];
      const measuredPitch =
        rows.length >= 2
          ? rows[1].getBoundingClientRect().top - rows[0].getBoundingClientRect().top
          : el.getBoundingClientRect().height + 8;
      const pitch = measuredPitch > 1 ? measuredPitch : 56;

      try {
        el.setPointerCapture(pointerId);
      } catch {
        /* pointer already gone */
      }

      const screen = el.closest(".ps-screen") as HTMLElement | null;
      if (screen) {
        screen.dataset.rpOverflow = screen.style.overflowY;
        screen.style.overflowY = "hidden";
      }

      dragRef.current = {
        pointerId,
        from: index,
        startY: clientY,
        pitch,
        grabEl: el,
      };
      overIndexRef.current = index;
      setDraggingFrom(index);
      gsap.set(el, { zIndex: 8, scale: 1.04 });
      try {
        navigator.vibrate?.(12);
      } catch {
        /* ignore */
      }
    },
    [],
  );

  const finishDrag = useCallback(
    (commit: boolean) => {
      const drag = dragRef.current;
      if (!drag) return;

      const from = drag.from;
      const over = overIndexRef.current;
      try {
        drag.grabEl.releasePointerCapture(drag.pointerId);
      } catch {
        /* already released */
      }
      const screen = drag.grabEl.closest(".ps-screen") as HTMLElement | null;
      if (screen) {
        screen.style.overflowY = screen.dataset.rpOverflow ?? "";
        delete screen.dataset.rpOverflow;
      }
      dragRef.current = null;
      setDraggingFrom(null);

      if (commit && over !== from) {
        onChangeRef.current(reorderItems(itemsRef.current, from, over));
      } else {
        resetRowTransforms();
      }
    },
    [resetRowTransforms],
  );

  useLayoutEffect(() => {
    itemsRef.current = items;
    onChangeRef.current = onChange;
    resetRowTransforms();
  }, [items, onChange, resetRowTransforms]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (drag && event.pointerId === drag.pointerId) {
        event.preventDefault();
        const dy = event.clientY - drag.startY;
        gsap.set(drag.grabEl, { y: dy, scale: 1.04 });

        const over = clamp(
          drag.from + Math.round(dy / drag.pitch),
          0,
          itemsRef.current.length - 1,
        );
        if (over !== overIndexRef.current) {
          overIndexRef.current = over;
          applySiblingShifts(drag.from, over, drag.pitch);
        }
        return;
      }

      const pending = pendingRef.current;
      if (!pending || event.pointerId !== pending.pointerId) return;

      const dist = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY);
      const threshold = pending.isTouch ? SCROLL_CANCEL_PX : MOUSE_DRAG_PX;
      if (dist < threshold) return;

      if (pending.isTouch) {
        clearPending();
        return;
      }

      activateDrag(pending.index, pending.pointerId, pending.startY, pending.el);
      const next = dragRef.current;
      if (next) {
        gsap.set(next.grabEl, { y: event.clientY - next.startY, scale: 1.04 });
      }
    };

    const onUp = (event: PointerEvent) => {
      if (dragRef.current?.pointerId === event.pointerId) {
        finishDrag(true);
        return;
      }
      if (pendingRef.current?.pointerId === event.pointerId) {
        clearPending();
      }
    };

    const onCancel = (event: PointerEvent) => {
      if (dragRef.current?.pointerId === event.pointerId) {
        finishDrag(false);
        return;
      }
      if (pendingRef.current?.pointerId === event.pointerId) {
        clearPending();
      }
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [activateDrag, applySiblingShifts, clearPending, finishDrag]);

  useEffect(() => {
    return () => {
      clearPending();
      resetRowTransforms();
    };
  }, [clearPending, resetRowTransforms]);

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>, index: number) => {
    if (event.button !== 0) return;
    if (dragRef.current) return;

    const el = event.currentTarget;
    const isTouch = event.pointerType === "touch";
    setPressingIndex(index);

    if (isTouch) {
      const timer = window.setTimeout(() => {
        const pending = pendingRef.current;
        if (!pending || pending.pointerId !== event.pointerId) return;
        activateDrag(index, event.pointerId, pending.startY, el);
      }, HOLD_MS);
      pendingRef.current = {
        pointerId: event.pointerId,
        index,
        startX: event.clientX,
        startY: event.clientY,
        timer,
        el,
        isTouch: true,
      };
      return;
    }

    pendingRef.current = {
      pointerId: event.pointerId,
      index,
      startX: event.clientX,
      startY: event.clientY,
      timer: 0,
      el,
      isTouch: false,
    };
  };

  const moveWithKeyboard = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= items.length) return;
    onChange(reorderItems(items, index, next));
  };

  return (
    <div
      ref={listRef}
      role="group"
      aria-label="Reihenfolge"
      aria-describedby="order-it-drag-hint"
      className="relative space-y-2"
    >
      <span
        className="pointer-events-none absolute bottom-7 left-[29px] top-7 w-0.5 rounded-full"
        style={{ background: "linear-gradient(var(--rp-peach-soft), var(--rp-purple-soft))" }}
        aria-hidden="true"
      />
      {items.map((entry, i) => {
        const isDragging = draggingFrom === i;
        const isPressing = pressingIndex === i && !isDragging;
        const isFirst = i === 0;
        const isLast = i === items.length - 1;
        return (
          <button
            type="button"
            key={entry.orig}
            ref={(node) => {
              rowRefs.current[i] = node;
            }}
            data-order-row
            tabIndex={0}
            aria-grabbed={isDragging}
            aria-label={`${i + 1}. ${entry.text}. Halten und ziehen zum Verschieben.`}
            onPointerDown={(e) => onPointerDown(e, i)}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                e.preventDefault();
                moveWithKeyboard(i, -1);
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                moveWithKeyboard(i, 1);
              }
            }}
            className="relative z-10 flex min-h-[58px] w-full select-none items-center gap-2.5 px-3 py-2 text-left"
            style={{
              background: isDragging
                ? "linear-gradient(135deg, #FFFFFF 0%, #F4F0FF 100%)"
                : "rgba(255, 255, 255, 0.88)",
              borderRadius: 18,
              border: isDragging
                ? "2px solid var(--rp-purple)"
                : "1.5px solid rgba(139, 124, 255, 0.12)",
              boxShadow: isDragging
                ? "0 16px 32px rgba(42, 42, 74, 0.18)"
                : "0 5px 14px rgba(42, 42, 74, 0.07)",
              touchAction: isDragging ? "none" : "pan-y",
              cursor: isDragging ? "grabbing" : "grab",
              opacity: isPressing ? 0.92 : 1,
              transition: "box-shadow 0.15s ease, border-color 0.15s ease, opacity 0.12s ease",
              willChange: isDragging ? "transform" : undefined,
              position: "relative",
            }}
          >
            <span
              className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black"
              style={{
                background: isFirst
                  ? "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)"
                  : isLast
                    ? "var(--rp-purple)"
                    : "var(--rp-purple-soft)",
                color: isFirst || isLast ? "#fff" : "var(--rp-purple)",
                boxShadow: isFirst || isLast ? "0 4px 10px rgba(98, 77, 156, 0.18)" : "none",
              }}
            >
              {i + 1}
            </span>
            <span className="flex-1 text-[15px] font-bold leading-snug" style={{ color: "var(--rp-text)" }}>
              {entry.text}
            </span>
            <DragHandle />
          </button>
        );
      })}
    </div>
  );
}
