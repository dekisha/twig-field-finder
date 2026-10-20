/**
 * Entity contexts and the Twig variable each one exposes in its template.
 *
 * This is the single source of truth for the `__ENTITY__` placeholder. Most
 * entity templates expose the entity under its own machine name; the
 * exceptions are documented inline.
 */
export const ENTITY_CONTEXTS = [
  { id: 'node', label: 'Node', variable: 'node', template: 'node.html.twig' },
  { id: 'paragraph', label: 'Paragraph', variable: 'paragraph', template: 'paragraph.html.twig' },
  { id: 'media', label: 'Media', variable: 'media', template: 'media.html.twig' },
  {
    id: 'taxonomy_term',
    label: 'Term',
    // taxonomy-term.html.twig exposes the entity as `term`.
    variable: 'term',
    template: 'taxonomy-term.html.twig',
  },
  { id: 'user', label: 'User', variable: 'user', template: 'user.html.twig' },
  {
    id: 'block_content',
    label: 'Block',
    // block.html.twig has no entity variable; a custom block's entity lives on
    // the render array. This is the one place `content` is introduced by the
    // entity mapping rather than by the snippet itself.
    variable: "content['#block_content']",
    template: 'block--block-content.html.twig',
  },
] as const;

export type EntityContext = (typeof ENTITY_CONTEXTS)[number];
export type EntityContextId = EntityContext['id'];

export const DEFAULT_ENTITY_CONTEXT: EntityContextId = 'node';

// Built from the same tuple the id type is derived from, so every id is present.
const byId = Object.fromEntries(ENTITY_CONTEXTS.map((c) => [c.id, c])) as Record<
  EntityContextId,
  EntityContext
>;

export function isEntityContextId(value: unknown): value is EntityContextId {
  return typeof value === 'string' && Object.hasOwn(byId, value);
}

export function getEntityContext(id: EntityContextId): EntityContext {
  return byId[id];
}

/** Twig variable to substitute for `__ENTITY__` in the given context. */
export function entityVariable(id: EntityContextId): string {
  return getEntityContext(id).variable;
}
