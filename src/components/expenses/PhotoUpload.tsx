
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CameraDialog } from "./CameraDialog";
import { PhotoPreview } from "./PhotoPreview";

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

  const handlePhotoChange = async (file: File) => {
    setError("");
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoChange(file);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="photo">Foto della spesa</Label>
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4 bg-gray-50">
        {photoUrl ? (
          <PhotoPreview 
            photoUrl={photoUrl}
            onRemove={() => onPhotoUploaded("", undefined)}
            disabled={isUploading || disabled}
          />
        ) : (
          <div className="flex flex-col items-center text-center">
            <Image className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              Carica una foto della spesa
            </p>
            <div className="flex flex-col space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('photo-upload')?.click()}
                disabled={isUploading || disabled}
                className="w-full"
              >
                <Image className="mr-2 h-4 w-4" />
                Scegli foto
              </Button>
              <CameraDialog 
                onCapture={handlePhotoChange}
                disabled={isUploading || disabled}
              />
            </div>
            <Input
              id="photo-upload"
              type="file"
              accept="image/*"
              capture={undefined}
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading || disabled}
            />
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
