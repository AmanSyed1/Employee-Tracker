import { addDoc, collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export type AppEvent = {
  id?: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location?: string;
  assignedEmployees: string[]; // Array of user UIDs
};

export const createEvent = async (event: Omit<AppEvent, "id">) => {
  await addDoc(collection(db, "events"), {
    ...event,
    createdAt: serverTimestamp(),
  });
};

export const assignEmployeesToEvent = async (eventId: string, employeeUids: string[]) => {
  await updateDoc(doc(db, "events", eventId), {
    assignedEmployees: employeeUids
  });
};
