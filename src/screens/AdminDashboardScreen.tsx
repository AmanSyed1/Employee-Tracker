import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Header } from "../components/Header";
import { ConfirmModal } from "../components/ConfirmModal";
import { StatCard } from "../components/StatCard";
import { useAuth } from "../hooks/useAuth";
import { useEvents } from "../hooks/useEvents";
import { useUser } from "../hooks/useUser";
import { LeaveRequest, loadPendingLeaves } from "../services/leaveService";
import { getAllUsers } from "../services/userService";
import { colors, radius, shadows, spacing } from "../theme/colors";

export const AdminDashboardScreen = () => {
  const { user, role, loading: authLoading, logout } = useAuth();
  const { profile, loadUser } = useUser(user?.uid);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const { events, loading: eventsLoading } = useEvents(user?.uid);

  const fetchData = useCallback(async () => {
    try {
      const [pendingLeaves, users] = await Promise.all([
        loadPendingLeaves(),
        getAllUsers()
      ]);
      setLeaves(pendingLeaves);
      setTotalEmployees(users.filter(u => u.role === "employee" || !u.role).length);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (role !== "admin") {
      router.replace("/login");
      return;
    }

    loadUser();
    fetchData();
  }, [user, role, authLoading, fetchData]);

  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        loadUser();
        fetchData();
      }
    }, [user?.uid, loadUser, fetchData])
  );

  if (authLoading || !role) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "white", textAlign: "center", marginTop: 50 }}>Loading...</Text>
      </View>
    );
  }

  const handleLogoutConfirm = async () => {
    setLogoutModalVisible(false);
    await AsyncStorage.removeItem("authToken");
    await logout();
    router.replace("/login");
  };

  const getEventDateTime = (dateStr: string, timeStr: string) => {
    if (!dateStr) return new Date().getTime();
    const baseDate = new Date(`${dateStr}T00:00:00`);
    if (!timeStr) return baseDate.getTime();
    
    const parsedWithTime = new Date(`${dateStr} ${timeStr}`);
    return isNaN(parsedWithTime.getTime()) ? baseDate.getTime() : parsedWithTime.getTime();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = events
    .filter(e => {
      const evDate = new Date(e.date);
      evDate.setHours(0, 0, 0, 0);
      return evDate >= today;
    })
    .sort((a, b) => getEventDateTime(a.date || "", a.time || "") - getEventDateTime(b.date || "", b.time || ""));

  const recentEvents = upcomingEvents.slice(0, 3); // Preview up to 3 upcoming events

  return (
    <View style={styles.wrapper}>
      <ConfirmModal
        visible={logoutModalVisible}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutModalVisible(false)}
      />
      <Header
        title={`Welcome, ${profile?.name || "Admin"}`}
        profileImage={profile?.profileImage}
        onLogout={() => setLogoutModalVisible(true)}
      />
      
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Dashboard Overview */}
        <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Dashboard Overview</Text>
        
        <View style={styles.statsRow}>
          <StatCard 
            value={totalEmployees.toString()} 
            label="Employees" 
            icon="people" 
            delay={100} 
            onPress={() => router.push("/employees")} 
          />
          <StatCard 
            value={leaves.length.toString()} 
            label="Pending Leaves" 
            icon="document-text" 
            delay={200} 
            onPress={() => router.push("/leaves")} 
          />
        </View>

        {/* Upcoming Events Preview Card */}
        <TouchableOpacity 
          style={styles.upcomingPreviewCard} 
          onPress={() => router.push("/events")}
          activeOpacity={0.8}
        >
          <View style={styles.upcomingPreviewLeft}>
            <Text style={styles.upcomingPreviewCount}>{upcomingEvents.length}</Text>
            <Text style={styles.upcomingPreviewLabel}>Upcoming</Text>
            <Text style={styles.upcomingPreviewSub}>Events Scheduled</Text>
          </View>
          
          <View style={styles.upcomingPreviewDivider} />

          <View style={styles.upcomingPreviewRight}>
            {eventsLoading ? (
               <Text style={styles.empty}>Loading...</Text>
            ) : recentEvents.length === 0 ? (
              <Text style={styles.empty}>No upcoming events 🎉</Text>
            ) : (
              recentEvents.map((ev, i) => (
                <View key={ev.id || i} style={styles.upcomingPreviewItem}>
                  <View style={styles.upcomingPreviewDot} />
                  <View style={styles.upcomingPreviewText}>
                    <Text style={styles.upcomingPreviewTitle} numberOfLines={1}>{ev.title}</Text>
                    <Text style={styles.upcomingPreviewDate}>{ev.date || "TBD"} {ev.time ? `• ${ev.time}` : ""}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/employees")}>
            <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(29, 185, 84, 0.1)' }]}>
              <Ionicons name="person-add" size={24} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>Add Employee</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/events")}>
            <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(29, 185, 84, 0.1)' }]}>
              <Ionicons name="calendar" size={24} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>Create Event</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/leaves")}>
            <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(29, 185, 84, 0.1)' }]}>
              <Ionicons name="document-text" size={24} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>Review Leaves</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: spacing.large, paddingBottom: 60, paddingTop: spacing.medium },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "bold",
    marginTop: spacing.xlarge,
    marginBottom: spacing.medium,
  },
  statsRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.medium },
  
  // Upcoming Events Preview Card Styles
  upcomingPreviewCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.large,
    padding: spacing.large,
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.medium,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  upcomingPreviewLeft: {
    width: "35%",
    alignItems: "center",
    justifyContent: "center",
  },
  upcomingPreviewCount: {
    color: colors.primary,
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 2,
  },
  upcomingPreviewLabel: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  upcomingPreviewSub: {
    color: colors.text.secondary,
    fontSize: 10,
    marginTop: 2,
  },
  upcomingPreviewDivider: {
    width: 1,
    height: "80%",
    backgroundColor: colors.border,
    marginHorizontal: spacing.medium,
  },
  upcomingPreviewRight: {
    flex: 1,
    justifyContent: "center",
  },
  upcomingPreviewItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  upcomingPreviewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: spacing.small,
    marginTop: 2,
  },
  upcomingPreviewText: {
    flex: 1,
  },
  upcomingPreviewTitle: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  upcomingPreviewDate: {
    color: colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },

  // Quick Actions Styles
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.medium,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    padding: spacing.medium,
    borderRadius: radius.medium,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.small,
  },
  actionText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  
  empty: { 
    color: colors.text.secondary, 
    fontSize: 13, 
    fontStyle: "italic",
    textAlign: "center"
  },
});
