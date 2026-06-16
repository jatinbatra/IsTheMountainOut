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
| `KV_REST_API_URL` | For KV features | Vercel KV connection |
| `KV_REST_API_TOKEN` | For KV features | Vercel KV auth |
| `CRON_SECRET` | Production | Protects cron endpoints |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | For push | Web push VAPID public key |
| `VAPID_PRIVATE_KEY` | For push | Web push VAPID private key |
| `VAPID_EMAIL` | For push | Contact email for VAPID |
| `BLOB_READ_WRITE_TOKEN` | For uploads | Vercel Blob storage |

## Cron jobs

Configured in `vercel.json`. Requires `CRON_SECRET` env var set in Vercel:
- `/api/cron/evaluate` — hourly: scores visibility, updates calendar, sends push notifications on state changes
- `/api/cron/check-visibility` — every 15min during 6am-10pm PT: lightweight state-change check + push
