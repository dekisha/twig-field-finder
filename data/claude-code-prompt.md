# Project: Twig Field Finder

**Name:** Twig Field Finder
**Tagline:** Every Drupal field value in Twig, copy-ready.
**Repo / package slug:** `twig-field-finder`
**Default base path (if served from a subpath):** `/twig-field-finder`

Use this name and tagline consistently in the site header, `<title>` tags (format: `{Page} — Twig Field Finder`), meta descriptions, Open Graph tags, `package.json`, the README and the favicon/logo concept.

## Context

I'm a senior Drupal front-end developer (14 years, Acquia Certified, SDC / Storybook / Tailwind / Alpine.js workflow). I'm building a public portfolio app from my personal notes on how to access Drupal field values in Twig templates. It will be hosted on my own domain as a demo of my skills, so code quality, architecture, accessibility and UI polish all matter as much as the features.

The seed data is in `data/twig-field-entries.json`. Read it fully before planning. It contains:
- `entries`: one object per field type/property, with snippet arrays for three approaches: `raw` (entity access, before formatters), `render` (the `content` render array, after formatters) and `helper` (contrib module syntax, each with its `module`).
- Placeholders: `__ENTITY__` (entity variable), `__FIELD__` (field machine name), `__SUBFIELD__` (field on a referenced entity). Snippets that start with `content.` are render-array access and don't change with the entity.
- `usesField: false` on entries that don't take a field name (ID, title, bundle...). The default is true.
- `review`: notes on entries I corrected or am unsure about. **Don't drop these.** Keep the field in the schema and show these entries in dev mode only (see below).
- `helperFilters` and `modules` (with drupal.org links).

## Stack (decided)

- **Astro** (latest stable), static output
- **React** islands for all interactive UI
- **TypeScript**, strict mode
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **Astro content collections** with a Zod schema for the entries (move the seed JSON into a collection, one file per group or one per entry, whichever you recommend, and explain why)
- **Shiki** for Twig syntax highlighting. Use the fine-grained `shiki/core` bundle with only the Twig grammar and two themes (light/dark), lazy-loaded on the client, because snippets change live as the user types.
- **Vitest** for unit tests and **Playwright** for a few end-to-end smoke tests
- pnpm, ESLint and Prettier

Check the current docs for Astro, Tailwind v4 and Shiki before you set them up. Don't rely on memory for config syntax.

## Core feature: the snippet builder

This is the main screen, and it needs to feel like a polished developer tool:

1. **Field type picker.** A searchable combobox (keyboard-navigable, grouped by `group`) for choosing what you want to get: "Image — alt", "Link — URL", "Reference — label"... Use fuzzy search across label, group and id.
2. **Field machine name input.** A text input such as `field_hero_image`.
   - Validate against `^[a-z][a-z0-9_]*$` and show inline feedback.
   - If the user types `hero_image`, offer to prefix it with `field_`. Don't silently change their input.
   - Disable the input (with an explanation) when the selected entry has `usesField: false`.
   - Show a second input for the sub-field name only when the snippet contains `__SUBFIELD__`.
3. **Entity context selector.** A segmented control: node / paragraph / media / taxonomy_term / user / block_content. It replaces `__ENTITY__`. Default: node. Use `term` as the Twig variable for taxonomy_term and `content` only where it already appears in the snippet. Document the variable-name mapping in one place in the code.
4. **Approach tabs.** Raw entity / Render array / Helper module. Hide or disable tabs the entry has no snippets for. Show each helper snippet with a module badge that links to drupal.org.
5. **Result.** The complete, substituted Twig path(s) with syntax highlighting and a **Copy** button on each snippet. Show a visible "Copied" state and announce it to screen readers through an aria-live region. Optionally add "Copy all" for entries with several snippets.
6. **Notes.** Show `notes` under the result as a gotcha callout.
7. **Shareable state.** Keep the selected entry, field name, entity and tab in the URL query string so someone can share a link to a specific answer. Restore that state on load.

## Secondary features

- **Static page for each entry** (`/fields/[id]`) that shows every approach with default placeholders, for SEO and direct linking. Each page links into the builder with the state prefilled.
- **Browse view:** all entries grouped, filterable by group and by required module.
- **Helper modules page:** the four `twig_field_value` filters and what each module provides.
- **Dark mode:** follow the system setting, with a manual toggle remembered in localStorage (wrapped in try/catch).
- **Dev-only review mode:** when `import.meta.env.DEV` is true, show entries with a `review` field marked with their note, so I can verify them on a real Drupal site. In production builds, show them normally but leave the review note out.

## Architecture and code quality

- Keep the substitution logic in pure, framework-free TypeScript functions (`src/lib/`), fully unit-tested: placeholder replacement, entity mapping, field-name validation and the `field_` prefix suggestion.
- Keep components small and typed. No `any`.
- Accessibility: WCAG 2.2 AA, a fully keyboard-operable combobox (follow the WAI-ARIA combobox pattern or use a headless library such as Headless UI or Radix and say which), visible focus states, sufficient contrast in both themes.
- Performance: ship minimal JS. Only the builder island hydrates (`client:load`); everything else is static HTML. Aim for Lighthouse 95+ in every category.
- Make the base path configurable through Astro's `base`, because the site may be served from a subpath (e.g. `myname.com/twig-fields`) or a subdomain.

## Design direction

A developer-tool aesthetic that feels crafted, not like a template: confident typography (a good mono font for code), restrained colour with one accent, generous spacing, clear hierarchy between input controls and the result. The result panel with the copy button is the hero of the page. Make it responsive down to 360px wide. Propose 2–3 design directions with a short description before implementing, and let me pick one.

## Deliverables beyond the app

- `README.md`: what it is, the tech decisions with a short rationale for each, how to run, test and deploy, and how to add a new entry.
- GitHub Actions workflow: lint, typecheck, unit tests and build on every push and PR.
- Deployment notes for Cloudflare Pages (preferred) and for uploading `dist/` to standard shared hosting under a subpath.

## How to work

1. **Plan first.** Read the seed data, then give me a written plan: folder structure, the content collection schema, the component tree, the libraries you'll add (with justification) and the phases. Wait for my approval before writing code.
2. Build in phases, and stop after each one for me to review:
   - Phase 1: project scaffold, tooling, content collection and schema, `src/lib` logic with tests
   - Phase 2: the snippet builder (all core features)
   - Phase 3: entry pages, browse view, helper modules page
   - Phase 4: dark mode, polish, accessibility pass, Playwright tests
   - Phase 5: README, CI, deployment config
3. Don't change snippet content in the data on your own. If you think a snippet is wrong, add or update its `review` note and tell me.
4. Commit at the end of each phase with a clear conventional-commit message.
