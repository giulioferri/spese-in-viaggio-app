
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PROFILE_KEY, getStoredProfile, validatePalette } from "./useProfileUtils";
import { UserProfile } from "./useProfile";

export function useProfileFetch(userId: string | null) {
  const [profile, setProfileState] = useState<UserProfile>(() => getStoredProfile());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!userId) return;
      setIsLoading(true);
      try {
        const localProfile = getStoredProfile();
        // Fetch profile from Supabase using UUID
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          setError(`Error loading profile: ${error.message}`);
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
          // Create a new profile if none exists
          const { error: upsertError } = await supabase.from("profiles").upsert({
            id: userId,
            photo: localProfile.photo,
            palette: localProfile.palette,
          });

          if (upsertError) {
            setError(`Error creating profile: ${upsertError.message}`);
          } else {
            setProfileState({ ...localProfile, id: userId });
            localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...localProfile, id: userId }));
          }
        }
      } catch (err) {
        setError(`Unexpected error: ${String(err)}`);
      } finally {
        setIsLoading(false);
      }
    }
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  return { profile, setProfileState, isLoading, error };
}
