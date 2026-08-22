"use client";

import { useAuth } from "@/lib/auth-context";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LandingScreen } from "@/components/landing-screen";
import { SetUsernameScreen } from "@/components/set-username-screen";
import { GameProvider } from "@/lib/game-context";
import { Game } from "@/components/game";
import { useProfile } from "@/lib/use-profile";

function HomeContent() {
  const { user, isAuthenticated, isGuest, loading, needsUsername, refetchProfile } = useAuth();
  const { claimUsername, checkUsername } = useProfile(user);
  const searchParams = useSearchParams();
  const joinCode = searchParams.get("join") ?? undefined;

  if (loading) {
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

  if (joinCode && isAuthenticated) {
    return (
      <GameProvider joinCode={joinCode}>
        <Game />
      </GameProvider>
    );
  }

  if (!isAuthenticated || (isGuest && !joinCode)) {
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
