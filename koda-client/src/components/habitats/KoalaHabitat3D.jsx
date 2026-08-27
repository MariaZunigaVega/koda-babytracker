// Koala Habitat **ROUGH draft**
// what needs to be done/is being worked on: 
//1. habitat looks a mess 2. create 3D assets for eucalyptus trees!!
// 3. maybeee fix the koala model??, 4. cant see the koala on the screen for some reason
import React, { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import "../../styling/habitats.css";
import { DEFAULT_MODEL } from "../../constants/avatars";
import { useGroundedOffset, seededRand, drawWrapped } from "./habitatUtils";

const GROUND_TEX_SIZE = 512;
function buildBushFloorTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = GROUND_TEX_SIZE;
  canvas.height = GROUND_TEX_SIZE;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "hsl(38, 32%, 46%)";
  ctx.fillRect(0, 0, GROUND_TEX_SIZE, GROUND_TEX_SIZE);

  for (let i = 0; i < 40; i++) {
    const seed = i * 61 + 3;
    const bx = (seed * 37) % GROUND_TEX_SIZE;
    const by = (seed * 53) % GROUND_TEX_SIZE;
    const radius = 42 + (seed % 5) * 20;
    const hue = 40 + (seed % 8) * 6;
    const light = 40 + (seed % 6) * 4;
    drawWrapped(ctx, bx, by, GROUND_TEX_SIZE, radius, (x, y) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, `hsla(${hue}, 36%, ${light}%, 0.5)`);
      grad.addColorStop(1, `hsla(${hue}, 36%, ${light}%, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  for (let i = 0; i < 520; i++) {
    const seed = i * 17 + 9;
    const bx = (seed * 31) % GROUND_TEX_SIZE;
    const by = (seed * 47) % GROUND_TEX_SIZE;
    const hue = 62 + (seed % 10) * 3;
    const light = 42 + (seed % 8) * 3;
    ctx.fillStyle = `hsla(${hue}, 34%, ${light}%, 0.45)`;
    drawWrapped(ctx, bx, by, GROUND_TEX_SIZE, 6, (x, y) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((seed % 12) * 0.26);
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.0, 3.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  for (let i = 0; i < 60; i++) {
    const seed = i * 89 + 13;
    const lx = (seed * 23) % GROUND_TEX_SIZE;
    const ly = (seed * 41) % GROUND_TEX_SIZE;
    const hue = 18 + (seed % 6) * 4;
    drawWrapped(ctx, lx, ly, GROUND_TEX_SIZE, 7, (x, y) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((seed % 20) * 0.31);
      ctx.fillStyle = `hsla(${hue}, 46%, ${28 + (seed % 5) * 4}%, 0.8)`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 5.5, 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function Ground({ size = 28 }) {
  const tex = useMemo(() => buildBushFloorTexture(), []);
  const repeats = size / 3.2;
  useEffect(() => {
    tex.repeat.set(repeats, repeats);
  }, [tex, repeats]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={tex} />
    </mesh>
  );
}

function Clearing({ position = [0, -1.2], radius = 2.1 }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.012, position[1]]}>
      <circleGeometry args={[radius, 32]} />
      <meshStandardMaterial color="#a9895f" roughness={0.95} />
    </mesh>
  );
}

const LEAF_CLUSTER_COLORS = ["#93b076", "#a3c084", "#87a86c"];

function LeafCluster({ position, scale = 1, colorIndex = 0 }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow receiveShadow>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial color={LEAF_CLUSTER_COLORS[colorIndex % 3]} roughness={0.85} />
      </mesh>
      <mesh position={[0.32, -0.12, 0.18]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.34, 1]} />
        <meshStandardMaterial color={LEAF_CLUSTER_COLORS[(colorIndex + 1) % 3]} roughness={0.85} />
      </mesh>
      <mesh position={[-0.3, -0.08, -0.2]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial color={LEAF_CLUSTER_COLORS[(colorIndex + 2) % 3]} roughness={0.85} />
      </mesh>
    </group>
  );
}

function EucalyptusTree({ position, rotation = 0, scale = 1 }) {
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.18, 2.8, 8]} />
        <meshStandardMaterial color="#c7b291" roughness={0.9} />
      </mesh>
      <mesh position={[0.22, 2.5, 0.1]} rotation={[0, 0, 0.5]} castShadow receiveShadow>
        <cylinderGeometry args={[0.05, 0.09, 1.3, 6]} />
        <meshStandardMaterial color="#c7b291" roughness={0.9} />
      </mesh>
      <mesh position={[-0.2, 2.35, -0.15]} rotation={[0, 0, -0.45]} castShadow receiveShadow>
        <cylinderGeometry args={[0.05, 0.08, 1.1, 6]} />
        <meshStandardMaterial color="#c7b291" roughness={0.9} />
      </mesh>
      <LeafCluster position={[0, 3.0, 0]} scale={1.1} colorIndex={0} />
      <LeafCluster position={[0.7, 3.05, 0.35]} scale={0.85} colorIndex={1} />
      <LeafCluster position={[-0.65, 2.9, -0.4]} scale={0.8} colorIndex={2} />
    </group>
  );
}

function generateBushGroves() {
  const placements = [];
  const rings = [
    { count: 6, rMin: 4.6, rMax: 5.8, scaleMin: 0.9, scaleMax: 1.2 },
    { count: 8, rMin: 6.4, rMax: 8.2, scaleMin: 1.0, scaleMax: 1.5 },
    { count: 10, rMin: 8.8, rMax: 11.5, scaleMin: 1.1, scaleMax: 1.9 },
  ];
  rings.forEach(({ count, rMin, rMax, scaleMin, scaleMax }) => {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const radius = rMin + Math.random() * (rMax - rMin);
      placements.push({
        position: [Math.cos(angle) * radius, Math.sin(angle) * radius - 1.2],
        rotation: Math.random() * Math.PI * 2,
        scale: scaleMin + Math.random() * (scaleMax - scaleMin),
      });
    }
  });
  return placements;
}
const GROVE_PLACEMENTS = generateBushGroves();

function EucalyptusGrove() {
  return (
    <>
      {GROVE_PLACEMENTS.map((t, i) => (
        <EucalyptusTree key={i} {...t} />
      ))}
    </>
  );
}

const HOME_TREE_BASE = [0, -1.2];
const HOME_BRANCH_POSITION = [0.62, 1.72, -1.55];

function HomeEucalyptusTree() {
  return (
    <group position={[HOME_TREE_BASE[0], 0, HOME_TREE_BASE[1]]}>
      <mesh position={[0, 1.9, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.17, 0.3, 3.8, 10]} />
        <meshStandardMaterial color="#cdb896" roughness={0.9} />
      </mesh>

      <mesh position={[0.45, 1.55, 0]} rotation={[0, 0, 0.55]} castShadow receiveShadow>
        <cylinderGeometry args={[0.06, 0.11, 1.4, 8]} />
        <meshStandardMaterial color="#cdb896" roughness={0.9} />
      </mesh>
      <mesh position={[-0.3, 2.7, 0.25]} rotation={[0.2, 0, -0.5]} castShadow receiveShadow>
        <cylinderGeometry args={[0.06, 0.11, 1.5, 8]} />
        <meshStandardMaterial color="#cdb896" roughness={0.9} />
      </mesh>
      <mesh position={[0.1, 2.9, -0.35]} rotation={[-0.35, 0, 0.15]} castShadow receiveShadow>
        <cylinderGeometry args={[0.05, 0.09, 1.2, 8]} />
        <meshStandardMaterial color="#cdb896" roughness={0.9} />
      </mesh>

      <LeafCluster position={[0, 4.0, 0]} scale={1.5} colorIndex={0} />
      <LeafCluster position={[-0.75, 3.7, 0.6]} scale={1.1} colorIndex={1} />
      <LeafCluster position={[0.85, 3.55, -0.5]} scale={1.05} colorIndex={2} />
      <LeafCluster position={[0.95, 1.9, -0.7]} scale={0.7} colorIndex={1} />
      <LeafCluster position={[-0.6, 3.15, 0.85]} scale={0.8} colorIndex={0} />
    </group>
  );
}

function RockCluster({ position, scale = 1, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, 0.22, 0]} rotation={[0.15, 0.6, 0.05]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.32, 1]} />
        <meshStandardMaterial color="#b78f66" roughness={0.9} />
      </mesh>
      <mesh position={[0.2, 0.12, 0.13]} rotation={[0.3, 1.2, 0.1]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.16, 1]} />
        <meshStandardMaterial color="#c19b71" roughness={0.9} />
      </mesh>
      <mesh position={[-0.15, 0.08, -0.1]} rotation={[0.1, 0.4, 0.2]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.11, 1]} />
        <meshStandardMaterial color="#a9835c" roughness={0.9} />
      </mesh>
    </group>
  );
}

const ROCK_PLACEMENTS = [
  { position: [3.2, 0, -0.4], scale: 0.85, rotation: 0.5 },
  { position: [-3.4, 0, 0.6], scale: 0.7, rotation: 2.2 },
];

const WILDFLOWER_COLORS = ["#ff7a4a", "#ffd23f", "#f4efe4", "#e85d3a"];
const WILDFLOWER_PLACEMENTS = [
  { position: [2.0, 1.6], color: 0 },
  { position: [-2.3, 1.1], color: 1 },
  { position: [2.9, -1.4], color: 2 },
  { position: [-2.8, -1.0], color: 3 },
  { position: [1.2, -2.9], color: 1 },
  { position: [-1.4, -3.1], color: 0 },
  { position: [3.6, 1.9], color: 2 },
  { position: [-3.7, 1.6], color: 3 },
];

function Wildflowers() {
  return (
    <>
      {WILDFLOWER_PLACEMENTS.map((f, i) => (
        <group key={i} position={[f.position[0], 0, f.position[1]]}>
          <mesh position={[0, 0.13, 0]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, 0.26, 5]} />
            <meshStandardMaterial color="#5c6b3f" />
          </mesh>
          <mesh position={[0, 0.28, 0]} castShadow>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={WILDFLOWER_COLORS[f.color]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

const GRASS_TUFT_PLACEMENTS = Array.from({ length: 22 }).map((_, i) => {
  const angle = seededRand(i * 3.1) * Math.PI * 2;
  const r = 1.6 + seededRand(i * 7.7) * 3.4;
  return {
    position: [Math.cos(angle) * r, Math.sin(angle) * r - 0.8],
    rotation: seededRand(i * 5.3) * Math.PI * 2,
    scale: 0.6 + seededRand(i * 9.1) * 0.5,
  };
});

function GrassTuft({ position, rotation, scale }) {
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]} scale={scale}>
      {[-0.05, 0, 0.05].map((dx, i) => (
        <mesh key={i} position={[dx, 0.08, 0]} rotation={[0, 0, dx * 2.5]} castShadow>
          <coneGeometry args={[0.018, 0.18, 5]} />
          <meshStandardMaterial color={i === 1 ? "#9e9a4e" : "#aca85e"} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function GrassTufts() {
  return (
    <>
      {GRASS_TUFT_PLACEMENTS.map((t, i) => (
        <GrassTuft key={i} {...t} />
      ))}
    </>
  );
}

const GUMNUT_COLOR = "#7a5236";
const GUMNUT_CLUSTERS = [
  { position: [0.9, -0.5], count: 3 },
  { position: [-1.1, -1.6], count: 2 },
  { position: [1.6, -2.2], count: 3 },
];
function gumnutSeed(position, index, offset) {
  return seededRand((position[0] * 131.1 + position[1] * 71.7 + index * 33.3 + offset) * 12.9898);
}
function GumnutCluster({ position, count }) {
  const nuts = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const r1 = gumnutSeed(position, i, 1);
      const r2 = gumnutSeed(position, i, 2);
      return {
        offset: [(r1 - 0.5) * 0.35, (r2 - 0.5) * 0.35],
        radius: 0.045 + r2 * 0.03,
        rotation: r1 * Math.PI * 2,
      };
    });
  }, [position, count]);
  return (
    <group position={[position[0], 0, position[1]]}>
      {nuts.map((n, i) => (
        <mesh key={i} position={[n.offset[0], n.radius, n.offset[1]]} rotation={[0.2, n.rotation, 0]} castShadow receiveShadow>
          <icosahedronGeometry args={[n.radius, 0]} />
          <meshStandardMaterial color={GUMNUT_COLOR} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
function Gumnuts() {
  return (
    <>
      {GUMNUT_CLUSTERS.map((c, i) => (
        <GumnutCluster key={i} {...c} />
      ))}
    </>
  );
}

function useFreeRoam({ bounds = 3, minHeight = 0.8, maxHeight = 1.6, speed = 0.5 } = {}) {
  const state = useMemo(() => {
    const randPoint = () =>
      new THREE.Vector3(
        (Math.random() - 0.5) * bounds * 2,
        minHeight + Math.random() * (maxHeight - minHeight),
        (Math.random() - 0.5) * bounds * 2 - 1
      );
    return { pos: randPoint(), target: randPoint() };
  }, [bounds, minHeight, maxHeight]);

  const step = (delta) => {
    const dir = state.target.clone().sub(state.pos);
    const dist = dir.length();
    if (dist < 0.15) {
      state.target.set(
        (Math.random() - 0.5) * bounds * 2,
        minHeight + Math.random() * (maxHeight - minHeight),
        (Math.random() - 0.5) * bounds * 2 - 1
      );
    } else {
      dir.normalize();
      state.pos.addScaledVector(dir, Math.min(speed * delta, dist));
    }
    return state.pos;
  };

  return { step };
}

const BUTTERFLY_COLORS = ["#ff9f4a", "#f2f2f2", "#5fa8d3"];
function Butterfly({ bounds, speed, height, colorIndex }) {
  const group = useRef();
  const wingL = useRef();
  const wingR = useRef();
  const { step } = useFreeRoam({ bounds, minHeight: height - 0.15, maxHeight: height + 0.25, speed });
  useFrame(({ clock }, delta) => {
    const pos = step(delta);
    const t = clock.getElapsedTime();
    if (group.current) {
      group.current.position.copy(pos);
      group.current.rotation.y = Math.atan2(
        group.current.position.x - pos.x + 0.001,
        1
      );
    }
    const flap = Math.sin(t * 14) * 0.9;
    if (wingL.current) wingL.current.rotation.y = flap;
    if (wingR.current) wingR.current.rotation.y = -flap;
  });
  const color = BUTTERFLY_COLORS[colorIndex % BUTTERFLY_COLORS.length];
  return (
    <group ref={group}>
      <mesh ref={wingL} position={[-0.02, 0, 0]}>
        <planeGeometry args={[0.09, 0.07]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
      <mesh ref={wingR} position={[0.02, 0, 0]}>
        <planeGeometry args={[0.09, 0.07]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
    </group>
  );
}

function PerchedCharacter({ modelPath, branchPosition, scale = 2.2 }) {
  const group = useRef();
  const { scene } = useGLTF(modelPath);
  const object = useMemo(() => scene.clone(), [scene]);
  const offset = useGroundedOffset(object);

  const nextGlance = useRef(1 + Math.random() * 2);
  const glanceOffset = useRef(0);
  const nextShift = useRef(4 + Math.random() * 3);
  const shiftOffset = useRef([0, 0]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();

    if (t > nextGlance.current) {
      nextGlance.current = t + 2 + Math.random() * 2.5;
      glanceOffset.current = (Math.random() - 0.5) * 0.4;
    }
    if (t > nextShift.current) {
      nextShift.current = t + 5 + Math.random() * 4;
      shiftOffset.current = [(Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.06];
    }

    let angleDelta = glanceOffset.current - group.current.rotation.y;
    while (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
    while (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
    group.current.rotation.y += angleDelta * 0.03;

    const breathe = Math.sin(t * 1.1) * 0.015;
    group.current.position.set(
      branchPosition[0] + shiftOffset.current[0],
      branchPosition[1] + breathe,
      branchPosition[2] + shiftOffset.current[1]
    );
  });

  return (
    <group ref={group} position={branchPosition}>
      <primitive object={object} scale={scale} position={[offset[0] * scale, offset[1] * scale, offset[2] * scale]} />
    </group>
  );
}

class CharacterErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return <PerchedCharacter modelPath={DEFAULT_MODEL} branchPosition={this.props.branchPosition} />;
    }
    return this.props.children;
  }
}

const ISO_DISTANCE = 9.5;
const ISO_ELEVATION = Math.atan(1 / Math.sqrt(2)) + 0.08;
const ISO_YAW = 0;
const ISO_POSITION = [
  ISO_DISTANCE * Math.cos(ISO_ELEVATION) * Math.sin(ISO_YAW),
  ISO_DISTANCE * Math.sin(ISO_ELEVATION),
  ISO_DISTANCE * Math.cos(ISO_ELEVATION) * Math.cos(ISO_YAW),
];

const KoalaHabitat3D = ({ characterModel }) => {
  return (
    <div className="habitat-canvas-wrap habitat-canvas-wrap--no-touch-scroll">
      <Canvas
        shadows
        orthographic
        camera={{ position: ISO_POSITION, zoom: 52, near: 0.1, far: 60 }}
        gl={{ toneMappingExposure: 1.15 }}
        style={{ touchAction: "none" }}
        onCreated={({ gl }) => {
          gl.domElement.style.touchAction = "none";
        }}
      >
        <color attach="background" args={["#bfe3f7"]} />
        <fog attach="fog" args={["#bfe3f7", 16, 34]} />

        <OrbitControls
          makeDefault
          target={[0.3, 1.6, -1.4]}
          enableDamping
          dampingFactor={0.08}
          enablePan
          screenSpacePanning
          panSpeed={1}
          enableRotate
          rotateSpeed={0.6}
          minPolarAngle={0.55}
          maxPolarAngle={1.1}
          minZoom={34}
          maxZoom={90}
          mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }}
          touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }}
        />

        <ambientLight intensity={0.9} />
        <directionalLight
          position={[6, 10, 4]}
          intensity={2.5}
          color="#fff4d6"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        <directionalLight position={[-6, 4, -5]} intensity={0.3} color="#cfe8ff" />
        <hemisphereLight args={["#eaf6ff", "#7a6a45", 1.1]} />

        <React.Suspense fallback={null}>
          <Ground />
          <Clearing />

          <HomeEucalyptusTree />
          <EucalyptusGrove />

          <RockCluster {...ROCK_PLACEMENTS[0]} />
          <RockCluster {...ROCK_PLACEMENTS[1]} />

          <Wildflowers />
          <GrassTufts />
          <Gumnuts />

          <Butterfly bounds={2.6} speed={0.55} height={1.3} colorIndex={0} />
          <Butterfly bounds={2.0} speed={0.6} height={1.5} colorIndex={1} />
          <Butterfly bounds={3.0} speed={0.5} height={1.1} colorIndex={2} />

          <CharacterErrorBoundary branchPosition={HOME_BRANCH_POSITION}>
            <PerchedCharacter modelPath={characterModel} branchPosition={HOME_BRANCH_POSITION} />
          </CharacterErrorBoundary>
        </React.Suspense>
      </Canvas>
    </div>
  );
};

export default KoalaHabitat3D;
