import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Alert, TextInput, ScrollView, Platform, Animated } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";
import { useAttendance } from "../hooks/useAttendance";

import { Header } from "../components/Header";
import { WeeklyAttendance } from "../components/WeeklyAttendance";
import { CustomButton } from "../components/CustomButton";
import { AttendanceButton } from "../components/AttendanceButton";
import { SummaryBox } from "../components/SummaryBox";
import { getTodayDateString, getCurrentMonthString } from "../utils/dateHelpers";
import { colors, spacing, radius, shadows } from "../theme/colors";

export const EmployeeDashboardScreen = () => {
  const { user, role, loading: authLoading, logout } = useAuth();
  const { profile, loadUser } = useUser(user?.uid);
  const { 
    checkInTime, checkOutTime, yesterdayStatus, monthlyStats, weeklyData,
    loadAttendance, handleCheckIn, handleCheckOut, loading: attLoading
  } = useAttendance(user?.uid);

  const heroFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
         router.replace("/login");
      } else if (role && role !== "employee") {
         logout().then(() => router.replace("/login"));
      } else if (user && role === "employee") {
         loadUser();
         loadAttendance();
         loadAttendance();
         
         Animated.timing(heroFadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
         }).start();
      }
    }
  }, [user, role, authLoading, loadUser, loadAttendance, logout, heroFadeAnim]);

  if (authLoading) {
    return (
      <View style={styles.container}>
        <Text style={{color: "white", padding: 20}}>Loading...</Text>
      </View>
    );
  }

  const confirmAction = (message: string, action: () => Promise<void>) => {
    Alert.alert("Confirm", message, [{ text: "Cancel", style: "cancel" }, { text: "Yes", onPress: action }]);
  };

  let currentStatus = "Not Checked In";
  if (checkInTime && !checkOutTime) currentStatus = "Working";
  else if (checkInTime && checkOutTime) currentStatus = "Completed";

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header 
          title={`Welcome, ${profile?.name || "Employee"}`} 
          date={getTodayDateString()} 
          onLogout={() => confirmAction("Logout now?", async () => { await logout(); router.replace("/login"); })} 
        />

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
                <Text style={[styles.statusValue, currentStatus === "Completed" && { color: colors.text.secondary }]} numberOfLines={1}>
                  {currentStatus}
                </Text>
             </View>
          </View>
        </Animated.View>

        <Animated.View style={{ marginTop: spacing.medium, opacity: heroFadeAnim, transform: [{ translateY: heroFadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <AttendanceButton 
            checkInTime={checkInTime}
            checkOutTime={checkOutTime}
            loading={attLoading}
            onCheckIn={() => confirmAction("Check in now?", handleCheckIn)}
            onCheckOut={() => confirmAction("Check out now?", handleCheckOut)}
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
    borderColor: colors.border
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.small, marginBottom: spacing.medium },
  cardHeaderText: { color: colors.text.secondary, fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  statusRowContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusCol: { flex: 1, alignItems: "center", justifyContent: "center" },
  divider: { width: 1, height: 35, backgroundColor: 'rgba(255,255,255,0.08)' },
  statusLabel: { color: colors.text.label, fontSize: 11, marginBottom: spacing.small, textTransform: "uppercase", letterSpacing: 0.5 },
  timeValue: { color: colors.text.primary, fontSize: 18, fontWeight: "bold" },
  statusValue: { color: colors.primary, fontSize: 14, fontWeight: "bold" },
  yesterdayStatusText: { color: colors.text.primary, fontSize: 20, fontWeight: "bold" },
  summaryRow: { flexDirection: "row", gap: spacing.small, justifyContent: "space-between" },
});
