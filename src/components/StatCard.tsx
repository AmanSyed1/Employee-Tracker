import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, shadows } from "../theme/colors";
import Svg, { Circle } from "react-native-svg";

type StatCardProps = {
  value: string | number;
  label: string;
  percentage?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  delay?: number;
};

export const StatCard = ({ value, label, percentage, icon = "stats-chart", delay = 0 }: StatCardProps) => {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true })
    ]).start();
  }, [delay, fadeAnim, slideAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity activeOpacity={0.8} style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.iconBox}>
            <Ionicons name={icon} size={20} color={colors.primary} />
          </View>
          {percentage !== undefined && (
            <View style={styles.chartContainer}>
              <Svg width={44} height={44} viewBox="0 0 60 60">
                <Circle cx="30" cy="30" r="24" stroke={colors.border} strokeWidth="6" fill="none" />
                <Circle
                  cx="30" cy="30" r="24" stroke={colors.primary} strokeWidth="6" fill="none"
                  strokeDasharray="151" strokeDashoffset={151 - (151 * percentage) / 100} strokeLinecap="round"
                />
              </Svg>
              <View style={styles.chartTextContainer}>
                <Text style={styles.chartText}>{percentage}</Text>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { width: "48%" },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.large,
    padding: spacing.large,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.medium },
  iconBox: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    justifyContent: "center", alignItems: "center"
  },
  chartContainer: { position: "relative", justifyContent: "center", alignItems: "center" },
  chartTextContainer: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  chartText: { color: colors.text.primary, fontSize: 10, fontWeight: "bold" },
  value: { color: colors.text.primary, fontSize: 26, fontWeight: "bold", marginBottom: 4 },
  label: { color: colors.text.secondary, fontSize: 14 },
});
