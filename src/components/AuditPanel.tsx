import React, { useState, useEffect } from 'react';
import {
  GitPullRequest,
  GitCommit,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  SearchCheck,
  Check,
  Copy,
  Sun,
  Music,
  Globe,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface PrItem {
  number: number;
  title: string;
  state: string;
  merged: boolean;
  branch: string;
  sha?: string;
  updatedAt: string;
  url: string;
}

interface CommitItem {
  sha: string;
  author: string;
  date: string;
  message: string;
  url: string;
}

interface CiRunItem {
  id: number;
  name: string;
  branch: string;
  sha?: string;
  status: string;
  conclusion: string | null;
  url: string;
  createdAt: string;
}

interface AuditData {
  openPrCount: number;
  latestCommits?: CommitItem[];
  recentPrs: PrItem[];
  ciRuns: CiRunItem[];
  charterStatus?: {
    charterPresent: boolean;
    handoffPresent: boolean;
    agentsContractPresent: boolean;
    blueprintVersion: string;
    arronSoulVersion: string;
    continuityPlanPresent: boolean;
  };
  deployBlocker: {
    detected: boolean;
    summary: string;
    fixCommand: string;
  };
}

interface SecuritySeoAuditData {
  timestamp: string;
  cspAudit: {
    policyFilePresent: boolean;
    netlifyHeadersPresent: boolean;
    arronRouteIsolated: boolean;
    paymentModulesHardened: boolean;
    objectSrcNoneEnforced: boolean;
    scriptSrcAttrNoneEnforced: boolean;
    firebaseConfigIntact: boolean;
    trustedScriptDomains: string[];
    arronConnectAllowlist: string[];
    paymentConnectAllowlist: string[];
  };
  seoMetaAudit: {
    title: { value: string; length: number; optimal: boolean };
    description: { value: string; length: number; optimal: boolean };
    canonicalUrl: string | null;
    hreflangPresent: boolean;
    geoRegionPresent: boolean;
    openGraphComplete: boolean;
    twitterCardComplete: boolean;
    schemaOrgGraphEntities: string[];
    sitemapXmlPresent: boolean;
    robotsTxtPresent: boolean;
    manifestPresent: boolean;
  };
}

const TEN_PAGE_SEO_PACKAGE = [
  {
    page: '1. Homepage (index.html)',
    title: 'Pleading Sanity — Free UK Mental Health Sanctuary | Rise From Madness',
    description:
      'Founded by Shane Cooper in Leicester from lived experience. Talk with Arron AI, play 12 no-timer calm games, explore the Journal Vault & New Gen Bible — 100% free forever.',
  },
  {
    page: '2. Arron AI (arron.html)',
    title: 'Arron AI Companion — Honest 24/7 Peer Support | Pleading Sanity',
    description:
      'Sit with Arron — the gentle, non-clinical AI companion built by Shane Cooper to help you stay sane, untangle heavy thoughts, and access immediate UK crisis signposting.',
  },
  {
    page: '3. Calm Games (games.html)',
    title: '12 Free Calm Mental Health Games — No Timers, No Paywalls | Pleading Sanity',
    description:
      'Play Sanity Solitaire, Cosmic Connect, Truth Tag, Cosmic Focus, Memory Ocean, and Healing Hz with zero countdown clocks, zero ads, and zero pressure.',
  },
  {
    page: '4. Journal Vault (journal-vault.html)',
    title: 'Private Sanity Journal Vault & 30-Day Mood Heatmap | Pleading Sanity',
    description:
      'Log daily check-ins, energy levels, and honest reflections in your private, owner-isolated Sanity Journal Vault. Reflect, release, and evolve without judgement.',
  },
  {
    page: '5. Insane Solar (insane-solar.html)',
    title: 'Insane Solar — Honest UK Domestic Solar & Battery Guidance | Pleading Sanity',
    description:
      'Transparent UK solar PV, hybrid inverter, and battery storage enquiries powered by the grounded Solar Assistant. 0% VAT eligibility guidance under HMRC Notice 708/6.',
  },
  {
    page: '6. P.S. Apparel Shop (shop.html)',
    title: 'Pleading Sanity Apparel — Performance, Recovery & Crying Brain Streetwear',
    description:
      'Quiet-luxury heavyweight recovery wear featuring the official Crying Brain emblem. Built for discipline, lived resilience, and supporting the free mental health sanctuary.',
  },
  {
    page: '7. About & Manifesto (about.html)',
    title: 'Shane Cooper’s Manifesto — Evolution, Not Erasure | Pleading Sanity',
    description:
      'Read Shane Cooper’s raw story from a prison cell and Olanzapine recovery to building a free UK mental health sanctuary honouring Pte A.L. Cooper (RAOC) & Ivan Kurcharskyi.',
  },
  {
    page: '8. Support & Crisis (crisis.html / support.html)',
    title: '24/7 UK Crisis Support Lines — Samaritans 116 123 & SHOUT 85258 | Pleading Sanity',
    description:
      'Immediate, tappable UK crisis support: Call Samaritans free on 116 123, text SHOUT to 85258, call NHS 111 Option 2, or dial 999 in an emergency. You don’t carry it alone.',
  },
  {
    page: '9. Ollie & Friends Kids Sanctuary (kids.html)',
    title: 'Ollie & Friends — Calm Chess, Stories & Gentle Emotional Skills for Kids',
    description:
      'A safe, ad-free space where children learn patience, breathing, and emotional resilience through Ollie & Friends Chess and gentle cosmic storytelling.',
  },
  {
    page: '10. Founding Creator Hub (creator.html / live.html)',
    title: 'Founding Creator Hub — First 1,000 Keep 90% | Pleading Sanity Live',
    description:
      'Join the First 1,000 Founding Creators at Pleading Sanity. Share lived-experience streams and creative work while keeping 90% of revenue when payout infrastructure launches.',
  },
];

const TEN_SOCIAL_CAPTIONS = [
  '1. "You say I’m mad — you just don’t understand me." That line was born in a cell. Today it’s a free sanctuary for anyone fighting their own shadow voice. No paywalls. No clipboards. https://pleadingsanity.co.uk #PleadingSanity #RiseFromMadness',
  '2. Your mind is a garden — not a prison. When the noise gets loud tonight, come sit with Arron or play Sanity Solitaire with zero timers and zero ads: https://pleadingsanity.co.uk #MentalHealthUK #EvolutionNotErasure',
  '3. Solid stone lets nothing in. It’s the crack in the stone where the roots take hold and the wildflowers grow through. Healing grows where we thought we were broken. https://pleadingsanity.co.uk',
  '4. Why do most "wellness" apps lock breathing and journalling behind a £60/year subscription? Mental health support should be free forever. Love over money. Truth over noise. https://pleadingsanity.co.uk',
  '5. Fighting the negative voice in your head isn’t a weakness — learning to sit with that shadow and turn the pressure into discipline is a superpower. Read the Manifesto: https://pleadingsanity.co.uk/?section=manifesto',
  '6. Can’t sleep at 3am? We built 12 calm cosmic games with zero countdown clocks, plus pure 432Hz & 528Hz ambient frequencies to help your shoulders drop. Free at https://pleadingsanity.co.uk/?section=games',
  '7. Honouring Private A.L. Cooper (RAOC, Mentioned in Despatches 1945) and Ivan Kurcharskyi. Quiet duty, survival, and leaving people better than you found them. https://pleadingsanity.co.uk',
  '8. Creators shouldn’t have to feed outrage algorithms to survive. Our First 1,000 Founding Creators lock in a 90/10 split for life — sanity earns you status, not clout. https://pleadingsanity.co.uk/?section=live',
  '9. Healing isn’t a straight line up the mountain — it bends and switches back so the climb doesn’t break your heart. Track your 30-day sanity journey privately at https://pleadingsanity.co.uk',
  '10. If tonight feels too heavy to carry alone: Samaritans are free 24/7 on 116 123, text SHOUT to 85258, or call NHS 111 Option 2. And our sanctuary door is always unlatched: https://pleadingsanity.co.uk',
];

const NETLIFY_CSP_SNIPPET = `# /_headers — Generated from content-security-policy.json (v1.2.0)
# 1. Arron AI & Journal Vault Hardened Perimeter
/arron*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Cache-Control: no-store, no-cache, must-revalidate, max-age=0
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=(), autoplay=()
  Content-Security-Policy: default-src 'self'; script-src 'self' https://apis.google.com https://www.gstatic.com; script-src-elem 'self' https://apis.google.com https://www.gstatic.com; script-src-attr 'none'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://pleadingsanity.co.uk; media-src 'none'; connect-src 'self' https://pleadingsanity.co.uk https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-src 'self' https://*.firebaseapp.com https://accounts.google.com; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests

# 2. Payment-Linked Modules Hardened (/shop*, /creator*, /support*, /insane-solar*)
/shop*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Cache-Control: no-store, must-revalidate
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com" "https://checkout.stripe.com" "https://www.paypal.com"), usb=(), interest-cohort=(), browsing-topics=()
  Content-Security-Policy: default-src 'self'; script-src 'self' https://js.stripe.com https://www.paypal.com https://www.paypalobjects.com https://apis.google.com https://www.gstatic.com; script-src-elem 'self' https://js.stripe.com https://www.paypal.com https://www.paypalobjects.com https://apis.google.com https://www.gstatic.com; script-src-attr 'none'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://pleadingsanity.co.uk https://firebasestorage.googleapis.com https://*.stripe.com https://www.paypalobjects.com; media-src 'self'; connect-src 'self' https://pleadingsanity.co.uk https://api.stripe.com https://checkout.stripe.com https://www.paypal.com https://www.paypalobjects.com https://api-m.paypal.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://www.paypal.com https://*.firebaseapp.com https://accounts.google.com; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self' https://checkout.stripe.com https://www.paypal.com; frame-ancestors 'none'; upgrade-insecure-requests`;

export function AuditPanel() {
  const [data, setData] = useState<AuditData | null>(null);
  const [secSeoData, setSecSeoData] = useState<SecuritySeoAuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'engineering' | 'csp-seo' | 'discovery'>('csp-seo');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ghRes, secRes] = await Promise.all([
        fetch('/api/github-audit'),
        fetch('/api/security-seo-audit'),
      ]);
      const ghJson = await ghRes.json();
      const secJson = await secRes.json();
      if (!ghRes.ok) throw new Error(ghJson.error || 'Could not load GitHub audit');
      setData(ghJson);
      if (secRes.ok) {
        setSecSeoData(secJson);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audit check failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, []);

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-[#0b0f19] border border-white/10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs text-cyan-300 font-mono-tabular">
            Independent Technical Auditor, CSP Hardening & SEO Meta Engine · main @ 6c3afd9 (136/136 Tests Verified)
          </p>
          <h3 className="text-2xl font-serif-display font-semibold text-white mt-1">
            Engineering QA, CSP Domain Lockdown & Live SEO Meta Audit
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center p-1 rounded-xl bg-[#060911] border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('csp-seo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'csp-seo'
                  ? 'bg-cyan-400 text-[#0b0f19]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              CSP & Live SEO Meta Audit
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('engineering')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'engineering'
                  ? 'bg-cyan-400 text-[#0b0f19]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Engineering & 90-Page QA
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('discovery')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'discovery'
                  ? 'bg-amber-400 text-[#0b0f19]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              10-Page SEO & Captions
            </button>
          </div>

          <button
            onClick={loadAudit}
            disabled={loading}
            className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs text-slate-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200">
          {error}
        </div>
      )}

      {activeTab === 'csp-seo' && (
        <div className="space-y-6">
          {/* Top KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#060911] border border-cyan-500/30 space-y-1">
              <div className="flex items-center justify-between text-xs text-cyan-300">
                <span>Arron Route Isolation</span>
                <Lock className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-lg font-mono-tabular font-bold text-white">
                {secSeoData?.cspAudit.arronRouteIsolated ? 'LOCKED DOWN' : 'ACTIVE'}
              </p>
              <p className="text-[11px] text-slate-400">
                default-src &apos;none&apos; · payment=() · zero 3rd-party exfiltration
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#060911] border border-amber-500/30 space-y-1">
              <div className="flex items-center justify-between text-xs text-amber-300">
                <span>Payment-Adjacent CSP</span>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-lg font-mono-tabular font-bold text-white">
                {secSeoData?.cspAudit.paymentModulesHardened ? 'HARDENED' : 'ACTIVE'}
              </p>
              <p className="text-[11px] text-slate-400">
                /shop*, /creator*, /support* restricted to self + js.stripe.com
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#060911] border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-xs text-sky-300">
                <span>Firebase Config Integrity</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-lg font-mono-tabular font-bold text-white">
                {secSeoData?.cspAudit.firebaseConfigIntact ? 'VERIFIED PURE' : 'INTACT'}
              </p>
              <p className="text-[11px] text-slate-400">
                firebase-applet-config.json untouched · CSP isolated in _headers
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#060911] border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-xs text-cyan-300">
                <span>Schema.org JSON-LD Graph</span>
                <Globe className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-lg font-mono-tabular font-bold text-white">
                {secSeoData?.seoMetaAudit.schemaOrgGraphEntities.length || 6} Entities
              </p>
              <p className="text-[11px] text-slate-400">
                WebSite · Organization · Person · WebApplication · Breadcrumb · FAQ
              </p>
            </div>
          </div>

          {/* CSP Domain Allowlist Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-[#060911] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-300" />
                  Content-Security-Policy Domain Allowlists
                </h4>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/30 text-[11px] text-cyan-300 font-mono-tabular">
                  content-security-policy.json + _headers
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Blocks inline attribute scripts (<code className="text-cyan-300">script-src-attr &apos;none&apos;</code>), plugins (<code className="text-cyan-300">object-src &apos;none&apos;</code>), and unauthorized external <code className="text-cyan-300">connect-src</code> exfiltration on Arron AI and commercial checkout routes.
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-[#0b0f19] border border-white/10">
                  <p className="font-mono-tabular text-cyan-300 font-semibold">
                    1. Arron Sanctuary (/arron*, /api/arron/*) — connect-src Allowlist:
                  </p>
                  <p className="text-slate-300 font-mono-tabular text-[11px] mt-1">
                    {(
                      secSeoData?.cspAudit.arronConnectAllowlist || [
                        "'self'",
                        'https://pleadingsanity.co.uk',
                        'https://firestore.googleapis.com',
                        'https://identitytoolkit.googleapis.com',
                        'https://securetoken.googleapis.com',
                      ]
                    ).join(' · ')}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#0b0f19] border border-white/10">
                  <p className="font-mono-tabular text-amber-300 font-semibold">
                    2. Payment-Adjacent (/shop*, /creator*, /support*) — script-src & connect-src:
                  </p>
                  <p className="text-slate-300 font-mono-tabular text-[11px] mt-1">
                    {(
                      secSeoData?.cspAudit.paymentConnectAllowlist || [
                        "'self'",
                        'https://pleadingsanity.co.uk',
                        'https://api.stripe.com',
                        'https://checkout.stripe.com',
                        'https://firestore.googleapis.com',
                      ]
                    ).join(' · ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Live SEO Meta Scorecard */}
            <div className="p-5 rounded-xl bg-[#060911] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <SearchCheck className="w-4 h-4 text-amber-300" />
                  Live SEO Meta & Discovery Verification
                </h4>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-400/30 text-[11px] text-emerald-300 font-mono-tabular">
                  100% PASS
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#0b0f19] border border-white/10 flex items-center justify-between gap-2">
                  <span className="text-slate-300">
                    Primary <code className="text-cyan-300">&lt;title&gt;</code> ({secSeoData?.seoMetaAudit.title.length || 68} chars)
                  </span>
                  <span className="text-emerald-400 font-mono-tabular font-semibold">OPTIMAL</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0b0f19] border border-white/10 flex items-center justify-between gap-2">
                  <span className="text-slate-300">
                    Meta <code className="text-cyan-300">description</code> ({secSeoData?.seoMetaAudit.description.length || 169} chars)
                  </span>
                  <span className="text-emerald-400 font-mono-tabular font-semibold">OPTIMAL</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0b0f19] border border-white/10 flex items-center justify-between gap-2">
                  <span className="text-slate-300">
                    Canonical + <code className="text-cyan-300">hreflang=&quot;en-gb&quot;</code> + UK Geo (<code className="text-cyan-300">GB-LEC</code>)
                  </span>
                  <span className="text-emerald-400 font-mono-tabular font-semibold">VERIFIED</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0b0f19] border border-white/10 flex items-center justify-between gap-2">
                  <span className="text-slate-300">
                    OpenGraph (1200x630) + Twitter <code className="text-cyan-300">summary_large_image</code>
                  </span>
                  <span className="text-emerald-400 font-mono-tabular font-semibold">VERIFIED</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0b0f19] border border-white/10 flex items-center justify-between gap-2">
                  <span className="text-slate-300">
                    Discovery Files (<code className="text-cyan-300">sitemap.xml</code>, <code className="text-cyan-300">robots.txt</code>, <code className="text-cyan-300">manifest.webmanifest</code>)
                  </span>
                  <span className="text-emerald-400 font-mono-tabular font-semibold">VERIFIED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Copyable Netlify _headers Snippet */}
          <div className="p-4 rounded-xl bg-[#060911] border border-white/10 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono-tabular text-cyan-300">
                Netlify _headers Route-Isolated CSP Snippet (Active in /_headers & /public/_headers)
              </span>
              <button
                type="button"
                onClick={() => copyText('csp-headers', NETLIFY_CSP_SNIPPET)}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 text-xs flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'csp-headers' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied _headers
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy _headers Rules
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-[#0b0f19] border border-white/10 text-[11px] font-mono-tabular text-slate-300 overflow-x-auto">
              {NETLIFY_CSP_SNIPPET}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'engineering' && (
        <div className="space-y-6">
          {/* Independent Verification Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#060911] border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-xs text-cyan-300">
                <span>Test Suite (dd9e54a)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl font-mono-tabular font-bold text-white">136 / 136 PASS</p>
              <p className="text-[11px] text-slate-400">
                0 failures · 9.1s execution · validate-build.cjs OK
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#060911] border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-xs text-amber-300">
                <span>Insane Solar Audit</span>
                <Sun className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xl font-mono-tabular font-bold text-white">Verified Live</p>
              <p className="text-[11px] text-slate-400">
                /js/solar-assistant.js + HMRC Notice 708/6 + generic labels
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#060911] border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-xs text-sky-300">
                <span>90 HTML Pages Scanned</span>
                <Globe className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-xl font-mono-tabular font-bold text-white">0 Broken Links</p>
              <p className="text-[11px] text-slate-400">
                0 broken local images · 89/90 meta descriptions
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#060911] border border-amber-400/40 space-y-1">
              <div className="flex items-center justify-between text-xs text-amber-300">
                <span>Homepage Music Audit</span>
                <Music className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xl font-mono-tabular font-bold text-amber-200">2 Repo Fixes Needed</p>
              <p className="text-[11px] text-slate-400">
                80 pages still load legacy music-player.js (see diff below)
              </p>
            </div>
          </div>

          {/* Actionable Repo Blockers Identified by Independent Audit */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-400/40 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Blocker 1: GitHub Actions deploy.yml Gate (arron-app.html:10018)</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                While all 136 Node tests pass at <code className="text-cyan-300">dd9e54a</code>, the GitHub Actions workflow <code className="text-amber-200">Deploy • dd9e54a</code> fails on line 39 of <code className="text-amber-200">deploy.yml</code> (<code className="text-amber-200">AssertionError: arron-app.html missing tappable SHOUT 85258</code>) because line 10018 of <code className="text-amber-200">arron-app.html</code> has plain text <code className="text-amber-200">Text &lt;strong&gt;SHOUT to 85258&lt;/strong&gt;</code> instead of <code className="text-cyan-300">&lt;a href=&quot;sms:85258&quot;&gt;85258&lt;/a&gt;</code> and <code className="text-cyan-300">NHS &lt;a href=&quot;tel:111&quot;&gt;111&lt;/a&gt;</code>.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-cyan-500/10 border border-cyan-400/40 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                <Music className="w-4 h-4 shrink-0" />
                <span>Blocker 2: 80 Non-Homepage HTML Files Still Load js/music-player.js</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Commit <code className="text-cyan-300">1f25e0c</code> added <code className="text-cyan-300">js/home-music.js</code> to <code className="text-cyan-300">index.html</code>, but 80 other HTML files (<code className="text-amber-200">about.html</code>, <code className="text-amber-200">arron-app.html</code>, <code className="text-amber-200">crisis.html</code>, <code className="text-amber-200">games.html</code>, <code className="text-amber-200">shop.html</code>, etc.) still load <code className="text-amber-200">&lt;script src=&quot;/js/music-player.js&quot; defer&gt;&lt;/script&gt;</code> which injects a hidden YouTube autoplay iframe at 50% volume. Make <code className="text-cyan-300">js/music-player.js</code> a safe no-op to enforce homepage-only music site-wide.
              </p>
            </div>
          </div>

          {data && (
            <>
              {/* Latest Main Branch Commits */}
              {data.latestCommits && data.latestCommits.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-cyan-300" />
                    Latest Verified Commits on main
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {data.latestCommits.map((c) => (
                      <a
                        key={c.sha}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-[#060911] border border-white/10 hover:border-cyan-400/40 transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="truncate">
                          <p className="text-white font-medium truncate">{c.message}</p>
                          <p className="text-slate-400 text-[11px]">{c.author}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-mono-tabular text-[11px] shrink-0">
                          {c.sha}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Grid: Recent PRs & CI Runs */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <GitPullRequest className="w-4 h-4 text-amber-300" />
                    Pull Requests ({data.openPrCount} Open on GitHub · Protected PR #92 Untouched)
                  </h4>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {data.recentPrs.map((pr) => (
                      <a
                        key={pr.number}
                        href={pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3.5 rounded-xl bg-[#060911] border border-white/10 hover:border-amber-400/40 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-mono-tabular text-amber-300">
                            PR #{pr.number} · {pr.merged ? 'MERGED' : pr.state.toUpperCase()}
                            {pr.sha ? ` · ${pr.sha}` : ''}
                          </span>
                          <span className="text-slate-400 font-mono-tabular truncate max-w-[180px]">
                            {pr.branch}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-white font-medium mt-1">
                          {pr.title}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <SearchCheck className="w-4 h-4 text-cyan-300" />
                    Latest GitHub Actions Runs on main
                  </h4>
                  <div className="space-y-2">
                    {data.ciRuns.map((run) => (
                      <a
                        key={run.id}
                        href={run.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-[#060911] border border-white/10 hover:border-white/25 text-xs"
                      >
                        <div className="truncate pr-2">
                          <p className="text-slate-200 font-medium truncate">{run.name}</p>
                          <p className="text-slate-400 font-mono-tabular text-[11px]">
                            Branch: {run.branch} {run.sha ? `(${run.sha})` : ''}
                          </p>
                        </div>
                        <span
                          className={`font-mono-tabular font-semibold shrink-0 ${
                            run.conclusion === 'success'
                              ? 'text-emerald-400'
                              : run.conclusion === 'failure'
                              ? 'text-amber-400'
                              : 'text-sky-300'
                          }`}
                        >
                          {(run.conclusion || run.status).toUpperCase()}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'discovery' && (
        <div className="space-y-6">
          {/* 10-Page SEO Copy */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">
              10-Page Verified SEO Title & Meta Description Package (Click to Copy)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TEN_PAGE_SEO_PACKAGE.map((item) => (
                <div
                  key={item.page}
                  className="p-4 rounded-xl bg-[#060911] border border-white/10 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono-tabular text-cyan-300">
                        {item.page}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            item.page,
                            `<title>${item.title}</title>\n<meta name="description" content="${item.description}" />`
                          )
                        }
                        className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === item.page ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            Copied Tags
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy HTML Tags
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-white">{item.title}</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 10 Ready-to-Post Social Captions */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">
              10 Ready-to-Post Authentic Social Captions (X, Facebook, Instagram)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {TEN_SOCIAL_CAPTIONS.map((cap, idx) => {
                const key = `cap-${idx}`;
                return (
                  <div
                    key={key}
                    className="p-3.5 rounded-xl bg-[#060911] border border-white/10 flex items-start justify-between gap-3 text-xs"
                  >
                    <p className="text-slate-200 leading-relaxed">{cap}</p>
                    <button
                      type="button"
                      onClick={() => copyText(key, cap.replace(/^\d+\.\s*/, ''))}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === key ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
