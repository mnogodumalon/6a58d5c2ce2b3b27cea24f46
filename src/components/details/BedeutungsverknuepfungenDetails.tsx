import type { Bedeutungsverknuepfungen, Bedeutungsknoten, ExterneObjekte } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';

export interface BedeutungsverknuepfungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Bedeutungsverknuepfungen;
  /** N:1-Ziel „Bedeutungsknoten": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  bedeutungsknotenList: Bedeutungsknoten[];
  /** Klick auf die Bedeutungsknoten-Relation → overlay.push auf dessen Detail. */
  onOpenBedeutungsknoten?: (record: Bedeutungsknoten) => void;
  /** N:1-Ziel „ExterneObjekte": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  externeObjekteList: ExterneObjekte[];
  /** Klick auf die ExterneObjekte-Relation → overlay.push auf dessen Detail. */
  onOpenExterneObjekte?: (record: ExterneObjekte) => void;
}

export function BedeutungsverknuepfungenDetails({
  record,
  bedeutungsknotenList,
  onOpenBedeutungsknoten,
  externeObjekteList,
  onOpenExterneObjekte,
}: BedeutungsverknuepfungenDetailsProps) {
  const verknuepfung_knotenTarget = bedeutungsknotenList.find(r => r.record_id === extractRecordId(record.fields.verknuepfung_knoten));
  const verknuepfung_externTarget = externeObjekteList.find(r => r.record_id === extractRecordId(record.fields.verknuepfung_extern));
  return (
    <>
      <RecordSection title="Details" cols={2}>
        <RecordField label="Verknüpfungstyp" value={record.fields.verknuepfungstyp} format="pill" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title="Verknüpft" cols={2}>
        <RecordRelation
          label="Bedeutungsknoten"
          name={verknuepfung_knotenTarget?.fields.titel ?? '—'}
          meta={undefined}
          onClick={verknuepfung_knotenTarget && onOpenBedeutungsknoten ? () => onOpenBedeutungsknoten!(verknuepfung_knotenTarget!) : undefined}
        />
        <RecordRelation
          label="Externes Objekt"
          name={verknuepfung_externTarget?.fields.systemname ?? '—'}
          meta={[verknuepfung_externTarget?.fields.objekttyp, verknuepfung_externTarget?.fields.objekt_id].filter(Boolean).join(' · ') || undefined}
          onClick={verknuepfung_externTarget && onOpenExterneObjekte ? () => onOpenExterneObjekte!(verknuepfung_externTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.BEDEUTUNGSVERKNUEPFUNGEN} recordId={record.record_id} />
    </>
  );
}
