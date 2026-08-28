// Bear Habitat **ROUGH draft**
// what needs to be done/is being worked on: 
//1. fix the entire habitat, looks a mess 2. have a better color scheme/theme, 
// 3. use the house 3D asset for bear instead of fox, 4.create 3D tree assets etc???
// 5. fix the sizing of the bear and take out the movement animation.
import React, { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import "../../styling/components/habitats.css";
import { DEFAULT_MODEL } from "../../constants/avatars";
import { useGroundedOffset, seededRand, drawWrapped } from "./habitatUtils";

const GROUND_TEX_SIZE = 512;
function buildForestFloorTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = GROUND_TEX_SIZE;
  canvas.height = GROUND_TEX_SIZE;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "hsl(96, 28%, 27%)";
  ctx.fillRect(0, 0, GROUND_TEX_SIZE, GROUND_TEX_SIZE);

  for (let i = 0; i < 40; i++) {
    const seed = i * 61 + 3;
    const bx = (seed * 37) % GROUND_TEX_SIZE;
    const by = (seed * 53) % GROUND_TEX_SIZE;
    const radius = 42 + (seed % 5) * 20;
    const hue = 90 + (seed % 9) * 3;
    const light = 24 + (seed % 6) * 4;
    drawWrapped(ctx, bx, by, GROUND_TEX_SIZE, radius, (x, y) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, `hsla(${hue}, 36%, ${light}%, 0.55)`);
      grad.addColorStop(1, `hsla(${hue}, 36%, ${light}%, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  for (let i = 0; i < 850; i++) {
    const seed = i * 17 + 9;
    const bx = (seed * 31) % GROUND_TEX_SIZE;
    const by = (seed * 47) % GROUND_TEX_SIZE;
    const hue = 95 + (seed % 10) * 2;
    const light = 22 + (seed % 8) * 3;
    ctx.fillStyle = `hsla(${hue}, 40%, ${light}%, 0.5)`;
    drawWrapped(ctx, bx, by, GROUND_TEX_SIZE, 6, (x, y) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((seed % 12) * 0.26);
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.3, 4.0, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  const LEAF_HUES = [18, 32, 8];
  for (let i = 0; i < 55; i++) {
    const seed = i * 89 + 13;
    const lx = (seed * 23) % GROUND_TEX_SIZE;
    const ly = (seed * 41) % GROUND_TEX_SIZE;
    const hue = LEAF_HUES[i % LEAF_HUES.length];
    drawWrapped(ctx, lx, ly, GROUND_TEX_SIZE, 7, (x, y) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((seed % 20) * 0.31);
      ctx.fillStyle = `hsla(${hue}, 60%, ${42 + (seed % 5) * 4}%, 0.85)`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.5, 3.0, 0, 0, Math.PI * 2);
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

function Ground({ size = 34 }) {
  const tex = useMemo(() => buildForestFloorTexture(), []);
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

function generateForestRings() {
  const placements = [];
  const rings = [
    { count: 14, rMin: 6.5, rMax: 8.0, scaleMin: 1.2, scaleMax: 1.8 },
    { count: 20, rMin: 8.5, rMax: 10.8, scaleMin: 1.3, scaleMax: 2.1 },
    { count: 24, rMin: 11.4, rMax: 15.0, scaleMin: 1.4, scaleMax: 2.5 },
  ];
  rings.forEach(({ count, rMin, rMax, scaleMin, scaleMax }) => {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const radius = rMin + Math.random() * (rMax - rMin);

      const nearRiverGap = Math.abs(Math.cos(angle)) < 0.28;
      if (nearRiverGap && radius < 9.5) continue;
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

function buildStreamTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 128, 0);
  gradient.addColorStop(0, "#4f96a8");
  gradient.addColorStop(0.5, "#5fb0b8");
  gradient.addColorStop(1, "#4f96a8");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  for (let i = 0; i < 26; i++) {
    const seed = i * 53 + 7;
    const gx = (seed * 19) % 128;
    const gy = (seed * 31) % 128;
    const r = 1 + (seed % 3) * 0.9;
    ctx.fillStyle = `rgba(255,255,255,${0.06 + (seed % 4) * 0.025})`;
    ctx.beginPath();
    ctx.ellipse(gx, gy, r * 2.2, r, (seed % 6) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildStreamGeometry(length = 30, baseWidth = 2.6, segments = 40) {
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i <= segments; i++) {
    const v = i / segments;
    const z = -length / 2 + v * length;
    const bend = Math.sin(v * Math.PI * 2.2) * 1.1;
    const width = baseWidth * (0.85 + 0.15 * Math.sin(v * Math.PI * 3.1));
    positions.push(bend - width / 2, 0, z, bend + width / 2, 0, z);
    uvs.push(0, v, 1, v);
    if (i < segments) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function Stream() {
  const tex = useMemo(() => buildStreamTexture(), []);
  const geo = useMemo(() => buildStreamGeometry(), []);
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.material.opacity = 0.9 + Math.sin(t * 0.6) * 0.05;
  });
  return (
    <mesh ref={ref} geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[2.4, 0.02, 0]}>
      <meshStandardMaterial map={tex} roughness={0.2} metalness={0.1} transparent opacity={0.92} />
    </mesh>
  );
}

function JumpingFish({ streamX = 2.4, z = 1.5, delay = 0 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const cycle = 5;
    const t = (clock.getElapsedTime() + delay) % cycle;
    const jumping = t < 0.9;
    if (jumping) {
      const p = t / 0.9;
      ref.current.visible = true;
      ref.current.position.y = Math.sin(p * Math.PI) * 0.5;
      ref.current.rotation.x = -Math.PI / 2 + Math.sin(p * Math.PI) * 0.8;
    } else {
      ref.current.visible = false;
    }
  });
  return (
    <mesh ref={ref} position={[streamX, 0, z]}>
      <capsuleGeometry args={[0.05, 0.16, 4, 8]} />
      <meshStandardMaterial color="#8a9aa0" roughness={0.4} metalness={0.2} />
    </mesh>
  );
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
        <meshStandardMaterial color="#4f7a44" roughness={0.9} />
      </mesh>
    </group>
  );
}
const ROCK_PLACEMENTS = [
  { position: [1.4, 0, 2.6], scale: 0.8, rotation: 0.4 },
  { position: [3.3, 0, -1.4], scale: 0.65, rotation: 2.0 },
  { position: [0.7, 0, -2.8], scale: 0.7, rotation: 1.1 },
];

function HollowLog({ position = [-1.6, -0.6], rotation = 0.3 }) {
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.32, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.38, 2.4, 12]} />
        <meshStandardMaterial color="#6b4a34" roughness={0.9} />
      </mesh>
      <mesh position={[1.2, 0.32, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.24, 0.24, 0.06, 12]} />
        <meshStandardMaterial color="#241a12" roughness={1} />
      </mesh>
      <mesh position={[0, 0.5, 0.2]} rotation={[0.3, 0, 0]} castShadow>
        <sphereGeometry args={[0.14, 8, 6]} />
        <meshStandardMaterial color="#4f7a44" roughness={0.9} />
      </mesh>
      <mesh position={[-0.5, 0.5, -0.15]} rotation={[0.2, 0, 0]} castShadow>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshStandardMaterial color="#588252" roughness={0.9} />
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
    </group>
  );
}
const MUSHROOM_PLACEMENTS = [
  { position: [-2.6, -1.5], rotation: 0.6, scale: 0.7, colorIndex: 0 },
  { position: [-2.1, 0.6], rotation: 2.0, scale: 0.6, colorIndex: 1 },
  { position: [4.6, 3.4], rotation: 1.1, scale: 0.65, colorIndex: 2 },
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

const BERRY_COLOR = "#8f2a3a";
function BerryBush({ position, scale }) {
  return (
    <group position={[position[0], 0, position[1]]} scale={scale}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.26, 9, 7]} />
        <meshStandardMaterial color="#4c7a3f" roughness={0.85} />
      </mesh>
      <mesh position={[0.18, 0.16, 0.1]} castShadow receiveShadow>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshStandardMaterial color="#588a49" roughness={0.85} />
      </mesh>
      <mesh position={[-0.15, 0.14, -0.12]} castShadow receiveShadow>
        <sphereGeometry args={[0.16, 8, 6]} />
        <meshStandardMaterial color="#588a49" roughness={0.85} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.22, 0.26 + (i % 2) * 0.06, Math.sin(a) * 0.22]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshStandardMaterial color={BERRY_COLOR} />
          </mesh>
        );
      })}
    </group>
  );
}
const BUSH_PLACEMENTS = [
  { position: [-3.6, 1.6], scale: 0.9 },
  { position: [-4.2, -2.4], scale: 0.8 },
  { position: [3.8, 1.2], scale: 0.75 },
];
function BerryBushes() {
  return (
    <>
      {BUSH_PLACEMENTS.map((b, i) => (
        <BerryBush key={i} {...b} />
      ))}
    </>
  );
}

const GRASS_TUFT_PLACEMENTS = Array.from({ length: 24 })
  .map((_, i) => {
    const angle = seededRand(i * 3.1) * Math.PI * 2;
    const r = 2.0 + seededRand(i * 7.7) * 4.4;
    return {
      position: [Math.cos(angle) * r, Math.sin(angle) * r],
      rotation: seededRand(i * 5.3) * Math.PI * 2,
      scale: 0.65 + seededRand(i * 9.1) * 0.5,
    };
  })
  .filter((t) => Math.abs(t.position[0] - 2.4) > 1.6);

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

const PEBBLE_COLORS = ["#8d97a0", "#b5aa96", "#a3aaa1", "#c3b8a5"];
const PEBBLE_CLUSTERS = [
  { position: [1.0, 1.4], count: 3 },
  { position: [1.1, -0.6], count: 2 },
  { position: [1.3, -2.2], count: 3 },
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
        (Math.random() - 0.5) * bounds * 2 - 1.5,
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
        (Math.random() - 0.5) * bounds * 2 - 1.5,
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
  const speed = 0.4;

  const pickNewTarget = () => {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 2.2;
    target.current.set(homePosition[0] + Math.cos(angle) * r, 0, homePosition[1] + Math.sin(angle) * r);
  };

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();

    if (t > nextDecision.current) {
      pickNewTarget();
      nextDecision.current = t + 3.5 + Math.random() * 3;
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
      group.current.rotation.y += angleDelta * 0.1;
    }

    group.current.position.x = pos.current.x;
    group.current.position.z = pos.current.z;
    group.current.position.y = Math.sin(t * (moving ? 3.5 : 1.8)) * (moving ? 0.02 : 0.04);
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

const BEAR_HOME_POSITION = [-0.6, 0.6];

const ISO_DISTANCE = 11;
const ISO_ELEVATION = Math.atan(1 / Math.sqrt(2)) + 0.08;
const ISO_YAW = 0;
const ISO_POSITION = [
  ISO_DISTANCE * Math.cos(ISO_ELEVATION) * Math.sin(ISO_YAW),
  ISO_DISTANCE * Math.sin(ISO_ELEVATION),
  ISO_DISTANCE * Math.cos(ISO_ELEVATION) * Math.cos(ISO_YAW),
];

const BearHabitat3D = ({ characterModel, showCharacter = true }) => {
  return (
    <div className="habitat-canvas-wrap habitat-canvas-wrap--no-touch-scroll">
      <Canvas
        shadows
        orthographic
        camera={{ position: ISO_POSITION, zoom: 44, near: 0.1, far: 60 }}
        gl={{ toneMappingExposure: 1.2 }}
        style={{ touchAction: "none" }}
        onCreated={({ gl }) => {
          gl.domElement.style.touchAction = "none";
        }}
      >
        <color attach="background" args={["#6f8850"]} />
        <fog attach="fog" args={["#e0b168", 14, 27]} />

        <OrbitControls
          makeDefault
          target={[0, 0.9, 0]}
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
          maxZoom={76}
          mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }}
          touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }}
        />

        <ambientLight intensity={0.75} />
        <directionalLight
          position={[5, 7, 3]}
          intensity={2.4}
          color="#ffd9a0"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-9}
          shadow-camera-right={9}
          shadow-camera-top={9}
          shadow-camera-bottom={-9}
        />
        <directionalLight position={[-5, 3, -4]} intensity={0.35} color="#8aa0d6" />
        <hemisphereLight args={["#ffe9c7", "#2c3a24", 1.0]} />

        <React.Suspense fallback={null}>
          <Ground />

          <TreesErrorBoundary>
            <React.Suspense fallback={null}>
              <Trees />
            </React.Suspense>
          </TreesErrorBoundary>

          <Stream />
          <JumpingFish streamX={2.3} z={2.0} delay={0} />
          <JumpingFish streamX={2.6} z={-1.2} delay={2.5} />

          <HollowLog />

          {ROCK_PLACEMENTS.map((r, i) => (
            <RockCluster key={i} {...r} />
          ))}

          <Mushrooms />
          <BerryBushes />
          <GrassTufts />
          <Pebbles />

          <Firefly bounds={2.6} speed={0.35} height={0.9} />
          <Firefly bounds={2.0} speed={0.4} height={1.2} />
          <Firefly bounds={3.2} speed={0.3} height={0.7} />
          {showCharacter &&( 
          <CharacterErrorBoundary position={BEAR_HOME_POSITION}>
            <WanderingCharacter modelPath={characterModel} homePosition={BEAR_HOME_POSITION} />
          </CharacterErrorBoundary>
          )}
        </React.Suspense>
      </Canvas>
    </div>
  );
};

export default BearHabitat3D;
