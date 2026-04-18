import { kv } from "@vercel/kv";

export interface ProEntitlement {
  userId: string;
  handle: string | null;
  plan: "monthly" | "annual" | "lifetime";
  startedAt: string;
  expiresAt: string | null;
  stripeCustomerId?: string;
}

const USER_KEY = (userId: string) => `pro:user:${userId}`;
const CUSTOMER_KEY = (customerId: string) => `pro:customer:${customerId}`;

export async function getEntitlement(userId: string): Promise<ProEntitlement | null> {
  if (!userId) return null;
  try {
    const ent = await kv.get<ProEntitlement>(USER_KEY(userId));
    if (!ent) return null;
    if (ent.expiresAt && new Date(ent.expiresAt) < new Date()) return null;
    return ent;
  } catch {
    return null;
  }
}

export async function grantEntitlement(ent: ProEntitlement): Promise<void> {
  try {
    await kv.set(USER_KEY(ent.userId), ent);
    if (ent.stripeCustomerId) {
      await kv.set(CUSTOMER_KEY(ent.stripeCustomerId), ent.userId);
    }
  } catch (err) {
    console.warn("[Pro] grant failed:", err);
  }
}

export async function revokeByCustomer(stripeCustomerId: string): Promise<void> {
  try {
    const userId = await kv.get<string>(CUSTOMER_KEY(stripeCustomerId));
    if (!userId) return;
    await kv.del(USER_KEY(userId));
  } catch (err) {
    console.warn("[Pro] revoke failed:", err);
  }
}

export const PRO_PRICING = {
  monthly: { amount: 399, label: "$3.99/mo", interval: "month" as const },
  annual: { amount: 2400, label: "$24/yr", interval: "year" as const },
};
