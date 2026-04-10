import { Tabs } from "expo-router";
import { CustomTabBar } from "../../src/components/CustomTabBar";

export default function EmployeeLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Hide standard backgrounds to prevent flashing
        sceneStyle: { backgroundColor: 'transparent' }
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="events" />
      <Tabs.Screen name="leave" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
