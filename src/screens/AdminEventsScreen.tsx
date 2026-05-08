import React, { useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform, Modal, Animated, ActivityIndicator } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, shadows } from "../theme/colors";
import { Header } from "../components/Header";
import { EventCard } from "../components/EventCard";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";
import { useEvents } from "../hooks/useEvents";
import { createEvent } from "../services/eventService";

const eventDescriptionsMap: Record<string, string> = {
  "Business Expo": "A large-scale business networking and innovation expo featuring startups, investors, and industry professionals.",
  "Deep's 25th Anniversary": "A celebration event marking Deep's 25th company anniversary with team activities and special guests.",
  "Aman's Birthday": "A small in-office birthday celebration for Aman with the team.",
  "Adam's Birthday": "A casual birthday gathering organized for Adam and office staff.",
  "Sanjay's Wedding Party": "A special wedding celebration event hosted for Sanjay with employees and management."
};

const getEventDateTime = (dateStr: string, timeStr: string) => {
  if (!dateStr) return new Date().getTime();
  const baseDate = new Date(`${dateStr}T00:00:00`);
  if (!timeStr) return baseDate.getTime();
  
  const parsedWithTime = new Date(`${dateStr} ${timeStr}`);
  return isNaN(parsedWithTime.getTime()) ? baseDate.getTime() : parsedWithTime.getTime();
};

export const AdminEventsScreen = () => {
  const { user } = useAuth();
  const { profile, loadUser } = useUser(user?.uid);
  const { events, loading: eventsLoading } = useEvents(user?.uid);

  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [validationError, setValidationError] = useState("");

  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");

  // Success Modal State
  const [successVisible, setSuccessVisible] = useState(false);
  const successFadeAnim = useRef(new Animated.Value(0)).current;
  const successScaleAnim = useRef(new Animated.Value(0.95)).current;

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

  const openSuccessModal = () => {
    setSuccessVisible(true);
    Animated.parallel([
      Animated.timing(successFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(successScaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  };

  const closeSuccessModal = () => {
    Animated.parallel([
      Animated.timing(successFadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(successScaleAnim, { toValue: 0.95, duration: 150, useNativeDriver: true }),
    ]).start(() => setSuccessVisible(false));
  };

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

  const handleCreateEvent = async () => {
    if (!eventName || !eventDate || !eventTime || !eventLocation) {
      setValidationError("Event title, date, time, and location are required.");
      setTimeout(() => setValidationError(""), 3500);
      return;
    }
    setValidationError("");
    setCreatingEvent(true);
    try {
      await createEvent({
        title: eventName,
        date: eventDate,
        time: eventTime,
        location: eventLocation,
        description: eventDescription.trim() || `Created by admin`,
        assignedEmployees: [],
      });
      openSuccessModal();
      setEventName("");
      setEventDate("");
      setEventTime("");
      setEventLocation("");
      setEventDescription("");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create event");
    } finally {
      setCreatingEvent(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = events
    .filter((ev) => {
      const evDate = new Date(ev.date);
      evDate.setHours(0, 0, 0, 0);
      return evDate >= today;
    })
    .sort((a, b) => getEventDateTime(a.date || "", a.time || "") - getEventDateTime(b.date || "", b.time || "")); // Ascending

  const historyEvents = events
    .filter((ev) => {
      const evDate = new Date(ev.date);
      evDate.setHours(0, 0, 0, 0);
      return evDate < today;
    })
    .sort((a, b) => getEventDateTime(b.date || "", b.time || "") - getEventDateTime(a.date || "", a.time || "")); // Descending (most recent past first)

  return (
    <View style={styles.wrapper}>
      <Header title="Events Management" profileImage={profile?.profileImage} />
      
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Create Event Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
             <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
             <Text style={styles.cardTitle}>Create New Event</Text>
          </View>

          {validationError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={16} color={colors.status.error} style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{validationError}</Text>
            </View>
          ) : null}
          
          <View style={styles.inputGroup}>
            <TextInput 
              style={styles.input} 
              placeholder="Event Name" 
              placeholderTextColor={colors.text.placeholder} 
              value={eventName} 
              onChangeText={(text) => { setEventName(text); setValidationError(""); }} 
            />

            <View style={styles.row}>
              <TouchableOpacity 
                style={[styles.input, { flex: 1, marginRight: spacing.small, justifyContent: "center" }]} 
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: eventDate ? colors.text.primary : colors.text.placeholder }}>
                  {eventDate || "Select Date"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.input, { flex: 1, marginLeft: spacing.small, justifyContent: "center" }]} 
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={{ color: eventTime ? colors.text.primary : colors.text.placeholder }}>
                  {eventTime || "Select Time"}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput 
              style={styles.input} 
              placeholder="Location" 
              placeholderTextColor={colors.text.placeholder} 
              value={eventLocation} 
              onChangeText={(text) => { setEventLocation(text); setValidationError(""); }} 
            />

            <TextInput 
              style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]} 
              placeholder="Event Description (Optional)" 
              placeholderTextColor={colors.text.placeholder} 
              value={eventDescription} 
              onChangeText={setEventDescription} 
              multiline
            />
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={new Date()} 
              mode="date" 
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={new Date()}
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) {
                  setEventDate(date.toISOString().split("T")[0]);
                  setValidationError("");
                }
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={new Date()} 
              mode="time" 
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, date) => {
                setShowTimePicker(false);
                if (date) {
                  setEventTime(date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
                  setValidationError("");
                }
              }}
            />
          )}

          <TouchableOpacity onPress={handleCreateEvent} disabled={creatingEvent} activeOpacity={0.8}>
            <LinearGradient
              colors={[colors.primary, colors.background]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.createBtn, creatingEvent && { opacity: 0.7 }]}
            >
              <Text style={styles.createBtnText}>{creatingEvent ? "Creating..." : "Create Event"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {eventsLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Custom Tab Selector */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === "upcoming" && styles.tabButtonActive]}
                onPress={() => setActiveTab("upcoming")}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === "upcoming" && styles.tabTextActive]}>Upcoming</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === "completed" && styles.tabButtonActive]}
                onPress={() => setActiveTab("completed")}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === "completed" && styles.tabTextActive]}>Completed</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.listContainer}>
              {activeTab === "upcoming" ? (
                upcomingEvents.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="calendar-clear-outline" size={48} color={colors.text.placeholder} />
                    <Text style={styles.empty}>No upcoming events scheduled</Text>
                  </View>
                ) : (
                  upcomingEvents.map((ev, i) => {
                    const evDate = new Date(ev.date);
                    let presetStatus: "upcoming" | "ongoing" | "completed" = "upcoming";
                    if (evDate.toDateString() === today.toDateString()) presetStatus = "ongoing";

                    return (
                      <EventCard
                        key={ev.id || `upc-${i}`}
                        eventName={ev.title}
                        date={ev.date || "TBD"}
                        time={ev.time || "TBD"}
                        location={ev.location || "TBD"}
                        status={presetStatus}
                        delay={50 + i * 50}
                        onPress={() => openEventDetails(ev)}
                      />
                    );
                  })
                )
              ) : (
                historyEvents.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="time-outline" size={48} color={colors.text.placeholder} />
                    <Text style={styles.empty}>No past events recorded</Text>
                  </View>
                ) : (
                  historyEvents.map((ev, i) => (
                    <EventCard
                      key={ev.id || `hist-${i}`}
                      eventName={ev.title}
                      date={ev.date || "TBD"}
                      time={ev.time || "TBD"}
                      location={ev.location || "TBD"}
                      status="completed"
                      delay={50 + i * 50}
                      onPress={() => openEventDetails(ev)}
                    />
                  ))
                )
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Success Modal */}
      <Modal transparent visible={successVisible} animationType="none" onRequestClose={closeSuccessModal}>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalBackdrop, { opacity: successFadeAnim }]} />
          <Animated.View style={[styles.modalCard, { opacity: successFadeAnim, transform: [{ scale: successScaleAnim }] }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(29, 185, 84, 0.1)' }]}>
              <Ionicons name="checkmark-circle" size={40} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Event created successfully</Text>
            <Text style={styles.modalMessage}>The event has been added to the organization calendar.</Text>
            <TouchableOpacity style={styles.modalButton} onPress={closeSuccessModal} activeOpacity={0.8}>
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Event Details Modal */}
      <Modal transparent visible={!!selectedEvent} animationType="none" onRequestClose={closeEventDetails}>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalBackdrop, { opacity: detailsFadeAnim }]} />
          <Animated.View style={[styles.detailsModalCard, { opacity: detailsFadeAnim, transform: [{ scale: detailsScaleAnim }] }]}>
            <TouchableOpacity style={styles.closeButton} onPress={closeEventDetails}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>

            {selectedEvent && (
              <>
                <View style={styles.detailsHeader}>
                  <View style={styles.detailsIconCircle}>
                    <Ionicons name="calendar" size={32} color={colors.primary} />
                  </View>
                  <View style={styles.detailsHeaderInfo}>
                    <Text style={styles.detailsTitle} numberOfLines={2}>{selectedEvent.title}</Text>
                    <View style={styles.detailsBadge}>
                       <Text style={styles.detailsBadgeText}>EVENT DETAILS</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailsRow}>
                    <Ionicons name="calendar-outline" size={20} color={colors.primary} style={styles.detailsRowIcon} />
                    <View>
                      <Text style={styles.detailsRowLabel}>Date</Text>
                      <Text style={styles.detailsRowValue}>{selectedEvent.date || "TBD"}</Text>
                    </View>
                  </View>

                  <View style={styles.detailsRow}>
                    <Ionicons name="time-outline" size={20} color={colors.primary} style={styles.detailsRowIcon} />
                    <View>
                      <Text style={styles.detailsRowLabel}>Time</Text>
                      <Text style={styles.detailsRowValue}>{selectedEvent.time || "TBD"}</Text>
                    </View>
                  </View>

                  <View style={styles.detailsRow}>
                    <Ionicons name="location-outline" size={20} color={colors.primary} style={styles.detailsRowIcon} />
                    <View>
                      <Text style={styles.detailsRowLabel}>Location</Text>
                      <Text style={styles.detailsRowValue}>{selectedEvent.location || "TBD"}</Text>
                    </View>
                  </View>

                  <View style={styles.detailsDescRow}>
                    <Ionicons name="document-text-outline" size={20} color={colors.primary} style={styles.detailsRowIcon} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailsRowLabel}>Description</Text>
                      <Text style={styles.detailsDescValue}>
                        {eventDescriptionsMap[selectedEvent.title] || selectedEvent.description || "No description provided."}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: spacing.large, paddingBottom: 60, paddingTop: spacing.medium },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.large,
    padding: spacing.large,
    marginBottom: spacing.large,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.medium },
  cardTitle: { color: colors.text.primary, fontSize: 16, fontWeight: "bold" },
  
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: spacing.medium,
    borderRadius: radius.medium,
    marginBottom: spacing.medium,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: colors.status.error,
    fontSize: 13,
    fontWeight: "500",
  },

  // Tab Selector
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.cardBackground,
    borderRadius: radius.medium,
    padding: 4,
    marginBottom: spacing.large,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: radius.small,
  },
  tabButtonActive: {
    backgroundColor: colors.secondaryBackground,
  },
  tabText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: colors.primary,
  },

  listContainer: { marginBottom: spacing.large },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    opacity: 0.8,
  },
  empty: { 
    color: colors.text.secondary, 
    textAlign: "center", 
    marginTop: spacing.medium, 
    fontStyle: "italic", 
    fontSize: 14,
  },
  inputGroup: { marginBottom: spacing.medium },
  row: { flexDirection: "row", justifyContent: "space-between" },
  input: {
    backgroundColor: colors.secondaryBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.medium,
    padding: 14,
    color: colors.text.primary,
    marginBottom: spacing.small,
  },
  createBtn: {
    borderRadius: radius.medium,
    padding: spacing.medium,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  createBtnText: {
    color: colors.text.primary,
    fontWeight: "bold",
    fontSize: 16,
  },

  // Modals Overlay shared
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },

  // Success Modal Specific
  modalCard: {
    width: "80%",
    backgroundColor: colors.cardBackground,
    borderRadius: radius.large,
    padding: spacing.xlarge,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    alignItems: "center",
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.large,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: spacing.small,
  },
  modalMessage: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xlarge,
  },
  modalButton: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.medium,
    alignItems: "center",
  },
  modalButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: "bold",
  },

  // Event Details Modal Specific
  detailsModalCard: {
    width: "90%",
    backgroundColor: colors.cardBackground,
    borderRadius: radius.large,
    padding: spacing.xlarge,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  closeButton: {
    position: "absolute",
    top: spacing.medium,
    right: spacing.medium,
    padding: spacing.small,
    zIndex: 10,
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xlarge,
    marginTop: spacing.small,
  },
  detailsIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.large,
  },
  detailsHeaderInfo: {
    flex: 1,
  },
  detailsTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },
  detailsBadge: {
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.small,
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.2)',
  },
  detailsBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  detailsGrid: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: radius.medium,
    padding: spacing.large,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.large,
  },
  detailsDescRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  detailsRowIcon: {
    marginRight: spacing.medium,
  },
  detailsRowLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  detailsRowValue: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "bold",
  },
  detailsDescValue: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
});
