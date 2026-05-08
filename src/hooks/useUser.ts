import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useState } from "react";
import { getUserProfile } from "../services/userService";

type UserProfile = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  profileImage?: string | null;
  role?: string;
};

export const useUser = (uid: string | undefined) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const loadUser = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const [userData, savedImage, savedProfileStr] = await Promise.all([
        getUserProfile(uid),
        AsyncStorage.getItem(`profileImage_${uid}`),
        AsyncStorage.getItem(`userProfile_${uid}`),
      ]);

      let parsedProfile = {};
      if (savedProfileStr) {
        try {
          parsedProfile = JSON.parse(savedProfileStr);
        } catch (e) {
          console.error("Error parsing userProfile JSON:", e);
        }
      }

      const merged: UserProfile = {
        ...(userData || {}),
        ...parsedProfile,
        profileImage: savedImage || (parsedProfile as any).profileImage || null,
      };

      // Ensure profile always includes: name, email, phone, department, profileImage
      merged.name = merged.name || "";
      merged.email = merged.email || "";
      merged.phone = merged.phone || "";
      merged.department = merged.department || "";
      merged.role = merged.role || "";

      setProfile(merged);
    } catch (error) {
      console.error("Failed to load user profile:", error);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  const updateProfileImage = useCallback(async (uri: string) => {
    if (!uid) return;
    try {
      await AsyncStorage.setItem(`profileImage_${uid}`, uri);
      setProfile((prev: any) => ({
        ...(prev || {}),
        profileImage: uri,
      }));
      console.log("PROFILE IMAGE updated:", uri);
    } catch (e) {
      console.log("Error saving image:", e);
    }
  }, [uid]);

  const updateUserProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!uid) return;
    setProfile((prev: any) => {
      const updatedProfile = {
        ...(prev || {}),
        ...data,
      };
      AsyncStorage.setItem(`userProfile_${uid}`, JSON.stringify(updatedProfile)).catch(err => {
        console.error("Failed to save updated profile to AsyncStorage:", err);
      });
      return updatedProfile;
    });
  }, [uid]);

  return { profile, loading, loadUser, updateProfileImage, updateUserProfile };
};
