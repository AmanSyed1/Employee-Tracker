import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, shadows } from "../theme/colors";

type AttendanceButtonProps = {
  checkInTime: string;
  checkOutTime: string;
  loading: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
};

export const AttendanceButton = ({
  checkInTime,
  checkOutTime,
  loading,
  onCheckIn,
  onCheckOut
}: AttendanceButtonProps) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  const hasCheckedIn = checkInTime !== "NA";
  const hasCheckedOut = checkOutTime !== "NA";
  const disabled = hasCheckedOut || loading;

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.95, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  const onPress = () => {
    if (disabled) return;
    if (!hasCheckedIn) onCheckIn();
    else if (!hasCheckedOut) onCheckOut();
  };

  useEffect(() => {
    if (!disabled) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000 }),
          withTiming(0.3, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [disabled, glowOpacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
      transform: [{ scale: scale.value * 1.02 }]
    };
  });

  let title = "Check In";
  let subtitle = "Ready to start your day";
  let iconName: keyof typeof Ionicons.glyphMap = "log-in-outline";
  let gradientColors: readonly [string, string] = [colors.primary, colors.background];
  let glowColor = colors.primary;

  if (hasCheckedOut) {
    title = "Completed";
    subtitle = `In: ${checkInTime} • Out: ${checkOutTime}`;
    iconName = "checkmark-circle-outline";
    gradientColors = [colors.secondaryBackground, colors.background];
    glowColor = "transparent";
  } else if (hasCheckedIn) {
    title = "Check Out";
    subtitle = `Checked in at ${checkInTime}`;
    iconName = "log-out-outline";
    gradientColors = [colors.status.warning, colors.background];
    glowColor = colors.status.warning;
  }

  return (
    <View style={styles.container}>
      {!disabled && (
        <Animated.View 
          style={[
            styles.glow, 
            glowStyle, 
            { 
              backgroundColor: glowColor,
              shadowColor: glowColor, 
            }
          ]} 
        />
      )}
      <Animated.View style={[styles.buttonWrapper, animatedStyle]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          disabled={disabled}
          style={styles.pressable}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, disabled && styles.disabled]}
          >
            <View style={styles.content}>
              <Ionicons 
                name={iconName} 
                size={28} 
                color={disabled ? colors.text.secondary : colors.text.primary} 
                style={styles.icon}
              />
              <View style={styles.textContainer}>
                <Text style={[styles.title, disabled && styles.disabledText]}>
                  {loading ? "Processing..." : title}
                </Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.small,
    paddingBottom: spacing.medium,
  },
  glow: {
    position: "absolute",
    width: "100%",
    height: 60, 
    borderRadius: radius.large,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 20, // Android shadow
  },
  buttonWrapper: {
    width: "100%",
    borderRadius: radius.large,
    ...shadows.card,
  },
  pressable: {
    width: "100%",
  },
  gradient: {
    flexDirection: "row",
    height: 60,
    borderRadius: radius.large,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.large,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: spacing.medium,
  },
  textContainer: {
    alignItems: "flex-start",
  },
  title: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledText: {
    color: colors.text.secondary,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  }
});
