"use client";

import { useState } from "react";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

type Mode = "idle" | "create" | "join";

export function HomeScreen() {
  const game = useGame();
  const { user, isAuthenticated, canHost, isGuest, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const displayName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "";

  function handleStartCreate() {
    if (!canHost) {
      router.push("/auth/login");
      return;
    }
    setMode("create");
    setName(displayName);
  }

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await game.createRoom(trimmed);
  }

  function handleStartJoin() {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    setMode("join");
    setName(displayName);
  }

  async function handleJoin() {
    const trimmedName = name.trim();
    const trimmedCode = roomCode.trim();
    if (!trimmedName || !trimmedCode) return;
    await game.joinRoom(trimmedCode, trimmedName);
  }

  if (authLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
        <div className="text-2xl text-white/80 animate-pulse">Laden...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 px-4 py-8">
      <div className="mb-4 text-6xl sm:text-7xl animate-bounce-slow">🎉</div>
      <h1 className="mb-2 text-5xl sm:text-7xl font-black text-white tracking-tight drop-shadow-lg">
        Ratepanik
      </h1>
      <p className="mb-6 text-lg sm:text-xl text-white/90 font-medium text-center max-w-md">
        Das Party-Quiz, bei dem jede Sekunde zählt!
      </p>

      {isAuthenticated && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-sm px-4 py-2 border border-white/20">
          <span className="text-sm text-white/80">
            {isGuest ? "👻 Gast" : `👤 ${displayName}`}
          </span>
          <button
            onClick={signOut}
            className="text-xs text-white/60 underline hover:text-white/90 transition-colors"
          >
            Abmelden
          </button>
        </div>
      )}

      <div className="w-full max-w-sm space-y-4">
        {mode === "create" && (
          <div className="space-y-3 animate-fade-in">
            <label
              htmlFor="host-name"
              className="block text-sm font-semibold text-white/90"
            >
              Dein Spielername
            </label>
            <input
              id="host-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="z.B. QuizMaster 🎤"
              maxLength={20}
              autoFocus
              className="w-full rounded-2xl border-2 border-white/30 bg-white/20 px-5 py-4 text-lg text-white placeholder:text-white/50 backdrop-blur-sm focus:border-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
            />
            <button
              onClick={handleCreate}
              disabled={!name.trim() || game.loading}
              className="w-full rounded-2xl bg-white px-6 py-4 text-lg font-bold text-purple-700 shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              {game.loading ? "Erstelle Raum..." : "Spiel erstellen 🚀"}
            </button>
            <button
              onClick={() => { setMode("idle"); setName(""); }}
              className="w-full text-sm text-white/70 hover:text-white transition-colors"
            >
              ← Zurück
            </button>
          </div>
        )}

        {mode === "join" && (
          <div className="space-y-3 animate-fade-in">
            <label
              htmlFor="room-code"
              className="block text-sm font-semibold text-white/90"
            >
              Raumcode eingeben
            </label>
            <input
              id="room-code"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="z.B. ABC123"
              maxLength={6}
              autoFocus
              className="w-full rounded-2xl border-2 border-white/30 bg-white/20 px-5 py-4 text-center text-2xl font-black tracking-[0.3em] text-white placeholder:text-white/50 placeholder:text-lg placeholder:font-normal placeholder:tracking-normal backdrop-blur-sm focus:border-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
            />
            <label
              htmlFor="join-name"
              className="block text-sm font-semibold text-white/90"
            >
              Dein Spielername
            </label>
            <input
              id="join-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="z.B. RätselRitter 🛡️"
              maxLength={20}
              className="w-full rounded-2xl border-2 border-white/30 bg-white/20 px-5 py-4 text-lg text-white placeholder:text-white/50 backdrop-blur-sm focus:border-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
            />
            <button
              onClick={handleJoin}
              disabled={!name.trim() || roomCode.trim().length < 4 || game.loading}
              className="w-full rounded-2xl bg-white px-6 py-4 text-lg font-bold text-purple-700 shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              {game.loading ? "Trete bei..." : "Beitreten 🎯"}
            </button>
            <button
              onClick={() => { setMode("idle"); setName(""); setRoomCode(""); }}
              className="w-full text-sm text-white/70 hover:text-white transition-colors"
            >
              ← Zurück
            </button>
          </div>
        )}

        {mode === "idle" && (
          <div className="space-y-4 animate-fade-in">
            <button
              onClick={handleStartCreate}
              className="w-full rounded-2xl bg-white px-6 py-4 text-lg font-bold text-purple-700 shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]"
            >
              Neues Spiel starten
            </button>

            {!canHost && isAuthenticated && (
              <p className="text-center text-xs text-white/60">
                Nur registrierte Nutzer können Spiele hosten.{" "}
                <button
                  onClick={() => router.push("/auth/signup")}
                  className="underline hover:text-white/90"
                >
                  Konto erstellen
                </button>
              </p>
            )}

            <button
              onClick={handleStartJoin}
              className="w-full rounded-2xl border-2 border-white/30 bg-white/10 px-6 py-4 text-lg font-bold text-white shadow-xl backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Raum beitreten
            </button>
          </div>
        )}

        {!isAuthenticated && mode === "idle" && (
          <div className="pt-2 text-center">
            <button
              onClick={() => router.push("/auth/login")}
              className="text-sm text-white/80 underline hover:text-white transition-colors"
            >
              Anmelden / Registrieren
            </button>
          </div>
        )}

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/30" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-transparent px-4 text-sm text-white/70">
              Phase A
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
