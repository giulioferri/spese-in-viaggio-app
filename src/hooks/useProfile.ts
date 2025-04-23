
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Simple profile shape
export type UserProfile = {
  id?: string;
  photo?: string; // URL
  palette: "default" | "green" | "red";
};

// Create Supabase client with proper error handling for environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables are missing. Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.");
}

// Initialize Supabase with fallback for development
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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

  // Load profile from Supabase on component mount
  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        // Usa sempre Supabase se disponibile
        if (!supabase) {
          setProfileState(getStoredProfile());
          setIsLoading(false);
          return;
        }

        // Recupera profilo dalla tabella "profiles"
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
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
          // Se non esiste ancora, crea un nuovo profilo
          const localProfile = getStoredProfile();
          const { error: createError } = await supabase
            .from("profiles")
            .insert({
              id: userId,
              photo: localProfile.photo,
              palette: localProfile.palette,
            });
          if (createError) {
            setError(`Errore durante la creazione del profilo: ${createError.message}`);
          } else {
            setProfileState({ ...localProfile, id: userId });
          }
        }
      } catch (err) {
        setError(`Errore imprevisto: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [userId]);

  // Save profile to Supabase whenever it changes
  const setProfile = async (updater: UserProfile | ((p: UserProfile) => UserProfile)) => {
    const newProfile = typeof updater === "function" ? updater(profile) : updater;
    const updatedProfile = { ...newProfile, id: userId };
    setProfileState(updatedProfile);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));

    if (!supabase) return;

    let photoUrl = updatedProfile.photo;
    // Carica in Supabase Storage se è una data URL
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

        // Carica la foto sul bucket "profile_photos"
        const { error: uploadError } = await supabase.storage
          .from("profile_photos")
          .upload(fileName, blob, { cacheControl: "3600", upsert: true });

        // Correggiamo qui la verifica dell'errore rimuovendo la verifica di statusCode
        if (uploadError) {
          // Verifica se l'errore è diverso dal conflitto (409)
          // Il nome dell'errore o un messaggio specifico può essere controllato al posto del codice di stato
          if (uploadError.message !== 'The resource already exists') {
            throw new Error(`Errore durante il caricamento della foto: ${uploadError.message}`);
          }
        }

        // Ottieni l'URL pubblico
        const { data: urlData } = supabase.storage
          .from("profile_photos")
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          photoUrl = urlData.publicUrl;
        }
      } catch (err) {
        // Errore in upload: mantieni solo in localStorage
        console.error("Errore upload avatar:", err);
      }
    }

    // Aggiorna/crea record nella tabella "profiles"
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          photo: photoUrl,
          palette: updatedProfile.palette,
          updated_at: new Date().toISOString(),
        });
      if (updateError) {
        throw new Error(`Errore durante l'aggiornamento del profilo: ${updateError.message}`);
      }
      if (photoUrl !== updatedProfile.photo) {
        setProfileState((prev) => ({ ...prev, photo: photoUrl }));
      }
    } catch (err) {
      console.error("Errore nell'aggiornamento profilo:", err);
    }
  };

  return {
    profile,
    setProfile,
    isLoading,
    error,
  };
}
