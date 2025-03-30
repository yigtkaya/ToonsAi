import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ImageBackground,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { StyleOption, STYLE_OPTIONS } from "@/constants/Styles";
import { useUser } from "@/lib/auth/UserContext";
import { showPaywall } from "@/lib/navigation/showPaywall";

// Get window width for responsive grid layout
const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 2 - 24; // 2 columns with padding

interface StyleSelectorProps {
  selectedStyle: string;
  onSelectStyle: (style: string) => void;
}

export default function StyleSelector({
  selectedStyle,
  onSelectStyle,
}: StyleSelectorProps) {
  const { hasSubscription } = useUser();
  const router = useRouter();

  const handleStyleSelect = async (style: StyleOption) => {
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
    }

    onSelectStyle(style.id);
  };

  const renderItem = ({ item }: { item: StyleOption }) => {
    const isSelected = selectedStyle === item.id;
    const isPro = item.requiresPro;
    const needsBlur = isPro && !hasSubscription;

    return (
      <TouchableOpacity
        style={[styles.styleItem, isSelected && styles.selectedStyle]}
        onPress={() => handleStyleSelect(item)}
        activeOpacity={0.7}
      >
        <ImageBackground
          source={item.imagePath}
          style={styles.styleImageBackground}
          imageStyle={styles.styleImage}
        >
          {needsBlur && (
            <BlurView intensity={10} style={styles.blurOverlay}>
              <View style={styles.proTag}>
                <Text style={styles.proTagText}>PRO</Text>
              </View>
            </BlurView>
          )}

          <View style={styles.styleContent}>
            <Text style={styles.styleName}>{item.name}</Text>
            <Text style={styles.styleDescription}>{item.description}</Text>
            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              </View>
            )}
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Select Style</Text>
      <FlatList
        data={STYLE_OPTIONS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.styleRow}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    marginLeft: 16,
    color: "#fff",
  },
  styleRow: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  styleItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.2,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#2A2A2A",
  },
  selectedStyle: {
    borderWidth: 2,
    borderColor: "#7f5c3c",
  },
  styleImageBackground: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  styleImage: {
    borderRadius: 10,
  },
  styleContent: {
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  styleName: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  styleDescription: {
    color: "#DDD",
    fontSize: 12,
    lineHeight: 16,
  },
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  proTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#7f5c3c",
    borderRadius: 20,
  },
  proTagText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  selectedIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
  },
});
