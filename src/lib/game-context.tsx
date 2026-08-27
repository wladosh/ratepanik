"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n-context";
import { interpolate } from "@/lib/i18n";
import { joinBlockedCopy } from "@/lib/match-ui";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type {
  DbRoom,
  DbPlayer,
  DbAnswer,
  DbMatchBlock,
  DbPickCorrectTurn,
} from "./supabase";
import {
  fetchRandomThemeOptionsForMode,
  fetchPromptsForBlock,
  emptyPromptPoolReason,
  allowedThemeIds,
  prepareBlockTheme,
  type Theme,
  type Prompt,
  type FindLiePayload,
  type OrderItPayload,
} from "./content";
import {
  generateBlockModes,
  calculatePickCorrectPoints,
  calculateFindLiePoints,
  calculateOrderItPoints,
  numberGuessCorrectFromPayload,
  scoreNumberGuessAnswers,
  ORDER_IT_TIMER_MS,
} from "./game-store";
import {
  parseRoomSettings,
  clampRoomSettings,
  DEFAULT_ROOM_SETTINGS,
  roundsForMode,
  timerSecondsForBlock,
  questionTimerMsFromBlock,
  startBlockedReason,
  type RoomSettings,
} from "./room-settings";
import { useAuth } from "./auth-context";
import { useAchievementGrant } from "./use-achievement-grant";
import { generateGuestName } from "./guest-name";
import { displayNameForJoin, resolveGuestExitPath, shouldSkipSessionRestore } from "./guest-flow";
import { useRoomLoadouts } from "./use-room-loadouts";
import {
  isVsIntroActive,
  readVsIntroUntil,
  stampVsIntroUntil,
  type SchleimiLayerMap,
} from "./schleimi-layers";
import { isLiveQuestionPhase, roundReadyToReveal, shouldStampQuestionClock } from "./question-clock";
import { isPickCorrectPayload, subsetPickCorrectPayload, shufflePickCorrectPayload } from "./shuffle";

export type GamePhase =
  | "home"
  | "lobby"
  | "vs_intro"
  | "theme_pick"
  | "playing_loading"
  | "number_guess"
  | "number_guess_waiting"
  | "number_guess_reveal"
  | "find_lie"
  | "find_lie_waiting"
  | "find_lie_reveal"
  | "order_it"
  | "order_it_waiting"
  | "order_it_reveal"
  | "pick_correct"
  | "block_scoreboard"
  | "final";

interface GameContextValue {
  phase: GamePhase;
  room: DbRoom | null;
  players: DbPlayer[];
  myPlayerId: string | null;
  isHost: boolean;
  error: string | null;
  notice: string | null;
  loading: boolean;
  restoring: boolean;
  disconnected: boolean;
  getPlayerLayers: (playerId: string) => SchleimiLayerMap;

  // Block state
  blocks: DbMatchBlock[];
  currentBlock: DbMatchBlock | null;
  currentPrompt: Prompt | null;
  prompts: Prompt[];
  themeOptions: Theme[];

  // number_guess state
  roundAnswers: DbAnswer[];
  allBlockAnswers: DbAnswer[];

  // pick_correct state
  turns: DbPickCorrectTurn[];
  activePlayerIndex: number;
  isMyTurn: boolean;

  // theme picker
  themePickerPlayerId: string | null;
  isThemePicker: boolean;

  // Question timer — shared deadline derived from server timestamp
  questionDeadlineMs: number | null;
  hostActionLock: boolean;
  questionTimerMs: number | null;
  roomSettings: RoomSettings;
  updateRoomSettings: (patch: Partial<RoomSettings>) => Promise<void>;

  // Actions
  createRoom: (hostName: string, hostUserId: string) => Promise<string | null>;
  joinRoom: (code: string, displayName: string) => Promise<string | null>;
  leaveRoom: (options?: { next?: string }) => Promise<void>;
  startGame: () => Promise<void>;
  selectTheme: (themeId: string) => Promise<void>;
  submitNumberGuess: (guess: number) => Promise<void>;
  submitFindLie: (lieIndex: number) => Promise<void>;
  submitOrderIt: (order: number[]) => Promise<void>;
  tapCard: (cardIndex: number) => Promise<void>;
  advanceFromReveal: () => Promise<void>;
  advanceFromBlockScore: () => Promise<void>;
  resetGame: () => Promise<void>;
  goHome: () => void;
  updateDisplayName: (newName: string) => Promise<string | null>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

type BrowserSupabase = ReturnType<typeof createBrowserSupabase>;

async function awardPickCorrectAndAdvance(
  supabase: BrowserSupabase,
  roomId: string,
  block: DbMatchBlock,
  players: DbPlayer[],
  roundTurns: DbPickCorrectTurn[],
  totalCorrect: number = 4,
) {
  const playerCorrects = new Map<string, number>();
  for (const turn of roundTurns) {
    if (!turn.is_correct) continue;
    playerCorrects.set(turn.player_id, (playerCorrects.get(turn.player_id) ?? 0) + 1);
  }

  for (const player of players) {
    const pts = calculatePickCorrectPoints(playerCorrects.get(player.id) ?? 0, totalCorrect);
    const { data: existing } = await supabase
      .from("match_scores")
      .select("total_points")
      .eq("room_id", roomId)
      .eq("player_id", player.id)
      .eq("block_index", block.block_index)
      .maybeSingle();

    await supabase.from("match_scores").upsert(
      {
        room_id: roomId,
        player_id: player.id,
        block_index: block.block_index,
        total_points: (existing?.total_points ?? 0) + pts,
      },
      { onConflict: "room_id,player_id,block_index" },
    );

    const { data: latest } = await supabase
      .from("players")
      .select("score")
      .eq("id", player.id)
      .single();
    await supabase
      .from("players")
      .update({ score: (latest?.score ?? player.score) + pts })
      .eq("id", player.id);
  }

  const nextRound = block.current_round + 1;
  if (nextRound < block.rounds_total) {
    await supabase
      .from("match_blocks")
      .update({ current_round: nextRound, started_at: null })
      .eq("id", block.id)
      .eq("is_complete", false);
    return;
  }

  await supabase
    .from("match_blocks")
    .update({
      is_complete: true,
      finished_at: new Date().toISOString(),
    })
    .eq("id", block.id)
    .eq("is_complete", false);
}

export function GameProvider({ children, joinCode }: { children: ReactNode; joinCode?: string }) {
  const { user, isGuest, signOut } = useAuth();
  const { t } = useI18n();
  const tRef = useRef(t);
  tRef.current = t;
  const { tryUnlock } = useAchievementGrant();
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [room, setRoom] = useState<DbRoom | null>(null);
  const [players, setPlayers] = useState<DbPlayer[]>([]);
  const [blocks, setBlocks] = useState<DbMatchBlock[]>([]);
  const [allAnswers, setAllAnswers] = useState<DbAnswer[]>([]);
  const [turns, setTurns] = useState<DbPickCorrectTurn[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [themeOptions, setThemeOptions] = useState<Theme[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(() => {
    if (typeof window === "undefined") return false;
    if (shouldSkipSessionRestore(joinCode)) return false;
    try {
      return !!JSON.parse(sessionStorage.getItem("ratepanik-session") || "{}").roomId;
    } catch {
      return false;
    }
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastStateKeyRef = useRef("");
  const pickCompleteRef = useRef<string | null>(null);
  const subscribeRef = useRef<((roomId: string) => void) | null>(null);
  const sessionRestoringRef = useRef(false);
  const joinCodeUsedRef = useRef(false);
  const autoStartAttemptRef = useRef<string | null>(null);
  const startGameRef = useRef<() => Promise<void>>(async () => {});
  const [disconnected, setDisconnected] = useState(false);
  const myPlayerIdRef = useRef<string | null>(null);
  const [revealHoldActive, setRevealHoldActive] = useState(false);
  const [roundTimedOut, setRoundTimedOut] = useState(false);
  const [hostActionLock, setHostActionLock] = useState(false);
  const hostActionLockRef = useRef(false);
  const startGameLockRef = useRef(false);
  const currentBlockRef = useRef<DbMatchBlock | null>(null);
  const phaseRef = useRef<GamePhase>("home");
  const currentPromptRef = useRef<Prompt | null>(null);
  const isHostRef = useRef(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const { getPlayerLayers } = useRoomLoadouts(players);

  // --- derived state ---

  const currentBlock = useMemo(() => {
    if (!room) return null;
    return blocks.find((b) => b.block_index === room.current_block_index) ?? null;
  }, [room, blocks]);

  const currentPrompt = useMemo(() => {
    if (!currentBlock || !prompts.length) return null;
    const raw = prompts[currentBlock.current_round] ?? null;
    if (!raw || raw.mode !== currentBlock.mode) return null;
    if (currentBlock.mode === "pick_correct") {
      if (!isPickCorrectPayload(raw.payload)) return null;
      const seedBase = `${currentBlock.id}:${currentBlock.current_round}:${raw.id}`;
      const targetTotal = Math.min(players.length * 2, raw.payload.cards.length);
      const subset = targetTotal < raw.payload.cards.length
        ? subsetPickCorrectPayload(raw.payload, targetTotal, `subset:${seedBase}`)
        : raw.payload;
      return {
        ...raw,
        payload: shufflePickCorrectPayload(subset, seedBase),
      };
    }
    return raw;
  }, [currentBlock, prompts, players.length]);

  const roundAnswers = useMemo(() => {
    if (!currentBlock) return [];
    return allAnswers.filter(
      (a) =>
        a.block_index === currentBlock.block_index &&
        a.round_index === currentBlock.current_round
    );
  }, [allAnswers, currentBlock]);

  const allBlockAnswers = useMemo(() => {
    if (!currentBlock) return [];
    return allAnswers.filter((a) => a.block_index === currentBlock.block_index);
  }, [allAnswers, currentBlock]);

  const blockTurns = useMemo(() => {
    if (!currentBlock) return [];
    const round = currentBlock.current_round ?? 0;
    return turns
      .filter(
        (t) =>
          t.block_index === currentBlock.block_index &&
          (t.round_index ?? 0) === round,
      )
      .sort((a, b) => a.turn_order - b.turn_order);
  }, [turns, currentBlock]);

  const correctTurnsCount = useMemo(
    () => blockTurns.filter((t) => t.is_correct).length,
    [blockTurns]
  );

  const correctTarget = useMemo(() => {
    if (!currentPrompt || currentBlock?.mode !== "pick_correct") return 4;
    if (!isPickCorrectPayload(currentPrompt.payload)) return 4;
    return currentPrompt.payload.correct_indices.length;
  }, [currentPrompt, currentBlock?.mode]);

  const sortedPlayers = useMemo(
    () =>
      [...players].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    [players]
  );

  const activePlayerIndex = useMemo(() => {
    if (!currentBlock || currentBlock.mode !== "pick_correct" || !sortedPlayers.length) return 0;
    return blockTurns.length % sortedPlayers.length;
  }, [currentBlock, blockTurns.length, sortedPlayers.length]);

  const isMyTurn = useMemo(() => {
    if (!myPlayerId || !sortedPlayers.length) return false;
    if (currentBlock?.mode === "pick_correct") return true;
    return sortedPlayers[activePlayerIndex]?.id === myPlayerId;
  }, [myPlayerId, sortedPlayers, activePlayerIndex, currentBlock?.mode]);

  const themePickerPlayerId = useMemo(() => {
    if (!room || !sortedPlayers.length) return null;
    return sortedPlayers[room.current_block_index % sortedPlayers.length]?.id ?? null;
  }, [room, sortedPlayers]);

  const isThemePicker = themePickerPlayerId === myPlayerId;

  const myPlayer = players.find((p) => p.id === myPlayerId);
  const isHost = myPlayer?.is_host ?? false;
  const roomSettings = useMemo(
    () => parseRoomSettings(room?.settings),
    [room?.settings],
  );

  const phase: GamePhase = useMemo(() => {
    if (!room) {
      if (restoring || Boolean(joinCode)) return "playing_loading";
      return "home";
    }
    if (room.status === "lobby") return "lobby";
    if (room.status === "finished") return "final";

    if (isVsIntroActive(nowMs, readVsIntroUntil(room.settings))) return "vs_intro";

    if (room.theme_vote_active) return "theme_pick";

    if (!currentBlock) return "playing_loading";

    if (currentBlock.is_complete && !(revealHoldActive && currentBlock.mode === "pick_correct")) {
      return "block_scoreboard";
    }

    if (currentBlock.mode === "number_guess") {
      const roundOver = roundReadyToReveal({
        timedOut: roundTimedOut,
        answeredCount: roundAnswers.length,
        playerCount: players.length,
        startedAt: currentBlock.started_at,
        nowMs,
        timerMs: questionTimerMsFromBlock(currentBlock.timer_seconds),
      });
      if (roundOver) {
        return "number_guess_reveal";
      }
      const myAnswer = roundAnswers.find((a) => a.player_id === myPlayerId);
      if (myAnswer) return "number_guess_waiting";
      return "number_guess";
    }

    if (currentBlock.mode === "find_lie") {
      const roundOver = roundReadyToReveal({
        timedOut: roundTimedOut,
        answeredCount: roundAnswers.length,
        playerCount: players.length,
        startedAt: currentBlock.started_at,
        nowMs,
        timerMs: questionTimerMsFromBlock(currentBlock.timer_seconds),
      });
      if (roundOver) {
        return "find_lie_reveal";
      }
      const myAnswer = roundAnswers.find((a) => a.player_id === myPlayerId);
      if (myAnswer) return "find_lie_waiting";
      return "find_lie";
    }

    if (currentBlock.mode === "order_it") {
      const roundOver = roundReadyToReveal({
        timedOut: roundTimedOut,
        answeredCount: roundAnswers.length,
        playerCount: players.length,
        startedAt: currentBlock.started_at,
        nowMs,
        timerMs: questionTimerMsFromBlock(currentBlock.timer_seconds),
      });
      if (roundOver) {
        return "order_it_reveal";
      }
      const myAnswer = roundAnswers.find((a) => a.player_id === myPlayerId);
      if (myAnswer) return "order_it_waiting";
      return "order_it";
    }

    if (currentBlock.mode === "pick_correct") {
      return "pick_correct";
    }

    return "playing_loading";
  }, [room, currentBlock, roundAnswers, players.length, myPlayerId, restoring, revealHoldActive, roundTimedOut, nowMs, joinCode]);

  currentBlockRef.current = currentBlock;
  phaseRef.current = phase;
  currentPromptRef.current = currentPrompt;
  isHostRef.current = isHost;

  // Canonical shared deadline — every client computes the same value from the
  // same DB-synced started_at timestamp.  No independent local clocks.
  const questionTimerMs = useMemo(
    () => questionTimerMsFromBlock(currentBlock?.timer_seconds),
    [currentBlock?.timer_seconds],
  );

  const questionDeadlineMs = useMemo(() => {
    if (!currentBlock?.started_at || questionTimerMs == null) return null;
    if (!isLiveQuestionPhase(phase)) return null;
    return new Date(currentBlock.started_at).getTime() + questionTimerMs;
  }, [currentBlock, phase, questionTimerMs]);

  useEffect(() => {
    if (room?.status !== "playing") return;
    const until = readVsIntroUntil(room.settings);
    if (until == null || Date.now() >= until) return;
    const id = window.setInterval(() => {
      const next = Date.now();
      setNowMs(next);
      if (next >= until) window.clearInterval(id);
    }, 100);
    return () => window.clearInterval(id);
  }, [room?.status, room?.settings]);

  useEffect(() => {
    if (room?.status !== "playing") return;
    const waiting =
      phase === "number_guess_waiting" ||
      phase === "find_lie_waiting" ||
      phase === "order_it_waiting";
    const allIn = players.length > 0 && roundAnswers.length >= players.length;
    if (!waiting || !allIn || roundTimedOut) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [
    room?.status,
    phase,
    players.length,
    roundAnswers.length,
    roundTimedOut,
  ]);

  useEffect(() => { myPlayerIdRef.current = myPlayerId; }, [myPlayerId]);

  // Toast errors during a live match expire. Join/create failures stay until retry.
  useEffect(() => {
    if (!error || !room) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error, room]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  // --- realtime subscription ---

  const subscribeToRoom = useCallback((roomId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            setRoom(payload.new as DbRoom);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPlayers((prev) => {
              if (prev.some((p) => p.id === (payload.new as DbPlayer).id)) return prev;
              return [...prev, payload.new as DbPlayer];
            });
          } else if (payload.eventType === "UPDATE") {
            setPlayers((prev) =>
              prev.map((p) =>
                p.id === (payload.new as DbPlayer).id ? (payload.new as DbPlayer) : p
              )
            );
          } else if (payload.eventType === "DELETE") {
            const leftPlayerId = (payload.old as { id: string }).id;
            setPlayers((prev) => {
              if (leftPlayerId !== myPlayerIdRef.current) {
                const leftPlayer = prev.find((p) => p.id === leftPlayerId);
                if (leftPlayer) {
                  queueMicrotask(() =>
                    setNotice(
                      interpolate(tRef.current.game.playerLeft, {
                        name: leftPlayer.display_name,
                      }),
                    )
                  );
                }
              }
              return prev.filter((p) => p.id !== leftPlayerId);
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_blocks", filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setBlocks((prev) => {
              const nb = payload.new as DbMatchBlock;
              if (prev.some((b) => b.id === nb.id)) return prev;
              return [...prev, nb];
            });
          } else if (payload.eventType === "UPDATE") {
            setBlocks((prev) =>
              prev.map((b) =>
                b.id === (payload.new as DbMatchBlock).id ? (payload.new as DbMatchBlock) : b
              )
            );
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "answers", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setAllAnswers((prev) => {
            const na = payload.new as DbAnswer;
            if (prev.some((a) => a.id === na.id)) return prev;
            return [...prev, na];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "answers", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setAllAnswers((prev) =>
            prev.map((a) =>
              a.id === (payload.new as DbAnswer).id ? (payload.new as DbAnswer) : a
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pick_correct_turns", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setTurns((prev) => {
            const nt = payload.new as DbPickCorrectTurn;
            if (prev.some((t) => t.id === nt.id)) return prev;
            return [...prev, nt];
          });
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          setDisconnected(false);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setDisconnected(true);
          console.warn("Realtime subscription issue:", status, err);
          setTimeout(() => {
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current);
            }
            subscribeRef.current?.(roomId);
            void (async () => {
              const [
                { data: roomData },
                { data: playersData },
                { data: answersData },
                { data: blocksData },
                { data: turnsData },
              ] = await Promise.all([
                supabase.from("rooms").select().eq("id", roomId).single(),
                supabase.from("players").select().eq("room_id", roomId),
                supabase.from("answers").select().eq("room_id", roomId),
                supabase.from("match_blocks").select().eq("room_id", roomId),
                supabase.from("pick_correct_turns").select().eq("room_id", roomId),
              ]);
              if (roomData) setRoom(roomData);
              if (playersData) setPlayers(playersData);
              if (answersData) setAllAnswers(answersData);
              if (blocksData) setBlocks(blocksData);
              if (turnsData) setTurns(turnsData);
            })();
          }, 2000);
        }
      });

    channelRef.current = channel;
  }, [supabase]);

  useEffect(() => {
    subscribeRef.current = subscribeToRoom;
  }, [subscribeToRoom]);

  // --- load prompts when block theme is selected ---

  useEffect(() => {
    if (!currentBlock?.theme_id || !currentBlock.prompt_ids?.length) return;
    let cancelled = false;
    const promptIds = currentBlock.prompt_ids;

    (async () => {
      const { data } = await supabase
        .from("prompts")
        .select("id, theme_id, mode, difficulty, prompt, payload")
        .in("id", promptIds);

      if (cancelled || !data) return;

      const ordered = promptIds
        .map((pid) => data.find((p) => p.id === pid))
        .filter((p): p is Prompt => p !== undefined);

      setPrompts(ordered);
    })();

    return () => { cancelled = true; };
  }, [currentBlock?.theme_id, currentBlock?.prompt_ids?.join(","), supabase]);

  // --- load theme options when theme_vote_active ---

  useEffect(() => {
    if (!room?.theme_vote_active || !currentBlock?.theme_options?.length) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("themes")
        .select("id, slug, name_de")
        .in("id", currentBlock.theme_options!);

      if (cancelled || !data) return;
      setThemeOptions(data as Theme[]);
    })();

    return () => { cancelled = true; };
  }, [room?.theme_vote_active, currentBlock?.theme_options, supabase]);

  // --- reset local sub-state when block advances ---

  useEffect(() => {
    if (!room || room.status !== "playing") return;
    const key = String(room.current_block_index);
    if (key !== lastStateKeyRef.current) {
      lastStateKeyRef.current = key;
      setPrompts([]);
      setThemeOptions([]);
      setRevealHoldActive(false);
    }
  }, [room?.status, room?.current_block_index]);

  // Keep the last-correct highlight visible, then let the host complete the hunt.
  useEffect(() => {
    const huntDone =
      !!currentBlock &&
      currentBlock.mode === "pick_correct" &&
      !currentBlock.is_complete &&
      correctTarget > 0 &&
      correctTurnsCount >= correctTarget;

    if (!huntDone) {
      setRevealHoldActive(false);
      return;
    }

    setRevealHoldActive(true);
    const timer = window.setTimeout(() => {
      setRevealHoldActive(false);
    }, roomSettings.revealHoldMs);

    return () => window.clearTimeout(timer);
  }, [
    correctTurnsCount,
    correctTarget,
    currentBlock?.id,
    currentBlock?.current_round,
    currentBlock?.mode,
    currentBlock?.is_complete,
    roomSettings.revealHoldMs,
  ]);

  // Handle pick_correct auto-complete: after the hold, score the hunt and continue.
  useEffect(() => {
    if (!isHost || !room || !currentBlock || currentBlock.mode !== "pick_correct") return;
    if (currentBlock.is_complete) return;
    if (correctTarget <= 0 || correctTurnsCount < correctTarget) return;
    if (revealHoldActive) return;
    const completeKey = `pc:${currentBlock.id}:${currentBlock.current_round}`;
    if (pickCompleteRef.current === completeKey) return;
    pickCompleteRef.current = completeKey;

    void awardPickCorrectAndAdvance(
      supabase,
      room.id,
      currentBlock,
      players,
      blockTurns,
      correctTarget,
    );
  }, [isHost, currentBlock, correctTurnsCount, correctTarget, blockTurns, players, room, revealHoldActive, supabase]);

  const scoreSimultaneousQuizRound = async (
    block: DbMatchBlock,
    currentPlayers: DbPlayer[],
    currentAnswers: DbAnswer[],
    promptForRound: Prompt | undefined,
  ) => {
    const ptsByPlayer = new Map<string, number>();

    if (block.mode === "find_lie") {
      const lieIndex = (promptForRound?.payload as FindLiePayload | undefined)?.lie_index;
      for (const a of currentAnswers) {
        const choice = a.numeric_answer;
        const pts =
          lieIndex === undefined || choice == null
            ? 0
            : calculateFindLiePoints(Number(choice), lieIndex);
        ptsByPlayer.set(a.player_id, (ptsByPlayer.get(a.player_id) ?? 0) + pts);
        await supabase
          .from("answers")
          .update({ points_awarded: pts, is_correct: pts > 0 })
          .eq("id", a.id);
      }
    } else if (block.mode === "order_it") {
      const correctOrder =
        (promptForRound?.payload as OrderItPayload | undefined)?.correct_order ?? [];
      for (const a of currentAnswers) {
        const order = Array.isArray(a.payload_answer)
          ? (a.payload_answer as number[])
          : [];
        const pts = calculateOrderItPoints(order, correctOrder);
        ptsByPlayer.set(a.player_id, (ptsByPlayer.get(a.player_id) ?? 0) + pts);
        await supabase
          .from("answers")
          .update({ points_awarded: pts })
          .eq("id", a.id);
      }
    }

    for (const player of currentPlayers) {
      const roundPts = ptsByPlayer.get(player.id) ?? 0;
      if (roundPts === 0) continue;
      const { data: latest } = await supabase
        .from("players")
        .select("score")
        .eq("id", player.id)
        .single();
      await supabase
        .from("players")
        .update({ score: (latest?.score ?? player.score) + roundPts })
        .eq("id", player.id);
    }

    return ptsByPlayer;
  };

  // --- host-driven question timer expiry ---

  const handleExpiryRef = useRef<() => Promise<void>>(async () => {});
  handleExpiryRef.current = async () => {
    if (!room || !currentBlock || !isHost) return;

    // Re-fetch block to guard against stale/double execution.
    const { data: block } = await supabase
      .from("match_blocks")
      .select()
      .eq("id", currentBlock.id)
      .single();
    if (!block || block.is_complete) return;

    if (block.mode === "number_guess") {
      // Timeout opens reveal; scoring happens only in advanceFromReveal.
      setRoundTimedOut(true);
      return;

    } else if (block.mode === "pick_correct") {
      const { data: roundTurns } = await supabase
        .from("pick_correct_turns")
        .select()
        .eq("room_id", room.id)
        .eq("block_index", block.block_index);
      const thisRound = ((roundTurns ?? []) as DbPickCorrectTurn[]).filter(
        (turn) => (turn.round_index ?? 0) === block.current_round,
      );
      if (thisRound.filter((turn) => turn.is_correct).length >= correctTarget) return;

      const completeKey = `pc:${block.id}:${block.current_round}`;
      if (pickCompleteRef.current === completeKey) return;
      pickCompleteRef.current = completeKey;

      const { data: currentPlayers } = await supabase
        .from("players").select().eq("room_id", room.id);
      if (!currentPlayers?.length) return;

      await awardPickCorrectAndAdvance(
        supabase,
        room.id,
        block,
        currentPlayers,
        thisRound,
        correctTarget,
      );
    }
  };

  useEffect(() => {
    setRoundTimedOut(false);
  }, [currentBlock?.id, currentBlock?.current_round]);

  useEffect(() => {
    if (!currentBlock?.started_at || currentBlock.is_complete) return;

    if (!isLiveQuestionPhase(phase)) return;
    if (questionTimerMs == null) return;

    const endMs =
      new Date(currentBlock.started_at).getTime() + questionTimerMs;

    const remaining = endMs - Date.now();

    const fire = () => {
      setRoundTimedOut(true);
      if (isHost && currentBlock.mode === "pick_correct") {
        void handleExpiryRef.current?.();
      }
    };

    if (remaining <= 0) {
      fire();
      return;
    }

    const timer = setTimeout(fire, remaining);
    return () => clearTimeout(timer);
  }, [
    isHost,
    currentBlock?.started_at,
    currentBlock?.id,
    currentBlock?.current_round,
    currentBlock?.is_complete,
    currentBlock?.mode,
    phase,
    questionTimerMs,
  ]);

  useEffect(() => {
    if (room?.status !== "playing") return;

    const tick = () => {
      const block = currentBlockRef.current;
      if (
        !block ||
        !shouldStampQuestionClock({
          isHost: isHostRef.current,
          phase: phaseRef.current,
          startedAt: block.started_at,
          isComplete: block.is_complete,
          hasPrompt: Boolean(currentPromptRef.current),
        })
      ) {
        return;
      }

      void supabase
        .from("match_blocks")
        .update({ started_at: new Date().toISOString() })
        .eq("id", block.id)
        .is("started_at", null)
        .select()
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            console.warn("question clock stamp failed:", error.message);
            return;
          }
          if (data) {
            setBlocks((prev) =>
              prev.map((row) => (row.id === data.id ? data : row)),
            );
          }
        });
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [room?.status, room?.id, supabase]);

  // --- session persistence ---

  function saveSession(roomId: string, playerId: string) {
    sessionStorage.setItem(
      "ratepanik-session",
      JSON.stringify({ roomId, playerId })
    );
  }

  function clearSession() {
    sessionStorage.removeItem("ratepanik-session");
  }

  useEffect(() => {
    if (shouldSkipSessionRestore(joinCode)) {
      clearSession();
      sessionRestoringRef.current = false;
      setRestoring(false);
      return;
    }
    const raw = sessionStorage.getItem("ratepanik-session");
    if (!raw) return;
    let cancelled = false;
    sessionRestoringRef.current = true;
    (async () => {
      try {
        const { roomId, playerId } = JSON.parse(raw);
        const [{ data: roomData }, { data: playerData }] = await Promise.all([
          supabase.from("rooms").select().eq("id", roomId).single(),
          supabase.from("players").select().eq("id", playerId).single(),
        ]);
        if (cancelled) return;
        if (!roomData || !playerData) {
          clearSession();
          setRestoring(false);
          return;
        }
        const [
          { data: playersData },
          { data: answersData },
          { data: blocksData },
          { data: turnsData },
        ] = await Promise.all([
          supabase.from("players").select().eq("room_id", roomId),
          supabase.from("answers").select().eq("room_id", roomId),
          supabase.from("match_blocks").select().eq("room_id", roomId),
          supabase.from("pick_correct_turns").select().eq("room_id", roomId),
        ]);
        if (cancelled) return;
        setRoom(roomData);
        setPlayers(playersData || []);
        setAllAnswers(answersData || []);
        setBlocks(blocksData || []);
        setTurns(turnsData || []);
        setMyPlayerId(playerId);
        subscribeToRoom(roomId);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setRestoring(false);
        sessionRestoringRef.current = false;
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- actions ---

  const createRoom = async (hostName: string, hostUserId: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const code = generateRoomCode();

      let { data: roomData, error: roomErr } = await supabase
        .from("rooms")
        .insert({
          code,
          host_user_id: hostUserId,
          settings: DEFAULT_ROOM_SETTINGS,
          total_blocks: DEFAULT_ROOM_SETTINGS.blocks,
        })
        .select()
        .single();

      if (roomErr?.code === "23505") {
        setLoading(false);
        return createRoom(hostName, hostUserId);
      }

      if (roomErr && (roomErr.code === "PGRST204" || /settings/i.test(roomErr.message))) {
        const retry = await supabase
          .from("rooms")
          .insert({ code, host_user_id: hostUserId })
          .select()
          .single();
        if (retry.error?.code === "23505") {
          setLoading(false);
          return createRoom(hostName, hostUserId);
        }
        roomData = retry.data;
        roomErr = retry.error;
      }

      if (roomErr || !roomData) throw roomErr ?? new Error("Raum nicht erstellt");

      const { data: playerData, error: playerErr } = await supabase
        .from("players")
        .insert({
          room_id: roomData.id,
          user_id: hostUserId,
          display_name: hostName,
          is_host: true,
        })
        .select()
        .single();

      if (playerErr) throw playerErr;

      setRoom(roomData);
      setPlayers([playerData]);
      setMyPlayerId(playerData.id);
      setAllAnswers([]);
      setBlocks([]);
      setTurns([]);
      setPrompts([]);

      saveSession(roomData.id, playerData.id);
      subscribeToRoom(roomData.id);

      try {
        await tryUnlock("first_room");
      } catch (unlockErr) {
        console.warn("first_room unlock failed:", unlockErr);
      }
      return roomData.code as string;
    } catch (err: unknown) {
      setError(t.game.createFailed);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (code: string, displayName: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const uid = user?.id ?? null;

      const { data: roomData, error: roomErr } = await supabase
        .from("rooms")
        .select()
        .eq("code", code.toUpperCase().trim())
        .single();

      if (roomErr || !roomData) {
        const m = t.game.roomNotFound;
        setError(m);
        return m;
      }

      const { data: existingPlayers } = await supabase
        .from("players")
        .select()
        .eq("room_id", roomData.id);

      // Check if this user is already a player in the room (rejoin scenario)
      const stored = sessionStorage.getItem("ratepanik-session");
      let existingPlayer: DbPlayer | null = null;
      if (stored) {
        try {
          const { playerId } = JSON.parse(stored);
          existingPlayer = existingPlayers?.find((p) => p.id === playerId) ?? null;
        } catch { /* ignore parse errors */ }
      }

      if (existingPlayer) {
        // Rejoin: player already exists in this room — restore state
        const [
          { data: answersData },
          { data: blocksData },
          { data: turnsData },
        ] = await Promise.all([
          supabase.from("answers").select().eq("room_id", roomData.id),
          supabase.from("match_blocks").select().eq("room_id", roomData.id),
          supabase.from("pick_correct_turns").select().eq("room_id", roomData.id),
        ]);

        setRoom(roomData);
        setPlayers(existingPlayers || []);
        setMyPlayerId(existingPlayer.id);
        setAllAnswers(answersData || []);
        setBlocks(blocksData || []);
        setTurns(turnsData || []);
        setPrompts([]);

        saveSession(roomData.id, existingPlayer.id);
        subscribeToRoom(roomData.id);
        return null;
      }

      if (roomData.status !== "lobby") {
        const m = t.game.alreadyStarted;
        setError(m);
        return m;
      }

      let playerData: DbPlayer;

      // Rejoin: reuse existing player row for this auth user in this room
      if (uid) {
        const { data: existing } = await supabase
          .from("players")
          .select()
          .eq("room_id", roomData.id)
          .eq("user_id", uid)
          .maybeSingle();

        if (existing) {
          const { data: updated, error: updateErr } = await supabase
            .from("players")
            .update({
              display_name: displayName,
              last_seen_at: new Date().toISOString(),
            })
            .eq("id", existing.id)
            .select()
            .single();

          if (updateErr) throw updateErr;
          playerData = updated;
        } else {
          // New join — check capacity first
          const { data: existingPlayers } = await supabase
            .from("players")
            .select()
            .eq("room_id", roomData.id);

          const s = parseRoomSettings(roomData.settings);
          const blocked = joinBlockedCopy(
            {
              allowGuests: s.allowGuests,
              joiningAsGuest: user?.is_anonymous === true || isGuest,
              playerCount: existingPlayers?.length ?? 0,
              maxPlayers: s.maxPlayers,
            },
            t,
          );
          if (blocked) {
            setError(blocked);
            return blocked;
          }

          const { data: inserted, error: insertErr } = await supabase
            .from("players")
            .insert({
              room_id: roomData.id,
              user_id: uid,
              display_name: displayName,
              is_host: false,
            })
            .select()
            .single();

          if (insertErr) throw insertErr;
          playerData = inserted;
        }
      } else {
        // Context user not yet loaded — resolve directly from Supabase Auth
        // so anon-auth guests still get user_id set on their player row.
        const { data: { user: freshUser } } = await supabase.auth.getUser();
        const fallbackUid = freshUser?.id ?? null;

        const { data: existingPlayers } = await supabase
          .from("players")
          .select()
          .eq("room_id", roomData.id);

        const s = parseRoomSettings(roomData.settings);
        const blocked = joinBlockedCopy(
          {
            allowGuests: s.allowGuests,
            joiningAsGuest: freshUser?.is_anonymous === true,
            playerCount: existingPlayers?.length ?? 0,
            maxPlayers: s.maxPlayers,
          },
          t,
        );
        if (blocked) {
          setError(blocked);
          return blocked;
        }

        const { data: inserted, error: insertErr } = await supabase
          .from("players")
          .insert({
            room_id: roomData.id,
            user_id: fallbackUid,
            display_name: displayName,
            is_host: false,
          })
          .select()
          .single();

        if (insertErr) throw insertErr;
        playerData = inserted;
      }

      const { data: allPlayers } = await supabase
        .from("players")
        .select()
        .eq("room_id", roomData.id);

      setRoom(roomData);
      setPlayers(allPlayers || []);
      setMyPlayerId(playerData.id);
      setAllAnswers([]);
      setBlocks([]);
      setTurns([]);
      setPrompts([]);

      saveSession(roomData.id, playerData.id);
      subscribeToRoom(roomData.id);
      return null;
    } catch (err: unknown) {
      const m = t.game.joinFailed;
      setError(m);
      return m;
    } finally {
      setLoading(false);
    }
  };

  // Auto-join from ?join=CODE — never flash home while this is in flight.
  useEffect(() => {
    if (!joinCode || joinCodeUsedRef.current || room) return;
    if (sessionRestoringRef.current || restoring) return;
    if (!user?.id) return;
    joinCodeUsedRef.current = true;
    const autoName = displayNameForJoin(user) ?? generateGuestName();
    void joinRoom(joinCode, autoName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinCode, room, restoring, user?.id]);

  const startGame = async () => {
    if (!room || !isHost) return;
    if (room.status !== "lobby") return;
    if (startGameLockRef.current) return;
    startGameLockRef.current = true;
    try {

    const settings = parseRoomSettings(room.settings);
    const blocked = startBlockedReason(settings);
    if (blocked) {
      setError(t.lobby.noThemes);
      return;
    }

    const modes = generateBlockModes(settings.blocks, settings.modeFilter);
    const empty = await emptyPromptPoolReason(settings, modes);
    if (empty) {
      setError(t.game.emptyPool);
      return;
    }

    const timerSeconds = timerSecondsForBlock(settings);
    const blockInserts = modes.map((mode, i) => ({
      room_id: room.id,
      block_index: i,
      mode,
      rounds_total: roundsForMode(mode, settings.questionsPerBlock),
      timer_seconds:
        mode === "order_it" && timerSeconds > 0
          ? Math.max(timerSeconds, Math.round(ORDER_IT_TIMER_MS / 1000))
          : timerSeconds,
    }));

    const { data: blocksData, error: blocksErr } = await supabase
      .from("match_blocks")
      .insert(blockInserts)
      .select();

    if (blocksErr) {
      setError(t.game.roundStartFailed);
      return;
    }

    setBlocks(blocksData || []);

    let themeVote = true;

    if (blocksData?.[0]) {
      const prepared = await prepareBlockTheme(
        blocksData[0].id,
        modes[0],
        settings,
      );
      if (prepared === "empty") {
        setError(t.game.emptyPool);
        return;
      }
      themeVote = prepared === "vote";
    }

    await supabase.from("answers").delete().eq("room_id", room.id);
    await supabase.from("pick_correct_turns").delete().eq("room_id", room.id);
    await supabase.from("match_scores").delete().eq("room_id", room.id);
    await supabase
      .from("players")
      .update({ score: 0 })
      .eq("room_id", room.id);

    const { error: upErr } = await supabase
      .from("rooms")
      .update({
        status: "playing" as const,
        current_block_index: 0,
        total_blocks: settings.blocks,
        theme_vote_active: themeVote,
        current_question_index: 0,
        question_ids: [],
        settings: stampVsIntroUntil(room.settings, players.length),
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id);

    if (upErr) {
      setError(t.game.roundStartFailed);
      return;
    }

    setAllAnswers([]);
    setTurns([]);
    lastStateKeyRef.current = themeVote ? "0:true" : "0:false";
    } finally {
      startGameLockRef.current = false;
    }
  };

  useEffect(() => {
    startGameRef.current = startGame;
  });

  useEffect(() => {
    if (!isHost || room?.status !== "lobby") {
      autoStartAttemptRef.current = null;
      return;
    }
    const s = parseRoomSettings(room.settings);
    if (!s.autoStart) {
      autoStartAttemptRef.current = null;
      return;
    }
    if (players.length < 2 || players.length < s.maxPlayers) {
      autoStartAttemptRef.current = null;
      return;
    }
    const key = `${players.length}:${JSON.stringify(s)}`;
    if (autoStartAttemptRef.current === key) return;
    autoStartAttemptRef.current = key;
    void startGameRef.current();
  }, [isHost, room?.status, room?.settings, players.length]);

  const selectTheme = async (themeId: string) => {
    if (!room || !currentBlock) {
      throw new Error("Die Themenauswahl ist nicht mehr aktiv.");
    }
    if (!isThemePicker) {
      throw new Error("Nur der aktuelle Themenprofi darf ein Thema wählen.");
    }

    const settings = parseRoomSettings(room.settings);
    const count = roundsForMode(currentBlock.mode, settings.questionsPerBlock);
    let fetchedPrompts = await fetchPromptsForBlock(
      themeId,
      currentBlock.mode,
      count,
      settings.difficulty,
      allowedThemeIds(settings),
    );

    if (fetchedPrompts.length === 0) {
      const fallbackThemes = await fetchRandomThemeOptionsForMode(
        currentBlock.mode,
        8,
        allowedThemeIds(settings),
      );
      for (const fallbackTheme of fallbackThemes) {

        if (fallbackTheme.id === themeId) continue;
        fetchedPrompts = await fetchPromptsForBlock(
          fallbackTheme.id,
          currentBlock.mode,
          count,
          settings.difficulty,
          allowedThemeIds(settings),
        );
        if (fetchedPrompts.length > 0) break;
      }
    }

    if (fetchedPrompts.length === 0) {
      const message = t.game.emptyPool;
      setError(message);
      throw new Error(message);
    }

    const promptIds = fetchedPrompts.map((p) => p.id);

    // Update block with selected theme and prompts
    const { error: blockUpdateError } = await supabase
      .from("match_blocks")
      .update({
        theme_id: themeId,
        prompt_ids: promptIds,
        rounds_total: Math.max(1, promptIds.length),
      })
      .eq("id", currentBlock.id);
    if (blockUpdateError) {
      setError(t.game.themeSaveFailed);
      throw blockUpdateError;
    }

    // Deactivate theme vote
    const { error: roomUpdateError } = await supabase
      .from("rooms")
      .update({
        theme_vote_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id);
    if (roomUpdateError) {
      setError(t.game.roundStartFailed);
      throw roomUpdateError;
    }

    setRoom((prev) =>
      prev ? { ...prev, theme_vote_active: false } : prev,
    );
    setPrompts(fetchedPrompts);
  };

  const submitNumberGuess = async (guess: number) => {
    if (!room || !myPlayerId || !currentBlock || !currentPrompt) return;

    const { error: ansErr } = await supabase.from("answers").insert({
      room_id: room.id,
      player_id: myPlayerId,
      block_index: currentBlock.block_index,
      round_index: currentBlock.current_round,
      prompt_id: currentPrompt.id,
      mode: "number_guess",
      numeric_answer: guess,
      question_index: room.current_block_index * 10 + currentBlock.current_round,
      choice_index: -1,
      is_correct: null,
    });

    if (ansErr && ansErr.code !== "23505") {
      setError(t.game.sendFailed);
      throw new Error(ansErr.message);
    }
  };

  const submitFindLie = async (lieIndex: number) => {
    if (!room || !myPlayerId || !currentBlock || !currentPrompt) return;

    const { error: ansErr } = await supabase.from("answers").insert({
      room_id: room.id,
      player_id: myPlayerId,
      block_index: currentBlock.block_index,
      round_index: currentBlock.current_round,
      prompt_id: currentPrompt.id,
      mode: "find_lie",
      numeric_answer: lieIndex,
      question_index: room.current_block_index * 10 + currentBlock.current_round,
      choice_index: lieIndex,
      is_correct: null,
    });

    if (ansErr && ansErr.code !== "23505") {
      setError(t.game.sendFailed);
      throw new Error(ansErr.message);
    }
  };

  const submitOrderIt = async (order: number[]) => {
    if (!room || !myPlayerId || !currentBlock || !currentPrompt) return;

    const { error: ansErr } = await supabase.from("answers").insert({
      room_id: room.id,
      player_id: myPlayerId,
      block_index: currentBlock.block_index,
      round_index: currentBlock.current_round,
      prompt_id: currentPrompt.id,
      mode: "order_it",
      payload_answer: order,
      question_index: room.current_block_index * 10 + currentBlock.current_round,
      choice_index: -1,
      is_correct: null,
    });

    if (ansErr && ansErr.code !== "23505") {
      setError(t.game.sendFailed);
      throw new Error(ansErr.message);
    }
  };

  const tapCard = async (cardIndex: number) => {
    if (!room || !myPlayerId || !currentBlock || !currentPrompt) return;
    if (currentBlock.mode !== "pick_correct") return;
    if (correctTurnsCount >= correctTarget) return;
    if (blockTurns.some((t) => t.card_index === cardIndex)) return;
    if (!isPickCorrectPayload(currentPrompt.payload)) return;

    const isCorrect = currentPrompt.payload.correct_indices.includes(cardIndex);

    const { error: tapErr } = await supabase.from("pick_correct_turns").insert({
      room_id: room.id,
      block_index: currentBlock.block_index,
      player_id: myPlayerId,
      turn_order: blockTurns.length,
      card_index: cardIndex,
      is_correct: isCorrect,
      round_index: currentBlock.current_round,
    });

    if (tapErr?.code === "23505") return;
    if (tapErr) {
      setError(t.game.sendFailed);
    }
  };

  const advanceFromReveal = async () => {
    if (!room || !isHost || !currentBlock) return;
    if (hostActionLockRef.current) return;
    hostActionLockRef.current = true;
    setHostActionLock(true);

    try {
    const roundPtsByPlayer = new Map<string, number>();

    if (currentBlock.mode === "find_lie" || currentBlock.mode === "order_it") {
      const completeKey = `quiz:${currentBlock.id}:${currentBlock.current_round}`;
      if (pickCompleteRef.current === completeKey) return;
      pickCompleteRef.current = completeKey;
      const scored = await scoreSimultaneousQuizRound(
        currentBlock,
        players,
        roundAnswers,
        currentPrompt ?? undefined
      );
      for (const [playerId, pts] of scored) {
        roundPtsByPlayer.set(playerId, pts);
      }
    } else {
    const correctAnswer = numberGuessCorrectFromPayload(currentPrompt?.payload);
    if (correctAnswer !== undefined) {
      const scored = scoreNumberGuessAnswers(
        roundAnswers.map((a) => ({
          id: a.id,
          playerId: a.player_id,
          numericAnswer: a.numeric_answer,
        })),
        correctAnswer,
        players.length,
      );

      for (const row of scored) {
        roundPtsByPlayer.set(
          row.playerId,
          (roundPtsByPlayer.get(row.playerId) ?? 0) + row.points,
        );
        const { data: awarded } = await supabase
          .from("answers")
          .update({
            distance: row.distance,
            rank: row.rank,
            points_awarded: row.points,
          })
          .eq("id", row.id)
          .or("points_awarded.eq.0,points_awarded.is.null")
          .select("id");

        if (!awarded?.length || row.points === 0) continue;

        const { data: latest } = await supabase
          .from("players")
          .select("score")
          .eq("id", row.playerId)
          .single();
        if (latest) {
          await supabase
            .from("players")
            .update({ score: latest.score + row.points })
            .eq("id", row.playerId);
        }
      }
    }
    }

    const nextRound = currentBlock.current_round + 1;
    if (nextRound < currentBlock.rounds_total) {
      await supabase
        .from("match_blocks")
        .update({
          current_round: nextRound,
          started_at: null,
        })
        .eq("id", currentBlock.id);
    } else {
      for (const player of players) {
        const prior = allBlockAnswers
          .filter(
            (a) =>
              a.player_id === player.id &&
              a.round_index !== currentBlock.current_round,
          )
          .reduce((sum, a) => sum + (a.points_awarded || 0), 0);
        const blockPts = prior + (roundPtsByPlayer.get(player.id) ?? 0);

        await supabase.from("match_scores").upsert(
          {
            room_id: room.id,
            player_id: player.id,
            block_index: currentBlock.block_index,
            total_points: blockPts,
          },
          { onConflict: "room_id,player_id,block_index" }
        );
      }

      await supabase
        .from("match_blocks")
        .update({
          is_complete: true,
          finished_at: new Date().toISOString(),
        })
        .eq("id", currentBlock.id);
    }
    } finally {
      hostActionLockRef.current = false;
      setHostActionLock(false);
    }
  };

  const advanceFromBlockScore = async () => {
    if (!room || !isHost) return;

    const nextBlockIndex = room.current_block_index + 1;

    if (nextBlockIndex >= room.total_blocks) {
      // Match finished
      await supabase
        .from("rooms")
        .update({
          status: "finished" as const,
          updated_at: new Date().toISOString(),
        })
        .eq("id", room.id);
      return;
    }

    const nextBlock = blocks.find((b) => b.block_index === nextBlockIndex);
    let themeVote = true;
    if (nextBlock) {
      const settings = parseRoomSettings(room.settings);
      const prepared = await prepareBlockTheme(
        nextBlock.id,
        nextBlock.mode,
        settings,
      );
      if (prepared === "empty") {
        setError(t.game.emptyPool);
        return;
      }
      themeVote = prepared === "vote";

    }

    await supabase
      .from("rooms")
      .update({
        current_block_index: nextBlockIndex,
        theme_vote_active: themeVote,
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id);

    setPrompts([]);
  };

  const updateRoomSettings = async (patch: Partial<RoomSettings>) => {
    if (!room || !isHost || room.status !== "lobby") return;
    const next = clampRoomSettings(
      { ...parseRoomSettings(room.settings), ...patch },
      players.length,
    );
    const { error: err } = await supabase
      .from("rooms")
      .update({
        settings: next,
        total_blocks: next.blocks,
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id);
    if (err) {
      const m = err.message;
      if (/only_host_can_change_settings/i.test(m)) {
        setError(t.game.hostOnlySettings);
      } else if (/settings_locked_after_start/i.test(m)) {
        setError(t.game.settingsLocked);
      } else {
        setError(t.game.settingsSaveFailed);
      }
      return;
    }
    setRoom({ ...room, settings: next, total_blocks: next.blocks });
  };

  const updateDisplayName = async (newName: string): Promise<string | null> => {
    if (!room || !myPlayerId) return t.game.renameFailed;
    const trimmed = newName.trim();
    if (!trimmed) return t.game.renameEmpty;
    if (trimmed.length < 3) return t.game.renameTooShort;
    if (trimmed.length > 16) return t.game.renameTooLong;

    const taken = players.some(
      (p) =>
        p.id !== myPlayerId &&
        p.display_name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (taken) return t.game.renameTaken;

    const { error: err } = await supabase
      .from("players")
      .update({ display_name: trimmed })
      .eq("id", myPlayerId);
    if (err) return t.game.renameFailed;

    setPlayers((prev) =>
      prev.map((p) => (p.id === myPlayerId ? { ...p, display_name: trimmed } : p)),
    );
    return null;
  };

  const resetGame = async () => {
    if (!room) return;

    await supabase.from("answers").delete().eq("room_id", room.id);
    await supabase.from("pick_correct_turns").delete().eq("room_id", room.id);
    await supabase.from("match_scores").delete().eq("room_id", room.id);
    await supabase.from("match_blocks").delete().eq("room_id", room.id);
    await supabase
      .from("players")
      .update({ score: 0 })
      .eq("room_id", room.id);
    await supabase
      .from("rooms")
      .update({
        status: "lobby" as const,
        current_block_index: 0,
        theme_vote_active: false,
        current_question_index: 0,
        question_ids: [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id);

    setAllAnswers([]);
    setBlocks([]);
    setTurns([]);
    setPrompts([]);
    setThemeOptions([]);
    lastStateKeyRef.current = "";
  };

  const leaveRoom = async (options?: { next?: string }) => {
    const guestNext = resolveGuestExitPath(options?.next);

    if (room && myPlayerId) {
      const roomId = room.id;
      const playerId = myPlayerId;

      try {
        const { error: leaveErr } = await supabase.rpc("leave_match", {
          p_room_id: roomId,
        });

        if (leaveErr) {
          const me = players.find((p) => p.id === playerId);
          if (me?.is_host) {
            const remaining = [...players]
              .filter((p) => p.id !== playerId)
              .sort(
                (a, b) =>
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
              );
            const nextHost = remaining[0];
            if (nextHost) {
              await supabase.from("players").update({ is_host: true }).eq("id", nextHost.id);
              await supabase
                .from("rooms")
                .update({
                  host_user_id: nextHost.user_id,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", roomId);
            } else {
              await supabase
                .from("rooms")
                .update({
                  status: "finished" as const,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", roomId);
            }
          }

          await supabase
            .from("answers")
            .delete()
            .eq("player_id", playerId)
            .eq("room_id", roomId);

          await supabase.from("players").delete().eq("id", playerId);
        }
      } catch (e) {
        console.error("leaveRoom cleanup error:", e);
      }
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    clearSession();

    if (isGuest) {
      router.replace(guestNext);
      await signOut();
      return;
    }

    goHome();
  };

  const goHome = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setRoom(null);
    setPlayers([]);
    setAllAnswers([]);
    setBlocks([]);
    setTurns([]);
    setMyPlayerId(null);
    setPrompts([]);
    setThemeOptions([]);
    setError(null);
    setNotice(null);
    lastStateKeyRef.current = "";
    autoStartAttemptRef.current = null;
    pickCompleteRef.current = null;
    hostActionLockRef.current = false;
    setHostActionLock(false);
    setRoundTimedOut(false);
    setRevealHoldActive(false);
    clearSession();

    if (isGuest) {
      router.replace(resolveGuestExitPath());
      void signOut();
      return;
    }

    if (typeof window !== "undefined" && window.location.search.includes("join=")) {
      router.replace("/");
    }
  };

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [supabase]);

  const value: GameContextValue = {
    phase,
    room,
    players,
    myPlayerId,
    isHost,
    error,
    notice,
    loading,
    restoring,
    disconnected,
    getPlayerLayers,
    blocks,
    currentBlock,
    currentPrompt,
    prompts,
    themeOptions,
    roundAnswers,
    allBlockAnswers,
    turns: blockTurns,
    activePlayerIndex,
    isMyTurn,
    themePickerPlayerId,
    isThemePicker,
    questionDeadlineMs,
    hostActionLock,
    questionTimerMs,
    roomSettings,
    updateRoomSettings,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    selectTheme,
    submitNumberGuess,
    submitFindLie,
    submitOrderIt,
    tapCard,
    advanceFromReveal,
    advanceFromBlockScore,
    resetGame,
    goHome,
    updateDisplayName,
  };

  return (
    <GameContext.Provider value={value}>{children}</GameContext.Provider>
  );
}
