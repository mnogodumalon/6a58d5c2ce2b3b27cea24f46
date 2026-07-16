import type { FormEnhancements } from './types';

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, { lookupKey: string }[]> = {};

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    'titel',
    'knotentyp',
    'status',
    'beschreibung',
    'ersteller',
    'erstellt_am',
    'aktualisiert_am',
  ],
  defaults: {
    'status': { kind: 'lookup', key: 'draft', label: 'Entwurf' },
    'erstellt_am': { kind: 'today', withTime: true },
    'aktualisiert_am': { kind: 'today', withTime: true },
  },
  computed: {},
};
