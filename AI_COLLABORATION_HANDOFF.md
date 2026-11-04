# PLEADING SANITY — AI STUDIO COORDINATION CONTRACT
Updated: 2026-11-04. Owner: Shane Cooper. Status: development handover, not autonomous authority.

## Single production source of truth
- Production: https://pleadingsanity.co.uk
- Production GitHub: https://github.com/pleadingSanity/pleadingsanity (main)
- AI Studio prototype/reference: https://github.com/pleadingSanity/Ps (this repository)
- Production host: existing Netlify project "pleadingsanity"
- Do NOT deploy this React/Vite prototype over the live static Netlify site, migrate its stack, create a second Arron, or create new paid services.

## Required start-of-session reads
In production repo: AI_HANDOFF.md, AGENTS.md, docs/MASTER_PROMPT.md, system_blueprint.json (if present), netlify.toml, and current main commit, open PRs, GitHub Actions, and deployed Netlify SHA.
In this repo: this file, package.json, src/App.tsx, src/components/HomepageMusicPlayer.tsx, src/components/ConsentBanner.tsx, src/utils/seoAndShare.ts and tests/verify-sanctuary-136.test.mjs.
Use live GitHub reads every session. Never assume this file automatically updates itself or other AI chats.

## Founder mission and immutable rules
Rise From Madness. Evolution, Not Erasure. Connect The Survivors.
Free mental-health sanctuary: Arron AI companion (NOT a therapist), Journal Vault, calm games, kids area, creator tools, support and crisis resources.
UK crisis: Samaritans 116 123; text SHOUT to 85258; NHS 111; emergency 999. Always reachable.
Protect private journals, personal stories, user data and secrets. No analytics on sensitive conversations, no data selling, no paywalls for mental-health essentials, no misleading medical or frequency-healing claims.
Official crying-brain identity and premium cosmic styling; protect approved factory pack measurements and clothing specifications. Never replace founder story or add unapproved products.
Keep existing GPT → Claude → Gemini → Grok AI failover order and free-by-default spend policy; do not expose keys.

## Collaboration protocol
GPT: technical verification, safe integration, test/release evidence.
Gemini/AI Studio: independently audit and propose focused improvements; build prototype code in this repo only.
Grok/other builders: may contribute through reviewed PRs.
These roles do NOT grant account access, identity impersonation, background execution or automatic shared memory.
For production changes: propose a focused PR against production main; explain source, exact diff, tests, privacy, accessibility and rollback. Do not directly replace production.
Never mass-merge unrelated PRs or touch protected PR #92.

## Current review handover
- Production PR #208: https://github.com/pleadingSanity/pleadingsanity/pull/208 — fixes unwanted background YouTube load and page-wide gesture auto-unmute. Needs full browser validation, and licence/third-party privacy review before production merge.
- Prototype homepage music component: src/components/HomepageMusicPlayer.tsx. Uses browser-generated 432/528 Hz tones, OFF by default, 15% initial volume. Do not claim clinical efficacy; test Web Audio lifecycle, accessibility, performance, user gesture restrictions.
- Prototype SEO: src/utils/seoAndShare.ts. Validate canonical route architecture against real production HTML pages; don't copy ?section= paths to production.
- Prototype consent UI: src/components/ConsentBanner.tsx. A banner alone is not proof of compliant analytics gating; verify actual network requests, withdrawal and UK disclosure.
- Prototype audit panel: src/components/AuditPanel.tsx. Contains hardcoded status/commit text; never present this as live telemetry without a real authenticated backend.
- Prototype tests: tests/verify-sanctuary-136.test.mjs. Many checks assert file strings/configuration. Do not equate 136 green tests with 136 end-to-end browser tests.
- Grok reported production commit dd9e54a (solar assistant and Node 24 test fixes); independently verify current main and live deploy. The repository may have moved since.
- Games count and other marketing claims must be derived from actual production, not prototype copy.

## Highest-value integration opportunities
1. Homepage music: no audio or external network before deliberate Play; 15% initial volume; keyboard/screen-reader accessible; no Arron music. Prefer original/licensed assets and no hidden autoplay.
2. Privacy consent: genuine opt-in network gating and withdrawal, not banner-only.
3. Accurate SEO meta and structured data on existing production pages, not React route duplication.
4. Reusable static audits, Node 24 compatibility where appropriate, and real mobile browser tests.
5. Optional accessible UI improvements; preserve all existing functionality.

## Handoff format for every change
Date; current production main SHA; prototype SHA; production deployed SHA (if checked); inspected files; exact defect; proposed solution; changed files; commands/tests/results; remaining risks; PR URL; deployment status. If not verified, write "not verified".
Never place credentials in this file. Never claim ongoing background collaboration without an actual scheduler/connector.
