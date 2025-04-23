
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ProfileModalErrorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: string;
};

export default function ProfileModalError({ open, onOpenChange, error }: ProfileModalErrorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-full">
        <DialogHeader>
          <DialogTitle className="text-destructive">Errore</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>{error}</p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Chiudi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
