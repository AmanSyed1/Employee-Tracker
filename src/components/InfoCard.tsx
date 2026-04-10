import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, shadows } from "../theme/colors";

type InfoCardProps = {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  delay?: number;
};

export const InfoCard = ({ label, value, icon = "information-circle-outline", delay = 0 }: InfoCardProps) => {
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
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={20} color={colors.primary} />
          </View>
        </View>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    backgroundColor: colors.cardBackground,
    padding: spacing.large,
    borderRadius: radius.large,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { marginBottom: spacing.medium },
  iconContainer: { 
    width: 36, height: 36, borderRadius: 18, 
    backgroundColor: 'rgba(29, 185, 84, 0.1)', 
    justifyContent: "center", alignItems: "center" 
  },
  value: { color: colors.text.primary, fontSize: 24, fontWeight: "bold", marginBottom: 2 },
  label: { color: colors.text.secondary, fontSize: 13 },
});
