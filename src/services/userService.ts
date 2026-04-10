import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export const getUserProfile = async (uid: string) => {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) return null;
  return { id: userDoc.id, ...userDoc.data() };
};
