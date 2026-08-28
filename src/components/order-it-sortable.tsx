"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { reorderItems } from "./order-it-reorder";
import styles from "./order-it-sortable.module.css";

export interface OrderItItem {
  orig: number;
  text: string;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function lockOverflowAncestors(start: HTMLElement): HTMLElement[] {
  const locked: HTMLElement[] = [];
  let node: HTMLElement | null = start;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
      locked.push(node);
      node.dataset.rpOverflowY = node.style.overflowY;
      node.dataset.rpTouchAction = node.style.touchAction;
      node.style.overflowY = "hidden";
      node.style.touchAction = "none";
    }
    node = node.parentElement;
  }
  return locked;
}

function unlockOverflowAncestors(nodes: HTMLElement[]) {
  for (const node of nodes) {
    node.style.overflowY = node.dataset.rpOverflowY ?? "";
    node.style.touchAction = node.dataset.rpTouchAction ?? "";
    delete node.dataset.rpOverflowY;
    delete node.dataset.rpTouchAction;
  }
}

function DragHandle() {
  return (
    <span
      className="flex h-9 w-8 shrink-0 flex-col items-center justify-center gap-[3px]"
      style={{
        background: "var(--rp-nb-lilac)",
        borderRadius: "var(--rp-nb-radius-sm)",
        border: "2px solid var(--rp-nb-black)",
      }}
      aria-hidden="true"
    >
      {[0, 1, 2].map((row) => (
        <span key={row} className="flex gap-[3px]">
          {[0, 1].map((dot) => (
            <span
              key={dot}
              className="h-1 w-1"
              style={{ background: "var(--rp-nb-black)", borderRadius: "var(--rp-nb-radius-sm)" }}
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
  const rowRefs = useRef<(HTMLElement | null)[]>([]);
  const itemsRef = useRef(items);
  const onChangeRef = useRef(onChange);
  const lockedRef = useRef<HTMLElement[]>([]);

  const dragRef = useRef<{
    from: number;
    startY: number;
    pitch: number;
    grabEl: HTMLElement;
    pointerId: number | null;
  } | null>(null);

  const overIndexRef = useRef(0);
  const [draggingFrom, setDraggingFrom] = useState<number | null>(null);

  const resetRowTransforms = useCallback(() => {
    rowRefs.current.forEach((row) => {
      if (!row) return;
      gsap.killTweensOf(row);
      gsap.set(row, { y: 0, scale: 1, zIndex: 1 });
    });
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

  const startDrag = useCallback(
    (index: number, clientY: number, el: HTMLElement, pointerId: number | null) => {
      if (dragRef.current) return;
      const rows = rowRefs.current.filter(Boolean) as HTMLElement[];
      const measuredPitch =
        rows.length >= 2
          ? rows[1].getBoundingClientRect().top - rows[0].getBoundingClientRect().top
          : el.getBoundingClientRect().height + 8;
      const pitch = measuredPitch > 1 ? measuredPitch : 56;

      if (pointerId != null) {
        try {
          el.setPointerCapture(pointerId);
        } catch {
          /* pointer already gone */
        }
      }

      lockedRef.current = lockOverflowAncestors(el);
      dragRef.current = { from: index, startY: clientY, pitch, grabEl: el, pointerId };
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

  const moveDrag = useCallback(
    (clientY: number) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dy = clientY - drag.startY;
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
    },
    [applySiblingShifts],
  );

  const finishDrag = useCallback(
    (commit: boolean) => {
      const drag = dragRef.current;
      if (!drag) return;
      const from = drag.from;
      const over = overIndexRef.current;
      if (drag.pointerId != null) {
        try {
          drag.grabEl.releasePointerCapture(drag.pointerId);
        } catch {
          /* already released */
        }
      }
      unlockOverflowAncestors(lockedRef.current);
      lockedRef.current = [];
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

  const startDragRef = useRef(startDrag);
  const moveDragRef = useRef(moveDrag);
  const finishDragRef = useRef(finishDrag);
  startDragRef.current = startDrag;
  moveDragRef.current = moveDrag;
  finishDragRef.current = finishDrag;

  useLayoutEffect(() => {
    itemsRef.current = items;
    onChangeRef.current = onChange;
    if (!dragRef.current) resetRowTransforms();
  }, [items, onChange, resetRowTransforms]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const row = (event.target as HTMLElement | null)?.closest("[data-order-row]") as HTMLElement | null;
      if (!row || !list.contains(row)) return;
      const index = Number(row.dataset.orderIndex);
      if (!Number.isFinite(index)) return;
      event.preventDefault();
      startDragRef.current(index, event.touches[0].clientY, row, null);
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!dragRef.current) return;
      event.preventDefault();
      const touch = event.touches[0];
      if (touch) moveDragRef.current(touch.clientY);
    };

    const onTouchEnd = () => {
      if (dragRef.current) finishDragRef.current(true);
    };

    const onTouchCancel = () => {
      const drag = dragRef.current;
      if (!drag) return;
      finishDragRef.current(overIndexRef.current !== drag.from);
    };

    list.addEventListener("touchstart", onTouchStart, { passive: false });
    list.addEventListener("touchmove", onTouchMove, { passive: false });
    list.addEventListener("touchend", onTouchEnd);
    list.addEventListener("touchcancel", onTouchCancel);
    return () => {
      list.removeEventListener("touchstart", onTouchStart);
      list.removeEventListener("touchmove", onTouchMove);
      list.removeEventListener("touchend", onTouchEnd);
      list.removeEventListener("touchcancel", onTouchCancel);
    };
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      moveDragRef.current(event.clientY);
    };

    const onUp = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (dragRef.current?.pointerId === event.pointerId) {
        finishDragRef.current(true);
      }
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  useEffect(() => {
    return () => {
      unlockOverflowAncestors(lockedRef.current);
      resetRowTransforms();
    };
  }, [resetRowTransforms]);

  const moveWithKeyboard = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= items.length) return;
    onChange(reorderItems(items, index, next));
  };

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label="Reihenfolge"
      aria-describedby="order-it-drag-hint"
      className={`relative space-y-2 ${styles.list}`}
    >
      <span
        className="pointer-events-none absolute bottom-7 left-[29px] top-7 w-0.5"
        style={{
          background: "var(--rp-nb-black)",
          borderRadius: "var(--rp-nb-radius-sm)",
        }}
        aria-hidden="true"
      />
      {items.map((entry, i) => {
        const isDragging = draggingFrom === i;
        const isFirst = i === 0;
        const isLast = i === items.length - 1;
        return (
          <div
            role="option"
            aria-selected={isDragging}
            key={entry.orig}
            ref={(node) => {
              rowRefs.current[i] = node;
            }}
            data-order-row
            data-order-index={i}
            tabIndex={0}
            aria-grabbed={isDragging}
            aria-label={`${i + 1}. ${entry.text}. Ziehen zum Verschieben.`}
            onPointerDown={(event) => {
              if (event.pointerType === "touch" || event.button !== 0) return;
              if (dragRef.current) return;
              startDrag(i, event.clientY, event.currentTarget, event.pointerId);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowUp") {
                event.preventDefault();
                moveWithKeyboard(i, -1);
              } else if (event.key === "ArrowDown") {
                event.preventDefault();
                moveWithKeyboard(i, 1);
              }
            }}
            onContextMenu={(event) => event.preventDefault()}
            className={`nb-card relative z-10 flex min-h-[58px] w-full items-center gap-2.5 px-3 py-2 text-left ${styles.row}`}
            style={{
              background: isDragging
                ? "var(--rp-nb-lilac)"
                : "var(--rp-nb-white)",
              borderRadius: "var(--rp-nb-radius)",
              border: isDragging
                ? "3px solid var(--rp-nb-purple-deep)"
                : "var(--rp-nb-border)",
              boxShadow: isDragging
                ? "var(--rp-nb-shadow-lg)"
                : "var(--rp-nb-shadow-sm)",
              cursor: isDragging ? "grabbing" : "grab",
              willChange: isDragging ? "transform" : undefined,
            }}
          >
            <span
              className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center text-sm font-black"
              style={{
                background: isFirst
                  ? "var(--rp-nb-peach)"
                  : isLast
                    ? "var(--rp-nb-purple-deep)"
                    : "var(--rp-nb-lilac)",
                color: isFirst || isLast ? "#fff" : "var(--rp-nb-black)",
                borderRadius: "var(--rp-nb-radius-sm)",
                border: "2px solid var(--rp-nb-black)",
              }}
            >
              {i + 1}
            </span>
            <span className="flex-1 text-[15px] font-bold leading-snug" style={{ color: "var(--rp-nb-black)" }}>
              {entry.text}
            </span>
            <DragHandle />
          </div>
        );
      })}
    </div>
  );
}
