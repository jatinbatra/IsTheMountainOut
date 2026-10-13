# Is the Mountain Out?

Real-time Mt. Rainier visibility tracker for Seattle. No ads, no accounts, no third-party trackers.

**Live:** [is-the-mountain-out.vercel.app](https://is-the-mountain-out.vercel.app)

## Stack

Next.js 16 (App Router), React 19, TypeScript, TailwindCSS v4, Framer Motion, SWR, Vercel KV, web-push.

## How it works

Weighted composite score (0-100) from Open-Meteo weather data: low clouds (40pts), mid clouds (20pts), visibility distance (20pts), high clouds (10pts), air quality (10pts), with penalties for fog/rain/snow. Score >= 50 = visible. Per-viewpoint and per-neighborhood adjustments for elevation, obstruction, and distance.

## Development

```bash
npm install
npm run dev
```

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `KV_REST_API_URL` | For history/analytics | Redis (Vercel KV / Upstash) connection |
| `KV_REST_API_TOKEN` | For history/analytics | Redis auth |
| `CRON_SECRET` | For push alerts | Protects `/api/cron/evaluate` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | For push | Web push VAPID public key |
| `VAPID_PRIVATE_KEY` | For push | Web push VAPID private key |
| `VAPID_EMAIL` | For push | Contact email for VAPID |

## Mountain log (history)

Every server path that computes live visibility (the status API the dashboard polls, the page render, the cron) records the reading via `src/lib/history.ts`. Each 15-minute slot is claimed with `HSETNX`, so only one reading per slot is stored no matter the traffic, and the daily summary / change log update at most once per slot. `/api/history` serves the last 24h, 30-day record, change log, and stats; the dashboard's **Mountain Log** section renders it. Without `KV_REST_API_*` set, logging is skipped and the UI says storage isn't connected.

## Scheduled jobs

- **Vercel cron** (`vercel.json`): `/api/cron/evaluate` once a day. The Hobby plan only allows daily crons — a more frequent schedule makes every deployment fail.
- **GitHub Actions heartbeat** (`.github/workflows/heartbeat.yml`): every 15 minutes, pings `/api/mountain-status` so the log fills in with no visitors, and calls `/api/cron/evaluate` (push alerts) when the `CRON_SECRET` repo secret is set.
