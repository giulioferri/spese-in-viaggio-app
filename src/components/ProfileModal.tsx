
import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import ProfileModalLoader from "./ProfileModalLoader";
import ProfileModalError from "./ProfileModalError";
import ProfileModalContent from "./ProfileModalContent";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ProfileModal({ open, onOpenChange }: Props) {
  const { profile, setProfile, isLoading, error } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [needsReload, setNeedsReload] = useState(false);

  if (isLoading) {
    return <ProfileModalLoader open={open} onOpenChange={onOpenChange} />;
  }

  if (error) {
    return <ProfileModalError open={open} onOpenChange={onOpenChange} error={error} />;
  }

  return (
    <ProfileModalContent
      open={open}
      onOpenChange={onOpenChange}
      profile={profile}
      setProfile={setProfile}
      isSaving={isSaving}
      setIsSaving={setIsSaving}
      needsReload={needsReload}
      setNeedsReload={setNeedsReload}
    />
  );
}
