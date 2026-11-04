import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, RotateCcw, HelpCircle, Sparkles, Play, CheckCircle2 } from 'lucide-react';

type GameId =
  | 'sanity-solitaire'
  | 'cosmic-connect'
  | 'truth-tag'
  | 'cosmic-focus'
  | 'number-nebula'
  | 'pattern-galaxy'
  | 'memory-ocean'
  | 'rhythm-resonance'
  | 'stardust-dash'
  | 'healing-hz'
  | 'mind-mode'
  | 'mood-journey';

interface CalmGameMeta {
  id: GameId;
  number: string;
  title: string;
  category: string;
  description: string;
  quote: string;
}

const CALM_GAMES: CalmGameMeta[] = [
  {
    id: 'sanity-solitaire',
    number: '01',
    title: 'Sanity Solitaire',
    category: 'Card Patience · No Timer',
    description: 'Arrange the four cosmic suits (Star, Garden, Heart, Dawn) in ascending order from 1 to 6. Every card is visible — zero rush.',
    quote: 'Healing isn’t straight — but it’s always forward.',
  },
  {
    id: 'cosmic-connect',
    number: '02',
    title: 'Cosmic Connect',
    category: 'Constellation Weaving · Calm',
    description: 'Link the numbered stars in order across the night sky to form sacred constellations and unlock Shane’s reflections.',
    quote: 'Your thoughts aren’t broken — they’re just forming a pattern you haven’t seen yet.',
  },
  {
    id: 'truth-tag',
    number: '03',
    title: 'Truth Tag',
    category: 'Accessible Word Discovery · 4-Tier Hints',
    description: 'Find grounding sanctuary words hidden in a high-contrast grid with 4-tier gentle hints and zero countdown stress.',
    quote: 'Love Over Money. Truth Over Noise.',
  },
  {
    id: 'cosmic-focus',
    number: '04',
    title: 'Cosmic Focus',
    category: '4-7-8 & Box Breath Orbit',
    description: 'Synchronise your breathing with an expanding golden nebula to steady a racing heart in under two minutes.',
    quote: 'You are the calm in your own storm.',
  },
  {
    id: 'number-nebula',
    number: '05',
    title: 'Number Nebula',
    category: 'Zen Harmonic Merging',
    description: 'Combine matching starlight numbers to grow a golden supernova. No game-over traps — you can always recharge the grid.',
    quote: 'You are small — and that means you have the whole universe above you.',
  },
  {
    id: 'pattern-galaxy',
    number: '06',
    title: 'Pattern Galaxy',
    category: 'Sacred Geometry & Symmetry',
    description: 'Mirror the golden starlight across the mandala axes to complete tranquil cosmic symmetries.',
    quote: 'Four minds. One heart. Arron and his family.',
  },
  {
    id: 'memory-ocean',
    number: '07',
    title: 'Memory Ocean',
    category: 'Bioluminescent Pair Matching',
    description: 'Turn over gentle deep-sea sanctuary tiles at your own pace. Every matched pair reveals a truth to keep.',
    quote: 'Your mind is a garden — not a prison.',
  },
  {
    id: 'rhythm-resonance',
    number: '08',
    title: 'Rhythm Resonance',
    category: 'Celestial Chime Sequencer',
    description: 'Toggle harmonic rings on a 8-step cosmic pulse to compose your own soothing ambient soundscape.',
    quote: 'Leave People Better Than You Found Them.',
  },
  {
    id: 'stardust-dash',
    number: '09',
    title: 'Stardust Dash',
    category: 'Zero-Fail Starlight Drift',
    description: 'Guide a glowing seed through gentle star currents to gather warm light. No lives lost, only calm movement.',
    quote: 'Even when the ground is hard — life finds a way.',
  },
  {
    id: 'healing-hz',
    number: '10',
    title: 'Healing Hz',
    category: 'Pure Web Audio Frequencies',
    description: 'Listen to real synthesized Solfeggio and harmonic sine tones (174 Hz to 852 Hz) with a soft cosmic visualizer.',
    quote: 'Healing grows where we thought we were broken.',
  },
  {
    id: 'mind-mode',
    number: '11',
    title: 'Mind Mode',
    category: 'Shadow-to-Power Reframer',
    description: 'Step through interactive cards that transform heavy institutional or self-critical labels into lived strength.',
    quote: 'You say I’m mad — you just don’t understand me.',
  },
  {
    id: 'mood-journey',
    number: '12',
    title: 'Mood Journey',
    category: 'Inner Sky Constellation Map',
    description: 'Plot your emotional weather as stars on a personal sky canvas and trace how you have survived every night so far.',
    quote: 'The darkest hour always comes before the dawn.',
  },
];

// Gentle Web Audio chime helper
function playGentleChime(freq = 432, duration = 0.35, muted = false) {
  if (muted || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close(), duration * 1000 + 100);
  } catch {
    // Ignore audio context restrictions
  }
}

export function CalmGamesHub() {
  const [activeGame, setActiveGame] = useState<GameId>('sanity-solitaire');
  const [muted, setMuted] = useState(false);

  const activeMeta = CALM_GAMES.find((g) => g.id === activeGame) || CALM_GAMES[0];

  // --- 1. SANITY SOLITAIRE STATE ---
  const SUITS = [
    { key: 'star', symbol: 'Star', name: 'Star', color: 'text-amber-300' },
    { key: 'garden', symbol: 'Leaf', name: 'Garden', color: 'text-emerald-300' },
    { key: 'heart', symbol: 'Heart', name: 'Heart', color: 'text-cyan-300' },
    { key: 'dawn', symbol: 'Sun', name: 'Dawn', color: 'text-sky-300' },
  ];
  const createSolitaireDeck = () => {
    const cards: { id: string; suit: string; rank: number }[] = [];
    SUITS.forEach((s) => {
      for (let r = 1; r <= 5; r++) {
        cards.push({ id: `${s.key}-${r}`, suit: s.key, rank: r });
      }
    });
    return cards.sort(() => Math.random() - 0.5);
  };
  const [solitairePool, setSolitairePool] = useState(createSolitaireDeck);
  const [foundations, setFoundations] = useState<Record<string, number>>({
    star: 0,
    garden: 0,
    heart: 0,
    dawn: 0,
  });
  const [solitaireMoves, setSolitaireMoves] = useState(0);

  const handleSolitaireCardClick = (card: { id: string; suit: string; rank: number }) => {
    const neededRank = (foundations[card.suit] || 0) + 1;
    if (card.rank === neededRank) {
      playGentleChime(396 + card.rank * 45, 0.35, muted);
      setFoundations((prev) => ({ ...prev, [card.suit]: card.rank }));
      setSolitairePool((prev) => prev.filter((c) => c.id !== card.id));
      setSolitaireMoves((m) => m + 1);
    } else {
      playGentleChime(220, 0.2, muted);
    }
  };

  const resetSolitaire = () => {
    setSolitairePool(createSolitaireDeck());
    setFoundations({ star: 0, garden: 0, heart: 0, dawn: 0 });
    setSolitaireMoves(0);
  };

  // --- 2. COSMIC CONNECT STATE ---
  const CONSTELLATION_NODES = [
    { step: 1, x: 18, y: 72, label: '01 · Survival' },
    { step: 2, x: 32, y: 45, label: '02 · Discipline' },
    { step: 3, x: 50, y: 60, label: '03 · Honesty' },
    { step: 4, x: 64, y: 28, label: '04 · Kindness' },
    { step: 5, x: 82, y: 48, label: '05 · Sanctuary' },
    { step: 6, x: 75, y: 78, label: '06 · Rise' },
  ];
  const [connectedStep, setConnectedStep] = useState(1);

  // --- 3. TRUTH TAG (WORD DISCOVERY WITH 4-TIER HINTS) ---
  const TRUTH_WORDS = [
    { word: 'SANCTUARY', row: 0, col: 0, clue: 'A safe place where no one is judged (Horizontal, Row 1)' },
    { word: 'EVOLVE', row: 2, col: 1, clue: 'We grow forward rather than erasing our past (Horizontal, Row 3)' },
    { word: 'ARRON', row: 4, col: 2, clue: 'The companion Shane built to help you stay sane (Horizontal, Row 5)' },
    { word: 'TRUTH', row: 6, col: 3, clue: 'What we choose over noise (Horizontal, Row 7)' },
    { word: 'HOPE', row: 7, col: 0, clue: 'The wooden door in the dark that stays open (Horizontal, Row 8)' },
  ];
  const GRID_ROWS = [
    'SANCTUARY',
    'KPLMNRQVW',
    'XEVOLVEZT',
    'BGHJKLMPN',
    'WQARRONDF',
    'ZXCVBNMKL',
    'RTYTRUTHP',
    'HOPEWQMNB',
  ];
  const [foundWords, setFoundWords] = useState<string[]>(['SANCTUARY']);
  const [hintTier, setHintTier] = useState<number>(0);

  const toggleFindWord = (word: string) => {
    if (!foundWords.includes(word)) {
      playGentleChime(528, 0.4, muted);
      setFoundWords((prev) => [...prev, word]);
    }
  };

  // --- 4. COSMIC FOCUS (BREATHING ORBIT) ---
  const [breathPhase, setBreathPhase] = useState<'Inhale (4s)' | 'Hold Gently (4s)' | 'Exhale Slowly (6s)'>('Inhale (4s)');
  const [breathCycles, setBreathCycles] = useState(0);
  useEffect(() => {
    if (activeGame !== 'cosmic-focus') return;
    const interval = setInterval(() => {
      setBreathPhase((prev) => {
        if (prev === 'Inhale (4s)') return 'Hold Gently (4s)';
        if (prev === 'Hold Gently (4s)') return 'Exhale Slowly (6s)';
        setBreathCycles((c) => c + 1);
        return 'Inhale (4s)';
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [activeGame]);

  // --- 5. NUMBER NEBULA ---
  const [nebulaTiles, setNebulaTiles] = useState<number[]>([2, 2, 4, 8, 4, 8, 16, 32, 2]);
  const [selectedNebulaIdx, setSelectedNebulaIdx] = useState<number | null>(null);
  const handleNebulaClick = (idx: number) => {
    if (selectedNebulaIdx === null) {
      setSelectedNebulaIdx(idx);
      return;
    }
    if (selectedNebulaIdx === idx) {
      setSelectedNebulaIdx(null);
      return;
    }
    if (nebulaTiles[selectedNebulaIdx] === nebulaTiles[idx]) {
      playGentleChime(528, 0.35, muted);
      const next = [...nebulaTiles];
      next[idx] = next[idx] * 2;
      next[selectedNebulaIdx] = [2, 4, 8][Math.floor(Math.random() * 3)];
      setNebulaTiles(next);
    } else {
      playGentleChime(260, 0.2, muted);
    }
    setSelectedNebulaIdx(null);
  };

  // --- 6. PATTERN GALAXY ---
  const TARGET_PATTERN = [1, 0, 1, 0, 1, 1, 0, 1, 0];
  const [userPattern, setUserPattern] = useState<number[]>([1, 0, 0, 0, 1, 0, 0, 1, 0]);
  const togglePatternCell = (idx: number) => {
    playGentleChime(432 + idx * 20, 0.25, muted);
    setUserPattern((prev) => prev.map((v, i) => (i === idx ? (v === 1 ? 0 : 1) : v)));
  };

  // --- 7. MEMORY OCEAN ---
  const INITIAL_MEMORY = [
    { id: 1, symbol: 'STAR', label: 'Star' },
    { id: 2, symbol: 'STAR', label: 'Star' },
    { id: 3, symbol: 'BLOOM', label: 'Bloom' },
    { id: 4, symbol: 'BLOOM', label: 'Bloom' },
    { id: 5, symbol: 'DAWN', label: 'Dawn' },
    { id: 6, symbol: 'DAWN', label: 'Dawn' },
    { id: 7, symbol: 'CALM', label: 'Heart' },
    { id: 8, symbol: 'CALM', label: 'Heart' },
  ];
  const [memoryCards, setMemoryCards] = useState(INITIAL_MEMORY);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matchedSymbols, setMatchedSymbols] = useState<string[]>([]);

  const handleMemoryFlip = (card: { id: number; symbol: string }) => {
    if (flippedIds.includes(card.id) || matchedSymbols.includes(card.symbol) || flippedIds.length === 2) return;
    const nextFlipped = [...flippedIds, card.id];
    setFlippedIds(nextFlipped);
    playGentleChime(440, 0.2, muted);

    if (nextFlipped.length === 2) {
      const first = memoryCards.find((c) => c.id === nextFlipped[0]);
      const second = memoryCards.find((c) => c.id === nextFlipped[1]);
      if (first && second && first.symbol === second.symbol) {
        playGentleChime(639, 0.45, muted);
        setMatchedSymbols((prev) => [...prev, first.symbol]);
        setFlippedIds([]);
      } else {
        setTimeout(() => setFlippedIds([]), 700);
      }
    }
  };

  // --- 8. RHYTHM RESONANCE ---
  const RHYTHM_NOTES = [
    { name: 'Crown Star (639 Hz)', freq: 639 },
    { name: 'Solar Heart (528 Hz)', freq: 528 },
    { name: 'Sanctuary Calm (432 Hz)', freq: 432 },
    { name: 'Deep Root (285 Hz)', freq: 285 },
  ];
  const [rhythmGrid, setRhythmGrid] = useState<boolean[][]>([
    [true, false, false, false, true, false, false, false],
    [false, false, true, false, false, false, true, false],
    [true, false, true, false, true, false, true, false],
    [true, false, false, false, false, false, false, false],
  ]);

  // --- 9. STARDUST DASH ---
  const [shipPos, setShipPos] = useState({ x: 50, y: 50 });
  const [starTarget, setStarTarget] = useState({ x: 72, y: 34 });
  const [stardustCollected, setStardustCollected] = useState(12);

  const moveStarSeed = (nx: number, ny: number) => {
    setShipPos({ x: nx, y: ny });
    const dist = Math.hypot(nx - starTarget.x, ny - starTarget.y);
    if (dist < 18) {
      playGentleChime(528, 0.35, muted);
      setStardustCollected((c) => c + 1);
      setStarTarget({
        x: 15 + Math.floor(Math.random() * 70),
        y: 20 + Math.floor(Math.random() * 60),
      });
    }
  };

  // --- 10. HEALING HZ SYNTHESIZER (EXACT PLEADING SANITY FREQUENCIES) ---
  const FREQUENCIES = [
    { hz: 174, title: '174 Hz · Foundation & Pain Relief', desc: 'Deep physical calm and emotional grounding for heavy days.' },
    { hz: 285, title: '285 Hz · Energy Field & Renewal', desc: 'Restoring damaged tissues, cognitive fatigue, and calm spirit.' },
    { hz: 432, title: '432 Hz · Natural Cosmic Resonance', desc: 'Gentle alignment with the universal rhythm and quiet skies.' },
    { hz: 528, title: '528 Hz · Transformation & Repair', desc: 'Golden frequency of rebirth, cellular healing, and peace.' },
    { hz: 741, title: '741 Hz · Intuition & Mental Awakening', desc: 'Cleansing negative toxins, dissolving mental knots and fog.' },
    { hz: 963, title: '963 Hz · Pure Light & Cosmic Starlight', desc: 'Connection with infinite stillness and higher evolution.' },
  ];
  const [playingHz, setPlayingHz] = useState<number | null>(null);
  const oscRef = useRef<{ ctx: AudioContext; osc: OscillatorNode } | null>(null);

  const toggleFrequency = (hz: number) => {
    if (oscRef.current) {
      try {
        oscRef.current.osc.stop();
        oscRef.current.ctx.close();
      } catch {
        // ignore
      }
      oscRef.current = null;
    }
    if (playingHz === hz) {
      setPlayingHz(null);
      return;
    }
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      oscRef.current = { ctx, osc };
      setPlayingHz(hz);
    } catch {
      setPlayingHz(hz);
    }
  };

  useEffect(() => {
    return () => {
      if (oscRef.current) {
        try {
          oscRef.current.osc.stop();
          oscRef.current.ctx.close();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // --- 11. MIND MODE ---
  const MIND_CARDS = [
    {
      shadow: '“You are too sensitive for this world.”',
      truth: '“Seeing deeply is what makes you a sanctuary builder. A garden feels more than concrete ever could.”',
    },
    {
      shadow: '“Your past in institutions or hard places defines you.”',
      truth: '“Evolution, Not Erasure. What tried to break you gave you the authority to help others survive.”',
    },
    {
      shadow: '“The negative voice in your head means you are losing.”',
      truth: '“That voice is only a shadow. Wrestling with it is where your discipline and best ideas are born.”',
    },
  ];
  const [mindCardIdx, setMindCardIdx] = useState(0);
  const [mindRevealed, setMindRevealed] = useState(false);

  // --- 12. MOOD JOURNEY ---
  const [moodStars, setMoodStars] = useState<
    { id: number; feeling: string; note: string; time: string }[]
  >([
    {
      id: 1,
      feeling: 'Quietly Hopeful',
      note: 'Stepped through the sanctuary door tonight.',
      time: 'Tonight',
    },
  ]);
  const [moodFeeling, setMoodFeeling] = useState('Grounded');
  const [moodNote, setMoodNote] = useState('');

  const addMoodStar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moodNote.trim()) return;
    playGentleChime(528, 0.35, muted);
    setMoodStars((prev) => [
      {
        id: Date.now(),
        feeling: moodFeeling,
        note: moodNote.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev,
    ]);
    setMoodNote('');
  };

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <p className="text-xs text-amber-300">
            12 Free Sanctuary Games · Zero Timers · Zero Stress · No Paywalls
          </p>
          <h1 className="text-3xl sm:text-5xl font-serif-display font-semibold text-white">
            Calm Cosmic Games
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
            Every game in Pleading Sanity is built without countdown clocks, punishing game-over screens, or manipulative dark patterns. Play at the speed of your own breath.
          </p>
        </div>

        <button
          onClick={() => setMuted((m) => !m)}
          className="px-4 py-2.5 rounded-xl border border-white/15 bg-[#070b16] hover:bg-white/5 text-xs font-medium text-slate-200 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
        >
          {muted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
          {muted ? 'Harmonic Chimes Muted' : 'Harmonic Chimes Active'}
        </button>
      </div>

      {/* 12-Game Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {CALM_GAMES.map((game) => {
          const isSelected = game.id === activeGame;
          return (
            <button
              key={game.id}
              onClick={() => setActiveGame(game.id)}
              className={`text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-400/50 text-white'
                  : 'bg-[#070b16] border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
              }`}
            >
              <div className="text-xs font-mono-tabular text-amber-300/90 mb-1">
                {game.number}.
              </div>
              <div className="text-sm font-semibold truncate">{game.title}</div>
            </button>
          );
        })}
      </div>

      {/* Active Game Arena */}
      <div className="border border-white/10 rounded-2xl bg-[#070b16] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <p className="text-xs text-amber-300">{activeMeta.category}</p>
            <h2 className="text-2xl sm:text-3xl font-serif-display font-semibold text-white">
              {activeMeta.number}. {activeMeta.title}
            </h2>
            <p className="text-sm text-slate-300">{activeMeta.description}</p>
          </div>
          <p className="font-serif-display italic text-base text-amber-200/90 sm:text-right max-w-xs">
            “{activeMeta.quote}”
          </p>
        </div>

        {/* 01. SANITY SOLITAIRE */}
        {activeGame === 'sanity-solitaire' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                Cards Remaining: <strong className="text-white font-mono-tabular">{solitairePool.length}</strong> · Gentle Moves: <strong className="text-white font-mono-tabular">{solitaireMoves}</strong> · Tap any glowing <strong className="text-amber-300">Next Playable</strong> card
              </div>
              <button
                onClick={resetSolitaire}
                className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Deal Fresh Deck
              </button>
            </div>

            {/* 4 Suit Foundations */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {SUITS.map((suit) => (
                <div
                  key={suit.key}
                  className="p-4 rounded-xl bg-[#0d1324] border border-white/10 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs text-slate-400">{suit.name} Foundation</p>
                    <p className="text-lg font-semibold text-white font-mono-tabular mt-0.5">
                      {foundations[suit.key]} / 5
                    </p>
                  </div>
                  <span className={`text-2xl ${suit.color}`}>{suit.symbol}</span>
                </div>
              ))}
            </div>

            {solitairePool.length === 0 ? (
              <div className="p-8 rounded-xl bg-amber-500/10 border border-amber-400/30 text-center space-y-3">
                <h3 className="text-2xl font-serif-display text-amber-200">
                  All Four Suits Restored to Harmony
                </h3>
                <p className="text-sm text-slate-300">
                  “Healing isn’t straight — but it’s always forward.”
                </p>
                <button
                  onClick={resetSolitaire}
                  className="px-5 py-2.5 bg-amber-500 text-slate-950 font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Play Again
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-3">
                {solitairePool.map((card) => {
                  const suitObj = SUITS.find((s) => s.key === card.suit)!;
                  const isPlayable = card.rank === (foundations[card.suit] || 0) + 1;
                  return (
                    <button
                      key={card.id}
                      onClick={() => handleSolitaireCardClick(card)}
                      className={`h-24 rounded-xl border flex flex-col items-center justify-between p-2.5 transition-transform cursor-pointer ${
                        isPlayable
                          ? 'bg-[#131c36] border-amber-400/70 hover:-translate-y-1 text-white'
                          : 'bg-[#0a0f1d] border-white/10 opacity-65 text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-mono-tabular self-start">{card.rank}</span>
                      <span className={`text-xl ${suitObj.color}`}>{suitObj.symbol}</span>
                      <span className="text-[10px] text-slate-400">{suitObj.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 02. COSMIC CONNECT */}
        {activeGame === 'cosmic-connect' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>
                Connected Stars: <strong className="font-mono-tabular text-amber-300">{connectedStep} / 6</strong>
              </span>
              <button
                onClick={() => setConnectedStep(1)}
                className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer"
              >
                Reset Sky
              </button>
            </div>
            <div className="relative h-80 rounded-xl bg-[#040711] border border-white/10 overflow-hidden">
              <svg className="w-full h-full">
                {CONSTELLATION_NODES.map((node, i) => {
                  if (i === 0 || node.step > connectedStep) return null;
                  const prev = CONSTELLATION_NODES[i - 1];
                  return (
                    <line
                      key={node.step}
                      x1={`${prev.x}%`}
                      y1={`${prev.y}%`}
                      x2={`${node.x}%`}
                      y2={`${node.y}%`}
                      stroke="#eab308"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                  );
                })}
              </svg>
              {CONSTELLATION_NODES.map((node) => {
                const isLit = node.step <= connectedStep;
                const isNext = node.step === connectedStep + 1;
                return (
                  <button
                    key={node.step}
                    onClick={() => {
                      if (isNext) {
                        playGentleChime(432 + node.step * 40, 0.35, muted);
                        setConnectedStep(node.step);
                      }
                    }}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    className={`-translate-x-1/2 -translate-y-1/2 absolute px-3 py-1.5 rounded-lg border text-xs font-medium transition-transform cursor-pointer ${
                      isLit
                        ? 'bg-amber-500 text-slate-950 border-amber-300 font-semibold'
                        : isNext
                        ? 'bg-cyan-950 text-amber-200 border-amber-400/70 scale-105'
                        : 'bg-slate-900/90 text-slate-400 border-white/10'
                    }`}
                  >
                    {node.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 03. TRUTH TAG (SENIOR/ACCESSIBLE WORD SEARCH WITH 4-TIER HINTS) */}
        {activeGame === 'truth-tag' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-3">
              <div className="grid grid-cols-9 gap-1.5">
                {GRID_ROWS.map((rowStr, rIdx) =>
                  rowStr.split('').map((letter, cIdx) => {
                    const matchedWord = TRUTH_WORDS.find(
                      (w) =>
                        w.row === rIdx &&
                        cIdx >= w.col &&
                        cIdx < w.col + w.word.length
                    );
                    const isFound = matchedWord && foundWords.includes(matchedWord.word);
                    const isFirstLetterHint =
                      hintTier >= 4 &&
                      matchedWord &&
                      !isFound &&
                      cIdx === matchedWord.col;
                    return (
                      <button
                        key={`${rIdx}-${cIdx}`}
                        onClick={() => matchedWord && toggleFindWord(matchedWord.word)}
                        className={`h-11 rounded-lg font-mono-tabular text-base font-semibold border transition-colors cursor-pointer ${
                          isFound
                            ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                            : isFirstLetterHint
                            ? 'bg-cyan-500/30 border-cyan-400 text-white'
                            : 'bg-[#0d1324] border-white/10 text-slate-200 hover:border-white/30'
                        }`}
                      >
                        {letter}
                      </button>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-slate-400">
                Tap any letter of a sanctuary word in the grid above to illuminate it.
              </p>
            </div>

            <div className="lg:col-span-5 space-y-4 border border-white/10 rounded-xl p-5 bg-[#0d1324]">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">
                  Words Found ({foundWords.length}/{TRUTH_WORDS.length})
                </h3>
                <button
                  onClick={() => setHintTier((t) => (t + 1) % 5)}
                  className="px-3 py-1.5 text-xs bg-amber-500/15 border border-amber-400/40 text-amber-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Hint Tier: {hintTier}/4
                </button>
              </div>
              <div className="space-y-2.5">
                {TRUTH_WORDS.map((item) => {
                  const found = foundWords.includes(item.word);
                  return (
                    <div
                      key={item.word}
                      onClick={() => toggleFindWord(item.word)}
                      className="p-3 rounded-lg border border-white/10 bg-[#070b16] flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <p className={`text-sm font-semibold ${found ? 'text-amber-300 line-through' : 'text-white'}`}>
                          {found || hintTier >= 1 ? item.word : `${item.word[0]}${'·'.repeat(item.word.length - 1)}`}
                        </p>
                        {hintTier >= 2 && (
                          <p className="text-xs text-slate-400 mt-0.5">{item.clue}</p>
                        )}
                        {hintTier >= 3 && (
                          <p className="text-xs text-cyan-300 mt-0.5 font-mono-tabular">
                            Starts at Row {item.row + 1}, Column {item.col + 1}
                          </p>
                        )}
                      </div>
                      {found && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 04. COSMIC FOCUS (BREATHING ORBIT) */}
        {activeGame === 'cosmic-focus' && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
            <div
              className={`w-48 h-48 rounded-full border-2 border-amber-400/50 bg-gradient-to-br from-amber-500/20 via-cyan-500/20 to-transparent flex flex-col items-center justify-center transition-transform duration-1000 ${
                breathPhase === 'Inhale (4s)'
                  ? 'scale-110'
                  : breathPhase === 'Hold Gently (4s)'
                  ? 'scale-110'
                  : 'scale-90'
              }`}
            >
              <span className="text-lg font-serif-display text-amber-200">{breathPhase}</span>
              <span className="text-xs text-slate-400 mt-1 font-mono-tabular">
                Completed Cycles: {breathCycles}
              </span>
            </div>
            <p className="text-sm text-slate-300 max-w-md">
              Let your shoulders drop away from your ears. Follow the gentle pulse of the nebula without forcing your breath.
            </p>
          </div>
        )}

        {/* 05. NUMBER NEBULA */}
        {activeGame === 'number-nebula' && (
          <div className="max-w-md mx-auto space-y-4">
            <p className="text-xs text-slate-400 text-center">
              Tap two matching starlight numbers to merge them into a brighter star.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {nebulaTiles.map((val, idx) => (
                <button
                  key={idx}
                  onClick={() => handleNebulaClick(idx)}
                  className={`h-24 rounded-xl border font-mono-tabular text-2xl font-bold transition-colors cursor-pointer ${
                    selectedNebulaIdx === idx
                      ? 'bg-amber-500 text-slate-950 border-amber-300'
                      : 'bg-[#0d1324] text-white border-white/15 hover:border-amber-400/50'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 06. PATTERN GALAXY */}
        {activeGame === 'pattern-galaxy' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-xl mx-auto items-center">
            <div className="space-y-2 text-center">
              <p className="text-xs text-slate-400">Constellation Template</p>
              <div className="grid grid-cols-3 gap-2.5 p-4 rounded-xl bg-[#0d1324] border border-white/10">
                {TARGET_PATTERN.map((v, i) => (
                  <div
                    key={i}
                    className={`h-14 rounded-lg border ${
                      v === 1 ? 'bg-amber-400/30 border-amber-300' : 'bg-slate-950 border-white/5'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-xs text-amber-300">Your Mirror Grid (Tap to Toggle)</p>
              <div className="grid grid-cols-3 gap-2.5 p-4 rounded-xl bg-[#0d1324] border border-white/10">
                {userPattern.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => togglePatternCell(i)}
                    className={`h-14 rounded-lg border transition-colors cursor-pointer ${
                      v === 1 ? 'bg-amber-400 border-amber-200' : 'bg-slate-950 border-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 07. MEMORY OCEAN */}
        {activeGame === 'memory-ocean' && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Matched Pairs: {matchedSymbols.length} / 4</span>
              <button
                onClick={() => {
                  setMatchedSymbols([]);
                  setFlippedIds([]);
                  setMemoryCards([...INITIAL_MEMORY].sort(() => Math.random() - 0.5));
                }}
                className="px-3 py-1 rounded border border-white/10 hover:bg-white/5 cursor-pointer"
              >
                Shuffle Ocean
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {memoryCards.map((card) => {
                const isVisible =
                  flippedIds.includes(card.id) || matchedSymbols.includes(card.symbol);
                return (
                  <button
                    key={card.id}
                    onClick={() => handleMemoryFlip(card)}
                    className={`h-24 rounded-xl border text-sm font-mono-tabular font-semibold flex flex-col items-center justify-center cursor-pointer ${
                      isVisible
                        ? 'bg-cyan-950/80 border-amber-400/50 text-amber-200'
                        : 'bg-[#0d1324] border-white/10 text-slate-600 hover:border-white/30'
                    }`}
                  >
                    <span>{isVisible ? card.symbol : '·'}</span>
                    {isVisible && <span className="text-[11px] mt-1">{card.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 08. RHYTHM RESONANCE */}
        {activeGame === 'rhythm-resonance' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Tap any pad to chime its frequency and toggle it in your ambient sanctuary pattern.
            </p>
            <div className="space-y-2.5">
              {RHYTHM_NOTES.map((rowNote, rIdx) => (
                <div key={rowNote.name} className="flex items-center gap-3">
                  <span className="w-40 text-xs text-slate-300 shrink-0">{rowNote.name}</span>
                  <div className="grid grid-cols-8 gap-2 flex-1">
                    {rhythmGrid[rIdx].map((active, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => {
                          playGentleChime(rowNote.freq, 0.4, muted);
                          setRhythmGrid((prev) =>
                            prev.map((r, ri) =>
                              ri === rIdx ? r.map((v, ci) => (ci === cIdx ? !v : v)) : r
                            )
                          );
                        }}
                        className={`h-11 rounded-lg border transition-colors cursor-pointer ${
                          active
                            ? 'bg-amber-500/30 border-amber-300 text-amber-200'
                            : 'bg-[#0d1324] border-white/10 hover:border-white/25'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 09. STARDUST DASH */}
        {activeGame === 'stardust-dash' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>
                Golden Stardust Gathered: <strong className="text-amber-300 font-mono-tabular">{stardustCollected}</strong>
              </span>
              <span>Click anywhere in the night sky to drift toward the golden star</span>
            </div>
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const nx = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                const ny = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                moveStarSeed(nx, ny);
              }}
              className="relative h-72 rounded-xl bg-[#040711] border border-white/10 cursor-pointer overflow-hidden"
            >
              <div
                style={{ left: `${starTarget.x}%`, top: `${starTarget.y}%` }}
                className="-translate-x-1/2 -translate-y-1/2 absolute w-9 h-9 rounded-full bg-amber-400/30 border border-amber-300 flex items-center justify-center text-amber-200"
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <div
                style={{ left: `${shipPos.x}%`, top: `${shipPos.y}%` }}
                className="-translate-x-1/2 -translate-y-1/2 absolute px-3 py-1 rounded-full bg-sky-500 text-slate-950 text-xs font-semibold shadow-md transition-all duration-300"
              >
                You
              </div>
            </div>
          </div>
        )}

        {/* 10. HEALING HZ */}
        {activeGame === 'healing-hz' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FREQUENCIES.map((f) => {
              const isPlaying = playingHz === f.hz;
              return (
                <div
                  key={f.hz}
                  className={`p-5 rounded-xl border flex flex-col justify-between gap-4 ${
                    isPlaying
                      ? 'bg-amber-500/15 border-amber-400/60'
                      : 'bg-[#0d1324] border-white/10'
                  }`}
                >
                  <div>
                    <h3 className="text-base font-semibold text-white font-mono-tabular">
                      {f.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{f.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleFrequency(f.hz)}
                    className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                      isPlaying
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    {isPlaying ? 'Stop Tone' : `Play ${f.hz} Hz Sine Tone`}
                  </button>
                </div>
              );
            })}
            <p className="sm:col-span-2 lg:col-span-3 text-[11px] text-slate-500 text-center pt-1">
              Optional ambient audio & relaxation tool · Not a clinical or medical treatment.
            </p>
          </div>
        )}

        {/* 11. MIND MODE */}
        {activeGame === 'mind-mode' && (
          <div className="max-w-xl mx-auto space-y-5 text-center py-4">
            <div className="p-6 rounded-2xl bg-[#0d1324] border border-white/10 space-y-4">
              <p className="text-xs text-slate-400">The Shadow Whisper</p>
              <p className="text-xl font-serif-display text-slate-200">
                {MIND_CARDS[mindCardIdx].shadow}
              </p>
              {mindRevealed ? (
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <p className="text-xs text-amber-300">Pleading Sanity Reframe</p>
                  <p className="text-lg font-serif-display text-amber-200">
                    {MIND_CARDS[mindCardIdx].truth}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => {
                    playGentleChime(528, 0.35, muted);
                    setMindRevealed(true);
                  }}
                  className="px-5 py-2.5 bg-amber-500 text-slate-950 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Reveal Sanctuary Truth
                </button>
              )}
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setMindCardIdx((i) => (i + 1) % MIND_CARDS.length);
                  setMindRevealed(false);
                }}
                className="px-4 py-2 text-xs text-slate-300 border border-white/15 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                Next Reflection Card
              </button>
            </div>
          </div>
        )}

        {/* 12. MOOD JOURNEY */}
        {activeGame === 'mood-journey' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form onSubmit={addMoodStar} className="lg:col-span-5 space-y-4 bg-[#0d1324] p-5 rounded-xl border border-white/10">
              <h3 className="text-base font-semibold text-white">Place a Star in Tonight’s Sky</h3>
              <div>
                <label className="block text-xs text-slate-400 mb-1">How does your inner sky feel?</label>
                <select
                  value={moodFeeling}
                  onChange={(e) => setMoodFeeling(e.target.value)}
                  className="w-full bg-[#070b16] border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option>Grounded</option>
                  <option>Quietly Hopeful</option>
                  <option>Weathering a Storm</option>
                  <option>Turning Pain Into Power</option>
                  <option>Resting Beneath the Tree</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">One honest line for yourself</label>
                <input
                  type="text"
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  placeholder="e.g., Made it through a heavy afternoon..."
                  className="w-full bg-[#070b16] border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 text-slate-950 font-semibold text-xs rounded-lg cursor-pointer"
              >
                Add Star to Constellation
              </button>
            </form>

            <div className="lg:col-span-7 space-y-3">
              {moodStars.map((star) => (
                <div
                  key={star.id}
                  className="p-4 rounded-xl bg-[#0d1324] border border-white/10 flex items-start justify-between gap-4"
                >
                  <div>
                    <p className="text-xs text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{star.feeling}</span>
                      <span>·</span>
                      <span className="font-mono-tabular text-slate-400">{star.time}</span>
                    </p>
                    <p className="text-sm text-slate-200 mt-1">{star.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
