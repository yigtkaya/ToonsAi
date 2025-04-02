import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { generateImage } from "../lib/api/gemini";
import { ImageGenerationResponse } from "../lib/api/types";
import LargeImageRenderer from "./LargeImageRenderer";

const ApiTestComponent = () => {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [transformPrompt, setTransformPrompt] = useState(
    "Transform this into a cartoon style image"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        setError("Permission to access media library was denied");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        // Reset generated image
        setGeneratedImage(null);
      }
    } catch (err) {
      setError(
        `Failed to pick image: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  };

  const fetchGeneratedImage = async () => {
    if (!selectedImage) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate image using the API - this already returns a properly formatted URI
      const generatedImageUri = await generateImage(
        selectedImage,
        transformPrompt
      );
      setGeneratedImage(generatedImageUri);

      // Log success
      console.log("Successfully generated and processed image");
    } catch (err) {
      setError(
        `Image generation failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      console.error("Image generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Image Generator</Text>

      <Text style={styles.description}>
        Select an image and transform it using Gemini's AI image generation
        capabilities. Enter a prompt describing how you want to transform the
        image.
      </Text>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Generating image...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.section}>
        <TextInput
          style={styles.input}
          value={transformPrompt}
          onChangeText={setTransformPrompt}
          placeholder="Enter transformation prompt"
          multiline
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Select Image</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, !selectedImage && styles.disabledButton]}
            onPress={fetchGeneratedImage}
            disabled={!selectedImage}
          >
            <Text style={styles.buttonText}>Generate</Text>
          </TouchableOpacity>
        </View>

        {selectedImage && (
          <View style={styles.imageContainer}>
            <Text style={styles.imageTitle}>Source Image:</Text>
            <Image
              source={{ uri: selectedImage }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        )}

        {generatedImage && (
          <View style={styles.imageContainer}>
            <Text style={styles.imageTitle}>Generated Image:</Text>
            <Image
              style={{ borderRadius: 12 }}
              source={{ uri: generatedImage }}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  description: {
    marginBottom: 20,
    textAlign: "center",
    color: "#666",
    lineHeight: 20,
    paddingHorizontal: 15,
  },
  section: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    alignItems: "center",
    marginVertical: 20,
    padding: 15,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  errorText: {
    color: "#c62828",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    backgroundColor: "#fff",
    minHeight: 100,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#2962FF",
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  imageContainer: {
    marginTop: 25,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 10,
  },
  imageTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  image: {
    width: 300,
    height: 300,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  largeImage: {
    width: 300,
    height: 300,
    borderRadius: 8,
  },
});

export default ApiTestComponent;
