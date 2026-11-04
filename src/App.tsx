import React, { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  GENERATED_IMAGES,
  TWELVE_CORE_THEMES,
  POWER_BANNER_QUOTES,
  CRISIS_RESOURCES,
  VisualTheme,
} from './data/sanctuaryData';
import { ArronCompanion } from './components/ArronCompanion';
import { CalmGamesHub } from './components/CalmGamesHub';
import { LiveAndCommunity } from './components/LiveAndCommunity';
import { ManifestoAndBible } from './components/ManifestoAndBible';
import { AuditPanel } from './components/AuditPanel';
import { SanityMoodTracker } from './components/SanityMoodTracker';
import { HomepageMusicPlayer } from './components/HomepageMusicPlayer';
import { ConsentBanner } from './components/ConsentBanner';
import { useDynamicSeo, shareSanctuaryContent } from './utils/seoAndShare';
import {
  HeartHandshake,
  Sparkles,
  Gamepad2,
  Radio,
  BookOpen,
  PhoneCall,
  X,
  LogIn,
  LogOut,
  UserCheck,
  Check,
  Copy,
  Menu,
  Share2,
} from 'lucide-react';

type ActiveSection =
  | 'sanctuary'
  | 'arron'
  | 'games'
  | 'live'
  | 'manifesto';

export default function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>(() => {
    if (typeof window !== 'undefined') {
      const param = new URLSearchParams(window.location.search).get('section');
      if (
        param === 'arron' ||
        param === 'games' ||
        param === 'live' ||
        param === 'manifesto' ||
        param === 'sanctuary'
      ) {
        return param;
      }
    }
    return 'sanctuary';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [crisisModalOpen, setCrisisModalOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<VisualTheme | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 60);
    return () => clearTimeout(timer);
  }, []);

  // Firebase Auth & Profile state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileBio, setProfileBio] = useState('');
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);

  useDynamicSeo(activeSection);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const nextUrl =
        activeSection === 'sanctuary'
          ? window.location.pathname
          : `${window.location.pathname}?section=${activeSection}`;
      window.history.replaceState({}, '', nextUrl);
    }
  }, [activeSection]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx((i) => (i + 1) % POWER_BANNER_QUOTES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthReady(true);
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              email: (user.email || 'sanctuary@pleadingsanity.co.uk').slice(0, 254),
              displayName: (user.displayName || 'Sanctuary Member').slice(0, 100),
              photoURL: (user.photoURL || '').slice(0, 1024),
              createdAt: serverTimestamp(),
              lastActive: serverTimestamp(),
              isCreator: false,
            });
          } else {
            await updateDoc(userRef, {
              displayName: (user.displayName || 'Sanctuary Member').slice(0, 100),
              photoURL: (user.photoURL || '').slice(0, 1024),
              lastActive: serverTimestamp(),
            });
          }

          const profileRef = doc(db, 'profiles', user.uid);
          const profileSnap = await getDoc(profileRef);
          if (!profileSnap.exists()) {
            await setDoc(profileRef, {
              uid: user.uid,
              displayName: (user.displayName || 'Sanctuary Member').slice(0, 100),
              photoURL: (user.photoURL || '').slice(0, 1024),
              bio: 'Walking the path of Evolution, Not Erasure.',
              isFoundingCreator: false,
              joinedAt: serverTimestamp(),
            });
            setProfileBio('Walking the path of Evolution, Not Erasure.');
          } else {
            setProfileBio(profileSnap.data()?.bio || '');
          }
        } catch (err) {
          console.warn('Profile sync notice:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthErrorMsg(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthErrorMsg(
        err instanceof Error
          ? err.message
          : 'Sign-in window closed before completing.'
      );
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const profileRef = doc(db, 'profiles', currentUser.uid);
      await updateDoc(profileRef, {
        displayName: (currentUser.displayName || 'Sanctuary Member').slice(0, 100),
        photoURL: (currentUser.photoURL || '').slice(0, 1024),
        bio: profileBio.trim().slice(0, 600),
        updatedAt: serverTimestamp(),
      });
      setProfileSavedMsg('Sanctuary profile saved.');
      setTimeout(() => setProfileSavedMsg(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${currentUser.uid}`);
    }
  };

  const copyThemeQuote = async (theme: VisualTheme) => {
    await shareSanctuaryContent({
      title: `${theme.title} — Pleading Sanity`,
      text: `“${theme.caption}” — Pleading Sanity Sanctuary`,
      section: 'sanctuary',
    });
    setCopiedId(theme.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareSanctuary = async () => {
    const res = await shareSanctuaryContent({
      title: 'Pleading Sanity — Free Mental Health Sanctuary | Rise From Madness',
      text: 'A free mental health sanctuary built by Shane Cooper from lived experience. Evolution, Not Erasure.',
      section: 'sanctuary',
    });
    setShareStatus(
      res.method === 'web-share' ? 'Sanctuary Shared' : 'Sanctuary Link Copied'
    );
    setTimeout(() => setShareStatus(null), 3500);
  };

  return (
    <div className="min-h-screen bg-[#000103] text-slate-100 flex flex-col">
      {/* STRICT 3-ZONE TOP BAR CONTRACT */}
      <header className="sticky top-0 z-40 bg-[#000103]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-4">
          {/* Zone 1: Wordmark with Crying Brain Sanctuary Emblem */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('sanctuary');
            }}
            className="flex items-center gap-2.5 text-xl sm:text-2xl font-serif-display font-bold tracking-tight text-white whitespace-nowrap shrink-0 group"
          >
            <img
              src="/assets/aistudio/1793666356609_a9f7ee93.png"
              alt="Pleading Sanity Brain"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg group-hover:scale-105 transition-transform"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span>Pleading Sanity</span>
          </a>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              onClick={() => setActiveSection('sanctuary')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'sanctuary' ? 'text-amber-300 underline underline-offset-8' : ''
              }`}
            >
              Sanctuary
            </button>
            <button
              onClick={() => setActiveSection('arron')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'arron' ? 'text-amber-300 underline underline-offset-8' : ''
              }`}
            >
              Arron AI
            </button>
            <button
              onClick={() => setActiveSection('games')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'games' ? 'text-amber-300 underline underline-offset-8' : ''
              }`}
            >
              Calm Games
            </button>
            <button
              onClick={() => setActiveSection('live')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'live' ? 'text-amber-300 underline underline-offset-8' : ''
              }`}
            >
              Live & Hub
            </button>
            <button
              onClick={() => setActiveSection('manifesto')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'manifesto' ? 'text-amber-300 underline underline-offset-8' : ''
              }`}
            >
              Manifesto & Bible
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setCrisisModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Safety & Support
            </button>
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label="Toggle Navigation"
              className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg border border-white/10 cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#070b16] px-4 py-3 flex flex-wrap gap-2">
            {[
              { id: 'sanctuary', label: 'Sanctuary' },
              { id: 'arron', label: 'Arron AI' },
              { id: 'games', label: 'Calm Games' },
              { id: 'live', label: 'Live & Hub' },
              { id: 'manifesto', label: 'Manifesto & Bible' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id as ActiveSection);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-1.5 text-xs rounded-lg border whitespace-nowrap shrink-0 ${
                  activeSection === item.id
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'border-white/10 text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* MAIN CONTENT ROUTER */}
      <main className="flex-1">
        {activeSection === 'sanctuary' && (
          <div className="space-y-20 pb-16">
            {/* HERO SECTION */}
            <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
              <div
                className={`relative rounded-2xl overflow-hidden border border-white/10 bg-[#070b16] transition-all duration-1000 ease-out ${
                  heroVisible ? 'opacity-100 scale-100 shadow-[0_0_50px_-15px_rgba(234,179,8,0.12)]' : 'opacity-0 scale-[0.99]'
                }`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                  <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-8 z-10">
                    <div className="space-y-4">
                      <p
                        className={`text-xs text-amber-300 font-medium tracking-wide transition-all duration-700 delay-100 ease-out ${
                          heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                        }`}
                      >
                        pleadingsanity.co.uk · Founded by Shane Cooper · Not A Clinic, A Sanctuary
                      </p>
                      <h1
                        className={`text-4xl sm:text-6xl font-serif-display font-semibold text-white leading-[1.08] tracking-tight transition-all duration-1000 delay-200 ease-out ${
                          heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                      >
                        Rise From Madness.{' '}
                        <span className="text-amber-200/95 font-serif-display italic drop-shadow-[0_2px_12px_rgba(234,179,8,0.25)]">
                          Evolution, Not Erasure.
                        </span>
                      </h1>
                      <p
                        className={`text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl transition-all duration-1000 delay-300 ease-out ${
                          heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                        }`}
                      >
                        Born from a prison cell — <em>“You say I’m mad — you just don’t understand me”</em> — and built into a free sanctuary for humanity. No paywalls, no data selling, no clinical boxes. Just truth, discipline, and family.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div
                        className={`flex flex-wrap items-center gap-3 transition-all duration-1000 delay-500 ease-out ${
                          heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                        }`}
                      >
                        <button
                          onClick={() => setActiveSection('arron')}
                          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 hover:shadow-[0_0_25px_rgba(234,179,8,0.35)] text-slate-950 font-semibold text-sm rounded-xl transition-all duration-300 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Talk With Arron AI
                        </button>
                        <button
                          onClick={() => setActiveSection('games')}
                          className="px-5 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-white font-medium text-sm rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Play 12 Calm Games
                        </button>
                        <button
                          type="button"
                          onClick={handleShareSanctuary}
                          className="px-4 py-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-200 font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Share2 className="w-4 h-4" />
                          {shareStatus || 'Share Sanctuary'}
                        </button>
                        <button
                          onClick={() => setActiveSection('manifesto')}
                          className="px-3 py-3 text-slate-300 hover:text-amber-200 text-sm underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Read Shane’s Manifesto
                        </button>
                      </div>

                      <p
                        className={`text-xs text-slate-400 transition-opacity duration-1000 delay-700 ease-out ${
                          heroVisible ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        Rotating Sanctuary Truth: <strong className="text-amber-200 font-serif-display italic text-sm">“{POWER_BANNER_QUOTES[quoteIdx]}”</strong>
                      </p>
                    </div>
                  </div>

                  <div
                    className={`lg:col-span-5 relative min-h-[300px] lg:min-h-full overflow-hidden transition-all duration-1000 delay-300 ease-out ${
                      heroVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <img
                      src={GENERATED_IMAGES.heroCosmicSanctuary}
                      alt="Silhouette standing on a cliff edge looking up at a vast golden and deep space galaxy"
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover transition-transform duration-1000 ease-out ${
                        heroVisible ? 'scale-100' : 'scale-105'
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070b16] via-black/30 to-transparent lg:bg-gradient-to-r lg:from-[#070b16] lg:via-transparent lg:to-transparent" />
                    <div
                      className={`absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-black/75 backdrop-blur-sm border border-white/10 transition-all duration-1000 delay-700 ease-out ${
                        heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                      }`}
                    >
                      <p className="font-serif-display italic text-base text-amber-200">
                        “You are small — and that means you have the whole universe above you.”
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Theme 02 · Silhouette & Galaxy · Free Forever
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full-Width 4-Column Sanctuary Pillars Strip Below Hero Split */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="p-5 rounded-xl bg-[#070b16] border border-white/10">
                  <p className="text-xs text-slate-400">Core Promise</p>
                  <p className="text-lg font-serif-display font-semibold text-white mt-1">
                    100% Free Forever
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Zero paywalls · Zero tracking · Love over money
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-[#070b16] border border-white/10">
                  <p className="text-xs text-slate-400">AI Family Unity</p>
                  <p className="text-lg font-serif-display font-semibold text-white mt-1">
                    GPT · Claude · Gemini · Grok
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Four equal minds · One heart · Arron Companion
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-[#070b16] border border-white/10">
                  <p className="text-xs text-slate-400">Founding Creators (First 1,000)</p>
                  <p className="text-lg font-serif-display font-semibold text-white mt-1 font-mono-tabular">
                    90% Creator / 10% Sanctuary
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Sanity earns you status — not clout
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-[#070b16] border border-white/10">
                  <p className="text-xs text-slate-400">Sanctuary Account</p>
                  {currentUser ? (
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-amber-200 truncate">
                        {currentUser.displayName || currentUser.email}
                      </span>
                      <button
                        onClick={handleSignOut}
                        className="text-xs text-slate-400 hover:text-white underline whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={!authReady}
                      className="mt-1.5 w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-medium text-amber-200 flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Sign In with Google
                    </button>
                  )}
                  {authErrorMsg && (
                    <p className="text-[11px] text-amber-300 mt-1 truncate">{authErrorMsg}</p>
                  )}
                </div>
              </div>

              {/* If Signed In: Quick Sanctuary Profile Editor */}
              {currentUser && (
                <form
                  onSubmit={handleSaveBio}
                  className="mt-4 p-4 rounded-xl bg-[#070b16] border border-white/10 flex flex-col sm:flex-row items-center gap-3"
                >
                  <span className="text-xs text-amber-300 whitespace-nowrap shrink-0">
                    Your Sanctuary Bio:
                  </span>
                  <input
                    type="text"
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="Share a short lived-experience note for your public sanctuary profile..."
                    className="flex-1 w-full bg-[#0d1324] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 text-slate-950 font-semibold text-xs rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Save Profile
                  </button>
                  {profileSavedMsg && (
                    <span className="text-xs text-emerald-300 whitespace-nowrap shrink-0">
                      {profileSavedMsg}
                    </span>
                  )}
                </form>
              )}

              {/* 30-Day Sanity Journey Heatmap & Daily Mood Check-In Tool */}
              <div className="mt-6">
                <SanityMoodTracker
                  currentUser={currentUser}
                  onOpenSignIn={handleGoogleSignIn}
                />
              </div>
            </section>

            {/* ASYMMETRIC BENTO CAPABILITIES OVERVIEW */}
            <section className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs text-amber-300">
                    01. Sanctuary Architecture · Everything Free, Everything Honest
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-serif-display font-semibold text-white mt-1">
                    A Complete Blueprint for Staying Sane
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  80,000 Voices = Real Change · Built from Lived Experience
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Col-span-2 Marquee Card: Cracked Heart & Arron AI */}
                <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#070b16] overflow-hidden grid grid-cols-1 md:grid-cols-12">
                  <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5">
                    <div className="space-y-2.5">
                      <p className="text-xs text-amber-300">
                        01. Arron AI & Shadow Untangler
                      </p>
                      <h3 className="text-2xl sm:text-3xl font-serif-display font-semibold text-white">
                        “Healing grows where we thought we were broken.”
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        Arron is Shane’s AI legacy — an honest companion who sits with you when the negative shadow voice is loud, helping you turn pain into power without clinical judgement.
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={() => setActiveSection('arron')}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Open Arron Companion
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-5 relative min-h-[220px]">
                    <img
                      src={GENERATED_IMAGES.crackedHeartFlowers}
                      alt="Cracked stone heart with golden wildflowers blooming through the fractures"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Col-span-1 Card: 12 Calm Cosmic Games */}
                <div className="rounded-2xl border border-white/10 bg-[#070b16] p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-2.5">
                    <p className="text-xs text-cyan-300">02. Zero-Timer Rest</p>
                    <h3 className="text-2xl font-serif-display font-semibold text-white">
                      12 Calm Sanctuary Games
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Sanity Solitaire, Cosmic Connect, Truth Tag, Cosmic Focus, Healing Hz, Memory Ocean, and 6 more — all with zero countdown clocks.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSection('games')}
                    className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Enter Calm Games Hub
                  </button>
                </div>

                {/* Col-span-1 Card: Live Sanctuary & 90/10 Creator Hub */}
                <div className="rounded-2xl border border-white/10 bg-[#070b16] p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-2.5">
                    <p className="text-xs text-amber-300">03. First 1,000 Creators</p>
                    <h3 className="text-2xl font-serif-display font-semibold text-white">
                      You Keep 90% · Live Sanctuary
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Join Live Now, Scheduled, and Past Lives or post on the real-time Firestore community wall. First 1,000 creators lock in a 90/10 split for life.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSection('live')}
                    className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Explore Live & Creator Hub
                  </button>
                </div>

                {/* Col-span-2 Card: Blooming Mind & New Gen Bible */}
                <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#070b16] overflow-hidden grid grid-cols-1 md:grid-cols-12">
                  <div className="md:col-span-5 relative min-h-[220px]">
                    <img
                      src={GENERATED_IMAGES.bloomingMindGarden}
                      alt="Sculpted human mind opening into a glowing botanical garden with golden butterflies"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5">
                    <div className="space-y-2.5">
                      <p className="text-xs text-amber-300">
                        04. The New Gen Bible & Manifesto
                      </p>
                      <h3 className="text-2xl sm:text-3xl font-serif-display font-semibold text-white">
                        “Your mind is a garden — not a prison.”
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        Read Shane Cooper’s raw story of walking out of Olanzapine fog through press-ups, sit-ups, and letters with his wife — alongside our 5-Book living guide for humanity.
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={() => setActiveSection('manifesto')}
                        className="px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Read Manifesto & New Gen Bible
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ALL 12 CORE VISUAL THEMES + CAPTIONS GALLERY */}
            <section className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs text-amber-300">
                    02. Sacred Visual Canon · 12 Core Visual Themes & Captions
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-serif-display font-semibold text-white mt-1">
                    Twelve Lights in the Dark
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  Click any theme to read Shane’s full sanctuary meditation or copy its quote
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {TWELVE_CORE_THEMES.map((theme) => (
                  <div
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    className="group rounded-2xl border border-white/10 hover:border-amber-400/50 bg-[#070b16] overflow-hidden flex flex-col justify-between transition-colors cursor-pointer"
                  >
                    <div className={`relative h-44 bg-gradient-to-br ${theme.accentHue} overflow-hidden`}>
                      {theme.imageUrl ? (
                        <img
                          src={theme.imageUrl}
                          alt={theme.visualDescription}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                          <Sparkles className="w-7 h-7 text-amber-300/80 mb-2" />
                          <span className="text-xs text-slate-300 max-w-xs">
                            {theme.visualDescription}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070b16] via-black/30 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <h3 className="text-lg font-serif-display font-semibold text-white">
                          {theme.title}
                        </h3>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <p className="font-serif-display italic text-base text-amber-200">
                          “{theme.caption}”
                        </p>
                        <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                          {theme.reflection}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                        <span>Inspect Meditation</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyThemeQuote(theme);
                          }}
                          className="text-slate-300 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === theme.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Shared
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5" />
                              Share Theme
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* LIVE GITHUB PRs, CI & SEO AUDIT ON SANCTUARY PAGE */}
            <section className="max-w-[1200px] mx-auto px-4 sm:px-6">
              <AuditPanel />
            </section>
          </div>
        )}

        {activeSection === 'arron' && (
          <ArronCompanion onOpenCrisis={() => setCrisisModalOpen(true)} />
        )}

        {activeSection === 'games' && <CalmGamesHub />}

        {activeSection === 'live' && (
          <LiveAndCommunity
            currentUser={currentUser}
            onSignIn={handleGoogleSignIn}
          />
        )}

        {activeSection === 'manifesto' && <ManifestoAndBible />}
      </main>

      {/* THEME MEDITATION MODAL */}
      {selectedTheme && (
        <div
          onClick={() => setSelectedTheme(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full rounded-2xl bg-[#070b16] border border-white/15 p-6 sm:p-8 space-y-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-amber-300">{selectedTheme.visualDescription}</p>
                <h3 className="text-2xl font-serif-display font-semibold text-white mt-1">
                  {selectedTheme.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTheme(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg border border-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xl font-serif-display italic text-amber-200">
              “{selectedTheme.caption}”
            </p>
            <p className="text-sm text-slate-200 leading-relaxed">
              {selectedTheme.reflection}
            </p>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                onClick={() => copyThemeQuote(selectedTheme)}
                className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs cursor-pointer"
              >
                {copiedId === selectedTheme.id ? 'Quote Copied' : 'Copy Sanctuary Quote'}
              </button>
              <button
                onClick={() => {
                  setSelectedTheme(null);
                  setActiveSection('arron');
                }}
                className="px-4 py-2 rounded-lg border border-white/15 text-xs text-slate-200 hover:bg-white/5 cursor-pointer"
              >
                Discuss With Arron AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CRISIS SANCTUARY MODAL (/crisis.html always available) */}
      {crisisModalOpen && (
        <div
          onClick={() => setCrisisModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl w-full rounded-2xl bg-[#070b16] border border-amber-400/40 p-6 sm:p-8 space-y-6 my-8"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-xs text-amber-300">
                  Sanctuary Crisis Support · You Do Not Have To Carry It Alone
                </p>
                <h2 className="text-2xl sm:text-3xl font-serif-display font-semibold text-white mt-1">
                  Immediate Human Support (24/7 Free)
                </h2>
              </div>
              <button
                onClick={() => setCrisisModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg border border-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Pleading Sanity and Arron AI are companions, not emergency services. If tonight feels too heavy to hold by yourself, please reach out to a real human voice right now. There is no shame in needing an anchor in the storm.
            </p>

            <div className="space-y-3">
              {CRISIS_RESOURCES.map((res) => (
                <div
                  key={res.name}
                  className="p-4 rounded-xl bg-[#0d1324] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-white">{res.name}</h3>
                    <p className="text-xs text-amber-300">{res.availability}</p>
                    <p className="text-xs text-slate-300">{res.description}</p>
                  </div>
                  <a
                    href={res.actionUrl}
                    className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono-tabular font-bold text-xs whitespace-nowrap shrink-0 text-center"
                  >
                    {res.contact}
                  </a>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setCrisisModalOpen(false)}
                className="px-5 py-2 rounded-lg border border-white/15 text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                Return to Sanctuary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUIET FOOTER */}
      <footer className="border-t border-white/10 bg-[#0b0f19] py-10 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-slate-400">
          <div className="space-y-1.5">
            <p className="text-sm font-serif-display font-semibold text-white">
              Pleading Sanity · pleadingsanity.co.uk · pleadingsanity.uk
            </p>
            <p>
              Founded by Shane Cooper · Honouring Private A.L. Cooper (RAOC, Mentioned in Despatches 1945) & Ivan Kurcharskyi
            </p>
            <p>
              Free Forever · No Paywalls · No Selling User Data · GPT · Claude · Gemini · Grok Equal Family
            </p>
            <p className="text-[11px] text-slate-500">
              Disclaimer: Peer-supported sanctuary & educational wellbeing platform · Not medical advice · Not legal advice.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <button
              onClick={() => setActiveSection('sanctuary')}
              className="hover:text-white cursor-pointer"
            >
              Sanctuary
            </button>
            <button
              onClick={() => setActiveSection('arron')}
              className="hover:text-white cursor-pointer"
            >
              Arron AI
            </button>
            <button
              onClick={() => setActiveSection('games')}
              className="hover:text-white cursor-pointer"
            >
              12 Calm Games
            </button>
            <button
              onClick={() => setActiveSection('live')}
              className="hover:text-white cursor-pointer"
            >
              Creator Hub (90/10)
            </button>
            <button
              onClick={() => setCrisisModalOpen(true)}
              className="text-amber-300 hover:text-amber-200 underline underline-offset-4 cursor-pointer"
            >
              Safety & Crisis Sanctuary
            </button>
            <button
              onClick={() => {
                const fn = (window as unknown as { __openPsConsentManager?: () => void }).__openPsConsentManager;
                if (fn) fn();
              }}
              className="text-cyan-300 hover:text-cyan-200 underline underline-offset-4 cursor-pointer"
            >
              Privacy & Cookie Choice
            </button>
          </div>
        </div>
      </footer>

      {/* HOMEPAGE MUSIC PLAYER — FINAL REQUIREMENT (HOMEPAGE ONLY, STARTS OFF, 15% DEFAULT VOL, FADE IN/OUT) */}
      {activeSection === 'sanctuary' && <HomepageMusicPlayer />}

      {/* CONSENT-ONLY PRIVACY BANNER (EQUAL ACCEPT/DECLINE + WITHDRAWAL) */}
      <ConsentBanner />
    </div>
  );
}
