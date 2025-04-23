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
        // Ensure we have a valid profile from localStorage as fallback
        const localProfile = getStoredProfile();
        
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error loading profile:", error);
          // On error, continue with local profile but don't show error to user
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
          const { error: upsertError } = await supabase.from("profiles").upsert({
            id: userId,
            photo: localProfile.photo,
            palette: localProfile.palette,
          });

          if (upsertError) {
            console.error("Error creating profile:", upsertError);
            // Continue with local profile but don't show error to user
          } else {
            setProfileState({ ...localProfile, id: userId });
            localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...localProfile, id: userId }));
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        // Don't show the error toast - just log it
        // Continue with the local profile from storage
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Salva il profilo su Supabase e localStorage
  const setProfile = async (updater: UserProfile | ((p: UserProfile) => UserProfile)) => {
    try {
      const currProfile = profile;
      const newProfile = typeof updater === "function" ? updater(currProfile) : updater;
      const updatedProfile: UserProfile = { ...newProfile, id: userId };

      // Update localStorage first to ensure we have a local copy
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
            console.error("Error uploading photo:", uploadError);
            // Continue with the data URL instead of showing an error
          } else {
            const { data: urlData } = supabase.storage
              .from("profile_photos")
              .getPublicUrl(fileName);
            if (urlData?.publicUrl) {
              photoUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;
            }
          }
        } catch (err) {
          // Keep the photo in localStorage only in case of error
          console.error("Avatar upload error:", err);
        }
      }

      // Update/create DB record
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
          console.error("Profile update error:", updateError);
          toast({
            title: "Attenzione",
            description: "Profilo aggiornato localmente, ma non è stato possibile sincronizzarlo",
            variant: "destructive",
          });
        } else {
          const validatedProfile: UserProfile = { ...updatedProfile, photo: photoUrl, palette: validatedPalette };
          setProfileState(validatedProfile);
          localStorage.setItem(PROFILE_KEY, JSON.stringify(validatedProfile));

          toast({
            title: "Successo",
            description: "Profilo aggiornato con successo",
          });
        }

        return true;
      } catch (err) {
        console.error("Profile update error:", err);
        toast({
          title: "Errore",
          description: "Non è stato possibile aggiornare il profilo online",
          variant: "destructive",
        });
        return false;
      }
    } catch (e) {
      console.error("Critical error in setProfile:", e);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento del profilo",
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
