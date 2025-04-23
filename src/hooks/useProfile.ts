
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  PROFILE_KEY,
  getStoredProfile, 
  getOrCreateUserId, 
  validatePalette 
} from "./useProfileUtils";

// Simple profile shape
export type UserProfile = {
  id?: string;
  photo?: string; // URL
  palette: "default" | "green" | "red";
};

// Questo hook fornisce profile, setProfile e funzioni per aggiornarlo
export function useProfile() {
  const [profile, setProfileState] = useState<UserProfile>(() => getStoredProfile());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = getOrCreateUserId();
  const { toast } = useToast();

  // Carica il profilo da Supabase quando il componente viene montato
  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          setError(`Errore durante il caricamento del profilo: ${error.message}`);
          toast({
            title: "Errore",
            description: `Errore durante il caricamento del profilo: ${error.message}`,
            variant: "destructive",
          });
        }

        if (data) {
          const supabaseProfile: UserProfile = {
            id: data.id,
            photo: data.photo ?? undefined,
            palette: validatePalette(data.palette),
          };
          setProfileState(supabaseProfile);
          localStorage.setItem(PROFILE_KEY, JSON.stringify(supabaseProfile));
        } else {
          // Se non esiste, creo il nuovo profilo
          const localProfile = getStoredProfile();
          const { error: upsertError } = await supabase.from("profiles").upsert({
            id: userId,
            photo: localProfile.photo,
            palette: localProfile.palette,
          });

          if (upsertError) {
            setError(`Errore durante la creazione del profilo: ${upsertError.message}`);
            toast({
              title: "Errore",
              description: `Errore durante la creazione del profilo: ${upsertError.message}`,
              variant: "destructive",
            });
          } else {
            setProfileState({ ...localProfile, id: userId });
            localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...localProfile, id: userId }));
          }
        }
      } catch (err) {
        setError(`Errore imprevisto: ${err instanceof Error ? err.message : String(err)}`);
        toast({
          title: "Errore",
          description: `Errore imprevisto: ${err instanceof Error ? err.message : String(err)}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Salva il profilo su Supabase e localStorage
  const setProfile = async (updater: UserProfile | ((p: UserProfile) => UserProfile)) => {
    const currProfile = profile;
    const newProfile = typeof updater === "function" ? updater(currProfile) : updater;
    const updatedProfile: UserProfile = { ...newProfile, id: userId };

    setProfileState(updatedProfile);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));

    let photoUrl = updatedProfile.photo;

    // Se la foto profilo è una data URL, effettua upload su Supabase Storage
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

        const { error: uploadError } = await supabase.storage
          .from("profile_photos")
          .upload(fileName, blob, { cacheControl: "3600", upsert: true });

        if (uploadError && uploadError.message !== "The resource already exists") {
          toast({
            title: "Errore",
            description: `Errore durante il caricamento della foto: ${uploadError.message}`,
            variant: "destructive",
          });
          throw new Error(`Errore durante il caricamento della foto: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from("profile_photos")
          .getPublicUrl(fileName);
        if (urlData?.publicUrl) {
          photoUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;
        }
      } catch (err) {
        // Tieni comunque la foto solo in localStorage in caso di errore
        console.error("Errore upload avatar:", err);
      }
    }

    // Aggiorna/crea il record nel DB
    try {
      const validatedPalette = validatePalette(updatedProfile.palette);

      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          photo: photoUrl,
          palette: validatedPalette,
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        toast({
          title: "Errore",
          description: `Errore durante l'aggiornamento del profilo: ${updateError.message}`,
          variant: "destructive",
        });
        throw new Error(`Errore durante l'aggiornamento del profilo: ${updateError.message}`);
      }

      const validatedProfile: UserProfile = { ...updatedProfile, photo: photoUrl, palette: validatedPalette };
      setProfileState(validatedProfile);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(validatedProfile));

      toast({
        title: "Successo",
        description: "Profilo aggiornato con successo",
      });

      return true;
    } catch (err) {
      toast({
        title: "Errore",
        description: `Errore nell'aggiornamento profilo: ${err instanceof Error ? err.message : String(err)}`,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    profile,
    setProfile,
    isLoading,
    error,
  };
}
