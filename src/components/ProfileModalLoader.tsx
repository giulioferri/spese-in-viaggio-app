
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

type ProfileModalLoaderProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ProfileModalLoader({ open, onOpenChange }: ProfileModalLoaderProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-full">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2">Caricamento profilo...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
