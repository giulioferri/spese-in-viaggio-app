
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PhotoUploadProps {
  location: string;
  date: string;
  photoUrl: string;
  onPhotoUploaded: (url: string, path: string | undefined) => void;
  disabled?: boolean;
}

function generateId() {
  return crypto.randomUUID();
}

export function PhotoUpload({ location, date, photoUrl, onPhotoUploaded, disabled }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("L'immagine è troppo grande (max 10MB)");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Il file selezionato non è un'immagine");
      return;
    }

    try {
      setIsUploading(true);
      const ext = file.name.split('.').pop() || "jpg";
      const newId = generateId();
      const filename = `scontrino-${newId}.${ext}`;
      const filePath = `${location}/${date}/${filename}`;

      const { data, error: uploadError } = await supabase
        .storage
        .from("expense_photos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        if (uploadError.message.includes("Permission denied")) {
          setError("Errore di permesso: assicurati di aver effettuato il login");
        } else {
          setError("Errore nel caricamento dell'immagine");
        }
        return;
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from("expense_photos").getPublicUrl(filePath);

      onPhotoUploaded(publicUrl, filePath);
    } catch (err) {
      console.error("Error during upload:", err);
      setError("Errore nel caricamento della foto");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="photo">Foto della spesa</Label>
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4 bg-gray-50">
        {photoUrl ? (
          <div className="relative w-full">
            <img
              src={photoUrl}
              alt="Anteprima scontrino"
              className="mx-auto max-h-48 rounded-md object-contain"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 bg-white"
              onClick={() => onPhotoUploaded("", undefined)}
              disabled={isUploading || disabled}
            >
              Cambia
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <Camera className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              Carica una foto della spesa
            </p>
            <Label
              htmlFor="photo-upload"
              className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {isUploading ? "Caricamento..." : "Scegli foto"}
            </Label>
            <Input
              id="photo-upload"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoChange}
              disabled={isUploading || disabled}
            />
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
