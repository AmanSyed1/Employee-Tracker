import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import { getCurrentUserRole, loginUser, logoutUser } from "../services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"admin" | "employee" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const r = await getCurrentUserRole();
          setRole(r);
        } catch (error) {
          console.error("Failed to fetch role:", error);
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    console.log("[Auth] Central logout called: Clearing session data");
    try {
      await AsyncStorage.multiRemove(["userToken", "userRole"]);
    } catch (e) {
      console.error("Failed to clear AsyncStorage", e);
    }
    await logoutUser();
  };

  return { user, role, loading, login: loginUser, logout: handleLogout };
};
