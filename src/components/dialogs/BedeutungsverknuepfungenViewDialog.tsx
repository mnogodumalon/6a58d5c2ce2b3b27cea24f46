import type { Bedeutungsverknuepfungen, Bedeutungsknoten, ExterneObjekte } from '@/types/app';
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

interface BedeutungsverknuepfungenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Bedeutungsverknuepfungen | null;
  onEdit: (record: Bedeutungsverknuepfungen) => void;
  bedeutungsknotenList: Bedeutungsknoten[];
  externeObjekteList: ExterneObjekte[];
}

export function BedeutungsverknuepfungenViewDialog({ open, onClose, record, onEdit, bedeutungsknotenList, externeObjekteList }: BedeutungsverknuepfungenViewDialogProps) {
  function getBedeutungsknotenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return bedeutungsknotenList.find(r => r.record_id === id)?.fields.titel ?? '—';
  }

  function getExterneObjekteDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return externeObjekteList.find(r => r.record_id === id)?.fields.systemname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bedeutungsverknüpfungen anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bedeutungsknoten</Label>
            <p className="text-sm">{getBedeutungsknotenDisplayName(record.fields.verknuepfung_knoten)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Externes Objekt</Label>
            <p className="text-sm">{getExterneObjekteDisplayName(record.fields.verknuepfung_extern)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verknüpfungstyp</Label>
            <Badge variant="secondary">{record.fields.verknuepfungstyp?.label ?? '—'}</Badge>
          </div>
          <div className="pt-2 border-t border-border">
            <AttachmentsSection appId={APP_IDS.BEDEUTUNGSVERKNUEPFUNGEN} recordId={record.record_id} readOnly />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}