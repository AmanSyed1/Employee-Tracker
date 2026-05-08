import React, { useEffect, useRef } from "react";
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, shadows, spacing } from "../theme/colors";

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  confirmColor?: string;
};

export const ConfirmModal = ({ visible, title, message, onConfirm, onCancel, confirmLabel = "Confirm", confirmColor }: ConfirmModalProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmBtn, confirmColor ? { backgroundColor: confirmColor } : null]} onPress={onConfirm} activeOpacity={0.7}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  card: {
    width: "80%",
    backgroundColor: colors.cardBackground,
    borderRadius: radius.large,
    padding: spacing.xlarge,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  title: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: spacing.small,
    textAlign: "center",
  },
  message: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: "center",
    marginBottom: spacing.xlarge,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.medium,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.secondaryBackground,
    paddingVertical: 12,
    borderRadius: radius.medium,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.status.error,
    paddingVertical: 12,
    borderRadius: radius.medium,
    alignItems: "center",
  },
  confirmText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
