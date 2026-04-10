import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

// Function to log in and get the user role
export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;
  const userDoc = await getDoc(doc(db, "users", uid));

  if (!userDoc.exists()) {
    throw new Error("No user role assigned to this account.");
  }

  return {
    user: userCredential.user,
    role: userDoc.data().role as "admin" | "employee",
  };
};

export const logoutUser = async () => {
  await signOut(auth);
};

// Gets role of currently logged in user
export const getCurrentUserRole = async () => {
  if (!auth.currentUser) return null;
  const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
  if (userDoc.exists()) {
    return userDoc.data().role as "admin" | "employee";
  }
  return null;
};
