import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAttendance } from "../hooks/useAttendance";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";

import { AttendanceButton } from "../components/AttendanceButton";
import { Header } from "../components/Header";
import { ConfirmModal } from "../components/ConfirmModal";
import { SummaryBox } from "../components/SummaryBox";
import { WeeklyAttendance } from "../components/WeeklyAttendance";
import { colors, radius, shadows, spacing } from "../theme/colors";
import { getCurrentMonthString, getTodayDateString } from "../utils/dateHelpers";

export const EmployeeDashboardScreen = () => {
  const { user, role, loading: authLoading, logout } = useAuth();
  const { profile, loadUser } = useUser(user?.uid);
  const {
    checkInTime, checkOutTime, todayStatus, yesterdayStatus, monthlyStats, weeklyData,
    loadAttendance, handleCheckIn, handleCheckOut, loading: attLoading
  } = useAttendance(user?.uid);

  const heroFadeAnim = useRef(new Animated.Value(0)).current;
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [checkOutModalVisible, setCheckOutModalVisible] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState("");
  const [toastSub, setToastSub] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastSlide = useRef(new Animated.Value(90)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, sub: string) => {
    // Cancel any in-flight dismiss timer
    if (toastTimer.current) clearTimeout(toastTimer.current);

    setToastMsg(msg);
    setToastSub(sub);
    setToastVisible(true);

    // Reset to offscreen-bottom before animating in
    toastSlide.setValue(90);
    toastOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(toastSlide,   { toValue: 0,  duration: 320, useNativeDriver: true }),
      Animated.timing(toastOpacity, { toValue: 1,  duration: 280, useNativeDriver: true }),
    ]).start();

    // Auto-dismiss after 2.8 s
    toastTimer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastSlide,   { toValue: 90, duration: 280, useNativeDriver: true }),
        Animated.timing(toastOpacity, { toValue: 0,  duration: 240, useNativeDriver: true }),
      ]).start(() => setToastVisible(false));
    }, 2800);
  };

  // Initial load — fires once when auth is ready
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/login");
        return;
      }

      if (role !== "employee") {
        router.replace("/login");
        return;
      }

      loadUser();
      loadAttendance();

      Animated.timing(heroFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [user, role, authLoading]);

  // Re-load profile every time this tab gains focus so the avatar
  // always reflects the latest image set in ProfileScreen
  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        loadUser();
      }
    }, [user?.uid, loadUser])
  );

  if (authLoading) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "white", padding: 20 }}>Loading...</Text>
      </View>
    );
  }

  const confirmLogout = () => {
    setLogoutModalVisible(true);
  };

  const handleLogoutConfirm = async () => {
    setLogoutModalVisible(false);
    await AsyncStorage.removeItem("authToken");
    await logout();
    router.replace("/login");
  };

  const handleCheckInConfirm = async () => {
    setCheckInModalVisible(false);
    await handleCheckIn();
    showToast("Checked in successfully", "Your attendance has been recorded.");
  };

  const handleCheckOutConfirm = async () => {
    setCheckOutModalVisible(false);
    await handleCheckOut();
    showToast("Checked out successfully", "Your workday has been completed.");
  };

  // "NA", "", null, undefined → no data
  const hasCheckIn  = !!checkInTime  && checkInTime  !== "NA";
  const hasCheckOut = !!checkOutTime && checkOutTime !== "NA";

  /**
   * getTodayStatus — derives the display-level status from the
   * AUTHORITATIVE todayStatus already computed by attendanceService.ts
   * using raw Firestore Timestamps.  We never re-parse formatted strings here.
   *
   * todayStatus values coming from the service:
   *   "Full Day"            → checked-in on time AND checked-out on time
   *   "Half Day"            → both punches exist but one missed the threshold
   *   "Slept in Office 😴" → only checkIn exists (still working)
   *   "Absent"              → no record at all
   */
  const getTodayStatusDisplay = (): {
    currentStatus: string;
    dayType: "Full Day" | "Half Day" | null;
  } => {
    if (!hasCheckIn && !hasCheckOut) {
      return { currentStatus: "Incomplete", dayType: null };
    }
    if (hasCheckIn && !hasCheckOut) {
      return { currentStatus: "Working", dayType: null };
    }
    // Both punches exist — trust the service-computed status
    if (todayStatus === "Full Day") {
      return { currentStatus: "Completed", dayType: "Full Day" };
    }
    return { currentStatus: "Completed", dayType: "Half Day" };
  };

  const { currentStatus, dayType } = getTodayStatusDisplay();

  const statusColor =
    currentStatus === "Completed" ? colors.status.success :
    currentStatus === "Working"   ? colors.status.warning :
    colors.text.secondary;

  return (
    <View style={styles.container}>
      <ConfirmModal
        visible={logoutModalVisible}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutModalVisible(false)}
      />
      <ConfirmModal
        visible={checkInModalVisible}
        title="Confirm Check In"
        message="Are you sure you want to check in for today?"
        confirmLabel="Check In"
        confirmColor={colors.status.success}
        onConfirm={handleCheckInConfirm}
        onCancel={() => setCheckInModalVisible(false)}
      />
      <ConfirmModal
        visible={checkOutModalVisible}
        title="Confirm Check Out"
        message="Are you sure you want to check out for today?"
        confirmLabel="Check Out"
        confirmColor={colors.primary}
        onConfirm={handleCheckOutConfirm}
        onCancel={() => setCheckOutModalVisible(false)}
      />
      <Header
        title={`Welcome, ${profile?.name || "Employee"}`}
        date={getTodayDateString()}
        profileImage={profile?.profileImage}
        onLogout={confirmLogout}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <Animated.View style={[styles.card, { marginTop: spacing.medium, opacity: heroFadeAnim, transform: [{ translateY: heroFadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.cardHeaderText}>Today's Status</Text>
          </View>

          <View style={styles.statusRowContainer}>
            <View style={styles.statusCol}>
              <Text style={styles.statusLabel}>Check In</Text>
              <Text style={styles.timeValue}>{checkInTime || "--:--"}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statusCol}>
              <Text style={styles.statusLabel}>Check Out</Text>
              <Text style={styles.timeValue}>{checkOutTime || "--:--"}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statusCol}>
              <Text style={styles.statusLabel}>Status</Text>
              <Text style={[styles.statusValue, { color: statusColor }]} numberOfLines={1}>
                {currentStatus}
              </Text>
              {dayType === "Full Day" && (
                <Text style={[styles.statusSub, { color: colors.status.success }]}>Full Day</Text>
              )}
              {dayType === "Half Day" && (
                <Text style={[styles.statusSub, { color: colors.status.warning }]}>Half Day</Text>
              )}
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ marginTop: spacing.medium, opacity: heroFadeAnim, transform: [{ translateY: heroFadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <AttendanceButton
            checkInTime={checkInTime}
            checkOutTime={checkOutTime}
            loading={attLoading}
            onCheckIn={() => setCheckInModalVisible(true)}
            onCheckOut={() => setCheckOutModalVisible(true)}
          />
        </Animated.View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.cardHeaderText}>Yesterday's Status</Text>
          </View>
          <Text style={styles.yesterdayStatusText}>{yesterdayStatus}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.cardHeaderText}>Attendance: {getCurrentMonthString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <SummaryBox value={monthlyStats.present} label="Present" bgColor="#064e3b" numColor="#22c55e" />
            <SummaryBox value={monthlyStats.halfDay} label="Half Day" bgColor="#451a03" numColor="#eab308" />
            <SummaryBox value={monthlyStats.absent} label="Absent" bgColor="#450a0a" numColor="#ef4444" />
            <SummaryBox value={monthlyStats.leaves} label="Leave" bgColor="#1f2937" numColor="#f3f4f6" />
          </View>
        </View>

        <WeeklyAttendance week={weeklyData} delay={600} />

      </ScrollView>

      {/* Success Toast — only mounted when visible to avoid ghost layout */}
      {toastVisible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            { opacity: toastOpacity, transform: [{ translateY: toastSlide }] },
          ]}
        >
          <View style={styles.toastIconCircle}>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.toastMsg}>{toastMsg}</Text>
            {toastSub ? <Text style={styles.toastSub}>{toastSub}</Text> : null}
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.large, paddingBottom: 60 },
  card: {
    marginTop: spacing.medium,
    backgroundColor: colors.cardBackground,
    padding: spacing.large,
    borderRadius: radius.large,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.small, marginBottom: spacing.medium },
  cardHeaderText: { color: colors.text.secondary, fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  statusRowContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusCol: { flex: 1, alignItems: "center", justifyContent: "center" },
  divider: { width: 1, height: 35, backgroundColor: "rgba(255,255,255,0.08)" },
  statusLabel: { color: colors.text.label, fontSize: 11, marginBottom: spacing.small, textTransform: "uppercase", letterSpacing: 0.5 },
  timeValue: { color: colors.text.primary, fontSize: 18, fontWeight: "bold" },
  statusValue: { color: colors.primary, fontSize: 14, fontWeight: "bold" },
  statusSub: { color: colors.text.secondary, fontSize: 10, marginTop: 2, fontWeight: "500" },
  yesterdayStatusText: { color: colors.text.primary, fontSize: 20, fontWeight: "bold" },
  summaryRow: { flexDirection: "row", gap: spacing.small, justifyContent: "space-between" },

  // Success Toast
  toast: {
    position: "absolute",
    bottom: 30,
    left: spacing.large,
    right: spacing.large,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.large,
    padding: spacing.large,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.medium,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    ...shadows.card,
  },
  toastIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(29, 185, 84, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  toastMsg: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "bold",
  },
  toastSub: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
});
