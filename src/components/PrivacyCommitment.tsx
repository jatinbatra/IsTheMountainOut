"use client";

const CHIPS = [
  "No ads",
  "No cookies",
  "No accounts",
  "No personal data",
  "No third-party trackers",
];

export default function PrivacyCommitment() {
  return (
    <div
      className="border-t border-gray-200 pt-5"
      role="note"
      aria-label="Privacy commitment"
    >
      <p className="ticker text-[#2d8a4e] mb-2">
        Private by design
      </p>
      <p className="text-sm text-[color:var(--type-2)] font-display font-light leading-snug">
        Just a weather app. We keep an anonymous on-device ID to count visits and
        sightings — no names, no emails, no third-party trackers, ever.
      </p>
      <ul className="flex flex-wrap gap-1.5 mt-3" aria-label="What we don't do">
        {CHIPS.map((chip) => (
          <li
            key={chip}
            className="inline-flex items-center px-2 py-0.5 rounded-full border border-gray-200 font-mono text-[10px] tracking-wider uppercase text-[color:var(--type-3)]"
          >
            {chip}
          </li>
        ))}
      </ul>
    </div>
  );
}
