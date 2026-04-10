import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from "react-native";
import { colors, spacing, radius, shadows } from "../theme/colors";
import { Header } from "../components/Header";
import { EventCard } from "../components/EventCard";
import { useEvents } from "../hooks/useEvents";
import { useAuth } from "../hooks/useAuth";

export const EventsScreen = () => {
  const { user } = useAuth();
  const { events, loading } = useEvents(user?.uid);
  const [activeTab, setActiveTab] = useState<"Upcoming" | "Completed">("Upcoming");

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      if (activeTab === "Upcoming") {
        return eventDate >= today;
      } else {
        return eventDate < today;
      }
    }).sort((a, b) => {
      // Sort upcoming by earliest first, completed by latest first
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return activeTab === "Upcoming" ? dateA - dateB : dateB - dateA;
    });
  }, [events, activeTab, today]);

  const renderTab = (tab: "Upcoming" | "Completed") => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[
          styles.tab,
          isActive && styles.activeTab
        ]}
        onPress={() => setActiveTab(tab)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.tabText,
          isActive && styles.activeTabText
        ]}>
          {tab}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Events" />
      
      <View style={styles.content}>
        <View style={styles.selectorContainer}>
          {renderTab("Upcoming")}
          {renderTab("Completed")}
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
        >
          {loading ? (
            <Text style={styles.emptyText}>Loading events...</Text>
          ) : filteredEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No {activeTab.toLowerCase()} events found
              </Text>
            </View>
          ) : (
            filteredEvents.map((ev, i) => {
              const evDate = new Date(ev.date);
              let presetStatus: "upcoming" | "ongoing" | "completed" = "upcoming";
              
              if (evDate.toDateString() === new Date().toDateString()) presetStatus = "ongoing";
              else if (evDate < today) presetStatus = "completed";

              return (
                <EventCard
                  key={ev.id || i}
                  eventName={ev.title}
                  date={ev.date || "TBD"}
                  time={ev.time || "TBD"}
                  location={ev.location || "TBD"}
                  status={presetStatus}
                  delay={100 + (i * 100)}
                />
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: spacing.large 
  },
  selectorContainer: {
    flexDirection: "row",
    backgroundColor: colors.cardBackground,
    borderRadius: radius.medium,
    padding: 4,
    marginTop: spacing.medium,
    marginBottom: spacing.large,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: radius.small,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabText: {
    color: colors.text.primary,
  },
  scrollContent: { 
    paddingBottom: 40 
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: { 
    color: colors.text.secondary, 
    fontStyle: "italic",
    fontSize: 15,
  }
});
