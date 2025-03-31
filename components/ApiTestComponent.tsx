import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import {
  checkHealth,
  generateText,
  analyzeImage,
  generateImage,
} from "../lib/api/gemini";
import LargeImageRenderer from "./LargeImageRenderer";

const ApiTestComponent = () => {
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("Write a short poem about technology");
  const [transformPrompt, setTransformPrompt] = useState(
    "Transform this into a cartoon style image"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<string | null>(null);

  const testHealthEndpoint = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await checkHealth();
      setHealthStatus(JSON.stringify(result, null, 2));
    } catch (err) {
      setError(
        `Health check failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const testTextGenerationEndpoint = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateText(prompt);
      setGeneratedText(result.text);
    } catch (err) {
      setError(
        `Text generation failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

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
        // Reset other states
        setImageAnalysis(null);
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

  const testImageAnalysisEndpoint = async () => {
    if (!selectedImage) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const analysisResult = await analyzeImage(selectedImage);
      setImageAnalysis(JSON.stringify(analysisResult, null, 2));
    } catch (err) {
      setError(
        `Image analysis failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const testImageGenerationEndpoint = async () => {
    if (!selectedImage) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First analyze the image if we haven't done so yet
      let description = null;
      if (!imageAnalysis) {
        const analysisResult = await analyzeImage(selectedImage);
        description = analysisResult.description;
        setImageAnalysis(JSON.stringify(analysisResult, null, 2));
      } else {
        // Extract description from existing analysis
        try {
          const analysis = JSON.parse(imageAnalysis);
          description = analysis.description;
        } catch (e) {
          console.error("Error parsing image analysis:", e);
        }
      }

      // Generate the image
      const imageUrl = await generateImage(
        selectedImage,
        transformPrompt,
        description || undefined
      );

      setGeneratedImage(imageUrl);
    } catch (err) {
      setError(
        `Image generation failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // Special test for large images
  const testLargeImage = async () => {
    if (!selectedImage) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate a special prompt that will likely result in a complex/large image
      const specialPrompt =
        "Transform this into a highly detailed anime character with complex background, intricate clothing patterns, and vibrant colors. Make it extremely high-resolution.";

      console.log("Generating large test image with special prompt...");
      const imageUrl = await generateImage(selectedImage, specialPrompt);

      // Try to get file size info if it's a file URI
      if (imageUrl.startsWith("file://")) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(imageUrl);
          if (fileInfo.exists) {
            const fileSizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2);
            setImageSize(`File size: ${fileSizeMB} MB`);
          }
        } catch (err) {
          console.error("Failed to get file info:", err);
        }
      } else if (imageUrl.startsWith("data:")) {
        // Estimate size for data URLs
        const base64Data = imageUrl.split(",")[1] || "";
        const estimatedSizeBytes = base64Data.length * 0.75; // base64 is ~4/3 the size of binary
        const estimatedSizeMB = (estimatedSizeBytes / (1024 * 1024)).toFixed(2);
        setImageSize(`Estimated size: ${estimatedSizeMB} MB`);
      }

      setGeneratedImage(imageUrl);
    } catch (err) {
      setError(
        `Large image test failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Test Component</Text>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Check</Text>
        <Button title="Test Health Endpoint" onPress={testHealthEndpoint} />
        {healthStatus && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Result:</Text>
            <Text style={styles.resultText}>{healthStatus}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Text Generation</Text>
        <TextInput
          style={styles.input}
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Enter a prompt"
          multiline
        />
        <Button title="Generate Text" onPress={testTextGenerationEndpoint} />
        {generatedText && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Generated Text:</Text>
            <Text style={styles.resultText}>{generatedText}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Image Processing</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Select Image</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, !selectedImage && styles.disabledButton]}
            onPress={testImageAnalysisEndpoint}
            disabled={!selectedImage}
          >
            <Text style={styles.buttonText}>Analyze</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, !selectedImage && styles.disabledButton]}
            onPress={testImageGenerationEndpoint}
            disabled={!selectedImage}
          >
            <Text style={styles.buttonText}>Generate</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.buttonLarge, !selectedImage && styles.disabledButton]}
          onPress={testLargeImage}
          disabled={!selectedImage}
        >
          <Text style={styles.buttonText}>Test Large Image Handling</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={transformPrompt}
          onChangeText={setTransformPrompt}
          placeholder="Enter transformation prompt"
          multiline
        />

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

        {imageAnalysis && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Analysis Result:</Text>
            <Text style={styles.resultText}>{imageAnalysis}</Text>
          </View>
        )}

        {generatedImage && (
          <View style={styles.imageContainer}>
            <Text style={styles.imageTitle}>Generated Image:</Text>
            {imageSize && <Text style={styles.sizeInfo}>{imageSize}</Text>}
            <LargeImageRenderer
              source={generatedImage}
              style={styles.largeImage}
              resizeMode="contain"
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
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  loadingContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  errorText: {
    color: "#c62828",
  },
  resultContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#e3f2fd",
    borderRadius: 5,
  },
  resultLabel: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  resultText: {
    fontFamily: "monospace",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
    minHeight: 80,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#2962FF",
    padding: 12,
    borderRadius: 8,
    flex: 0.32,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  imageContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  imageTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
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
  buttonLarge: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  sizeInfo: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 8,
    color: "#666",
  },
});

export default ApiTestComponent;
