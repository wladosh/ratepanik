"use client";

import { getShuffledQuestions, type Question } from "./questions";

export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  currentAnswer: number | null;
  answerTime: number | null;
}

export type GamePhase =
  | "home"
  | "lobby"
  | "question"
  | "reveal"
  | "scoreboard"
  | "final";

export interface GameState {
  phase: GamePhase;
  roomCode: string;
  players: Player[];
  questions: Question[];
  currentQuestionIndex: number;
  roundsTotal: number;
  timePerQuestion: number;
  hostId: string;
}

const AVATARS = ["🦊", "🐻", "🐼", "🦁", "🐸", "🐵", "🐷", "🐮", "🐔", "🦄", "🐲", "🐙"];

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generatePlayerId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function getRandomAvatar(usedAvatars: string[]): string {
  const available = AVATARS.filter((a) => !usedAvatars.includes(a));
  if (available.length === 0) return AVATARS[Math.floor(Math.random() * AVATARS.length)];
  return available[Math.floor(Math.random() * available.length)];
}

const POINTS_BASE = 1000;
const POINTS_TIME_BONUS = 500;

export function calculatePoints(
  isCorrect: boolean,
  answerTimeMs: number,
  timeLimit: number
): number {
  if (!isCorrect) return 0;
  const timeRatio = Math.max(0, 1 - answerTimeMs / (timeLimit * 1000));
  return Math.round(POINTS_BASE + POINTS_TIME_BONUS * timeRatio);
}

export function createInitialState(): GameState {
  return {
    phase: "home",
    roomCode: "",
    players: [],
    questions: [],
    currentQuestionIndex: 0,
    roundsTotal: 8,
    timePerQuestion: 15,
    hostId: "",
  };
}

export function createRoom(state: GameState, hostName: string): GameState {
  const hostId = generatePlayerId();
  const avatar = getRandomAvatar([]);
  return {
    ...state,
    phase: "lobby",
    roomCode: generateRoomCode(),
    hostId,
    players: [
      {
        id: hostId,
        name: hostName,
        avatar,
        score: 0,
        currentAnswer: null,
        answerTime: null,
      },
    ],
  };
}

export function addPlayer(state: GameState, name: string): GameState {
  const usedAvatars = state.players.map((p) => p.avatar);
  const player: Player = {
    id: generatePlayerId(),
    name,
    avatar: getRandomAvatar(usedAvatars),
    score: 0,
    currentAnswer: null,
    answerTime: null,
  };
  return {
    ...state,
    players: [...state.players, player],
  };
}

export function removePlayer(state: GameState, playerId: string): GameState {
  return {
    ...state,
    players: state.players.filter((p) => p.id !== playerId),
  };
}

export function startGame(state: GameState): GameState {
  const gameQuestions = getShuffledQuestions(state.roundsTotal);
  return {
    ...state,
    phase: "question",
    questions: gameQuestions,
    currentQuestionIndex: 0,
    roundsTotal: gameQuestions.length,
    players: state.players.map((p) => ({
      ...p,
      score: 0,
      currentAnswer: null,
      answerTime: null,
    })),
  };
}

export function submitAnswer(
  state: GameState,
  playerId: string,
  answerIndex: number,
  timeMs: number
): GameState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId
        ? { ...p, currentAnswer: answerIndex, answerTime: timeMs }
        : p
    ),
  };
}

export function revealAnswer(state: GameState): GameState {
  const question = state.questions[state.currentQuestionIndex];
  return {
    ...state,
    phase: "reveal",
    players: state.players.map((p) => {
      const isCorrect = p.currentAnswer === question.correctIndex;
      const points = calculatePoints(
        isCorrect,
        p.answerTime ?? state.timePerQuestion * 1000,
        state.timePerQuestion
      );
      return {
        ...p,
        score: p.score + points,
      };
    }),
  };
}

export function showScoreboard(state: GameState): GameState {
  return { ...state, phase: "scoreboard" };
}

export function nextQuestion(state: GameState): GameState {
  const nextIndex = state.currentQuestionIndex + 1;
  if (nextIndex >= state.questions.length) {
    return { ...state, phase: "final" };
  }
  return {
    ...state,
    phase: "question",
    currentQuestionIndex: nextIndex,
    players: state.players.map((p) => ({
      ...p,
      currentAnswer: null,
      answerTime: null,
    })),
  };
}

export function resetGame(state: GameState): GameState {
  return {
    ...state,
    phase: "lobby",
    questions: [],
    currentQuestionIndex: 0,
    players: state.players.map((p) => ({
      ...p,
      score: 0,
      currentAnswer: null,
      answerTime: null,
    })),
  };
}
