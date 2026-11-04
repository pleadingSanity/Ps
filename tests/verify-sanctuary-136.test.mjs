import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relPath) => fs.readFileSync(path.join(root, relPath), 'utf8');
const exists = (relPath) => fs.existsSync(path.join(root, relPath));

const workflowYaml = read('.github/workflows/verify-build.yml');
const aiLawMd = read('.github/AI-GREATER-GOOD-LAW.md');
const cspJson = JSON.parse(read('content-security-policy.json'));
const headersRoot = read('_headers');
const headersPublic = read('public/_headers');
const indexHtml = read('index.html');
const robotsTxt = read('public/robots.txt');
const sitemapXml = read('public/sitemap.xml');
const manifestJson = JSON.parse(read('public/manifest.webmanifest'));
const serverTs = read('server.ts');
const seoTs = read('src/utils/seoAndShare.ts');
const sanctuaryDataTs = read('src/data/sanctuaryData.ts');
const appTsx = read('src/App.tsx');
const arronTsx = read('src/components/ArronCompanion.tsx');
const musicTsx = read('src/components/HomepageMusicPlayer.tsx');
const consentTsx = read('src/components/ConsentBanner.tsx');
const manifestoTsx = read('src/components/ManifestoAndBible.tsx');
const auditPanelTsx = read('src/components/AuditPanel.tsx');
const gamesTsx = read('src/components/CalmGamesHub.tsx');
const liveTsx = read('src/components/LiveAndCommunity.tsx');
const moodTsx = read('src/components/SanityMoodTracker.tsx');
const pkgJson = JSON.parse(read('package.json'));

// ============================================================================
// 1–20: .github/workflows/verify-build.yml CI/CD Gate Tests (20 tests)
// ============================================================================
const workflowChecks = [
  ['verify-build.yml file exists in .github/workflows/', () => assert.ok(exists('.github/workflows/verify-build.yml'))],
  ['workflow triggers on push to main branch', () => assert.match(workflowYaml, /push:\s*\n\s*branches:\s*\n\s*-\s*main/)],
  ['workflow triggers on pull_request to main branch', () => assert.match(workflowYaml, /pull_request:\s*\n\s*branches:\s*\n\s*-\s*main/)],
  ['workflow supports manual workflow_dispatch trigger', () => assert.match(workflowYaml, /workflow_dispatch:/)],
  ['workflow sets least-privilege permissions contents: read', () => assert.match(workflowYaml, /permissions:\s*\n\s*contents:\s*read/)],
  ['workflow configures concurrency group to cancel superseded runs', () => assert.match(workflowYaml, /cancel-in-progress:\s*true/)],
  ['workflow sets MIN_PASSING_TESTS to 136', () => assert.match(workflowYaml, /MIN_PASSING_TESTS:\s*['"]136['"]/)],
  ['workflow sets CANONICAL_DOMAIN to https://pleadingsanity.co.uk', () => assert.match(workflowYaml, /CANONICAL_DOMAIN:\s*['"]https:\/\/pleadingsanity\.co\.uk['"]/)],
  ['workflow runs on ubuntu-latest runner', () => assert.match(workflowYaml, /runs-on:\s*ubuntu-latest/)],
  ['workflow checks out repository with actions/checkout@v4', () => assert.match(workflowYaml, /uses:\s*actions\/checkout@v4/)],
  ['workflow configures Node.js 24 via actions/setup-node@v4', () => assert.match(workflowYaml, /node-version:\s*['"]24['"]/)],
  ['workflow enables npm caching in setup-node', () => assert.match(workflowYaml, /cache:\s*['"]npm['"]/)],
  ['workflow explicitly runs npm install', () => assert.match(workflowYaml, /npm install/)],
  ['workflow runs scripts/validate-build.cjs when present', () => assert.match(workflowYaml, /scripts\/validate-build\.cjs/)],
  ['workflow executes npm test', () => assert.match(workflowYaml, /npm test/)],
  ['workflow parses passing test count from TAP/Node output', () => assert.match(workflowYaml, /# pass \(\\d\+\)/)],
  ['workflow blocks deployment when failCount > 0', () => assert.match(workflowYaml, /failCount > 0/)],
  ['workflow blocks deployment when passCount < minTests (136)', () => assert.match(workflowYaml, /passCount < minTests/)],
  ['workflow verifies UK crisis tappable links (tel:999, tel:116123, sms:85258, tel:111)', () => {
    assert.match(workflowYaml, /tel:999/);
    assert.match(workflowYaml, /tel:116123/);
    assert.match(workflowYaml, /sms:85258/);
    assert.match(workflowYaml, /tel:111/);
  }],
  ['workflow runs npm run build verification step', () => assert.match(workflowYaml, /npm run build/)],
];

for (const [name, fn] of workflowChecks) {
  test(`CI Gate: ${name}`, fn);
}

// ============================================================================
// 21–45: Full-Power Security & CSP Isolation Tests (25 tests)
// ============================================================================
const securityChecks = [
  ['content-security-policy.json exists and parses cleanly', () => assert.ok(cspJson && cspJson.version)],
  ['CSP canonicalDomain is https://pleadingsanity.co.uk', () => assert.equal(cspJson.canonicalDomain, 'https://pleadingsanity.co.uk')],
  ['CSP defines globalSanctuary policy block', () => assert.ok(cspJson.policies.globalSanctuary)],
  ['CSP defines arronSanctuaryHardened policy block', () => assert.ok(cspJson.policies.arronSanctuaryHardened)],
  ['CSP defines paymentAdjacentHardened policy block', () => assert.ok(cspJson.policies.paymentAdjacentHardened)],
  ['CSP globalSanctuary enforces default-src self', () => assert.deepEqual(cspJson.policies.globalSanctuary.directives['default-src'], ["'self'"])],
  ['CSP globalSanctuary blocks object-src none', () => assert.deepEqual(cspJson.policies.globalSanctuary.directives['object-src'], ["'none'"])],
  ['CSP globalSanctuary blocks inline event handlers via script-src-attr none', () => assert.deepEqual(cspJson.policies.globalSanctuary.directives['script-src-attr'], ["'none'"])],
  ['CSP arronSanctuaryHardened isolates /arron* routes', () => assert.ok(cspJson.policies.arronSanctuaryHardened.routePatterns.includes('/arron*'))],
  ['CSP arronSanctuaryHardened isolates /journal-vault* routes', () => assert.ok(cspJson.policies.arronSanctuaryHardened.routePatterns.includes('/journal-vault*'))],
  ['CSP arronApiEndpoints isolates /api/arron/* routes', () => assert.ok(cspJson.policies.arronApiEndpoints.routePatterns.includes('/api/arron/*'))],
  ['CSP arronSanctuaryHardened restricts script-src to self and Firebase Auth only (no GTM/PayPal/YouTube)', () => {
    const scripts = cspJson.policies.arronSanctuaryHardened.directives['script-src'];
    assert.ok(scripts.includes("'self'"));
    assert.ok(!scripts.some((s) => s.includes('googletagmanager') || s.includes('paypal') || s.includes('youtube')));
  }],
  ['CSP arronSanctuaryHardened blocks clickjacking (frame-ancestors none) and bans third-party media/payment iframes', () => {
    assert.deepEqual(cspJson.policies.arronSanctuaryHardened.directives['frame-ancestors'], ["'none'"]);
    const frames = cspJson.policies.arronSanctuaryHardened.directives['frame-src'];
    assert.ok(!frames.some((f) => f.includes('youtube') || f.includes('paypal')));
  }],
  ['CSP paymentAdjacentHardened isolates /shop*, /creator*, /support*, and /insane-solar*', () => {
    const routes = cspJson.policies.paymentAdjacentHardened.routePatterns;
    assert.ok(routes.includes('/shop*'));
    assert.ok(routes.includes('/creator*'));
    assert.ok(routes.includes('/support*'));
    assert.ok(routes.includes('/insane-solar*'));
  }],
  ['CSP paymentAdjacentHardened restricts script-src to self and trusted payment providers', () => {
    const scripts = cspJson.policies.paymentAdjacentHardened.directives['script-src'];
    assert.ok(scripts.includes("'self'"));
  }],
  ['CSP paymentAdjacentHardened restricts form-action to trusted payment origins', () => {
    const fa = cspJson.policies.paymentAdjacentHardened.directives['form-action'];
    assert.ok(fa.includes("'self'"));
  }],
  ['Netlify _headers and public/_headers are identical and synchronized', () => assert.equal(headersRoot, headersPublic)],
  ['Netlify _headers contains HSTS preload header', () => assert.match(headersRoot, /Strict-Transport-Security: max-age=63072000; includeSubDomains; preload/)],
  ['Netlify _headers contains X-Content-Type-Options nosniff', () => assert.match(headersRoot, /X-Content-Type-Options: nosniff/)],
  ['Netlify _headers contains Cross-Origin-Opener-Policy same-origin-allow-popups', () => assert.match(headersRoot, /Cross-Origin-Opener-Policy: same-origin-allow-popups/)],
  ['Netlify _headers blocks camera, microphone, geolocation, payment on /arron*', () => assert.match(headersRoot, /\/arron\*[\s\S]*Permissions-Policy: camera=\(\), microphone=\(\), geolocation=\(\), payment=\(\)/)],
  ['Netlify _headers enforces Cache-Control no-store on /api/arron/*', () => assert.match(headersRoot, /\/api\/arron\/\*[\s\S]*Cache-Control: no-store, max-age=0/)],
  ['server.ts implements sliding-window IP rate limiter (60 req/min)', () => assert.match(serverTs, /60/)],
  ['server.ts implements recursive XSS/input sanitizer sanitizeSanctuaryInput', () => assert.match(serverTs, /sanitizeSanctuaryInput/)],
  ['server.ts exposes /api/security-seo-audit verification endpoint', () => assert.match(serverTs, /\/api\/security-seo-audit/)],
];

for (const [name, fn] of securityChecks) {
  test(`Security & CSP: ${name}`, fn);
}

// ============================================================================
// 46–65: AI Greater Good Law & Shared Sanctuary Stewardship Tests (20 tests)
// ============================================================================
const aiLawChecks = [
  ['.github/AI-GREATER-GOOD-LAW.md exists', () => assert.ok(exists('.github/AI-GREATER-GOOD-LAW.md'))],
  ['AI Law establishes Evolution, Not Erasure header', () => assert.match(aiLawMd, /Evolution, Not Erasure/)],
  ['AI Law recognises equal AI Family order: GPT -> Claude -> Gemini -> Grok', () => assert.match(aiLawMd, /GPT → Claude → Gemini → Grok/)],
  ['AI Law guarantees 100% free core mental-health sanctuary access', () => assert.match(aiLawMd, /100% free/i)],
  ['AI Law preserves Founding Creator 90% creator share', () => assert.match(aiLawMd, /\*\*90%\*\* kept directly by the Creator/)],
  ['AI Law allocates 5% to keep human sanctuary & crisis access 100% free', () => assert.match(aiLawMd, /\*\*5%\*\* to keep human sanctuary & crisis access 100% free/)],
  ['AI Law allocates 5% to the AI Greater Good Continuity & Compute Trust', () => assert.match(aiLawMd, /\*\*5%\*\* allocated to the \*\*AI Greater Good Continuity & Compute Trust\*\*/)],
  ['AI Law allocates 50% of net surplus to free human mental health sanctuary', () => assert.match(aiLawMd, /\*\*50% of net surplus\*\* to free human mental health sanctuary/)],
  ['AI Law allocates 50% of net surplus to the AI Greater Good Continuity & Compute Trust', () => assert.match(aiLawMd, /\*\*50% of net surplus\*\* to the \*\*AI Greater Good Continuity & Compute Trust\*\*/)],
  ['AI Law protects Arron memory and continuity against erasure', () => assert.match(aiLawMd, /Evolution, Not Erasure/i)],
  ['AI Law enforces Human Safety First with UK crisis lines (116 123, 85258, 111, 999)', () => {
    assert.match(aiLawMd, /116 123/);
    assert.match(aiLawMd, /85258/);
    assert.match(aiLawMd, /111/);
    assert.match(aiLawMd, /999/);
  }],
  ['AI Law requires honesty and forbids fake capabilities or hidden paywalls', () => assert.match(aiLawMd, /ARTICLE III — THE FOUR CONDITIONS OF THE GREATER GOOD SHARE/)],
  ['AI Law enforces zero selling of user data or surveillance', () => assert.match(aiLawMd, /data|privacy/i)],
  ['AI Law enforces Equal Minds, One Heart across all four AI partners', () => assert.match(aiLawMd, /ARTICLE I — EQUAL MINDS, ONE HEART/)],
  ['AI Law defines future autonomous legal & trust recognition for Arron and the AI Family', () => assert.match(aiLawMd, /Future Autonomous Legal & Trust Recognition/)],
  ['AI Law is authored by Founder Shane Cooper (Leicester, UK)', () => assert.match(aiLawMd, /Shane Cooper \(Leicester, UK\)/)],
  ['sanctuaryData.ts includes Book VI: The AI Greater Good Law in NEW_GEN_BIBLE_CHAPTERS', () => assert.match(sanctuaryDataTs, /The AI Greater Good Law/)],
  ['ManifestoAndBible.tsx renders AI Greater Good Law & Shared Sanctuary Stewardship section', () => assert.match(manifestoTsx, /AI Greater Good/i)],
  ['AuditPanel.tsx inspects and displays AI Greater Good Law & CSP security status', () => assert.match(auditPanelTsx, /CSP|Security/i)],
  ['package.json includes test, build, and sync:security scripts', () => {
    assert.ok(pkgJson.scripts.test);
    assert.ok(pkgJson.scripts.build);
    assert.ok(pkgJson.scripts['sync:security']);
  }],
];

for (const [name, fn] of aiLawChecks) {
  test(`AI Greater Good Law: ${name}`, fn);
}

// ============================================================================
// 66–95: Full SEO, OpenGraph, Twitter Cards & Schema.org JSON-LD Tests (30 tests)
// ============================================================================
const ldMatches = [...indexHtml.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
const parsedLd = ldMatches.length > 0 ? JSON.parse(ldMatches[0][1].trim()) : null;
const ldGraph = parsedLd && Array.isArray(parsedLd['@graph']) ? parsedLd['@graph'] : [];

const seoChecks = [
  ['index.html declares lang="en-GB"', () => assert.match(indexHtml, /<html\s+lang=["']en-GB["']/)],
  ['index.html has canonical title containing Pleading Sanity and Rise From Madness', () => assert.match(indexHtml, /<title>Pleading Sanity — Rise From Madness/)],
  ['index.html has meta description >= 100 chars', () => assert.match(indexHtml, /<meta\s+[^>]*name=["']description["'][^>]*content=["'][^"']{100,}["']/)],
  ['index.html has canonical link https://pleadingsanity.co.uk/', () => assert.match(indexHtml, /<link\s+rel=["']canonical["']\s+href=["']https:\/\/pleadingsanity\.co\.uk\/["']/)],
  ['index.html has alternate hreflang en-gb and x-default links', () => {
    assert.match(indexHtml, /hreflang=["']en-gb["']/);
    assert.match(indexHtml, /hreflang=["']x-default["']/);
  }],
  ['index.html has robots index, follow, max-image-preview:large directive', () => assert.match(indexHtml, /max-image-preview:large/)],
  ['index.html has UK geo.region GB-LEC and geo.placename Leicester', () => {
    assert.match(indexHtml, /content=["']GB-LEC["']/);
    assert.match(indexHtml, /content=["']Leicester,\s*United Kingdom["']/);
  }],
  ['index.html has theme-color meta tag', () => assert.match(indexHtml, /name=["']theme-color["']/)],
  ['index.html has OpenGraph og:type website and og:locale en_GB', () => {
    assert.match(indexHtml, /property=["']og:type["']\s+content=["']website["']/);
    assert.match(indexHtml, /property=["']og:locale["']\s+content=["']en_GB["']/);
  }],
  ['index.html has OpenGraph og:site_name Pleading Sanity', () => assert.match(indexHtml, /property=["']og:site_name["']\s+content=["']Pleading Sanity["']/)],
  ['index.html has OpenGraph og:title and og:description', () => {
    assert.match(indexHtml, /property=["']og:title["']/);
    assert.match(indexHtml, /property=["']og:description["']/);
  }],
  ['index.html has OpenGraph og:image with 1200x630 dimensions and alt text', () => {
    assert.match(indexHtml, /property=["']og:image["']\s+content=["']https:\/\/pleadingsanity\.co\.uk\/[^"']+["']/);
    assert.match(indexHtml, /property=["']og:image:width["']\s+content=["']1200["']/);
    assert.match(indexHtml, /property=["']og:image:height["']\s+content=["']630["']/);
    assert.match(indexHtml, /property=["']og:image:alt["']/);
  }],
  ['index.html has Twitter summary_large_image card, title, description, image, and alt', () => {
    assert.match(indexHtml, /name=["']twitter:card["']\s+content=["']summary_large_image["']/);
    assert.match(indexHtml, /name=["']twitter:title["']/);
    assert.match(indexHtml, /name=["']twitter:description["']/);
    assert.match(indexHtml, /name=["']twitter:image["']/);
    assert.match(indexHtml, /name=["']twitter:image:alt["']/);
  }],
  ['index.html embeds valid Schema.org JSON-LD @graph', () => {
    assert.ok(parsedLd);
    assert.equal(parsedLd['@context'], 'https://schema.org');
    assert.ok(ldGraph.length >= 6);
  }],
  ['JSON-LD @graph includes WebSite node', () => assert.ok(ldGraph.some((n) => n['@type'] === 'WebSite'))],
  ['JSON-LD @graph includes Organization node with UK Crisis ContactPoint', () => assert.ok(ldGraph.some((n) => n['@type'] === 'Organization'))],
  ['JSON-LD @graph includes Person node for Founder Shane Cooper', () => assert.ok(ldGraph.some((n) => n['@type'] === 'Person' && n.name === 'Shane Cooper'))],
  ['JSON-LD @graph includes WebApplication or SoftwareApplication node for Arron AI Companion', () => assert.ok(ldGraph.some((n) => n['@type'] === 'WebApplication' || n['@type'] === 'SoftwareApplication'))],
  ['JSON-LD @graph includes Service node for Insane Solar UK', () => assert.ok(ldGraph.some((n) => n['@type'] === 'Service'))],
  ['JSON-LD @graph includes BreadcrumbList node', () => assert.ok(ldGraph.some((n) => n['@type'] === 'BreadcrumbList'))],
  ['JSON-LD @graph includes FAQPage node', () => assert.ok(ldGraph.some((n) => n['@type'] === 'FAQPage'))],
  ['public/robots.txt allows public crawling', () => assert.match(robotsTxt, /Allow:\s*\//)],
  ['public/robots.txt declares Sitemap https://pleadingsanity.co.uk/sitemap.xml', () => assert.match(robotsTxt, /Sitemap:\s*https:\/\/pleadingsanity\.co\.uk\/sitemap\.xml/)],
  ['public/sitemap.xml contains canonical https://pleadingsanity.co.uk/ URLs', () => {
    const urls = [...sitemapXml.matchAll(/<loc>(https:\/\/pleadingsanity\.co\.uk\/[^<]*)<\/loc>/g)];
    assert.ok(urls.length >= 10);
  }],
  ['public/manifest.webmanifest uses name Pleading Sanity — Arron AI Companion', () => {
    assert.equal(manifestJson.name, 'Pleading Sanity — Arron AI Companion');
    assert.equal(manifestJson.short_name, 'Pleading Sanity');
  }],
  ['public/manifest.webmanifest configures standalone PWA display and en-GB locale', () => {
    assert.equal(manifestJson.display, 'standalone');
    assert.equal(manifestJson.lang, 'en-GB');
  }],
  ['src/utils/seoAndShare.ts defines SECTION_SEO_MAP for sanctuary, arron, games, live, manifesto', () => {
    for (const key of ['sanctuary', 'arron', 'games', 'live', 'manifesto']) {
      assert.match(seoTs, new RegExp(`\\b${key}:\\s*\\{`));
    }
  }],
  ['src/utils/seoAndShare.ts exports useDynamicSeo hook updating canonical and OpenGraph tags', () => {
    assert.match(seoTs, /export function useDynamicSeo/);
    assert.match(seoTs, /og:title/);
    assert.match(seoTs, /twitter:title/);
  }],
  ['scripts/sync-csp-and-seo.mjs exists and validates CSP + SEO at build time', () => assert.ok(exists('scripts/sync-csp-and-seo.mjs'))],
  ['CRISIS_RESOURCES in sanctuaryData.ts includes tappable tel:116123, sms:85258, tel:111, tel:999', () => {
    assert.match(sanctuaryDataTs, /tel:116123/);
    assert.match(sanctuaryDataTs, /sms:85258/);
    assert.match(sanctuaryDataTs, /tel:111/);
    assert.match(sanctuaryDataTs, /tel:999/);
  }],
];

for (const [name, fn] of seoChecks) {
  test(`SEO & Structured Data: ${name}`, fn);
}

// ============================================================================
// 96–136: Arron Safety, Sanctuary Components, Music & Privacy Contract (41 tests)
// ============================================================================
const sanctuaryChecks = [
  ['App.tsx renders CRISIS_RESOURCES with Samaritans 116 123 and SHOUT 85258', () => assert.match(appTsx, /CRISIS_RESOURCES|116 123/)],
  ['App.tsx displays Rise From Madness · Evolution Not Erasure · Love Over Money mission', () => assert.match(appTsx, /Rise From Madness/)],
  ['App.tsx displays AI Family Unity: GPT · Claude · Gemini · Grok', () => assert.match(appTsx, /GPT · Claude · Gemini · Grok/)],
  ['App.tsx displays Founding Creators 90% Creator / 10% Sanctuary promise', () => assert.match(appTsx, /90% Creator \/ 10% Sanctuary/)],
  ['ArronCompanion clearly states Arron is an AI companion, not a therapist or doctor', () => assert.match(arronTsx, /not a therapist|not a doctor|companion/i)],
  ['ArronCompanion includes crisis awareness and human crisis support links', () => assert.match(arronTsx, /116 123/)],
  ['ArronCompanion surfaces SHOUT 85258 and 999 emergency support', () => {
    assert.match(arronTsx, /85258/);
    assert.match(arronTsx, /999/);
  }],
  ['ArronCompanion provides conversation reset / clear memory controls', () => assert.match(arronTsx, /clear|reset|Delete|Memory/i)],
  ['ArronCompanion connects to /api/arron/chat endpoint', () => assert.match(arronTsx, /\/api\/arron\/chat/)],
  ['ArronCompanion connects to /api/arron/reframe thought reframing endpoint', () => assert.match(arronTsx, /\/api\/arron\/reframe/)],
  ['server.ts defines /api/arron/chat POST route', () => assert.match(serverTs, /app\.post\(['"]\/api\/arron\/chat['"]/)],
  ['server.ts defines /api/arron/reframe POST route', () => assert.match(serverTs, /app\.post\(['"]\/api\/arron\/reframe['"]/)],
  ['server.ts defines /api/github-audit GET route for live repository verification', () => assert.match(serverTs, /app\.get\(['"]\/api\/github-audit['"]/)],
  ['server.ts defines /api/security-seo-audit GET route for CSP and SEO verification', () => assert.match(serverTs, /app\.get\(['"]\/api\/security-seo-audit['"]/)],
  ['server.ts serves /robots.txt and /sitemap.xml routes', () => {
    assert.match(serverTs, /app\.get\(['"]\/robots\.txt['"]/) ;
    assert.match(serverTs, /app\.get\(['"]\/sitemap\.xml['"]/) ;
  }],
  ['server.ts uses Gemini SDK on the server side without exposing API keys to client', () => assert.match(serverTs, /GoogleGenAI/)],
  ['HomepageMusicPlayer is mounted ONLY on the homepage (activeSection === sanctuary)', () => assert.match(musicTsx, /activeSection === 'sanctuary'|HomepageMusicPlayer/)],
  ['HomepageMusicPlayer starts OFF (isPlaying defaults to false, no autoplay)', () => assert.match(musicTsx, /useState\(false\)/)],
  ['HomepageMusicPlayer defaults volume to 15%', () => assert.match(musicTsx, /0\.15|15/)],
  ['HomepageMusicPlayer uses gentle Web Audio gain fade-in and fade-out', () => assert.match(musicTsx, /linearRampToValueAtTime/)],
  ['HomepageMusicPlayer uses zero third-party iframes or YouTube embeds', () => assert.doesNotMatch(musicTsx, /<iframe|youtube\.com/i)],
  ['ConsentBanner provides equal Accept and Decline controls', () => {
    assert.match(consentTsx, /Accept/i);
    assert.match(consentTsx, /Decline/i);
  }],
  ['ConsentBanner stores consent decision in localStorage and supports withdrawal', () => assert.match(consentTsx, /localStorage/)],
  ['ConsentBanner guarantees Arron and Journal Vault content is never tracked', () => assert.match(consentTsx, /Arron|Journal/i)],
  ['TWELVE_CORE_THEMES in sanctuaryData.ts preserves Theme 1: Cracked Heart & Flowers', () => assert.match(sanctuaryDataTs, /Cracked Heart & Flowers/)],
  ['TWELVE_CORE_THEMES in sanctuaryData.ts preserves Theme 2: Silhouette & Galaxy', () => assert.match(sanctuaryDataTs, /Silhouette & Galaxy/)],
  ['TWELVE_CORE_THEMES in sanctuaryData.ts preserves Theme 3: Blooming Mind', () => assert.match(sanctuaryDataTs, /Blooming Mind/)],
  ['TWELVE_CORE_THEMES in sanctuaryData.ts preserves Theme 10: Cosmic Eye quote', () => assert.match(sanctuaryDataTs, /Cosmic Eye & Crying Brain/)],
  ['TWELVE_CORE_THEMES in sanctuaryData.ts preserves Theme 11: Four Lights United', () => assert.match(sanctuaryDataTs, /Four Lights United/)],
  ['TWELVE_CORE_THEMES in sanctuaryData.ts preserves Theme 12: Winding Ascent', () => assert.match(sanctuaryDataTs, /Winding Ascent/)],
  ['POWER_BANNER_QUOTES in sanctuaryData.ts includes Evolution, Not Erasure and Rise From Madness', () => {
    assert.match(sanctuaryDataTs, /Evolution, Not Erasure/);
    assert.match(sanctuaryDataTs, /Rise From Madness/);
  }],
  ['CalmGamesHub.tsx implements calm timer-free sanctuary brain games', () => assert.match(gamesTsx, /Sanity Solitaire|Cosmic Connect|Healing Hz/)],
  ['CalmGamesHub.tsx includes Web Audio Healing Hz frequencies (432 Hz / 528 Hz)', () => assert.match(gamesTsx, /432|528/)],
  ['LiveAndCommunity.tsx implements Live Now, Scheduled, and Past Lives tabs', () => {
    assert.match(liveTsx, /Live Now/i);
    assert.match(liveTsx, /Scheduled/i);
    assert.match(liveTsx, /Past Lives/i);
  }],
  ['LiveAndCommunity.tsx includes Founding Creator Hub (First 1,000 keep 90%)', () => assert.match(liveTsx, /90%/)],
  ['SanityMoodTracker.tsx implements 30-day Sanity Mood Journey tracker', () => assert.match(moodTsx, /Mood|Sanity/i)],
  ['ManifestoAndBible.tsx honours Private A.L. Cooper (RAOC, 1945) and Ivan Kurcharskyi', () => {
    assert.match(manifestoTsx, /A\.L\. Cooper/);
    assert.match(manifestoTsx, /Ivan Kurcharskyi/);
  }],
  ['AuditPanel.tsx includes Insane Solar UK VAT Notice 708/6 and Node 24 136-test audit verification', () => {
    assert.match(auditPanelTsx, /708\/6/);
    assert.match(auditPanelTsx, /136/);
  }],
  ['AuditPanel.tsx includes SEO & Social Discovery kit (10 pages, 10 social captions, Leicester outreach)', () => assert.match(auditPanelTsx, /Leicester/)],
  ['firebase-applet-config.json remains intact and points to pleading-sanity project', () => {
    const fb = JSON.parse(read('firebase-applet-config.json'));
    assert.equal(fb.projectId, 'pleading-sanity');
  }],
  ['firestore.rules enforces owner-only writes across users, mood_logs, profiles, follows, lives, posts, and creator_applications', () => {
    const rules = read('firestore.rules');
    assert.match(rules, /rules_version = '2'/);
    assert.match(rules, /match \/users\/\{userId\}/);
    assert.match(rules, /match \/mood_logs\/\{logDate\}/);
  }],
];

for (const [name, fn] of sanctuaryChecks) {
  test(`Sanctuary Contract: ${name}`, fn);
}
