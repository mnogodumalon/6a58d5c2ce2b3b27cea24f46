import type { Akteure, Bedeutungsknoten, Knotenbeziehungen, Bedeutungsereignisse } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface AkteureDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Akteure;
  /** 1:N „Bedeutungsknoten": VOLLE Liste — der Block filtert auf diesen Record. */
  bedeutungsknotenList: Bedeutungsknoten[];
  /** Zeilen-Klick → overlay.push auf das Bedeutungsknoten-Detail (nie der Edit-Dialog). */
  onOpenBedeutungsknoten: (record: Bedeutungsknoten) => void;
  /** Kontextuelles „+": öffnet den Bedeutungsknoten-Dialog mit diesem Record vorgesetzt. */
  onAddBedeutungsknoten: () => void;
  /** 1:N „Knotenbeziehungen": VOLLE Liste — der Block filtert auf diesen Record. */
  knotenbeziehungenList: Knotenbeziehungen[];
  /** Zeilen-Klick → overlay.push auf das Knotenbeziehungen-Detail (nie der Edit-Dialog). */
  onOpenKnotenbeziehungen: (record: Knotenbeziehungen) => void;
  /** Kontextuelles „+": öffnet den Knotenbeziehungen-Dialog mit diesem Record vorgesetzt. */
  onAddKnotenbeziehungen: () => void;
  /** 1:N „Bedeutungsereignisse": VOLLE Liste — der Block filtert auf diesen Record. */
  bedeutungsereignisseList: Bedeutungsereignisse[];
  /** Zeilen-Klick → overlay.push auf das Bedeutungsereignisse-Detail (nie der Edit-Dialog). */
  onOpenBedeutungsereignisse: (record: Bedeutungsereignisse) => void;
  /** Kontextuelles „+": öffnet den Bedeutungsereignisse-Dialog mit diesem Record vorgesetzt. */
  onAddBedeutungsereignisse: () => void;
}

export function AkteureDetails({
  record,
  bedeutungsknotenList,
  onOpenBedeutungsknoten,
  onAddBedeutungsknoten,
  knotenbeziehungenList,
  onOpenKnotenbeziehungen,
  onAddKnotenbeziehungen,
  bedeutungsereignisseList,
  onOpenBedeutungsereignisse,
  onAddBedeutungsereignisse,
}: AkteureDetailsProps) {
  return (
    <>
      <RecordSection title="Details" cols={2}>
        <RecordField label="Vorname" value={record.fields.vorname} format="text" />
        <RecordField label="Nachname" value={record.fields.nachname} format="text" />
        <RecordField label="Name (Organisation / Team / System)" value={record.fields.name_organisation} format="text" />
        <RecordField label="Akteurstyp" value={record.fields.akteurstyp} format="pill" />
        <RecordField label="Externer Verweis" value={record.fields.externer_verweis} format="url" />
      </RecordSection>

      <SatelliteSection
        title="Bedeutungsknoten"
        items={bedeutungsknotenList.filter(r => extractRecordId(r.fields.ersteller) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? 'Bedeutungsknoten', meta: r.fields.erstellt_am })}
        onOpen={onOpenBedeutungsknoten}
        onAdd={onAddBedeutungsknoten}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title="Knotenbeziehungen"
        items={knotenbeziehungenList.filter(r => extractRecordId(r.fields.beziehung_ersteller) === record.record_id)}
        map={r => ({ name: 'Knotenbeziehungen', meta: r.fields.beziehung_erstellt_am })}
        onOpen={onOpenKnotenbeziehungen}
        onAdd={onAddKnotenbeziehungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title="Bedeutungsereignisse"
        items={bedeutungsereignisseList.filter(r => extractRecordId(r.fields.ereignis_akteur) === record.record_id)}
        map={r => ({ name: 'Bedeutungsereignisse', meta: r.fields.zeitstempel })}
        onOpen={onOpenBedeutungsereignisse}
        onAdd={onAddBedeutungsereignisse}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.AKTEURE} recordId={record.record_id} />
    </>
  );
}
