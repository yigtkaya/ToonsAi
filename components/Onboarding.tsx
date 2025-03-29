import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ImageBackground,
  Image,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

// Define the type for our onboarding item
type OnboardingItem = {
  id: string;
  title: string;
  description: string;
  gradientColors: readonly [string, string];
};

// Onboarding screens data
const onboardingData: OnboardingItem[] = [
  {
    id: "1",
    title: "Welcome to ToonsAI",
    description:
      "Transform any idea into beautiful cartoon style images with just a text prompt!",
    gradientColors: ["#7BB5D6", "#86A872"] as const, // Ghibli blue to green
  },
  {
    id: "2",
    title: "Unlimited Creativity",
    description:
      "Type any prompt and watch as AI turns your words into cartoon masterpieces.",
    gradientColors: ["#E5BACE", "#F0C869"] as const, // Ghibli pink to yellow
  },
  {
    id: "3",
    title: "Ready to Start?",
    description:
      "Try the app now with 2 free generations daily. Subscribe for unlimited access!",
    gradientColors: ["#7BB5D6", "#303842"] as const, // Ghibli blue to charcoal
  },
];

type OnboardingProps = {
  onComplete: () => void;
};

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const colorScheme = useColorScheme();

  const colors = Colors[colorScheme ?? "light"];

  const renderItem = ({ item }: { item: OnboardingItem }) => {
    return (
      <View style={styles.slide}>
        <LinearGradient
          colors={item.gradientColors}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"] as const}
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

      <View style={styles.bottomContainer}>
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
  },
  slide: {
    width,
    height,
  },
  backgroundGradient: {
    width,
    height,
    justifyContent: "flex-end",
  },
  gradient: {
    flex: 1,
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
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
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
