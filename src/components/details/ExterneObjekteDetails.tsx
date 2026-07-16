import type { ExterneObjekte, Bedeutungsverknuepfungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface ExterneObjekteDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: ExterneObjekte;
  /** 1:N „Bedeutungsverknüpfungen": VOLLE Liste — der Block filtert auf diesen Record. */
  bedeutungsverknuepfungenList: Bedeutungsverknuepfungen[];
  /** Zeilen-Klick → overlay.push auf das Bedeutungsverknuepfungen-Detail (nie der Edit-Dialog). */
  onOpenBedeutungsverknuepfungen: (record: Bedeutungsverknuepfungen) => void;
  /** Kontextuelles „+": öffnet den Bedeutungsverknuepfungen-Dialog mit diesem Record vorgesetzt. */
  onAddBedeutungsverknuepfungen: () => void;
}

export function ExterneObjekteDetails({
  record,
  bedeutungsverknuepfungenList,
  onOpenBedeutungsverknuepfungen,
  onAddBedeutungsverknuepfungen,
}: ExterneObjekteDetailsProps) {
  return (
    <>
      <RecordSection title="Details" cols={2}>
        <RecordField label="Systemname" value={record.fields.systemname} format="text" />
        <RecordField label="Objekttyp" value={record.fields.objekttyp} format="text" />
        <RecordField label="Objekt-ID" value={record.fields.objekt_id} format="text" />
        <RecordField label="Titel" value={record.fields.extern_titel} format="text" />
        <RecordField label="URL" value={record.fields.extern_url} format="url" />
      </RecordSection>

      <SatelliteSection
        title="Bedeutungsverknüpfungen"
        items={bedeutungsverknuepfungenList.filter(r => extractRecordId(r.fields.verknuepfung_extern) === record.record_id)}
        map={_r => ({ name: 'Bedeutungsverknüpfungen', meta: undefined })}
        onOpen={onOpenBedeutungsverknuepfungen}
        onAdd={onAddBedeutungsverknuepfungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.EXTERNE_OBJEKTE} recordId={record.record_id} />
    </>
  );
}
