
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Simple profile shape
export type UserProfile = {
  id?: string;
  photo?: string; // URL
  palette: "default" | "green" | "red";
};

const PROFILE_KEY = "spese-trasferta-profile";

// Retrieve profile from localStorage as fallback
export function getStoredProfile(): UserProfile {
  const data = localStorage.getItem(PROFILE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      //
    }
  }
  return { palette: "default" };
}

// Generate a unique ID for anonymous users
function getOrCreateUserId(): string {
  let userId = localStorage.getItem('anonymous_user_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('anonymous_user_id', userId);
  }
  return userId;
}

// This hook provides profile, setProfile, and functions to update parts
export function useProfile() {
  const [profile, setProfileState] = useState<UserProfile>(getStoredProfile());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = getOrCreateUserId();
  const { toast } = useToast();

  // Load profile from Supabase on component mount
  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        // Using raw query since the profiles table isn't in the TypeScript types yet
        const { data, error } = await (supabase as any)
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error && error.code !== "PGRST116") {
          setError(`Errore durante il caricamento del profilo: ${error.message}`);
        }

        if (data) {
          const supabaseProfile: UserProfile = {
            id: data.id,
            photo: data.photo,
            palette: data.palette || "default",
          };
          setProfileState(supabaseProfile);
          localStorage.setItem(PROFILE_KEY, JSON.stringify(supabaseProfile)); // Sync fallback
        } else {
          // If the profile doesn't exist yet, create a new one using upsert instead of insert
          const localProfile = getStoredProfile();
          const { error: upsertError } = await (supabase as any)
            .from('profiles')
            .upsert({
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
  }, [userId, toast]);

  // Save profile to Supabase whenever it changes
  const setProfile = async (updater: UserProfile | ((p: UserProfile) => UserProfile)) => {
    const newProfile = typeof updater === "function" ? updater(profile) : updater;
    const updatedProfile = { ...newProfile, id: userId };
    setProfileState(updatedProfile);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));

    let photoUrl = updatedProfile.photo;
    // Upload to Supabase Storage if it's a data URL
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

        // Upload the photo to the "profile_photos" bucket
        const { error: uploadError } = await supabase.storage
          .from("profile_photos")
          .upload(fileName, blob, { cacheControl: "3600", upsert: true });

        // Check for errors other than "resource already exists"
        if (uploadError) {
          if (uploadError.message !== 'The resource already exists') {
            toast({
              title: "Errore",
              description: `Errore durante il caricamento della foto: ${uploadError.message}`,
              variant: "destructive",
            });
            throw new Error(`Errore durante il caricamento della foto: ${uploadError.message}`);
          }
        }

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from("profile_photos")
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          photoUrl = urlData.publicUrl;
        }
      } catch (err) {
        // Error in upload: keep in localStorage only
        console.error("Errore upload avatar:", err);
      }
    }

    // Update/create record in the "profiles" table
    try {
      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .upsert({
          id: userId,
          photo: photoUrl,
          palette: updatedProfile.palette,
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
      if (photoUrl !== updatedProfile.photo) {
        setProfileState((prev) => ({ ...prev, photo: photoUrl }));
      }
    } catch (err) {
      console.error("Errore nell'aggiornamento profilo:", err);
      toast({
        title: "Errore",
        description: `Errore nell'aggiornamento profilo: ${err instanceof Error ? err.message : String(err)}`,
        variant: "destructive",
      });
    }
  };

  return {
    profile,
    setProfile,
    isLoading,
    error,
  };
}
