"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { createBrowserSupabase } from "@/lib/supabase/client";

const INTERVAL_MS = 45_000;

export function usePresenceHeartbeat() {
  const { user, isGuest } = useAuth();
  const ticking = useRef(false);

  useEffect(() => {
    if (!user || isGuest) return;

    const supabase = createBrowserSupabase();
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function touch() {
      if (ticking.current) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      ticking.current = true;
      try {
        await supabase.rpc("touch_last_seen");
      } finally {
        ticking.current = false;
      }
    }

    void touch();
    intervalId = setInterval(() => void touch(), INTERVAL_MS);

    function onVisibility() {
      if (document.visibilityState === "visible") void touch();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user, isGuest]);
}
