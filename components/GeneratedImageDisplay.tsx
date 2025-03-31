import React, { useState, useEffect } from "react";
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  Text,
  Dimensions,
  Platform,
} from "react-native";
import * as FileSystem from "expo-file-system";

interface GeneratedImageDisplayProps {
  imageData: string;
  mimeType?: string;
  style?: object;
  resizeMode?: "contain" | "cover" | "stretch" | "center";
}

/**
 * Component for displaying generated images from the Gemini API
 * Handles file URIs, data URLs, and raw base64 strings
 */
const GeneratedImageDisplay: React.FC<GeneratedImageDisplayProps> = ({
  imageData,
  mimeType = "image/png",
  style = {},
  resizeMode = "contain",
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string>("");
  const [fixedFileUri, setFixedFileUri] = useState<string | null>(null);

  useEffect(() => {
    const processImageData = async () => {
      if (!imageData) {
        setImageUri("");
        setFixedFileUri(null);
        return;
      }

      try {
        // Determine the format of the image data and convert if needed
        if (imageData.startsWith("file://")) {
          // For file URIs on Android, convert to base64 data URL
          // to avoid file extension and format detection issues
          if (Platform.OS === "android") {
            try {
              // First check if the file exists
              const fileInfo = await FileSystem.getInfoAsync(imageData);
              if (!fileInfo.exists) {
                console.error("File does not exist:", imageData);
                setError("Image file not found");
                return;
              }

              // Get the implied mime type either from extension or passed prop
              let fileMimeType = mimeType;
              if (imageData.toLowerCase().endsWith(".png")) {
                fileMimeType = "image/png";
              } else if (
                imageData.toLowerCase().endsWith(".jpg") ||
                imageData.toLowerCase().endsWith(".jpeg")
              ) {
                fileMimeType = "image/jpeg";
              }

              // Read file as base64 and convert to data URL
              console.log(`Converting file to base64: ${imageData}`);
              const base64Data = await FileSystem.readAsStringAsync(imageData, {
                encoding: FileSystem.EncodingType.Base64,
              });

              const dataUrl = `data:${fileMimeType};base64,${base64Data}`;
              console.log(
                `Converted file to data URL (${dataUrl.length} chars)`
              );

              setImageUri(dataUrl);
            } catch (err) {
              console.error("Failed to convert file to base64:", err);
              // Fall back to the original URI as last resort
              setImageUri(imageData);
            }
          } else {
            // On iOS, we can use the file URI directly
            setImageUri(imageData);
          }
        } else if (imageData.startsWith("data:")) {
          // It's already a data URL
          setImageUri(imageData);
        } else {
          // It's a raw base64 string, prepend the data URL prefix
          setImageUri(`data:${mimeType};base64,${imageData}`);
        }
      } catch (err) {
        console.error("Error processing image data:", err);
        setError("Failed to process image data");
      }
    };

    processImageData();
  }, [imageData, mimeType]);

  // Clean up any temporary files when component unmounts
  useEffect(() => {
    return () => {
      if (fixedFileUri) {
        // Delete temporary file when component unmounts
        FileSystem.deleteAsync(fixedFileUri, { idempotent: true }).catch(
          (err) => console.log("Error deleting temp file:", err)
        );
      }
    };
  }, [fixedFileUri]);

  if (!imageData) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.placeholderText}>No image available</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode={resizeMode}
          onLoadStart={() => {
            setLoading(true);
            setError(null);
          }}
          onLoad={() => {
            console.log(
              `Image loaded successfully: ${imageUri.substring(0, 50)}...`
            );
            setLoading(false);
          }}
          onError={(e) => {
            const errorMessage = e.nativeEvent.error || "Failed to load image";
            console.error(
              "Image loading error:",
              errorMessage,
              "URI:",
              imageUri.substring(0, 100)
            );
            setError(errorMessage);
            setLoading(false);
          }}
        />
      ) : null}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading image...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}
    </View>
  );
};

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  container: {
    width: width - 40,
    height: width - 40,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#007AFF",
    fontWeight: "bold",
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 220, 220, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#d32f2f",
    textAlign: "center",
    fontWeight: "bold",
  },
  placeholderText: {
    color: "#999",
    fontStyle: "italic",
  },
});

export default GeneratedImageDisplay;
