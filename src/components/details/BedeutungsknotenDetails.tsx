import type { Bedeutungsknoten, Akteure, Knotenbeziehungen, Bedeutungsverknuepfungen, Bedeutungsereignisse } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface BedeutungsknotenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Bedeutungsknoten;
  /** N:1-Ziel „Akteure": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  akteureList: Akteure[];
  /** Klick auf die Akteure-Relation → overlay.push auf dessen Detail. */
  onOpenAkteure?: (record: Akteure) => void;
  /** 1:N „Knotenbeziehungen": VOLLE Liste — der Block filtert auf diesen Record. */
  knotenbeziehungenList: Knotenbeziehungen[];
  /** Zeilen-Klick → overlay.push auf das Knotenbeziehungen-Detail (nie der Edit-Dialog). */
  onOpenKnotenbeziehungen: (record: Knotenbeziehungen) => void;
  /** Kontextuelles „+": öffnet den Knotenbeziehungen-Dialog mit diesem Record vorgesetzt. */
  onAddKnotenbeziehungen: () => void;
  /** 1:N „Bedeutungsverknüpfungen": VOLLE Liste — der Block filtert auf diesen Record. */
  bedeutungsverknuepfungenList: Bedeutungsverknuepfungen[];
  /** Zeilen-Klick → overlay.push auf das Bedeutungsverknuepfungen-Detail (nie der Edit-Dialog). */
  onOpenBedeutungsverknuepfungen: (record: Bedeutungsverknuepfungen) => void;
  /** Kontextuelles „+": öffnet den Bedeutungsverknuepfungen-Dialog mit diesem Record vorgesetzt. */
  onAddBedeutungsverknuepfungen: () => void;
  /** 1:N „Bedeutungsereignisse": VOLLE Liste — der Block filtert auf diesen Record. */
  bedeutungsereignisseList: Bedeutungsereignisse[];
  /** Zeilen-Klick → overlay.push auf das Bedeutungsereignisse-Detail (nie der Edit-Dialog). */
  onOpenBedeutungsereignisse: (record: Bedeutungsereignisse) => void;
  /** Kontextuelles „+": öffnet den Bedeutungsereignisse-Dialog mit diesem Record vorgesetzt. */
  onAddBedeutungsereignisse: () => void;
}

export function BedeutungsknotenDetails({
  record,
  akteureList,
  onOpenAkteure,
  knotenbeziehungenList,
  onOpenKnotenbeziehungen,
  onAddKnotenbeziehungen,
  bedeutungsverknuepfungenList,
  onOpenBedeutungsverknuepfungen,
  onAddBedeutungsverknuepfungen,
  bedeutungsereignisseList,
  onOpenBedeutungsereignisse,
  onAddBedeutungsereignisse,
}: BedeutungsknotenDetailsProps) {
  const erstellerTarget = akteureList.find(r => r.record_id === extractRecordId(record.fields.ersteller));
  return (
    <>
      <RecordSection title="Details" cols={2}>
        <RecordField label="Titel" value={record.fields.titel} format="text" />
        <RecordField label="Beschreibung" value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label="Knotentyp" value={record.fields.knotentyp} format="pill" />
        <RecordField label="Status" value={record.fields.status} format="pill" />
        <RecordField label="Erstellt am" value={record.fields.erstellt_am} format="datetime" />
        <RecordField label="Aktualisiert am" value={record.fields.aktualisiert_am} format="datetime" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title="Verknüpft" cols={1}>
        <RecordRelation
          label="Ersteller"
          name={erstellerTarget?.fields.vorname ?? '—'}
          meta={[erstellerTarget?.fields.nachname, erstellerTarget?.fields.name_organisation].filter(Boolean).join(' · ') || undefined}
          onClick={erstellerTarget && onOpenAkteure ? () => onOpenAkteure!(erstellerTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title="Knotenbeziehungen (Quelle)"
        items={knotenbeziehungenList.filter(r => extractRecordId(r.fields.quellknoten) === record.record_id)}
        map={r => ({ name: r.fields.beziehungstyp?.label ?? 'Knotenbeziehung', meta: r.fields.beziehung_erstellt_am })}
        onOpen={onOpenKnotenbeziehungen}
        onAdd={onAddKnotenbeziehungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title="Knotenbeziehungen (Ziel)"
        items={knotenbeziehungenList.filter(r => extractRecordId(r.fields.zielknoten) === record.record_id)}
        map={r => ({ name: r.fields.beziehungstyp?.label ?? 'Knotenbeziehung', meta: r.fields.beziehung_erstellt_am })}
        onOpen={onOpenKnotenbeziehungen}
        onAdd={onAddKnotenbeziehungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title="Bedeutungsverknüpfungen"
        items={bedeutungsverknuepfungenList.filter(r => extractRecordId(r.fields.verknuepfung_knoten) === record.record_id)}
        map={_r => ({ name: 'Bedeutungsverknüpfung', meta: undefined })}
        onOpen={onOpenBedeutungsverknuepfungen}
        onAdd={onAddBedeutungsverknuepfungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title="Bedeutungsereignisse"
        items={bedeutungsereignisseList.filter(r => extractRecordId(r.fields.ereignis_knoten) === record.record_id)}
        map={r => ({ name: r.fields.ereignistyp?.label ?? 'Ereignis', meta: r.fields.zeitstempel })}
        onOpen={onOpenBedeutungsereignisse}
        onAdd={onAddBedeutungsereignisse}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.BEDEUTUNGSKNOTEN} recordId={record.record_id} />
    </>
  );
}
