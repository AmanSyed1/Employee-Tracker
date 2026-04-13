import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAMV9xqRSirSoUpFbPUURnW4Ew9hkNnbBE",
  authDomain: "eventmanagementapp-53253.firebaseapp.com",
  projectId: "eventmanagementapp-53253",
  storageBucket: "eventmanagementapp-53253.firebasestorage.app",
  messagingSenderId: "956660501997",
  appId: "1:956660501997:web:c8d9dd539a57143e32abe4"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
