import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ThemedText } from "@/components/ThemedText";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// Define the saved image type
interface SavedImage {
  id: string;
  uri: string;
  style: string;
  date: string;
}

// Image gallery using waterfall layout
const Gallery = () => {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const [images, setImages] = useState<SavedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState(2);
  const [selectedImage, setSelectedImage] = useState<SavedImage | null>(null);

  // Load saved images from AsyncStorage
  useEffect(() => {
    loadSavedImages();
  }, []);

  const loadSavedImages = async () => {
    try {
      setLoading(true);
      const savedImagesString = await AsyncStorage.getItem("saved_images");
      if (savedImagesString) {
        const savedImages = JSON.parse(savedImagesString) as SavedImage[];
        setImages(savedImages);
      }
    } catch (error) {
      console.error("Failed to load saved images:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete a saved image
  const deleteImage = async (id: string) => {
    try {
      const updatedImages = images.filter((img) => img.id !== id);
      setImages(updatedImages);
      await AsyncStorage.setItem("saved_images", JSON.stringify(updatedImages));
      setSelectedImage(null);
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  };

  // Waterfall grid calculation
  const renderItem = ({ item, index }: { item: SavedImage; index: number }) => {
    const windowWidth = Dimensions.get("window").width;
    const itemWidth = (windowWidth - 48) / columns; // 48 = padding and gaps

    return (
      <TouchableOpacity
        style={[styles.imageItem, { width: itemWidth }]}
        onPress={() => setSelectedImage(item)}
      >
        <Image source={{ uri: item.uri }} style={styles.thumbnail} />
      </TouchableOpacity>
    );
  };

  // Render detail view when an image is selected
  if (selectedImage) {
    return (
      <SafeAreaView
        style={styles.detailContainer}
        edges={["top", "right", "left"]}
      >
        <View style={styles.detailHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.detailTitle}>
            {selectedImage.style} Style
          </ThemedText>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteImage(selectedImage.id)}
          >
            <Ionicons name="trash-outline" size={24} color="#cc6b5a" />
          </TouchableOpacity>
        </View>

        <View
          style={[styles.detailImageContainer, { marginBottom: insets.bottom }]}
        >
          <Image
            source={{ uri: selectedImage.uri }}
            style={styles.detailImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.detailInfo}>
          <ThemedText style={styles.detailDate}>
            Created on {new Date(selectedImage.date).toLocaleDateString()}
          </ThemedText>
        </View>

        <View style={[styles.actionButtons, { marginBottom: insets.bottom }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
          >
            <Ionicons name="download" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#b38a61" }]}
          >
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "right", "left"]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Your Gallery</ThemedText>
        <View style={styles.columnSelector}>
          <TouchableOpacity
            style={[
              styles.columnButton,
              columns === 2 && { backgroundColor: colors.tint },
            ]}
            onPress={() => setColumns(2)}
          >
            <Ionicons
              name="grid-outline"
              size={20}
              color={columns === 2 ? "#fff" : colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.columnButton,
              columns === 3 && { backgroundColor: colors.tint },
            ]}
            onPress={() => setColumns(3)}
          >
            <Ionicons
              name="grid-outline"
              size={20}
              color={columns === 3 ? "#fff" : colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>
            Loading your images...
          </ThemedText>
        </View>
      ) : images.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={80} color={colors.icon} />
          <ThemedText style={styles.emptyText}>
            Your saved images will appear here
          </ThemedText>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: "#7f5c3c" }]}
            onPress={() => router.push("/")}
          >
            <ThemedText style={styles.createButtonText}>
              Create New Image
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={images}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          contentContainerStyle={[
            styles.gridContainer,
            { paddingBottom: insets.bottom },
          ]}
          columnWrapperStyle={styles.row}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  columnSelector: {
    flexDirection: "row",
  },
  columnButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  gridContainer: {
    padding: 12,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  imageItem: {
    marginBottom: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    aspectRatio: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  createButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  detailContainer: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  deleteButton: {
    padding: 8,
  },
  detailImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  detailImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  detailInfo: {
    padding: 16,
    alignItems: "center",
  },
  detailDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 20,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
});

export default Gallery;
