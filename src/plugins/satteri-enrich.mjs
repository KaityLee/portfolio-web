// Sätteri plugins that dress plain Markdown up at build time (configured in astro.config.mjs,
// styled by src/styles/prose.css, described in DESIGN.md §8). The source stays ordinary Markdown,
// so the Obsidian original needs no site-specific syntax.
import GithubSlugger from 'github-slugger';

import { defaultLocale, ui } from '../i18n/ui.ts';

function t(ctx, key) {
  const lang = ctx.data?.astro?.frontmatter?.lang;
  const table = ui[lang] ?? ui[defaultLocale];
  return table[key] ?? ui[defaultLocale][key] ?? key;
}

const el = (tagName, properties = {}, children = []) => ({ type: 'element', tagName, properties, children });
const text = (value) => ({ type: 'text', value });
const isBlank = (node) => node.type === 'text' && !node.value.trim();

// Figure: a paragraph that holds nothing but one image becomes <figure class="figure">. The
// caption is the image title (`![alt](src "caption")`) and falls back to the alt text. The <img>
// itself is passed through untouched so Astro's image pipeline (which runs after user plugins)
// still optimizes it.
export const figures = {
  name: 'figures',
  element: {
    filter: ['p'],
    visit(node, ctx) {
      const children = (node.children ?? []).filter((c) => !isBlank(c));
      if (children.length !== 1) return;
      const img = children[0];
      if (img.type !== 'element' || img.tagName !== 'img') return;
      const { title, ...props } = img.properties ?? {};
      const caption = String(title ?? props.alt ?? '').trim();
      const figure = el('figure', { className: ['figure'] }, [{ ...img, properties: props }]);
      if (caption) figure.children.push(el('figcaption', {}, [text(caption)]));
      ctx.replaceNode(node, figure);
    },
  },
};

// External links: absolute http(s) links to another host get rel="noopener" and a class that
// draws a small arrow (prose.css). Links that wrap an image keep the rel but get no arrow.
const SITE_HOST = (() => {
  try {
    return new URL(process.env.SITE_URL ?? '').host;
  } catch {
    return '';
  }
})();

export const externalLinks = {
  name: 'external-links',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      const props = node.properties ?? {};
      const href = typeof props.href === 'string' ? props.href : '';
      if (!/^https?:\/\//i.test(href)) return;
      let host;
      try {
        host = new URL(href).host;
      } catch {
        return;
      }
      if (host === SITE_HOST) return;
      const rel = new Set([].concat(props.rel ?? []).flatMap((r) => String(r).split(/\s+/)).filter(Boolean));
      rel.add('noopener');
      ctx.setProperty(node, 'rel', [...rel].join(' '));
      const wrapsImage = (node.children ?? []).some((c) => c.type === 'element' && c.tagName === 'img');
      if (wrapsImage) return;
      const raw = props.className ?? props.class ?? [];
      const classes = Array.isArray(raw) ? raw : String(raw).split(/\s+/).filter(Boolean);
      ctx.setProperty(node, 'className', [...classes, 'external-link']);
    },
  },
};

// Heading anchors: h2–h4 get a link to themselves. Astro assigns heading ids *after* user
// plugins, so the ids are set here with the same github-slugger algorithm and the same document
// order (h1–h6 all pass through one slugger); Astro then keeps these ids for the TOC.
export const headingAnchors = () => {
  const slugger = new GithubSlugger();
  return {
    name: 'heading-anchors',
    element: {
      filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      visit(node, ctx) {
        const label = ctx.textContent(node);
        const existing = node.properties?.id;
        const id = typeof existing === 'string' ? existing : slugger.slug(label);
        if (typeof existing !== 'string') ctx.setProperty(node, 'id', id);
        if (!['h2', 'h3', 'h4'].includes(node.tagName)) return;
        ctx.appendChild(
          node,
          el('a', { className: ['heading-anchor'], href: `#${id}`, ariaLabel: `${t(ctx, 'article.headingLink')}: ${label}` }, [
            el('span', { className: ['heading-anchor-icon'], ariaHidden: 'true' }),
          ]),
        );
      },
    },
  };
};

// Reading time: counted on the Markdown tree (prose text only; code is skipped), written to
// frontmatter as `readingMinutes` and read back in the views via `remarkPluginFrontmatter`.
// Script-aware instead of locale-aware so mixed-language posts and future locales just work:
// CJK is read per character, everything else per word.
const CJK = /[\p{Script=Hangul}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu;
const CJK_CHARS_PER_MINUTE = 500;
const WORDS_PER_MINUTE = 220;

export function estimateReadingMinutes(cjkChars, words) {
  return Math.max(1, Math.round(cjkChars / CJK_CHARS_PER_MINUTE + words / WORDS_PER_MINUTE));
}

export const readingTime = () => {
  let cjkChars = 0;
  let words = 0;
  return {
    name: 'reading-time',
    text(node) {
      const value = node.value ?? '';
      cjkChars += value.match(CJK)?.length ?? 0;
      words += value.replace(CJK, ' ').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
    },
    after(_root, ctx) {
      const astro = ctx.data?.astro;
      if (astro) astro.frontmatter.readingMinutes = estimateReadingMinutes(cjkChars, words);
    },
  };
};
