/**
 * Progressive enhancement for the browse page. Without JavaScript every entry
 * is listed and the filter form stays hidden; with it, the form filters the
 * static list in place and mirrors the selection in the URL.
 */
import {
  describeResults,
  matchesFilters,
  parseBrowseFilters,
  serializeBrowseFilters,
  type BrowseFilters,
} from '@/lib/browse-filters';

export function initBrowseFilters(): void {
  const form = document.querySelector<HTMLFormElement>('[data-browse-filters]');
  if (!form) return;
  const groupSelect = form.querySelector<HTMLSelectElement>('select[name="group"]');
  const moduleSelect = form.querySelector<HTMLSelectElement>('select[name="module"]');
  const status = document.querySelector<HTMLElement>('[data-browse-status]');
  const empty = document.querySelector<HTMLElement>('[data-browse-empty]');
  const sections = [...document.querySelectorAll<HTMLElement>('[data-browse-group]')];
  const items = [...document.querySelectorAll<HTMLElement>('[data-browse-item]')];
  if (!groupSelect || !moduleSelect) return;

  const optionValues = (select: HTMLSelectElement) =>
    new Set([...select.options].map((o) => o.value).filter(Boolean));
  const known = { groups: optionValues(groupSelect), modules: optionValues(moduleSelect) };

  function apply(filters: BrowseFilters, { updateUrl }: { updateUrl: boolean }): void {
    let shown = 0;
    for (const item of items) {
      const match = matchesFilters(
        {
          group: item.dataset.group ?? '',
          modules: (item.dataset.modules ?? '').split(' ').filter(Boolean),
        },
        filters,
      );
      item.hidden = !match;
      if (match) shown++;
    }
    for (const section of sections) {
      section.hidden = !section.querySelector('[data-browse-item]:not([hidden])');
    }
    if (empty) empty.hidden = shown > 0;
    if (status) status.textContent = describeResults(shown, items.length);
    if (updateUrl) {
      const query = serializeBrowseFilters(filters);
      window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${query ? `?${query}` : ''}`,
      );
    }
  }

  const initial = parseBrowseFilters(window.location.search, known);
  groupSelect.value = initial.group;
  moduleSelect.value = initial.module;
  apply(initial, { updateUrl: false });

  form.addEventListener('change', () => {
    apply({ group: groupSelect.value, module: moduleSelect.value }, { updateUrl: true });
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
  });
  form.addEventListener('reset', () => {
    // Runs before the form resets its controls.
    window.setTimeout(() => {
      apply({ group: '', module: '' }, { updateUrl: true });
    });
  });
  form.hidden = false;
}
