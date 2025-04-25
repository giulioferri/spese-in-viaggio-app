
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

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

  const handleCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      // Crea un canvas per catturare l'immagine
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      // Converte il canvas in un file
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
          handlePhotoChange(file);
        }
        
        // Chiudi lo stream della fotocamera
        stream.getTracks().forEach(track => track.stop());
      }, 'image/jpeg');

    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Errore nell'accesso alla fotocamera");
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
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('photo-upload')?.click()}
                disabled={isUploading || disabled}
              >
                <Image className="mr-2 h-4 w-4" />
                Scegli foto
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={handleCapture}
                disabled={isUploading || disabled}
              >
                <Camera className="mr-2 h-4 w-4" />
                Scatta foto
              </Button>
            </div>
            <Input
              id="photo-upload"
              type="file"
              accept="image/*"
              capture="environment"
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
