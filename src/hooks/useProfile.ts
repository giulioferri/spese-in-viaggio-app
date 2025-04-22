
import { useEffect, useState } from "react";

// Simple profile shape
export type UserProfile = {
  photo?: string; // base64 or URL
  palette: "default" | "green" | "red";
};

const PROFILE_KEY = "spese-trasferta-profile";

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

// This hook provides profile, setProfile, and a helper to update parts
export function useProfile() {
  const [profile, setProfileState] = useState<UserProfile>(getStoredProfile());

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  const setProfile = (updater: UserProfile | ((p: UserProfile) => UserProfile)) => {
    setProfileState(prev =>
      typeof updater === "function" ? updater(prev) : updater
    );
  };

  return { profile, setProfile };
}
