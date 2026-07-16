// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Akteure {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    name_organisation?: string;
    akteurstyp?: LookupValue;
    externer_verweis?: string;
  };
}

export interface Bedeutungsknoten {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    titel?: string;
    beschreibung?: string;
    knotentyp?: LookupValue;
    status?: LookupValue;
    ersteller?: string; // applookup -> URL zu 'Akteure' Record
    erstellt_am?: string; // Format: YYYY-MM-DD oder ISO String
    aktualisiert_am?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface Knotenbeziehungen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    quellknoten?: string; // applookup -> URL zu 'Bedeutungsknoten' Record
    zielknoten?: string; // applookup -> URL zu 'Bedeutungsknoten' Record
    beziehungstyp?: LookupValue;
    konfidenz?: number;
    beziehung_ersteller?: string; // applookup -> URL zu 'Akteure' Record
    beziehung_erstellt_am?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface ExterneObjekte {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    systemname?: string;
    objekttyp?: string;
    objekt_id?: string;
    extern_titel?: string;
    extern_url?: string;
  };
}

export interface Bedeutungsverknuepfungen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    verknuepfung_knoten?: string; // applookup -> URL zu 'Bedeutungsknoten' Record
    verknuepfung_extern?: string; // applookup -> URL zu 'ExterneObjekte' Record
    verknuepfungstyp?: LookupValue;
  };
}

export interface Bedeutungsereignisse {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    ereignistyp?: LookupValue;
    ereignis_knoten?: string; // applookup -> URL zu 'Bedeutungsknoten' Record
    ereignis_akteur?: string; // applookup -> URL zu 'Akteure' Record
    zeitstempel?: string; // Format: YYYY-MM-DD oder ISO String
    payload?: string;
  };
}

export const APP_IDS = {
  AKTEURE: '6a58d592d41d51dcf339b82e',
  BEDEUTUNGSKNOTEN: '6a58d598b5197f8a71859836',
  KNOTENBEZIEHUNGEN: '6a58d59945d4b015c290e16a',
  EXTERNE_OBJEKTE: '6a58d5999b474d0c231e8c4c',
  BEDEUTUNGSVERKNUEPFUNGEN: '6a58d59a91aa765b8b8ef82e',
  BEDEUTUNGSEREIGNISSE: '6a58d59a950bc3b73c446a47',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'akteure': {
    akteurstyp: [{ key: "team", label: "Team" }, { key: "organization", label: "Organisation" }, { key: "agent", label: "Agent" }, { key: "system", label: "System" }, { key: "human", label: "Mensch" }],
  },
  'bedeutungsknoten': {
    knotentyp: [{ key: "intent", label: "Absicht" }, { key: "goal", label: "Ziel" }, { key: "decision", label: "Entscheidung" }, { key: "effect", label: "Effekt" }, { key: "obstacle", label: "Hindernis" }, { key: "evidence", label: "Evidenz" }, { key: "principle", label: "Prinzip" }, { key: "hypothesis", label: "Hypothese" }, { key: "question", label: "Frage" }],
    status: [{ key: "draft", label: "Entwurf" }, { key: "active", label: "Aktiv" }, { key: "completed", label: "Abgeschlossen" }, { key: "obsolete", label: "Veraltet" }],
  },
  'knotenbeziehungen': {
    beziehungstyp: [{ key: "contributes_to", label: "Trägt bei zu" }, { key: "supports", label: "Unterstützt" }, { key: "contradicts", label: "Widerspricht" }, { key: "enables", label: "Ermöglicht" }, { key: "blocks", label: "Blockiert" }, { key: "causes", label: "Verursacht" }, { key: "depends_on", label: "Hängt ab von" }, { key: "owned_by", label: "Gehört zu" }, { key: "decides", label: "Entscheidet" }, { key: "proves", label: "Beweist" }, { key: "questions", label: "Stellt in Frage" }, { key: "refines", label: "Verfeinert" }],
  },
  'bedeutungsverknuepfungen': {
    verknuepfungstyp: [{ key: "supports", label: "Unterstützt" }, { key: "evidences", label: "Belegt" }, { key: "created_from", label: "Erstellt aus" }, { key: "implements", label: "Implementiert" }],
  },
  'bedeutungsereignisse': {
    ereignistyp: [{ key: "meaning_created", label: "Bedeutung erstellt" }, { key: "meaning_changed", label: "Bedeutung geändert" }, { key: "decision_made", label: "Entscheidung getroffen" }, { key: "evidence_added", label: "Evidenz hinzugefügt" }, { key: "relation_created", label: "Beziehung erstellt" }, { key: "relation_changed", label: "Beziehung geändert" }, { key: "status_changed", label: "Status geändert" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'akteure': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'name_organisation': 'string/text',
    'akteurstyp': 'lookup/select',
    'externer_verweis': 'string/url',
  },
  'bedeutungsknoten': {
    'titel': 'string/text',
    'beschreibung': 'string/textarea',
    'knotentyp': 'lookup/select',
    'status': 'lookup/select',
    'ersteller': 'applookup/select',
    'erstellt_am': 'date/datetimeminute',
    'aktualisiert_am': 'date/datetimeminute',
  },
  'knotenbeziehungen': {
    'quellknoten': 'applookup/select',
    'zielknoten': 'applookup/select',
    'beziehungstyp': 'lookup/select',
    'konfidenz': 'number',
    'beziehung_ersteller': 'applookup/select',
    'beziehung_erstellt_am': 'date/datetimeminute',
  },
  'externe_objekte': {
    'systemname': 'string/text',
    'objekttyp': 'string/text',
    'objekt_id': 'string/text',
    'extern_titel': 'string/text',
    'extern_url': 'string/url',
  },
  'bedeutungsverknuepfungen': {
    'verknuepfung_knoten': 'applookup/select',
    'verknuepfung_extern': 'applookup/select',
    'verknuepfungstyp': 'lookup/select',
  },
  'bedeutungsereignisse': {
    'ereignistyp': 'lookup/select',
    'ereignis_knoten': 'applookup/select',
    'ereignis_akteur': 'applookup/select',
    'zeitstempel': 'date/datetimeminute',
    'payload': 'string/textarea',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
  'akteure': [
    { field: 'ersteller', entity: 'bedeutungsknoten' },
    { field: 'beziehung_ersteller', entity: 'knotenbeziehungen' },
    { field: 'ereignis_akteur', entity: 'bedeutungsereignisse' },
  ],
  'bedeutungsknoten': [
    { field: 'quellknoten', entity: 'knotenbeziehungen' },
    { field: 'zielknoten', entity: 'knotenbeziehungen' },
    { field: 'verknuepfung_knoten', entity: 'bedeutungsverknuepfungen' },
    { field: 'ereignis_knoten', entity: 'bedeutungsereignisse' },
  ],
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateAkteure = StripLookup<Akteure['fields']>;
export type CreateBedeutungsknoten = StripLookup<Bedeutungsknoten['fields']>;
export type CreateKnotenbeziehungen = StripLookup<Knotenbeziehungen['fields']>;
export type CreateExterneObjekte = StripLookup<ExterneObjekte['fields']>;
export type CreateBedeutungsverknuepfungen = StripLookup<Bedeutungsverknuepfungen['fields']>;
export type CreateBedeutungsereignisse = StripLookup<Bedeutungsereignisse['fields']>;