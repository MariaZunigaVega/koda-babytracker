// Fox Habitat **ROUGH draft**
// what needs to be done/is being worked on: 
//1. fix the entire habitat, looks a mess 2. have a better color scheme/theme, 
// 3. use the house 3D asset for bear instead of fox, 4.create 3D tree assets etc???, 
// 5. fix the sizing of the fox and take out the movement animation.

import React, { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import "../../styling/habitats.css";
import { DEFAULT_MODEL } from "../../constants/avatars";
import { useGroundedOffset, seededRand, drawWrapped } from "./habitatUtils";

const GRASS_TEX_SIZE = 512;
function buildForestGrassTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = GRASS_TEX_SIZE;
  canvas.height = GRASS_TEX_SIZE;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "hsl(102, 34%, 28%)";
  ctx.fillRect(0, 0, GRASS_TEX_SIZE, GRASS_TEX_SIZE);

  for (let i = 0; i < 42; i++) {
    const seed = i * 61 + 3;
    const bx = (seed * 37) % GRASS_TEX_SIZE;
    const by = (seed * 53) % GRASS_TEX_SIZE;
    const radius = 40 + (seed % 5) * 18;
    const hue = 96 + (seed % 9) * 3;
    const light = 26 + (seed % 6) * 3;
    drawWrapped(ctx, bx, by, GRASS_TEX_SIZE, radius, (x, y) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, `hsla(${hue}, 40%, ${light}%, 0.55)`);
      grad.addColorStop(1, `hsla(${hue}, 40%, ${light}%, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  for (let i = 0; i < 950; i++) {
    const seed = i * 17 + 9;
    const bx = (seed * 31) % GRASS_TEX_SIZE;
    const by = (seed * 47) % GRASS_TEX_SIZE;
    const hue = 100 + (seed % 10) * 2;
    const light = 24 + (seed % 8) * 3;
    ctx.fillStyle = `hsla(${hue}, 42%, ${light}%, 0.5)`;
    drawWrapped(ctx, bx, by, GRASS_TEX_SIZE, 6, (x, y) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((seed % 12) * 0.26);
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.3, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  for (let i = 0; i < 30; i++) {
    const seed = i * 97 + 11;
    const cx = (seed * 13) % GRASS_TEX_SIZE;
    const cy = (seed * 29) % GRASS_TEX_SIZE;
    drawWrapped(ctx, cx, cy, GRASS_TEX_SIZE, 6, (x, y) => {
      ctx.fillStyle = "hsl(116, 32%, 24%)";
      for (let l = 0; l < 3; l++) {
        const a = (l / 3) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * 3.4, y + Math.sin(a) * 3.4, 2.6, 1.9, a, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  for (let i = 0; i < 22; i++) {
    const seed = i * 71 + 5;
    const dx = (seed * 17) % GRASS_TEX_SIZE;
    const dy = (seed * 41) % GRASS_TEX_SIZE;
    drawWrapped(ctx, dx, dy, GRASS_TEX_SIZE, 5, (x, y) => {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * 2, y + Math.sin(a) * 2, 1.3, 0.9, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#ffd76b";
      ctx.beginPath();
      ctx.arc(x, y, 1.1, 0, Math.PI * 2);
      ctx.fill();
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

function Ground({ size = 34 }) {
  const tex = useMemo(() => buildForestGrassTexture(), []);
  const repeats = size / 3.4;
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

const Path = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -0.6]}>
    <planeGeometry args={[1.1, 5]} />
    <meshStandardMaterial color="#c9a876" />
  </mesh>
);

function generateForestRings() {
  const placements = [];
  const rings = [
    { count: 16, rMin: 6.0, rMax: 7.6, scaleMin: 1.1, scaleMax: 1.7 },
    { count: 22, rMin: 8.0, rMax: 10.2, scaleMin: 1.2, scaleMax: 2.0 },
    { count: 26, rMin: 10.8, rMax: 14.5, scaleMin: 1.3, scaleMax: 2.4 },
  ];
  rings.forEach(({ count, rMin, rMax, scaleMin, scaleMax }) => {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const radius = rMin + Math.random() * (rMax - rMin);
      const nearPathGap = Math.abs(((angle + Math.PI) % (Math.PI * 2)) - Math.PI) < 0.45;
      if (nearPathGap && radius < 8.5) continue;
      placements.push({
        position: [Math.cos(angle) * radius, Math.sin(angle) * radius],
        rotation: Math.random() * Math.PI * 2,
        scale: scaleMin + Math.random() * (scaleMax - scaleMin),
      });
    }
  });
  return placements;
}
const TREE_PLACEMENTS = generateForestRings();

function Tree({ position, rotation, scale, sourceScene }) {
  const object = useMemo(() => sourceScene.clone(), [sourceScene]);
  const offset = useGroundedOffset(object);
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
      <primitive
        object={object}
        scale={scale}
        position={[offset[0] * scale, offset[1] * scale, offset[2] * scale]}
      />
    </group>
  );
}

function Trees() {
  const { scene } = useGLTF('/models/habitats/trees.glb');
  return (
    <>
      {TREE_PLACEMENTS.map((t, i) => (
        <Tree key={i} sourceScene={scene} {...t} />
      ))}
    </>
  );
}

class TreesErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function House({ position = [0, -3.6], rotation = 0, scale = 2.3 }) {
  const { scene } = useGLTF('/models/habitats/house.glb');
  const offset = useGroundedOffset(scene);
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
      <primitive
        object={scene}
        scale={scale}
        position={[offset[0] * scale, offset[1] * scale, offset[2] * scale]}
      />
    </group>
  );
}

class HouseErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function RockCluster({ position, scale = 1, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, 0.24, 0]} rotation={[0.15, 0.6, 0.05]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.34, 1]} />
        <meshStandardMaterial color="#8a8f94" roughness={0.9} />
      </mesh>
      <mesh position={[0.22, 0.13, 0.14]} rotation={[0.3, 1.2, 0.1]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.17, 1]} />
        <meshStandardMaterial color="#93989c" roughness={0.9} />
      </mesh>
      <mesh position={[-0.16, 0.09, -0.1]} rotation={[0.1, 0.4, 0.2]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.12, 1]} />
        <meshStandardMaterial color="#7d8388" roughness={0.9} />
      </mesh>
      <mesh position={[0.02, 0.44, 0.06]} rotation={[0, 0.4, 0]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshStandardMaterial color="#5c8f4f" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Campfire({ position }) {
  const light = useRef();
  const flame = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    light.current.intensity = 1.1 + Math.sin(t * 9) * 0.25 + Math.random() * 0.1;
    flame.current.scale.y = 1 + Math.sin(t * 12) * 0.15;
  });
  return (
    <group position={position}>
      <pointLight ref={light} color={0xffa040} intensity={1.2} distance={3} position={[0, 0.35, 0]} />
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[0, (i * Math.PI) / 1.5, Math.PI / 2]} position={[0, 0.05, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.32, 8]} />
          <meshStandardMaterial color="#4a2d1f" />
        </mesh>
      ))}
      <mesh ref={flame} position={[0, 0.24, 0]}>
        <coneGeometry args={[0.11, 0.32, 8]} />
        <meshBasicMaterial color="#ff8a3d" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

const MUSHROOM_CAP_COLORS = ["#ff6f6f", "#ffb3c6", "#ffd166"];

function Mushroom({ position, rotation, scale, colorIndex }) {
  const capColor = MUSHROOM_CAP_COLORS[colorIndex % MUSHROOM_CAP_COLORS.length];
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.32, 8]} />
        <meshStandardMaterial color="#fff3e2" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.24, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={capColor} roughness={0.55} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.14, 0.4, Math.sin(a) * 0.14]}>
            <sphereGeometry args={[0.035, 6, 6]} />
            <meshStandardMaterial color="#fff8ef" />
          </mesh>
        );
      })}
    </group>
  );
}

const MUSHROOM_PLACEMENTS = [
  { position: [5.4, 2.3], rotation: 0.6, scale: 0.7, colorIndex: 0 },
  { position: [-5.1, 3.0], rotation: 2.0, scale: 0.6, colorIndex: 1 },
  { position: [4.6, -3.6], rotation: 1.1, scale: 0.65, colorIndex: 2 },
  { position: [-4.4, -4.2], rotation: 3.4, scale: 0.55, colorIndex: 0 },
  { position: [2.2, 5.6], rotation: 2.6, scale: 0.6, colorIndex: 1 },
];

function Mushrooms() {
  return (
    <>
      {MUSHROOM_PLACEMENTS.map((m, i) => (
        <Mushroom key={i} {...m} />
      ))}
    </>
  );
}

const FLOWER_COLORS = ["#ffd9e8", "#fff3b0", "#ffffff"];
const FLOWER_PLACEMENTS = [
  { position: [2.6, 3.4], color: 0 },
  { position: [-2.9, 2.6], color: 1 },
  { position: [3.5, -2.2], color: 2 },
  { position: [-3.4, -1.8], color: 0 },
  { position: [1.6, -4.8], color: 1 },
  { position: [-1.9, -5.0], color: 2 },
  { position: [4.6, 0.6], color: 1 },
  { position: [-4.6, 0.9], color: 0 },
];

function Flowers() {
  return (
    <>
      {FLOWER_PLACEMENTS.map((f, i) => (
        <group key={i} position={[f.position[0], 0, f.position[1]]}>
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.24, 5]} />
            <meshStandardMaterial color="#3f6a37" />
          </mesh>
          <mesh position={[0, 0.26, 0]} castShadow>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={FLOWER_COLORS[f.color]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function keepClear([x, z], zones) {
  for (const [zx, zz, r] of zones) {
    if (Math.hypot(x - zx, z - zz) < r) return false;
  }
  return true;
}
const CLEAR_ZONES = [
  [0, -0.6, 1.4],
  [1.0, -0.4, 0.9],
  [0, -3.6, 2.6],
];

const GRASS_TUFT_PLACEMENTS = Array.from({ length: 26 })
  .map((_, i) => {
    const angle = seededRand(i * 3.1) * Math.PI * 2;
    const r = 1.8 + seededRand(i * 7.7) * 4.0;
    return {
      position: [Math.cos(angle) * r, Math.sin(angle) * r],
      rotation: seededRand(i * 5.3) * Math.PI * 2,
      scale: 0.7 + seededRand(i * 9.1) * 0.5,
    };
  })
  .filter((t) => keepClear(t.position, CLEAR_ZONES));

function GrassTuft({ position, rotation, scale }) {
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]} scale={scale}>
      {[-0.05, 0, 0.05].map((dx, i) => (
        <mesh key={i} position={[dx, 0.09, 0]} rotation={[0, 0, dx * 2.5]} castShadow>
          <coneGeometry args={[0.02, 0.2, 5]} />
          <meshStandardMaterial color={i === 1 ? "#4f8a41" : "#5f9a4e"} roughness={0.8} />
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

function Bush({ position, scale }) {
  return (
    <group position={[position[0], 0, position[1]]} scale={scale}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.26, 9, 7]} />
        <meshStandardMaterial color="#4c8a44" roughness={0.85} />
      </mesh>
      <mesh position={[0.18, 0.16, 0.1]} castShadow receiveShadow>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshStandardMaterial color="#5a9950" roughness={0.85} />
      </mesh>
      <mesh position={[-0.15, 0.14, -0.12]} castShadow receiveShadow>
        <sphereGeometry args={[0.16, 8, 6]} />
        <meshStandardMaterial color="#5a9950" roughness={0.85} />
      </mesh>
    </group>
  );
}

const BUSH_PLACEMENTS = [
  { position: [5.6, -1.2], scale: 0.9 },
  { position: [-5.4, -0.8], scale: 0.85 },
  { position: [4.4, 4.2], scale: 0.75 },
  { position: [-4.1, 4.6], scale: 0.8 },
  { position: [0, 6.8], scale: 0.9 },
];

function Bushes() {
  return (
    <>
      {BUSH_PLACEMENTS.map((b, i) => (
        <Bush key={i} {...b} />
      ))}
    </>
  );
}

const PEBBLE_COLORS = ["#d7cdbb", "#bcc9c5", "#e0d3bd", "#c6bccb"];
const PEBBLE_CLUSTERS = [
  { position: [0.85, -1.9], count: 3 },
  { position: [-0.8, -2.4], count: 2 },
  { position: [0.9, 1.6], count: 3 },
];

function pebbleSeed(position, index, offset) {
  return seededRand((position[0] * 131.1 + position[1] * 71.7 + index * 33.3 + offset) * 12.9898);
}

function PebbleCluster({ position, count }) {
  const pebbles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const r1 = pebbleSeed(position, i, 1);
      const r2 = pebbleSeed(position, i, 2);
      const r3 = pebbleSeed(position, i, 3);
      return {
        offset: [(r1 - 0.5) * 0.4, (r2 - 0.5) * 0.4],
        radius: 0.06 + r3 * 0.07,
        squish: [0.85 + r1 * 0.3, 0.55 + r2 * 0.3, 0.85 + r3 * 0.3],
        color: PEBBLE_COLORS[i % PEBBLE_COLORS.length],
        rotation: r1 * Math.PI * 2,
      };
    });
  }, [position, count]);

  return (
    <group position={[position[0], 0, position[1]]}>
      {pebbles.map((p, i) => (
        <mesh
          key={i}
          position={[p.offset[0], p.radius * p.squish[1] * 0.5, p.offset[1]]}
          rotation={[0.15, p.rotation, 0.08]}
          scale={[p.radius * p.squish[0], p.radius * p.squish[1], p.radius * p.squish[2]]}
          castShadow
          receiveShadow
        >
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={p.color} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Pebbles() {
  return (
    <>
      {PEBBLE_CLUSTERS.map((c, i) => (
        <PebbleCluster key={i} {...c} />
      ))}
    </>
  );
}

function useFreeRoam({ bounds = 4, minHeight = 0.6, maxHeight = 1.3, speed = 0.4 } = {}) {
  const state = useMemo(() => {
    const randPoint = () =>
      new THREE.Vector3(
        (Math.random() - 0.5) * bounds * 2,
        minHeight + Math.random() * (maxHeight - minHeight),
        (Math.random() - 0.5) * bounds * 2
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
        (Math.random() - 0.5) * bounds * 2
      );
    } else {
      dir.normalize();
      state.pos.addScaledVector(dir, Math.min(speed * delta, dist));
    }
    return state.pos;
  };

  return { step };
}

function Firefly({ bounds, speed, height }) {
  const ref = useRef();
  const { step } = useFreeRoam({ bounds, minHeight: height - 0.2, maxHeight: height + 0.3, speed });
  const bobPhase = useMemo(() => Math.random() * Math.PI * 2, []);
  useFrame(({ clock }, delta) => {
    const pos = step(delta);
    if (ref.current) {
      ref.current.position.set(pos.x, pos.y + Math.sin(clock.getElapsedTime() * 2 + bobPhase) * 0.08, pos.z);
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.025, 8, 8]} />
      <meshBasicMaterial color="#ffe38a" />
      <pointLight color="#ffe38a" intensity={0.35} distance={0.9} />
    </mesh>
  );
}

function WanderingCharacter({ modelPath, homePosition }) {
  const group = useRef();
  const { scene } = useGLTF(modelPath);
  const offset = useGroundedOffset(scene);

  const pos = useRef(new THREE.Vector3(homePosition[0], 0, homePosition[1]));
  const target = useRef(new THREE.Vector3(homePosition[0], 0, homePosition[1]));
  const nextDecision = useRef(0);
  const speed = 0.5;

  const pickNewTarget = () => {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 3.2;
    target.current.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
  };

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();

    if (t > nextDecision.current) {
      pickNewTarget();
      nextDecision.current = t + 3 + Math.random() * 3;
    }

    const toTarget = target.current.clone().sub(pos.current);
    const dist = toTarget.length();
    const moving = dist > 0.05;

    if (moving) {
      const step = Math.min(speed * delta, dist);
      pos.current.addScaledVector(toTarget.clone().normalize(), step);
      const targetAngle = Math.atan2(toTarget.x, toTarget.z);
      let angleDelta = targetAngle - group.current.rotation.y;
      while (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
      while (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
      group.current.rotation.y += angleDelta * 0.12;
    }

    group.current.position.x = pos.current.x;
    group.current.position.z = pos.current.z;
    group.current.position.y = Math.sin(t * (moving ? 4 : 2)) * (moving ? 0.02 : 0.05);
  });

  return (
    <group ref={group} position={[homePosition[0], 0, homePosition[1]]}>
      <primitive object={scene} position={offset} />
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
      return <WanderingCharacter modelPath={DEFAULT_MODEL} homePosition={this.props.position} />;
    }
    return this.props.children;
  }
}

const ISO_DISTANCE = 11;
const ISO_ELEVATION = Math.atan(1 / Math.sqrt(2)) + 0.08;
const ISO_YAW = 0;
const ISO_POSITION = [
  ISO_DISTANCE * Math.cos(ISO_ELEVATION) * Math.sin(ISO_YAW),
  ISO_DISTANCE * Math.sin(ISO_ELEVATION),
  ISO_DISTANCE * Math.cos(ISO_ELEVATION) * Math.cos(ISO_YAW),
];

const FoxHabitat3D = ({ characterModel }) => {
  return (
    <div className="habitat-canvas-wrap habitat-canvas-wrap--no-touch-scroll">
      <Canvas
        shadows
        orthographic
        camera={{ position: ISO_POSITION, zoom: 46, near: 0.1, far: 60 }}
        gl={{ toneMappingExposure: 1.2 }}
        style={{ touchAction: "none" }}
        onCreated={({ gl }) => {
          gl.domElement.style.touchAction = "none";
        }}
      >
        <color attach="background" args={["#4a6b43"]} />
        <fog attach="fog" args={["#4a6b43", 13, 26]} />

        <OrbitControls
          makeDefault
          target={[0, 0.9, -0.8]}
          enableDamping
          dampingFactor={0.08}
          enablePan
          screenSpacePanning
          panSpeed={1}
          enableRotate
          rotateSpeed={0.6}
          minPolarAngle={0.55}
          maxPolarAngle={1.05}
          minZoom={30}
          maxZoom={80}
          mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }}
          touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }}
        />

        <ambientLight intensity={0.85} />
        <directionalLight
          position={[5, 8, 3]}
          intensity={2.3}
          color="#fff7da"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-9}
          shadow-camera-right={9}
          shadow-camera-top={9}
          shadow-camera-bottom={-9}
        />
        <directionalLight position={[-5, 3, -4]} intensity={0.4} color="#a8e0ea" />
        <hemisphereLight args={["#f0ffe6", "#2c3a24", 1.05]} />

        <React.Suspense fallback={null}>
          <Ground />
          <Path />

          <HouseErrorBoundary>
            <React.Suspense fallback={null}>
              <House />
            </React.Suspense>
          </HouseErrorBoundary>

          <TreesErrorBoundary>
            <React.Suspense fallback={null}>
              <Trees />
            </React.Suspense>
          </TreesErrorBoundary>

          <RockCluster position={[1.3, 0, -0.3]} scale={0.9} rotation={0.4} />
          <RockCluster position={[1.7, 0, 0.05]} scale={0.55} rotation={2.1} />

          <Campfire position={[1.0, 0, -0.4]} />

          <Mushrooms />
          <Flowers />
          <GrassTufts />
          <Bushes />
          <Pebbles />

          <Firefly bounds={2.6} speed={0.35} height={0.9} />
          <Firefly bounds={2.0} speed={0.4} height={1.2} />
          <Firefly bounds={3.2} speed={0.3} height={0.7} />

          <CharacterErrorBoundary position={[0, 1.8]}>
            <WanderingCharacter modelPath={characterModel} homePosition={[0, 1.8]} />
          </CharacterErrorBoundary>
        </React.Suspense>
      </Canvas>
    </div>
  );
};

export default FoxHabitat3D;
