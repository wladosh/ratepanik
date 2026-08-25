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
import { isAchievementId, type AchievementId } from "@/lib/achievement-catalog";
import { AchievementUnlockOverlay } from "@/components/achievement-unlock-overlay";

/** Same line as the achievement unlock kicker. */
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

const DISPLAY_DURATION_MS = 5200;
const GAP_BETWEEN_MS = 360;

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

    while (queueRef.current.length > 0) {
      const peek = queueRef.current[0];
      if (isAchievementId(peek.achievementId)) break;
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

  const enqueue = useCallback((achievementId: AchievementId) => {
    if (!isAchievementId(achievementId)) return;

    const item: ToastItem = {
      id: `${achievementId}-${Date.now()}`,
      achievementId,
    };
    queueRef.current.push(item);

    if (!processingRef.current) {
      setTick((t) => t + 1);
    }
  }, []);

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
 * Renders the active achievement unlock celebration. Mount this inside the
 * PhoneShell's .ps-screen container so the overlay clips to the phone frame.
 */
export function AchievementToastSlot() {
  const state = useContext(AchievementToastStateContext);
  if (!state || !state.current) return null;

  return (
    <AchievementUnlockOverlay
      achievementId={state.current.achievementId}
      visible={state.visible}
      onDismiss={state.dismiss}
    />
  );
}
