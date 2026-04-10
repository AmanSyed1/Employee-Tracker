import { doc, setDoc, updateDoc, serverTimestamp, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { getTodayId, isLate, isEarly } from "../utils/dateHelpers";

export const markAttendance = async (uid: string) => {
  const ref = doc(db, "attendance", uid, "records", getTodayId());
  await setDoc(ref, { checkIn: serverTimestamp(), checkOut: null }, { merge: true });
};

export const markCheckout = async (uid: string) => {
  const ref = doc(db, "attendance", uid, "records", getTodayId());
  await updateDoc(ref, { checkOut: serverTimestamp() });
};

export const getTodayAttendance = async (uid: string) => {
  const ref = doc(db, "attendance", uid, "records", getTodayId());
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const { checkIn, checkOut } = snap.data();
  let status = "Absent";

  if (checkIn && checkOut) {
    status = !isLate(checkIn.toDate()) && !isEarly(checkOut.toDate()) ? "Full Day" : "Half Day";
  } else if (checkIn) {
    status = "Slept in Office 😴";
  } else if (checkOut) {
    status = "Woke up in Office 😳";
  }

  return { checkIn, checkOut, status };
};

export const getYesterdayAttendance = async (uid: string) => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);

  const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const ref = doc(db, "attendance", uid, "records", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return { status: "Absent" };

  const { checkIn, checkOut } = snap.data();
  let status = "Absent";

  if (checkIn && checkOut) {
    status = !isLate(checkIn.toDate()) && !isEarly(checkOut.toDate()) ? "Full Day" : "Half Day";
  } else if (checkIn) {
    status = "Slept in Office 😴";
  } else if (checkOut) {
    status = "Woke up in Office 😴";
  }

  return { status };
};

export const getMonthlyAttendance = async (uid: string) => {
  const snap = await getDocs(collection(db, "attendance", uid, "records"));
  const now = new Date();
  let workedDays = 0;
  let totalWorkingDays = 0;

  snap.docs.forEach((d) => {
    const [y, m, da] = d.id.split("-").map(Number);
    const date = new Date(y, m - 1, da);

    if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() && date.getDay() !== 0) {
      totalWorkingDays++;
      if (d.data().checkIn || d.data().checkOut) workedDays++;
    }
  });

  return { workedDays, totalWorkingDays };
};

export const getWeeklyAttendance = async (uid: string) => {
  const snap = await getDocs(collection(db, "attendance", uid, "records"));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monday = new Date(today);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);

  const week: { day: string; color: string }[] = [];

  for (let i = 0; i < 6; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const id = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const record = snap.docs.find((d) => d.id === id)?.data();

    let color = "#9ca3af"; // default future day color

    if (date <= today) {
      if (!record) color = "#ef4444"; // Absent
      else if (record.checkIn && record.checkOut) {
        color = !isLate(record.checkIn.toDate()) && !isEarly(record.checkOut.toDate()) ? "#22c55e" : "#eab308";
      } else {
        color = "#3b82f6";
      }
    }

    week.push({
      day: date.toLocaleDateString("en-IN", { weekday: "short" }),
      color,
    });
  }

  return week;
};
