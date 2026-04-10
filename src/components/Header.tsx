import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, spacing, radius, shadows } from "../theme/colors";

type HeaderProps = {
  title: string;
  subtitle?: string;
  date?: string;
  onLogout?: () => void;
};

export const Header = ({ title, subtitle, date, onLogout }: HeaderProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Handle parsing the admin vs employee titles if passed as "Welcome, Name"
  const cleanTitle = title.replace("Welcome, ", "").trim();
  const isEmployeeDashboard = title.includes("Welcome");

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <LinearGradient
        colors={['rgba(29, 185, 84, 0.15)', colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerContainer}
      >
        <View style={styles.topRow}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color={colors.text.primary} />
            </View>
            <View>
              {isEmployeeDashboard ? (
                <>
                  <Text style={styles.greeting}>Welcome back,</Text>
                  <Text style={styles.name}>{cleanTitle || "User"}</Text>
                </>
              ) : (
                <Text style={styles.name}>{title}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={20} color={colors.text.primary} />
            </TouchableOpacity>
            {onLogout && (
              <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                 <Ionicons name="log-out-outline" size={20} color={colors.status.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {(date || subtitle) && (
          <View style={styles.bottomRow}>
            {date && <Text style={styles.date}>{date}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: spacing.large,
    paddingTop: 60, // Top safe area 
    paddingBottom: spacing.large,
    borderBottomLeftRadius: radius.large,
    borderBottomRightRadius: radius.large,
    marginHorizontal: -spacing.large, // Reaches to the edges of the parent padding
    marginTop: -spacing.large,        // Optional if we want it pinned to the absolute top
    ...shadows.card,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  greeting: { 
    color: colors.text.secondary, 
    fontSize: 13,
    marginBottom: 2 
  },
  name: { 
    color: colors.text.primary, 
    fontSize: 20, 
    fontWeight: "bold" 
  },
  actionSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.medium,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutBtn: { 
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // subtle red background
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)', // subtle red border
  },
  bottomRow: {
    marginTop: spacing.medium,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: { 
    color: colors.primary, 
    fontSize: 14,
    fontWeight: "600",
  },
  subtitle: { 
    color: colors.text.secondary,
    fontSize: 14,
  },
});
