import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { colors, radius, spacing } from "../theme/colors";

type CustomButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export const CustomButton = ({ title, onPress, loading, disabled, style, textStyle }: CustomButtonProps) => (
  <TouchableOpacity
    style={[styles.button, (disabled || loading) ? styles.disabled : null, style]}
    onPress={onPress}
    disabled={disabled || loading}
  >
    <Text style={[styles.text, textStyle]}>{loading ? "Loading..." : title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    padding: spacing.medium,
    borderRadius: radius.medium,
    alignItems: "center",
  },
  disabled: { opacity: 0.5 },
  text: { color: colors.text.primary, fontSize: 16, fontWeight: "bold" }
});
