
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  PROFILE_KEY,
  getStoredProfile, 
  getOrCreateUserId, 
  validatePalette 
} from "./useProfileUtils";

export type UserProfile = {
  id?: string; // UUID as string
  photo?: string;
  palette: "default" | "green" | "red";
};

export function useProfile() {
  const [profile, setProfileState] = useState<UserProfile>(() => getStoredProfile());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ora l'ID utente è sempre un UUID
  const userId = getOrCreateUserId();
  const { toast } = useToast();

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const localProfile = getStoredProfile();

        // Fetch profile from Supabase using UUID
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error loading profile:", error);
          setError(`Error loading profile: ${error.message}`);
        }

        if (data) {
          console.log("Profile loaded from Supabase:", data);
          const supabaseProfile: UserProfile = {
            id: data.id,
            photo: data.photo ?? undefined,
            palette: validatePalette(data.palette),
          };
          setProfileState(supabaseProfile);
          localStorage.setItem(PROFILE_KEY, JSON.stringify(supabaseProfile));
        } else {
          console.log("No profile found, creating new one with ID:", userId);
          // Create a new profile if none exists
          const { error: upsertError } = await supabase.from("profiles").upsert({
            id: userId,
            photo: localProfile.photo,
            palette: localProfile.palette,
          });

          if (upsertError) {
            console.error("Error creating profile:", upsertError);
            setError(`Error creating profile: ${upsertError.message}`);
          } else {
            console.log("New profile created successfully");
            setProfileState({ ...localProfile, id: userId });
            localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...localProfile, id: userId }));
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError(`Unexpected error: ${String(err)}`);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [userId]);

  const setProfile = async (updater: UserProfile | ((p: UserProfile) => UserProfile)) => {
    try {
      const currProfile = profile;
      const newProfile = typeof updater === "function" ? updater(currProfile) : updater;
      const updatedProfile: UserProfile = { ...newProfile, id: userId };

      setProfileState(updatedProfile);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));
      let photoUrl = updatedProfile.photo;

      // Upload avatar if data URL
      if (photoUrl && photoUrl.startsWith("data:image")) {
        try {
          console.log("Uploading profile photo...");
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
            toast({
              title: "Errore",
              description: `Errore durante il caricamento della foto: ${uploadError.message}`,
              variant: "destructive",
            });
          } else {
            console.log("Photo uploaded successfully");
            const { data: urlData } = supabase.storage
              .from("profile_photos")
              .getPublicUrl(fileName);
            if (urlData?.publicUrl) {
              photoUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;
              console.log("Photo public URL:", photoUrl);
            }
          }
        } catch (err) {
          console.error("Avatar upload error:", err);
          toast({
            title: "Errore",
            description: "Errore durante il caricamento della foto",
            variant: "destructive",
          });
        }
      } else if (photoUrl === undefined) {
        console.log("Removing profile photo");
      } else {
        console.log("Using existing photo URL:", photoUrl);
      }

      try {
        const validatedPalette = validatePalette(updatedProfile.palette);
        const photoValue = photoUrl === undefined ? null : photoUrl;

        console.log("Saving profile to Supabase:", {
          id: userId,
          photo: photoValue,
          palette: validatedPalette
        });

        const { error: updateError } = await supabase
          .from("profiles")
          .upsert({
            id: userId,
            photo: photoValue,
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
          console.log("Profile updated successfully in Supabase");
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
