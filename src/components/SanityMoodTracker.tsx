import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Sparkles,
  Flame,
  Calendar,
  CloudLightning,
  Waves,
  Sprout,
  Sun,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Info,
  BatteryCharging,
  BatteryMedium,
  BatteryLow,
} from 'lucide-react';

export interface MoodEntry {
  date: string; // YYYY-MM-DD
  score: 1 | 2 | 3 | 4 | 5;
  moodLabel: string;
  energyLevel: 'low' | 'balanced' | 'high';
  note?: string;
  createdAt?: string | Timestamp;
}

const MOOD_OPTIONS: Array<{
  score: 1 | 2 | 3 | 4 | 5;
  label: string;
  tagline: string;
  iconKey: 'storm' | 'weathering' | 'grounded' | 'healing' | 'rising';
  colorClass: string;
  badgeBg: string;
  quote: string;
}> = [
  {
    score: 1,
    label: 'Storm & Heavy',
    tagline: 'Deep fog, survival mode',
    iconKey: 'storm',
    colorClass: 'from-slate-900 to-[#0b0f19] border-slate-700 text-slate-300',
    badgeBg: 'bg-slate-800 text-slate-200 border-slate-700',
    quote: 'Even when the clouds are black as pitch, your breath is still yours.',
  },
  {
    score: 2,
    label: 'Weathering',
    tagline: 'Raw turbulence, holding ground',
    iconKey: 'weathering',
    colorClass: 'from-cyan-950 to-[#0b0f19] border-cyan-700/60 text-cyan-200',
    badgeBg: 'bg-cyan-950/80 text-cyan-200 border-cyan-700',
    quote: 'The wave cannot drown what chooses to float. Hold fast.',
  },
  {
    score: 3,
    label: 'Grounded',
    tagline: 'One breath at a time, presence',
    iconKey: 'grounded',
    colorClass: 'from-sky-950/70 to-[#0b0f19] border-sky-500/50 text-sky-200',
    badgeBg: 'bg-sky-950/80 text-sky-200 border-sky-500/60',
    quote: 'Stand where you are. Root yourself in the earth beneath your boots.',
  },
  {
    score: 4,
    label: 'Healing Light',
    tagline: 'Glimmers returning, rebuild mode',
    iconKey: 'healing',
    colorClass: 'from-amber-900/40 to-[#0b0f19] border-amber-500/60 text-amber-100',
    badgeBg: 'bg-amber-500/20 text-amber-200 border-amber-400/50',
    quote: 'Light does not ask permission from the dark to return.',
  },
  {
    score: 5,
    label: 'Rising Superpower',
    tagline: 'Evolution, turning pain into purpose',
    iconKey: 'rising',
    colorClass: 'from-amber-500/25 via-amber-500/10 to-[#0b0f19] border-amber-400 text-amber-200',
    badgeBg:
      'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-bold border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
    quote: 'Rise from madness. You survived the dark so you could guide others through it.',
  },
];

function renderMoodIcon(
  iconKey: 'storm' | 'weathering' | 'grounded' | 'healing' | 'rising',
  sizeClass = 'w-4 h-4'
) {
  switch (iconKey) {
    case 'storm':
      return <CloudLightning className={`${sizeClass} text-slate-300`} />;
    case 'weathering':
      return <Waves className={`${sizeClass} text-cyan-300`} />;
    case 'grounded':
      return <Sprout className={`${sizeClass} text-sky-300`} />;
    case 'healing':
      return <Sun className={`${sizeClass} text-amber-300`} />;
    case 'rising':
      return <Sparkles className={`${sizeClass} text-amber-400`} />;
  }
}

const LOCAL_STORAGE_KEY = 'pleading_sanity_mood_logs';

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface SanityMoodTrackerProps {
  currentUser: User | null;
  onOpenSignIn?: () => void;
}

export function SanityMoodTracker({
  currentUser,
  onOpenSignIn,
}: SanityMoodTrackerProps) {
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);

  const [selectedScore, setSelectedScore] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [selectedEnergy, setSelectedEnergy] = useState<'low' | 'balanced' | 'high'>('balanced');
  const [reflectionNote, setReflectionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const [moodLogs, setMoodLogs] = useState<Record<string, MoodEntry>>({});
  const [selectedDayKey, setSelectedDayKey] = useState<string>(todayStr);

  // 1. Load from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          setMoodLogs(parsed);
        }
      }
    } catch {
      // Fallback silently if localStorage is restricted
    }
  }, []);

  // 2. Load and Sync with Firestore when User is authenticated
  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;
    async function loadFirestoreLogs() {
      try {
        const logsColRef = collection(db, 'users', currentUser!.uid, 'mood_logs');
        const querySnap = await getDocs(logsColRef);
        const remoteLogs: Record<string, MoodEntry> = {};

        querySnap.forEach((docSnap) => {
          const data = docSnap.data() as MoodEntry;
          if (data && data.date && data.score) {
            remoteLogs[data.date] = {
              date: data.date,
              score: data.score,
              moodLabel: data.moodLabel || MOOD_OPTIONS[data.score - 1].label,
              energyLevel: data.energyLevel || 'balanced',
              note: data.note || '',
            };
          }
        });

        if (isMounted) {
          setMoodLogs((prev) => {
            const merged = { ...prev, ...remoteLogs };
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
            } catch {
              // Ignore quota errors
            }
            return merged;
          });
        }
      } catch (err) {
        console.warn('Keeping local mood cache:', err);
      }
    }

    loadFirestoreLogs();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Pre-fill today's log if already logged today
  useEffect(() => {
    const todayLog = moodLogs[todayStr];
    if (todayLog) {
      setSelectedScore(todayLog.score);
      setSelectedEnergy(todayLog.energyLevel);
      if (todayLog.note && !reflectionNote) {
        setReflectionNote(todayLog.note);
      }
    }
  }, [moodLogs, todayStr]);

  // Compute the 30 calendar days leading up to today
  const last30Days = useMemo(() => {
    const days: Array<{
      dateKey: string;
      dateObj: Date;
      dayNum: number;
      monthShort: string;
      weekdayShort: string;
      isToday: boolean;
    }> = [];

    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = formatLocalDate(d);
      days.push({
        dateKey: key,
        dateObj: d,
        dayNum: d.getDate(),
        monthShort: d.toLocaleString('default', { month: 'short' }),
        weekdayShort: d.toLocaleString('default', { weekday: 'narrow' }),
        isToday: key === todayStr,
      });
    }
    return days;
  }, [todayStr]);

  // Stats calculation
  const stats = useMemo(() => {
    let loggedCount = 0;
    let scoreSum = 0;
    const scoresCount: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    last30Days.forEach((day) => {
      const entry = moodLogs[day.dateKey];
      if (entry) {
        loggedCount++;
        scoreSum += entry.score;
        scoresCount[entry.score] = (scoresCount[entry.score] || 0) + 1;
      }
    });

    let streak = 0;
    for (let i = last30Days.length - 1; i >= 0; i--) {
      const day = last30Days[i];
      if (moodLogs[day.dateKey]) {
        streak++;
      } else {
        if (day.isToday) continue;
        break;
      }
    }

    const averageResonance = loggedCount > 0 ? (scoreSum / loggedCount).toFixed(1) : '—';

    let dominantScore: number | null = null;
    let maxFreq = 0;
    Object.entries(scoresCount).forEach(([score, count]) => {
      if (count > maxFreq) {
        maxFreq = count;
        dominantScore = Number(score);
      }
    });

    const dominantOption = dominantScore ? MOOD_OPTIONS[dominantScore - 1] : null;

    return {
      loggedCount,
      percentage: Math.round((loggedCount / 30) * 100),
      streak,
      averageResonance,
      dominantOption,
    };
  }, [last30Days, moodLogs]);

  // Handle Save with anti-double-click protection (withBusy pattern)
  const handleSaveCheckIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      setIsSubmitting(true);
      setSaveSuccessMsg(null);

      const targetMood = MOOD_OPTIONS[selectedScore - 1];
      const entry: MoodEntry = {
        date: todayStr,
        score: selectedScore,
        moodLabel: targetMood.label,
        energyLevel: selectedEnergy,
        note: reflectionNote.trim(),
      };

      const updatedLogs = { ...moodLogs, [todayStr]: entry };
      setMoodLogs(updatedLogs);
      setSelectedDayKey(todayStr);

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedLogs));
      } catch (err) {
        console.warn('LocalStorage save failed:', err);
      }

      if (currentUser) {
        try {
          const logDocRef = doc(db, 'users', currentUser.uid, 'mood_logs', todayStr);
          await setDoc(logDocRef, {
            userId: currentUser.uid,
            date: todayStr,
            score: selectedScore,
            moodLabel: targetMood.label,
            energyLevel: selectedEnergy,
            note: reflectionNote.trim() || '',
            createdAt: serverTimestamp(),
          });
          setSaveSuccessMsg('Daily check-in saved securely to your private Firestore vault.');
        } catch (error) {
          console.error('Firestore save failed:', error);
          setSaveSuccessMsg('Saved to local journal. Will sync to vault when online.');
        }
      } else {
        setSaveSuccessMsg(
          'Saved locally to this device. Sign in anytime to preserve in your private cloud vault.'
        );
      }

      setIsSubmitting(false);
      setTimeout(() => setSaveSuccessMsg(null), 5000);
    },
    [isSubmitting, selectedScore, selectedEnergy, reflectionNote, todayStr, moodLogs, currentUser]
  );

  const inspectedEntry = moodLogs[selectedDayKey];
  const inspectedDayObj = useMemo(() => {
    return (
      last30Days.find((d) => d.dateKey === selectedDayKey) || {
        dateKey: selectedDayKey,
        dayNum: new Date(selectedDayKey).getDate() || 1,
        monthShort: 'Sanctuary',
        weekdayShort: 'D',
        isToday: selectedDayKey === todayStr,
      }
    );
  }, [last30Days, selectedDayKey, todayStr]);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0f19] overflow-hidden shadow-2xl space-y-6 p-6 sm:p-8">
      {/* HEADER SECTION WITH CRYING BRAIN ASSET */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-black/60 border border-cyan-400/30 shrink-0 p-1">
            <img
              src="/assets/aistudio/1793666356609_a9f7ee93.png"
              alt="Pleading Sanity Crying Brain Emblem"
              loading="lazy"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-cyan-300 font-mono-tabular font-medium">
                Sanctuary Journal Vault · 30-Day Heatmap
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20">
                100% Free & Private
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif-display font-semibold text-white mt-1">
              Your Daily Sanity Journey
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Check in with raw honesty every 24 hours. No judgement, no scores for clout — only your lived truth.
            </p>
          </div>
        </div>

        {/* CLOUD / LOCAL SYNC BADGE */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-700/40 text-emerald-300 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Synced to Private Firestore</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-cyan-400/80" />
                Offline-First Local Storage
              </span>
              {onOpenSignIn && (
                <button
                  type="button"
                  onClick={onOpenSignIn}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-amber-200 transition-colors cursor-pointer"
                >
                  Sign In to Cloud Sync
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* STATS STRIP: 4 METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Current Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-serif-display font-semibold text-white mt-2 font-mono-tabular">
            {stats.streak} <span className="text-xs font-sans text-amber-300/80">days</span>
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5">Consecutive check-ins</span>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>30-Day Check-ins</span>
            <Calendar className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-serif-display font-semibold text-white mt-2 font-mono-tabular">
            {stats.loggedCount}{' '}
            <span className="text-xs font-sans text-slate-400">/ 30 ({stats.percentage}%)</span>
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5">Last month presence</span>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Avg Resonance</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-serif-display font-semibold text-white mt-2 font-mono-tabular">
            {stats.averageResonance}{' '}
            <span className="text-xs font-sans text-slate-400">/ 5.0</span>
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5">Holistic sanity baseline</span>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Dominant State</span>
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-200 mt-2 truncate">
            {stats.dominantOption ? (
              <>
                {renderMoodIcon(stats.dominantOption.iconKey, 'w-4 h-4 shrink-0')}
                <span className="truncate">{stats.dominantOption.label}</span>
              </>
            ) : (
              <span>Begin Today</span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5">Most frequent frequency</span>
        </div>
      </div>

      {/* 30-DAY HEATMAP VISUALIZATION GRID */}
      <div className="p-5 rounded-xl bg-[#060911] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>30-Day Sanity Journey Heatmap</span>
              <span className="text-xs text-slate-400 font-normal">
                (Select any day cell to inspect your note & reflection)
              </span>
            </h4>
          </div>

          {/* Color Key Legend */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0">
            <span>Storm</span>
            <div className="w-3 h-3 rounded bg-slate-800 border border-slate-700" title="Score 1: Storm & Heavy" />
            <div className="w-3 h-3 rounded bg-cyan-950 border border-cyan-700" title="Score 2: Weathering" />
            <div className="w-3 h-3 rounded bg-sky-950 border border-sky-500/60" title="Score 3: Grounded" />
            <div className="w-3 h-3 rounded bg-amber-500/30 border border-amber-400" title="Score 4: Healing" />
            <div
              className="w-3 h-3 rounded bg-amber-400 border border-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
              title="Score 5: Rising Superpower"
            />
            <span>Superpower</span>
          </div>
        </div>

        {/* THE 30 CELLS */}
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-15 gap-2">
          {last30Days.map((day) => {
            const entry = moodLogs[day.dateKey];
            const isSelected = selectedDayKey === day.dateKey;
            let cellStyle = 'bg-white/[0.03] border-white/10 hover:border-white/30 text-slate-400';

            if (entry) {
              if (entry.score === 1) cellStyle = 'bg-slate-800/90 border-slate-700 text-slate-300';
              if (entry.score === 2) cellStyle = 'bg-cyan-950/90 border-cyan-700 text-cyan-200';
              if (entry.score === 3) cellStyle = 'bg-sky-950/80 border-sky-500/60 text-sky-200';
              if (entry.score === 4) cellStyle = 'bg-amber-500/25 border-amber-400/70 text-amber-100';
              if (entry.score === 5) {
                cellStyle =
                  'bg-gradient-to-br from-amber-400 to-amber-300 border-amber-200 text-slate-950 font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]';
              }
            }

            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => setSelectedDayKey(day.dateKey)}
                className={`relative flex flex-col items-center justify-between p-2 rounded-lg border text-center transition-all cursor-pointer group min-h-[64px] ${cellStyle} ${
                  isSelected ? 'ring-2 ring-cyan-400 scale-105 z-10' : ''
                } ${day.isToday ? 'border-amber-400/80' : ''}`}
                title={`${day.dateKey}${entry ? `: ${entry.moodLabel}` : ' (No entry)'}`}
              >
                <div className="flex items-center justify-between w-full text-[10px] opacity-75">
                  <span className="font-mono-tabular">{day.weekdayShort}</span>
                  {day.isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>

                <div className="my-0.5 flex items-center justify-center">
                  {entry ? (
                    renderMoodIcon(
                      MOOD_OPTIONS[entry.score - 1].iconKey,
                      entry.score === 5 ? 'w-4 h-4 text-slate-950' : 'w-4 h-4'
                    )
                  ) : (
                    <span className="text-slate-600 text-xs">·</span>
                  )}
                </div>

                <span className="text-[11px] font-mono-tabular font-medium">
                  {day.dayNum}
                </span>

                {entry?.note && (
                  <span className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-cyan-300" />
                )}
              </button>
            );
          })}
        </div>

        {/* SELECTED DAY INSPECTOR CARD */}
        <div className="mt-4 p-4 rounded-lg bg-white/[0.02] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">
                {inspectedDayObj.monthShort} {inspectedDayObj.dayNum} ({selectedDayKey})
              </span>
              {inspectedDayObj.isToday && (
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                  Today
                </span>
              )}
              {inspectedEntry ? (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border ${
                    MOOD_OPTIONS[inspectedEntry.score - 1].badgeBg
                  }`}
                >
                  {inspectedEntry.score} / 5 · {inspectedEntry.moodLabel}
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                  No Entry Logged
                </span>
              )}
            </div>

            {inspectedEntry ? (
              <div className="space-y-1 pt-1">
                <p className="text-xs text-amber-200/90 font-serif-display italic">
                  “{MOOD_OPTIONS[inspectedEntry.score - 1].quote}”
                </p>
                {inspectedEntry.note ? (
                  <p className="text-xs text-slate-300 bg-black/40 p-2.5 rounded border border-white/5 mt-1">
                    <strong className="text-slate-400">Your Reflection:</strong> “{inspectedEntry.note}”
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">No notes written on this check-in.</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                You took a quiet breath this day. Use the logger below to log today’s check-in.
              </p>
            )}
          </div>

          {inspectedEntry && (
            <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0 border-t md:border-t-0 border-white/10 pt-2 md:pt-0">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                {inspectedEntry.energyLevel === 'high' && (
                  <>
                    <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />
                    High Energy
                  </>
                )}
                {inspectedEntry.energyLevel === 'balanced' && (
                  <>
                    <BatteryMedium className="w-3.5 h-3.5 text-cyan-400" />
                    Balanced Energy
                  </>
                )}
                {inspectedEntry.energyLevel === 'low' && (
                  <>
                    <BatteryLow className="w-3.5 h-3.5 text-sky-400" />
                    Low Energy / Resting
                  </>
                )}
              </span>
              <span className="text-[10px] text-slate-500">
                Owner-Only Vault
              </span>
            </div>
          )}
        </div>
      </div>

      {/* TODAY'S CHECK-IN LOGGER FORM */}
      <form onSubmit={handleSaveCheckIn} className="space-y-5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-serif-display font-semibold text-white flex items-center gap-2">
              <span>Today’s Honest Check-In</span>
              <span className="text-xs font-sans text-cyan-300 font-normal">({todayStr})</span>
            </h4>
            <p className="text-xs text-slate-400">
              Where is your mind dwelling today? Select your current frequency.
            </p>
          </div>
          {moodLogs[todayStr] && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Logged Today ({moodLogs[todayStr].moodLabel})
            </span>
          )}
        </div>

        {/* 5 MOOD BUTTONS (SVG ICONS ONLY) */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {MOOD_OPTIONS.map((opt) => {
            const isSelected = selectedScore === opt.score;
            return (
              <button
                key={opt.score}
                type="button"
                onClick={() => setSelectedScore(opt.score)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                  isSelected
                    ? `bg-gradient-to-b ${opt.colorClass} ring-2 ring-amber-400 shadow-lg scale-[1.02]`
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  {renderMoodIcon(opt.iconKey, 'w-5 h-5')}
                  <span className="text-[11px] font-mono-tabular opacity-60">
                    Tier {opt.score}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{opt.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                    {opt.tagline}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ENERGY LEVEL SELECTOR & OPTIONAL REFLECTION NOTE */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 space-y-2">
            <label className="text-xs font-medium text-slate-300 block">
              Energy Battery Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'balanced', 'high'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedEnergy(lvl)}
                  className={`py-2 px-2 rounded-lg border text-xs capitalize text-center transition-colors cursor-pointer ${
                    selectedEnergy === lvl
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-semibold'
                      : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Honour your limits; low energy days are when deep healing happens.
            </p>
          </div>

          <div className="md:col-span-8 space-y-2">
            <label htmlFor="sanity-mood-note" className="text-xs font-medium text-slate-300 block">
              1-Line Honest Reflection (Optional)
            </label>
            <input
              id="sanity-mood-note"
              type="text"
              value={reflectionNote}
              onChange={(e) => setReflectionNote(e.target.value)}
              placeholder="e.g., Felt the storm early, breathed through it, listened to 528Hz, didn't give up."
              maxLength={400}
              className="w-full bg-[#0d1324] border border-white/15 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <p className="text-[11px] text-slate-500">
              Strictly private to you. Never shared to public feeds · Not medical advice.
            </p>
          </div>
        </div>

        {/* SUBMIT BUTTON WITH withBusy PROTECTION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
          <div className="text-xs text-slate-400">
            {saveSuccessMsg ? (
              <span className="text-emerald-300 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {saveSuccessMsg}
              </span>
            ) : (
              <span>
                Saving commits today’s cell into your 30-day heatmap immediately.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Saving Check-In...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {moodLogs[todayStr] ? 'Update Today’s Check-In' : 'Save Daily Check-In'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
