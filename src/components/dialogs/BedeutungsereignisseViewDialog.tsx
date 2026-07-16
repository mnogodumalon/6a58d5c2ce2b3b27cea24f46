import type { Bedeutungsereignisse, Bedeutungsknoten, Akteure } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { APP_IDS } from '@/types/app';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface BedeutungsereignisseViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Bedeutungsereignisse | null;
  onEdit: (record: Bedeutungsereignisse) => void;
  bedeutungsknotenList: Bedeutungsknoten[];
  akteureList: Akteure[];
}

export function BedeutungsereignisseViewDialog({ open, onClose, record, onEdit, bedeutungsknotenList, akteureList }: BedeutungsereignisseViewDialogProps) {
  function getBedeutungsknotenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return bedeutungsknotenList.find(r => r.record_id === id)?.fields.titel ?? '—';
  }

  function getAkteureDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return akteureList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bedeutungsereignisse anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ereignistyp</Label>
            <Badge variant="secondary">{record.fields.ereignistyp?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Betroffener Knoten</Label>
            <p className="text-sm">{getBedeutungsknotenDisplayName(record.fields.ereignis_knoten)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ausführender Akteur</Label>
            <p className="text-sm">{getAkteureDisplayName(record.fields.ereignis_akteur)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zeitstempel</Label>
            <p className="text-sm">{formatDate(record.fields.zeitstempel)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nutzlast (Payload)</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.payload ?? '—'}</p>
          </div>
          <div className="pt-2 border-t border-border">
            <AttachmentsSection appId={APP_IDS.BEDEUTUNGSEREIGNISSE} recordId={record.record_id} readOnly />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}