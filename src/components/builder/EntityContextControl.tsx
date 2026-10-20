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
  /** When set, the control is disabled and this explains why. */
  disabledReason?: string | undefined;
}

/**
 * Segmented control for the entity whose template you're in. Semantically a
 * radio group: one choice, arrow keys move between options.
 */
export function EntityContextControl({ value, onChange, disabledReason }: Props) {
  const context = getEntityContext(value);

  return (
    <RadioGroup
      className="flex flex-col gap-1.5"
      value={value}
      onChange={(next) => {
        if (isEntityContextId(next)) onChange(next);
      }}
      orientation="horizontal"
      isDisabled={disabledReason !== undefined}
    >
      <Label className="text-sm font-medium text-ink">Template context</Label>
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-control bg-sunken p-1 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6">
        {ENTITY_CONTEXTS.map((c) => (
          <RadioField key={c.id} value={c.id} className="flex">
            <RadioButton className="flex min-h-9 flex-1 cursor-default items-center justify-center rounded-md px-2 text-sm font-medium text-muted transition-colors hover:text-ink data-disabled:cursor-not-allowed data-disabled:hover:text-muted data-focus-visible:outline-2 data-focus-visible:outline-focus data-selected:bg-surface data-selected:text-ink data-selected:shadow-sm data-selected:ring-1 data-selected:ring-control data-disabled:data-selected:text-muted">
              {c.label}
            </RadioButton>
          </RadioField>
        ))}
      </div>
      <Text slot="description" className="text-sm text-muted">
        {disabledReason !== undefined ? (
          <InlineCode text={disabledReason} />
        ) : (
          <>
            <code className="font-mono text-ink">{context.variable}</code> in{' '}
            <code className="font-mono">{context.template}</code>
          </>
        )}
      </Text>
    </RadioGroup>
  );
}
