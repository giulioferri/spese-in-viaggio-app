
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

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

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      setIsDialogOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Errore nell'accesso alla fotocamera");
    }
  };

  const handleCapture = () => {
    if (!videoRef) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.videoWidth;
    canvas.height = videoRef.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
        handlePhotoChange(file);
      }
      stopCamera();
    }, 'image/jpeg');
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsDialogOpen(false);
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
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="default"
                    onClick={startCamera}
                    disabled={isUploading || disabled}
                    className="w-full"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Scatta foto
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <div className="flex flex-col items-center space-y-4">
                    <video
                      ref={ref => {
                        setVideoRef(ref);
                        if (ref && stream) {
                          ref.srcObject = stream;
                          ref.play();
                        }
                      }}
                      autoPlay
                      playsInline
                      className="w-full rounded-lg"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleCapture} type="button">
                        Scatta
                      </Button>
                      <Button onClick={stopCamera} variant="outline" type="button">
                        Annulla
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
