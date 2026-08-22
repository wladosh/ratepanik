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
import { supabase, type DbRoom, type DbPlayer, type DbAnswer } from "./supabase";
import { questions as allQuestions, type Question } from "./questions";
import { calculatePoints } from "./game-store";

export type GamePhase =
  | "home"
  | "lobby"
  | "question"
  | "answered"
  | "reveal"
  | "scoreboard"
  | "final";

const AVATARS = [
  "🦊", "🐻", "🐼", "🦁", "🐸", "🐵",
  "🐷", "🐮", "🐔", "🦄", "🐲", "🐙",
];

export const TIME_PER_QUESTION = 15;
const ROUNDS_TOTAL = 8;

interface GameContextValue {
  phase: GamePhase;
  room: DbRoom | null;
  players: DbPlayer[];
  questions: Question[];
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  myPlayerId: string | null;
  isHost: boolean;
  answers: DbAnswer[];
  lastRoundPoints: number;
  timePerQuestion: number;
  error: string | null;
  loading: boolean;
  getAvatar: (playerId: string) => string;

  createRoom: (hostName: string) => Promise<void>;
  joinRoom: (code: string, displayName: string) => Promise<string | null>;
  startGame: () => Promise<void>;
  submitAnswer: (choiceIndex: number, timeMs: number) => Promise<void>;
  showReveal: () => void;
  showScoreboard: () => void;
  nextQuestion: () => Promise<void>;
  resetGame: () => Promise<void>;
  goHome: () => void;
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

export function GameProvider({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<DbRoom | null>(null);
  const [players, setPlayers] = useState<DbPlayer[]>([]);
  const [allAnswers, setAllAnswers] = useState<DbAnswer[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [subPhase, setSubPhase] = useState<
    "question" | "answered" | "reveal" | "scoreboard"
  >("question");
  const [lastRoundPoints, setLastRoundPoints] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastSeenQuestionKeyRef = useRef("");

  // --- derived state ---

  const questions = useMemo<Question[]>(() => {
    const ids = room?.question_ids;
    if (!ids || !Array.isArray(ids) || ids.length === 0) return [];
    return ids
      .map((id: number) => allQuestions.find((q) => q.id === id))
      .filter((q): q is Question => q !== undefined);
  }, [room?.question_ids]);

  const currentQuestionIndex = room?.current_question_index ?? 0;
  const currentQuestion = questions[currentQuestionIndex] ?? null;

  const currentAnswers = useMemo(
    () => allAnswers.filter((a) => a.question_index === currentQuestionIndex),
    [allAnswers, currentQuestionIndex]
  );

  const myPlayer = players.find((p) => p.id === myPlayerId);
  const isHost = myPlayer?.is_host ?? false;

  const phase: GamePhase = useMemo(() => {
    if (!room) return "home";
    if (room.status === "lobby") return "lobby";
    if (room.status === "finished") return "final";
    if (
      (subPhase === "question" || subPhase === "answered") &&
      players.length > 0 &&
      currentAnswers.length >= players.length
    ) {
      return "reveal";
    }
    return subPhase;
  }, [room, subPhase, players.length, currentAnswers.length]);

  const getAvatar = useCallback(
    (playerId: string) => {
      const sorted = [...players].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      const index = sorted.findIndex((p) => p.id === playerId);
      return AVATARS[(index >= 0 ? index : 0) % AVATARS.length];
    },
    [players]
  );

  // --- auto-clear errors ---

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  // --- realtime subscription ---

  const subscribeToRoom = useCallback((roomId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            setRoom(payload.new as DbRoom);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPlayers((prev) => {
              if (prev.some((p) => p.id === (payload.new as DbPlayer).id))
                return prev;
              return [...prev, payload.new as DbPlayer];
            });
          } else if (payload.eventType === "UPDATE") {
            setPlayers((prev) =>
              prev.map((p) =>
                p.id === (payload.new as DbPlayer).id
                  ? (payload.new as DbPlayer)
                  : p
              )
            );
          } else if (payload.eventType === "DELETE") {
            setPlayers((prev) =>
              prev.filter(
                (p) => p.id !== (payload.old as { id: string }).id
              )
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "answers",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setAllAnswers((prev) => {
            if (prev.some((a) => a.id === (payload.new as DbAnswer).id))
              return prev;
            return [...prev, payload.new as DbAnswer];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, []);

  // Sync local sub-phase when the DB question index advances (Realtime → local)
  useEffect(() => {
    if (!room || room.status !== "playing") return;

    const key = `${room.status}:${room.current_question_index}`;
    if (key !== lastSeenQuestionKeyRef.current) {
      lastSeenQuestionKeyRef.current = key;
      setSubPhase("question");
      setLastRoundPoints(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status, room?.current_question_index]);

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
    const raw = sessionStorage.getItem("ratepanik-session");
    if (!raw) return;
    let cancelled = false;
    (async () => {
      try {
        const { roomId, playerId } = JSON.parse(raw);
        const [{ data: roomData }, { data: playerData }] =
          await Promise.all([
            supabase.from("rooms").select().eq("id", roomId).single(),
            supabase.from("players").select().eq("id", playerId).single(),
          ]);
        if (cancelled || !roomData || !playerData) {
          clearSession();
          return;
        }
        const [{ data: playersData }, { data: answersData }] =
          await Promise.all([
            supabase.from("players").select().eq("room_id", roomId),
            supabase.from("answers").select().eq("room_id", roomId),
          ]);
        if (cancelled) return;
        setRoom(roomData);
        setPlayers(playersData || []);
        setAllAnswers(answersData || []);
        setMyPlayerId(playerId);
        if (roomData.status === "playing") {
          const myAns = (answersData || []).find(
            (a: DbAnswer) =>
              a.player_id === playerId &&
              a.question_index === roomData.current_question_index
          );
          const totalForQ = (answersData || []).filter(
            (a: DbAnswer) =>
              a.question_index === roomData.current_question_index
          ).length;
          if (myAns) {
            setSubPhase(
              totalForQ >= (playersData || []).length ? "reveal" : "answered"
            );
          } else {
            setSubPhase("question");
          }
          lastSeenQuestionKeyRef.current = `${roomData.status}:${roomData.current_question_index}`;
        }
        subscribeToRoom(roomId);
      } catch {
        if (!cancelled) clearSession();
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- actions ---

  const createRoom = async (hostName: string) => {
    setLoading(true);
    setError(null);
    try {
      const code = generateRoomCode();

      const { data: roomData, error: roomErr } = await supabase
        .from("rooms")
        .insert({ code })
        .select()
        .single();

      if (roomErr) {
        if (roomErr.code === "23505") {
          setLoading(false);
          return createRoom(hostName);
        }
        throw roomErr;
      }

      const { data: playerData, error: playerErr } = await supabase
        .from("players")
        .insert({
          room_id: roomData.id,
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

      saveSession(roomData.id, playerData.id);
      subscribeToRoom(roomData.id);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Fehler beim Erstellen des Raums";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (
    code: string,
    displayName: string
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data: roomData, error: roomErr } = await supabase
        .from("rooms")
        .select()
        .eq("code", code.toUpperCase().trim())
        .single();

      if (roomErr || !roomData) {
        const m = "Raum nicht gefunden. Prüfe den Code!";
        setError(m);
        return m;
      }

      if (roomData.status !== "lobby") {
        const m = "Das Spiel läuft bereits!";
        setError(m);
        return m;
      }

      const { data: playerData, error: playerErr } = await supabase
        .from("players")
        .insert({
          room_id: roomData.id,
          display_name: displayName,
          is_host: false,
        })
        .select()
        .single();

      if (playerErr) throw playerErr;

      const { data: allPlayers } = await supabase
        .from("players")
        .select()
        .eq("room_id", roomData.id);

      setRoom(roomData);
      setPlayers(allPlayers || []);
      setMyPlayerId(playerData.id);
      setAllAnswers([]);

      saveSession(roomData.id, playerData.id);
      subscribeToRoom(roomData.id);
      return null;
    } catch (err: unknown) {
      const m =
        err instanceof Error ? err.message : "Fehler beim Beitreten";
      setError(m);
      return m;
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    if (!room || !isHost) return;

    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, ROUNDS_TOTAL);
    const questionIds = selected.map((q) => q.id);

    await supabase.from("answers").delete().eq("room_id", room.id);

    await supabase
      .from("players")
      .update({ score: 0 })
      .eq("room_id", room.id);

    const { error: upErr } = await supabase
      .from("rooms")
      .update({
        status: "playing" as const,
        current_question_index: 0,
        question_ids: questionIds,
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id);

    if (upErr) {
      setError(upErr.message);
      return;
    }

    setAllAnswers([]);
    setSubPhase("question");
    lastSeenQuestionKeyRef.current = "playing:0";
  };

  const submitAnswer = async (choiceIndex: number, timeMs: number) => {
    if (!room || !myPlayerId || !currentQuestion) return;

    const isCorrect =
      choiceIndex >= 0 && choiceIndex === currentQuestion.correctIndex;
    const points =
      choiceIndex >= 0
        ? calculatePoints(isCorrect, timeMs, TIME_PER_QUESTION)
        : 0;
    setLastRoundPoints(points);

    const { error: ansErr } = await supabase.from("answers").insert({
      room_id: room.id,
      player_id: myPlayerId,
      question_index: currentQuestionIndex,
      choice_index: choiceIndex,
      is_correct: isCorrect,
    });

    if (ansErr && ansErr.code !== "23505") {
      console.error("Answer insert error:", ansErr);
      return;
    }

    const currentScore = myPlayer?.score ?? 0;
    await supabase
      .from("players")
      .update({ score: currentScore + points })
      .eq("id", myPlayerId);

    setSubPhase("answered");
  };

  const showReveal = () => setSubPhase("reveal");
  const showScoreboard = () => setSubPhase("scoreboard");

  const nextQuestion = async () => {
    if (!room || !isHost) return;

    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx >= questions.length) {
      await supabase
        .from("rooms")
        .update({
          status: "finished" as const,
          updated_at: new Date().toISOString(),
        })
        .eq("id", room.id);
      return;
    }

    await supabase
      .from("rooms")
      .update({
        current_question_index: nextIdx,
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id);
  };

  const resetGame = async () => {
    if (!room) return;

    await supabase.from("answers").delete().eq("room_id", room.id);
    await supabase
      .from("players")
      .update({ score: 0 })
      .eq("room_id", room.id);
    await supabase
      .from("rooms")
      .update({
        status: "lobby" as const,
        current_question_index: 0,
        question_ids: [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id);

    setAllAnswers([]);
    setLastRoundPoints(0);
    lastSeenQuestionKeyRef.current = "";
  };

  const goHome = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setRoom(null);
    setPlayers([]);
    setAllAnswers([]);
    setMyPlayerId(null);
    setLastRoundPoints(0);
    setError(null);
    lastSeenQuestionKeyRef.current = "";
    clearSession();
  };

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const value: GameContextValue = {
    phase,
    room,
    players,
    questions,
    currentQuestionIndex,
    currentQuestion,
    myPlayerId,
    isHost,
    answers: currentAnswers,
    lastRoundPoints,
    timePerQuestion: TIME_PER_QUESTION,
    error,
    loading,
    getAvatar,
    createRoom,
    joinRoom,
    startGame,
    submitAnswer,
    showReveal,
    showScoreboard,
    nextQuestion,
    resetGame,
    goHome,
  };

  return (
    <GameContext.Provider value={value}>{children}</GameContext.Provider>
  );
}
