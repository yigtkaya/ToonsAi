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
import { useState, useEffect } from "react";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

import { useUser } from "@/lib/auth/UserContext";
import { showPaywall } from "@/lib/navigation/showPaywall";
import LargeImageRenderer from "./LargeImageRenderer";
import { generateImage as geminiGenerateImage } from "@/lib/api/gemini";
import {
  getRemainingGenerations,
  getDailyLimit,
} from "@/lib/auth/usageTracking";
import Analytics from "@/lib/analytics";

// Define the anime style options
interface AnimeStyle {
  id: string;
  name: string;
  image: ImageSourcePropType;
  requiresPro: boolean;
}

const animeStyles: AnimeStyle[] = [
  {
    id: "ghibli",
    name: "Ghibli",
    image: require("../assets/styles/ghibli.png"),
    requiresPro: false,
  },
  {
    id: "anime",
    name: "Anime (Japanese Style)",
    image: require("../assets/styles/anime.png"),
    requiresPro: true,
  },
  {
    id: "pixar",
    name: "Pixar / 3D Animation",
    image: require("../assets/styles/pixar.png"),
    requiresPro: true,
  },
  {
    id: "western_comic",
    name: "Western Comic Style",
    image: require("../assets/styles/western-comic.png"),
    requiresPro: true,
  },
  {
    id: "vintage_disney",
    name: "Vintage Disney Style",
    image: require("../assets/styles/disney.png"),
    requiresPro: true,
  },
  {
    id: "flat_vector",
    name: "Flat Modern Vector Style",
    image: require("../assets/styles/flat-modern.png"),
    requiresPro: true,
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
  const { hasSubscription } = useUser();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [remainingGenerations, setRemainingGenerations] = useState<number>(0);
  const [dailyLimit, setDailyLimit] = useState<number>(5); // Default value

  // Load usage information when component mounts
  useEffect(() => {
    const loadUsageInfo = async () => {
      try {
        const remaining = await getRemainingGenerations();
        const limit = await getDailyLimit();

        setRemainingGenerations(remaining);
        setDailyLimit(limit);
      } catch (error) {
        console.error("Error loading usage info:", error);
      }
    };

    loadUsageInfo();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleStyleSelect = async (style: AnimeStyle) => {
    // For non-subscribers, show paywall when they try to access pro styles
    if (!hasSubscription && style.requiresPro) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Show paywall when user tries to select a PRO style
      await showPaywall(true); // Force show the paywall
      return;
    }

    // Only provide haptic feedback for actual style changes
    if (selectedStyle !== style.id) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Track style selection
      Analytics.trackStyleApplied(style.name);
    }

    setSelectedStyle(style.id);
  };

  const generateImage = async () => {
    if (!selectedImage || !selectedStyle) return;

    setIsGenerating(true);

    try {
      // Generate a prompt based on the selected style
      const style = animeStyles.find((s) => s.id === selectedStyle);
      const styleName = style ? style.name : "cartoon";

      // Track generate button press
      Analytics.trackGeneratePress({
        style: styleName,
        is_pro_user: hasSubscription,
        remaining_generations: remainingGenerations,
      });

      // Create the prompt for the Gemini API
      const prompt = `Transform this photo into a ${styleName} style animated character. Make it appealing and professional looking.`;
      console.log(`Generating image with style: ${styleName}`);

      // Call the Gemini API with our prompt
      const generatedImageUri = await geminiGenerateImage(
        selectedImage,
        prompt
      );

      setResultImage(generatedImageUri);

      // Track successful generation
      Analytics.trackEvent("Generation Completed", {
        style: styleName,
        success: true,
      });
    } catch (error) {
      console.error("Failed to generate image:", error);
      Alert.alert(
        "Generation Failed",
        "We couldn't generate your image. Please try again."
      );

      // Track failed generation
      Analytics.trackEvent("Generation Failed", {
        style: selectedStyle,
        error: String(error),
      });
    } finally {
      setIsGenerating(false);
    }
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

  const handleUpgradePress = () => {
    showPaywall(true);
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
          <LargeImageRenderer
            source={resultImage}
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

      {/* Premium badge for premium users */}
      {hasSubscription && (
        <View style={styles.premiumBadgeContainer}>
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={14} color="#7f5c3c" />
            <ThemedText style={styles.premiumText}>PREMIUM</ThemedText>
          </View>
        </View>
      )}

      {/* Upgrade banner for free users */}
      {!hasSubscription && (
        <View style={styles.upgradeBanner}>
          <View style={styles.usageInfo}>
            <ThemedText style={styles.usageText}>
              Daily Usage: {remainingGenerations}/{dailyLimit} images
            </ThemedText>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.max(
                      (remainingGenerations / dailyLimit) * 100,
                      0
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>

          <ThemedText style={styles.upgradeText}>
            Get unlimited generations, priority processing, and more styles
          </ThemedText>

          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={handleUpgradePress}
          >
            <Ionicons
              name="star"
              size={16}
              color="#fff"
              style={styles.buttonIcon}
            />
            <ThemedText style={styles.upgradeButtonText}>
              Upgrade to Premium
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.uploadContainer, { borderColor: colors.tint }]}>
        {selectedImage ? (
          <View style={styles.selectedImageContainer}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.selectedImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.deleteImageButton}
              onPress={() => {
                setSelectedImage(null);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
            >
              <View style={styles.deleteButtonInner}>
                <Ionicons name="close-circle" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
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

      <View style={styles.stylesSection}>
        <ThemedText style={styles.sectionTitle}>Choose a Style:</ThemedText>
        <View style={styles.stylesGrid}>
          {animeStyles.map((style) => {
            const isSelected = selectedStyle === style.id;
            const isPro = style.requiresPro;
            const needsBlur = isPro && !hasSubscription;

            return (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleItem,
                  isSelected && styles.selectedStyleItem,
                ]}
                onPress={() => handleStyleSelect(style)}
              >
                <View
                  style={[
                    styles.styleImageContainer,
                    isSelected && styles.selectedStyleImageContainer,
                  ]}
                >
                  <Image source={style.image} style={styles.styleImage} />
                  {needsBlur && (
                    <BlurView intensity={7} style={styles.blurOverlay}>
                      <View style={styles.proTag}>
                        <Text style={styles.proTagText}>PRO</Text>
                      </View>
                    </BlurView>
                  )}
                </View>
                <ThemedText
                  style={[
                    styles.styleName,
                    isSelected && styles.selectedStyleName,
                  ]}
                >
                  {style.name}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
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
  selectedImageContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  deleteImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  deleteButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
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
    width: "30%",
    marginBottom: 25,
    alignItems: "center",
  },
  selectedStyleItem: {
    transform: [{ scale: 1.05 }],
  },
  styleImageContainer: {
    position: "relative",
    width: "100%",
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0d0b3",
  },
  selectedStyleImageContainer: {
    borderWidth: 3,
    borderColor: "#7f5c3c",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  styleImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  styleName: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 2,
  },
  selectedStyleName: {
    fontWeight: "bold",
    fontSize: 13,
    color: "#7f5c3c",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 30,
    marginVertical: 16,
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
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  proTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#7f5c3c",
    borderRadius: 20,
  },
  proTagText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  premiumBadgeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(219, 198, 162, 0.25)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#b38a61",
  },
  premiumText: {
    color: "#7f5c3c",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 4,
  },
  upgradeBanner: {
    backgroundColor: "rgba(179, 138, 97, 0.15)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  usageInfo: {
    marginBottom: 12,
  },
  usageText: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(224, 208, 179, 0.5)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#b38a61",
    borderRadius: 3,
  },
  upgradeText: {
    fontSize: 14,
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: "#2962FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
  },
  upgradeButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
