"use client";

const POOL_KEY = (week: string) => `pool:picks:${week}`;
const GUESS_KEY = (date: string) => `guess:today:${date}`;

function safeGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or disabled */
  }
}

export interface LocalPoolPicks {
  picks: number[];
  submittedAt: string;
}

export function getLocalPoolPicks(week: string): LocalPoolPicks | null {
  return safeGet<LocalPoolPicks>(POOL_KEY(week));
}

export function setLocalPoolPicks(week: string, picks: number[]): void {
  safeSet(POOL_KEY(week), { picks, submittedAt: new Date().toISOString() });
}

export interface LocalGuess {
  guess: number;
  submittedAt: string;
}

export function getLocalGuess(date: string): LocalGuess | null {
  return safeGet<LocalGuess>(GUESS_KEY(date));
}

export function setLocalGuess(date: string, guess: number): void {
  safeSet(GUESS_KEY(date), { guess, submittedAt: new Date().toISOString() });
}
