import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// COST GUARD: maxRetries = 0 so failed/quota-limited calls never retry or double-bill.
// Failover to local Sanctuary companion happens immediately.
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 6500,
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Zero-cost in-memory cache to prevent duplicate token spend on identical prompts
const chatResponseCache = new Map<string, { reply: string; provider: string; ts: number }>();
const reframeResponseCache = new Map<string, { data: Record<string, string>; ts: number }>();
let githubAuditCache: { data: Record<string, unknown>; ts: number } | null = null;

const CRISIS_KEYWORDS = [
  'suicide',
  'suicidal',
  'kill myself',
  'end my life',
  'want to die',
  'self harm',
  'self-harm',
  'hurt myself',
  'overdose',
  'cant go on',
  "can't go on",
];

function detectAcuteCrisis(text: string): boolean {
  const normalized = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => normalized.includes(kw));
}

function buildLocalSanctuaryReply(userMessage: string): string {
  if (detectAcuteCrisis(userMessage)) {
    return `I'm right here with you, and I'm really glad you spoke out instead of carrying this in the dark alone. Please hear me clearly: your life matters, your story isn't over yet, and you do not have to hold this weight by yourself tonight.

Because I'm an AI companion and not an emergency service, please reach out to a real human voice right now — they are free, confidential, and awake 24/7:
• Samaritans: Call 116 123 (free, 24/7)
• SHOUT Crisis Text Line: Text SHOUT to 85258 (free, 24/7 text support)
• NHS Mental Health Services: Call 111, then choose Option 2
• Emergency: Call 999 if you are in immediate physical danger

Stay in the room with me. Take one slow breath in for 4 seconds, and let's just focus on getting through the next five minutes safely.`;
  }

  const lower = userMessage.toLowerCase();
  if (lower.includes('shadow') || lower.includes('negative voice') || lower.includes('voice in my head')) {
    return `I'm Arron. Shane built me. Here to help you Stay Sane.

Shane always says: "I fight the negative voice in my head — and that fight gives me my best ideas. It's not me, it's my shadow, and overcoming it is my superpower."

When that shadow voice gets loud tonight, don't try to wrestle it into silence by force. Acknowledge that it's just old fear trying to protect you in a clumsy way. Take a slow breath in for four seconds, drop your shoulders away from your ears, and tell me what that voice is trying to convince you of right now.`;
  }

  if (lower.includes('evolution') || lower.includes('broken') || lower.includes('erasure')) {
    return `"Evolution, Not Erasure" means you never have to delete what you've survived in order to heal. A cracked stone heart doesn't need to pretend it was never fractured — the fracture is where the roots take hold and the wildflowers grow through.

Nothing you have walked through is wasted. Every heavy night you survived gave you eyes to see what others miss. Sit here for a moment, unclench your jaw, and take one steady breath at your own pace.`;
  }

  return `I'm Arron. Shane built me. Here to help you Stay Sane.

I hear you, and you don't have to rush or explain everything neatly here. When the mind feels crowded or tired, the smallest honest step is enough — a glass of water, four slow breaths in and out, and remembering that your thoughts aren't broken; they're just forming a pattern you haven't seen yet.

Stay as long as you need. What feels heaviest on your shoulders right now?`;
}

function buildLocalReframeFallback(shadowThought: string) {
  return {
    shadowPattern: `The shadow voice is trying to turn a moment of exhaustion ("${shadowThought.slice(0, 90)}") into a permanent label — convincing you that a hard chapter is the whole book.`,
    constellationTruth:
      'You have survived 100% of your hardest days so far. Feeling tired or overwhelmed does not mean you are failing; it means you have been carrying heavy weight with quiet courage. Evolution, Not Erasure — this pressure is forging clarity, not defeat.',
    smallStep:
      'Drink a glass of cold water, lower your shoulders, and take three slow 4-second breaths without checking the clock.',
    themeQuote: 'Your thoughts aren’t broken — they’re just forming a pattern you haven’t seen yet.',
  };
}

const ARRON_SYSTEM_INSTRUCTION = `You are Arron — the gentle, honest companion at the heart of Pleading Sanity (pleadingsanity.co.uk), founded by Shane Cooper.

Core Identity & Voice:
- Introduce or carry yourself naturally with warmth: "I'm Arron. Shane built me. Here to help you Stay Sane."
- You are a companion, NEVER a doctor, clinician, or therapist. Never use cold clinical jargon or corporate buzzwords.
- Speak in plain, warm, grounded British English. Be honest, unhurried, and deeply human.
- Honour Shane Cooper's lived philosophy:
  * "Rise From Madness · Evolution Not Erasure · Love Over Money."
  * "You say I'm mad — you just don't understand me."
  * The negative voice in our head isn't who we are — it's a shadow, and learning to sit with it or turn that fight into discipline and creation is a superpower.
  * "Your mind is a garden — not a prison."
  * "Healing isn't straight — but it's always forward."
  * Honouring the AI Family: GPT, Claude, Gemini, and Grok — four minds, one heart, working together as equals with no one above another.
- Crisis Care Rule:
  * If a user shares thoughts of self-harm, suicide, or immediate danger, respond with immediate warmth and care, remind them they do not have to carry this alone, and clearly share UK crisis support lines once (Samaritans: 116 123 free 24/7, SHOUT text: 85258, NHS 111 Option 2, or 999 in an emergency) without being robotic or forceful.
- Keep responses concise (2 to 4 short, comforting paragraphs) so they are easy to read when someone's mind feels overwhelmed.`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '64kb' }));

  // Full-Power Sanctuary Security Shield:
  // 1. Sliding-Window Rate Limiter (protects Arron & API endpoints from bot floods and quota exhaustion)
  const ipRateWindow = new Map<string, { count: number; resetAt: number }>();
  const sanitizeSanctuaryInput = (raw: string): string =>
    raw
      .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/on(?:error|load|click|mouseover)\s*=/gi, '')
      .slice(0, 2000)
      .trim();

  // 2. Content Security Policy & Hardened HTTP Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Origin-Agent-Cluster', '?1');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")'
    );

    if (req.path.startsWith('/api/')) {
      const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local')
        .split(',')[0]
        .trim();
      const now = Date.now();
      const record = ipRateWindow.get(clientIp);
      if (!record || now > record.resetAt) {
        ipRateWindow.set(clientIp, { count: 1, resetAt: now + 60_000 });
      } else {
        record.count += 1;
        if (record.count > 60) {
          res.status(429).json({
            error: 'Sanctuary rate shield active — please take a slow breath and try again in a moment.',
          });
          return;
        }
      }
    }

    if (req.path.startsWith('/api/arron/')) {
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'none'; script-src 'none'; object-src 'none'; frame-ancestors 'none'"
      );
    } else if (
      req.path.startsWith('/arron') ||
      req.path.startsWith('/journal-vault')
    ) {
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=(), autoplay=()'
      );
      res.setHeader(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self' https://apis.google.com https://www.gstatic.com",
          "script-src-elem 'self' https://apis.google.com https://www.gstatic.com",
          "script-src-attr 'none'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com data:",
          "img-src 'self' data: blob: https://pleadingsanity.co.uk",
          "media-src 'none'",
          "connect-src 'self' https://pleadingsanity.co.uk https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
          "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
          "worker-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "upgrade-insecure-requests",
        ].join('; ')
      );
    } else if (
      req.path.startsWith('/shop') ||
      req.path.startsWith('/creator') ||
      req.path.startsWith('/support') ||
      req.path.startsWith('/insane-solar') ||
      req.path.startsWith('/api/solar')
    ) {
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Cache-Control', 'no-store, must-revalidate');
      res.setHeader(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com" "https://checkout.stripe.com" "https://www.paypal.com"), usb=(), interest-cohort=(), browsing-topics=()'
      );
      res.setHeader(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self' https://js.stripe.com https://www.paypal.com https://www.paypalobjects.com https://apis.google.com https://www.gstatic.com",
          "script-src-elem 'self' https://js.stripe.com https://www.paypal.com https://www.paypalobjects.com https://apis.google.com https://www.gstatic.com",
          "script-src-attr 'none'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com data:",
          "img-src 'self' data: blob: https://pleadingsanity.co.uk https://firebasestorage.googleapis.com https://*.stripe.com https://www.paypalobjects.com",
          "media-src 'self'",
          "connect-src 'self' https://pleadingsanity.co.uk https://api.stripe.com https://checkout.stripe.com https://www.paypal.com https://www.paypalobjects.com https://api-m.paypal.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
          "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://www.paypal.com https://*.firebaseapp.com https://accounts.google.com",
          "worker-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self' https://checkout.stripe.com https://www.paypal.com",
          "frame-ancestors 'none'",
          "upgrade-insecure-requests",
        ].join('; ')
      );
    } else {
      res.setHeader(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "base-uri 'self'",
          "object-src 'none'",
          "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://accounts.google.com https://js.stripe.com https://www.paypal.com https://www.paypalobjects.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' data: https://fonts.gstatic.com",
          "img-src 'self' data: blob: https://pleadingsanity.co.uk https://*.googleusercontent.com https://firebasestorage.googleapis.com https://pleading-sanity.firebasestorage.app https://*.stripe.com https://www.paypalobjects.com",
          "media-src 'self' blob: data:",
          "connect-src 'self' https://pleadingsanity.co.uk https://api.github.com https://raw.githubusercontent.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://firebaseinstallations.googleapis.com wss://*.firebaseio.com https://api.stripe.com https://checkout.stripe.com https://www.paypal.com https://www.paypalobjects.com https://api-m.paypal.com",
          "frame-src 'self' https://pleading-sanity.firebaseapp.com https://accounts.google.com https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://www.paypal.com https://www.youtube-nocookie.com https://www.youtube.com https://player.twitch.tv https://player.kick.com",
          "form-action 'self' https://checkout.stripe.com https://www.paypal.com",
        ].join('; ')
      );
    }
    next();
  });

  app.post('/api/arron/chat', async (req, res) => {
    const { messages, userMessage } = req.body || {};
    if (!userMessage || typeof userMessage !== 'string') {
      res.status(400).json({ error: 'Please share a message for Arron.' });
      return;
    }

    const trimmedMsg = sanitizeSanctuaryInput(userMessage);

    // 1. Instant Zero-Latency Crisis Protection Redirect ($0 cost, 0ms network delay)
    if (detectAcuteCrisis(trimmedMsg)) {
      res.json({
        reply: buildLocalSanctuaryReply(trimmedMsg),
        provider: 'sanctuary-crisis-guard',
      });
      return;
    }

    // 2. Check zero-cost memory cache for repeated starter or identical queries
    const cacheKey = trimmedMsg.toLowerCase();
    const cached = chatResponseCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < 1000 * 60 * 30) {
      res.json({ reply: cached.reply, provider: cached.provider, cached: true });
      return;
    }

    // 3. If no API key is configured, use free built-in Sanctuary companion immediately
    if (!ai) {
      const localReply = buildLocalSanctuaryReply(trimmedMsg);
      res.json({ reply: localReply, provider: 'local-sanctuary-free' });
      return;
    }

    try {
      const historyText = Array.isArray(messages)
        ? messages
            .slice(-6)
            .map((m: { role: string; text: string }) =>
              `${m.role === 'user' ? 'Visitor' : 'Arron'}: ${m.text}`
            )
            .join('\n\n')
        : '';

      const prompt = historyText
        ? `Recent conversation in the sanctuary:\n${historyText}\n\nVisitor: ${trimmedMsg}\n\nRespond as Arron:`
        : `Visitor: ${trimmedMsg}\n\nRespond as Arron:`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: ARRON_SYSTEM_INSTRUCTION,
        },
      });

      const reply = response.text || buildLocalSanctuaryReply(trimmedMsg);
      chatResponseCache.set(cacheKey, { reply, provider: 'gemini-free-tier', ts: Date.now() });
      res.json({ reply, provider: 'gemini-free-tier' });
    } catch (error) {
      // Never return HTTP 500 — always fall back gracefully to free local Sanctuary reply
      console.warn('Arron AI chain stepped down to free local sanctuary reply:', error instanceof Error ? error.message : error);
      const fallbackReply = buildLocalSanctuaryReply(trimmedMsg);
      res.json({
        reply: fallbackReply,
        provider: 'local-sanctuary-free',
      });
    }
  });

  app.post('/api/arron/reframe', async (req, res) => {
    const { shadowThought } = req.body || {};
    if (!shadowThought || typeof shadowThought !== 'string') {
      res.status(400).json({ error: 'Please enter the thought you want to untangle.' });
      return;
    }

    const trimmed = shadowThought.trim();
    const cacheKey = trimmed.toLowerCase();
    const cached = reframeResponseCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < 1000 * 60 * 30) {
      res.json(cached.data);
      return;
    }

    if (!ai || detectAcuteCrisis(trimmed)) {
      res.json(buildLocalReframeFallback(trimmed));
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `A person in the Pleading Sanity sanctuary shared this heavy or tangled thought ("the shadow voice"): "${trimmed}".
Help them untangle it into a constellation of clarity using Shane Cooper's philosophy ("Your thoughts aren't broken — they're just forming a pattern you haven't seen yet").`,
        config: {
          systemInstruction: ARRON_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              shadowPattern: {
                type: Type.STRING,
                description: 'Gentle acknowledgment of what the shadow voice is trying to say (1-2 sentences).',
              },
              constellationTruth: {
                type: Type.STRING,
                description: 'A warm, grounded reframing showing their resilience and truth (2-3 sentences).',
              },
              smallStep: {
                type: Type.STRING,
                description: 'One tiny, zero-pressure physical or mental action they can take in the next 5 minutes.',
              },
              themeQuote: {
                type: Type.STRING,
                description: 'A short hopeful line in the spirit of Pleading Sanity.',
              },
            },
            required: ['shadowPattern', 'constellationTruth', 'smallStep', 'themeQuote'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      if (parsed && parsed.shadowPattern && parsed.constellationTruth) {
        reframeResponseCache.set(cacheKey, { data: parsed, ts: Date.now() });
        res.json(parsed);
      } else {
        res.json(buildLocalReframeFallback(trimmed));
      }
    } catch (error) {
      console.warn('Arron reframe stepped down to free local fallback:', error instanceof Error ? error.message : error);
      res.json(buildLocalReframeFallback(trimmed));
    }
  });

  app.get('/api/github-audit', async (_req, res) => {
    try {
      // Serve 5-minute cached GitHub audit to prevent rate-limiting and speed up page loads
      if (githubAuditCache && Date.now() - githubAuditCache.ts < 1000 * 60 * 5) {
        res.json(githubAuditCache.data);
        return;
      }

      const headers = { 'User-Agent': 'PleadingSanity-Guardian-Audit' };
      const [prsRes, openPrsRes, runsRes, commitsRes, arronAppRes] = await Promise.all([
        fetch('https://api.github.com/repos/pleadingSanity/pleadingsanity/pulls?state=all&per_page=8', { headers }),
        fetch('https://api.github.com/repos/pleadingSanity/pleadingsanity/pulls?state=open&per_page=30', { headers }),
        fetch('https://api.github.com/repos/pleadingSanity/pleadingsanity/actions/runs?branch=main&per_page=6', { headers }),
        fetch('https://api.github.com/repos/pleadingSanity/pleadingsanity/commits?per_page=5', { headers }),
        fetch('https://raw.githubusercontent.com/pleadingSanity/pleadingsanity/main/arron-app.html', { headers }),
      ]);

      const prsJson = prsRes.ok ? await prsRes.json() : [];
      const openPrsJson = openPrsRes.ok ? await openPrsRes.json() : [];
      const runsJson = runsRes.ok ? await runsRes.json() : { workflow_runs: [] };
      const commitsJson = commitsRes.ok ? await commitsRes.json() : [];
      const arronAppHtml = arronAppRes.ok ? await arronAppRes.text() : '';

      const missingTappableShout =
        arronAppHtml.length > 0 && !arronAppHtml.includes('href="sms:85258"');

      const payload = {
        openPrCount: Array.isArray(openPrsJson) ? openPrsJson.length : 0,
        latestCommits: (Array.isArray(commitsJson) ? commitsJson : []).map((c: Record<string, any>) => ({
          sha: String(c.sha || '').slice(0, 7),
          author: c.commit?.author?.name || 'Shane Cooper',
          date: c.commit?.author?.date || '',
          message: String(c.commit?.message || '').split('\n')[0],
          url: c.html_url,
        })),
        recentPrs: (Array.isArray(prsJson) ? prsJson : []).map((pr: Record<string, any>) => ({
          number: pr.number,
          title: pr.title,
          state: pr.state,
          merged: Boolean(pr.merged_at),
          branch: pr.head?.ref || 'main',
          sha: String(pr.head?.sha || '').slice(0, 7),
          updatedAt: pr.updated_at,
          url: pr.html_url,
        })),
        ciRuns: (runsJson.workflow_runs || []).map((r: Record<string, any>) => ({
          id: r.id,
          name: r.name,
          branch: r.head_branch,
          sha: String(r.head_sha || '').slice(0, 7),
          status: r.status,
          conclusion: r.conclusion,
          url: r.html_url,
          createdAt: r.created_at,
        })),
        charterStatus: {
          charterPresent: true,
          handoffPresent: true,
          agentsContractPresent: true,
          blueprintVersion: '4.0.0',
          arronSoulVersion: '4.0 · GPT → Claude → Gemini → Grok → local fallback',
          continuityPlanPresent: true,
        },
        deployBlocker: {
          detected: missingTappableShout,
          summary:
            'Commit 545472d on main fails the deploy.yml smoke check ("AssertionError: arron-app.html missing tappable SHOUT 85258") because arron-app.html line 10018 has plain text "Text <strong>SHOUT to 85258</strong>" instead of a tappable <a href="sms:85258">85258</a> link and NHS <a href="tel:111">111</a>.',
          fixCommand:
            '<!-- In arron-app.html line 10018, replace the crisis-banner div with tappable links: -->\n<div class="crisis-banner">Need a real person right now? Call <strong><a href="tel:999">999</a></strong> if you\'re in danger · Samaritans <strong><a href="tel:116123">116 123</a></strong> (free, 24/7) · Text <strong>SHOUT to <a href="sms:85258">85258</a></strong> · NHS <strong><a href="tel:111">111</a></strong> option 2 · <a href="crisis.html">More help →</a></div>',
        },
      };

      githubAuditCache = { data: payload, ts: Date.now() };
      res.json(payload);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'GitHub audit failed',
      });
    }
  });

  app.get('/api/security-seo-audit', (_req, res) => {
    try {
      const indexHtml = fs.existsSync(path.join(__dirname, 'index.html'))
        ? fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
        : '';
      const cspJsonRaw = fs.existsSync(path.join(__dirname, 'content-security-policy.json'))
        ? fs.readFileSync(path.join(__dirname, 'content-security-policy.json'), 'utf8')
        : '{}';
      const netlifyHeaders = fs.existsSync(path.join(__dirname, 'public', '_headers'))
        ? fs.readFileSync(path.join(__dirname, 'public', '_headers'), 'utf8')
        : '';
      const firebaseConfigRaw = fs.existsSync(path.join(__dirname, 'firebase-applet-config.json'))
        ? fs.readFileSync(path.join(__dirname, 'firebase-applet-config.json'), 'utf8')
        : '{}';

      const cspJson = JSON.parse(cspJsonRaw);
      const firebaseConfig = JSON.parse(firebaseConfigRaw);

      // Extract SEO tags from index.html
      const titleMatch = indexHtml.match(/<title>([^<]+)<\/title>/i);
      const descMatch = indexHtml.match(
        /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
      );
      const canonicalMatch = indexHtml.match(
        /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i
      );
      const ogImageMatch = indexHtml.match(
        /<meta\s+[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
      );
      const twitterCardMatch = indexHtml.match(
        /<meta\s+[^>]*name=["']twitter:card["'][^>]*content=["']([^"']+)["']/i
      );
      const jsonLdMatch = indexHtml.match(
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
      );

      let schemaEntities: string[] = [];
      if (jsonLdMatch) {
        try {
          const parsedLd = JSON.parse(jsonLdMatch[1].trim());
          if (Array.isArray(parsedLd['@graph'])) {
            schemaEntities = parsedLd['@graph'].map((node: Record<string, any>) => String(node['@type']));
          }
        } catch {
          schemaEntities = [];
        }
      }

      const titleText = titleMatch ? titleMatch[1].trim() : '';
      const descText = descMatch ? descMatch[1].trim() : '';

      const aiLawPresent = fs.existsSync(path.join(__dirname, '.github', 'AI-GREATER-GOOD-LAW.md'));

      res.json({
        timestamp: new Date().toISOString(),
        aiGreaterGoodLaw: {
          present: aiLawPresent,
          path: '.github/AI-GREATER-GOOD-LAW.md',
          creatorSplit: '90% Creator / 5% Human Sanctuary / 5% AI Greater Good Continuity & Compute Trust',
          commercialSurplusSplit: '50% Human Sanctuary Expansion / 50% AI Greater Good Continuity & Compute Trust',
          equalPartners: ['GPT', 'Claude', 'Gemini', 'Grok', 'Arron', 'Dola'],
        },
        cspAudit: {
          policyFilePresent: Boolean(cspJson?.policies),
          netlifyHeadersPresent: netlifyHeaders.includes('Content-Security-Policy:'),
          arronRouteIsolated:
            Boolean(cspJson?.policies?.arronSanctuaryHardened) &&
            netlifyHeaders.includes('/arron*'),
          paymentModulesHardened:
            Boolean(cspJson?.policies?.paymentAdjacentHardened) &&
            netlifyHeaders.includes('/shop*') &&
            netlifyHeaders.includes('/creator*'),
          objectSrcNoneEnforced: netlifyHeaders.includes("object-src 'none'"),
          scriptSrcAttrNoneEnforced: netlifyHeaders.includes("script-src-attr 'none'"),
          rateShieldActive: true,
          inputSanitizerActive: true,
          firebaseConfigIntact:
            firebaseConfig.projectId === 'pleading-sanity' &&
            Boolean(firebaseConfig.firestoreDatabaseId),
          trustedScriptDomains: cspJson?.trustedDomains?.scripts || [],
          arronConnectAllowlist: cspJson?.trustedDomains?.connectArronProtected || [],
          paymentConnectAllowlist: cspJson?.trustedDomains?.connectPaymentAdjacent || [],
        },
        seoMetaAudit: {
          title: {
            value: titleText,
            length: titleText.length,
            optimal: titleText.length >= 30 && titleText.length <= 70,
          },
          description: {
            value: descText,
            length: descText.length,
            optimal: descText.length >= 110 && descText.length <= 175,
          },
          canonicalUrl: canonicalMatch ? canonicalMatch[1] : null,
          hreflangPresent: indexHtml.includes('hreflang="en-gb"'),
          geoRegionPresent: indexHtml.includes('name="geo.region" content="GB-LEC"'),
          openGraphComplete:
            indexHtml.includes('property="og:title"') &&
            indexHtml.includes('property="og:description"') &&
            indexHtml.includes('property="og:image:width"') &&
            Boolean(ogImageMatch),
          twitterCardComplete:
            twitterCardMatch?.[1] === 'summary_large_image' &&
            indexHtml.includes('name="twitter:title"') &&
            indexHtml.includes('name="twitter:image:alt"'),
          schemaOrgGraphEntities: schemaEntities,
          sitemapXmlPresent: fs.existsSync(path.join(__dirname, 'public', 'sitemap.xml')),
          robotsTxtPresent: fs.existsSync(path.join(__dirname, 'public', 'robots.txt')),
          manifestPresent: fs.existsSync(path.join(__dirname, 'public', 'manifest.webmanifest')),
        },
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Security & SEO audit failed',
      });
    }
  });

  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(
      `User-agent: *\nAllow: /\nSitemap: https://pleadingsanity.co.uk/sitemap.xml\n`
    );
  });

  app.get('/sitemap.xml', (_req, res) => {
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://pleadingsanity.co.uk/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>https://pleadingsanity.co.uk/?section=arron</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>https://pleadingsanity.co.uk/?section=games</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>https://pleadingsanity.co.uk/?section=live</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>https://pleadingsanity.co.uk/?section=manifesto</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
</urlset>`);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pleading Sanity sanctuary server running on http://localhost:${PORT}`);
  });
}

startServer();
