import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

import { locales } from './i18n/ui';

// Exposure axes mirror the vault's metadata schema. Defaults are the most conservative:
// a file that forgets to declare itself is private and a draft, so it is never built.
const exposure = z.object({
  visibility: z.enum(['private', 'restricted', 'public']).default('private'),
  draft: z.boolean().default(true),
  license: z.string().optional(), // SPDX identifier, e.g. CC-BY-4.0
});

const base = exposure.extend({
  title: z.string(),
  summary: z.string(),
  date: z.coerce.date(), // ISO 8601 in frontmatter; formatted per locale at render time
  updated: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  lang: z.enum(locales),
  translationKey: z.string(), // identical across translations of one piece
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: base,
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: base.extend({
    role: z.string().optional(),
    period: z.string().optional(),
    stack: z.array(z.string()).default([]),
    repo: z.url().optional(),
  }),
});

export const collections = { writing, projects };
