import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, shadows } from "../theme/colors";
import { LeaveRequest } from "../services/leaveService";

type LeaveCardProps = {
  leave: LeaveRequest;
  onApprove?: () => void;
  onReject?: () => void;
  delay?: number;
};

export const LeaveCard = ({ leave, onApprove, onReject, delay = 0 }: LeaveCardProps) => {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true })
    ]).start();
  }, [delay, fadeAnim, slideAnim]);

  const isPending = leave.status === "pending";
  const iconColor = isPending ? colors.status.warning : (leave.status === "approved" ? colors.status.success : colors.status.error);
  const iconName = isPending ? "time-outline" : (leave.status === "approved" ? "checkmark-circle-outline" : "close-circle-outline");

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity activeOpacity={0.9} style={styles.card}>
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
               <Ionicons name="person" size={16} color={colors.text.primary} />
            </View>
            <View>
              <Text style={styles.name}>{leave.employeeName}</Text>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={12} color={colors.text.secondary} />
                <Text style={styles.dateText}>{leave.date}</Text>
              </View>
            </View>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={iconName} size={14} color={iconColor} />
            <Text style={[styles.statusText, { color: iconColor }]}>
              {leave.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.reasonBox}>
          <Ionicons name="document-text-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.reasonText}>{leave.reason}</Text>
        </View>

        {isPending && onApprove && onReject && (
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.approve]} onPress={onApprove}>
              <Text style={styles.btnText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.reject]} onPress={onReject}>
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: { 
    backgroundColor: colors.cardBackground, 
    borderRadius: radius.large, 
    padding: spacing.large, 
    marginBottom: spacing.large,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.border
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.medium,
  },
  profileSection: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: colors.secondaryBackground,
    justifyContent: "center", alignItems: "center",
    marginRight: spacing.medium,
  },
  name: { color: colors.text.primary, fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dateText: { color: colors.text.secondary, fontSize: 12 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: radius.medium,
  },
  statusText: { fontSize: 11, fontWeight: "bold" },
  reasonBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: colors.secondaryBackground,
    padding: spacing.medium, borderRadius: radius.medium,
  },
  reasonText: { color: colors.text.primary, fontSize: 14, flex: 1, lineHeight: 20 },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.medium, gap: spacing.medium },
  btn: { flex: 1, paddingVertical: spacing.medium, borderRadius: radius.medium, alignItems: "center" },
  approve: { backgroundColor: colors.status.success },
  reject: { backgroundColor: colors.status.error },
  btnText: { color: colors.text.primary, fontWeight: "bold", fontSize: 14 },
});
