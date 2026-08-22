"use client";

import { useAuth } from "@/lib/auth-context";
import { LandingScreen } from "@/components/landing-screen";
import { GameProvider } from "@/lib/game-context";
import { Game } from "@/components/game";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

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
    <GameProvider>
      <Game />
    </GameProvider>
  );
}
