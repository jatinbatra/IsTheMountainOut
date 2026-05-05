# IsTheMountainOut - V2 Enhancement Roadmap

## Overview
Phase 1-5 deliver a production-ready Mt. Rainier visibility tracker with PNW regional identity, real-time weather data, forecasting, and accessible design. V2 enhancements expand core functionality and deepen engagement.

---

## V2 Enhancement Categories

### 1. **Advanced Visibility Validation**

**User-Submitted Confirmations**
- Real-time mountain visibility verification by community spotters
- Photo upload with timestamp validation
- Confidence scoring based on user history/reputation
- Visual feedback: "X people confirm visible right now"
- API endpoints:
  - `POST /api/spotters/confirm` - Submit visibility confirmation
  - `GET /api/spotters/recent` - Get recent community confirmations

**Webcam Validation**
- Automated image analysis to detect Mt. Rainier in webcam feeds
- Confidence percentage overlay on each webcam
- Historical comparison (is Rainier visible more/less often than predicted?)
- Integration with existing WEBCAM_FEEDS

---

### 2. **Personalization & Favorites**

**User Accounts (Optional)**
- Save favorite viewpoints (localStorage or optional auth)
- Custom neighborhood selection (persist via URL or storage)
- Notification preferences per location
- Historical tracking: "You've checked [N] times, mountain was out [X%]"

**Location-Aware Defaults**
- Geolocation on first visit (already integrated)
- Remember last selected neighborhood
- Suggest "trending" viewpoints based on current conditions

---

### 3. **Notification System**

**Push Notifications**
- "Mountain is out now!" (threshold-based, configurable)
- "Best visibility window: Today 10am-2pm" (forecast alerts)
- "Rare clear night" (alpenglow + clear skies)
- Quiet hours setting (no notifications 10pm-7am)
- API endpoint: `POST /api/subscribe` (already wired)

**Email Digest**
- Weekly summary: "Mountain was visible 4 out of 7 days"
- Best viewing windows for next week
- Regional spotlight: "Tacoma had clearest views this week"
- Opt-in via newsletter signup

---

### 4. **Regional Explorer**

**Multi-Viewpoint Comparison**
- Side-by-side visibility scores for different regions
- "Best view right now" banner showing optimal location
- Heatmap animation: which neighborhoods see the most mountain days?
- Historical: "Bellevue is [X%] more likely to have clear views than downtown"

**Regional Spotlights**
- "Snoqualmie Pass rarely gets views — why?" (atmospheric science explainer)
- "Kerry Park had the best year on record (82% visibility)"
- Seasonal patterns by neighborhood

---

### 5. **Educational Content**

**"Why" Explainer Panels**
- Expand algorithm breakdown (currently hidden)
- Show actual sensor data: cloud layers, humidity, particulates
- Animated diagrams: cloud layers + light scattering
- Link to relevant NOAA science articles

**Mountain Moments (Enhance)**
- Curated photos from archive (already exists)
- User-submitted "best sighting" stories (with photo)
- Geotag mapping: "Submitted from Kerry Park, September 2024"
- AI-generated caption: "Alpenglow effect, 87% visibility"

---

### 6. **Gamification**

**Streak System (Enhance)**
- Current: global streak display
- Expand: personal streaks ("Visited Kerry Park 12 consecutive clear days")
- Achievements: "Spotted in 8 neighborhoods", "10 confirmedAlpenglow events"
- Leaderboards: "Most confirmed visibility reports this month" (privacy-respecting)

**Predictions vs Reality**
- "You correctly predicted 87% of clear hours this month"
- Calibration score: are your visual checks aligned with the algorithm?

---

### 7. **API Expansion**

**Developer-Friendly Endpoints**
- `GET /api/viewpoints` - Full viewpoint database
- `GET /api/historical?date=YYYY-MM-DD` - Historical scores
- `GET /api/regions?region=seattle` - Regional aggregates
- `POST /api/custom-location?lat=X&lon=Y` - Score any location
- WebSocket: `/ws/live-updates` - Real-time score changes

**Public Data Export**
- CSV historical data (download last 30 days)
- iCalendar feed: "Mountain out" events
- RSS feed: daily summaries

---

### 8. **Mobile Enhancements**

**Offline Support**
- Cache last 24h of forecasts (already via SWR)
- Show "cached at 2:15pm" with disclaimer
- Sync on reconnect

**Home Screen App**
- Pinned score on lock screen via PWA (Web App Manifest)
- Quick action: "Open Kerry Park visibility"
- Shortcut to SMS share

**Native App (Future)**
- React Native port
- Apple Watch: tiny Mountain Status
- iOS/Android native notifications

---

### 9. **Social Integration**

**Shareable Moments**
- "Mountain is out 🏔️ 87 at Kerry Park (10am-3pm clear) - Can you see it?"
- Auto-generated share card (og:image with current score + season colors)
- Track shares (via `?ref=twitter` UTM params)

**Social Proof**
- Tweet embeds: real-time spotter confirmations
- Bsky feed integration (decentralized alternative)

---

### 10. **Accessibility Audit & Testing**

**Comprehensive WCAG 2.1 AA Compliance**
- Color contrast verification (contrast ratio >= 4.5:1)
- Keyboard navigation testing (all interactive elements focusable)
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Mobile accessibility (touch targets >= 44px)
- Automated CI checks (axe-core)

**Internationalization (i18n)**
- Spanish, Mandarin Chinese, Japanese (common PNW languages)
- RTL language support
- Timezone-aware times (not hardcoded to PT)

---

### 11. **Performance Optimization**

**Build-Time Optimizations**
- Static generation for homepage (ISR: revalidate every 15min)
- Image optimization: next/image with srcset
- Bundle analysis: audit dependency sizes
- Code splitting: lazy load modal components

**Runtime Optimizations**
- Component-level memoization (React.memo for expensive renders)
- Virtual scrolling for long lists (viewpoint history)
- Service Worker caching strategy (Workbox integration)
- CDN edge caching for API responses (Vercel Cache-Control headers)

**Monitoring**
- Web Vitals tracking: LCP, FID, CLS (via Vercel Analytics)
- Error boundary: graceful fallback if API down
- Sentry integration: production error logging

---

### 12. **Analytics & Insights**

**User Analytics**
- Track: most-visited viewpoints, peak usage hours, favorite neighborhoods
- Heatmap: which time of day do users check visibility?
- Cohort: retention of repeat visitors

**Product Insights**
- A/B test: "Mountain is out" vs "Peak is clear" messaging
- Feature adoption: how many users enable notifications?
- Success metric: did the visitor go outside after checking?

---

## Implementation Priority

### High Priority (Q3 2026)
1. User-submitted confirmations (validates algorithm, builds community)
2. Push notifications (engagement driver)
3. Offline support (reliability)
4. WCAG 2.1 AA audit + fixes (compliance + inclusivity)

### Medium Priority (Q4 2026)
5. Regional explorer (education + discovery)
6. Personalization (retention)
7. API expansion (developer ecosystem)
8. Performance audit + optimization (scale)

### Future/Nice-to-Have
9. Gamification expansions
10. Native mobile app
11. Social integration
12. Internationalization

---

## Success Metrics

- **Engagement**: 40%+ of weekly visitors enable notifications
- **Community**: 100+ confirmed spotter reports per month
- **Reliability**: 99.9% API uptime, <500ms response time
- **Accessibility**: WCAG 2.1 AA compliance, 100% keyboard navigable
- **Performance**: Lighthouse score 95+, Core Web Vitals "Good"
- **Adoption**: 500+ unique daily visitors by end of 2026

---

## Technical Debt to Address

1. Refactor `Dashboard.tsx` into smaller components (currently 400+ lines)
2. Type safety: migrate from `any` types to strict TypeScript
3. Testing: add unit tests for `visibility.ts`, `forecast.ts`, `seasonal.ts`
4. E2E tests: Playwright/Cypress for critical user flows
5. Logging: structured logging for debugging (winston/pino)
6. Database: migrate from Vercel KV to proper time-series DB (for historical data)

---

## Questions for Product

1. Should we allow user accounts, or keep everything pseudo-anonymous + localStorage?
2. Would you want to monetize (sponsorship, premium features) or keep free?
3. What's the geographic expansion plan? (Seattle only, or PNW-wide, or national?)
4. Should we build toward a native mobile app eventually?
5. Any partnerships with local outdoor brands or tourism boards?
