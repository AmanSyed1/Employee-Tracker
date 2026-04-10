import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../theme/colors";
import { Header } from "../components/Header";
import { useAuth } from "../hooks/useAuth";

export const ProfileScreen = () => {
  const { logout } = useAuth();
  
  return (
    <View style={styles.container}>
      <Header 
        title="Profile" 
        onLogout={logout} 
      />
      <View style={styles.content}>
        <Text style={styles.placeholder}>User profile details will appear here.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.large },
  placeholder: { color: colors.text.secondary, fontSize: 16 }
});
