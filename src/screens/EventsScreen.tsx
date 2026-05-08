import React, { useState, useMemo, useCallback, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Animated } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, shadows } from "../theme/colors";
import { Header } from "../components/Header";
import { EventCard } from "../components/EventCard";
import { useEvents } from "../hooks/useEvents";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";

// Same descriptions map as Admin side
const eventDescriptionsMap: Record<string, string> = {
  "Business Expo": "A large-scale business networking and innovation expo featuring startups, investors, and industry professionals.",
  "Deep's 25th Anniversary": "A celebration event marking Deep's 25th company anniversary with team activities and special guests.",
  "Aman's Birthday": "A small in-office birthday celebration for Aman with the team.",
  "Adam's Birthday": "A casual birthday gathering organized for Adam and office staff.",
  "Sanjay's Wedding Party": "A special wedding celebration event hosted for Sanjay with employees and management.",
};

export const EventsScreen = () => {
  const { user } = useAuth();
  const { events, loading } = useEvents(user?.uid);
  const { profile, loadUser } = useUser(user?.uid);
  const [activeTab, setActiveTab] = useState<"Upcoming" | "Completed">("Upcoming");

  // Event Details Modal State
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const detailsFadeAnim = useRef(new Animated.Value(0)).current;
  const detailsScaleAnim = useRef(new Animated.Value(0.95)).current;

  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        loadUser();
      }
    }, [user?.uid, loadUser])
  );

  const openEventDetails = (ev: any) => {
    setSelectedEvent(ev);
    Animated.parallel([
      Animated.timing(detailsFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(detailsScaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  };

  const closeEventDetails = () => {
    Animated.parallel([
      Animated.timing(detailsFadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(detailsScaleAnim, { toValue: 0.95, duration: 150, useNativeDriver: true }),
    ]).start(() => setSelectedEvent(null));
  };

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
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return activeTab === "Upcoming" ? dateA - dateB : dateB - dateA;
    });
  }, [events, activeTab, today]);

  const renderTab = (tab: "Upcoming" | "Completed") => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[styles.tab, isActive && styles.activeTab]}
        onPress={() => setActiveTab(tab)}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
          {tab}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Events"
        profileImage={profile?.profileImage}
      />

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
              <Ionicons name="calendar-outline" size={48} color={colors.text.placeholder} />
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
                  onPress={() => openEventDetails(ev)}
                />
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Event Details Modal */}
      <Modal
        transparent
        visible={!!selectedEvent}
        animationType="none"
        onRequestClose={closeEventDetails}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalBackdrop, { opacity: detailsFadeAnim }]} />
          <Animated.View
            style={[
              styles.detailsCard,
              { opacity: detailsFadeAnim, transform: [{ scale: detailsScaleAnim }] },
            ]}
          >
            <TouchableOpacity style={styles.closeButton} onPress={closeEventDetails} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>

            {selectedEvent && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.large }}>
                {/* Event Title Header */}
                <View style={styles.detailsTitleRow}>
                  <View style={styles.detailsIconCircle}>
                    <Ionicons name="calendar" size={22} color={colors.primary} />
                  </View>
                  <Text style={styles.detailsTitle} numberOfLines={2}>{selectedEvent.title}</Text>
                </View>

                <View style={styles.detailsGrid}>
                  {/* Date */}
                  <View style={styles.detailsRow}>
                    <Ionicons name="calendar-outline" size={18} color={colors.primary} style={styles.detailsRowIcon} />
                    <View>
                      <Text style={styles.detailsRowLabel}>Date</Text>
                      <Text style={styles.detailsRowValue}>{selectedEvent.date || "TBD"}</Text>
                    </View>
                  </View>

                  {/* Time */}
                  <View style={styles.detailsRow}>
                    <Ionicons name="time-outline" size={18} color={colors.primary} style={styles.detailsRowIcon} />
                    <View>
                      <Text style={styles.detailsRowLabel}>Time</Text>
                      <Text style={styles.detailsRowValue}>{selectedEvent.time || "TBD"}</Text>
                    </View>
                  </View>

                  {/* Location */}
                  <View style={[styles.detailsRow, { marginBottom: 0 }]}>
                    <Ionicons name="location-outline" size={18} color={colors.primary} style={styles.detailsRowIcon} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailsRowLabel}>Location</Text>
                      <Text style={styles.detailsRowValue}>{selectedEvent.location || "TBD"}</Text>
                    </View>
                  </View>
                </View>

                {/* Description */}
                <View style={styles.descSection}>
                  <Text style={styles.descLabel}>About This Event</Text>
                  <Text style={styles.descText}>
                    {eventDescriptionsMap[selectedEvent.title] || selectedEvent.description || "No description available for this event."}
                  </Text>
                </View>
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.large,
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
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    color: colors.text.secondary,
    fontStyle: "italic",
    fontSize: 15,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  detailsCard: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: colors.cardBackground,
    borderRadius: radius.large,
    padding: spacing.xlarge,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: spacing.small,
    marginBottom: spacing.small,
    marginRight: -spacing.small,
    marginTop: -spacing.small,
  },
  detailsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.large,
    gap: spacing.medium,
  },
  detailsIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(29, 185, 84, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  detailsTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },
  detailsGrid: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: radius.medium,
    padding: spacing.large,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.large,
    gap: spacing.large,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.medium,
  },
  detailsRowIcon: {
    marginTop: 2,
  },
  detailsRowLabel: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailsRowValue: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  descSection: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: radius.medium,
    padding: spacing.large,
    borderWidth: 1,
    borderColor: colors.border,
  },
  descLabel: {
    color: colors.text.label,
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.small,
  },
  descText: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 22,
  },
});
