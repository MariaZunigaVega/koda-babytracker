// Maps each avatar's customHabitat key to its 3D habitat component (this is for the avatar selection page)
import BearHabitat3D from "./BearHabitat3D";
import BunnyHabitat3D from "./BunnyHabitat3D";
import FoxHabitat3D from "./FoxHabitat3D";
import FrogHabitat3D from "./FrogHabitat3D";
import KoalaHabitat3D from "./KoalaHabitat3D";
import PandaHabitat3D from "./PandaHabitat3D";

export const HABITAT_COMPONENTS = {
  bear: BearHabitat3D,
  bunny: BunnyHabitat3D,
  fox: FoxHabitat3D,
  frog: FrogHabitat3D,
  koala: KoalaHabitat3D,
  panda: PandaHabitat3D,
};
