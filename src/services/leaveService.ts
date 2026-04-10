import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export type LeaveRequest = {
  id?: string;
  uid: string;
  employeeName: string;
  date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
};

// Request Sick Leave
export const requestSickLeave = async (uid: string, date: string, reason: string) => {
  const userSnap = await getDoc(doc(db, "users", uid));
  const employeeName = userSnap.exists() ? userSnap.data().name : "Unknown";

  await addDoc(collection(db, "sick_leaves"), {
    uid,
    employeeName,
    date,
    reason,
    status: "pending",
    createdAt: serverTimestamp(),
  });
};

// Count Used Sick Leaves (Current Month)
export const getUsedSickLeavesThisMonth = async (uid: string) => {
  const snap = await getDocs(collection(db, "sick_leaves"));
  const now = new Date();
  let count = 0;

  snap.docs.forEach((d) => {
    const data = d.data();
    if (data.uid !== uid) return;

    const [y, m] = data.date.split("-").map(Number);
    if (y === now.getFullYear() && m - 1 === now.getMonth()) {
      count++;
    }
  });

  return count;
};

// Employee: Get all sick leaves (Current Month)
export const getMySickLeavesThisMonth = async (uid: string) => {
  const snap = await getDocs(collection(db, "sick_leaves"));
  const now = new Date();
  const result: LeaveRequest[] = [];

  snap.docs.forEach((d) => {
    const data = d.data() as LeaveRequest;
    if (data.uid !== uid) return;

    const [y, m] = data.date.split("-").map(Number);
    if (y === now.getFullYear() && m - 1 === now.getMonth()) {
      result.push({
        id: d.id,
        uid: data.uid,
        employeeName: data.employeeName,
        date: data.date,
        reason: data.reason,
        status: data.status,
      });
    }
  });

  return result;
};

// Admin: Get Pending Leave Requests
export const loadPendingLeaves = async () => {
  const snap = await getDocs(collection(db, "sick_leaves"));
  const result: LeaveRequest[] = [];

  snap.docs.forEach((d) => {
    const data = d.data() as LeaveRequest;
    if (data.status !== "pending") return;

    result.push({
      id: d.id,
      uid: data.uid,
      employeeName: data.employeeName,
      date: data.date,
      reason: data.reason,
      status: data.status,
    });
  });

  return result;
};

// Admin: Update Leave Status
export const updateLeaveStatus = async (id: string, status: "approved" | "rejected") => {
  await updateDoc(doc(db, "sick_leaves", id), { status });
};
