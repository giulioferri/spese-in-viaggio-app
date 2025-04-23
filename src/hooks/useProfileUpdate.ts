
import { supabase } from "@/integrations/supabase/client";
import { PROFILE_KEY, validatePalette } from "./useProfileUtils";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "./useProfile";

// Extracted updating/saving logic
export function useProfileUpdate(profile: UserProfile, setProfileState: (p: UserProfile) => void) {
  const { toast } = useToast();

  const setProfile = async (
    updater: UserProfile | ((p: UserProfile) => UserProfile),
    userId?: string | null
  ) => {
    if (!userId) {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il profilo: ID utente non disponibile",
        variant: "destructive",
      });
      return false;
    }

    try {
      const currProfile = profile;
      const newProfile = typeof updater === "function" ? updater(currProfile) : updater;
      const updatedProfile: UserProfile = { ...newProfile, id: userId };

      setProfileState(updatedProfile);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));
      let photoUrl = updatedProfile.photo;

      if (photoUrl && photoUrl.startsWith("data:image")) {
        try {
          const base64Data = photoUrl.split(",")[1];
          const fileType = photoUrl.split(";")[0].split(":")[1];
          const extension = fileType.split("/")[1];
          const byteCharacters = atob(base64Data);
          const byteArrays = [];
          for (let i = 0; i < byteCharacters.length; i++) {
            byteArrays.push(byteCharacters.charCodeAt(i));
          }
          const blob = new Blob([new Uint8Array(byteArrays)], { type: fileType });
          const fileName = `avatar-${userId}.${extension}`;
          // Assicuriamoci che il bucket esista
          try {
            await supabase.storage.createBucket('profile_photos', { public: true });
          } catch (bucketErr) {
            // ignore, bucket may already exist
          }
          const { error: uploadError } = await supabase.storage
            .from("profile_photos")
            .upload(fileName, blob, { cacheControl: "3600", upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from("profile_photos")
              .getPublicUrl(fileName);
            if (urlData?.publicUrl) {
              photoUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;
            }
          } else {
            toast({
              title: "Errore",
              description: `Errore durante il caricamento della foto: ${uploadError.message}`,
              variant: "destructive",
            });
          }
        } catch {
          toast({
            title: "Errore",
            description: "Errore durante il caricamento della foto",
            variant: "destructive",
          });
        }
      }

      try {
        const validatedPalette = validatePalette(updatedProfile.palette);
        const photoValue = photoUrl === undefined ? null : photoUrl;
        const { error: updateError } = await supabase
          .from("profiles")
          .upsert({
            id: userId,
            photo: photoValue,
            palette: validatedPalette,
            updated_at: new Date().toISOString(),
          });

        if (updateError) {
          toast({
            title: "Attenzione",
            description: "Profilo aggiornato localmente, ma non è stato possibile sincronizzarlo",
            variant: "destructive",
          });
        } else {
          const validatedProfile: UserProfile = { 
            ...updatedProfile, 
            photo: photoUrl,
            palette: validatedPalette 
          };
          setProfileState(validatedProfile);
          localStorage.setItem(PROFILE_KEY, JSON.stringify(validatedProfile));
          toast({
            title: "Successo",
            description: "Profilo aggiornato con successo",
          });
        }
        return true;
      } catch {
        toast({
          title: "Errore",
          description: "Non è stato possibile aggiornare il profilo online",
          variant: "destructive",
        });
        return false;
      }
    } catch {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento del profilo",
        variant: "destructive",
      });
      return false;
    }
  };

  return setProfile;
}
