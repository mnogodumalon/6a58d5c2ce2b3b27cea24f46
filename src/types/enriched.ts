import type { Bedeutungsereignisse, Bedeutungsknoten, Bedeutungsverknuepfungen, Knotenbeziehungen } from './app';

export type EnrichedBedeutungsknoten = Bedeutungsknoten & {
  erstellerName: string;
};

export type EnrichedKnotenbeziehungen = Knotenbeziehungen & {
  quellknotenName: string;
  zielknotenName: string;
  beziehung_erstellerName: string;
};

export type EnrichedBedeutungsverknuepfungen = Bedeutungsverknuepfungen & {
  verknuepfung_knotenName: string;
  verknuepfung_externName: string;
};

export type EnrichedBedeutungsereignisse = Bedeutungsereignisse & {
  ereignis_knotenName: string;
  ereignis_akteurName: string;
};
