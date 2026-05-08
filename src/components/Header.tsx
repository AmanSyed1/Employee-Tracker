import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router, usePathname } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { NotificationPanel } from "./NotificationPanel";
import { colors, radius, shadows, spacing } from "../theme/colors";

type HeaderProps = {
  title: string;
  subtitle?: string;
  date?: string;
  profileImage?: string | null;
  onLogout?: () => void;
};

export const Header = ({ title, subtitle, date, profileImage, onLogout }: HeaderProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-15)).current;
  const { role } = useAuth();
  const pathname = usePathname();
  const [notificationsVisible, setNotificationsVisible] = useState(false);

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

  const handleAvatarPress = () => {
    if (role === "admin") {
      if (!pathname.includes("/(admin)/profile")) {
        router.push("/(admin)/profile");
      }
    } else {
      if (!pathname.includes("/(employee)/profile")) {
        router.push("/(employee)/profile");
      }
    }
  };

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
            {/* Clickable avatar → navigates to profile */}
            <TouchableOpacity style={styles.avatar} onPress={handleAvatarPress} activeOpacity={0.75}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={{ width: 44, height: 44, borderRadius: 22 }}
                />
              ) : (
                <Ionicons name="person" size={20} color={colors.text.primary} />
              )}
            </TouchableOpacity>
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
            <TouchableOpacity style={styles.iconBtn} onPress={() => setNotificationsVisible(true)} activeOpacity={0.7}>
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
      
      <NotificationPanel 
        visible={notificationsVisible} 
        onClose={() => setNotificationsVisible(false)} 
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: spacing.large,
    paddingTop: 60,
    paddingBottom: spacing.large,
    borderBottomLeftRadius: radius.large,
    borderBottomRightRadius: radius.large,
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
    overflow: "hidden",
  },
  greeting: {
    color: colors.text.secondary,
    fontSize: 13,
    marginBottom: 2,
  },
  name: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: "bold",
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
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
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
