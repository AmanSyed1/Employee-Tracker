// Returns the current date as an ID string (e.g., "YYYY-MM-DD")
export const getTodayId = () => new Date().toISOString().split("T")[0];

// Checks if a check-in time is late (after 10:00 AM)
export const isLate = (d: Date) => {
  const t = new Date(d);
  t.setHours(10, 0, 0, 0);
  return d > t;
};

// Checks if a check-out time is early (before 6:00 PM)
export const isEarly = (d: Date) => {
  const t = new Date(d);
  t.setHours(18, 0, 0, 0);
  return d < t;
};

// Formats a firestore timestamp or date object to AM/PM local string
export const formatTime = (ts: any) =>
  ts && ts.toDate
    ? ts.toDate().toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : ts
    ? new Date(ts).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "NA";

export const getTodayDateString = () =>
  new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const getCurrentMonthString = () =>
  new Date().toLocaleDateString("en-IN", {
    month: "long",
  });

/**
 * Canonical attendance status for a single date.
 *
 * Priority order (matches business rules):
 *   1. Sunday             → "Weekend"
 *   2. Attendance record exists (checkIn + checkOut) → "Full Day" | "Half Day"
 *   3. Attendance record exists (checkIn only)       → "Half Day" (still working / incomplete)
 *   4. No attendance record + approved leave         → "Leave"
 *   5. No attendance record + no leave               → "Absent"
 *
 * @param dateStr      "YYYY-MM-DD"
 * @param attendanceRecord  raw Firestore doc data or undefined/null
 * @param approvedLeaveDates  Set of "YYYY-MM-DD" strings for approved leaves
 */
export type DayStatus = "Full Day" | "Half Day" | "Leave" | "Absent" | "Weekend" | "Working";

export const getAttendanceStatusForDate = (
  dateStr: string,
  attendanceRecord: Record<string, any> | null | undefined,
  approvedLeaveDates: Set<string>
): DayStatus => {
  const date = new Date(dateStr + "T00:00:00");

  // Rule 1 — Sunday is always Weekend
  if (date.getDay() === 0) return "Weekend";

  if (attendanceRecord) {
    const { checkIn, checkOut } = attendanceRecord;
    if (checkIn && checkOut) {
      return !isLate(checkIn.toDate()) && !isEarly(checkOut.toDate())
        ? "Full Day"
        : "Half Day";
    }
    // Only checkIn exists — still working or forgot to check out
    if (checkIn) return "Working";
  }

  // No attendance record
  if (approvedLeaveDates.has(dateStr)) return "Leave";

  return "Absent";
};
