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

## Telemetry & validation

Each logged reading also stores its full signal snapshot (`src/lib/telemetry.ts`): every raw input (cloud layers, visibility, PM2.5/PM10, humidity, temperature, wind, weather code), the per-factor points and cloud ceiling, the model's +1h/+3h/+6h forecast made at that moment, live "I see it" sightings, the model version, and input QA results (missing fields, out-of-range values, stale data, inconsistent fields).

- `GET /api/telemetry?date=YYYY-MM-DD&days=N&format=csv|json` — export (up to 31 days).
- `GET /api/validation?days=7` — forecast accuracy per horizon (mean abs error, bias, out/hidden hit rate) scored against what was later logged, agreement with community sightings, input data quality, and logging coverage.

## Scheduled jobs

- **No Vercel crons**: `crons` in `vercel.json` made every production deployment on this account fail (hourly schedules fail on Hobby, and even a daily one failed production), so scheduling lives in GitHub Actions instead.
- **GitHub Actions heartbeat** (`.github/workflows/heartbeat.yml`): every 15 minutes, pings `/api/mountain-status` so the log fills in with no visitors, and calls `/api/cron/evaluate` (push alerts) when the `CRON_SECRET` repo secret is set.
