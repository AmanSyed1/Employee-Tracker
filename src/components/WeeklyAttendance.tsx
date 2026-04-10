import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { colors, radius, spacing, shadows } from "../theme/colors";
import { Ionicons } from "@expo/vector-icons";

type WeeklyAttendanceProps = {
  week: { day: string; color: string }[];
  delay?: number;
};

export const WeeklyAttendance = ({ week, delay = 0 }: WeeklyAttendanceProps) => {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true })
    ]).start();
  }, [delay, fadeAnim, slideAnim]);

  const getDayIcon = (color: string) => {
    if (color === colors.status.success) return <Ionicons name="checkmark" size={16} color="white" />;
    if (color === colors.status.error) return <Ionicons name="close" size={16} color="white" />;
    if (color === colors.status.warning) return <Text style={styles.halfText}>1/2</Text>;
    return null;
  };

  const getDayColor = (color: string) => {
    if (color === colors.status.success) return colors.status.success;
    if (color === colors.status.error) return colors.status.error;
    if (color === colors.status.warning) return colors.status.warning;
    return colors.border;
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity activeOpacity={0.9} style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
          </View>
          <Text style={styles.title}>This Week</Text>
        </View>
        <View style={styles.container}>
          {week.map((d, i) => (
            <View key={i} style={styles.dayCol}>
              <Text style={styles.dayText}>{d.day.substring(0, 3)}</Text>
              <View style={[styles.circle, { backgroundColor: getDayColor(d.color) }]}>
                {getDayIcon(d.color)}
              </View>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: { 
    marginTop: spacing.large, 
    backgroundColor: colors.cardBackground, 
    padding: spacing.large, 
    borderRadius: radius.large,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.border
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: spacing.medium, gap: spacing.small },
  iconBox: {
    width: 36, height: 36, borderRadius: 18, 
    backgroundColor: 'rgba(29, 185, 84, 0.1)', 
    justifyContent: "center", alignItems: "center" 
  },
  title: { color: colors.text.primary, fontSize: 18, fontWeight: "bold" },
  container: { flexDirection: "row", justifyContent: "space-between", paddingTop: spacing.small },
  dayCol: { alignItems: "center", gap: spacing.small },
  dayText: { color: colors.text.secondary, fontSize: 12, fontWeight: "600" },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center"
  },
  halfText: { fontSize: 10, fontWeight: "bold", color: "white" }
});
