import type { Knotenbeziehungen, Bedeutungsknoten, Akteure } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';

export interface KnotenbeziehungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Knotenbeziehungen;
  /** N:1-Ziel „Bedeutungsknoten": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  bedeutungsknotenList: Bedeutungsknoten[];
  /** Klick auf die Bedeutungsknoten-Relation → overlay.push auf dessen Detail. */
  onOpenBedeutungsknoten?: (record: Bedeutungsknoten) => void;
  /** N:1-Ziel „Akteure": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  akteureList: Akteure[];
  /** Klick auf die Akteure-Relation → overlay.push auf dessen Detail. */
  onOpenAkteure?: (record: Akteure) => void;
}

export function KnotenbeziehungenDetails({
  record,
  bedeutungsknotenList,
  onOpenBedeutungsknoten,
  akteureList,
  onOpenAkteure,
}: KnotenbeziehungenDetailsProps) {
  const quellknotenTarget = bedeutungsknotenList.find(r => r.record_id === extractRecordId(record.fields.quellknoten));
  const zielknotenTarget = bedeutungsknotenList.find(r => r.record_id === extractRecordId(record.fields.zielknoten));
  const beziehung_erstellerTarget = akteureList.find(r => r.record_id === extractRecordId(record.fields.beziehung_ersteller));
  return (
    <>
      <RecordSection title="Details" cols={2}>
        <RecordField label="Beziehungstyp" value={record.fields.beziehungstyp} format="pill" />
        <RecordField label="Konfidenz (0–100)" value={record.fields.konfidenz} format="text" />
        <RecordField label="Erstellt am" value={record.fields.beziehung_erstellt_am} format="datetime" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title="Verknüpft" cols={2}>
        <RecordRelation
          label="Quellknoten"
          name={quellknotenTarget?.fields.titel ?? '—'}
          meta={undefined}
          onClick={quellknotenTarget && onOpenBedeutungsknoten ? () => onOpenBedeutungsknoten!(quellknotenTarget!) : undefined}
        />
        <RecordRelation
          label="Zielknoten"
          name={zielknotenTarget?.fields.titel ?? '—'}
          meta={undefined}
          onClick={zielknotenTarget && onOpenBedeutungsknoten ? () => onOpenBedeutungsknoten!(zielknotenTarget!) : undefined}
        />
        <RecordRelation
          label="Ersteller"
          name={beziehung_erstellerTarget?.fields.vorname ?? '—'}
          meta={[beziehung_erstellerTarget?.fields.nachname, beziehung_erstellerTarget?.fields.name_organisation].filter(Boolean).join(' · ') || undefined}
          onClick={beziehung_erstellerTarget && onOpenAkteure ? () => onOpenAkteure!(beziehung_erstellerTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.KNOTENBEZIEHUNGEN} recordId={record.record_id} />
    </>
  );
}
