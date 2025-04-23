
import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Image } from "lucide-react";

type Props = {
  photo?: string;
  onChangePhoto: (dataUrl: string | undefined) => void;
};

export default function ProfileAvatarSection({ photo, onChangePhoto }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) {
          onChangePhoto(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    onChangePhoto(undefined);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center">
      <Avatar className="w-20 h-20 mb-1">
        {photo ? (
          <AvatarImage src={photo} alt="Foto profilo" />
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
        {photo !== undefined && (
          <Button size="sm" variant="ghost" onClick={handleRemovePhoto}>
            Rimuovi
          </Button>
        )}
      </div>
    </div>
  );
}

