import { NextResponse } from "next/server";
import { addEmailSubscriber } from "@/lib/channels/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    await addEmailSubscriber(email.toLowerCase().trim());

    return NextResponse.json({ success: true });
  } catch (err) {
    console.warn("[Subscribe/Email] Error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
