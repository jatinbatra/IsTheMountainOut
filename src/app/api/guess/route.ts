import { NextRequest, NextResponse } from "next/server";
import { datePT, getDayGuess, submitGuess, isRevealed, type Guess } from "@/lib/guess";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = String(searchParams.get("userId") || "").slice(0, 64);
  if (!userId) {
    return NextResponse.json({ error: "missing_userId" }, { status: 400 });
  }
  const date = datePT();
  const day = await getDayGuess(date, userId);
  return NextResponse.json(day);
}

export async function POST(req: NextRequest) {
  let body: { userId?: string; handle?: string; guess?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const userId = String(body.userId || "").slice(0, 64);
  const handle = String(body.handle || "anon").slice(0, 24).replace(/[^\w\-. ]/g, "") || "anon";
  const guess =
    typeof body.guess === "number" ? Math.max(0, Math.min(100, Math.round(body.guess))) : null;

  if (!userId || guess === null) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const date = datePT();
  if (isRevealed(date)) {
    return NextResponse.json({ error: "already_revealed" }, { status: 403 });
  }

  const entry: Guess = {
    userId,
    handle,
    guess,
    submittedAt: new Date().toISOString(),
  };

  try {
    await submitGuess(date, entry);
  } catch {
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }

  const day = await getDayGuess(date, userId);
  return NextResponse.json({ ok: true, day });
}
