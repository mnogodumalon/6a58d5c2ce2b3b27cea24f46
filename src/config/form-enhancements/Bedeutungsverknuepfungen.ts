import type { FormEnhancements } from './types';

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, { lookupKey: string }[]> = {};

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    'verknuepfung_knoten',
    'verknuepfung_extern',
    'verknuepfungstyp',
  ],
  defaults: {},
  computed: {},
};
