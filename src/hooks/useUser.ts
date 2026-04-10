import { useState, useCallback } from "react";
import { getUserProfile } from "../services/userService";

export const useUser = (uid: string | undefined) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadUser = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const data = await getUserProfile(uid);
      setProfile(data);
    } catch (error) {
      console.error("Failed to load user profile:", error);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  return { profile, loading, loadUser };
};
