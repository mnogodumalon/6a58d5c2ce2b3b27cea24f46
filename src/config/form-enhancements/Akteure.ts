import type { FormEnhancements } from './types';

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, { lookupKey: string }[]> = {};

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    'akteurstyp',
    { row: ['vorname', 'nachname'], cols: '1fr 1fr' },
    'name_organisation',
    'externer_verweis',
  ],
  defaults: {
    'akteurstyp': { kind: 'lookup', key: 'human', label: 'Mensch' },
  },
  computed: {},
};
