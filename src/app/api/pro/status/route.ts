import { NextRequest, NextResponse } from "next/server";
import { getEntitlement, grantEntitlement } from "@/lib/pro";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") || "";
  if (!userId) return NextResponse.json({ pro: false });
  const ent = await getEntitlement(userId);
  return NextResponse.json({ pro: !!ent, entitlement: ent });
}

// Mock-mode entitlement grant. When STRIPE_SECRET_KEY is unset, the /checkout
// endpoint redirects with ?pro_mock=1 and the client calls this to toggle
// entitlement on. With Stripe configured, entitlement is granted via webhook
// and this endpoint rejects client-origin writes.
export async function POST(req: NextRequest) {
  if (process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "not_allowed_in_live_mode" }, { status: 403 });
  }
  let body: { userId?: string; plan?: string; handle?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const userId = String(body.userId || "").slice(0, 64);
  if (!userId) return NextResponse.json({ error: "userId_required" }, { status: 400 });
  const plan = body.plan === "annual" ? "annual" : "monthly";
  const now = new Date();
  const expires = new Date(now);
  if (plan === "annual") expires.setFullYear(expires.getFullYear() + 1);
  else expires.setMonth(expires.getMonth() + 1);

  await grantEntitlement({
    userId,
    handle: body.handle ? String(body.handle).slice(0, 24) : null,
    plan,
    startedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  });

  return NextResponse.json({ ok: true, mode: "mock" });
}
