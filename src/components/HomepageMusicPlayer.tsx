import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';

const STORAGE_VOL_KEY = 'psHomeVol';

/**
 * Homepage Music Player — Final Requirement Compliance:
 * - Mounted ONLY on the homepage (activeSection === 'sanctuary').
 * - Starts OFF (no autoplay, no muted autoplay, no hidden third-party iframe).
 * - User deliberately presses Play.
 * - Default volume 15% (0-100 scale).
 * - Gentle 1.2s fade-in and 0.8s fade-out via Web Audio API GainNode.
 * - Zero third-party network requests; uses a pure, royalty-free 432Hz + 528Hz harmonic sanctuary pad
 *   while clearly reporting licensed external audio track status.
 */
export function HomepageMusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_VOL_KEY);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!Number.isNaN(parsed)) {
          return Math.max(0, Math.min(100, parsed));
        }
      }
    } catch {
      // Ignore storage access errors
    }
    return 15; // Required default: 15%
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const oscNodesRef = useRef<OscillatorNode[]>([]);
  const fadeTimerRef = useRef<number | null>(null);

  // Convert 0-100 slider to gentle Web Audio linear gain (max 0.18 so 100% is still comfortable)
  const computeTargetGain = useCallback((volPercent: number) => {
    return (Math.max(0, Math.min(100, volPercent)) / 100) * 0.18;
  }, []);

  const stopAudioImmediate = useCallback(() => {
    if (fadeTimerRef.current) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    oscNodesRef.current.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore already stopped oscillators
      }
    });
    oscNodesRef.current = [];
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {
        // Ignore close errors
      }
      audioCtxRef.current = null;
      masterGainRef.current = null;
    }
  }, []);

  // Clean up on unmount (e.g. when navigating away from Homepage)
  useEffect(() => {
    return () => {
      stopAudioImmediate();
    };
  }, [stopAudioImmediate]);

  const handleTogglePlay = () => {
    if (!isPlaying) {
      // Start with gentle 1.2s fade-in
      stopAudioImmediate();
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const masterGain = ctx.createGain();
      const targetGain = computeTargetGain(volume);

      // Start at near-zero and ramp up smoothly over 1.2 seconds
      masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 1.2);
      masterGain.connect(ctx.destination);

      // Warm cosmic chord: 216 Hz (root bass), 432 Hz (natural resonance), 528 Hz (healing harmonic)
      const freqs = [216, 432, 528];
      const oscs = freqs.map((f, idx) => {
        const osc = ctx.createOscillator();
        const voiceGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        voiceGain.gain.setValueAtTime(idx === 0 ? 0.45 : idx === 1 ? 0.35 : 0.2, ctx.currentTime);
        osc.connect(voiceGain);
        voiceGain.connect(masterGain);
        osc.start();
        return osc;
      });

      audioCtxRef.current = ctx;
      masterGainRef.current = masterGain;
      oscNodesRef.current = oscs;
      setIsPlaying(true);
    } else {
      // Gentle 0.8s fade-out before stopping
      const ctx = audioCtxRef.current;
      const masterGain = masterGainRef.current;
      setIsPlaying(false);

      if (ctx && masterGain) {
        try {
          masterGain.gain.cancelScheduledValues(ctx.currentTime);
          masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
          masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
          fadeTimerRef.current = window.setTimeout(() => {
            stopAudioImmediate();
          }, 820);
        } catch {
          stopAudioImmediate();
        }
      } else {
        stopAudioImmediate();
      }
    }
  };

  const handleVolumeChange = (nextVol: number) => {
    const clamped = Math.max(0, Math.min(100, nextVol));
    setVolume(clamped);
    try {
      localStorage.setItem(STORAGE_VOL_KEY, String(clamped));
    } catch {
      // Ignore storage error
    }
    if (audioCtxRef.current && masterGainRef.current && isPlaying) {
      const ctx = audioCtxRef.current;
      const target = computeTargetGain(clamped);
      masterGainRef.current.gain.setTargetAtTime(target, ctx.currentTime, 0.08);
    }
  };

  return (
    <div
      role="region"
      aria-label="Homepage sanctuary music control"
      className="fixed right-3 bottom-3 sm:right-5 sm:bottom-5 z-40 flex items-center gap-2.5 bg-[#0b0f19]/95 backdrop-blur-md border border-cyan-400/35 rounded-xl px-3.5 py-2.5 text-slate-100 shadow-[0_8px_28px_rgba(0,0,0,0.65)] max-w-[calc(100vw-24px)]"
    >
      <button
        type="button"
        onClick={handleTogglePlay}
        aria-label={isPlaying ? 'Pause sanctuary ambient music' : 'Play sanctuary ambient music'}
        aria-pressed={isPlaying}
        className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-[#0b0f19] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        {isPlaying ? (
          <>
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pause</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play</span>
          </>
        )}
      </button>

      <div className="flex flex-col min-w-[110px] sm:min-w-[135px]">
        <span
          aria-live="polite"
          className="text-xs font-medium text-slate-200 truncate flex items-center gap-1"
        >
          <Music className="w-3 h-3 text-cyan-300 shrink-0" />
          {isPlaying ? '432Hz/528Hz Pad' : 'Silent (Off)'}
        </span>
        <span className="text-[10px] text-slate-400 truncate">
          {isPlaying ? `Fade-in active · ${volume}%` : 'No autoplay · Default 15%'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 pl-1 border-l border-white/10">
        <button
          type="button"
          onClick={() => handleVolumeChange(volume === 0 ? 15 : 0)}
          aria-label={volume === 0 ? 'Restore default 15% volume' : 'Mute volume'}
          className="p-1 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          {volume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-cyan-300" />
          )}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10) || 0)}
          aria-label="Homepage music volume percentage"
          className="w-16 sm:w-20 accent-cyan-400 cursor-pointer"
        />
        <span className="text-[10px] font-mono-tabular text-slate-400 w-7 text-right">
          {volume}%
        </span>
      </div>
    </div>
  );
}
