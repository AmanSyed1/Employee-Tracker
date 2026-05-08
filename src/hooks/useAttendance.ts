import { useState, useCallback } from "react";
import { formatTime } from "../utils/dateHelpers";
import {
  getTodayAttendance,
  getYesterdayAttendance,
  getMonthlyAttendance,
  getWeeklyAttendance,
  markAttendance,
  markCheckout,
} from "../services/attendanceService";
import { getApprovedLeaveDatesForMonth } from "../services/leaveService";

export const useAttendance = (uid: string | undefined) => {
  const [checkInTime, setCheckInTime] = useState<string>("NA");
  const [checkOutTime, setCheckOutTime] = useState<string>("NA");
  // Authoritative status computed from raw Firestore Timestamps — NOT re-parsed from strings
  const [todayStatus, setTodayStatus] = useState<string>("Absent");
  const [yesterdayStatus, setYesterdayStatus] = useState<string>("Absent");
  const [monthlyStats, setMonthlyStats] = useState({
    present: 0,
    halfDay: 0,
    absent: 0,
    leaves: 0,
  });
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [weeklyData, setWeeklyData] = useState<{ day: string; color: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAttendance = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const today = await getTodayAttendance(uid);
      if (today) {
        setCheckInTime(formatTime(today.checkIn));
        setCheckOutTime(formatTime(today.checkOut));
        // Persist the authoritatively-computed status (calculated from raw Timestamps)
        setTodayStatus(today.status);
      } else {
        setCheckInTime("NA");
        setCheckOutTime("NA");
        setTodayStatus("Absent");
      }

      const yesterday = await getYesterdayAttendance(uid);
      setYesterdayStatus(yesterday.status);

      // Fetch approved leave dates ONCE — reused by both monthly and weekly builders
      const now = new Date();
      const approvedLeaveDates = await getApprovedLeaveDatesForMonth(uid, now.getFullYear(), now.getMonth());

      // Monthly: now returns leaves count directly (no separate call needed)
      const month = await getMonthlyAttendance(uid, approvedLeaveDates);

      setMonthlyStats({
        present: month.present,
        halfDay: month.halfDay,
        absent: month.absent,
        leaves: month.leaves,
      });
      setMonthlyTotal(month.totalWorkingDays);

      // Weekly: uses the same leave data source
      const week = await getWeeklyAttendance(uid, approvedLeaveDates);
      setWeeklyData(week);
    } catch (error) {
      console.error("Error loading attendance:", error);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  const handleCheckIn = async () => {
    if (!uid) return;
    await markAttendance(uid);
    await loadAttendance();
  };

  const handleCheckOut = async () => {
    if (!uid) return;
    await markCheckout(uid);
    await loadAttendance();
  };

  return {
    checkInTime,
    checkOutTime,
    todayStatus,
    yesterdayStatus,
    monthlyStats,
    monthlyTotal,
    weeklyData,
    loading,
    loadAttendance,
    handleCheckIn,
    handleCheckOut,
  };
};
