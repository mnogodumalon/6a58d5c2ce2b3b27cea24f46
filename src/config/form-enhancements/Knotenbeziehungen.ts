import type { FormEnhancements } from './types';

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, { lookupKey: string }[]> = {};

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    'quellknoten',
    'zielknoten',
    'beziehungstyp',
    'konfidenz',
    'beziehung_ersteller',
    'beziehung_erstellt_am',
  ],
  defaults: {
    'beziehung_erstellt_am': { kind: 'today', withTime: true },
  },
  computed: {},
  numberFields: {
    'konfidenz': { max: 100 },
  },
};
