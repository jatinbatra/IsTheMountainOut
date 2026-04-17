import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const hood = typeof body.hood === "string" ? body.hood : "";
    const today = new Date().toISOString().split("T")[0];

    await kv.incr(`beacon:views:${today}`);

    if (hood) {
      await kv.incr(`beacon:hoods:${today}:${hood}`);
    }
  } catch {
    // Non-critical — never fail the user experience
  }

  return new NextResponse(null, { status: 204 });
}
