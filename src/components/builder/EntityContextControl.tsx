import { Label, RadioButton, RadioField, RadioGroup, Text } from 'react-aria-components';

import { InlineCode } from '@/components/InlineCode';
import {
  ENTITY_CONTEXTS,
  getEntityContext,
  isEntityContextId,
  type EntityContextId,
} from '@/lib/entities';

interface Props {
  value: EntityContextId;
  onChange: (value: EntityContextId) => void;
  /** When set, the snippets don't change with the entity: show this instead. */
  fixedReason?: string | undefined;
}

/**
 * Segmented control for the entity whose template you're in. Semantically a
 * radio group: one choice, arrow keys move between options. Lives in the
 * result panel, next to the snippets it changes; when they don't change with
 * the entity it collapses to a one-line note so the code doesn't jump.
 */
export function EntityContextControl({ value, onChange, fixedReason }: Props) {
  if (fixedReason !== undefined) {
    return (
      <p className="text-sm text-muted">
        <span className="font-medium text-ink">Template context · </span>
        <InlineCode text={fixedReason} />
      </p>
    );
  }

  const context = getEntityContext(value);

  return (
    <RadioGroup
      className="flex flex-col gap-1.5"
      value={value}
      onChange={(next) => {
        if (isEntityContextId(next)) onChange(next);
      }}
      orientation="horizontal"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <Label className="text-sm font-medium text-ink">Template context</Label>
        <Text slot="description" className="text-sm text-muted">
          <code className="font-mono text-ink">{context.variable}</code> in{' '}
          <code className="font-mono">{context.template}</code>
        </Text>
      </div>
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-control bg-sunken p-1 sm:flex sm:flex-wrap">
        {ENTITY_CONTEXTS.map((c) => (
          <RadioField key={c.id} value={c.id} className="flex flex-1 cursor-pointer">
            <RadioButton className="flex min-h-9 flex-1 cursor-pointer items-center justify-center rounded-md px-2 text-sm font-medium text-muted transition-colors hover:text-ink data-focus-visible:outline-2 data-focus-visible:outline-focus data-selected:bg-surface data-selected:text-ink data-selected:shadow-sm data-selected:ring-1 data-selected:ring-control">
              {c.label}
            </RadioButton>
          </RadioField>
        ))}
      </div>
    </RadioGroup>
  );
}
