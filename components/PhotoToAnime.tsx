import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Text,
  ScrollView,
  ImageSourcePropType,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

// Define the anime style options
interface AnimeStyle {
  id: string;
  name: string;
  image: ImageSourcePropType;
}

const animeStyles: AnimeStyle[] = [
  {
    id: "gibura",
    name: "Gibura",
    image: {
      uri: "https://via.placeholder.com/100x100/dbc6a2/FFFFFF?text=Gibura",
    },
  },
  {
    id: "naruko",
    name: "Naruko",
    image: {
      uri: "https://via.placeholder.com/100x100/7f5c3c/FFFFFF?text=Naruko",
    },
  },
  {
    id: "titanya",
    name: "Titanya",
    image: {
      uri: "https://via.placeholder.com/100x100/f1e4c6/333333?text=Titanya",
    },
  },
  {
    id: "dragoboru",
    name: "Dragoboru",
    image: {
      uri: "https://via.placeholder.com/100x100/b38a61/FFFFFF?text=Dragoboru",
    },
  },
  {
    id: "detektif",
    name: "Detektif",
    image: {
      uri: "https://via.placeholder.com/100x100/e0d0b3/333333?text=Detektif",
    },
  },
  {
    id: "theslayer",
    name: "TheSlayer",
    image: {
      uri: "https://via.placeholder.com/100x100/7f5c3c/FFFFFF?text=TheSlayer",
    },
  },
  {
    id: "catrobo",
    name: "CatRobo",
    image: {
      uri: "https://via.placeholder.com/100x100/dbc6a2/FFFFFF?text=CatRobo",
    },
  },
  {
    id: "pirates",
    name: "Pirates",
    image: {
      uri: "https://via.placeholder.com/100x100/b38a61/FFFFFF?text=Pirates",
    },
  },
];

// Define the saved image type
interface SavedImage {
  id: string;
  uri: string;
  style: string;
  date: string;
}

export const PhotoToAnime = () => {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
  };

  const generateImage = () => {
    if (!selectedStyle) return;

    // This would be replaced with actual API call
    setIsGenerating(true);
    console.log(`Generating image with style: ${selectedStyle}`);

    // For demo purposes, just show a result after a delay
    setTimeout(() => {
      setResultImage("https://via.placeholder.com/400x400/dbc6a2/FFFFFF"); // Placeholder result
      setIsGenerating(false);
    }, 2000);
  };

  // Save the generated image to local storage
  const saveImage = async () => {
    if (!resultImage || !selectedStyle) return;

    try {
      // Create new saved image object
      const newImage: SavedImage = {
        id: Date.now().toString(),
        uri: resultImage,
        style:
          animeStyles.find((s) => s.id === selectedStyle)?.name || "Unknown",
        date: new Date().toISOString(),
      };

      // Get existing saved images
      const savedImagesString = await AsyncStorage.getItem("saved_images");
      let savedImages: SavedImage[] = [];

      if (savedImagesString) {
        savedImages = JSON.parse(savedImagesString);
      }

      // Add new image to the beginning of the array
      savedImages.unshift(newImage);

      // Save back to AsyncStorage
      await AsyncStorage.setItem("saved_images", JSON.stringify(savedImages));

      Alert.alert("Image Saved", "Your image has been saved to your gallery.");
    } catch (error) {
      console.error("Failed to save image:", error);
      Alert.alert("Error", "Failed to save your image. Please try again.");
    }
  };

  const goToGallery = () => {
    router.push("/gallery");
  };

  // Screen for viewing the result
  if (resultImage) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            ✨ Your Anime Style Result
          </ThemedText>
        </View>

        <View style={styles.resultContainer}>
          <Image
            source={{ uri: resultImage }}
            style={styles.resultImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#7f5c3c" }]}
            onPress={() => setResultImage(null)}
          >
            <Ionicons name="reload" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={saveImage}
          >
            <Ionicons name="save-outline" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#b38a61" }]}
            onPress={goToGallery}
          >
            <Ionicons name="images-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.createNewButton, { backgroundColor: "#7f5c3c" }]}
          onPress={() => {
            setSelectedImage(null);
            setSelectedStyle(null);
            setResultImage(null);
          }}
        >
          <Ionicons
            name="add-circle-outline"
            size={20}
            color="#fff"
            style={styles.buttonIcon}
          />
          <ThemedText style={styles.buttonText}>Create New</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  // Main screen for uploading and selecting style
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          ✨ Turn Photo to Anime
        </ThemedText>
      </View>

      <View style={[styles.uploadContainer, { borderColor: colors.tint }]}>
        {selectedImage ? (
          <Image
            source={{ uri: selectedImage }}
            style={styles.selectedImage}
            resizeMode="cover"
          />
        ) : (
          <TouchableOpacity
            style={[styles.uploadButton, { borderColor: colors.tint }]}
            onPress={pickImage}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={24}
              color={colors.tint}
            />
            <ThemedText style={{ color: colors.tint, marginTop: 8 }}>
              Upload your photo
            </ThemedText>
            <ThemedText
              style={{ fontSize: 12, marginTop: 4, color: colors.icon }}
            >
              Or drop an image
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.stylesSection}>
        <ThemedText style={styles.sectionTitle}>Choose a Style:</ThemedText>
        <View style={styles.stylesGrid}>
          {animeStyles.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[
                styles.styleItem,
                selectedStyle === style.id && {
                  borderColor: colors.tint,
                  borderWidth: 2,
                },
              ]}
              onPress={() => handleStyleSelect(style.id)}
            >
              <Image source={style.image} style={styles.styleImage} />
              <ThemedText style={styles.styleName}>{style.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.generateButton,
          {
            backgroundColor:
              selectedImage && selectedStyle && !isGenerating
                ? colors.buttonBackground
                : "#ccc",
            opacity: selectedImage && selectedStyle && !isGenerating ? 1 : 0.7,
          },
        ]}
        disabled={!(selectedImage && selectedStyle) || isGenerating}
        onPress={generateImage}
      >
        {isGenerating ? (
          <ActivityIndicator
            size="small"
            color="#fff"
            style={styles.buttonIcon}
          />
        ) : (
          <Ionicons
            name="sparkles"
            size={20}
            color="#fff"
            style={styles.buttonIcon}
          />
        )}
        <ThemedText style={styles.buttonText}>
          {isGenerating ? "Generating..." : "Generate Image"}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  uploadContainer: {
    height: 220,
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    borderStyle: "dashed",
    borderWidth: 1,
  },
  uploadButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  stylesSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  stylesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  styleItem: {
    width: "23%",
    marginBottom: 15,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0d0b3",
  },
  styleImage: {
    width: "100%",
    height: 70,
  },
  styleName: {
    fontSize: 12,
    textAlign: "center",
    padding: 4,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 30,
    marginTop: 10,
    marginBottom: 20,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  resultContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  resultImage: {
    width: "100%",
    height: 400,
    borderRadius: 12,
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
  createNewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 30,
    marginTop: 10,
  },
});
