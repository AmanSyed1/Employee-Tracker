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
