/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

/**
 * Studio Ghibli inspired color palette for the app.
 * Based on the soft, natural, and whimsical colors often found in Ghibli films.
 */

// Ghibli inspired colors
const ghibliBlue = "#7BB5D6"; // Sky blue from "Spirited Away"
const ghibliGreen = "#86A872"; // Forest green from "Princess Mononoke"
const ghibliBeige = "#F7E5CC"; // Warm beige from "Totoro" backgrounds
const ghibliPink = "#E5BACE"; // Soft pink from "Howl's Moving Castle"
const ghibliYellow = "#F0C869"; // Warm yellow from "Kiki's Delivery Service"
const ghibliCharcoal = "#303842"; // Dark charcoal from night scenes

export const Colors = {
  light: {
    text: "#333333",
    background: ghibliBeige,
    tint: ghibliBlue,
    secondaryTint: ghibliGreen,
    accent: ghibliPink,
    highlight: ghibliYellow,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: ghibliBlue,
    buttonBackground: ghibliBlue,
    buttonText: "#FFFFFF",
    cardBackground: "#FFFFFF",
  },
  dark: {
    text: "#ECEDEE",
    background: ghibliCharcoal,
    tint: ghibliBlue,
    secondaryTint: ghibliGreen,
    accent: ghibliPink,
    highlight: ghibliYellow,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: ghibliBlue,
    buttonBackground: ghibliBlue,
    buttonText: "#FFFFFF",
    cardBackground: "#24292D",
  },
};
