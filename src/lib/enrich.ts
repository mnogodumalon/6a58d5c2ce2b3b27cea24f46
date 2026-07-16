import type { EnrichedBedeutungsereignisse, EnrichedBedeutungsknoten, EnrichedBedeutungsverknuepfungen, EnrichedKnotenbeziehungen } from '@/types/enriched';
import type { Akteure, Bedeutungsereignisse, Bedeutungsknoten, Bedeutungsverknuepfungen, ExterneObjekte, Knotenbeziehungen } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface BedeutungsknotenMaps {
  akteureMap: Map<string, Akteure>;
}

export function enrichBedeutungsknoten(
  bedeutungsknoten: Bedeutungsknoten[],
  maps: BedeutungsknotenMaps
): EnrichedBedeutungsknoten[] {
  return bedeutungsknoten.map(r => ({
    ...r,
    erstellerName: resolveDisplay(r.fields.ersteller, maps.akteureMap, 'vorname', 'nachname'),
  }));
}

interface KnotenbeziehungenMaps {
  bedeutungsknotenMap: Map<string, Bedeutungsknoten>;
  akteureMap: Map<string, Akteure>;
}

export function enrichKnotenbeziehungen(
  knotenbeziehungen: Knotenbeziehungen[],
  maps: KnotenbeziehungenMaps
): EnrichedKnotenbeziehungen[] {
  return knotenbeziehungen.map(r => ({
    ...r,
    quellknotenName: resolveDisplay(r.fields.quellknoten, maps.bedeutungsknotenMap, 'titel'),
    zielknotenName: resolveDisplay(r.fields.zielknoten, maps.bedeutungsknotenMap, 'titel'),
    beziehung_erstellerName: resolveDisplay(r.fields.beziehung_ersteller, maps.akteureMap, 'vorname', 'nachname'),
  }));
}

interface BedeutungsverknuepfungenMaps {
  bedeutungsknotenMap: Map<string, Bedeutungsknoten>;
  externeObjekteMap: Map<string, ExterneObjekte>;
}

export function enrichBedeutungsverknuepfungen(
  bedeutungsverknuepfungen: Bedeutungsverknuepfungen[],
  maps: BedeutungsverknuepfungenMaps
): EnrichedBedeutungsverknuepfungen[] {
  return bedeutungsverknuepfungen.map(r => ({
    ...r,
    verknuepfung_knotenName: resolveDisplay(r.fields.verknuepfung_knoten, maps.bedeutungsknotenMap, 'titel'),
    verknuepfung_externName: resolveDisplay(r.fields.verknuepfung_extern, maps.externeObjekteMap, 'systemname'),
  }));
}

interface BedeutungsereignisseMaps {
  bedeutungsknotenMap: Map<string, Bedeutungsknoten>;
  akteureMap: Map<string, Akteure>;
}

export function enrichBedeutungsereignisse(
  bedeutungsereignisse: Bedeutungsereignisse[],
  maps: BedeutungsereignisseMaps
): EnrichedBedeutungsereignisse[] {
  return bedeutungsereignisse.map(r => ({
    ...r,
    ereignis_knotenName: resolveDisplay(r.fields.ereignis_knoten, maps.bedeutungsknotenMap, 'titel'),
    ereignis_akteurName: resolveDisplay(r.fields.ereignis_akteur, maps.akteureMap, 'vorname', 'nachname'),
  }));
}
