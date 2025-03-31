import React from "react";
import { View, StyleSheet } from "react-native";
import ImageDisplayTest from "../components/ImageDisplayTest";

/**
 * Screen for testing image display functionality
 */
export default function ImageTestScreen() {
  return (
    <View style={styles.container}>
      <ImageDisplayTest />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
