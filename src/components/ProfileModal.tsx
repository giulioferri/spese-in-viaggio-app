
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, User } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import ProfileAvatarSection from "./ProfileAvatarSection";
import ProfilePaletteSelector from "./ProfilePaletteSelector";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// This modal is now split into smaller components for easier maintenance!
export default function ProfileModal({ open, onOpenChange }: Props) {
  const { profile, setProfile, isLoading, error } = useProfile();
  const [tempProfile, setTempProfile] = useState(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [needsReload, setNeedsReload] = useState(false);

  useEffect(() => {
    if (open) {
      setTempProfile(profile);
      setNeedsReload(false);
    } else if (needsReload) {
      window.location.reload();
    }
  }, [open, profile, needsReload]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await setProfile(tempProfile);
      if (success) setNeedsReload(true);
      onOpenChange(false);
    } catch (err) {
      // error handled in useProfileUpdate
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
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

  if (error) {
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

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen && needsReload) setTimeout(() => window.location.reload(), 100);
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-sm w-full">
        <DialogHeader>
          <DialogTitle>
            <User className="inline mr-2" /> Profilo Utente
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <ProfileAvatarSection
            photo={tempProfile.photo}
            onChangePhoto={photo =>
              setTempProfile(prev => ({ ...prev, photo }))
            }
          />
          <ProfilePaletteSelector
            palette={tempProfile.palette}
            onSelect={palette =>
              setTempProfile(prev => ({ ...prev, palette }))
            }
          />
        </div>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="ghost" disabled={isSaving}>
              Annulla
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvataggio...
              </>
            ) : (
              "Salva"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
