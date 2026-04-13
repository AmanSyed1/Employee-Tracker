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
import { getUsedSickLeavesThisMonth } from "../services/leaveService";

export const useAttendance = (uid: string | undefined) => {
  const [checkInTime, setCheckInTime] = useState<string>("NA");
  const [checkOutTime, setCheckOutTime] = useState<string>("NA");
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
      } else {
        setCheckInTime("NA");
        setCheckOutTime("NA");
      }

      const yesterday = await getYesterdayAttendance(uid);
      setYesterdayStatus(yesterday.status);

      const month = await getMonthlyAttendance(uid);
      const leaveCount = await getUsedSickLeavesThisMonth(uid);
      
      setMonthlyStats({
        present: month.present,
        halfDay: month.halfDay,
        absent: month.absent,
        leaves: leaveCount,
      });
      setMonthlyTotal(month.totalWorkingDays);

      const week = await getWeeklyAttendance(uid);
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
