import { Tabs, Redirect } from "expo-router";
import { CustomTabBar } from "../../src/components/CustomTabBar";
import { useAuth } from "../../src/hooks/useAuth";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { colors } from "../../src/theme/colors";

import { Ionicons } from "@expo/vector-icons";

export default function AdminLayout() {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (role !== "admin") {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Hide standard backgrounds to prevent flashing
        sceneStyle: { backgroundColor: 'transparent' }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null, // 🔥 THIS HIDES IT FROM TAB BAR
        }}
      />
      <Tabs.Screen 
        name="dashboard" 
        options={{ 
          title: "Home", 
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} style={{ marginBottom: 4 }} /> 
        }} 
      />
      <Tabs.Screen 
        name="employees" 
        options={{ 
          title: "Employees", 
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} style={{ marginBottom: 4 }} /> 
        }} 
      />
      <Tabs.Screen 
        name="events" 
        options={{ 
          title: "Events", 
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} style={{ marginBottom: 4 }} /> 
        }} 
      />
      <Tabs.Screen 
        name="leaves" 
        options={{ 
          title: "Leaves", 
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} style={{ marginBottom: 4 }} /> 
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: "Profile", 
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} style={{ marginBottom: 4 }} /> 
        }} 
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
});
