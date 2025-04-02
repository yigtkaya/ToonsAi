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
    name: "Dreamworks / 3D Animation",
    description: "Soft, rounded features with cinematic 3D-style realism",
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
    name: "Enchanted Classic Style",
    description: "Classic hand-drawn look (e.g., vintage fairy tales)",
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
    name: "Fantasia",
    description: "Inspired by magical animation with a distinctive aesthetic",
    requiresPro: false,
    imagePath: require("@/assets/styles/ghibli.png"),
  },
];