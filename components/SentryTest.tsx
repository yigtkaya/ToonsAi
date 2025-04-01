import React from "react";
import { View, Button, StyleSheet, Alert } from "react-native";
import { ThemedText } from "./ThemedText";
import { ErrorTracking } from "@/lib";
import * as Sentry from "@sentry/react-native";

/**
 * A component for testing Sentry error tracking functionality
 */
export default function SentryTest() {
  // Throw a test error to be captured by Sentry
  const triggerTestError = () => {
    try {
      // Deliberately throw an error
      throw new Error("This is a test error from SentryTest component");
    } catch (error) {
      // Capture the error with our ErrorTracking utility
      ErrorTracking.captureException(error as Error, {
        context: "sentryTest",
        testProperty: "testValue",
      });

      // Show alert to confirm the error was triggered
      Alert.alert(
        "Test Error Sent",
        "A test error has been sent to Sentry. Check your Sentry dashboard to confirm it was received."
      );
    }
  };

  // Test direct Sentry API
  const triggerDirectSentryError = () => {
    try {
      // Deliberately throw an error
      throw new Error("This is a test error using direct Sentry API");
    } catch (error) {
      // Capture with direct Sentry API
      Sentry.captureException(error);

      // Show alert to confirm the error was triggered
      Alert.alert(
        "Direct Sentry Error Sent",
        "A test error has been sent to Sentry using the direct API. Check your Sentry dashboard to confirm it was received."
      );
    }
  };

  // Test message logging
  const triggerTestMessage = () => {
    ErrorTracking.logMessage(
      "This is a test message from SentryTest component",
      "info",
      { context: "sentryTest", testProperty: "testValue" }
    );

    Alert.alert(
      "Test Message Sent",
      "A test message has been sent to Sentry. Check your Sentry dashboard to confirm it was received."
    );
  };

  // Test breadcrumb
  const addTestBreadcrumb = () => {
    ErrorTracking.addBreadcrumb(
      "User triggered test breadcrumb",
      "user_action",
      { context: "sentryTest", timestamp: new Date().toISOString() }
    );

    Alert.alert(
      "Breadcrumb Added",
      "A test breadcrumb has been added. This will be attached to the next error."
    );
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Sentry Error Tracking Test</ThemedText>

      <View style={styles.buttonContainer}>
        <Button
          title="Trigger Test Error"
          onPress={triggerTestError}
          color="#FF5724"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Trigger Direct Sentry Error"
          onPress={triggerDirectSentryError}
          color="#FF5724"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Log Test Message"
          onPress={triggerTestMessage}
          color="#4285F4"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Add Test Breadcrumb"
          onPress={addTestBreadcrumb}
          color="#34A853"
        />
      </View>

      <ThemedText style={styles.explanation}>
        Use these buttons to test Sentry error tracking functionality. After
        triggering errors or messages, check your Sentry dashboard to confirm
        they were received correctly.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  buttonContainer: {
    marginVertical: 8,
  },
  explanation: {
    marginTop: 20,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
