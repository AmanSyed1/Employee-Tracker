import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform, ActivityIndicator } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, shadows } from "../theme/colors";
import { Header } from "../components/Header";
import { LeaveCard } from "../components/LeaveCard";
import { CustomButton } from "../components/CustomButton";
import { useLeaves } from "../hooks/useLeaves";
import { useAuth } from "../hooks/useAuth";
import { requestSickLeave } from "../services/leaveService";

type TabType = "Granted" | "Active" | "History";

export const LeaveScreen = () => {
  const { user } = useAuth();
  const { leaves, loading, error } = useLeaves(user?.uid);
  const [activeTab, setActiveTab] = useState<TabType>("Active");
  
  // Request Form State
  const [leaveDate, setLeaveDate] = useState("");
  const [reason, setReason] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const normalizeDate = (date: any) => {
    if (!date) return null;
    
    // Firestore Timestamp
    if (typeof date.toDate === "function") {
      return new Date(date.toDate().setHours(0, 0, 0, 0));
    }
    
    // String or JS Date
    return new Date(new Date(date).setHours(0, 0, 0, 0));
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime(); // Use timestamp for easier comparison
  }, []);

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currentMonth = useMemo(() => new Date().getMonth(), []);

  // Yearly Logic: 14 total, only approved count
  const remainingLeavesThisYear = useMemo(() => {
    if (!leaves) return 14;
    const approvedThisYear = leaves.filter(leave => {
      const lDate = normalizeDate(leave.date);
      if (!lDate) return false;
      return lDate.getFullYear() === currentYear && leave.status === "approved";
    }).length;
    return Math.max(0, 14 - approvedThisYear);
  }, [leaves, currentYear]);

  // Monthly Logic: 3 requests max (Approved + Pending)
  const monthlyRequests = useMemo(() => {
    if (!leaves) return 0;
    return leaves.filter(leave => {
      const lDate = normalizeDate(leave.date);
      if (!lDate) return false;
      const isThisMonth = lDate.getFullYear() === currentYear && lDate.getMonth() === currentMonth;
      const isValidRequest = leave.status === "approved" || leave.status === "pending";
      return isThisMonth && isValidRequest;
    }).length;
  }, [leaves, currentYear, currentMonth]);

  const monthlyLimitReached = monthlyRequests >= 3;
  const yearlyLimitReached = remainingLeavesThisYear <= 0;

  const filteredLeaves = useMemo(() => {
    if (!leaves) return [];
    
    const categorized = leaves.map(leave => {
      const lDate = normalizeDate(leave.date);
      const lTime = lDate ? lDate.getTime() : 0;
      let category: TabType = "History";

      if (lTime < today) {
        category = "History";
      } else if (leave.status === "approved") {
        category = "Granted";
      } else if (leave.status === "pending") {
        category = "Active";
      }

      // Debugging Logs
      console.log({
        rawDate: leave.date,
        normalizedDate: lDate,
        today: new Date(today),
        status: leave.status,
        category
      });

      return { ...leave, category };
    });

    return categorized
      .filter(leave => leave.category === activeTab)
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return activeTab === "History" ? dateB - dateA : dateA - dateB;
      });
  }, [leaves, activeTab, today]);

  const handleRequestLeave = async () => {
    if (!leaveDate || !reason.trim()) {
      return Alert.alert("Required", "Please select a date and enter a reason.");
    }
    if (!user) return;

    try {
      setRequesting(true);
      await requestSickLeave(user.uid, leaveDate, reason);
      Alert.alert("Success", "Request sent to admin");
      setLeaveDate("");
      setReason("");
    } catch (error) {
      Alert.alert("Error", "Failed to submit request");
    } finally {
      setRequesting(false);
    }
  };

  const renderTab = (tab: TabType) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[styles.tab, isActive && styles.activeTab]}
        onPress={() => setActiveTab(tab)}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
          {tab}
        </Text>
      </TouchableOpacity>
    );
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Leave Management" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.status.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Leave Management" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Remaining Leaves Counter */}
        <View style={styles.counterCard}>
          <View>
            <Text style={styles.counterLabel}>Remaining Leaves (This Year)</Text>
            <Text style={styles.counterSubLabel}>Quota: 14 approved leaves</Text>
          </View>
          <Text style={styles.counterValue}>{remainingLeavesThisYear}</Text>
        </View>

        {/* Request Form Section */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>New Leave Request</Text>
          </View>

          {yearlyLimitReached ? (
            <View style={styles.limitMessageContainer}>
               <Ionicons name="warning" size={20} color={colors.status.error} />
               <Text style={styles.limitMessage}>Yearly leave limit reached</Text>
            </View>
          ) : monthlyLimitReached ? (
            <View style={styles.limitMessageContainer}>
               <Ionicons name="warning" size={20} color={colors.status.warning} />
               <Text style={styles.limitMessage}>Monthly leave request limit reached (3/month)</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.dateSelector} 
                onPress={() => setShowCalendar(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
                <Text style={[styles.dateText, !leaveDate && { color: colors.text.placeholder }]}>
                  {leaveDate || "Select Leave Date"}
                </Text>
              </TouchableOpacity>

              {showCalendar && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  minimumDate={new Date()}
                  onChange={(_, date) => {
                    setShowCalendar(false);
                    if (date) setLeaveDate(date.toISOString().split("T")[0]);
                  }}
                />
              )}

              <TextInput
                style={styles.input}
                placeholder="Reason for leave"
                placeholderTextColor={colors.text.placeholder}
                multiline
                numberOfLines={3}
                value={reason}
                onChangeText={setReason}
              />

              <CustomButton 
                title="Submit Request" 
                onPress={handleRequestLeave}
                loading={requesting}
                disabled={monthlyLimitReached || yearlyLimitReached}
              />
            </>
          )}
        </View>

        {/* Tabs Selector */}
        <View style={styles.selectorContainer}>
          {renderTab("Granted")}
          {renderTab("Active")}
          {renderTab("History")}
        </View>

        {/* Leave List */}
        <View style={styles.listSection}>
          {loading ? (
             <View style={{ paddingVertical: 40 }}>
               <ActivityIndicator color={colors.primary} size="large" />
             </View>
          ) : filteredLeaves.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} leave requests found.</Text>
            </View>
          ) : (
            filteredLeaves.map((leave, i) => (
              <LeaveCard 
                key={leave.id || i} 
                leave={leave as any} 
                delay={i * 100}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.large, paddingBottom: 60 },
  counterCard: {
    backgroundColor: colors.cardBackground,
    padding: spacing.large,
    borderRadius: radius.large,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.large,
    borderWidth: 1,
    borderColor: colors.border,
  },
  counterLabel: { color: colors.text.secondary, fontSize: 13, fontWeight: "600" },
  counterSubLabel: { color: colors.text.placeholder, fontSize: 10, marginTop: 2 },
  counterValue: { color: colors.primary, fontSize: 24, fontWeight: "bold" },
  formCard: {
    backgroundColor: colors.cardBackground,
    padding: spacing.large,
    borderRadius: radius.large,
    marginBottom: spacing.xlarge,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.medium },
  cardTitle: { color: colors.text.primary, fontSize: 16, fontWeight: "bold" },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.secondaryBackground,
    padding: 14,
    borderRadius: radius.medium,
    marginBottom: spacing.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: { color: colors.text.primary, fontSize: 14 },
  input: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: radius.medium,
    padding: 14,
    color: colors.text.primary,
    marginBottom: spacing.large,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: "top",
  },
  limitMessageContainer: {
    padding: spacing.medium,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: radius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  limitMessage: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  selectorContainer: {
    flexDirection: "row",
    backgroundColor: colors.cardBackground,
    borderRadius: radius.medium,
    padding: 4,
    marginBottom: spacing.large,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: radius.small,
  },
  activeTab: { backgroundColor: colors.primary },
  tabText: { color: colors.text.secondary, fontSize: 13, fontWeight: "600" },
  activeTabText: { color: colors.text.primary },
  listSection: { marginTop: spacing.small },
  emptyContainer: { paddingVertical: 40, alignItems: "center" },
  emptyText: { color: colors.text.secondary, fontStyle: "italic", textAlign: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xlarge },
  errorText: { color: colors.text.secondary, marginTop: spacing.medium, textAlign: "center", fontSize: 16 },
});
