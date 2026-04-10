import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, TextInput, TouchableOpacity, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";

import { useAuth } from "../hooks/useAuth";
import { Header } from "../components/Header";
import { StatCard } from "../components/StatCard";
import { LeaveCard } from "../components/LeaveCard";
import { EventCard } from "../components/EventCard";

import { useEvents } from "../hooks/useEvents";

import { loadPendingLeaves, updateLeaveStatus, LeaveRequest } from "../services/leaveService";
import { createEvent } from "../services/eventService";
import { colors, spacing, radius, shadows } from "../theme/colors";

export const AdminDashboardScreen = () => {
  const { user, role, loading: authLoading, logout } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // the hook manages our real-time feed globally 
  const { events, loading: eventsLoading } = useEvents();

  const fetchLeaves = useCallback(async () => {
    setDataLoading(true);
    try {
      const pendingLeaves = await loadPendingLeaves();
      setLeaves(pendingLeaves);
    } catch (error) {
      console.error(error);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/login");
      } else if (role && role !== "admin") {
        logout().then(() => router.replace("/login"));
      } else if (role === "admin") {
        fetchLeaves();
      }
    }
  }, [user, role, authLoading, fetchLeaves, logout]);

  const handleLeaveAction = async (id: string, status: "approved" | "rejected") => {
    try {
      await updateLeaveStatus(id, status);
      Alert.alert(`Leave ${status}`);
      await fetchLeaves();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventName || !eventDate || !eventTime || !eventLocation) {
      return Alert.alert("Error", "Please fill all fields");
    }
    setCreatingEvent(true);
    try {
      await createEvent({
        title: eventName,
        date: eventDate,
        time: eventTime,
        location: eventLocation,
        description: `Created by admin`,
        assignedEmployees: [] // Admin can assign later, or everyone sees it if we update logic.
      });
      Alert.alert("Success", "Event created successfully! 🎉");
      setEventName("");
      setEventDate("");
      setEventTime("");
      setEventLocation("");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create event");
    } finally {
      setCreatingEvent(false);
    }
  };

  if (authLoading) return <View style={styles.container} />;

  return (
    <ScrollView style={styles.container}>
      <Header 
        title="Admin Overview" 
        subtitle="Organization snapshot"
        onLogout={async () => { await logout(); router.replace("/login"); }}
      />

      <View style={styles.statsRow}>
        <StatCard value="42" label="Employees" icon="people" delay={200} />
        <StatCard value="91%" label="Attendance" percentage={91} icon="analytics" delay={400} />
      </View>

      <View style={[styles.card, { marginBottom: spacing.large }]}>
        <Text style={styles.cardTitle}>Create New Event</Text>
        <View style={styles.inputGroup}>
          <TextInput style={styles.input} placeholder="Event Name" placeholderTextColor={colors.text.placeholder} value={eventName} onChangeText={setEventName} />
          
          <View style={styles.row}>
            <TouchableOpacity style={[styles.input, { flex: 1, marginRight: spacing.small, justifyContent: 'center' }]} onPress={() => setShowDatePicker(true)}>
              <Text style={{ color: eventDate ? colors.text.primary : colors.text.placeholder }}>
                {eventDate || "Select Date"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.input, { flex: 1, marginLeft: spacing.small, justifyContent: 'center' }]} onPress={() => setShowTimePicker(true)}>
              <Text style={{ color: eventTime ? colors.text.primary : colors.text.placeholder }}>
                {eventTime || "Select Time"}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TextInput style={styles.input} placeholder="Location" placeholderTextColor={colors.text.placeholder} value={eventLocation} onChangeText={setEventLocation} />
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={new Date()} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={new Date()}
            onChange={(_, date) => {
              setShowDatePicker(false);
              if (date) setEventDate(date.toISOString().split("T")[0]);
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={new Date()} mode="time" display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, date) => {
              setShowTimePicker(false);
              if (date) setEventTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }}
          />
        )}

        <TouchableOpacity onPress={handleCreateEvent} disabled={creatingEvent}>
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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pending Sick Leave Requests</Text>

        {leaves.length === 0 && !dataLoading && (
          <Text style={styles.empty}>No pending requests 🎉</Text>
        )}
        {dataLoading && <Text style={styles.empty}>Loading...</Text>}

        {leaves.map((l, i) => (
          <LeaveCard 
            key={l.id} 
            leave={l} 
            onApprove={() => l.id && handleLeaveAction(l.id, "approved")}
            onReject={() => l.id && handleLeaveAction(l.id, "rejected")}
            delay={600 + (i * 100)}
          />
        ))}
      </View>

      <View style={[styles.card, { marginTop: 0 }]}>
        <Text style={styles.cardTitle}>All Events</Text>
        
        {eventsLoading ? (
          <Text style={styles.empty}>Loading events...</Text>
        ) : events.length === 0 ? (
          <Text style={styles.empty}>No events created yet 🎉</Text>
        ) : (
          events.map((ev, i) => {
            const evDate = new Date(ev.date);
            const today = new Date();
            let presetStatus: "upcoming" | "ongoing" | "completed" = "upcoming";
            if (evDate.toDateString() === today.toDateString()) presetStatus = "ongoing";
            else if (evDate < today) presetStatus = "completed";

            return (
              <EventCard
                key={ev.id || i}
                eventName={ev.title}
                date={ev.date || "TBD"}
                time={ev.time || "TBD"}
                location={ev.location || "TBD"}
                status={presetStatus}
                delay={600 + (i * 100)}
              />
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.large, paddingBottom: 60 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.large },
  card: { 
    backgroundColor: colors.cardBackground, 
    borderRadius: radius.large, 
    padding: spacing.large,
    ...shadows.card 
  },
  cardTitle: { color: colors.text.label, fontSize: 16, marginBottom: spacing.medium, fontWeight: "bold" },
  empty: { color: colors.text.secondary, textAlign: "center", marginTop: spacing.small },
  inputGroup: { marginBottom: spacing.medium },
  row: { flexDirection: "row", justifyContent: "space-between" },
  input: {
    backgroundColor: colors.secondaryBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.medium,
    padding: 14,
    color: colors.text.primary,
    marginBottom: spacing.small
  },
  createBtn: {
    borderRadius: radius.medium,
    padding: spacing.medium,
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  createBtnText: {
    color: colors.text.primary,
    fontWeight: "bold",
    fontSize: 16,
  }
});
