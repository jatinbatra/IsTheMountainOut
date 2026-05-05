# IsTheMountainOut - Architecture & Design

## Overview

**IsTheMountainOut** is a real-time Mt. Rainier visibility tracker for Seattle/PNW with seasonal theming, community spotting, and forecasting. Built with Next.js 16, React 19, TypeScript, and TailwindCSS v4.

---

## Core Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16.2 (App Router) | React framework with server/client components |
| **UI Framework** | TailwindCSS v4 | Utility-first CSS with custom theme variables |
| **Language** | TypeScript 5 | Type-safe React components |
| **Data Fetching** | SWR 2.4 | React hooks for data fetching with caching |
| **Icons** | Lucide React | SVG icon library |
| **Storage** | Vercel KV | Serverless Redis for sessions/analytics |
| **Hosting** | Vercel | Next.js-optimized serverless platform |

### Project Structure

```
src/
├── app/
│   ├── api/                           # API routes (Next.js server functions)
│   │   ├── mountain-status/route.ts   # Main visibility API (15min cache)
│   │   ├── visibility/route.ts        # Location-specific scores
│   │   ├── forecast/route.ts          # 6-12h hourly + best window
│   │   ├── beacon/route.ts            # Telemetry (neighborhood tracking)
│   │   ├── subscribe/route.ts         # Notification signup
│   │   └── ...                        # 18 total endpoints
│   ├── globals.css                    # PNW seasonal theme + animations
│   ├── layout.tsx                     # Root layout with theme injection
│   └── page.tsx                       # Home page (hydrates Dashboard)
│
├── components/                        # React UI components
│   ├── Dashboard.tsx                  # Main layout (feeds all sections)
│   ├── MountainSilhouetteScore.tsx    # SVG mountain + score display (memoized)
│   ├── ViewpointMap.tsx               # Topographic heatmap
│   ├── ForecastHub.tsx                # Forecast tabs (24h/7-day/calendar)
│   ├── ForecastTimeline.tsx           # Hourly timeline chart
│   ├── ViewpointCard.tsx              # Individual viewpoint card
│   ├── NeighborhoodSelector.tsx       # Dropdown with scores
│   ├── WeatherDetails.tsx             # Cloud/humidity/AQ breakdown
│   ├── LiveWebcams.tsx                # Embedded camera feeds
│   ├── MountainMoment.tsx             # Share with context
│   ├── NextClearWindow.tsx            # Peak visibility prediction
│   ├── AlpenglowAlert.tsx             # Sunset glow indicator
│   └── ...                            # 25+ total components
│
├── lib/                               # Business logic & utilities
│   ├── seasonal.ts                    # 4-season color palette system
│   ├── visibility.ts                  # Core visibility scoring algorithm
│   ├── weather.ts                     # Open-Meteo API + mock data
│   ├── forecast.ts                    # Clear window detection
│   ├── viewpoints.ts                  # Iconic Seattle locations
│   ├── sky.ts                         # Sky theme coloring
│   ├── alpenglow.ts                   # Sunset glow prediction
│   ├── animations.ts                  # Animation utilities (easing, parallax)
│   ├── a11y.ts                        # WCAG 2.1 AA utilities
│   ├── performance.ts                 # Debounce, throttle, Web Vitals
│   ├── scheduler.ts                   # Data refresh & retry logic
│   ├── notifications.ts               # Service Worker registration
│   ├── webcams.ts                     # Webcam feed metadata
│   └── ...                            # 20+ total utilities
│
└── hooks/                             # Custom React hooks
    ├── useScrollReveal.tsx            # Fade-in on scroll
    ├── useAutoLocation.tsx            # Geolocation detection
    └── useAmbientColor.tsx            # Sky color extraction

.claude/settings.json                  # Claude Code configuration
tsconfig.json                          # TypeScript strict mode
tailwind.config.ts                     # TailwindCSS theme + typography
next.config.js                         # Next.js middleware + rewrites
package.json                           # Dependencies (minimal, fast install)
V2_ENHANCEMENTS.md                     # Roadmap for future features
```

---

## Data Flow

### Real-Time Visibility Score

```
User visits isthemountainout.com
       ↓
Dashboard component mounts
       ↓
SWR fetches /api/mountain-status (with fallback initialData)
       ↓
API route fetches weather data:
   ├─ Open-Meteo weather API (clouds, visibility, temp)
   ├─ Open-Meteo air quality API (PM2.5, PM10)
   └─ Fallback: mock data if APIs unreachable
       ↓
calculateVisibility() processes raw weather:
   ├─ Low clouds: 40% weight (most critical)
   ├─ Mid/high clouds: 20% + 10% weight
   ├─ Visibility distance: 20% weight
   └─ Air quality (PM2.5): 10% weight
       ↓
Result: { score: 0-100, isVisible: boolean, confidence: string }
       ↓
Dashboard renders:
   ├─ MountainSilhouetteScore (height = score %)
   ├─ Seasonal status ("CLEAR PEAK", "POWDER CAP", etc.)
   └─ Weather strip (clouds, visibility, temp, wind, PM2.5)
       ↓
Auto-refresh via SWR every 15 minutes
```

### Neighborhood Adjustment

```
User selects neighborhood from dropdown (e.g., "Queen Anne")
       ↓
getNeighborhoodAdjustedScore() applies modifiers:
   ├─ Elevation bonus (Queen Anne: +8)
   ├─ Fog penalty (Queen Anne: -2 if humidity > 85%)
   └─ Obstruction penalty (Queen Anne: -3)
       ↓
Displays adjusted score + updates all downstream UI
       ↓
NeighborhoodSelector shows score distribution across all hoods
```

### Forecast Timeline

```
GET /api/mountain-status includes hourlyForecast (24 hours)
       ↓
ForecastHub receives array of hourly points with scores
       ↓
findNextClearWindow() locates best 2+ hour visibility window
       ↓
Returns:
   ├─ startTime / endTime
   ├─ peakScore (highest score in window)
   ├─ durationHours
   └─ humanReadable description ("Today 10am–2pm")
       ↓
NextClearWindow card displays forecast at top of dashboard
```

---

## Visibility Scoring Algorithm

**Core Formula**: Weighted sum of atmospheric factors (0-100)

```typescript
score = 0
score += 40 * (1 - cloudLow / 100)          // Low clouds (0-2km)
score += 20 * (1 - cloudMid / 100)          // Mid clouds (2-6km)
score += 10 * (1 - cloudHigh / 100)         // High clouds (6km+)
score += 20 * (visibility / TARGET_VISIBILITY) // Haze / fog (90km target)
score += 10 * (1 - pm25 / PM25_FULL_PENALTY) // Air quality
score -= weatherPenalty(code)               // Rain/snow/showers (-15 to -25)

// Thresholds
isVisible = score >= 50
confidence = score >= 80 ? "high" : score >= 60 ? "moderate" : "low"
```

**Why This Works**:
- Low clouds directly block peak view → heaviest weight (40%)
- Mid/high clouds secondary obscuration → 30% combined
- Visibility accounts for haze/fog → 20%
- PM2.5 creates visual haze → 10%
- Weather codes (rain/snow) are explicit blockers → fixed penalties

**Validation**: Tested against community spotter reports, webcam footage, user feedback.

---

## Seasonal Color System

Each season maps to a distinct PNW palette automatically detected from current month:

| Season | Months | Accent | Mountain | Water | Feeling |
|--------|--------|--------|----------|-------|---------|
| **Spring** | Feb-Apr | Mauve (#9D4E6C) | Brown (#8a7060) | Cool (#6B8EBF) | Emerging, fresh |
| **Summer** | May-Jul | Deep Green (#2d5016) | Tan (#7a6b55) | Sky Blue (#4A90E2) | Clear, established |
| **Fall** | Aug-Oct | Rust (#6B4423) | Dark Brown (#5c4020) | Amber (#8B6A47) | Golden hour |
| **Winter** | Nov-Jan | Cool Slate (#3A4A5A) | Dark Gray (#4a4a5a) | Slate (#4A5A7A) | Powder cap |

**Implementation**: CSS custom properties injected at runtime
```css
:root {
  --season-accent: #2d5016;              /* Updated per season */
  --season-mountain-base: #7a6b55;
  --season-mountain-snow: #f8f8f5;
  /* All components reference these vars */
}
```

**Regional Language**: Seasonal status updates
- Summer + visible: "CLEAR PEAK"
- Fall + visible: "GOLDEN HOUR"
- Winter + visible: "POWDER CAP"
- Winter + hidden: "WINTER STORMS"

---

## Performance Optimizations

### Render Optimization
- **Memoization**: MountainSilhouetteScore wrapped in React.memo (expensive SVG)
- **Component splitting**: Each section in Dashboard is independently scrollable
- **useCallback**: handlers in Dashboard prevent child re-renders
- **useMemo**: neighborhood scores computed once per humidity/score change

### Data Fetching
- **SWR caching**: 15-minute refresh interval with fallback data
- **API caching**: 15-minute server-side cache via `revalidate: 900`
- **Mock data**: Fallback when APIs unreachable (development friendly)
- **Exponential backoff**: Retries failed requests with increasing delays

### CSS/Styling
- **Fluid typography**: No media queries needed (uses `clamp()`)
- **CSS variables**: Theme colors swapped at runtime, not rebuilt
- **TailwindCSS v4**: Minimal CSS output (~30KB gzipped)
- **Pattern overlays**: SVG patterns instead of raster images

### Bundle Size
- No Map library (custom SVG heat map instead of Mapbox)
- No date library (use native `Date` + `.toLocaleTimeString()`)
- No charting library (custom SVG bar chart in ForecastTimeline)
- Only essential dependencies: React, Next, SWR, Lucide, TailwindCSS

---

## Accessibility

### WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|-----------------|
| **Color Contrast** | 4.5:1+ for all text; utilities in `a11y.ts` |
| **Keyboard Nav** | All interactive elements focusable; arrow keys in dropdowns |
| **Screen Readers** | Semantic HTML; ARIA labels on icons; live regions for updates |
| **Motion** | `prefers-reduced-motion` respected; animations disabled if set |
| **Focus Visible** | Outline visible on all focused elements |
| **Form Labels** | All inputs have associated labels |
| **Alt Text** | Images have descriptions; SVGs have aria-label |

### Testing Checklist
- [ ] Lighthouse accessibility score 95+
- [ ] Tested with VoiceOver (Mac) / NVDA (Windows)
- [ ] Keyboard-only navigation works
- [ ] Color contrast verified (axe-core)
- [ ] Tested with `prefers-reduced-motion: reduce`

---

## Deployment

### Vercel (Current)

```bash
git push origin main  # Auto-deploys via GitHub integration
```

**Build**: Next.js build → static + serverless functions
**Cache**: 15-minute API cache headers; SWR client-side cache
**Performance**: Edge middleware possible for redirects/auth

### Environment Variables

```bash
# .env.local (development)
# Open-Meteo APIs don't require keys (free tier)

# Deployment (Vercel)
# VERCEL_ENV=production (automatic)
```

---

## Testing Strategy

### Unit Tests (Future)
```typescript
// src/lib/__tests__/visibility.test.ts
describe("visibility scoring", () => {
  it("should score clear day as visible", () => {
    const result = calculateVisibility({
      currentCloudLow: 10,
      currentCloudMid: 5,
      currentCloudHigh: 0,
      visibility: 80000,
      // ...
    });
    expect(result.score).toBeGreaterThan(70);
  });
});
```

### E2E Tests (Future)
```typescript
// e2e/visibility.spec.ts (Playwright)
test("should display current mountain visibility", async ({ page }) => {
  await page.goto("/");
  const score = await page.locator("[aria-label='Current score']");
  await expect(score).toContainText(/\d+/);
});
```

### Manual Testing
- [ ] Desktop (Chrome, Safari, Firefox)
- [ ] Mobile (iOS Safari, Chrome Android)
- [ ] Slow network (Chrome DevTools 3G)
- [ ] Offline mode
- [ ] Seasonal theme toggle (via time)
- [ ] All API endpoints (curl tests)

---

## Future Considerations

### V2 Features
See `V2_ENHANCEMENTS.md` for detailed roadmap including:
- User confirmations (community validation)
- Push notifications
- Advanced analytics
- Regional explorer
- Internationalization

### Technical Debt
- Refactor Dashboard into 5-10 smaller components (currently 400 lines)
- Add unit test coverage (target: 80% statements)
- Migrate to proper time-series DB (InfluxDB, TimescaleDB) for analytics
- Structured logging (Winston/Pino) for production debugging
- Error boundary + Sentry integration for production monitoring

### Infrastructure
- Cron job (GitHub Actions or Vercel Cron) to warm cache before peak hours
- CDN prefetch for API responses
- Database for user preferences (future auth)
- Message queue for background tasks (notifications, email)

---

## Contributing

### Coding Standards
- TypeScript strict mode (no `any`)
- React hooks only (no class components)
- Semantic HTML (no div-itis)
- TailwindCSS utility classes (no custom CSS unless necessary)
- Accessibility-first mindset

### Adding a New Feature
1. Create component in `src/components/`
2. Add API endpoint in `src/app/api/` if needed
3. Add utilities to `src/lib/` if logic is shared
4. Test with accessibility tools (axe, VoiceOver)
5. Test on mobile (responsive preview)
6. Update types in interfaces
7. Add to appropriate section in Dashboard
8. Commit with semantic message

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [TailwindCSS v4](https://tailwindcss.com/docs)
- [SWR Docs](https://swr.vercel.app)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Open-Meteo API](https://open-meteo.com/en/docs)
- [Web Vitals](https://web.dev/vitals/)

---

**Last Updated**: May 2026  
**Maintained By**: Jatin Batra (@jatin_batra1)
