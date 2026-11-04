import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function serializeCspDirectives(directives) {
  return Object.entries(directives)
    .map(([directive, values]) => {
      if (!Array.isArray(values) || values.length === 0) {
        return directive;
      }
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
}

function generateNetlifyHeadersFromJson(cspConfig) {
  const lines = [
    '# ==============================================================================',
    '# PLEADING SANITY — NETLIFY PRODUCTION SECURITY & CSP HEADERS',
    '# AUTO-GENERATED FROM content-security-policy.json BY scripts/sync-csp-and-seo.mjs',
    '# Evolution, Not Erasure · Rise From Madness · Love Over Money',
    '# Restricts script execution & external requests to trusted domains, with',
    '# dedicated hardening for Arron AI (/arron*) and payment-linked modules.',
    '# ==============================================================================',
    '',
  ];

  for (const [policyKey, policy] of Object.entries(cspConfig.policies || {})) {
    lines.push(`# Policy: ${policyKey} — ${policy.purpose || ''}`);
    const cspHeaderValue = serializeCspDirectives(policy.directives || {});

    for (const routePattern of policy.routePatterns || []) {
      lines.push(routePattern);
      for (const [headerName, headerVal] of Object.entries(policy.headers || {})) {
        lines.push(`  ${headerName}: ${headerVal}`);
      }
      lines.push(`  Content-Security-Policy: ${cspHeaderValue}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

function verifyAndSync() {
  const cspPath = path.join(rootDir, 'content-security-policy.json');
  if (!fs.existsSync(cspPath)) {
    throw new Error('Missing content-security-policy.json at repository root.');
  }

  const cspConfig = JSON.parse(fs.readFileSync(cspPath, 'utf8'));
  const generatedHeaders = generateNetlifyHeadersFromJson(cspConfig);

  for (const targetRel of cspConfig.outputTargets || ['_headers', 'public/_headers']) {
    const outPath = path.join(rootDir, targetRel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, generatedHeaders, 'utf8');
  }

  // Verify SEO metadata in index.html
  const indexHtmlPath = path.join(rootDir, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    throw new Error('Missing index.html at repository root.');
  }

  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  const requiredChecks = [
    { label: '<title>', regex: /<title>[^<]*Pleading Sanity[^<]*<\/title>/i },
    { label: 'meta[name="description"]', regex: /<meta\s+[^>]*name=["']description["'][^>]*content=["'][^"']{80,}["']/i },
    { label: 'link[rel="canonical"]', regex: /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']https:\/\/pleadingsanity\.co\.uk\/["']/i },
    { label: 'meta[property="og:title"]', regex: /<meta\s+[^>]*property=["']og:title["']/i },
    { label: 'meta[property="og:description"]', regex: /<meta\s+[^>]*property=["']og:description["']/i },
    { label: 'meta[property="og:image"]', regex: /<meta\s+[^>]*property=["']og:image["']/i },
    { label: 'meta[name="twitter:card"]', regex: /<meta\s+[^>]*name=["']twitter:card["'][^>]*content=["']summary_large_image["']/i },
    { label: 'Schema.org JSON-LD', regex: /<script[^>]*type=["']application\/ld\+json["'][^>]*>/i },
  ];

  for (const check of requiredChecks) {
    if (!check.regex.test(html)) {
      throw new Error(`SEO Verification failed for ${check.label} in index.html`);
    }
  }

  // Verify AI Greater Good Law (.github/AI-GREATER-GOOD-LAW.md)
  const aiLawPath = path.join(rootDir, '.github', 'AI-GREATER-GOOD-LAW.md');
  if (!fs.existsSync(aiLawPath)) {
    throw new Error('Missing .github/AI-GREATER-GOOD-LAW.md constitutional covenant.');
  }

  console.log(
    '[CSP, AI Law & SEO Sync] Successfully compiled content-security-policy.json -> _headers & public/_headers, verified AI-GREATER-GOOD-LAW.md, and verified full SEO metadata.'
  );
}

verifyAndSync();
