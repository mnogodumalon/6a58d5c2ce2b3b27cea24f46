import type { FormEnhancements } from './types';

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, { lookupKey: string }[]> = {};

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    'ereignistyp',
    'ereignis_knoten',
    'ereignis_akteur',
    'zeitstempel',
    'payload',
  ],
  defaults: {
    'zeitstempel': { kind: 'today', withTime: true },
  },
  computed: {},
};
