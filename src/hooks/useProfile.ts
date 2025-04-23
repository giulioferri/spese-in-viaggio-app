
import { useEffect, useState } from "react";
import { getOrCreateUserId } from "./useProfileUtils";
import { useProfileFetch } from "./useProfileFetch";
import { useProfileUpdate } from "./useProfileUpdate";

export type UserProfile = {
  id?: string; // UUID as string
  photo?: string;
  palette: "default" | "green" | "red";
};

export function useProfile() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserId() {
      try {
        const id = await getOrCreateUserId();
        setUserId(id);
      } catch (err) {
        // silent error, handled in hook
      }
    }
    fetchUserId();
  }, []);

  // useProfileFetch returns { profile, setProfileState, isLoading, error }
  const {
    profile,
    setProfileState,
    isLoading,
    error,
  } = useProfileFetch(userId);

  // useProfileUpdate returns setProfile
  const setProfile = useProfileUpdate(profile, setProfileState);

  return {
    profile,
    setProfile: (updater: Parameters<typeof setProfile>[0]) => setProfile(updater, userId),
    isLoading,
    error,
  };
}
