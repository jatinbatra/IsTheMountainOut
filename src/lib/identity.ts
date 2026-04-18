const USER_KEY = "itmo:userId:v1";
const HANDLE_KEY = "itmo:handle:v1";
const PRO_KEY = "itmo:pro:v1";

export interface LocalPro {
  active: boolean;
  plan: "monthly" | "annual" | "lifetime" | null;
  expiresAt: string | null;
}

function safeLocal(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getUserId(): string {
  const ls = safeLocal();
  if (!ls) return "ssr";
  const existing = ls.getItem(USER_KEY);
  if (existing) return existing;
  const id = (crypto.randomUUID?.() ?? `u_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`);
  ls.setItem(USER_KEY, id);
  return id;
}

export function getHandle(): string {
  const ls = safeLocal();
  return ls?.getItem(HANDLE_KEY) || "";
}

export function setHandle(handle: string): void {
  const ls = safeLocal();
  if (!ls) return;
  const clean = handle.trim().slice(0, 24).replace(/[^\w\-. ]/g, "");
  ls.setItem(HANDLE_KEY, clean);
}

export function getLocalPro(): LocalPro {
  const ls = safeLocal();
  if (!ls) return { active: false, plan: null, expiresAt: null };
  try {
    const raw = ls.getItem(PRO_KEY);
    if (!raw) return { active: false, plan: null, expiresAt: null };
    const parsed = JSON.parse(raw) as LocalPro;
    if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
      ls.removeItem(PRO_KEY);
      return { active: false, plan: null, expiresAt: null };
    }
    return parsed;
  } catch {
    return { active: false, plan: null, expiresAt: null };
  }
}

export function setLocalPro(state: LocalPro): void {
  const ls = safeLocal();
  if (!ls) return;
  try {
    ls.setItem(PRO_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearLocalPro(): void {
  safeLocal()?.removeItem(PRO_KEY);
}
