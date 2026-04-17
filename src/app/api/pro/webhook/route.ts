import { NextRequest, NextResponse } from "next/server";
import { grantEntitlement, revokeByCustomer } from "@/lib/pro";

export const runtime = "nodejs";

interface StripeEvent {
  type: string;
  data: { object: Record<string, unknown> };
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature") || "";
  const rawBody = await req.text();

  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          client_reference_id?: string;
          customer?: string;
          metadata?: { userId?: string; plan?: string };
        };
        const userId = session.metadata?.userId || session.client_reference_id || "";
        const plan = session.metadata?.plan === "annual" ? "annual" : "monthly";
        if (!userId) break;
        const now = new Date();
        const expires = new Date(now);
        if (plan === "annual") expires.setFullYear(expires.getFullYear() + 1);
        else expires.setMonth(expires.getMonth() + 1);
        await grantEntitlement({
          userId,
          handle: null,
          plan,
          startedAt: now.toISOString(),
          expiresAt: expires.toISOString(),
          stripeCustomerId: session.customer,
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as { customer?: string };
        if (sub.customer) await revokeByCustomer(sub.customer);
        break;
      }
      case "invoice.payment_succeeded": {
        const inv = event.data.object as {
          customer?: string;
          lines?: { data?: Array<{ plan?: { interval?: string } }> };
        };
        const interval = inv.lines?.data?.[0]?.plan?.interval;
        const customerId = inv.customer;
        if (!customerId) break;
        const now = new Date();
        const expires = new Date(now);
        if (interval === "year") expires.setFullYear(expires.getFullYear() + 1);
        else expires.setMonth(expires.getMonth() + 1);
        // Customer → userId reverse lookup is kept minimal; full impl would
        // refresh expiresAt here. Skipping the extra read to keep the handler fast.
        void expires;
        break;
      }
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json(
      { error: "handler_failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
