import { NextRequest, NextResponse } from "next/server";
import { PRO_PRICING } from "@/lib/pro";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://is-the-mountain-out.vercel.app";

export async function POST(req: NextRequest) {
  let body: { userId?: string; plan?: keyof typeof PRO_PRICING; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const userId = String(body.userId || "").slice(0, 64);
  const plan = body.plan === "annual" ? "annual" : "monthly";
  const email = String(body.email || "").slice(0, 120);
  if (!userId) return NextResponse.json({ error: "userId_required" }, { status: 400 });

  const priceId =
    plan === "annual" ? process.env.STRIPE_PRICE_ANNUAL : process.env.STRIPE_PRICE_MONTHLY;
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey || !priceId) {
    return NextResponse.json({
      url: `${SITE_URL}/?pro_mock=1&plan=${plan}&uid=${encodeURIComponent(userId)}`,
      mode: "mock",
    });
  }

  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.append("line_items[0][price]", priceId);
  params.append("line_items[0][quantity]", "1");
  params.set("success_url", `${SITE_URL}/?pro=success&uid=${encodeURIComponent(userId)}`);
  params.set("cancel_url", `${SITE_URL}/?pro=cancelled`);
  params.set("client_reference_id", userId);
  if (email) params.set("customer_email", email);
  params.set("metadata[userId]", userId);
  params.set("metadata[plan]", plan);

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "stripe_error", details: text }, { status: 500 });
    }
    const session = (await res.json()) as { url: string; id: string };
    return NextResponse.json({ url: session.url, sessionId: session.id, mode: "stripe" });
  } catch (err) {
    return NextResponse.json(
      { error: "network", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
