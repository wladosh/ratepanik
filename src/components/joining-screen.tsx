"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useI18n, LoadingPulse } from "@/lib/i18n-context";
import { clearMatchSession, readMatchSession } from "@/lib/guest-flow";
import { DecorSchleimi } from "@/components/player-schleimi";
import styles from "./joining-screen.module.css";

export function JoiningScreen({
  error,
  onRetry,
  seed = "join-gate",
}: {
  error?: string | null;
  onRetry?: () => void;
  seed?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <div className={styles.root}>
      <div className={styles.glow} aria-hidden />
      <div className={styles.mascot}>
        <DecorSchleimi seed={seed} size={120} />
      </div>
      <p className={styles.kicker}>{t.joining.kicker}</p>
      <h1 className={styles.title}>{error ? t.joining.failedTitle : t.joining.title}</h1>
      <p className={styles.body}>{error ?? t.joining.body}</p>
      {error ? (
        <div className={styles.actions}>
          {onRetry ? (
            <button type="button" className={styles.primary} onClick={onRetry}>
              {t.joining.retry}
            </button>
          ) : null}
          <button
            type="button"
            className={styles.secondary}
            onClick={() => {
              void createBrowserSupabase()
                .auth.signOut()
                .finally(() => router.replace("/auth/login"));
            }}
          >
            {t.joining.toLogin}
          </button>
        </div>
      ) : (
        <p className={styles.pulse}>{t.joining.pulse}</p>
      )}
    </div>
  );
}

/** Signs an unauthenticated visitor in anonymously, then mounts the match. */
export function JoinSessionGate({
  joinCode,
  children,
}: {
  joinCode: string;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const { loading, isAuthenticated } = useAuth();
  const startedRef = useRef(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || isAuthenticated || startedRef.current) return;
    startedRef.current = true;
    void createBrowserSupabase()
      .auth.signInAnonymously()
      .then(({ error }) => {
        if (error) {
          startedRef.current = false;
          setAuthError(t.landing.connectionError);
        }
      });
  }, [loading, isAuthenticated, t.landing.connectionError]);

  if (!isAuthenticated) {
    return (
      <JoiningScreen
        seed={joinCode}
        error={authError}
        onRetry={
          authError
            ? () => {
                setAuthError(null);
                startedRef.current = false;
              }
            : undefined
        }
      />
    );
  }

  return children;
}

export function GuestExitToLogin() {
  const { signOut } = useAuth();
  const router = useRouter();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const session = readMatchSession();
    void (async () => {
      if (session?.roomId) {
        try {
          await createBrowserSupabase().rpc("leave_match", { p_room_id: session.roomId });
        } catch {
          // Still leave the app even if the room cleanup fails.
        }
        clearMatchSession();
      }
      router.replace("/auth/login");
      await signOut();
    })();
  }, [signOut, router]);

  return <LoadingPulse />;
}
