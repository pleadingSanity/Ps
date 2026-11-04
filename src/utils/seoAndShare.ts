import { useEffect } from 'react';

export interface PageSeoConfig {
  title: string;
  description: string;
  keywords: string;
  path: string;
  ogType: string;
  imageUrl: string;
  imageAlt: string;
  schemaType: 'WebPage' | 'SoftwareApplication' | 'CollectionPage' | 'Article';
}

export const SECTION_SEO_MAP: Record<string, PageSeoConfig> = {
  sanctuary: {
    title: 'Pleading Sanity — Rise From Madness | Free Mental Health Sanctuary',
    description:
      'A free mental health sanctuary built by Shane Cooper from lived experience. Featuring Arron AI Companion, the New Gen Bible, Manifesto, Creator Hub, Live Sanctuary, and 12 calm cosmic games.',
    keywords:
      'Pleading Sanity, Shane Cooper, Rise From Madness, Evolution Not Erasure, free UK mental health sanctuary, Arron AI, 30-day sanity mood tracker, Samaritans 116 123',
    path: '/',
    ogType: 'website',
    imageUrl: 'https://pleadingsanity.co.uk/assets/crying-brain-og.png',
    imageAlt:
      'Pleading Sanity — Rise From Madness: Free Mental Health Sanctuary built by Shane Cooper',
    schemaType: 'WebPage',
  },
  arron: {
    title: 'Arron AI Companion — Stay Sane | Pleading Sanity Sanctuary',
    description:
      "I'm Arron. Shane built me. Here to help you Stay Sane. Free, honest AI companion and Shadow-to-Constellation thought untangler with zero tracking.",
    keywords:
      'Arron AI Companion, Stay Sane, Pleading Sanity AI, Shane Cooper AI legacy, GPT Claude Gemini Grok AI family, mental health companion UK',
    path: '/?section=arron',
    ogType: 'website',
    imageUrl: 'https://pleadingsanity.co.uk/assets/crying-brain-og.png',
    imageAlt: 'Arron AI Companion — Gentle, honest mental health sanctuary companion',
    schemaType: 'SoftwareApplication',
  },
  games: {
    title: '12 Free Calm Mental Health Games — No Timers | Pleading Sanity',
    description:
      'Play 12 free cosmic sanctuary games with zero timers: Sanity Solitaire, Cosmic Connect, Truth Tag, Cosmic Focus, Healing Hz, Memory Ocean, and Mood Journey.',
    keywords:
      'Sanity Solitaire, Cosmic Connect, Healing Hz 432Hz 528Hz, calm mental health games, no timer anxiety games, Pleading Sanity games',
    path: '/?section=games',
    ogType: 'website',
    imageUrl: 'https://pleadingsanity.co.uk/assets/crying-brain-og.png',
    imageAlt: 'Pleading Sanity — 12 Free No-Timer Calm Cosmic Games',
    schemaType: 'CollectionPage',
  },
  live: {
    title: 'Live Sanctuary & Founding Creator Hub (90/10) | Pleading Sanity',
    description:
      'Join live mental health community streams and the First 1,000 Founding Creator Hub where creators keep 90% and 10% keeps the sanctuary lights on.',
    keywords:
      'Pleading Sanity Live Sanctuary, Founding Creator Hub 90/10, mental health creators UK, ethical creator platform, Love Over Money',
    path: '/?section=live',
    ogType: 'website',
    imageUrl: 'https://pleadingsanity.co.uk/assets/crying-brain-og.png',
    imageAlt: 'Pleading Sanity — Live Sanctuary & First 1,000 Founding Creator Hub',
    schemaType: 'CollectionPage',
  },
  manifesto: {
    title: 'Shane Cooper Manifesto & The New Gen Bible | Pleading Sanity',
    description:
      'Read Shane Cooper’s unedited Manifesto (“You say I’m mad — you just don’t understand me”) and the 5-Book New Gen Bible: Evolution, Not Erasure.',
    keywords:
      'Shane Cooper Manifesto, New Gen Bible, You say I am mad you just do not understand me, Private A.L. Cooper RAOC, Ivan Kurcharskyi, Evolution Not Erasure',
    path: '/?section=manifesto',
    ogType: 'article',
    imageUrl: 'https://pleadingsanity.co.uk/assets/crying-brain-og.png',
    imageAlt: 'Shane Cooper Manifesto & The New Gen Bible — Pleading Sanity',
    schemaType: 'Article',
  },
};

export function useDynamicSeo(section: string) {
  useEffect(() => {
    const config = SECTION_SEO_MAP[section] || SECTION_SEO_MAP.sanctuary;
    document.title = config.title;

    const setMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', content);
    };

    setMeta('meta[name="title"]', config.title);
    setMeta('meta[name="description"]', config.description);
    setMeta('meta[name="keywords"]', config.keywords);
    setMeta('meta[property="og:title"]', config.title);
    setMeta('meta[property="og:description"]', config.description);
    setMeta('meta[property="og:type"]', config.ogType);
    setMeta('meta[property="og:image"]', config.imageUrl);
    setMeta('meta[property="og:image:alt"]', config.imageAlt);
    setMeta('meta[name="twitter:title"]', config.title);
    setMeta('meta[name="twitter:description"]', config.description);
    setMeta('meta[name="twitter:image"]', config.imageUrl);
    setMeta('meta[name="twitter:image:alt"]', config.imageAlt);

    const canonicalUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${config.path}`
        : `https://pleadingsanity.co.uk${config.path}`;

    setMeta('meta[property="og:url"]', canonicalUrl);
    setMeta('meta[name="twitter:url"]', canonicalUrl);
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', canonicalUrl);
    }

    // Update or inject dynamic section-level Schema.org JSON-LD
    if (typeof document !== 'undefined') {
      let dynamicScript = document.getElementById('ps-dynamic-jsonld') as HTMLScriptElement | null;
      if (!dynamicScript) {
        dynamicScript = document.createElement('script');
        dynamicScript.id = 'ps-dynamic-jsonld';
        dynamicScript.type = 'application/ld+json';
        document.head.appendChild(dynamicScript);
      }

      const dynamicLd = {
        '@context': 'https://schema.org',
        '@type': config.schemaType,
        '@id': `https://pleadingsanity.co.uk${config.path}#section`,
        name: config.title,
        headline: config.title,
        description: config.description,
        url: canonicalUrl,
        inLanguage: 'en-GB',
        isAccessibleForFree: true,
        isPartOf: {
          '@id': 'https://pleadingsanity.co.uk/#website',
        },
        author: {
          '@id': 'https://pleadingsanity.co.uk/#founder',
        },
        publisher: {
          '@id': 'https://pleadingsanity.co.uk/#organization',
        },
      };

      dynamicScript.textContent = JSON.stringify(dynamicLd);
    }
  }, [section]);
}

export async function shareSanctuaryContent({
  title,
  text,
  section,
}: {
  title: string;
  text: string;
  section?: string;
}): Promise<{ method: 'web-share' | 'clipboard'; sharedUrl: string }> {
  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://pleadingsanity.co.uk/';

  const sharedUrl =
    section && section !== 'sanctuary'
      ? `${baseUrl}?section=${encodeURIComponent(section)}`
      : baseUrl;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title,
        text,
        url: sharedUrl,
      });
      return { method: 'web-share', sharedUrl };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { method: 'web-share', sharedUrl };
      }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(`${title} — ${text}\n${sharedUrl}`);
  }
  return { method: 'clipboard', sharedUrl };
}
