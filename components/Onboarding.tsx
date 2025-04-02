import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Image,
  Platform,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

// Define the type for our onboarding item
type OnboardingItem = {
  id: string;
  title: string;
  description: string;
  image: any;
};

// Onboarding screens data
const onboardingData: OnboardingItem[] = [
  {
    id: "1",
    title: "Fantasia Style",
    description:
      "Create whimsical scenes and characters with the iconic magical aesthetic.",
    image: require("../assets/styles/ghibli.png"),
  },
  {
    id: "2",
    title: "Dreamworks Style",
    description:
      "Bring your ideas to life with vibrant 3D animation-inspired visuals.",
    image: require("../assets/styles/pixar.png"),
  },
  {
    id: "3",
    title: "Anime Style",
    description: "Express yourself with dynamic anime characters and scenes.",
    image: require("../assets/styles/anime.png"),
  },
  {
    id: "4",
    title: "Western Comic Style",
    description: "Create bold, colorful comic art with a Western flair.",
    image: require("../assets/styles/western-comic.png"),
  },
  {
    id: "5",
    title: "Enchanted Style",
    description: "Bring the magic of classic animation to your creative ideas.",
    image: require("../assets/styles/disney.png"),
  },
  {
    id: "6",
    title: "Flat Modern Style",
    description:
      "Create sleek, minimalist illustrations with a contemporary look.",
    image: require("../assets/styles/flat-modern.png"),
  },
];

type OnboardingProps = {
  onComplete: () => void;
};

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const colors = Colors[colorScheme ?? "light"];

  const renderItem = ({ item }: { item: OnboardingItem }) => {
    return (
      <View style={styles.slide}>
        <Image
          source={item.image}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.gradient}
        >
          <View style={styles.textContainer}>
            <ThemedText type="title" style={styles.title}>
              {item.title}
            </ThemedText>
            <ThemedText style={styles.description}>
              {item.description}
            </ThemedText>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const handleComplete = () => {
    // Save that onboarding is completed
    AsyncStorage.setItem("onboardingCompleted", "true");
    onComplete();
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      <View
        style={[
          styles.bottomContainer,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
      >
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor:
                    index === currentIndex
                      ? colors.buttonText
                      : "rgba(255, 255, 255, 0.5)",
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.getStartedButton,
            { backgroundColor: colors.buttonBackground },
          ]}
          onPress={handleComplete}
        >
          <ThemedText style={styles.buttonText}>Get Started</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  slide: {
    width,
    height,
    position: "relative",
  },
  backgroundImage: {
    width,
    height,
    position: "absolute",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    justifyContent: "flex-end",
    paddingBottom: 150,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    textAlign: "center",
    fontSize: 18,
    lineHeight: 26,
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 50 : 30,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  getStartedButton: {
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
});
