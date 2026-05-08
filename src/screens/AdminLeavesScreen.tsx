import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Modal, Animated, TextInput } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, shadows } from "../theme/colors";
import { Header } from "../components/Header";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";
import { loadAllLeaves, updateLeaveStatus } from "../services/leaveService";
import { getAllUsers } from "../services/userService";

export const AdminLeavesScreen = () => {
  const { user } = useAuth();
  const { profile, loadUser } = useUser(user?.uid);
  const [users, setUsers] = useState<any[]>([]);
  const [allLeaves, setAllLeaves] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [selectedEmpLeaves, setSelectedEmpLeaves] = useState<any[]>([]);
  const detailsFadeAnim = useRef(new Animated.Value(0)).current;
  const detailsScaleAnim = useRef(new Animated.Value(0.95)).current;

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground && users.length === 0) {
      setDataLoading(true);
    }
    try {
      const [leaves, fetchedUsers] = await Promise.all([
        loadAllLeaves(),
        getAllUsers(),
      ]);
      
      const filteredUsers = fetchedUsers.filter((u: any) => u.role !== "admin");
      // Sort Alphabetically A-Z
      filteredUsers.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
      
      setUsers(filteredUsers);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const processed = leaves.map(l => {
        const lDate = new Date(l.date);
        lDate.setHours(0, 0, 0, 0);
        let displayStatus = l.status;
        if (lDate <= today && l.status === "pending") {
          displayStatus = "expired";
        }
        return { ...l, displayStatus };
      });
      
      setAllLeaves(processed);

      // If modal is open, refresh its data quietly
      if (selectedEmp) {
        const empLeaves = processed.filter(l => l.uid === selectedEmp.id);
        setSelectedEmpLeaves(empLeaves);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDataLoading(false);
    }
  }, [selectedEmp, users.length]);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        loadUser();
        fetchData(true); // Background refresh on focus, prevents flickering
      }
    }, [user?.uid, loadUser, fetchData])
  );

  const handleLeaveAction = async (id: string, status: "approved" | "rejected") => {
    try {
      await updateLeaveStatus(id, status);
      await fetchData(true); // Refresh quietly
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const openDetailsModal = (emp: any, empLeaves: any[]) => {
    setSelectedEmp(emp);
    setSelectedEmpLeaves(empLeaves);
    Animated.parallel([
      Animated.timing(detailsFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(detailsScaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  };

  const closeDetailsModal = () => {
    Animated.parallel([
      Animated.timing(detailsFadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(detailsScaleAnim, { toValue: 0.95, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setSelectedEmp(null);
      setSelectedEmpLeaves([]);
    });
  };

  const pendingCount = allLeaves.filter(l => l.status === "pending" && l.displayStatus !== "expired").length;

  const getStatusBadgeStyle = (status: string) => {
    switch(status) {
      case "approved": return { bg: 'rgba(29, 185, 84, 0.1)', text: colors.status.success };
      case "rejected": return { bg: 'rgba(239, 68, 68, 0.1)', text: colors.status.error };
      case "pending": return { bg: 'rgba(234, 179, 8, 0.1)', text: colors.status.warning };
      case "expired": return { bg: 'rgba(156, 163, 175, 0.1)', text: colors.text.secondary };
      default: return { bg: 'rgba(156, 163, 175, 0.1)', text: colors.text.secondary };
    }
  };

  const StatusBadge = ({ status, labelOverride }: { status: string, labelOverride?: string }) => {
    const style = getStatusBadgeStyle(status);
    return (
      <View style={[styles.badge, { backgroundColor: style.bg, borderColor: style.text + '30' }]}>
        <Text style={[styles.badgeText, { color: style.text }]}>{(labelOverride || status).toUpperCase()}</Text>
      </View>
    );
  };

  const renderEmployeeCard = (emp: any, index: number) => {
    const empLeaves = allLeaves.filter(l => l.uid === emp.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const pendingLeaves = empLeaves.filter(l => l.displayStatus === "pending");
    const hasHistory = empLeaves.length > 0;
    
    let displayTag = "No Requests";
    let statusSim = "expired"; 

    if (pendingLeaves.length > 0) {
      displayTag = "Pending Request";
      statusSim = "pending";
    } else if (hasHistory) {
      displayTag = "History Available";
      statusSim = "approved";
    }

    return (
      <TouchableOpacity 
        key={emp.id || index} 
        style={styles.employeeCard} 
        activeOpacity={0.7}
        onPress={() => openDetailsModal(emp, empLeaves)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{emp.name ? emp.name.charAt(0).toUpperCase() : "U"}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.empName}>{emp.name}</Text>
            <Text style={styles.leaveType}>{emp.department || "Employee"}</Text>
          </View>
          <StatusBadge status={statusSim} labelOverride={displayTag} />
        </View>
      </TouchableOpacity>
    );
  };

  const filteredDisplayUsers = users.filter((u: any) => 
    (u.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const modalPendingReqs = selectedEmpLeaves.filter(l => l.displayStatus === "pending");
  const modalHistoryReqs = selectedEmpLeaves.filter(l => l.displayStatus !== "pending");

  return (
    <View style={styles.wrapper}>
      <Header title="Leave Requests" profileImage={profile?.profileImage} />
      
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Sleeker Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryValue}>{pendingCount}</Text>
            <View>
              <Text style={styles.summaryLabel}>Total Pending</Text>
              <Text style={styles.summarySub}>Awaiting admin review</Text>
            </View>
          </View>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text" size={24} color={colors.primary} />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.text.placeholder} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search employees..."
            placeholderTextColor={colors.text.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Flat Employee List */}
        {dataLoading ? (
           <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.listContainer}>
            {filteredDisplayUsers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={colors.text.placeholder} />
                <Text style={styles.empty}>{searchQuery ? "No employees match your search" : "No employees found"}</Text>
              </View>
            ) : (
              filteredDisplayUsers.map((emp, i) => renderEmployeeCard(emp, i))
            )}
          </View>
        )}
      </ScrollView>

      {/* Scrollable Leave Details Modal */}
      <Modal transparent visible={!!selectedEmp} animationType="none" onRequestClose={closeDetailsModal}>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalBackdrop, { opacity: detailsFadeAnim }]} />
          <Animated.View style={[styles.detailsModalCard, { opacity: detailsFadeAnim, transform: [{ scale: detailsScaleAnim }] }]}>
            
            <TouchableOpacity style={styles.closeButton} onPress={closeDetailsModal} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>

            {selectedEmp && (
              <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.modalScrollContent}
                bounces={false}
              >
                <View style={styles.detailsHeader}>
                  <View style={styles.detailsAvatarLarge}>
                    <Text style={styles.detailsAvatarTextLarge}>
                      {selectedEmp.name ? selectedEmp.name.charAt(0).toUpperCase() : "U"}
                    </Text>
                  </View>
                  <View style={styles.detailsHeaderInfo}>
                    <Text style={styles.detailsNameLarge}>{selectedEmp.name}</Text>
                    <Text style={styles.detailsLeaveTypeLarge}>{selectedEmp.department || "Employee"}</Text>
                  </View>
                </View>

                {/* Section 1: Current Pending Requests */}
                {modalPendingReqs.length > 0 && (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Pending Requests</Text>
                    {modalPendingReqs.map((req, idx) => (
                      <View key={req.id || idx} style={styles.detailsGrid}>
                        <View style={styles.detailsHeaderRow}>
                          <StatusBadge status="pending" />
                        </View>
                        
                        <View style={styles.detailsRow}>
                          <Ionicons name="calendar-outline" size={18} color={colors.primary} style={styles.detailsRowIcon} />
                          <View>
                            <Text style={styles.detailsRowLabel}>Leave Date</Text>
                            <Text style={styles.detailsRowValue}>{req.date}</Text>
                          </View>
                        </View>

                        <View style={styles.detailsDescRow}>
                          <Ionicons name="document-text-outline" size={18} color={colors.primary} style={styles.detailsRowIcon} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.detailsRowLabel}>Reason</Text>
                            <Text style={styles.detailsDescValue}>{req.reason || "No reason provided."}</Text>
                          </View>
                        </View>

                        {/* Approve / Reject Actions */}
                        <View style={styles.actionButtonsRow}>
                          <TouchableOpacity 
                            style={[styles.actionBtn, styles.rejectBtn]} 
                            onPress={() => handleLeaveAction(req.id, "rejected")}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="close-circle-outline" size={20} color={colors.status.error} />
                            <Text style={styles.rejectBtnText}>Reject</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[styles.actionBtn, styles.approveBtn]} 
                            onPress={() => handleLeaveAction(req.id, "approved")}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="checkmark-circle-outline" size={20} color={colors.background} />
                            <Text style={styles.approveBtnText}>Approve</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Section 2: Past Leave Requests */}
                <View style={styles.historySection}>
                  <Text style={styles.historyTitle}>Past Leave Requests</Text>
                  {modalHistoryReqs.length === 0 ? (
                    <Text style={styles.historyEmpty}>No past history for this employee.</Text>
                  ) : (
                    modalHistoryReqs.map((hist, i) => (
                      <View key={hist.id || i} style={styles.historyItem}>
                        <View>
                          <Text style={styles.historyItemType}>Sick Leave</Text>
                          <Text style={styles.historyItemDate}>{hist.date}</Text>
                        </View>
                        <StatusBadge status={hist.displayStatus} />
                      </View>
                    ))
                  )}
                </View>

              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: spacing.large, paddingBottom: 60, paddingTop: spacing.medium },
  
  // Summary Card (Sleeker and Better Aligned)
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.cardBackground,
    borderRadius: radius.medium,
    padding: spacing.large,
    marginBottom: spacing.large,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryContent: { flex: 1, flexDirection: "row", alignItems: "center" },
  summaryValue: { color: colors.primary, fontSize: 32, fontWeight: "bold", marginRight: spacing.medium },
  summaryLabel: { color: colors.text.primary, fontSize: 14, fontWeight: "bold", marginBottom: 2 },
  summarySub: { color: colors.text.secondary, fontSize: 12 },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    justifyContent: "center",
    alignItems: "center",
  },

  // Search Bar
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.secondaryBackground,
    borderRadius: radius.large,
    paddingHorizontal: spacing.large,
    marginBottom: spacing.large,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: spacing.small,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 15,
    paddingVertical: 14,
  },

  // List & Cards
  listContainer: { paddingBottom: spacing.large },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    opacity: 0.8,
  },
  empty: { 
    color: colors.text.secondary, 
    textAlign: "center", 
    marginTop: spacing.medium, 
    fontStyle: "italic", 
    fontSize: 14,
  },
  employeeCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.large,
    padding: spacing.large,
    marginBottom: spacing.medium,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
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
  cardInfo: {
    flex: 1,
    marginRight: spacing.small,
  },
  empName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  leaveType: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.small,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  // Modals Overlay shared
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },

  // Leave Details Modal Specific
  detailsModalCard: {
    width: "90%",
    maxHeight: "85%",
    backgroundColor: colors.cardBackground,
    borderRadius: radius.large,
    paddingTop: spacing.large,
    paddingHorizontal: spacing.large,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  modalScrollContent: {
    paddingBottom: spacing.xlarge,
  },
  closeButton: {
    position: "absolute",
    top: spacing.medium,
    right: 0,
    padding: spacing.small,
    zIndex: 10,
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.large,
    paddingRight: 40, // Space for close btn
  },
  detailsAvatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.large,
  },
  detailsAvatarTextLarge: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "bold",
  },
  detailsHeaderInfo: {
    flex: 1,
    alignItems: "flex-start",
  },
  detailsNameLarge: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  detailsLeaveTypeLarge: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  sectionContainer: {
    marginBottom: spacing.large,
  },
  sectionTitle: {
    color: colors.text.label,
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.medium,
  },
  detailsGrid: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: radius.medium,
    padding: spacing.large,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.medium,
  },
  detailsHeaderRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: spacing.medium,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.large,
  },
  detailsDescRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.large,
  },
  detailsRowIcon: {
    marginRight: spacing.medium,
  },
  detailsRowLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  detailsRowValue: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "bold",
  },
  detailsDescValue: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },

  actionButtonsRow: {
    flexDirection: "row",
    gap: spacing.medium,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: radius.medium,
    borderWidth: 1,
    gap: 6,
  },
  rejectBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  approveBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rejectBtnText: {
    color: colors.status.error,
    fontWeight: "bold",
    fontSize: 14,
  },
  approveBtnText: {
    color: colors.background,
    fontWeight: "bold",
    fontSize: 14,
  },

  historySection: {
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.large,
    marginTop: spacing.small,
  },
  historyTitle: {
    color: colors.text.label,
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.medium,
  },
  historyEmpty: {
    color: colors.text.secondary,
    fontStyle: "italic",
    fontSize: 13,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  historyItemType: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  historyItemDate: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
});
