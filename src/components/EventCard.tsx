import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, shadows } from "../theme/colors";

export type EventCardProps = {
  eventName: string;
  date: string;
  time: string;
  location: string;
  status: "upcoming" | "ongoing" | "completed";
  onPress?: () => void;
  delay?: number;
};

export const EventCard = ({
  eventName,
  date,
  time,
  location,
  status,
  onPress,
  delay = 0,
}: EventCardProps) => {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true })
    ]).start();
  }, [delay, fadeAnim, slideAnim]);

  const handlePressIn = () => {
    if (onPress) Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };
  
  const handlePressOut = () => {
    if (onPress) Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const getStatusColor = () => {
    switch(status) {
      case "ongoing": return colors.status.success;
      case "upcoming": return colors.status.warning;
      case "completed": return colors.text.secondary;
      default: return colors.text.secondary;
    }
  };

  const statusColor = getStatusColor();

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: fadeAnim, 
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ] 
        }
      ]}
    >
      <Pressable 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.card}
      >
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{eventName}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>{date}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>{time}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>{location}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.medium,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.large,
    padding: spacing.large,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.medium,
  },
  title: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    marginRight: spacing.small,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.medium,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  detailsContainer: {
    backgroundColor: colors.secondaryBackground,
    padding: spacing.medium,
    borderRadius: radius.medium,
    gap: spacing.small,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.small,
  },
  infoText: {
    color: colors.text.secondary,
    fontSize: 14,
  }
});
