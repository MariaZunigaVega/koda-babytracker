export const DEFAULT_MODEL = "/models/characters/bear.glb";

export const AVATARS = [
  {
    id: "frog",
    habitat: "Frog Land",
    habitatClass: "habitat-frog",
    model: "/models/characters/frog.glb",
    bg: "linear-gradient(180deg, #4a9fd4 0%, #2ecc71 100%)",
    customHabitat: "frog",
  },
  {
    id: "bunny",
    habitat: "Meadow Burrow",
    habitatClass: "habitat-bunny",
    model: "/models/characters/bunny.glb",
    bg: "linear-gradient(180deg, #f7c6d9 0%, #f5efe0 100%)",
    customHabitat: "bunny",
  },
  {
    id: "panda",
    habitat: "Bamboo Grove",
    habitatClass: "habitat-panda",
    model: "/models/characters/panda.glb",
    bg: "linear-gradient(180deg, #a8b8a0 0%, #eef7e8 100%)",
  },
  {
    id: "koala",
    habitat: "Eucalyptus Canopy",
    habitatClass: "habitat-koala",
    model: "/models/characters/koala.glb",
    bg: "linear-gradient(180deg, #8fa8b0 0%, #d9cfc0 100%)",
  },
  {
    id: "bear",
    habitat: "Hollow Woods",
    habitatClass: "habitat-bear",
    model: "/models/characters/bear.glb",
    bg: "linear-gradient(180deg, #a8845a 0%, #7a9b5c 100%)",
  },
  {
    id: "fox",
    habitat: "Fox Den",
    habitatClass: "habitat-fox",
    model: "/models/characters/fox.glb",
    bg: "linear-gradient(180deg, #e8935a 0%, #f5efe0 100%)",
    customHabitat: "fox",
  },
];

export const getAvatarById = (id) => AVATARS.find((a) => a.id === id) || null;
