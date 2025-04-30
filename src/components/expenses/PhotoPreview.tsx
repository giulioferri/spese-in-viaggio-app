
import { Button } from "@/components/ui/button";

interface PhotoPreviewProps {
  photoUrl: string;
  onRemove: () => void;
  disabled?: boolean;
}

export function PhotoPreview({ photoUrl, onRemove, disabled }: PhotoPreviewProps) {
  return (
    <div className="relative w-full">
      <img
        src={photoUrl}
        alt="Anteprima scontrino"
        className="mx-auto max-h-48 rounded-md object-contain cursor-pointer"
        onClick={() => window.open(photoUrl, '_blank')}
      />
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
