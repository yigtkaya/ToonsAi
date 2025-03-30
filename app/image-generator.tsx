import React from "react";
import { StatusBar } from "react-native";
import { Stack } from "expo-router";
import ImageGenerator from "../components/ImageGenerator";

export default function ImageGeneratorScreen() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen
        options={{
          title: "AI Image Generator",
          headerLargeTitle: true,
        }}
      />
      <ImageGenerator />
    </>
  );
}
