"use client";

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { ACHIEVEMENTS, type AchievementId } from "@/lib/rp-assets";

/** Same line as the achievement toast kicker. */
export const ACHIEVEMENT_UNLOCKED_COPY = "Erfolg freigeschaltet!";

interface ToastItem {
  id: string;
  achievementId: AchievementId;
}

interface AchievementToastContextValue {
  enqueue: (achievementId: AchievementId) => void;
}

interface AchievementToastInternalState {
  current: ToastItem | null;
  visible: boolean;
  dismiss: () => void;
}

const AchievementToastContext =
  createContext<AchievementToastContextValue | null>(null);

const AchievementToastStateContext =
  createContext<AchievementToastInternalState | null>(null);

export function useAchievementToast(): AchievementToastContextValue {
  const ctx = useContext(AchievementToastContext);
  if (!ctx)
    throw new Error(
      "useAchievementToast must be used within AchievementToastProvider"
    );
  return ctx;
}

const DISPLAY_DURATION_MS = 4000;
const GAP_BETWEEN_MS = 300;

export function AchievementToastProvider({ children }: { children: ReactNode }) {
  const queueRef = useRef<ToastItem[]>([]);
  const [current, setCurrent] = useState<ToastItem | null>(null);
  const [visible, setVisible] = useState(false);
  const processingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (current !== null) return;
    if (queueRef.current.length === 0) {
      processingRef.current = false;
      return;
    }

    // Skip items with missing badge assets
    while (queueRef.current.length > 0) {
      const peek = queueRef.current[0];
      if (ACHIEVEMENTS[peek.achievementId]) break;
      queueRef.current.shift();
    }

    if (queueRef.current.length === 0) {
      processingRef.current = false;
      return;
    }

    processingRef.current = true;
    const next = queueRef.current.shift()!;
    setCurrent(next);
    setVisible(true);

    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      timeoutRef.current = setTimeout(() => {
        setCurrent(null);
        setTick((t) => t + 1);
      }, GAP_BETWEEN_MS);
    }, DISPLAY_DURATION_MS);
  }, [current, tick]);

  const enqueue = useCallback(
    (achievementId: AchievementId) => {
      const meta = ACHIEVEMENTS[achievementId];
      if (!meta) return;

      const item: ToastItem = {
        id: `${achievementId}-${Date.now()}`,
        achievementId,
      };
      queueRef.current.push(item);

      if (!processingRef.current) {
        setTick((t) => t + 1);
      }
    },
    []
  );

  const dismiss = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
    timeoutRef.current = setTimeout(() => {
      setCurrent(null);
      setTick((t) => t + 1);
    }, GAP_BETWEEN_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const state: AchievementToastInternalState = { current, visible, dismiss };

  return (
    <AchievementToastContext.Provider value={{ enqueue }}>
      <AchievementToastStateContext.Provider value={state}>
        {children}
      </AchievementToastStateContext.Provider>
    </AchievementToastContext.Provider>
  );
}

/**
 * Renders the active achievement toast. Mount this inside the PhoneShell's
 * .ps-screen container so the toast clips to the phone frame on desktop.
 */
export function AchievementToastSlot() {
  const state = useContext(AchievementToastStateContext);
  if (!state || !state.current) return null;

  const meta = ACHIEVEMENTS[state.current.achievementId];
  if (!meta) return null;

  return (
    <div
      className="achievement-toast-container"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        pointerEvents: "none",
        paddingTop: "max(env(safe-area-inset-top, 0px), var(--ps-notch-inset, 12px))",
        paddingLeft: 12,
        paddingRight: 12,
      }}
    >
      <div
        role="alert"
        aria-live="polite"
        className="achievement-toast-card"
        style={{
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "#FFFFFF",
          borderRadius: 20,
          padding: "12px 14px",
          boxShadow:
            "0 12px 40px rgba(42, 42, 74, 0.12), 0 4px 12px rgba(42, 42, 74, 0.06)",
          opacity: state.visible ? 1 : 0,
          transform: state.visible ? "translateY(0)" : "translateY(-24px)",
          transition: "opacity 280ms ease-out, transform 280ms ease-out",
        }}
        onClick={state.dismiss}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={meta.badge48}
          alt={meta.name_de}
          width={40}
          height={40}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            objectFit: "contain",
            flexShrink: 0,
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.3,
              color: "var(--rp-text)",
            }}
          >
            {ACHIEVEMENT_UNLOCKED_COPY}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 500,
              lineHeight: 1.3,
              color: "var(--rp-text-secondary)",
            }}
          >
            {meta.name_de}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            state.dismiss();
          }}
          aria-label="Schließen"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "var(--rp-text-secondary)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
