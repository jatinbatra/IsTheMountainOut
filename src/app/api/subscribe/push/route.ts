import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function POST(request: Request) {
  try {
    const { subscription } = await request.json();

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    await kv.hset("push:subscriptions", {
      [subscription.endpoint]: JSON.stringify(subscription),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Push] Subscribe failed:", err);
    return NextResponse.json({ error: "Subscribe failed" }, { status: 500 });
  }
}
