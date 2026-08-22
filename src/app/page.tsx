"use client";

import { useAuth } from "@/lib/auth-context";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LandingScreen } from "@/components/landing-screen";
import { GameProvider } from "@/lib/game-context";
import { Game } from "@/components/game";

function HomeContent() {
  const { isAuthenticated, loading } = useAuth();
  const searchParams = useSearchParams();
  const joinCode = searchParams.get("join") ?? undefined;

  if (loading) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center"
        style={{ background: "var(--rp-bg-hero)" }}
      >
        <div className="text-lg text-[var(--rp-text-secondary)] animate-pulse font-medium">
          Laden...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingScreen />;
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
          className="flex min-h-dvh items-center justify-center"
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
