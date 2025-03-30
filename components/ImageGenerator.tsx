import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Lottie from "lottie-react-native";
import { analyzeImage, generateImage } from "../lib/api";

const ImageGenerator = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

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
        // Reset state
        setSourceImage(result.assets[0].uri);
        setGeneratedImage(null);
        setImageDescription(null);
        setError(null);
      }
    } catch (err) {
      setError(
        `Failed to pick image: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  };

  // Take a photo with the camera
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        setError("Permission to access camera was denied");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Reset state
        setSourceImage(result.assets[0].uri);
        setGeneratedImage(null);
        setImageDescription(null);
        setError(null);
      }
    } catch (err) {
      setError(
        `Failed to take photo: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  };

  // Process the image - analyze and generate
  const processImage = async () => {
    if (!sourceImage) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Stage 1: Image Analysis
      setProcessingStage("Analyzing image...");
      const analysisResult = await analyzeImage(sourceImage);

      // Extract the description from the analysis
      const description = analysisResult.description;
      setImageDescription(description);

      // Stage 2: Image Generation
      setProcessingStage("Generating new image...");

      // Generate transformation prompt
      const transformationPrompt =
        "Transform this image into a cartoon style illustration";

      // Call the generate image API with source image and prompt
      const generatedImageUrl = await generateImage(
        sourceImage,
        transformationPrompt,
        description
      );

      // Set the result
      setGeneratedImage(generatedImageUrl);
    } catch (err) {
      setError(
        `Processing failed: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setLoading(false);
      setProcessingStage("");
    }
  };

  // Reset the state
  const resetState = () => {
    setSourceImage(null);
    setGeneratedImage(null);
    setImageDescription(null);
    setError(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>AI Image Transformation</Text>

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Image Selection Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Pick Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={takePhoto}>
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Source Image Display */}
        {sourceImage && (
          <View style={styles.imageContainer}>
            <Text style={styles.sectionTitle}>Source Image</Text>
            <Image source={{ uri: sourceImage }} style={styles.image} />

            {/* Generate Button */}
            {!loading && !generatedImage && (
              <TouchableOpacity
                style={styles.generateButton}
                onPress={processImage}
              >
                <Text style={styles.generateButtonText}>
                  Transform to Cartoon
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Loading Animation */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Lottie
              source={require("../assets/animations/loading-animation.json")}
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
            <Text style={styles.loadingText}>{processingStage}</Text>
          </View>
        )}

        {/* Results Section */}
        {imageDescription && generatedImage && (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>Generated Result</Text>

            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionTitle}>AI Description:</Text>
              <Text style={styles.descriptionText}>{imageDescription}</Text>
            </View>

            <Image
              source={{ uri: generatedImage }}
              style={styles.generatedImage}
            />

            <TouchableOpacity style={styles.resetButton} onPress={resetState}>
              <Text style={styles.resetButtonText}>Start Over</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f8fa",
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#4a90e2",
    padding: 15,
    borderRadius: 8,
    width: "45%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  imageContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#333",
  },
  image: {
    width: 300,
    height: 300,
    borderRadius: 8,
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: "#2ecc71",
    padding: 15,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  generateButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  resultsContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  descriptionBox: {
    backgroundColor: "#e3f2fd",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: "100%",
  },
  descriptionTitle: {
    fontWeight: "bold",
    marginBottom: 5,
    fontSize: 16,
    color: "#1565c0",
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
  generatedImage: {
    width: 300,
    height: 300,
    borderRadius: 8,
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: "#f39c12",
    padding: 15,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  resetButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
  },
});

export default ImageGenerator;
