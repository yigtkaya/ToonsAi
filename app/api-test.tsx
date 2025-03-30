import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
} from "react-native";
import ApiTestComponent from "../components/ApiTestComponent";
import { Stack } from "expo-router";

export default function ApiTestScreen() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen
        options={{
          title: "API Testing",
          headerLargeTitle: true,
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>
              Test the Gemini AI API endpoints
            </Text>
            <Text style={styles.subHeaderText}>
              This screen demonstrates how to use the API module to interact
              with Gemini AI services.
            </Text>
          </View>
          <ApiTestComponent />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subHeaderText: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 22,
  },
});
