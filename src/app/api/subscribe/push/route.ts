import { NextResponse } from "next/server";
import { addPushSubscription } from "@/lib/channels/push";

export async function POST(request: Request) {
  try {
    const { subscription } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Valid push subscription is required" }, { status: 400 });
    }

    await addPushSubscription(subscription);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.warn("[Subscribe/Push] Error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
