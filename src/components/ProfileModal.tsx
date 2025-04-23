
import { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import { Palette, User, Image } from "lucide-react";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const paletteOptions = [
  { value: "default", label: "Default", color: "#009fef" },
  { value: "green", label: "Verde", color: "#23c69e" },
  { value: "red", label: "Rosso", color: "#ff325b" },
];

export default function ProfileModal({ open, onOpenChange }: Props) {
  const { profile, setProfile, isLoading, error } = useProfile();
  const [tempProfile, setTempProfile] = useState(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [needsReload, setNeedsReload] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizza tempProfile quando profile cambia o la modale si apre
  useEffect(() => {
    if (open) {
      console.log("ProfileModal opened, setting tempProfile to:", profile);
      setTempProfile(profile);
      setNeedsReload(false);
    } else if (needsReload) {
      // Ricarica la pagina quando la modale viene chiusa dopo un salvataggio
      window.location.reload();
    }
  }, [open, profile, needsReload]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Photo selected:", file.name, file.type);
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) {
          console.log("Photo loaded as data URL");
          setTempProfile(prev => ({ ...prev, photo: ev.target?.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaletteSelect = (value: "default" | "green" | "red") => {
    console.log("Palette selected:", value);
    setTempProfile(prev => ({ ...prev, palette: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    console.log("Saving profile:", tempProfile);
    try {
      // Salva le modifiche al profilo
      const success = await setProfile(tempProfile);
      if (success) {
        console.log("Profile saved successfully, setting needsReload");
        setNeedsReload(true);
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePhoto = () => {
    console.log("Photo removed");
    // Imposta esplicitamente photo a undefined per indicare la rimozione
    setTempProfile(prev => ({ ...prev, photo: undefined }));
    if (inputRef.current) inputRef.current.value = "";
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
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && needsReload) {
        // Se la modale viene chiusa dopo un salvataggio, attendi un momento e ricarica
        console.log("Dialog closing with needsReload=true, will reload page");
        setTimeout(() => window.location.reload(), 100);
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-sm w-full">
        <DialogHeader>
          <DialogTitle><User className="inline mr-2" /> Profilo Utente</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center">
            <Avatar className="w-20 h-20 mb-1">
              {tempProfile.photo ? (
                <AvatarImage src={tempProfile.photo} alt="Foto profilo" />
              ) : (
                <AvatarFallback>
                  <User size={40} />
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
                <Image className="mr-2" size={16} /> Cambia Foto
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </Button>
              {tempProfile.photo !== undefined && (
                <Button size="sm" variant="ghost" onClick={handleRemovePhoto}>
                  Rimuovi
                </Button>
              )}
            </div>
          </div>
          <div className="w-full">
            <label className="block mb-2 font-medium">Palette colore <Palette className="inline ml-1" size={16}/></label>
            <div className="flex gap-4">
              {paletteOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handlePaletteSelect(opt.value as any)}
                  className={`rounded-xl border p-2 flex-1 flex flex-col items-center ${
                    tempProfile.palette === opt.value
                      ? "ring-2 ring-primary border-primary"
                      : "hover:border-primary"
                  }`}
                  style={{ backgroundColor: "#fff", borderColor: opt.color }}
                >
                  <span
                    className="block w-7 h-7 rounded-full mb-1"
                    style={{
                      background: opt.color,
                      border: tempProfile.palette === opt.value ? "2px solid #333" : "1px solid #aaa",
                      boxShadow: tempProfile.palette === opt.value ? "0 0 0 2px #009fef4d" : undefined,
                    }}
                  />
                  <span className="text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
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
