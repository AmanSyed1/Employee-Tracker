import { doc, setDoc, updateDoc, serverTimestamp, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { getTodayId, isLate, isEarly, getAttendanceStatusForDate } from "../utils/dateHelpers";

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

/**
 * Builds a complete monthly summary by iterating ALL calendar days in the
 * current month — not just Firestore records. Days with no record are
 * cross-checked against the approved leave set before being marked Absent.
 *
 * @param uid                 employee user ID
 * @param approvedLeaveDates  pre-fetched Set<"YYYY-MM-DD"> of approved leaves
 */
export const getMonthlyAttendance = async (
  uid: string,
  approvedLeaveDates: Set<string>
) => {
  // Pre-fetch all attendance records for this user (one Firestore call)
  const snap = await getDocs(collection(db, "attendance", uid, "records"));
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // Build a lookup map: "YYYY-MM-DD" → raw Firestore doc data
  const recordMap = new Map<string, Record<string, any>>();
  snap.docs.forEach((d) => recordMap.set(d.id, d.data()));

  let present = 0;
  let halfDay = 0;
  let absent = 0;
  let leaves = 0;
  let totalWorkingDays = 0;

  // Total days in the current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Only count up to today (don't penalise future dates)
  const todayDate = now.getDate();

  for (let day = 1; day <= Math.min(daysInMonth, todayDate); day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const record = recordMap.get(dateStr) ?? null;

    const status = getAttendanceStatusForDate(dateStr, record, approvedLeaveDates);

    if (status === "Weekend") continue; // Sundays excluded

    totalWorkingDays++;

    if (status === "Full Day")      present++;
    else if (status === "Half Day") halfDay++;
    else if (status === "Working")  halfDay++; // checked in but not out yet
    else if (status === "Leave")    leaves++;
    else if (status === "Absent")   absent++;
  }

  return { present, halfDay, absent, leaves, totalWorkingDays };
};

/**
 * Builds Mon–Sat week data using the SAME status logic as monthly.
 * Days with no attendance record are checked against the approved leave set
 * before being coloured red — approved leave shows grey instead.
 *
 * @param uid                 employee user ID
 * @param approvedLeaveDates  pre-fetched Set<"YYYY-MM-DD"> of approved leaves
 */
export const getWeeklyAttendance = async (
  uid: string,
  approvedLeaveDates: Set<string>
) => {
  const snap = await getDocs(collection(db, "attendance", uid, "records"));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monday = new Date(today);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);

  // Colour tokens — must match what WeeklyAttendance component expects
  const COLOR_PRESENT  = "#22c55e"; // green
  const COLOR_HALFDAY  = "#eab308"; // yellow
  const COLOR_ABSENT   = "#ef4444"; // red
  const COLOR_LEAVE    = "#9ca3af"; // grey  ← approved leave
  const COLOR_FUTURE   = "#223125"; // muted green (future days)
  const COLOR_WORKING  = "#3b82f6"; // blue  (checked in, not out)

  // Build lookup map from the already-fetched snapshot
  const recordMap = new Map<string, Record<string, any>>();
  snap.docs.forEach((d) => recordMap.set(d.id, d.data()));

  const week: { day: string; color: string }[] = [];

  for (let i = 0; i < 6; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const record = recordMap.get(dateStr) ?? null;

    let color = COLOR_FUTURE; // future day default

    if (date <= today) {
      const status = getAttendanceStatusForDate(dateStr, record, approvedLeaveDates);
      if (status === "Full Day")      color = COLOR_PRESENT;
      else if (status === "Half Day") color = COLOR_HALFDAY;
      else if (status === "Working")  color = COLOR_WORKING;
      else if (status === "Leave")    color = COLOR_LEAVE;
      else                            color = COLOR_ABSENT; // Absent
    }

    week.push({
      day: date.toLocaleDateString("en-IN", { weekday: "short" }),
      color,
    });
  }

  return week;
};
