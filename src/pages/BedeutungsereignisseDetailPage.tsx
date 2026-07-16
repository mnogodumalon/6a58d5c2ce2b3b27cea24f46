import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import type { Bedeutungsereignisse, Bedeutungsknoten, Akteure } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconTrash } from '@tabler/icons-react';
import {
  RecordView, RecordHeader, RecordKeyFacts, RecordSection, RecordField,
  RecordAttachments, RecordViewSkeleton, RecordViewEmpty,
} from '@/components/widgets/RecordView';
import { BedeutungsereignisseDialog } from '@/components/dialogs/BedeutungsereignisseDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { formEnhancements } from '@/config/form-enhancements/Bedeutungsereignisse';
import { evalComputed } from '@/config/form-enhancements/types';

export default function BedeutungsereignisseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<Bedeutungsereignisse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bedeutungsknotenList, setBedeutungsknotenList] = useState<Bedeutungsknoten[]>([]);
  const [akteureList, setAkteureList] = useState<Akteure[]>([]);

  useEffect(() => { loadData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, bedeutungsknotenData, akteureData] = await Promise.all([
        LivingAppsService.getBedeutungsereignisse(),
        LivingAppsService.getBedeutungsknoten(),
        LivingAppsService.getAkteure(),
      ]);
      setBedeutungsknotenList(bedeutungsknotenData);
      setAkteureList(akteureData);
      setRecord(mainData.find(r => r.record_id === id) ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(fields: Bedeutungsereignisse['fields']) {
    if (!record) return;
    await LivingAppsService.updateBedeutungsereignisseEntry(record.record_id, fields);
    await loadData();
    setEditing(false);
  }

  async function handleDelete() {
    if (!record) return;
    await LivingAppsService.deleteBedeutungsereignisseEntry(record.record_id);
    setDeleteOpen(false);
    navigate('/bedeutungsereignisse');
  }

  function getBedeutungsknotenDisplayName(url?: unknown) {
    if (!url) return '—';
    const refId = extractRecordId(url);
    return bedeutungsknotenList.find(r => r.record_id === refId)?.fields.titel ?? '—';
  }

  function getAkteureDisplayName(url?: unknown) {
    if (!url) return '—';
    const refId = extractRecordId(url);
    return akteureList.find(r => r.record_id === refId)?.fields.vorname ?? '—';
  }

  if (loading) {
    return <RecordViewSkeleton />;
  }

  if (!record) {
    return (
      <RecordViewEmpty
        title="Eintrag nicht gefunden"
        action={
          <Button variant="ghost" onClick={() => navigate('/bedeutungsereignisse')}>
            <IconArrowLeft className="h-4 w-4 mr-1.5" />
            Zurück
          </Button>
        }
      />
    );
  }

  return (
    <RecordView
      onBack={() => navigate('/bedeutungsereignisse')}
      onEdit={() => setEditing(true)}
      backLabel="Zurück"
      editLabel="Bearbeiten"
    >
      <RecordHeader title={'Bedeutungsereignisse'} />

      {(() => {
        const lookupLists: Record<string, unknown> = {
          ereignis_knoten: bedeutungsknotenList,
          ereignis_akteur: akteureList,
        };
        const fmtComputed = (k: string, n: number) =>
          /(?:kosten|preis|betrag|gesamt|netto|brutto|summe|mwst|rabatt|anzahlung|umsatz|saldo)/i.test(k)
            ? n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : n.toLocaleString('de-DE', { maximumFractionDigits: 2 });
        const computedFacts = Object.entries(formEnhancements.computed)
          .map(([key, formula]) => {
            const v = evalComputed(formula, record!.fields as Record<string, unknown>, { lookupLists });
            return v != null
              ? { label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '), value: fmtComputed(key, v) }
              : null;
          })
          .filter((f): f is { label: string; value: string } => f !== null);
        return computedFacts.length > 0 ? <RecordKeyFacts items={computedFacts} /> : null;
      })()}

      <RecordSection title="Details" cols={2}>
        <RecordField label="Ereignistyp" value={record.fields.ereignistyp} format="pill" />
        <RecordField label="Betroffener Knoten" value={getBedeutungsknotenDisplayName(record.fields.ereignis_knoten)} format="text" />
        <RecordField label="Ausführender Akteur" value={getAkteureDisplayName(record.fields.ereignis_akteur)} format="text" />
        <RecordField label="Zeitstempel" value={record.fields.zeitstempel} format="datetime" />
        <RecordField label="Nutzlast (Payload)" value={record.fields.payload} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.BEDEUTUNGSEREIGNISSE} recordId={record.record_id} />

      <div className="flex justify-end pt-2">
        <Button variant="ghost" onClick={() => setDeleteOpen(true)} className="text-destructive hover:text-destructive">
          <IconTrash className="h-4 w-4 mr-1.5" />
          Löschen
        </Button>
      </div>

      <BedeutungsereignisseDialog
        open={editing}
        onClose={() => setEditing(false)}
        onSubmit={handleUpdate}
        defaultValues={record.fields}
        recordId={record.record_id}
        bedeutungsknotenList={bedeutungsknotenList}
        akteureList={akteureList}
        enablePhotoScan={AI_PHOTO_SCAN['Bedeutungsereignisse']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Bedeutungsereignisse']}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Bedeutungsereignisse löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </RecordView>
  );
}
