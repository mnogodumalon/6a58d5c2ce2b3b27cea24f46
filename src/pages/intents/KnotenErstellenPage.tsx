import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IntentWizardShell } from '@/components/IntentWizardShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDashboardData } from '@/hooks/useDashboardData';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import type { Akteure, ExterneObjekte, Bedeutungsknoten } from '@/types/app';
import {
  IconPlus,
  IconTrash,
  IconCheck,
  IconChevronRight,
  IconArrowRight,
  IconUser,
  IconNetwork,
  IconLink,
  IconCalendarEvent,
  IconRefresh,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

// --- Types ---

interface PendingRelationship {
  zielknotenId: string;
  zielknotenTitel: string;
  beziehungstyp: string;
  konfidenz: number;
}

interface PendingExternLink {
  externId: string;
  systemname: string;
  externTitel: string;
  verknuepfungstyp: string;
}

// --- Helpers ---

function getNowDatetimeMinute(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function getAkteursLabel(a: Akteure): string {
  const parts = [a.fields.vorname, a.fields.nachname].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return a.fields.name_organisation ?? a.record_id;
}

// --- Sub-components ---

function TileSelect({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={cn(
            'px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
            value === opt.key
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-foreground border-border hover:border-primary/50 hover:bg-secondary'
          )}
        >
          {opt.key === value && <IconCheck size={12} className="inline mr-1" stroke={2.5} />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function LiveCard({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="rounded-2xl border bg-secondary/40 overflow-hidden">
      <div className="px-4 py-3 border-b bg-secondary/60">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</span>
      </div>
      <div className="p-4 space-y-2">{children}</div>
    </div>
  );
}

function LiveCardRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <span className="text-xs text-muted-foreground shrink-0 w-28">{label}</span>
      <span className="text-sm font-medium truncate min-w-0">{value || '—'}</span>
    </div>
  );
}

// =====================
// STEP 2: Beziehungen anlegen
// =====================

interface Step2Props {
  neuerKnotenId: string;
  erstellerId: string;
  alleBedeutungsknoten: Bedeutungsknoten[];
  onDone: (count: number) => void;
  onSkip: () => void;
}

function Step2Beziehungen({ neuerKnotenId, erstellerId, alleBedeutungsknoten, onDone, onSkip }: Step2Props) {
  const [search, setSearch] = useState('');
  const [selectedZielId, setSelectedZielId] = useState('');
  const [beziehungstyp, setBeziehungstyp] = useState('');
  const [konfidenz, setKonfidenz] = useState(0.8);
  const [pending, setPending] = useState<PendingRelationship[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const beziehungstypOptions = LOOKUP_OPTIONS['knotenbeziehungen']['beziehungstyp'] ?? [];

  const otherKnoten = useMemo(
    () => alleBedeutungsknoten.filter((k) => k.record_id !== neuerKnotenId),
    [alleBedeutungsknoten, neuerKnotenId]
  );

  const filteredKnoten = useMemo(() => {
    const q = search.toLowerCase();
    return otherKnoten.filter((k) => (k.fields.titel ?? '').toLowerCase().includes(q));
  }, [otherKnoten, search]);

  const canAdd =
    selectedZielId !== '' &&
    beziehungstyp !== '' &&
    !pending.some((p) => p.zielknotenId === selectedZielId);

  function handleAdd() {
    if (!canAdd) return;
    const ziel = alleBedeutungsknoten.find((k) => k.record_id === selectedZielId);
    setPending((prev) => [
      ...prev,
      {
        zielknotenId: selectedZielId,
        zielknotenTitel: ziel?.fields.titel ?? selectedZielId,
        beziehungstyp,
        konfidenz,
      },
    ]);
    setSelectedZielId('');
    setBeziehungstyp('');
    setKonfidenz(0.8);
    setSearch('');
  }

  function handleRemove(id: string) {
    setPending((prev) => prev.filter((p) => p.zielknotenId !== id));
  }

  async function handleCreateAll() {
    if (pending.length === 0) {
      onDone(0);
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const now = getNowDatetimeMinute();
      await Promise.all(
        pending.map((p) =>
          LivingAppsService.createKnotenbeziehungenEntry({
            quellknoten: createRecordUrl(APP_IDS.BEDEUTUNGSKNOTEN, neuerKnotenId),
            zielknoten: createRecordUrl(APP_IDS.BEDEUTUNGSKNOTEN, p.zielknotenId),
            beziehungstyp: p.beziehungstyp,
            konfidenz: p.konfidenz,
            beziehung_ersteller: createRecordUrl(APP_IDS.AKTEURE, erstellerId),
            beziehung_erstellt_am: now,
          })
        )
      );
      onDone(pending.length);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Fehler beim Anlegen der Beziehungen');
    } finally {
      setSaving(false);
    }
  }

  const btLabel = beziehungstypOptions.find((o) => o.key === beziehungstyp)?.label ?? '';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Zielknoten wählen */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Zielknoten auswählen</p>
          <Input
            placeholder="Knoten suchen …"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-52 overflow-y-auto rounded-lg border divide-y">
            {filteredKnoten.length === 0 && (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                Keine weiteren Knoten vorhanden
              </div>
            )}
            {filteredKnoten.map((k) => {
              const alreadyAdded = pending.some((p) => p.zielknotenId === k.record_id);
              return (
                <button
                  key={k.record_id}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => setSelectedZielId(k.record_id)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors',
                    alreadyAdded
                      ? 'opacity-40 cursor-not-allowed'
                      : selectedZielId === k.record_id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-secondary'
                  )}
                >
                  <IconNetwork size={14} className="shrink-0 text-muted-foreground" />
                  <span className="truncate min-w-0 flex-1">{k.fields.titel ?? k.record_id}</span>
                  {k.fields.knotentyp && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {typeof k.fields.knotentyp === 'object' ? k.fields.knotentyp.label : k.fields.knotentyp}
                    </Badge>
                  )}
                  {selectedZielId === k.record_id && (
                    <IconCheck size={14} className="ml-auto shrink-0 text-primary" stroke={2.5} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Beziehungstyp + Konfidenz */}
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Beziehungstyp</p>
            <TileSelect options={beziehungstypOptions} value={beziehungstyp} onChange={setBeziehungstyp} />
          </div>

          <div>
            <p className="text-sm font-medium mb-1">
              Konfidenz: <span className="text-primary font-bold">{konfidenz.toFixed(2)}</span>
            </p>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={konfidenz}
              onChange={(e) => setKonfidenz(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
              <span>0.00 (niedrig)</span>
              <span>1.00 (hoch)</span>
            </div>
          </div>

          <Button
            onClick={handleAdd}
            disabled={!canAdd}
            variant="outline"
            className="w-full"
          >
            <IconPlus size={16} className="mr-2" />
            Beziehung hinzufügen
          </Button>
        </div>
      </div>

      {/* Pending list */}
      {pending.length > 0 && (
        <div className="rounded-2xl border overflow-hidden">
          <div className="px-4 py-3 bg-secondary/60 border-b flex items-center justify-between">
            <span className="text-sm font-medium">
              {pending.length} {pending.length === 1 ? 'Beziehung' : 'Beziehungen'} werden angelegt
            </span>
          </div>
          <div className="divide-y">
            {pending.map((p) => {
              const btTypeLabel = beziehungstypOptions.find((o) => o.key === p.beziehungstyp)?.label ?? p.beziehungstyp;
              return (
                <div key={p.zielknotenId} className="px-4 py-3 flex items-center gap-3 min-w-0">
                  <IconArrowRight size={16} className="shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.zielknotenTitel}</p>
                    <p className="text-xs text-muted-foreground">
                      {btTypeLabel} · Konfidenz {p.konfidenz.toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(p.zielknotenId)}
                    className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center text-muted-foreground text-sm">
          Noch keine Beziehungen hinzugefügt. Wähle einen Zielknoten und einen Beziehungstyp.
        </div>
      )}

      {err && <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{err}</p>}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleCreateAll} disabled={saving} className="flex-1">
          {saving ? (
            <><IconRefresh size={16} className="mr-2 animate-spin" /> Wird gespeichert …</>
          ) : (
            <><IconCheck size={16} className="mr-2" />
              {pending.length > 0
                ? `${pending.length} ${pending.length === 1 ? 'Beziehung' : 'Beziehungen'} anlegen & weiter`
                : 'Weiter ohne Beziehungen'}
            </>
          )}
        </Button>
        <Button variant="ghost" onClick={onSkip} disabled={saving} className="sm:w-auto">
          Überspringen
        </Button>
      </div>
    </div>
  );
}

// =====================
// STEP 3: Externe Objekte verknüpfen
// =====================

interface Step3Props {
  neuerKnotenId: string;
  externeObjekte: ExterneObjekte[];
  onDone: (count: number) => void;
  onSkip: () => void;
}

function Step3ExterneObjekte({ neuerKnotenId, externeObjekte, onDone, onSkip }: Step3Props) {
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState<PendingExternLink[]>([]);
  const [selectedExternId, setSelectedExternId] = useState('');
  const [verknuepfungstyp, setVerknuepfungstyp] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const verknuepfungstypOptions = LOOKUP_OPTIONS['bedeutungsverknuepfungen']['verknuepfungstyp'] ?? [];

  const filteredExtern = useMemo(() => {
    const q = search.toLowerCase();
    return externeObjekte.filter(
      (e) =>
        (e.fields.systemname ?? '').toLowerCase().includes(q) ||
        (e.fields.extern_titel ?? '').toLowerCase().includes(q) ||
        (e.fields.objekttyp ?? '').toLowerCase().includes(q)
    );
  }, [externeObjekte, search]);

  const canAdd =
    selectedExternId !== '' &&
    verknuepfungstyp !== '' &&
    !pending.some((p) => p.externId === selectedExternId);

  function handleAdd() {
    if (!canAdd) return;
    const ext = externeObjekte.find((e) => e.record_id === selectedExternId);
    setPending((prev) => [
      ...prev,
      {
        externId: selectedExternId,
        systemname: ext?.fields.systemname ?? '',
        externTitel: ext?.fields.extern_titel ?? selectedExternId,
        verknuepfungstyp,
      },
    ]);
    setSelectedExternId('');
    setVerknuepfungstyp('');
    setSearch('');
  }

  function handleRemove(id: string) {
    setPending((prev) => prev.filter((p) => p.externId !== id));
  }

  async function handleCreateAll() {
    if (pending.length === 0) {
      onDone(0);
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await Promise.all(
        pending.map((p) =>
          LivingAppsService.createBedeutungsverknuepfungenEntry({
            verknuepfung_knoten: createRecordUrl(APP_IDS.BEDEUTUNGSKNOTEN, neuerKnotenId),
            verknuepfung_extern: createRecordUrl(APP_IDS.EXTERNE_OBJEKTE, p.externId),
            verknuepfungstyp: p.verknuepfungstyp,
          })
        )
      );
      onDone(pending.length);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Fehler beim Verknüpfen der externen Objekte');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Extern-Objekt wählen */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Externes Objekt auswählen</p>
          <Input
            placeholder="Systemname oder Titel suchen …"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-56 overflow-y-auto rounded-lg border divide-y">
            {filteredExtern.length === 0 && (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                Keine externen Objekte gefunden
              </div>
            )}
            {filteredExtern.map((e) => {
              const alreadyAdded = pending.some((p) => p.externId === e.record_id);
              return (
                <button
                  key={e.record_id}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => setSelectedExternId(e.record_id)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors',
                    alreadyAdded
                      ? 'opacity-40 cursor-not-allowed'
                      : selectedExternId === e.record_id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-secondary'
                  )}
                >
                  <IconLink size={14} className="shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{e.fields.extern_titel || e.fields.systemname || e.record_id}</p>
                    {e.fields.systemname && (
                      <p className="text-xs text-muted-foreground truncate">{e.fields.systemname}</p>
                    )}
                  </div>
                  {selectedExternId === e.record_id && (
                    <IconCheck size={14} className="ml-auto shrink-0 text-primary" stroke={2.5} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Verknüpfungstyp */}
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Verknüpfungstyp</p>
            <TileSelect options={verknuepfungstypOptions} value={verknuepfungstyp} onChange={setVerknuepfungstyp} />
          </div>

          <Button
            onClick={handleAdd}
            disabled={!canAdd}
            variant="outline"
            className="w-full"
          >
            <IconPlus size={16} className="mr-2" />
            Verknüpfung hinzufügen
          </Button>
        </div>
      </div>

      {/* Pending list */}
      {pending.length > 0 && (
        <div className="rounded-2xl border overflow-hidden">
          <div className="px-4 py-3 bg-secondary/60 border-b">
            <span className="text-sm font-medium">
              {pending.length} {pending.length === 1 ? 'Verknüpfung wird' : 'Verknüpfungen werden'} angelegt
            </span>
          </div>
          <div className="divide-y">
            {pending.map((p) => {
              const vtLabel = verknuepfungstypOptions.find((o) => o.key === p.verknuepfungstyp)?.label ?? p.verknuepfungstyp;
              return (
                <div key={p.externId} className="px-4 py-3 flex items-center gap-3 min-w-0">
                  <IconLink size={16} className="shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.externTitel || p.systemname}</p>
                    <p className="text-xs text-muted-foreground">{vtLabel} · {p.systemname}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(p.externId)}
                    className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center text-muted-foreground text-sm">
          Noch keine externen Objekte ausgewählt. Wähle ein Objekt und einen Verknüpfungstyp.
        </div>
      )}

      {err && <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{err}</p>}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleCreateAll} disabled={saving} className="flex-1">
          {saving ? (
            <><IconRefresh size={16} className="mr-2 animate-spin" /> Wird gespeichert …</>
          ) : (
            <><IconCheck size={16} className="mr-2" />
              {pending.length > 0
                ? `${pending.length} ${pending.length === 1 ? 'Verknüpfung anlegen' : 'Verknüpfungen anlegen'} & weiter`
                : 'Weiter ohne Verknüpfungen'}
            </>
          )}
        </Button>
        <Button variant="ghost" onClick={onSkip} disabled={saving} className="sm:w-auto">
          Überspringen
        </Button>
      </div>
    </div>
  );
}

// =====================
// STEP 4: Ereignis protokollieren & Abschluss
// =====================

interface Step4Props {
  neuerKnotenId: string;
  erstellerId: string;
  knotenTitel: string;
  knotentyp: string;
  knotenStatus: string;
  beziehungenCount: number;
  externCount: number;
  onDone: () => void;
}

function Step4Ereignis({
  neuerKnotenId,
  erstellerId,
  knotenTitel,
  knotentyp,
  knotenStatus,
  beziehungenCount,
  externCount,
  onDone,
}: Step4Props) {
  const [ereignistyp, setEreignistyp] = useState('meaning_created');
  const [payload, setPayload] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [ereignisLogged, setEreignisLogged] = useState(false);

  const ereignistypOptions = LOOKUP_OPTIONS['bedeutungsereignisse']['ereignistyp'] ?? [];

  const knotentypLabel = (LOOKUP_OPTIONS['bedeutungsknoten']['knotentyp'] ?? []).find((o) => o.key === knotentyp)?.label ?? knotentyp;
  const statusLabel = (LOOKUP_OPTIONS['bedeutungsknoten']['status'] ?? []).find((o) => o.key === knotenStatus)?.label ?? knotenStatus;

  async function handleSave() {
    setSaving(true);
    setErr(null);
    try {
      await LivingAppsService.createBedeutungsereignisseEntry({
        ereignistyp,
        ereignis_knoten: createRecordUrl(APP_IDS.BEDEUTUNGSKNOTEN, neuerKnotenId),
        ereignis_akteur: createRecordUrl(APP_IDS.AKTEURE, erstellerId),
        zeitstempel: getNowDatetimeMinute(),
        payload: payload.trim() || undefined,
      });
      setEreignisLogged(true);
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Fehler beim Speichern des Ereignisses');
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    setEreignisLogged(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="space-y-6">
        {/* Success header */}
        <div className="flex items-center gap-3 rounded-2xl bg-primary/10 border border-primary/20 px-5 py-4">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <IconCheck size={20} className="text-primary-foreground" stroke={2.5} />
          </div>
          <div>
            <p className="font-semibold text-foreground">Knoten erfolgreich angelegt!</p>
            <p className="text-sm text-muted-foreground">Der Bedeutungsknoten wurde erstellt und vernetzt.</p>
          </div>
        </div>

        {/* Summary card */}
        <LiveCard title="Zusammenfassung">
          <LiveCardRow label="Knoten" value={knotenTitel} />
          <LiveCardRow label="Typ" value={knotentypLabel} />
          <LiveCardRow label="Status" value={statusLabel} />
          <LiveCardRow
            label="Beziehungen"
            value={beziehungenCount === 0 ? 'Keine' : `${beziehungenCount} angelegt`}
          />
          <LiveCardRow
            label="Externe Objekte"
            value={externCount === 0 ? 'Keine' : `${externCount} verknüpft`}
          />
          <LiveCardRow
            label="Ereignis"
            value={ereignisLogged ? 'Protokolliert' : 'Übersprungen'}
          />
        </LiveCard>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onDone}
            variant="outline"
            className="flex-1"
          >
            <IconRefresh size={16} className="mr-2" />
            Neuen Knoten anlegen
          </Button>
          <a href="#/" className="flex-1">
            <Button className="w-full">
              Zum Dashboard
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Ereignis form */}
      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium mb-2">Ereignistyp</p>
          <TileSelect options={ereignistypOptions} value={ereignistyp} onChange={setEreignistyp} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Notiz <span className="text-muted-foreground text-xs">(optional)</span>
          </label>
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-y"
            placeholder="Was ist passiert? Optionale Anmerkung …"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
          />
        </div>

        {err && <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{err}</p>}

        <div className="flex flex-col gap-3">
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <><IconRefresh size={16} className="mr-2 animate-spin" /> Wird gespeichert …</>
            ) : (
              <><IconCalendarEvent size={16} className="mr-2" /> Ereignis speichern & abschließen</>
            )}
          </Button>
          <Button variant="ghost" onClick={handleSkip} disabled={saving} className="w-full">
            Überspringen
          </Button>
        </div>
      </div>

      {/* Summary preview */}
      <div>
        <LiveCard title="Rückblick">
          <LiveCardRow label="Knoten" value={knotenTitel} />
          <LiveCardRow label="Typ" value={knotentypLabel} />
          <LiveCardRow label="Status" value={statusLabel} />
          <LiveCardRow
            label="Beziehungen"
            value={beziehungenCount === 0 ? 'Keine' : `${beziehungenCount} angelegt`}
          />
          <LiveCardRow
            label="Verknüpfungen"
            value={externCount === 0 ? 'Keine' : `${externCount} angelegt`}
          />
        </LiveCard>
      </div>
    </div>
  );
}

// =====================
// MAIN PAGE
// =====================

const WIZARD_STEPS = [
  { label: 'Knoten' },
  { label: 'Beziehungen' },
  { label: 'Objekte' },
  { label: 'Ereignis' },
];

export default function KnotenErstellenPage() {
  const [searchParams] = useSearchParams();
  const initialStep = (() => {
    const s = parseInt(searchParams.get('step') ?? '', 10);
    return s >= 1 && s <= 4 ? s : 1;
  })();

  const [currentStep, setCurrentStep] = useState(initialStep);

  // Cross-step state
  const [neuerKnotenId, setNeuerKnotenId] = useState('');
  const [erstellerId, setErstellerId] = useState('');
  const [knotenTitel, setKnotenTitel] = useState('');
  const [knotentyp, setKnotentyp] = useState('');
  const [knotenStatus, setKnotenStatus] = useState('draft');
  const [beziehungenCount, setBeziehungenCount] = useState(0);
  const [externCount, setExternCount] = useState(0);

  const { akteure, bedeutungsknoten, externeObjekte, loading, error, fetchAll } = useDashboardData();

  // Step 1 done
  const handleStep1Done = useCallback(
    (knotenId: string, acteurId: string, titel: string, typ: string, st: string) => {
      setNeuerKnotenId(knotenId);
      setErstellerId(acteurId);
      setKnotenTitel(titel);
      setKnotentyp(typ);
      setKnotenStatus(st);
      void fetchAll();
      setCurrentStep(2);
    },
    [fetchAll]
  );

  const handleStep2Done = useCallback(
    (count: number) => {
      setBeziehungenCount(count);
      if (count > 0) void fetchAll();
      setCurrentStep(3);
    },
    [fetchAll]
  );

  const handleStep3Done = useCallback(
    (count: number) => {
      setExternCount(count);
      if (count > 0) void fetchAll();
      setCurrentStep(4);
    },
    [fetchAll]
  );

  const handleFinalDone = useCallback(() => {
    // Reset all state → new knoten flow
    setNeuerKnotenId('');
    setErstellerId('');
    setKnotenTitel('');
    setKnotentyp('');
    setKnotenStatus('draft');
    setBeziehungenCount(0);
    setExternCount(0);
    setCurrentStep(1);
  }, []);

  return (
    <IntentWizardShell
      title="Knoten anlegen & vernetzen"
      subtitle="Erstelle einen neuen Bedeutungsknoten, vernetze ihn mit anderen Knoten und externen Objekten."
      steps={WIZARD_STEPS}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      loading={loading}
      error={error}
      onRetry={fetchAll}
    >
      {currentStep === 1 && (
        <Step1KnotenDefinierenWrapper
          akteure={akteure}
          onDone={handleStep1Done}
        />
      )}

      {currentStep === 2 && (
        <Step2Beziehungen
          neuerKnotenId={neuerKnotenId}
          erstellerId={erstellerId}
          alleBedeutungsknoten={bedeutungsknoten}
          onDone={handleStep2Done}
          onSkip={() => setCurrentStep(3)}
        />
      )}

      {currentStep === 3 && (
        <Step3ExterneObjekte
          neuerKnotenId={neuerKnotenId}
          externeObjekte={externeObjekte}
          onDone={handleStep3Done}
          onSkip={() => setCurrentStep(4)}
        />
      )}

      {currentStep === 4 && (
        <Step4Ereignis
          neuerKnotenId={neuerKnotenId}
          erstellerId={erstellerId}
          knotenTitel={knotenTitel}
          knotentyp={knotentyp}
          knotenStatus={knotenStatus}
          beziehungenCount={beziehungenCount}
          externCount={externCount}
          onDone={handleFinalDone}
        />
      )}
    </IntentWizardShell>
  );
}

// Wrapper for Step1 to capture all form state at submit time
function Step1KnotenDefinierenWrapper({
  akteure,
  onDone,
}: {
  akteure: Akteure[];
  onDone: (knotenId: string, erstellerId: string, titel: string, knotentyp: string, status: string) => void;
}) {
  const [titel, setTitel] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [knotentyp, setKnotentyp] = useState('');
  const [status, setStatus] = useState('draft');
  const [erstellerId, setErstellerId] = useState('');
  const [akteureSearch, setAkteureSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const knotentypOptions = LOOKUP_OPTIONS['bedeutungsknoten']['knotentyp'] ?? [];
  const statusOptions = LOOKUP_OPTIONS['bedeutungsknoten']['status'] ?? [];

  const filteredAkteure = useMemo(() => {
    const q = akteureSearch.toLowerCase();
    return akteure.filter((a) => {
      const label = getAkteursLabel(a).toLowerCase();
      return label.includes(q) || (a.fields.name_organisation ?? '').toLowerCase().includes(q);
    });
  }, [akteure, akteureSearch]);

  const selectedAkteur = akteure.find((a) => a.record_id === erstellerId);
  const knotentypLabel = knotentypOptions.find((o) => o.key === knotentyp)?.label ?? '';
  const statusLabel = statusOptions.find((o) => o.key === status)?.label ?? '';

  const canSubmit = titel.trim().length > 0 && knotentyp !== '' && erstellerId !== '';

  async function handleCreate() {
    if (!canSubmit) return;
    setSaving(true);
    setErr(null);
    try {
      const erstellt_am = getNowDatetimeMinute();
      const resp = await LivingAppsService.createBedeutungsknotenEntry({
        titel: titel.trim(),
        beschreibung: beschreibung.trim() || undefined,
        knotentyp,
        status,
        ersteller: createRecordUrl(APP_IDS.AKTEURE, erstellerId),
        erstellt_am,
      });
      const knotenId = Object.keys(resp)[0];
      onDone(knotenId, erstellerId, titel.trim(), knotentyp, status);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Fehler beim Erstellen');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Form */}
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">
            Titel <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="Bezeichnung des Knotens"
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Beschreibung</label>
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-y"
            placeholder="Optionale Beschreibung …"
            value={beschreibung}
            onChange={(e) => setBeschreibung(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Knotentyp <span className="text-destructive">*</span>
          </label>
          <TileSelect options={knotentypOptions} value={knotentyp} onChange={setKnotentyp} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <TileSelect options={statusOptions} value={status} onChange={setStatus} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Ersteller <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="Akteur suchen …"
            value={akteureSearch}
            onChange={(e) => setAkteureSearch(e.target.value)}
            className="mb-2"
          />
          <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
            {filteredAkteure.length === 0 && (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">Keine Akteure gefunden</div>
            )}
            {filteredAkteure.map((a) => (
              <button
                key={a.record_id}
                type="button"
                onClick={() => setErstellerId(a.record_id)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors',
                  erstellerId === a.record_id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-secondary'
                )}
              >
                <IconUser size={14} className="shrink-0 text-muted-foreground" />
                <span className="truncate min-w-0">{getAkteursLabel(a)}</span>
                {erstellerId === a.record_id && (
                  <IconCheck size={14} className="ml-auto shrink-0 text-primary" stroke={2.5} />
                )}
              </button>
            ))}
          </div>
        </div>

        {err && (
          <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{err}</p>
        )}

        <Button onClick={handleCreate} disabled={!canSubmit || saving} className="w-full">
          {saving ? (
            <><IconRefresh size={16} className="mr-2 animate-spin" /> Wird gespeichert …</>
          ) : (
            <><IconChevronRight size={16} className="mr-2" /> Knoten erstellen & weiter</>
          )}
        </Button>
      </div>

      {/* Live preview */}
      <div className="space-y-3">
        <LiveCard title="Vorschau">
          <LiveCardRow label="Titel" value={titel} />
          <LiveCardRow label="Knotentyp" value={knotentypLabel} />
          <LiveCardRow label="Status" value={statusLabel} />
          <LiveCardRow label="Ersteller" value={selectedAkteur ? getAkteursLabel(selectedAkteur) : ''} />
          {beschreibung && (
            <div className="pt-1 border-t">
              <p className="text-xs text-muted-foreground mb-0.5">Beschreibung</p>
              <p className="text-sm line-clamp-4">{beschreibung}</p>
            </div>
          )}
        </LiveCard>

        <div className="rounded-lg bg-secondary/40 border px-4 py-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground text-sm">So geht es weiter</p>
          <p>Nach dem Erstellen kannst du Beziehungen zu anderen Knoten anlegen und externe Objekte verknüpfen.</p>
        </div>
      </div>
    </div>
  );
}
