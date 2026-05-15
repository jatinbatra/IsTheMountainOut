"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";

interface Viewpoint {
  id: string;
  name: string;
  sub: string;
  image: string;
}

interface ViewpointCarouselProps {
  viewpoints: Viewpoint[];
  selectedVp: number;
  onSelectVp: (index: number) => void;
  dataViewpoints: { id: string; locationScore: number }[];
  baseScore: number;
}

export default function ViewpointCarousel({
  viewpoints,
  selectedVp,
  onSelectVp,
  dataViewpoints,
  baseScore,
}: ViewpointCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: direction === "left" ? -220 : 220,
        behavior: "smooth",
      });
    }
  };

  return (
    <div id="section-viewpoints" className="viewpoint-section">
      <div className="viewpoint-glass">
        <button className="carousel-btn" onClick={() => scroll("left")} aria-label="Previous">
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div ref={carouselRef} className="viewpoint-carousel">
          {viewpoints.map((vp, i) => {
            const vpScore = dataViewpoints.find(v => v.id === vp.id)?.locationScore ?? baseScore;
            const vpColor = vpScore >= 70 ? "#5a9e6a" : vpScore >= 50 ? "#d4a373" : "#c47d8a";
            return (
              <motion.button
                key={vp.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className={`viewpoint-item ${selectedVp === i ? "selected" : ""}`}
                onClick={() => onSelectVp(i)}
              >
                <div className={`viewpoint-circle ${selectedVp === i ? "selected" : ""}`}>
                  <div
                    className="absolute inset-0 rounded-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{
                      backgroundImage: `url(${vp.image})`,
                      filter: selectedVp === i ? "none" : "grayscale(0.6) brightness(0.6)",
                    }}
                  />
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: selectedVp === i
                        ? `radial-gradient(circle at 35% 35%, transparent, rgba(15,23,42,0.6))`
                        : `rgba(15,23,42,0.4)`,
                    }}
                  />
                  <div className="absolute inset-0 rounded-full flex items-center justify-center z-10">
                    <MapPin className="w-5 h-5" style={{ color: selectedVp === i ? "var(--accent)" : "white", opacity: selectedVp === i ? 1 : 0.4 }} />
                  </div>
                </div>
                <span className="viewpoint-name">{vp.name}</span>
                <span className="viewpoint-sub">{vp.sub}</span>
              </motion.button>
            );
          })}
        </div>

        <button className="carousel-btn" onClick={() => scroll("right")} aria-label="Next">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
