
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, User } from "lucide-react";
import { DialogClose } from "@radix-ui/react-dialog";
import ProfileAvatarSection from "./ProfileAvatarSection";
import ProfilePaletteSelector from "./ProfilePaletteSelector";
import { UserProfile } from "@/hooks/useProfile";

type ProfileModalContentProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile;
  setProfile: (updater: any) => Promise<boolean>;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  needsReload: boolean;
  setNeedsReload: (reload: boolean) => void;
};

export default function ProfileModalContent({
  open,
  onOpenChange,
  profile,
  setProfile,
  isSaving,
  setIsSaving,
  needsReload,
  setNeedsReload,
}: ProfileModalContentProps) {
  const [tempProfile, setTempProfile] = useState(profile);

  useEffect(() => {
    if (open) {
      setTempProfile(profile);
      setNeedsReload(false);
    } else if (needsReload) {
      window.location.reload();
    }
    // eslint-disable-next-line
  }, [open, profile, needsReload]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await setProfile(tempProfile);
      if (success) setNeedsReload(true);
      onOpenChange(false);
    } catch {
      // handled in useProfileUpdate
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Annulla
          </Button>
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
