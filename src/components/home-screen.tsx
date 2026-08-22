"use client";

import { useState } from "react";
import { useGameDispatch } from "@/lib/game-context";

export function HomeScreen() {
  const dispatch = useGameDispatch();
  const [hostName, setHostName] = useState("");
  const [showInput, setShowInput] = useState(false);

  function handleCreate() {
    if (!showInput) {
      setShowInput(true);
      return;
    }
    const name = hostName.trim();
    if (!name) return;
    dispatch({ type: "CREATE_ROOM", hostName: name });
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <div className="mb-4 text-6xl sm:text-7xl animate-bounce-slow">🎉</div>
      <h1 className="mb-2 text-5xl sm:text-7xl font-black text-white tracking-tight drop-shadow-lg">
        Ratepanik
      </h1>
      <p className="mb-10 text-lg sm:text-xl text-white/90 font-medium text-center max-w-md">
        Das Party-Quiz, bei dem jede Sekunde zählt!
      </p>

      <div className="w-full max-w-sm space-y-4">
        {showInput && (
          <div className="animate-fade-in">
            <label
              htmlFor="host-name"
              className="block mb-2 text-sm font-semibold text-white/90"
            >
              Dein Spielername
            </label>
            <input
              id="host-name"
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="z.B. QuizMaster 🎤"
              maxLength={20}
              autoFocus
              className="w-full rounded-2xl border-2 border-white/30 bg-white/20 px-5 py-4 text-lg text-white placeholder:text-white/50 backdrop-blur-sm focus:border-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
            />
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={showInput && !hostName.trim()}
          className="w-full rounded-2xl bg-white px-6 py-4 text-lg font-bold text-purple-700 shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
        >
          {showInput ? "Spiel erstellen 🚀" : "Neues Spiel starten"}
        </button>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/30" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-transparent px-4 text-sm text-white/70">
              Prototype v1
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
