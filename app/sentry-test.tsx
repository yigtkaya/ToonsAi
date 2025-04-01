import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import SentryTest from "@/components/SentryTest";

export default function SentryTestScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Sentry Test",
          headerTitleAlign: "center",
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Sentry Error Tracking</ThemedText>
            <ThemedText style={styles.subtitle}>
              Test Sentry error reporting functionality
            </ThemedText>
          </View>

          <SentryTest />

          <View style={styles.infoSection}>
            <ThemedText style={styles.infoTitle}>About Sentry</ThemedText>
            <ThemedText style={styles.infoText}>
              Sentry provides real-time error tracking and monitoring for your
              app. It helps you identify, triage, and fix bugs and crashes
              quickly.
            </ThemedText>

            <ThemedText style={styles.infoTitle}>Implementation</ThemedText>
            <ThemedText style={styles.infoText}>
              Sentry is integrated with your app's error handling and analytics
              systems. All errors are automatically captured and sent to the
              Sentry dashboard, along with relevant context and user
              information.
            </ThemedText>

            <ThemedText style={styles.infoTitle}>Testing</ThemedText>
            <ThemedText style={styles.infoText}>
              Use the buttons above to test different types of error reporting.
              You can view all captured errors in your Sentry dashboard.
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
    opacity: 0.7,
  },
  infoSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
