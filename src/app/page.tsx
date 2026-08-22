"use client";

import { useAuth } from "@/lib/auth-context";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LandingScreen } from "@/components/landing-screen";
import { SetUsernameScreen } from "@/components/set-username-screen";
import { GameProvider } from "@/lib/game-context";
import { Game } from "@/components/game";
import { useProfile } from "@/lib/use-profile";

function hasActiveGameSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!JSON.parse(sessionStorage.getItem("ratepanik-session") || "{}").roomId;
  } catch {
    return false;
  }
}

function HomeContent() {
  const { user, isAuthenticated, isGuest, loading, needsUsername, refetchProfile } = useAuth();
  const { claimUsername, checkUsername } = useProfile(user);
  const searchParams = useSearchParams();
  const joinCode = searchParams.get("join") ?? undefined;

  const activeGame = hasActiveGameSession();

  if (loading && !activeGame) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{ background: "var(--rp-bg-hero)" }}
      >
        <div className="text-lg text-[var(--rp-text-secondary)] animate-pulse font-medium">
          Laden...
        </div>
      </div>
    );
  }

  if (activeGame) {
    return (
      <GameProvider joinCode={joinCode}>
        <Game />
      </GameProvider>
    );
  }

  if (joinCode && isAuthenticated) {
    return (
      <GameProvider joinCode={joinCode}>
        <Game />
      </GameProvider>
    );
  }

  const guestWithSession = isGuest && !joinCode && hasActiveGameSession();

  if (!isAuthenticated || (isGuest && !joinCode && !guestWithSession)) {
    return <LandingScreen initialCode={joinCode} />;
  }

  if (needsUsername) {
    const defaultName =
      user?.user_metadata?.display_name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "";

    return (
      <SetUsernameScreen
        onClaimed={refetchProfile}
        claimUsername={claimUsername}
        checkUsername={checkUsername}
        defaultName={defaultName}
      />
    );
  }

  return (
    <GameProvider joinCode={joinCode}>
      <Game />
    </GameProvider>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div
          className="flex flex-1 items-center justify-center"
          style={{ background: "var(--rp-bg-hero)" }}
        >
          <div className="text-lg text-[var(--rp-text-secondary)] animate-pulse font-medium">
            Laden...
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
