import type { Knotenbeziehungen, Bedeutungsknoten, Akteure } from '@/types/app';
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

interface KnotenbeziehungenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Knotenbeziehungen | null;
  onEdit: (record: Knotenbeziehungen) => void;
  bedeutungsknotenList: Bedeutungsknoten[];
  akteureList: Akteure[];
}

export function KnotenbeziehungenViewDialog({ open, onClose, record, onEdit, bedeutungsknotenList, akteureList }: KnotenbeziehungenViewDialogProps) {
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
          <DialogTitle>Knotenbeziehungen anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Quellknoten</Label>
            <p className="text-sm">{getBedeutungsknotenDisplayName(record.fields.quellknoten)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zielknoten</Label>
            <p className="text-sm">{getBedeutungsknotenDisplayName(record.fields.zielknoten)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beziehungstyp</Label>
            <Badge variant="secondary">{record.fields.beziehungstyp?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Konfidenz (0–100)</Label>
            <p className="text-sm">{record.fields.konfidenz ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ersteller</Label>
            <p className="text-sm">{getAkteureDisplayName(record.fields.beziehung_ersteller)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Erstellt am</Label>
            <p className="text-sm">{formatDate(record.fields.beziehung_erstellt_am)}</p>
          </div>
          <div className="pt-2 border-t border-border">
            <AttachmentsSection appId={APP_IDS.KNOTENBEZIEHUNGEN} recordId={record.record_id} readOnly />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}