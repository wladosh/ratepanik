"use client";

import { SchleimiPreview } from "@/components/schleimi-preview";
import { useGame } from "@/lib/game-context";
import { guestLayers } from "@/lib/schleimi-layers";
import { useUserLoadoutLayers } from "@/lib/use-room-loadouts";

export function PlayerSchleimi({
  playerId,
  size,
  label,
}: {
  playerId: string;
  size: number;
  label?: string;
}) {
  const game = useGame();
  return <SchleimiPreview layers={game.getPlayerLayers(playerId)} size={size} label={label} />;
}

export function UserSchleimi({
  userId,
  seed,
  size,
  label,
}: {
  userId: string | null;
  seed: string;
  size: number;
  label?: string;
}) {
  const layers = useUserLoadoutLayers(userId, seed);
  return <SchleimiPreview layers={layers} size={size} label={label} />;
}

export function DecorSchleimi({ seed, size }: { seed: string; size: number }) {
  return <SchleimiPreview layers={guestLayers(seed)} size={size} />;
}
