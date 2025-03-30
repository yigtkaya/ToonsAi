/**
 * Available image generation styles
 */
export interface StyleOption {
  id: string;
  name: string;
  description: string;
  requiresPro: boolean;
  imagePath: any; // Image source
}

/**
 * List of available style options for image generation
 */
export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: "anime",
    name: "Anime (Japanese Style)",
    description: "Big expressive eyes, clean line art, dramatic lighting",
    requiresPro: true,
    imagePath: require("@/assets/styles/anime.png"),
  },
  {
    id: "pixar",
    name: "Pixar / 3D Animation",
    description: "Soft, rounded features with Pixar-style realism",
    requiresPro: true,
    imagePath: require("@/assets/styles/pixar.png"),
  },
  {
    id: "western_comic",
    name: "Western Comic Style",
    description: "Bold outlines, stylized shadows, exaggerated expressions",
    requiresPro: true,
    imagePath: require("@/assets/styles/western-comic.png"),
  },
  {
    id: "vintage_disney",
    name: "Vintage Disney Style",
    description: "Classic hand-drawn look (e.g., Snow White, Bambi)",
    requiresPro: true,
    imagePath: require("@/assets/styles/vintage_disney.png"),
  },
  {
    id: "flat_vector",
    name: "Flat Modern Vector Style",
    description: "Minimal shading, flat colors, clean lines",
    requiresPro: true,
    imagePath: require("@/assets/styles/flat_vector.png"),
  },
  {
    id: "sketchbook",
    name: "Sketchbook / Pencil-Doodle Style",
    description: "Textured lines, rough edges, hand-drawn aesthetic",
    requiresPro: true,
    imagePath: require("@/assets/styles/sketchbook.png"),
  },
  {
    id: "ghibli",
    name: "Ghibli",
    description: "Inspired by Studio Ghibli's distinctive aesthetic",
    requiresPro: false,
    imagePath: require("@/assets/styles/ghibli.png"),
  },
];