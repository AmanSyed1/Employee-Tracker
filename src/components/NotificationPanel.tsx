import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity, Dimensions, ScrollView, TouchableWithoutFeedback, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, shadows } from "../theme/colors";

const { width, height } = Dimensions.get("window");
const PANEL_WIDTH = width * 0.75;

type NotificationPanelProps = {
  visible: boolean;
  onClose: () => void;
};

export const NotificationPanel = ({ visible, onClose }: NotificationPanelProps) => {
  const slideAnim = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: PANEL_WIDTH, duration: 250, useNativeDriver: true }),
      ]).start(() => setModalVisible(false));
    }
  }, [visible, fadeAnim, slideAnim]);

  if (!modalVisible) return null;

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>
        
        <Animated.View style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}>
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Announcements Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(29, 185, 84, 0.15)' }]}>
                  <Ionicons name="megaphone" size={16} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>Announcements</Text>
              </View>
              <Text style={styles.sectionDesc}>
                Important company-wide announcements will appear here once this feature is fully deployed.
              </Text>
              
              <View style={styles.card}>
                <Text style={styles.cardText}>Business Expo scheduled for 15 May 2026.</Text>
                <Text style={styles.timeText}>Just now</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardText}>Office will remain closed on Sunday.</Text>
                <Text style={styles.timeText}>2 hrs ago</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardText}>Quarterly review meeting scheduled next week.</Text>
                <Text style={styles.timeText}>1 day ago</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardText}>New attendance policy update coming soon.</Text>
                <Text style={styles.timeText}>2 days ago</Text>
              </View>
            </View>

            {/* Updates Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Ionicons name="refresh" size={16} color="#3b82f6" />
                </View>
                <Text style={styles.sectionTitle}>Updates</Text>
              </View>
              <Text style={styles.sectionDesc}>
                System updates and employee-related notifications will appear here.
              </Text>
              
              <View style={styles.card}>
                <Text style={styles.cardText}>Your leave request has been reviewed.</Text>
                <Text style={styles.timeText}>5 mins ago</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardText}>Attendance synced successfully.</Text>
                <Text style={styles.timeText}>1 hr ago</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardText}>New event added to organization calendar.</Text>
                <Text style={styles.timeText}>3 hrs ago</Text>
              </View>
            </View>

          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  panel: {
    width: PANEL_WIDTH,
    height: "100%",
    backgroundColor: colors.background,
    borderLeftWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: spacing.large,
    paddingBottom: spacing.medium,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "bold",
  },
  closeBtn: {
    padding: spacing.small,
    marginRight: -spacing.small,
  },
  scrollContent: {
    padding: spacing.large,
    paddingBottom: 80,
  },
  section: {
    marginBottom: spacing.xlarge,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.small,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.small,
  },
  sectionTitle: {
    color: colors.text.label,
    fontSize: 15,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionDesc: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.medium,
    fontStyle: "italic",
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.medium,
    padding: spacing.medium,
    marginBottom: spacing.small,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardText: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.small,
  },
  timeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "600",
  },
});
