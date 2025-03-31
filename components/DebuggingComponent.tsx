import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  Button,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import api from "../lib/api/client";

/**
 * A special component for debugging API issues
 * This makes direct API calls without the wrapper functions
 */
const DebuggingComponent = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // Pick an image from the library
  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        setError("Permission to access media library was denied");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setError(null);
        setResult(null);
      }
    } catch (err) {
      setError(
        `Failed to pick image: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  };

  // Convert image to base64
  const imageToBase64 = async (uri: string): Promise<string> => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error("Error converting image to base64:", error);
      throw error;
    }
  };

  // Test direct API call with minimal data
  const testImageGenerationMinimal = async () => {
    if (!selectedImage) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const base64Image = await imageToBase64(selectedImage);

      // Create a minimal request with only the required fields
      const requestData = {
        image: base64Image,
        prompt: "Transform this into a cartoon style image",
        mime_type: "image/jpeg",
      };

      console.log(
        "Sending minimal request with fields:",
        Object.keys(requestData)
      );

      const response = await api.post("/gemini/generate-image", requestData);

      setResult("Success! Image generated.");
      console.log("Response received:", response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`API call failed: ${errorMessage}`);
      console.error("Full error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Debugging Tool</Text>

      <Text style={styles.description}>
        This component makes direct API calls to help diagnose issues with the
        API integration.
      </Text>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Processing...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {result && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{result}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Step 1: Select Image</Text>
        <Button title="Pick Image" onPress={pickImage} />

        {selectedImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.image} />
          </View>
        )}
      </View>

      {selectedImage && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 2: Test API</Text>
          <Button
            title="Test Minimal Image Generation"
            onPress={testImageGenerationMinimal}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    color: "#666",
  },
  section: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 16,
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#c62828",
  },
  successContainer: {
    backgroundColor: "#e8f5e9",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    color: "#2e7d32",
  },
  imageContainer: {
    marginTop: 12,
    alignItems: "center",
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
});

export default DebuggingComponent;
