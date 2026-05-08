import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, StyleProp, TextStyle, ActivityIndicator, Pressable, View } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import { colors, radius, spacing } from "../theme/colors";

type CustomButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const CustomButton = ({ title, onPress, loading, disabled, style, textStyle, icon }: CustomButtonProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      style={[
        styles.button, 
        (disabled || loading) ? styles.disabled : null, 
        style,
        animatedStyle
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.text.primary} size="small" style={styles.spinner} />
          <Text style={[styles.text, textStyle]}>Signing you in...</Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, textStyle]}>{title}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    padding: spacing.medium,
    borderRadius: radius.medium,
    alignItems: "center",
    justifyContent: "center",
    height: 52,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginRight: spacing.small,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  spinner: {
    marginRight: 10,
  },
  disabled: { opacity: 0.5 },
  text: { color: colors.text.primary, fontSize: 16, fontWeight: "bold" }
});

