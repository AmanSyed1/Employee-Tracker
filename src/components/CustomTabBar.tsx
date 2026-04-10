import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, spacing, radius, shadows } from '../theme/colors';

const { width } = Dimensions.get('window');

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const tabWidth = width / state.routes.length;
  
  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: withSpring(state.index * tabWidth, { damping: 20, stiffness: 200 }) }]
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

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

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
          if (route.name === "index") return isFocused ? "home" : "home-outline";
          if (route.name === "events") return isFocused ? "calendar" : "calendar-outline";
          if (route.name === "leave") return isFocused ? "document-text" : "document-text-outline";
          if (route.name === "profile") return isFocused ? "person" : "person-outline";
          return "help-outline";
        };

        const getLabel = () => {
          if (route.name === "index") return "Home";
          if (route.name === "events") return "Events";
          if (route.name === "leave") return "Leave";
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
            <Ionicons
              name={getIconName() as any}
              size={24}
              color={isFocused ? colors.primary : colors.text.secondary}
              style={{ marginBottom: 4 }}
            />
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
