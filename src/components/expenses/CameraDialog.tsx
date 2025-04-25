
import { useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CameraDialogProps {
  onCapture: (file: File) => void;
  disabled?: boolean;
}

export function CameraDialog({ onCapture, disabled }: CameraDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      setIsDialogOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
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
        onCapture(file);
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
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="default"
          onClick={startCamera}
          disabled={disabled}
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
  );
}
