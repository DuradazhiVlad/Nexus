import React from "react";
import { useProfileEdit } from "../../context/ProfileEditContext";
import { AvatarSection } from "./AvatarSection";
import { FriendsSection } from "./FriendsSection";
import { MediaSection } from "./MediaSection";

export const LeftColumn: React.FC = () => {
  const { profile } = useProfileEdit();

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <AvatarSection />
      <FriendsSection />
      <MediaSection />
    </div>
  );
};
