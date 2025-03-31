import React, { useState, useEffect } from "react";
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  Text,
  Platform,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

// Define proper types for FileSystem info results
interface FileInfoSuccess {
  exists: true;
  uri: string;
  size: number;
  isDirectory: boolean;
  modificationTime: number;
}

interface FileInfoFailure {
  exists: false;
  uri: string;
  isDirectory: false;
}

type FileInfo = FileInfoSuccess | FileInfoFailure;

interface LargeImageRendererProps {
  source: string; // Can be a data URL or file URI
  style?: object;
  resizeMode?: "contain" | "cover" | "stretch" | "center";
}

/**
 * Component for rendering large images from Gemini API
 * Handles both file URIs and data URLs efficiently
 */
const LargeImageRenderer: React.FC<LargeImageRendererProps> = ({
  source,
  style = {},
  resizeMode = "contain",
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<string>("");
  const [optimizedSource, setOptimizedSource] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if the source is a file URI or data URL
  const isFileUri = source.startsWith("file://");
  const isDataUrl = source.startsWith("data:");

  // Function to optimize very large images
  const optimizeImage = async (imageUri: string): Promise<string> => {
    try {
      setIsProcessing(true);

      // Get the screen width for better sizing
      const screenWidth = Dimensions.get("window").width;
      const targetWidth = Math.min(screenWidth - 40, 600); // Reasonable width with some margin

      // Max size for render performance (3MB is quite large for rendering)
      const MAX_SIZE_MB = 3;

      // For file URIs, check the size and compress if needed
      if (isFileUri) {
        const fileInfo = (await FileSystem.getInfoAsync(imageUri)) as FileInfo;
        if (fileInfo.exists) {
          const fileSizeMB = fileInfo.size / (1024 * 1024);

          if (fileSizeMB > MAX_SIZE_MB) {
            console.log(
              `Image is very large (${fileSizeMB.toFixed(
                2
              )}MB), resizing for display...`
            );

            // Determine the compression quality based on file size
            const quality = Math.max(
              0.5,
              Math.min(0.9, MAX_SIZE_MB / fileSizeMB)
            );

            // Use ImageManipulator to resize and compress
            const result = await ImageManipulator.manipulateAsync(
              imageUri,
              [{ resize: { width: targetWidth } }],
              { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
            );

            const resizedInfo = (await FileSystem.getInfoAsync(
              result.uri
            )) as FileInfo;
            const resizedSizeMB = resizedInfo.exists
              ? resizedInfo.size / (1024 * 1024)
              : 0;

            console.log(
              `Optimized image: original=${fileSizeMB.toFixed(
                2
              )}MB, compressed=${resizedSizeMB.toFixed(2)}MB`
            );

            return result.uri;
          }
        }
      }
      // For data URLs, we might need to parse and compress the base64 (complex, less efficient)
      else if (isDataUrl && imageUri.length > 1000000) {
        // Create a temp file to work with
        const tempUri = `${
          FileSystem.cacheDirectory
        }temp_large_image_${Date.now()}.jpg`;

        // Extract base64 data
        const base64Data = imageUri.split(",")[1];

        // Write to file
        await FileSystem.writeAsStringAsync(tempUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Now resize it
        const result = await ImageManipulator.manipulateAsync(
          tempUri,
          [{ resize: { width: targetWidth } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Clean up temp file
        await FileSystem.deleteAsync(tempUri, { idempotent: true });

        return result.uri;
      }

      // Return original if no optimization needed or possible
      return imageUri;
    } catch (err) {
      console.error("Failed to optimize image:", err);
      return imageUri; // Fallback to original
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate source info for debugging
  useEffect(() => {
    if (!source) {
      setImageInfo("No image source provided");
      return;
    }

    let isMounted = true;

    const processSource = async () => {
      if (!isMounted) return;

      if (isFileUri) {
        setImageInfo(`File URI (length: ${source.length})`);

        // Get file information
        try {
          const fileInfo = (await FileSystem.getInfoAsync(source)) as FileInfo;
          if (fileInfo.exists) {
            const fileSizeMB = fileInfo.size / (1024 * 1024);
            setImageInfo(`File URI - Size: ${fileSizeMB.toFixed(2)}MB`);

            // If the file is very large, optimize it for display
            if (fileSizeMB > 2) {
              const optimized = await optimizeImage(source);
              if (isMounted) setOptimizedSource(optimized);
            } else {
              if (isMounted) setOptimizedSource(source);
            }
          } else {
            setImageInfo("File URI - File does not exist");
            setError("Image file not found");
          }
        } catch (err) {
          console.error("Error getting file info:", err);
        }
      } else if (isDataUrl) {
        const dataSize = source.length / (1024 * 1024);
        setImageInfo(`Data URL - Size: ~${dataSize.toFixed(2)}MB`);

        // For very large data URLs, optimize
        if (source.length > 2 * 1024 * 1024) {
          // > 2MB
          const optimized = await optimizeImage(source);
          if (isMounted) setOptimizedSource(optimized);
        } else {
          if (isMounted) setOptimizedSource(source);
        }
      } else {
        setImageInfo(`Unknown format (length: ${source.length})`);
        if (isMounted) setOptimizedSource(source);
      }
    };

    processSource();

    return () => {
      isMounted = false;
    };
  }, [source]);

  const handleRetry = async () => {
    setError(null);
    setLoading(true);

    try {
      const optimized = await optimizeImage(source);
      setOptimizedSource(optimized);
    } catch (err) {
      setError(
        `Failed to process image: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  };

  if (!source) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.placeholderText}>No image available</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {optimizedSource ? (
        <Image
          source={{ uri: optimizedSource }}
          style={styles.image}
          resizeMode={resizeMode}
          onLoadStart={() => {
            setLoading(true);
            setError(null);
          }}
          onLoad={() => {
            console.log(`Large image loaded successfully: ${imageInfo}`);
            setLoading(false);
          }}
          onError={(e) => {
            const errorMessage = e.nativeEvent.error || "Failed to load image";
            console.error(
              "Image loading error:",
              errorMessage,
              "Source type:",
              isFileUri ? "file URI" : isDataUrl ? "data URL" : "unknown"
            );
            setError(errorMessage);
            setLoading(false);
          }}
        />
      ) : null}

      {(loading || isProcessing) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            {isProcessing ? "Optimizing large image..." : "Loading image..."}
          </Text>
          {__DEV__ && <Text style={styles.debugText}>{imageInfo}</Text>}
        </View>
      )}

      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Text style={styles.errorSubText}>
            The image may be too large to display directly.
          </Text>
          {__DEV__ && <Text style={styles.debugText}>{imageInfo}</Text>}

          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Optimize</Text>
          </TouchableOpacity>
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
    marginBottom: 8,
  },
  errorSubText: {
    color: "#d32f2f",
    textAlign: "center",
    fontSize: 14,
    marginBottom: 16,
  },
  placeholderText: {
    color: "#999",
    fontStyle: "italic",
  },
  debugText: {
    marginTop: 10,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    maxWidth: "90%",
  },
  retryButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 12,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default LargeImageRenderer;
