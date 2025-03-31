import React from "react";
import { View, StyleSheet } from "react-native";
import DebuggingComponent from "../components/DebuggingComponent";

/**
 * Debug screen for testing API functionality
 */
export default function DebugScreen() {
  return (
    <View style={styles.container}>
      <DebuggingComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
