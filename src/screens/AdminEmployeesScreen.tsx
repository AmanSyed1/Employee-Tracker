import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput, Modal, Animated, TouchableOpacity } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, shadows } from "../theme/colors";
import { Header } from "../components/Header";
import { CustomButton } from "../components/CustomButton";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";
import { getAllUsers } from "../services/userService";
import { getTodayAttendance, getMonthlyAttendance } from "../services/attendanceService";
import { getMySickLeavesThisMonth } from "../services/leaveService";

export const AdminEmployeesScreen = () => {
  const { user } = useAuth();
  const { profile, loadUser } = useUser(user?.uid);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Placeholder "Add Employee" Modal Animation State
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Employee Details Modal Animation State
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);
  const detailsFadeAnim = useRef(new Animated.Value(0)).current;
  const detailsScaleAnim = useRef(new Animated.Value(0.95)).current;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      
      // Fetch local user profiles from AsyncStorage to map missing departments
      const keys = allUsers.map(u => `userProfile_${u.id}`);
      const localProfiles = await AsyncStorage.multiGet(keys);
      
      const mergedUsers = allUsers.map(u => {
        const localProfileStr = localProfiles.find(p => p[0] === `userProfile_${u.id}`)?.[1];
        let localData: any = {};
        if (localProfileStr) {
          try {
            localData = JSON.parse(localProfileStr);
          } catch (e) {}
        }
        return { ...localData, ...u, department: localData.department || u.department };
      });
      
      setUsers(mergedUsers);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        loadUser();
      }
    }, [user?.uid, loadUser])
  );

  const openModal = () => {
    setModalVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
    ]).start(() => setModalVisible(false));
  };

  const openEmployeeDetails = async (emp: any) => {
    setSelectedEmployee(emp);
    setEmployeeDetails(null);
    Animated.parallel([
      Animated.timing(detailsFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(detailsScaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    if (emp.name?.toLowerCase().includes("aman")) {
      try {
        const [today, monthly, myLeaves] = await Promise.all([
          getTodayAttendance(emp.id),
          getMonthlyAttendance(emp.id),
          getMySickLeavesThisMonth(emp.id)
        ]);
        setEmployeeDetails({
          today,
          monthly,
          pendingLeaves: myLeaves.filter(l => l.status === "pending").length
        });
      } catch (err) {
        console.error("Error fetching details:", err);
      }
    }
  };

  const closeEmployeeDetails = () => {
    Animated.parallel([
      Animated.timing(detailsFadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(detailsScaleAnim, { toValue: 0.95, duration: 150, useNativeDriver: true }),
    ]).start(() => setSelectedEmployee(null));
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(q);
    const emailMatch = u.email?.toLowerCase().includes(q);
    const deptMatch = u.department?.toLowerCase().includes(q) || u.Department?.toLowerCase().includes(q);
    return nameMatch || emailMatch || deptMatch;
  });

  const admins = filteredUsers.filter(u => u.role === "admin");
  const employees = filteredUsers.filter(u => u.role !== "admin");

  const renderUserCard = (emp: any, index: number) => {
    const department = emp.department || emp.Department || "No Department";
    const isAdmin = emp.role === "admin";

    return (
      <TouchableOpacity 
        key={emp.id || index} 
        style={styles.employeeCard}
        activeOpacity={0.7}
        onPress={() => openEmployeeDetails(emp)}
      >
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {emp.name ? emp.name.charAt(0).toUpperCase() : "U"}
          </Text>
        </View>
        <View style={styles.empInfo}>
          <Text style={styles.empName} numberOfLines={1}>{emp.name || "Unnamed User"}</Text>
          <Text style={styles.empEmail} numberOfLines={1}>{emp.email || "No email provided"}</Text>
          <Text style={styles.empRole} numberOfLines={1}>{department}</Text>
        </View>
        <View style={[styles.statusBadge, isAdmin ? styles.adminBadge : styles.empBadge]}>
          <Text style={[styles.statusText, isAdmin ? styles.adminText : styles.empText]}>
            {isAdmin ? "Admin" : "Employee"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "NULL";
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getWorkingDaysSoFar = () => {
    const now = new Date();
    let workingDays = 0;
    for (let i = 1; i <= now.getDate(); i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i);
      if (d.getDay() !== 0) workingDays++; // Exclude Sundays
    }
    return workingDays;
  };

  const workingDays = getWorkingDaysSoFar();

  return (
    <View style={styles.container}>
      <Header title="Employee Management" profileImage={profile?.profileImage} />
      
      {/* Search and Action Bar */}
      <View style={styles.topActions}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.text.placeholder} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, email, or department..."
            placeholderTextColor={colors.text.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <CustomButton 
          title="Add Employee" 
          onPress={openModal} 
          icon={<Ionicons name="person-add-outline" size={20} color={colors.text.primary} />}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Premium Summary Cards */}
        {!loading && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryCount}>{users.length}</Text>
              <Text style={styles.summaryLabel}>Total Staff</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryBox}>
              <Text style={styles.summaryCount}>{users.filter(u => u.role === 'admin').length}</Text>
              <Text style={styles.summaryLabel}>Admins</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryBox}>
              <Text style={styles.summaryCount}>{users.filter(u => u.role !== 'admin').length}</Text>
              <Text style={styles.summaryLabel}>Employees</Text>
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.text.placeholder} />
            <Text style={styles.emptyText}>No users found matching your search.</Text>
          </View>
        ) : (
          <>
            {/* Admins Section */}
            {admins.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Administrators</Text>
                {admins.map((emp, index) => renderUserCard(emp, index))}
              </View>
            )}

            {/* Employees Section */}
            {employees.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Employees</Text>
                {employees.map((emp, index) => renderUserCard(emp, index))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Onboarding Coming Soon Modal */}
      <Modal transparent visible={modalVisible} animationType="none" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalBackdrop, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.modalCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="rocket-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Employee Onboarding Module Coming Soon</Text>
            <Text style={styles.modalMessage}>
              This feature will allow admins to securely add and manage new employees directly from the workspace.
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={closeModal} activeOpacity={0.8}>
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Employee Details Modal */}
      <Modal transparent visible={!!selectedEmployee} animationType="none" onRequestClose={closeEmployeeDetails}>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalBackdrop, { opacity: detailsFadeAnim }]} />
          <Animated.View style={[styles.detailsModalCard, { opacity: detailsFadeAnim, transform: [{ scale: detailsScaleAnim }] }]}>
            
            <TouchableOpacity style={styles.closeButton} onPress={closeEmployeeDetails}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>

            {selectedEmployee && selectedEmployee.name?.toLowerCase().includes("aman") ? (
              // Detailed View for Aman
              <>
                <View style={styles.detailsHeader}>
                  <View style={styles.detailsAvatarLarge}>
                    <Text style={styles.detailsAvatarTextLarge}>A</Text>
                  </View>
                  <View style={styles.detailsHeaderInfo}>
                    <Text style={styles.detailsNameLarge}>{selectedEmployee.name}</Text>
                    <Text style={styles.detailsEmailLarge}>{selectedEmployee.email}</Text>
                    <View style={styles.detailsBadgeRow}>
                      <View style={[styles.statusBadge, styles.empBadge]}>
                        <Text style={[styles.statusText, styles.empText]}>Employee</Text>
                      </View>
                      <Text style={styles.detailsDeptText}>• {selectedEmployee.department || "Technical"}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailsBox}>
                    <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                    <Text style={styles.detailsBoxLabel}>Date of Joining</Text>
                    <Text style={styles.detailsBoxValue}>5th Jan 2026</Text>
                  </View>
                  
                  <View style={styles.detailsBox}>
                    <Ionicons name="time-outline" size={20} color={colors.primary} />
                    <Text style={styles.detailsBoxLabel}>Today's Status</Text>
                    <Text style={styles.detailsBoxValueIn}>Check In: {formatTime(employeeDetails?.today?.checkIn)}</Text>
                    <Text style={styles.detailsBoxValueOut}>Check Out: {formatTime(employeeDetails?.today?.checkOut)}</Text>
                  </View>

                  <View style={styles.detailsBox}>
                    <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
                    <Text style={styles.detailsBoxLabel}>Current Month</Text>
                    <Text style={styles.detailsBoxValue}>
                      {employeeDetails ? `${employeeDetails.monthly?.present || 0} / ${workingDays} days present` : "Loading..."}
                    </Text>
                  </View>

                  <View style={styles.detailsBox}>
                    <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                    <Text style={styles.detailsBoxLabel}>Pending Leaves</Text>
                    <Text style={styles.detailsBoxValue}>
                      {employeeDetails ? 
                        (employeeDetails.pendingLeaves > 0 
                          ? `${employeeDetails.pendingLeaves} Pending Request${employeeDetails.pendingLeaves > 1 ? 's' : ''}` 
                          : "No pending leave requests") 
                        : "Loading..."}
                    </Text>
                  </View>
                </View>
              </>
            ) : selectedEmployee?.role === "admin" ? (
              // Placeholder View for Admins
              <>
                <View style={styles.placeholderIconContainer}>
                  <Ionicons name="shield-checkmark-outline" size={32} color={colors.text.placeholder} />
                </View>
                <Text style={styles.modalTitle}>Admin info unavailable</Text>
                <Text style={styles.modalMessage}>Detailed admin profiles are currently being prepared.</Text>
              </>
            ) : (
              // Placeholder View for Non-Aman Employees
              <>
                <View style={styles.placeholderIconContainer}>
                  <Ionicons name="lock-closed-outline" size={32} color={colors.text.placeholder} />
                </View>
                <Text style={styles.modalTitle}>Employee details unavailable</Text>
                <Text style={styles.modalMessage}>Detailed employee profiles are currently being prepared.</Text>
              </>
            )}

          </Animated.View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topActions: {
    paddingHorizontal: spacing.large,
    paddingTop: spacing.medium,
    paddingBottom: spacing.small,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.secondaryBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.medium,
    paddingHorizontal: spacing.medium,
    marginBottom: spacing.medium,
    height: 48,
  },
  searchIcon: { marginRight: spacing.small },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 14,
  },
  scrollContent: {
    padding: spacing.large,
    paddingBottom: 60,
  },
  
  // Summary Row Styles
  summaryRow: {
    flexDirection: "row",
    backgroundColor: colors.cardBackground,
    borderRadius: radius.large,
    paddingVertical: spacing.large,
    paddingHorizontal: spacing.medium,
    marginBottom: spacing.xlarge,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryBox: {
    flex: 1,
    alignItems: "center",
  },
  summaryCount: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  summaryLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  summaryDivider: {
    width: 1,
    height: "60%",
    backgroundColor: colors.border,
  },

  // Sections
  sectionContainer: { marginBottom: spacing.medium },
  sectionTitle: {
    color: colors.text.label,
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.medium,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  emptyText: {
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing.medium,
    fontSize: 14,
    fontStyle: "italic",
  },

  // Card Styles
  employeeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    padding: spacing.large,
    borderRadius: radius.medium,
    marginBottom: spacing.medium,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.medium,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "bold",
  },
  empInfo: {
    flex: 1,
    marginRight: spacing.small,
  },
  empName: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 2,
  },
  empEmail: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: 4,
  },
  empRole: {
    color: colors.text.placeholder,
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.small,
    borderWidth: 1,
  },
  adminBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  empBadge: {
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    borderColor: 'rgba(29, 185, 84, 0.2)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  adminText: { color: colors.status.error },
  empText: { color: colors.primary },

  // Shared Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalCard: {
    width: "85%",
    backgroundColor: colors.cardBackground,
    borderRadius: radius.large,
    padding: spacing.xlarge,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    alignItems: "center",
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.large,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: spacing.medium,
  },
  modalMessage: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xlarge,
  },
  modalButton: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.medium,
    alignItems: "center",
  },
  modalButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: "bold",
  },

  // Employee Details Modal Styles
  detailsModalCard: {
    width: "90%",
    backgroundColor: colors.cardBackground,
    borderRadius: radius.large,
    padding: spacing.xlarge,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  closeButton: {
    position: "absolute",
    top: spacing.medium,
    right: spacing.medium,
    padding: spacing.small,
    zIndex: 10,
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xlarge,
    marginTop: spacing.small,
  },
  detailsAvatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.large,
  },
  detailsAvatarTextLarge: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "bold",
  },
  detailsHeaderInfo: {
    flex: 1,
  },
  detailsNameLarge: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  detailsEmailLarge: {
    color: colors.text.secondary,
    fontSize: 13,
    marginBottom: 8,
  },
  detailsBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailsDeptText: {
    color: colors.text.secondary,
    fontSize: 12,
    marginLeft: spacing.small,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.medium,
  },
  detailsBox: {
    width: "47%",
    backgroundColor: colors.secondaryBackground,
    padding: spacing.large,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailsBoxLabel: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: spacing.medium,
    marginBottom: 6,
  },
  detailsBoxValue: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "bold",
  },
  detailsBoxValueIn: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  detailsBoxValueOut: {
    color: colors.status.error,
    fontSize: 13,
    fontWeight: "600",
  },
  placeholderIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: spacing.large,
    marginTop: spacing.large,
  },
});
