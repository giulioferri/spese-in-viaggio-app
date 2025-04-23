
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
        // If Supabase is not available, use localStorage only
        if (!supabase) {
          console.warn("Supabase connection not available. Using localStorage only.");
          setProfileState(getStoredProfile());
          setIsLoading(false);
          return;
        }

        // Try to fetch profile from Supabase
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 means no rows returned, which is expected for new users
          console.error("Error fetching profile:", error);
          setError(`Errore durante il caricamento del profilo: ${error.message}`);
        }

        if (data) {
          // If profile exists in Supabase, use it
          const supabaseProfile: UserProfile = {
            id: data.id,
            photo: data.photo,
            palette: data.palette || "default"
          };
          setProfileState(supabaseProfile);
        } else {
          // If no profile in Supabase, create one with local data
          const localProfile = getStoredProfile();
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              photo: localProfile.photo,
              palette: localProfile.palette
            });

          if (createError) {
            console.error("Error creating profile:", createError);
            setError(`Errore durante la creazione del profilo: ${createError.message}`);
          } else {
            setProfileState({ ...localProfile, id: userId });
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError(`Errore imprevisto: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [userId]);

  // Save profile to Supabase whenever it changes
  const setProfile = async (updater: UserProfile | ((p: UserProfile) => UserProfile)) => {
    const newProfile = typeof updater === "function" 
      ? updater(profile) 
      : updater;
    
    // Always keep ID consistent
    const updatedProfile = { ...newProfile, id: userId };
    
    // Update local state immediately for responsiveness
    setProfileState(updatedProfile);
    
    // Persist to localStorage as fallback
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));
    
    try {
      // Skip Supabase operations if not available
      if (!supabase) {
        console.warn("Supabase connection not available. Profile saved to localStorage only.");
        return;
      }
      
      // Upload photo to Supabase storage if it's a data URL
      let photoUrl = updatedProfile.photo;
      if (photoUrl && photoUrl.startsWith('data:image')) {
        // Extract base64 data and file type
        const base64Data = photoUrl.split(',')[1];
        const fileType = photoUrl.split(';')[0].split(':')[1];
        const extension = fileType.split('/')[1];
        
        // Convert base64 to Blob
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArrays.push(byteCharacters.charCodeAt(i));
        }
        
        const blob = new Blob([new Uint8Array(byteArrays)], { type: fileType });
        const fileName = `avatar-${userId}-${Date.now()}.${extension}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('profile_photos')
          .upload(fileName, blob, {
            cacheControl: '3600',
            upsert: true,
          });
        
        if (uploadError) {
          console.error("Error uploading photo:", uploadError);
          throw new Error(`Errore durante il caricamento della foto: ${uploadError.message}`);
        }
        
        // Get public URL of the uploaded image
        const { data: urlData } = supabase
          .storage
          .from('profile_photos')
          .getPublicUrl(fileName);
        
        photoUrl = urlData.publicUrl;
      }
      
      // Update Supabase profile record
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          photo: photoUrl,
          palette: updatedProfile.palette,
          updated_at: new Date().toISOString()
        });
      
      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw new Error(`Errore durante l'aggiornamento del profilo: ${updateError.message}`);
      }
      
      // Update state with the storage URL if it changed
      if (photoUrl !== updatedProfile.photo) {
        setProfileState(prev => ({ ...prev, photo: photoUrl }));
      }
      
    } catch (err) {
      console.error("Error in setProfile:", err);
      // Keep using the local state even if Supabase update failed
      // We could also set an error state here if needed
    }
  };

  return { 
    profile, 
    setProfile, 
    isLoading, 
    error 
  };
}
