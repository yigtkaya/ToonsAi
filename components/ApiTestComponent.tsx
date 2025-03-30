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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  checkHealth,
  generateText,
  analyzeImage,
  generateImage,
} from "../lib/api";

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        <Button title="Pick Image" onPress={pickImage} />

        {selectedImage && (
          <>
            <View style={styles.imagePreviewContainer}>
              <Text style={styles.resultLabel}>Selected Image:</Text>
              <Image
                source={{ uri: selectedImage }}
                style={styles.imagePreview}
              />
            </View>

            <Button title="Analyze Image" onPress={testImageAnalysisEndpoint} />

            {imageAnalysis && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultLabel}>Analysis:</Text>
                <Text style={styles.resultText}>{imageAnalysis}</Text>
              </View>
            )}

            <TextInput
              style={styles.input}
              value={transformPrompt}
              onChangeText={setTransformPrompt}
              placeholder="Enter image transformation prompt"
              multiline
            />

            <Button
              title="Generate Transformed Image"
              onPress={testImageGenerationEndpoint}
            />

            {generatedImage && (
              <View style={styles.imageResultContainer}>
                <Text style={styles.resultLabel}>Generated Image:</Text>
                <Image
                  source={{ uri: generatedImage }}
                  style={styles.imageResult}
                />
              </View>
            )}
          </>
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
  imagePreviewContainer: {
    marginTop: 15,
    marginBottom: 15,
    alignItems: "center",
  },
  imagePreview: {
    width: 200,
    height: 150,
    resizeMode: "contain",
    borderRadius: 5,
    marginTop: 5,
  },
  imageResultContainer: {
    marginTop: 15,
    alignItems: "center",
  },
  imageResult: {
    width: 300,
    height: 300,
    resizeMode: "contain",
    borderRadius: 5,
    marginTop: 5,
  },
});

export default ApiTestComponent;
