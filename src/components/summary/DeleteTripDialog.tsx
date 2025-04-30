
import { Button } from "@/components/ui/button";
import {
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface DeleteTripDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteTripDialog({ onCancel, onConfirm }: DeleteTripDialogProps) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          Eliminare questa trasferta?
        </AlertDialogTitle>
        <AlertDialogDescription>
          Tutte le spese e gli allegati di questa trasferta verranno eliminati definitivamente. Sei sicuro di voler continuare?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onCancel}>Annulla</AlertDialogCancel>
        <AlertDialogAction asChild>
          <Button variant="destructive" onClick={onConfirm}>
            Elimina definitivamente
          </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
