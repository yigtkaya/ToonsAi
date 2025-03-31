import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { generateImage, imageToBase64 } from "../lib/api/gemini";
import * as FileSystem from "expo-file-system";
import GeneratedImageDisplay from "./GeneratedImageDisplay";

/**
 * Component specifically for testing image display from base64
 */
const ImageDisplayTest = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [rawImageData, setRawImageData] = useState<{
    image: string;
    mime_type: string;
    model?: string;
  } | null>(null);
  const [prompt, setPrompt] = useState<string>("Transform this into a cartoon");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string>("");
  const [savedImageUri, setSavedImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        setError("Permission to access gallery was denied");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSourceImage(result.assets[0].uri);
        setGeneratedImage(null);
        setRawImageData(null);
        setError(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to pick image: ${message}`);
    }
  };

  const processImage = async () => {
    if (!sourceImage) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError(null);
    setValidationMessage("");
    setSavedImageUri(null);

    try {
      // Generate image through the API
      const imageUrl = await generateImage(sourceImage, prompt);

      // Extract the raw base64 data and MIME type for manual testing
      const dataUrlPattern = /^data:([^;]+);base64,(.+)$/;
      const matches = imageUrl.match(dataUrlPattern);

      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];

        // Validate base64 string
        const isValidBase64 = validateBase64(base64Data);
        setValidationMessage(
          isValidBase64
            ? "✅ Base64 validation passed"
            : "❌ Invalid base64 data"
        );

        // Set the raw data for use with GeneratedImageDisplay
        setRawImageData({
          image: base64Data,
          mime_type: mimeType,
        });
      } else if (imageUrl.startsWith("file://")) {
        // It's a file URI - handle differently
        setValidationMessage("✅ File URI generated (better for large images)");
        setRawImageData({
          image: imageUrl,
          mime_type: "image/png", // default assumption
        });
      } else {
        console.warn("Unable to parse data URL format");
        setValidationMessage("❌ Could not parse data URL");
      }

      setGeneratedImage(imageUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Image generation failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  // Validate if a string is valid base64
  const validateBase64 = (str: string): boolean => {
    // Check if the length is valid (multiple of 4)
    if (str.length % 4 !== 0) {
      return false;
    }

    // Check if it contains only valid base64 characters
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    return base64Regex.test(str);
  };

  const testDirectDisplay = async () => {
    if (!sourceImage) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);

    try {
      // Create a simple data URL directly from the source image
      const base64 = await imageToBase64(sourceImage);

      // Set both as the same for testing
      setRawImageData({
        image: base64,
        mime_type: "image/jpeg",
      });
      setGeneratedImage(`data:image/jpeg;base64,${base64}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Test display failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const testWithKnownGoodBase64 = () => {
    // This is a tiny base64-encoded transparent PNG
    const knownGoodBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    setGeneratedImage(`data:image/png;base64,${knownGoodBase64}`);
    setRawImageData({
      image: knownGoodBase64,
      mime_type: "image/png",
    });
    setValidationMessage("✅ Using known-good test image");
  };

  const showFileDetails = async () => {
    if (!generatedImage) {
      Alert.alert("No image", "Please generate an image first");
      return;
    }

    if (!generatedImage.startsWith("file://")) {
      Alert.alert(
        "Not a file URI",
        `This is a data URL: ${generatedImage.substring(0, 30)}...`
      );
      return;
    }

    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(generatedImage);

      // Show details about the file
      Alert.alert(
        "File Details",
        `Path: ${generatedImage}\n` +
          `Exists: ${fileInfo.exists}\n` +
          `Size: ${fileInfo.exists ? fileInfo.size : "unknown"} bytes\n` +
          `File extension: ${generatedImage.split(".").pop() || "none"}`
      );
    } catch (err) {
      Alert.alert("Error", `Failed to get file details: ${err}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Image Display Test</Text>

        <View style={styles.noticeContainer}>
          <Text style={styles.noticeTitle}>📝 Update Notice</Text>
          <Text style={styles.noticeText}>
            The image display system has been updated to use data URLs instead
            of file URIs on Android to prevent "unknown image format" errors
            when displaying images.
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Select Image</Text>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Pick Image</Text>
          </TouchableOpacity>

          {sourceImage && (
            <View style={styles.imageContainer}>
              <Text style={styles.label}>Source Image:</Text>
              <GeneratedImageDisplay
                imageData={sourceImage}
                mimeType="image/jpeg"
                style={styles.image}
              />
            </View>
          )}
        </View>

        {sourceImage && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Test Options</Text>

            <TextInput
              style={styles.input}
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Enter transformation prompt"
              multiline
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonThird]}
                onPress={processImage}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Process Image</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonThird]}
                onPress={testDirectDisplay}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Test Display</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonThird]}
                onPress={testWithKnownGoodBase64}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Test Base64</Text>
              </TouchableOpacity>
            </View>

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Processing...</Text>
              </View>
            )}
          </View>
        )}

        {generatedImage && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Results</Text>

            {validationMessage && (
              <Text style={styles.validationText}>{validationMessage}</Text>
            )}

            <View style={styles.imageContainer}>
              <Text style={styles.label}>Method 1: Original Approach</Text>
              <Text style={styles.infoText}>
                {generatedImage.startsWith("file://")
                  ? "Image saved as file due to large size"
                  : "Using data URL format"}
              </Text>
              <GeneratedImageDisplay
                imageData={generatedImage}
                style={styles.image}
              />

              {generatedImage.startsWith("file://") && (
                <TouchableOpacity
                  style={[styles.button, styles.smallButton]}
                  onPress={showFileDetails}
                >
                  <Text style={styles.buttonText}>Show File Details</Text>
                </TouchableOpacity>
              )}
            </View>

            {rawImageData && (
              <>
                <View style={styles.imageContainer}>
                  <Text style={styles.label}>
                    Method 2: Using GeneratedImageDisplay
                  </Text>
                  <Text style={styles.infoText}>
                    Properly handles different data formats
                  </Text>
                  <GeneratedImageDisplay
                    imageData={rawImageData.image}
                    mimeType={rawImageData.mime_type}
                    style={styles.image}
                  />
                </View>

                <View style={styles.dataContainer}>
                  <Text style={styles.label}>Image Data Info:</Text>
                  <Text>MIME Type: {rawImageData.mime_type}</Text>
                  <Text>
                    Data Length:{" "}
                    {rawImageData.image.startsWith("file://")
                      ? "File URI"
                      : `${rawImageData.image.length} characters`}
                  </Text>

                  {!rawImageData.image.startsWith("file://") && (
                    <>
                      <Text style={styles.subLabel}>How to use in code:</Text>
                      <Text style={styles.codeText}>
                        {`<GeneratedImageDisplay\n  imageData="${rawImageData.image.substring(
                          0,
                          20
                        )}..."\n  mimeType="${rawImageData.mime_type}"\n/>`}
                      </Text>
                      <Text style={styles.subLabel}>
                        Or with standard Image:
                      </Text>
                      <Text style={styles.codeText}>
                        {`<Image\n  source={{ uri: "data:${
                          rawImageData.mime_type
                        };base64,${rawImageData.image.substring(
                          0,
                          20
                        )}..." }}\n/>`}
                      </Text>
                    </>
                  )}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  noticeContainer: {
    backgroundColor: "#fff8e1",
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
    padding: 12,
    marginBottom: 16,
    borderRadius: 4,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#ff8f00",
  },
  noticeText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buttonThird: {
    flex: 0.32,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 80,
    fontSize: 16,
  },
  imageContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  image: {
    width: 250,
    height: 250,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: "#eee",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#d32f2f",
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  dataContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
  },
  validationText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "bold",
  },
  subLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 2,
  },
  codeText: {
    fontFamily: "monospace",
    backgroundColor: "#f5f5f5",
    padding: 4,
    borderRadius: 4,
    fontSize: 12,
  },
  infoText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
  smallButton: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#4CAF50", // green color for debugging buttons
    width: "80%",
    maxWidth: 200,
  },
});

export default ImageDisplayTest;
