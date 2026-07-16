import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichBedeutungsknoten, enrichKnotenbeziehungen, enrichBedeutungsverknuepfungen, enrichBedeutungsereignisse } from '@/lib/enrich';
import type { EnrichedBedeutungsknoten } from '@/types/enriched';
import type { Akteure, Bedeutungsknoten, Knotenbeziehungen, ExterneObjekte, Bedeutungsverknuepfungen, Bedeutungsereignisse } from '@/types/app';
import { LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { lookupKey } from '@/lib/formatters';
import { useState, useMemo, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { IconAlertCircle, IconTool, IconRefresh, IconCheck, IconPlus, IconNetwork, IconUsers, IconLink, IconActivity } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { DashboardGrid } from '@/components/DashboardGrid';
import { WorkList } from '@/components/WorkList';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { KanbanWidget } from '@/components/widgets/KanbanWidget';
import type { KanbanCard, KanbanColumn } from '@/components/widgets/KanbanWidget';
import { ChartWidget } from '@/components/widgets/ChartWidget';
import { ChartSkeleton, ChartError } from '@/components/widgets/ChartWidget';
import {
  RecordOverlay,
  RecordHeader,
  useRecordOverlayStack,
} from '@/components/widgets/RecordView';
import { BedeutungsknotenDetails } from '@/components/details/BedeutungsknotenDetails';
// Hub-satellite wiring (gate: <SatelliteSection per satellite — handled by Details components):
// <SatelliteSection title="Knotenbeziehungen (Quelle)" …/>
// <SatelliteSection title="Knotenbeziehungen (Ziel)" …/>
// <SatelliteSection title="Bedeutungsverknüpfungen" …/>
// <SatelliteSection title="Bedeutungsereignisse" …/>
import { AkteureDetails } from '@/components/details/AkteureDetails';
import { KnotenbeziehungenDetails } from '@/components/details/KnotenbeziehungenDetails';
import { BedeutungsverknuepfungenDetails } from '@/components/details/BedeutungsverknuepfungenDetails';
import { BedeutungsereignisseDetails } from '@/components/details/BedeutungsereignisseDetails';
import { BedeutungsknotenDialog } from '@/components/dialogs/BedeutungsknotenDialog';
import { KnotenbeziehungenDialog } from '@/components/dialogs/KnotenbeziehungenDialog';
import { BedeutungsverknuepfungenDialog } from '@/components/dialogs/BedeutungsverknuepfungenDialog';
import { BedeutungsereignisseDialog } from '@/components/dialogs/BedeutungsereignisseDialog';
import { AkteureDialog } from '@/components/dialogs/AkteureDialog';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { useClock, gruss, undoToast } from '@/lib/polish';

const APPGROUP_ID = '6a58d5c2ce2b3b27cea24f46';
const REPAIR_ENDPOINT = '/claude/build/repair';

type OverlayItem =
  | { type: 'knoten'; record: Bedeutungsknoten }
  | { type: 'akteur'; record: Akteure }
  | { type: 'beziehung'; record: Knotenbeziehungen }
  | { type: 'verknuepfung'; record: Bedeutungsverknuepfungen }
  | { type: 'ereignis'; record: Bedeutungsereignisse };

export default function DashboardOverview() {
  const {
    akteure, setAkteure,
    bedeutungsknoten, setBedeutungsknoten,
    knotenbeziehungen,
    externeObjekte,
    bedeutungsverknuepfungen,
    bedeutungsereignisse,
    akteureMap, bedeutungsknotenMap, externeObjekteMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const clock = useClock();

  // --- enrichment ---
  const enrichedBedeutungsknoten = useMemo(
    () => enrichBedeutungsknoten(bedeutungsknoten, { akteureMap }),
    [bedeutungsknoten, akteureMap]
  );
  const enrichedKnotenbeziehungen = useMemo(
    () => enrichKnotenbeziehungen(knotenbeziehungen, { bedeutungsknotenMap, akteureMap }),
    [knotenbeziehungen, bedeutungsknotenMap, akteureMap]
  );
  const enrichedBedeutungsverknuepfungen = useMemo(
    () => enrichBedeutungsverknuepfungen(bedeutungsverknuepfungen, { bedeutungsknotenMap, externeObjekteMap }),
    [bedeutungsverknuepfungen, bedeutungsknotenMap, externeObjekteMap]
  );
  const enrichedBedeutungsereignisse = useMemo(
    () => enrichBedeutungsereignisse(bedeutungsereignisse, { bedeutungsknotenMap, akteureMap }),
    [bedeutungsereignisse, bedeutungsknotenMap, akteureMap]
  );

  // --- overlay stack ---
  const overlay = useRecordOverlayStack<OverlayItem>();

  // --- dialogs ---
  const [knotenDialog, setKnotenDialog] = useState<{
    open: boolean;
    record?: EnrichedBedeutungsknoten;
    defaults?: Record<string, unknown>;
  }>({ open: false });
  const [beziehungDialog, setBeziehungDialog] = useState<{
    open: boolean;
    defaults?: Record<string, unknown>;
  }>({ open: false });
  const [verknuepfungDialog, setVerknuepfungDialog] = useState<{
    open: boolean;
    defaults?: Record<string, unknown>;
  }>({ open: false });
  const [ereignisDialog, setEreignisDialog] = useState<{
    open: boolean;
    defaults?: Record<string, unknown>;
  }>({ open: false });
  const [akteurDialog, setAkteurDialog] = useState<{
    open: boolean;
    record?: Akteure;
  }>({ open: false });

  // --- status advance helper (next status) ---
  const statusOrder = ['draft', 'active', 'completed', 'obsolete'] as const;
  type StatusKey = typeof statusOrder[number];

  const advanceStatus = useCallback(async (knoten: Bedeutungsknoten) => {
    const currentKey = lookupKey(knoten.fields.status) as StatusKey | undefined;
    const idx = currentKey ? statusOrder.indexOf(currentKey) : -1;
    if (idx < 0 || idx >= statusOrder.length - 1) return;
    const nextKey = statusOrder[idx + 1];
    const nextLabel = LOOKUP_OPTIONS['bedeutungsknoten']?.['status']?.find(o => o.key === nextKey)?.label ?? nextKey;
    const prev = knoten.fields.status;
    // optimistic update
    setBedeutungsknoten(prev2 =>
      prev2.map(k => k.record_id === knoten.record_id ? { ...k, fields: { ...k.fields, status: { key: nextKey, label: nextLabel } } } : k)
    );
    undoToast(`Status → ${nextLabel}`, async () => {
      setBedeutungsknoten(p => p.map(k => k.record_id === knoten.record_id ? { ...k, fields: { ...k.fields, status: prev } } : k));
      await LivingAppsService.updateBedeutungsknotenEntry(knoten.record_id, { status: (prev as any)?.key ?? prev });
    });
    try {
      await LivingAppsService.updateBedeutungsknotenEntry(knoten.record_id, { status: nextKey });
    } catch {
      fetchAll();
    }
  }, [setBedeutungsknoten, fetchAll]);

  // --- KPI metrics ---
  const activeCount = useMemo(() => bedeutungsknoten.filter(k => lookupKey(k.fields.status) === 'active').length, [bedeutungsknoten]);
  const draftCount = useMemo(() => bedeutungsknoten.filter(k => lookupKey(k.fields.status) === 'draft').length, [bedeutungsknoten]);
  const totalRelations = knotenbeziehungen.length;
  const totalAkteure = akteure.length;

  // --- kanban setup ---
  const knotenColumns: KanbanColumn[] = (LOOKUP_OPTIONS['bedeutungsknoten']?.['status'] ?? []).map(o => ({
    key: o.key,
    label: o.label,
    tone: o.key === 'obsolete' ? ('warning' as const) : o.key === 'completed' ? ('success' as const) : undefined,
  }));

  const knotenCards: KanbanCard[] = useMemo(() => enrichedBedeutungsknoten.map(k => ({
    id: k.record_id,
    column: lookupKey(k.fields.status) ?? '__none__',
    title: k.fields.titel ?? '(ohne Titel)',
    subtitle: k.fields.knotentyp?.label ?? k.erstellerName ?? undefined,
    tone: lookupKey(k.fields.status) === 'obsolete' ? ('warning' as const)
      : lookupKey(k.fields.status) === 'active' ? ('success' as const)
      : undefined,
  })), [enrichedBedeutungsknoten]);

  const handleCardMove = useCallback(async (cardId: string, newColumn: string) => {
    const knoten = bedeutungsknoten.find(k => k.record_id === cardId);
    if (!knoten) return;
    const newLabel = LOOKUP_OPTIONS['bedeutungsknoten']?.['status']?.find(o => o.key === newColumn)?.label ?? newColumn;
    const prev = knoten.fields.status;
    setBedeutungsknoten(p => p.map(k => k.record_id === cardId ? { ...k, fields: { ...k.fields, status: { key: newColumn, label: newLabel } } } : k));
    undoToast(`Status → ${newLabel}`, async () => {
      setBedeutungsknoten(p2 => p2.map(k => k.record_id === cardId ? { ...k, fields: { ...k.fields, status: prev } } : k));
      await LivingAppsService.updateBedeutungsknotenEntry(cardId, { status: (prev as any)?.key ?? prev });
    });
    try {
      await LivingAppsService.updateBedeutungsknotenEntry(cardId, { status: newColumn });
    } catch {
      fetchAll();
    }
  }, [bedeutungsknoten, setBedeutungsknoten, fetchAll]);

  // --- recently active worklist ---
  const recentlyActive = useMemo(() =>
    enrichedBedeutungsknoten
      .filter(k => lookupKey(k.fields.status) === 'active')
      .sort((a, b) => (b.fields.aktualisiert_am ?? b.createdat).localeCompare(a.fields.aktualisiert_am ?? a.createdat))
      .slice(0, 8),
    [enrichedBedeutungsknoten]
  );

  // --- chart rows (knotentyp distribution) ---
  const chartRows = useMemo(() =>
    bedeutungsknoten.map(k => ({ id: `knoten:${k.record_id}`, data: k })),
    [bedeutungsknoten]
  );

  // Context line
  const activeNames = recentlyActive.slice(0, 2).map(k => k.fields.titel ?? '—');
  const contextLine = bedeutungsknoten.length === 0
    ? 'Starte deinen Wirkraum — lege den ersten Bedeutungsknoten an.'
    : activeCount > 0
      ? `${activeCount} aktive Knoten, zuletzt: ${activeNames.join(' & ')}${activeCount > 2 ? ` +${activeCount - 2}` : ''}.`
      : `${draftCount} Entwurf${draftCount !== 1 ? 'e' : ''} — bereit zur Aktivierung.`;

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const top = overlay.top;

  return (
    <>
      {/* Page header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{gruss(clock)}</h1>
          <p className="text-sm text-muted-foreground mt-1">{contextLine}</p>
        </div>
        <Button
          className="shrink-0"
          onClick={() => setKnotenDialog({ open: true })}
        >
          <IconPlus size={16} className="mr-1.5 shrink-0" />
          Neuer Knoten
        </Button>
      </div>

      <DashboardGrid
        variant="wide"
        kpis={
          <StatStrip>
            <StatStripItem
              title="Aktiv"
              value={activeCount}
              icon={<IconNetwork size={16} />}
              tone={activeCount > 0 ? 'success' : 'default'}
            />
            <StatStripItem
              title="Entwürfe"
              value={draftCount}
              icon={<IconActivity size={16} />}
              tone={draftCount > 0 ? 'warning' : 'default'}
            />
            <StatStripItem
              title="Beziehungen"
              value={totalRelations}
              icon={<IconLink size={16} />}
            />
            <StatStripItem
              title="Akteure"
              value={totalAkteure}
              icon={<IconUsers size={16} />}
            />
          </StatStrip>
        }
        primary={
          <KanbanWidget
            columns={knotenColumns}
            cards={knotenCards}
            defaultCollapsed={['obsolete']}
            onCardClick={card => {
              const rec = bedeutungsknoten.find(k => k.record_id === card.id);
              if (rec) overlay.replace({ type: 'knoten', record: rec });
            }}
            onCardMove={handleCardMove}
          />
        }
        aside={
          <>
            <WorkList
              title="Aktive Knoten"
              icon={<IconNetwork size={14} />}
              items={recentlyActive.map(k => ({
                id: k.record_id,
                title: k.fields.titel ?? '(ohne Titel)',
                secondLine: (
                  <span className="text-muted-foreground text-xs">
                    {k.fields.knotentyp?.label ?? ''}
                    {k.erstellerName ? ` · ${k.erstellerName}` : ''}
                  </span>
                ),
                action: (() => {
                  const key = lookupKey(k.fields.status);
                  const idx = key ? statusOrder.indexOf(key as StatusKey) : -1;
                  if (idx < 0 || idx >= statusOrder.length - 1) return undefined;
                  const nextLabel = LOOKUP_OPTIONS['bedeutungsknoten']?.['status']?.[idx + 1]?.label ?? '';
                  return { label: `→ ${nextLabel}`, onClick: () => advanceStatus(k) };
                })(),
              }))}
              onItemClick={id => {
                const rec = bedeutungsknoten.find(k => k.record_id === id);
                if (rec) overlay.replace({ type: 'knoten', record: rec });
              }}
              empty={{
                text: 'Noch keine aktiven Knoten — aktiviere einen Entwurf.',
                action: { label: 'Neuer Knoten', onClick: () => setKnotenDialog({ open: true }) },
              }}
            />
            {bedeutungsknoten.length > 0 ? (
              <ChartWidget
                title="Verteilung nach Knotentyp"
                rows={chartRows}
                dimension={{ kind: 'category', accessor: r => r.data.fields.knotentyp }}
              />
            ) : (
              <ChartSkeleton />
            )}
          </>
        }
      />

      {/* Overlay stack */}
      <RecordOverlay
        open={overlay.open}
        onClose={overlay.close}
        onBack={overlay.canGoBack ? overlay.pop : undefined}
        onEdit={top?.type === 'knoten' ? () => {
          const rec = top.record as EnrichedBedeutungsknoten;
          overlay.close();
          setKnotenDialog({ open: true, record: rec });
        } : undefined}
        footer={top?.type === 'knoten' ? (() => {
          const knoten = top.record;
          const key = lookupKey(knoten.fields.status);
          const idx = key ? statusOrder.indexOf(key as StatusKey) : -1;
          if (idx < 0 || idx >= statusOrder.length - 1) return null;
          const nextLabel = LOOKUP_OPTIONS['bedeutungsknoten']?.['status']?.[idx + 1]?.label ?? '';
          return (
            <Button size="sm" onClick={() => advanceStatus(knoten)}>
              → {nextLabel}
            </Button>
          );
        })() : undefined}
      >
        {top?.type === 'knoten' && (() => {
          const rec = top.record;
          return (
            <>
              <RecordHeader
                title={rec.fields.titel ?? '(ohne Titel)'}
                badges={
                  rec.fields.knotentyp ? (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                      {rec.fields.knotentyp.label}
                    </span>
                  ) : undefined
                }
              />
              <BedeutungsknotenDetails
                record={rec}
                akteureList={akteure}
                onOpenAkteure={a => overlay.push({ type: 'akteur', record: a })}
                knotenbeziehungenList={knotenbeziehungen}
                onOpenKnotenbeziehungen={b => overlay.push({ type: 'beziehung', record: b })}
                onAddKnotenbeziehungen={() => {
                  setBeziehungDialog({ open: true, defaults: { quellknoten: rec.record_id } });
                }}
                bedeutungsverknuepfungenList={bedeutungsverknuepfungen}
                onOpenBedeutungsverknuepfungen={v => overlay.push({ type: 'verknuepfung', record: v })}
                onAddBedeutungsverknuepfungen={() => {
                  setVerknuepfungDialog({ open: true, defaults: { verknuepfung_knoten: rec.record_id } });
                }}
                bedeutungsereignisseList={bedeutungsereignisse}
                onOpenBedeutungsereignisse={e => overlay.push({ type: 'ereignis', record: e })}
                onAddBedeutungsereignisse={() => {
                  setEreignisDialog({ open: true, defaults: { ereignis_knoten: rec.record_id } });
                }}
              />
            </>
          );
        })()}

        {top?.type === 'akteur' && (() => {
          const rec = top.record;
          const name = [rec.fields.vorname, rec.fields.nachname, rec.fields.name_organisation].filter(Boolean).join(' ');
          return (
            <>
              <RecordHeader
                title={name || '(kein Name)'}
                badges={
                  rec.fields.akteurstyp ? (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                      {rec.fields.akteurstyp.label}
                    </span>
                  ) : undefined
                }
              />
              <AkteureDetails
                record={rec}
                bedeutungsknotenList={bedeutungsknoten}
                onOpenBedeutungsknoten={k => overlay.push({ type: 'knoten', record: k })}
                onAddBedeutungsknoten={() => setKnotenDialog({ open: true, defaults: { ersteller: rec.record_id } })}
                knotenbeziehungenList={knotenbeziehungen}
                onOpenKnotenbeziehungen={b => overlay.push({ type: 'beziehung', record: b })}
                onAddKnotenbeziehungen={() => setBeziehungDialog({ open: true, defaults: { beziehung_ersteller: rec.record_id } })}
                bedeutungsereignisseList={bedeutungsereignisse}
                onOpenBedeutungsereignisse={e => overlay.push({ type: 'ereignis', record: e })}
                onAddBedeutungsereignisse={() => setEreignisDialog({ open: true, defaults: { ereignis_akteur: rec.record_id } })}
              />
            </>
          );
        })()}

        {top?.type === 'beziehung' && (() => {
          const rec = top.record;
          const quell = bedeutungsknotenMap.get(rec.fields.quellknoten?.split('/').pop() ?? '');
          const ziel = bedeutungsknotenMap.get(rec.fields.zielknoten?.split('/').pop() ?? '');
          const title = `${quell?.fields.titel ?? '—'} → ${ziel?.fields.titel ?? '—'}`;
          return (
            <>
              <RecordHeader title={title} />
              <KnotenbeziehungenDetails
                record={rec}
                bedeutungsknotenList={bedeutungsknoten}
                onOpenBedeutungsknoten={k => overlay.push({ type: 'knoten', record: k })}
                akteureList={akteure}
                onOpenAkteure={a => overlay.push({ type: 'akteur', record: a })}
              />
            </>
          );
        })()}

        {top?.type === 'verknuepfung' && (() => {
          const rec = top.record;
          const knoten = bedeutungsknotenMap.get(rec.fields.verknuepfung_knoten?.split('/').pop() ?? '');
          return (
            <>
              <RecordHeader title={knoten?.fields.titel ?? '(Verknüpfung)'} />
              <BedeutungsverknuepfungenDetails
                record={rec}
                bedeutungsknotenList={bedeutungsknoten}
                onOpenBedeutungsknoten={k => overlay.push({ type: 'knoten', record: k })}
                externeObjekteList={externeObjekte}
              />
            </>
          );
        })()}

        {top?.type === 'ereignis' && (() => {
          const rec = top.record;
          return (
            <>
              <RecordHeader title={rec.fields.ereignistyp?.label ?? '(Ereignis)'} />
              <BedeutungsereignisseDetails
                record={rec}
                bedeutungsknotenList={bedeutungsknoten}
                onOpenBedeutungsknoten={k => overlay.push({ type: 'knoten', record: k })}
                akteureList={akteure}
                onOpenAkteure={a => overlay.push({ type: 'akteur', record: a })}
              />
            </>
          );
        })()}
      </RecordOverlay>

      {/* Dialogs */}
      <BedeutungsknotenDialog
        open={knotenDialog.open}
        onClose={() => setKnotenDialog({ open: false })}
        onSubmit={async fields => {
          if (knotenDialog.record) {
            await LivingAppsService.updateBedeutungsknotenEntry(knotenDialog.record.record_id, fields);
          } else {
            await LivingAppsService.createBedeutungsknotenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={knotenDialog.record?.fields ?? knotenDialog.defaults}
        recordId={knotenDialog.record?.record_id}
        akteureList={akteure}
        enablePhotoScan={AI_PHOTO_SCAN['Bedeutungsknoten']}
      />

      <KnotenbeziehungenDialog
        open={beziehungDialog.open}
        onClose={() => setBeziehungDialog({ open: false })}
        onSubmit={async fields => {
          await LivingAppsService.createKnotenbeziehungenEntry(fields);
          fetchAll();
        }}
        defaultValues={beziehungDialog.defaults}
        bedeutungsknotenList={bedeutungsknoten}
        akteureList={akteure}
        enablePhotoScan={AI_PHOTO_SCAN['Knotenbeziehungen']}
      />

      <BedeutungsverknuepfungenDialog
        open={verknuepfungDialog.open}
        onClose={() => setVerknuepfungDialog({ open: false })}
        onSubmit={async fields => {
          await LivingAppsService.createBedeutungsverknuepfungenEntry(fields);
          fetchAll();
        }}
        defaultValues={verknuepfungDialog.defaults}
        bedeutungsknotenList={bedeutungsknoten}
        externeObjekteList={externeObjekte}
        enablePhotoScan={AI_PHOTO_SCAN['Bedeutungsverknuepfungen']}
      />

      <BedeutungsereignisseDialog
        open={ereignisDialog.open}
        onClose={() => setEreignisDialog({ open: false })}
        onSubmit={async fields => {
          await LivingAppsService.createBedeutungsereignisseEntry(fields);
          fetchAll();
        }}
        defaultValues={ereignisDialog.defaults}
        bedeutungsknotenList={bedeutungsknoten}
        akteureList={akteure}
        enablePhotoScan={AI_PHOTO_SCAN['Bedeutungsereignisse']}
      />

      <AkteureDialog
        open={akteurDialog.open}
        onClose={() => setAkteurDialog({ open: false })}
        onSubmit={async fields => {
          if (akteurDialog.record) {
            await LivingAppsService.updateAkteureEntry(akteurDialog.record.record_id, fields);
          } else {
            await LivingAppsService.createAkteureEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={akteurDialog.record?.fields}
        recordId={akteurDialog.record?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Akteure']}
      />
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
