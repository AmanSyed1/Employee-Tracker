import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../theme/colors";
import { Header } from "../components/Header";

export const LeaveScreen = () => {
  return (
    <View style={styles.container}>
      <Header title="Leave Management" />
      <View style={styles.content}>
        <Text style={styles.placeholder}>Leave requests and balances will appear here.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.large },
  placeholder: { color: colors.text.secondary, fontSize: 16 }
});
