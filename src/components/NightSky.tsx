"use client";

import { useEffect, useRef, useState } from "react";
import { Sunrise, Moon, Star } from "lucide-react";

interface Props {
  sunrise: string;
  isDay: boolean;
}

interface StarData {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

function generateStars(count: number): StarData[] {
  const stars: StarData[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 0.5 + Math.random() * 2.5,
      brightness: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 2 + Math.random() * 4,
      twinkleOffset: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

// Constellations visible from Seattle (approximate positions)
const CONSTELLATIONS = [
  {
    name: "Ursa Major",
    nickname: "Big Dipper",
    stars: [
      [22, 18], [26, 15], [30, 14], [35, 16],
      [37, 20], [42, 22], [45, 18],
    ] as [number, number][],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3]] as [number,number][],
  },
  {
    name: "Cassiopeia",
    nickname: "The W",
    stars: [
      [62, 12], [66, 8], [70, 14], [74, 7], [78, 13],
    ] as [number, number][],
    lines: [[0,1],[1,2],[2,3],[3,4]] as [number,number][],
  },
  {
    name: "Orion",
    nickname: "The Hunter",
    stars: [
      [15, 55], [22, 52], [18, 62], [20, 66], [22, 62],
      [18, 72], [22, 75],
    ] as [number, number][],
    lines: [[0,2],[1,4],[2,3],[3,4],[2,5],[4,6]] as [number,number][],
  },
  {
    name: "Polaris",
    nickname: "North Star",
    stars: [[48, 8]] as [number, number][],
    lines: [] as [number,number][],
  },
];

export default function NightSky({ sunrise, isDay }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [stars] = useState(() => generateStars(120));
  const [showConstellation, setShowConstellation] = useState<number | null>(null);
  const [timeToSunrise, setTimeToSunrise] = useState("");

  // Calculate time to sunrise
  useEffect(() => {
    function updateCountdown() {
      if (!sunrise) return;

      const now = new Date();
      let sunriseDate = new Date(sunrise);

      // If sunrise has passed today, calculate for tomorrow
      if (sunriseDate <= now) {
        sunriseDate = new Date(sunriseDate.getTime() + 24 * 60 * 60 * 1000);
      }

      const diff = sunriseDate.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeToSunrise(`${hours}h ${minutes}m`);
      } else {
        setTimeToSunrise(`${minutes}m`);
      }
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [sunrise]);

  // Mouse parallax
  function handleMouseMove(e: React.MouseEvent) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  }

  // Don't render during day
  if (isDay) return null;

  const parallaxX = (mousePos.x - 50) * 0.03;
  const parallaxY = (mousePos.y - 50) * 0.03;

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 ring-1 ring-indigo-400/15">
            <Moon className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              Night Sky over Seattle
            </h2>
            <p className="text-[11px] text-white/25 font-medium mt-0.5">
              Move your cursor to look around. Tap constellations to identify them.
            </p>
          </div>
        </div>
        {timeToSunrise && (
          <div className="flex items-center gap-2 glass-strong rounded-xl px-3.5 py-2">
            <Sunrise className="w-3.5 h-3.5 text-amber-400/60" />
            <div className="text-right">
              <div className="text-[10px] text-white/25 uppercase tracking-wider font-medium">Sunrise in</div>
              <div className="font-display text-sm font-bold text-amber-300/80">{timeToSunrise}</div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive sky canvas */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative w-full aspect-[2/1] rounded-3xl overflow-hidden ring-1 ring-white/[0.06] cursor-crosshair select-none"
        style={{
          background: "linear-gradient(180deg, #050510 0%, #0a0a2e 30%, #121240 60%, #1a1a4a 80%, #0d1b2a 100%)",
        }}
      >
        {/* Aurora shimmer */}
        <div
          className="absolute top-0 left-0 right-0 h-[40%] opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 50% at ${45 + parallaxX}% ${20 + parallaxY}%, rgba(34, 197, 94, 0.08) 0%, transparent 70%),
                         radial-gradient(ellipse 60% 40% at ${60 + parallaxX}% ${15 + parallaxY}%, rgba(99, 102, 241, 0.06) 0%, transparent 70%)`,
            transition: "background 0.3s ease-out",
          }}
        />

        {/* Background stars (parallax layer 1 - slow) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{
            transform: `translate(${parallaxX * 0.3}%, ${parallaxY * 0.3}%)`,
            transition: "transform 0.4s ease-out",
          }}
        >
          {stars.slice(0, 60).map((star, i) => (
            <circle
              key={`bg-${i}`}
              cx={star.x}
              cy={star.y}
              r={star.size * 0.4}
              fill="white"
              opacity={star.brightness * 0.4}
            >
              <animate
                attributeName="opacity"
                values={`${star.brightness * 0.2};${star.brightness * 0.5};${star.brightness * 0.2}`}
                dur={`${star.twinkleSpeed}s`}
                begin={`${star.twinkleOffset}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </svg>

        {/* Foreground stars (parallax layer 2 - faster) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{
            transform: `translate(${parallaxX * 0.8}%, ${parallaxY * 0.8}%)`,
            transition: "transform 0.3s ease-out",
          }}
        >
          {stars.slice(60).map((star, i) => (
            <circle
              key={`fg-${i}`}
              cx={star.x}
              cy={star.y}
              r={star.size * 0.6}
              fill="white"
              opacity={star.brightness * 0.7}
            >
              <animate
                attributeName="opacity"
                values={`${star.brightness * 0.4};${star.brightness * 0.8};${star.brightness * 0.4}`}
                dur={`${star.twinkleSpeed}s`}
                begin={`${star.twinkleOffset}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </svg>

        {/* Constellations (interactive layer) */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{
            transform: `translate(${parallaxX * 0.6}%, ${parallaxY * 0.6}%)`,
            transition: "transform 0.35s ease-out",
          }}
        >
          {CONSTELLATIONS.map((constellation, ci) => (
            <g
              key={ci}
              className="cursor-pointer"
              onClick={() => setShowConstellation(showConstellation === ci ? null : ci)}
            >
              {/* Connection lines */}
              {constellation.lines.map(([a, b], li) => (
                <line
                  key={`line-${li}`}
                  x1={constellation.stars[a][0]}
                  y1={constellation.stars[a][1]}
                  x2={constellation.stars[b][0]}
                  y2={constellation.stars[b][1]}
                  stroke="white"
                  strokeWidth="0.15"
                  opacity={showConstellation === ci ? 0.4 : 0.08}
                  style={{ transition: "opacity 0.5s ease" }}
                />
              ))}

              {/* Stars */}
              {constellation.stars.map(([sx, sy], si) => (
                <g key={`star-${si}`}>
                  {/* Glow */}
                  <circle
                    cx={sx}
                    cy={sy}
                    r={1.2}
                    fill="white"
                    opacity={showConstellation === ci ? 0.15 : 0.05}
                    style={{ transition: "opacity 0.5s ease" }}
                  />
                  {/* Star point */}
                  <circle
                    cx={sx}
                    cy={sy}
                    r={0.5}
                    fill="white"
                    opacity={showConstellation === ci ? 0.9 : 0.5}
                    style={{ transition: "opacity 0.5s ease" }}
                  />
                  {/* Hit area */}
                  <circle
                    cx={sx}
                    cy={sy}
                    r={2}
                    fill="transparent"
                  />
                </g>
              ))}

              {/* Label */}
              {showConstellation === ci && (
                <g>
                  <text
                    x={constellation.stars[0][0]}
                    y={constellation.stars[0][1] - 3}
                    fill="white"
                    fontSize="2"
                    fontFamily="var(--font-display)"
                    fontWeight="600"
                    opacity="0.7"
                    textAnchor="middle"
                  >
                    {constellation.name}
                  </text>
                  <text
                    x={constellation.stars[0][0]}
                    y={constellation.stars[0][1] - 1}
                    fill="white"
                    fontSize="1.2"
                    fontFamily="var(--font-sans)"
                    opacity="0.35"
                    textAnchor="middle"
                  >
                    {constellation.nickname}
                  </text>
                </g>
              )}
            </g>
          ))}
        </svg>

        {/* Mountain silhouette at bottom */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full pointer-events-none"
          viewBox="0 0 1000 200"
          preserveAspectRatio="none"
          style={{ height: "30%" }}
        >
          <defs>
            <linearGradient id="nightMountainGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a0a1a" />
              <stop offset="100%" stopColor="#050510" />
            </linearGradient>
          </defs>
          {/* Distant range */}
          <path
            d="M0 140 L50 120 L100 130 L160 100 L200 115 L250 90 L300 110 L350 95 L400 85 L430 70 L460 55 L480 45 L500 38 L520 45 L540 55 L560 65 L580 78 L610 90 L650 100 L700 110 L750 105 L800 115 L850 100 L900 110 L950 120 L1000 115 L1000 200 L0 200 Z"
            fill="url(#nightMountainGrad)"
          />
          {/* Snow cap hint */}
          <path
            d="M445 60 L460 50 L475 43 L490 38 L505 35 L520 38 L535 43 L548 50 L555 58 L540 52 L525 48 L510 45 L495 48 L480 52 L465 58 Z"
            fill="#1a1a2e"
            opacity="0.6"
          />
        </svg>

        {/* Corner info */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[11px] text-white/20 pointer-events-none">
          <Star className="w-3 h-3" />
          <span>Seattle, WA &middot; 47.6&deg;N</span>
        </div>
      </div>

      <p className="text-[11px] text-white/15 text-center font-medium">
        The mountain is still out there. Check back after sunrise.
      </p>
    </section>
  );
}
