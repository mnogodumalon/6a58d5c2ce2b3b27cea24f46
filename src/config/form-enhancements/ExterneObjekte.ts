import type { FormEnhancements } from './types';

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, { lookupKey: string }[]> = {};

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    'systemname',
    'extern_titel',
    'objekttyp',
    'objekt_id',
    'extern_url',
  ],
  defaults: {},
  computed: {},
};
