"use client";

import { MessageCircle } from "lucide-react";

interface Props {
  score: number;
  neighborhoodLabel?: string | null;
}

function buildSmsBody(score: number, hood?: string | null): string {
  const place = hood ? ` from ${hood}` : "";
  const status = score >= 76 ? "OUT" : score >= 41 ? "peeking through" : "hiding";
  const line =
    score >= 76
      ? `Mt. Rainier is OUT right now${place} (${score}/100). Look up.`
      : score >= 41
        ? `Mt. Rainier is ${status}${place} — ${score}/100.`
        : `Mt. Rainier is ${status}${place} today (${score}/100).`;
  return `${line} isthemountainout.com`;
}

export default function SmsShareButton({ score, neighborhoodLabel }: Props) {
  const body = buildSmsBody(score, neighborhoodLabel);
  const href = `sms:?&body=${encodeURIComponent(body)}`;

  return (
    <a
      href={href}
      className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-display font-bold text-sm text-white/80 bg-gradient-to-br from-white/[0.08] to-white/[0.04] ring-1 ring-white/[0.12] hover:ring-white/25 transition-all"
      aria-label="Text a friend"
    >
      <MessageCircle className="w-4 h-4 text-white/60 group-hover:text-white/80 transition-colors" />
      <span>Text a friend</span>
    </a>
  );
}
