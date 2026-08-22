"use client";

import { useAuth } from "@/lib/auth-context";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LandingScreen } from "@/components/landing-screen";
import { SetUsernameScreen } from "@/components/set-username-screen";
import { GameProvider } from "@/lib/game-context";
import { Game } from "@/components/game";
import { PhoneShell } from "@/components/phone-shell";
import { useProfile } from "@/lib/use-profile";

function HomeContent() {
  const { user, isAuthenticated, isGuest, loading, needsUsername, refetchProfile } = useAuth();
  const { claimUsername, checkUsername } = useProfile(user);
  const searchParams = useSearchParams();
  const joinCode = searchParams.get("join") ?? undefined;

  if (loading) {
    return (
      <PhoneShell>
        <div
          className="flex flex-1 items-center justify-center"
          style={{ background: "var(--rp-bg-hero)" }}
        >
          <div className="text-lg text-[var(--rp-text-secondary)] animate-pulse font-medium">
            Laden...
          </div>
        </div>
      </PhoneShell>
    );
  }

  // Anonymous guests joining via ?join= go straight into the game
  if (joinCode && isAuthenticated) {
    return (
      <PhoneShell>
        <GameProvider joinCode={joinCode}>
          <Game />
        </GameProvider>
      </PhoneShell>
    );
  }

  if (!isAuthenticated || (isGuest && !joinCode)) {
    return (
      <PhoneShell>
        <LandingScreen />
      </PhoneShell>
    );
  }

  // Show username setup for authenticated non-guest users without a profile
  if (needsUsername) {
    const defaultName =
      user?.user_metadata?.display_name ||
      user?.user_metadata?.full_name ||
      "";

    return (
      <PhoneShell>
        <SetUsernameScreen
          onClaimed={refetchProfile}
          claimUsername={claimUsername}
          checkUsername={checkUsername}
          defaultName={defaultName}
        />
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <GameProvider joinCode={joinCode}>
        <Game />
      </GameProvider>
    </PhoneShell>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <PhoneShell>
          <div
            className="flex flex-1 items-center justify-center"
            style={{ background: "var(--rp-bg-hero)" }}
          >
            <div className="text-lg text-[var(--rp-text-secondary)] animate-pulse font-medium">
              Laden...
            </div>
          </div>
        </PhoneShell>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
