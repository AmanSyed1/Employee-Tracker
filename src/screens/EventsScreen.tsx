import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../theme/colors";
import { Header } from "../components/Header";

export const EventsScreen = () => {
  return (
    <View style={styles.container}>
      <Header title="Events" />
      <View style={styles.content}>
        <Text style={styles.placeholder}>Upcoming events will appear here.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.large },
  placeholder: { color: colors.text.secondary, fontSize: 16 }
});
