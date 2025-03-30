/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

/**
 * Earthy tones inspired color palette for the app.
 * Based on warm, natural colors that create a cozy and inviting atmosphere.
 */

// Earthy tones palette
const lightBeige = "#dbc6a2"; // Light Beige - main background color
const warmBrown = "#7f5c3c"; // Warm Brown - accent and text color
const paleCream = "#f1e4c6"; // Pale Cream - lighter background
const sandyTan = "#b38a61"; // Sandy Tan - primary interactive elements
const softBeige = "#e0d0b3"; // Soft Beige - secondary elements

// Darker variants for dark mode
const darkBrown = "#3a2a1c"; // Dark Brown for backgrounds in dark mode
const deepTan = "#634324"; // Deep Tan for darker UI elements

export const Colors = {
  light: {
    text: "#3a2a1c", // Dark text for readability
    background: paleCream,
    tint: sandyTan,
    secondaryTint: warmBrown,
    accent: softBeige,
    highlight: lightBeige,
    icon: "#7f5c3c",
    tabIconDefault: "#997b59",
    tabIconSelected: warmBrown,
    buttonBackground: sandyTan,
    buttonText: "#FFFFFF",
    cardBackground: "#FFFFFF",
  },
  dark: {
    text: "#f1e4c6", // Light text for dark mode
    background: darkBrown,
    tint: sandyTan,
    secondaryTint: lightBeige,
    accent: softBeige,
    highlight: warmBrown,
    icon: "#e0d0b3",
    tabIconDefault: "#b38a61",
    tabIconSelected: sandyTan,
    buttonBackground: sandyTan,
    buttonText: "#FFFFFF",
    cardBackground: deepTan,
  },
};
