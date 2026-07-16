import type { Bedeutungsereignisse, Bedeutungsknoten, Akteure } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';

export interface BedeutungsereignisseDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Bedeutungsereignisse;
  /** N:1-Ziel „Bedeutungsknoten": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  bedeutungsknotenList: Bedeutungsknoten[];
  /** Klick auf die Bedeutungsknoten-Relation → overlay.push auf dessen Detail. */
  onOpenBedeutungsknoten?: (record: Bedeutungsknoten) => void;
  /** N:1-Ziel „Akteure": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  akteureList: Akteure[];
  /** Klick auf die Akteure-Relation → overlay.push auf dessen Detail. */
  onOpenAkteure?: (record: Akteure) => void;
}

export function BedeutungsereignisseDetails({
  record,
  bedeutungsknotenList,
  onOpenBedeutungsknoten,
  akteureList,
  onOpenAkteure,
}: BedeutungsereignisseDetailsProps) {
  const ereignis_knotenTarget = bedeutungsknotenList.find(r => r.record_id === extractRecordId(record.fields.ereignis_knoten));
  const ereignis_akteurTarget = akteureList.find(r => r.record_id === extractRecordId(record.fields.ereignis_akteur));
  return (
    <>
      <RecordSection title="Details" cols={2}>
        <RecordField label="Ereignistyp" value={record.fields.ereignistyp} format="pill" />
        <RecordField label="Zeitstempel" value={record.fields.zeitstempel} format="datetime" />
        <RecordField label="Nutzlast (Payload)" value={record.fields.payload} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title="Verknüpft" cols={2}>
        <RecordRelation
          label="Betroffener Knoten"
          name={ereignis_knotenTarget?.fields.titel ?? '—'}
          meta={undefined}
          onClick={ereignis_knotenTarget && onOpenBedeutungsknoten ? () => onOpenBedeutungsknoten!(ereignis_knotenTarget!) : undefined}
        />
        <RecordRelation
          label="Ausführender Akteur"
          name={ereignis_akteurTarget?.fields.vorname ?? '—'}
          meta={[ereignis_akteurTarget?.fields.nachname, ereignis_akteurTarget?.fields.name_organisation].filter(Boolean).join(' · ') || undefined}
          onClick={ereignis_akteurTarget && onOpenAkteure ? () => onOpenAkteure!(ereignis_akteurTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.BEDEUTUNGSEREIGNISSE} recordId={record.record_id} />
    </>
  );
}
