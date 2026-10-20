import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const snippet = z.string().min(1);

/**
 * One YAML file per entry under `src/content/entries/<group>/<id>.yaml`.
 * The filename is the id; the folder is only for tidiness (a test checks it
 * matches `group`).
 */
const entries = defineCollection({
  loader: glob({
    pattern: '**/*.yaml',
    base: './src/content/entries',
    generateId: ({ entry }) => entry.replace(/^.*\//, '').replace(/\.yaml$/, ''),
  }),
  schema: z
    .object({
      label: z.string().min(1),
      group: reference('groups'),
      /** Position within the group (ascending). */
      order: z.number().int().nonnegative(),
      /** False for entries that don't take a field name (ID, title, bundle…). */
      usesField: z.boolean().default(true),
      /** Entity access, before formatters. */
      raw: z.array(snippet).optional(),
      /** The `content` render array, after formatters. */
      render: z.array(snippet).optional(),
      /** Contrib module syntax. */
      helper: z.array(z.object({ code: snippet, module: reference('modules') })).optional(),
      /** Gotchas, shown under the result. Supports `inline code`. */
      notes: z.string().optional(),
      /** Correction / uncertainty note. Shown in dev builds only. */
      review: z.string().optional(),
    })
    .strict()
    .refine((e) => [e.raw, e.render, e.helper].some((snippets) => (snippets?.length ?? 0) > 0), {
      message: 'An entry needs at least one raw, render or helper snippet.',
    }),
});

const groups = defineCollection({
  loader: file('./src/content/groups.yaml'),
  schema: z.object({ label: z.string().min(1), order: z.number().int().nonnegative() }),
});

const modules = defineCollection({
  loader: file('./src/content/modules.yaml'),
  schema: z.object({ name: z.string().min(1), url: z.url() }),
});

const helperFilters = defineCollection({
  loader: file('./src/content/helper-filters.yaml'),
  schema: z.object({ module: reference('modules'), description: z.string().min(1) }),
});

export const collections = { entries, groups, modules, helperFilters };
