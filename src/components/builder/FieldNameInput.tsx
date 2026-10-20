import { FieldError, Input, Label, Text, TextField } from 'react-aria-components';

import { FIELD_NAME_MESSAGES, suggestFieldPrefix, validateFieldName } from '@/lib/field-name';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Shown under the input while it's enabled. */
  description: string;
}

/**
 * Machine-name input with inline validation. Empty is valid (the result shows
 * a stand-in); anything else must match Drupal's machine-name rules. A missing
 * `field_` prefix is offered as a one-click fix, never applied silently.
 */
export function FieldNameInput({
  label,
  value,
  onChange,
  placeholder,
  description,
}: Props) {
  const result = value === '' ? null : validateFieldName(value);
  const error = result && !result.valid ? FIELD_NAME_MESSAGES[result.error] : undefined;
  const warning = result?.valid && result.warning ? FIELD_NAME_MESSAGES[result.warning] : undefined;
  const suggestion = suggestFieldPrefix(value);

  return (
    <TextField
      className="group flex flex-col gap-1.5"
      value={value}
      onChange={onChange}
      isInvalid={error !== undefined}
      validationBehavior="aria"
      autoComplete="off"
    >
      <Label className="text-sm font-medium text-ink">{label}</Label>
      <Input
        className="w-full rounded-lg border border-control bg-surface px-3 py-2.5 font-mono text-[0.9375rem] text-ink placeholder:font-mono placeholder:text-subtle data-focused:border-accent data-focused:outline-2 data-focused:outline-offset-0 data-focused:outline-accent/30 data-invalid:border-danger data-invalid:data-focused:outline-danger/30"
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
      <FieldError className="flex items-start gap-1.5 text-sm text-danger">
        <WarningIcon />
        {error}
      </FieldError>
      {suggestion && (
        <div className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
          <span>Custom fields usually start with field_.</span>
          <button
            type="button"
            className="rounded font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
            onClick={() => {
              onChange(suggestion);
            }}
          >
            Use <span className="font-mono">{suggestion}</span>
          </button>
        </div>
      )}
      <Text slot="description" className="text-sm text-muted">
        {warning ?? description}
      </Text>
    </TextField>
  );
}

function WarningIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 size-4 shrink-0" fill="none">
      <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 6.5v4.25M10 13.5v.01"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
