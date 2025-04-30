
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface PhotoPreviewProps {
  photoUrl: string;
  onRemove: () => void;
  disabled?: boolean;
}

export function PhotoPreview({ photoUrl, onRemove, disabled }: PhotoPreviewProps) {
  const [imageError, setImageError] = useState(false);
  
  const handleImageError = () => {
    console.error("Errore nel caricamento dell'immagine:", photoUrl);
    setImageError(true);
  };

  const handleImageClick = () => {
    if (photoUrl && !imageError) {
      window.open(photoUrl, '_blank');
    }
  };
  
  return (
    <div className="relative w-full">
      {imageError ? (
        <div className="mx-auto h-48 rounded-md bg-gray-200 flex items-center justify-center">
          <p className="text-sm text-gray-500">Immagine non disponibile</p>
        </div>
      ) : (
        <img
          src={photoUrl}
          alt="Anteprima scontrino"
          className="mx-auto max-h-48 rounded-md object-contain cursor-pointer"
          onClick={handleImageClick}
          onError={handleImageError}
        />
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="absolute top-2 right-2 bg-white"
        onClick={onRemove}
        disabled={disabled}
      >
        Cambia
      </Button>
    </div>
  );
}
