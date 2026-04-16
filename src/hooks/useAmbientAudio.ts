"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type AmbienceType = "rain" | "wind" | "clear";

/**
 * Map WMO weather codes to ambience types.
 */
function weatherCodeToAmbience(code: number): AmbienceType {
  // Fog, drizzle, rain, showers, thunderstorms
  if ((code >= 45 && code <= 67) || (code >= 80 && code <= 99)) return "rain";
  // Snow
  if (code >= 71 && code <= 77) return "wind";
  // Clear/partly cloudy with wind potential
  if (code <= 3) return "clear";
  return "clear";
}

/**
 * Create a rain ambience using filtered white noise.
 */
function createRain(ctx: AudioContext, gainNode: GainNode): AudioBufferSourceNode {
  const bufferSize = ctx.sampleRate * 4; // 4 seconds, looped
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

  // Generate rain-textured noise (slightly pink-shifted white noise)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise approximation via Paul Kellet's algorithm
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11;
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  // Low-pass filter for that muffled rain-on-window sound
  const lpf = ctx.createBiquadFilter();
  lpf.type = "lowpass";
  lpf.frequency.value = 1200;
  lpf.Q.value = 0.7;

  source.connect(lpf);
  lpf.connect(gainNode);

  return source;
}

/**
 * Create a wind ambience using modulated oscillators.
 */
function createWind(ctx: AudioContext, gainNode: GainNode): AudioBufferSourceNode {
  const bufferSize = ctx.sampleRate * 6;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      // Wind = low-freq filtered noise with slow amplitude modulation
      const noise = Math.random() * 2 - 1;
      const mod = 0.5 + 0.5 * Math.sin(t * 0.3); // slow swell
      const mod2 = 0.7 + 0.3 * Math.sin(t * 0.7 + ch * 0.5); // stereo width
      data[i] = noise * mod * mod2 * 0.15;
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  // Band-pass for that hollow wind sound
  const bpf = ctx.createBiquadFilter();
  bpf.type = "bandpass";
  bpf.frequency.value = 400;
  bpf.Q.value = 0.5;

  source.connect(bpf);
  bpf.connect(gainNode);

  return source;
}

/**
 * Weather-synced ambient audio hook.
 * Returns playing state and toggle function.
 *
 * Uses Web Audio API to procedurally generate rain/wind sounds.
 * No audio files needed — pure JavaScript synthesis.
 */
export function useAmbientAudio(weatherCode: number): {
  isPlaying: boolean;
  toggle: () => void;
  ambienceType: AmbienceType;
} {
  const [isPlaying, setIsPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const ambienceType = weatherCodeToAmbience(weatherCode);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      sourceRef.current?.stop();
      ctxRef.current?.close();
    };
  }, []);

  // Rebuild audio when weather changes while playing
  useEffect(() => {
    if (!isPlaying || !ctxRef.current || !gainRef.current) return;

    // Stop current source
    sourceRef.current?.stop();

    if (ambienceType === "clear") {
      // Fade to silence
      gainRef.current.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 1);
      return;
    }

    // Create new source for current weather
    const ctx = ctxRef.current;
    const gain = gainRef.current;
    gain.gain.value = 0;

    const source = ambienceType === "rain"
      ? createRain(ctx, gain)
      : createWind(ctx, gain);

    source.start();
    sourceRef.current = source;

    // Fade in
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 2);
  }, [ambienceType, isPlaying]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      // Fade out and stop
      if (gainRef.current && ctxRef.current) {
        gainRef.current.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 0.5);
        setTimeout(() => {
          sourceRef.current?.stop();
          sourceRef.current = null;
        }, 600);
      }
      setIsPlaying(false);
      return;
    }

    // Start
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioContext();
    }

    const ctx = ctxRef.current;

    // Resume if suspended (browser autoplay policy)
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    gainRef.current = gain;

    if (ambienceType === "clear") {
      // Nothing to play for clear skies — toggle still works to show intent
      setIsPlaying(true);
      return;
    }

    const source = ambienceType === "rain"
      ? createRain(ctx, gain)
      : createWind(ctx, gain);

    source.start();
    sourceRef.current = source;

    // Fade in over 2 seconds
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 2);

    setIsPlaying(true);
  }, [isPlaying, ambienceType]);

  return { isPlaying, toggle, ambienceType };
}
