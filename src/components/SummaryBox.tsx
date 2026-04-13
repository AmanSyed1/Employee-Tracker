import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, spacing } from "../theme/colors";

type SummaryBoxProps = {
  value: string | number;
  label: string;
  bgColor: string;
  numColor: string;
};

export const SummaryBox = ({ value, label, bgColor, numColor }: SummaryBoxProps) => {
  return (
    <View style={[styles.box, { backgroundColor: bgColor }]}>
      <Text style={[styles.value, { color: numColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.medium,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xsmall,
  },
  value: {
    fontSize: 20,
    fontWeight: "bold",
  },
  label: {
    fontSize: 10,
    color: "#F5F5F7", // Off-white as requested
    marginTop: 2,
    textAlign: "center",
  },
});
