import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Akteure, Bedeutungsknoten, Knotenbeziehungen, ExterneObjekte, Bedeutungsverknuepfungen, Bedeutungsereignisse } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

/** Dashboard data + the OPTIMISTIC-WRITE API.
 *
 *  The per-entity setters (`set<Entity>`) are exported for exactly one job:
 *  optimistic updates on drag writes (onEventDrop / onEventResize /
 *  onCardMove). Call the setter FIRST — the bar/card lands instantly — then
 *  fire the PATCH in the background and call `fetchAll()` ONLY in the catch.
 *  Never await the PATCH before updating state (the UI freezes for the full
 *  round-trip on every drag) and never refetch after a successful write.
 *  There is no other mechanism (no `__optimistic`, no `mutate`).
 */
export function useDashboardData() {
  const [akteure, setAkteure] = useState<Akteure[]>([]);
  const [bedeutungsknoten, setBedeutungsknoten] = useState<Bedeutungsknoten[]>([]);
  const [knotenbeziehungen, setKnotenbeziehungen] = useState<Knotenbeziehungen[]>([]);
  const [externeObjekte, setExterneObjekte] = useState<ExterneObjekte[]>([]);
  const [bedeutungsverknuepfungen, setBedeutungsverknuepfungen] = useState<Bedeutungsverknuepfungen[]>([]);
  const [bedeutungsereignisse, setBedeutungsereignisse] = useState<Bedeutungsereignisse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [akteureData, bedeutungsknotenData, knotenbeziehungenData, externeObjekteData, bedeutungsverknuepfungenData, bedeutungsereignisseData] = await Promise.all([
        LivingAppsService.getAkteure(),
        LivingAppsService.getBedeutungsknoten(),
        LivingAppsService.getKnotenbeziehungen(),
        LivingAppsService.getExterneObjekte(),
        LivingAppsService.getBedeutungsverknuepfungen(),
        LivingAppsService.getBedeutungsereignisse(),
      ]);
      setAkteure(akteureData);
      setBedeutungsknoten(bedeutungsknotenData);
      setKnotenbeziehungen(knotenbeziehungenData);
      setExterneObjekte(externeObjekteData);
      setBedeutungsverknuepfungen(bedeutungsverknuepfungenData);
      setBedeutungsereignisse(bedeutungsereignisseData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [akteureData, bedeutungsknotenData, knotenbeziehungenData, externeObjekteData, bedeutungsverknuepfungenData, bedeutungsereignisseData] = await Promise.all([
          LivingAppsService.getAkteure(),
          LivingAppsService.getBedeutungsknoten(),
          LivingAppsService.getKnotenbeziehungen(),
          LivingAppsService.getExterneObjekte(),
          LivingAppsService.getBedeutungsverknuepfungen(),
          LivingAppsService.getBedeutungsereignisse(),
        ]);
        setAkteure(akteureData);
        setBedeutungsknoten(bedeutungsknotenData);
        setKnotenbeziehungen(knotenbeziehungenData);
        setExterneObjekte(externeObjekteData);
        setBedeutungsverknuepfungen(bedeutungsverknuepfungenData);
        setBedeutungsereignisse(bedeutungsereignisseData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const akteureMap = useMemo(() => {
    const m = new Map<string, Akteure>();
    akteure.forEach(r => m.set(r.record_id, r));
    return m;
  }, [akteure]);

  const bedeutungsknotenMap = useMemo(() => {
    const m = new Map<string, Bedeutungsknoten>();
    bedeutungsknoten.forEach(r => m.set(r.record_id, r));
    return m;
  }, [bedeutungsknoten]);

  const externeObjekteMap = useMemo(() => {
    const m = new Map<string, ExterneObjekte>();
    externeObjekte.forEach(r => m.set(r.record_id, r));
    return m;
  }, [externeObjekte]);

  return { akteure, setAkteure, bedeutungsknoten, setBedeutungsknoten, knotenbeziehungen, setKnotenbeziehungen, externeObjekte, setExterneObjekte, bedeutungsverknuepfungen, setBedeutungsverknuepfungen, bedeutungsereignisse, setBedeutungsereignisse, loading, error, fetchAll, akteureMap, bedeutungsknotenMap, externeObjekteMap };
}