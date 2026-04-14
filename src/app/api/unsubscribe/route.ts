import { NextResponse } from "next/server";
import { removeEmailSubscriber } from "@/lib/channels/email";
import { removePushSubscription } from "@/lib/channels/push";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const value = searchParams.get("value");

  if (!type || !value) {
    return NextResponse.json({ error: "Missing type or value" }, { status: 400 });
  }

  try {
    if (type === "email") {
      await removeEmailSubscriber(value);
    } else if (type === "push") {
      await removePushSubscription(value);
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Return a simple HTML page for email unsubscribe links
    return new Response(
      `<!DOCTYPE html>
      <html><body style="background:#0a0e1a;color:#e2e8f0;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
        <div style="text-align:center;">
          <h1 style="font-size:24px;">Unsubscribed</h1>
          <p style="color:#94a3b8;">You won't receive any more alerts.</p>
          <a href="/" style="color:#60a5fa;">Back to Is The Mountain Out?</a>
        </div>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err) {
    console.warn("[Unsubscribe] Error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
