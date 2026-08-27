// Maps each habitat's CSS class to its avatar-selection background gradient, for use outside the avatar list itself.

import { AVATARS } from "./avatars";

const CLASS_TO_BACKGROUND = AVATARS.reduce((map, avatar) => {
  if (avatar.habitatClass) map[avatar.habitatClass] = avatar.bg;
  return map;
}, {});

export const habitatTileStyle = (habitatClass) => {
  const background = CLASS_TO_BACKGROUND[habitatClass];
  return background ? { background } : undefined;
};
