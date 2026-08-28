import type { OrderItPayload, PickCorrectPayload } from "./content";

export function hashSeed(source: string): number {
  let hash = 2166136261;
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleInPlace<T>(items: T[], random: () => number = Math.random): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const current = items[i];
    const swap = items[j];
    if (current === undefined || swap === undefined) continue;
    items[i] = swap;
    items[j] = current;
  }
  return items;
}

export function shuffleCopy<T>(items: T[], random: () => number = Math.random): T[] {
  return shuffleInPlace([...items], random);
}

/**
 * Subset a pick_correct payload to `targetTotal` cards (half correct, half wrong).
 * Deterministic per seed so all clients in a room see the same dealt subset.
 * If the prompt has fewer cards than the target, returns what exists without crashing.
 */
export function subsetPickCorrectPayload(
  payload: PickCorrectPayload,
  targetTotal: number,
  seed: string,
): PickCorrectPayload {
  const correctSet = new Set(payload.correct_indices);
  const correctCards: number[] = [];
  const wrongCards: number[] = [];
  for (let i = 0; i < payload.cards.length; i++) {
    if (correctSet.has(i)) correctCards.push(i);
    else wrongCards.push(i);
  }

  const targetCorrect = Math.floor(targetTotal / 2);
  const targetWrong = targetTotal - targetCorrect;

  const rng = mulberry32(hashSeed(seed));
  const pickN = <T>(arr: T[], n: number): T[] => {
    const pool = [...arr];
    shuffleInPlace(pool, rng);
    return pool.slice(0, n);
  };

  const chosenCorrect = pickN(correctCards, Math.min(targetCorrect, correctCards.length));
  const chosenWrong = pickN(wrongCards, Math.min(targetWrong, wrongCards.length));
  const chosen = [...chosenCorrect, ...chosenWrong];

  const newCorrectSet = new Set(chosenCorrect);
  return {
    cards: chosen.map((i) => payload.cards[i]!),
    correct_indices: chosen
      .map((origIdx, newIdx) => (newCorrectSet.has(origIdx) ? newIdx : -1))
      .filter((i) => i >= 0),
  };
}

export function shufflePickCorrectPayload(
  payload: PickCorrectPayload,
  seed: string,
): PickCorrectPayload {
  const cards = payload.cards.map((text, orig) => ({ text, orig }));
  shuffleInPlace(cards, mulberry32(hashSeed(seed)));
  const correct = new Set(payload.correct_indices);
  return {
    cards: cards.map((card) => card.text),
    correct_indices: cards.flatMap((card, index) => (correct.has(card.orig) ? [index] : [])),
  };
}

export type ShuffledOrderItem = { orig: number; text: string };

export function shuffleOrderItItems(
  items: string[],
  correctOrder: number[],
  random: () => number = Math.random,
): ShuffledOrderItem[] {
  const entries: ShuffledOrderItem[] = items.map((text, orig) => ({ orig, text }));
  shuffleInPlace(entries, random);
  const alreadyCorrect =
    entries.length === correctOrder.length &&
    entries.every((entry, index) => entry.orig === correctOrder[index]);
  if (alreadyCorrect && entries.length > 1) {
    const first = entries[0];
    const second = entries[1];
    if (first && second) {
      entries[0] = second;
      entries[1] = first;
    }
  }
  return entries;
}

export function isPickCorrectPayload(payload: unknown): payload is PickCorrectPayload {
  return (
    !!payload &&
    typeof payload === "object" &&
    Array.isArray((payload as PickCorrectPayload).cards) &&
    Array.isArray((payload as PickCorrectPayload).correct_indices)
  );
}

export function isOrderItPayload(payload: unknown): payload is OrderItPayload {
  return (
    !!payload &&
    typeof payload === "object" &&
    Array.isArray((payload as OrderItPayload).items)
  );
}
