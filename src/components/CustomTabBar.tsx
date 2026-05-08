import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, spacing, radius, shadows } from '../theme/colors';

const { width } = Dimensions.get('window');

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  // Filter out hidden routes like 'index' or those with href: null
  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    return (options as any).href !== null && route.name !== 'index';
  });

  const tabWidth = visibleRoutes.length > 0 ? width / visibleRoutes.length : width;
  
  const activeRoute = state.routes[state.index];
  const visibleIndex = visibleRoutes.findIndex(r => r.key === activeRoute?.key);
  const indicatorIndex = visibleIndex >= 0 ? visibleIndex : 0;

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: withSpring(indicatorIndex * tabWidth, { damping: 20, stiffness: 200 }) }]
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.activeIndicatorContainer, { width: tabWidth }, animatedIndicatorStyle]}>
        <LinearGradient
          colors={['rgba(29, 185, 84, 0.25)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.activePill}
        />
      </Animated.View>

      {visibleRoutes.map((route) => {
        const { options } = descriptors[route.key];
        const isFocused = activeRoute?.key === route.key;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const getIconName = () => {
          if (route.name === "dashboard") return isFocused ? "home" : "home-outline";
          if (route.name === "employees") return isFocused ? "people" : "people-outline";
          if (route.name === "events") return isFocused ? "calendar" : "calendar-outline";
          if (route.name === "leaves") return isFocused ? "document-text" : "document-text-outline";
          if (route.name === "profile") return isFocused ? "person" : "person-outline";
          return "help-outline";
        };

        const getLabel = () => {
          if (options.title) return options.title;
          if (route.name === "dashboard") return "Home";
          if (route.name === "employees") return "Employees";
          if (route.name === "events") return "Events";
          if (route.name === "leaves") return "Leaves";
          if (route.name === "profile") return "Profile";
          return route.name;
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            {options.tabBarIcon ? (
              options.tabBarIcon({
                focused: isFocused,
                color: isFocused ? colors.primary : colors.text.secondary,
                size: 24
              })
            ) : (
              <Ionicons
                name={getIconName() as any}
                size={24}
                color={isFocused ? colors.primary : colors.text.secondary}
                style={{ marginBottom: 4 }}
              />
            )}
            <Text style={[styles.label, { color: isFocused ? colors.primary : colors.text.secondary }]}>
              {getLabel()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 80,
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 20, // safe area bottom
    ...shadows.card,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeIndicatorContainer: {
    position: 'absolute',
    height: '100%',
    justifyContent: 'flex-start',
    paddingTop: 8,
    alignItems: 'center',
    zIndex: 0,
  },
  activePill: {
    width: 60,
    height: 60,
    borderRadius: 30,
  }
});
