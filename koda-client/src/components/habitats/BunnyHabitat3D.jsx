// Bunny habitat 
import React, { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import "../../styling/habitats.css";
import { DEFAULT_MODEL } from "../../constants/avatars";
import { useGroundedOffset, seededRand } from "./habitatUtils";

const MEADOW_TEX_SIZE = 256;
function buildMeadowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = MEADOW_TEX_SIZE;
  canvas.height = MEADOW_TEX_SIZE;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "hsl(83, 48%, 60%)";
  ctx.fillRect(0, 0, MEADOW_TEX_SIZE, MEADOW_TEX_SIZE);

  for (let i = 0; i < 90; i++) {
    const seed = i * 53 + 7;
    const cx = (seed * 17) % MEADOW_TEX_SIZE;
    const cy = (seed * 31) % MEADOW_TEX_SIZE;
    const r = 22 + (seed % 26);
    const hue = 78 + (seed % 14);
    const light = 54 + (seed % 10);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, `hsla(${hue}, 52%, ${light}%, 0.5)`);
    grad.addColorStop(1, `hsla(${hue}, 52%, ${light}%, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 320; i++) {
    const seed = i * 91 + 13;
    const bx = (seed * 7) % MEADOW_TEX_SIZE;
    const by = (seed * 19) % MEADOW_TEX_SIZE;
    const hue = 82 + (seed % 10);
    const a = seededRand(seed) * Math.PI;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(a);
    ctx.fillStyle = `hsla(${hue + 6}, 56%, 66%, 0.55)`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.2, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (let i = 0; i < 24; i++) {
    const seed = i * 97 + 11;
    const cx = (seed * 13) % canvas.width;
    const cy = (seed * 29) % canvas.height;
    ctx.fillStyle = "hsl(104, 32%, 40%)";
    for (let l = 0; l < 3; l++) {
      const a = (l / 3) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * 2.4, cy + Math.sin(a) * 2.4, 2.0, 1.4, a, 0, Math.PI * 2);
      ctx.fill();
    }
    if (seed % 3 === 0) {
      ctx.fillStyle = "rgba(255,175,205,0.92)";
      ctx.beginPath();
      ctx.arc(cx, cy - 3, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < 28; i++) {
    const seed = i * 71 + 5;
    const dx = (seed * 17) % canvas.width;
    const dy = (seed * 41) % canvas.height;
    const petal = seed % 3 === 0 ? "rgba(216,196,255,0.85)" : "rgba(255,205,225,0.85)";
    ctx.fillStyle = petal;
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(dx + Math.cos(a) * 1.6, dy + Math.sin(a) * 1.6, 1, 0.7, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#ffcf5c";
    ctx.beginPath();
    ctx.arc(dx, dy, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function Ground({ size = 100 }) {
  const tex = useMemo(() => buildMeadowTexture(), []);
  const repeats = size / 2.75;
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

function buildDirtTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 90);
  grad.addColorStop(0, "rgba(199,132,79,0.95)");
  grad.addColorStop(0.6, "rgba(199,132,79,0.75)");
  grad.addColorStop(1, "rgba(199,132,79,0.35)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = "rgba(150,92,52,0.3)";
  for (let i = 0; i < 30; i++) {
    const a = ((i * 137) % 360) * (Math.PI / 180);
    const r = (i * 13) % 60;
    ctx.beginPath();
    ctx.ellipse(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 2.5, 1.5, a, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(222,196,158,0.35)";
  for (let i = 0; i < 18; i++) {
    const a = ((i * 91) % 360) * (Math.PI / 180);
    const r = (i * 21) % 62;
    ctx.beginPath();
    ctx.arc(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const PEN_WIDTH = 7.2;
const PEN_DEPTH = 6.2;

function DirtPen() {
  const tex = useMemo(() => buildDirtTexture(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
      <planeGeometry args={[PEN_WIDTH - 0.6, PEN_DEPTH - 0.6]} />
      <meshStandardMaterial map={tex} transparent roughness={0.95} depthWrite={false} />
    </mesh>
  );
}

function generateFencePerimeter(width, depth, spacing, gate) {
  const posts = [];
  const halfW = width / 2;
  const halfD = depth / 2;

  const addEdge = (x1, z1, x2, z2, angle) => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    const steps = Math.max(1, Math.round(len / spacing));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + dx * t;
      const z = z1 + dz * t;
      if (gate && Math.abs(x - gate.x) < gate.width / 2 && Math.abs(z - gate.z) < gate.width / 2) {
        continue;
      }
      posts.push({ x, z, angle });
    }
  };

  addEdge(-halfW, -halfD, halfW, -halfD, 0);
  addEdge(-halfW, halfD, halfW, halfD, 0);
  addEdge(-halfW, -halfD, -halfW, halfD, Math.PI / 2);
  addEdge(halfW, -halfD, halfW, halfD, Math.PI / 2);

  return posts;
}

const FENCE_GATE = { x: 0, z: PEN_DEPTH / 2, width: 1.4 };
const FENCE_POSTS = generateFencePerimeter(PEN_WIDTH, PEN_DEPTH, 0.42, FENCE_GATE);

function FencePost({ x, z, angle }) {
  return (
    <group position={[x, 0, z]} rotation={[0, angle, 0]}>
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.56, 0.05]} />
        <meshStandardMaterial color="#f6f1e4" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.58, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.07, 0.12, 4]} />
        <meshStandardMaterial color="#efe8d6" roughness={0.75} />
      </mesh>
    </group>
  );
}

function Fence() {
  const halfW = PEN_WIDTH / 2;
  const halfD = PEN_DEPTH / 2;
  const railY = [0.18, 0.42];
  return (
    <>
      {FENCE_POSTS.map((p, i) => (
        <FencePost key={i} x={p.x} z={p.z} angle={p.angle} />
      ))}
      {railY.map((y, i) => (
        <React.Fragment key={i}>
          <mesh position={[0, y, -halfD]} castShadow>
            <boxGeometry args={[PEN_WIDTH, 0.05, 0.03]} />
            <meshStandardMaterial color="#efe8d6" roughness={0.75} />
          </mesh>
          <mesh position={[-halfW, y, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <boxGeometry args={[PEN_DEPTH, 0.05, 0.03]} />
            <meshStandardMaterial color="#efe8d6" roughness={0.75} />
          </mesh>
          <mesh position={[halfW, y, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <boxGeometry args={[PEN_DEPTH, 0.05, 0.03]} />
            <meshStandardMaterial color="#efe8d6" roughness={0.75} />
          </mesh>
        </React.Fragment>
      ))}
    </>
  );
}

const BUNTING_COLORS = ["#ffb6d9", "#fff3b0", "#bfe6f2", "#c9b8ff", "#c8f2b0"];

function BuntingFlag({ x, y, z, color, phase }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.z = Math.sin(clock.getElapsedTime() * 1.5 + phase) * 0.08;
  });
  return (
    <group ref={ref} position={[x, y, z]}>
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.06, 0.1, 3]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Bunting() {
  const halfW = PEN_WIDTH / 2;
  const z = -PEN_DEPTH / 2;
  const y = 0.34;
  const count = 9;
  const flags = Array.from({ length: count }).map((_, i) => ({
    x: -halfW + 0.5 + (i / (count - 1)) * (PEN_WIDTH - 1),
    y,
    z,
    color: BUNTING_COLORS[i % BUNTING_COLORS.length],
    phase: i * 0.6,
  }));
  return (
    <>
      {flags.map((f, i) => (
        <BuntingFlag key={i} {...f} />
      ))}
    </>
  );
}

function buildHayTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#e6c674";
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = "rgba(160,120,50,0.5)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    const x = seededRand(i * 3.7) * 64;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (seededRand(i * 5.1) - 0.5) * 6, 64);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function HayBale({ position = [-1.7, -1.0], rotation = 0.15 }) {
  const tex = useMemo(() => buildHayTexture(), []);
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.32, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.9, 16]} />
        <meshStandardMaterial map={tex} roughness={1} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.45, 0.32, 0]}>
        <circleGeometry args={[0.32, 16]} />
        <meshStandardMaterial map={tex} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.45, 0.32, 0]}>
        <circleGeometry args={[0.32, 16]} />
        <meshStandardMaterial map={tex} roughness={1} />
      </mesh>

      {[0, 1, 2, 3].map((i) => {
        const a = seededRand(i * 4.4) * Math.PI * 2;
        const x = Math.cos(a) * 0.3;
        const z = Math.sin(a) * 0.15;
        return (
          <mesh key={i} position={[x, 0.6, z]} rotation={[0.3, a, 0.4]}>
            <coneGeometry args={[0.012, 0.22, 4]} />
            <meshStandardMaterial color="#f0d488" roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

function Hutch({ position = [1.9, -1.1], rotation = -0.3 }) {
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>

      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.56, 0.8]} />
        <meshStandardMaterial color="#dba36c" roughness={0.85} />
      </mesh>

      <mesh position={[0, 0.2, 0.401]}>
        <circleGeometry args={[0.14, 20]} />
        <meshStandardMaterial color="#5a3d28" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <group position={[0, 0.42, 0.402]} rotation={[0, 0, Math.PI / 4]}>
        <mesh position={[-0.025, 0.02, 0]}>
          <circleGeometry args={[0.028, 12]} />
          <meshStandardMaterial color="#ff9fb8" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.025, 0.02, 0]}>
          <circleGeometry args={[0.028, 12]} />
          <meshStandardMaterial color="#ff9fb8" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.018, 0]}>
          <planeGeometry args={[0.05, 0.05]} />
          <meshStandardMaterial color="#ff9fb8" side={THREE.DoubleSide} />
        </mesh>
      </group>

      <mesh position={[0, 0.06, 0.65]} rotation={[-0.35, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.22, 0.03, 0.5]} />
        <meshStandardMaterial color="#c9935f" roughness={0.9} />
      </mesh>

      <mesh position={[-0.28, 0.36, 0.401]}>
        <planeGeometry args={[0.16, 0.16]} />
        <meshStandardMaterial color="#bfe6f2" roughness={0.3} />
      </mesh>
      <mesh position={[-0.28, 0.36, 0.406]}>
        <boxGeometry args={[0.17, 0.015, 0.004]} />
        <meshStandardMaterial color="#fff8ef" />
      </mesh>
      <mesh position={[-0.28, 0.36, 0.406]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.17, 0.015, 0.004]} />
        <meshStandardMaterial color="#fff8ef" />
      </mesh>

      <mesh position={[-0.28, 0.27, 0.43]} castShadow>
        <boxGeometry args={[0.2, 0.06, 0.06]} />
        <meshStandardMaterial color="#a9714a" roughness={0.9} />
      </mesh>
      {[-0.06, 0, 0.06].map((dx, i) => (
        <mesh key={i} position={[-0.28 + dx, 0.31, 0.43]}>
          <sphereGeometry args={[0.028, 6, 6]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#ffc2d9" : "#fff3b0"} />
        </mesh>
      ))}

      <mesh position={[0, 0.78, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.75, 0.5, 4]} />
        <meshStandardMaterial color="#8a5636" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#fff3b0" />
      </mesh>

      <mesh position={[0.22, 0.85, -0.15]} castShadow>
        <boxGeometry args={[0.08, 0.24, 0.08]} />
        <meshStandardMaterial color="#c98a5f" roughness={0.85} />
      </mesh>
    </group>
  );
}

function SmokePuff({ basePosition, phase = 0 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.getElapsedTime() + phase) % 4;
    const cycle = t / 4;
    ref.current.position.set(
      basePosition[0] + Math.sin(cycle * 6) * 0.05,
      basePosition[1] + cycle * 0.6,
      basePosition[2]
    );
    ref.current.scale.setScalar(0.05 + cycle * 0.12);
    ref.current.material.opacity = (1 - cycle) * 0.5;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color="#f5f0e8" transparent opacity={0} />
    </mesh>
  );
}

function ChimneySmoke() {
  const base = [2.12, 1.0, -1.25];
  return (
    <>
      <SmokePuff basePosition={base} phase={0} />
      <SmokePuff basePosition={base} phase={1.3} />
      <SmokePuff basePosition={base} phase={2.6} />
    </>
  );
}

function Signpost({ position = [1.6, PEN_DEPTH / 2 + 0.3], rotation = 0.15 }) {
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.035, 0.64, 8]} />
        <meshStandardMaterial color="#a9714a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.56, 0]} castShadow>
        <boxGeometry args={[0.42, 0.24, 0.03]} />
        <meshStandardMaterial color="#f6e9d0" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.56, 0.017]}>
        <circleGeometry args={[0.06, 5]} />
        <meshStandardMaterial color="#ff9fb8" />
      </mesh>
    </group>
  );
}

function buildMoundTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  grad.addColorStop(0, "rgba(168,112,64,0.95)");
  grad.addColorStop(0.6, "rgba(168,112,64,0.7)");
  grad.addColorStop(1, "rgba(168,112,64,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const CARROT_PLACEMENTS = [{ x: 0.55, z: 0.55, rotation: 0.5 }];

function Carrot({ x, z, rotation, sourceScene }) {
  const object = useMemo(() => sourceScene.clone(), [sourceScene]);
  const offset = useGroundedOffset(object);
  const ref = useRef();
  const swayPhase = useMemo(() => Math.random() * Math.PI * 2, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.9 + swayPhase) * 0.04;
  });

  const scale = 0.39;
  return (
    <group ref={ref} position={[x, 0, z]} rotation={[0, rotation, 0]}>
      <primitive object={object} scale={scale} position={[offset[0], offset[1], offset[2]]} />
    </group>
  );
}

function CarrotPatch() {
  const { scene } = useGLTF('/models/habitats/carrot.glb');
  const tex = useMemo(() => buildMoundTexture(), []);
  return (
    <>
      {CARROT_PLACEMENTS.map((c, i) => (
        <mesh key={`mound-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[c.x, 0.016, c.z]}>
          <circleGeometry args={[0.65, 20]} />
          <meshStandardMaterial map={tex} transparent depthWrite={false} roughness={1} />
        </mesh>
      ))}
      {CARROT_PLACEMENTS.map((c, i) => (
        <Carrot key={i} x={c.x} z={c.z} rotation={c.rotation} sourceScene={scene} />
      ))}
    </>
  );
}

class CarrotPatchErrorBoundary extends React.Component {
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

const FLOWER_COLORS = ["#ffd9e8", "#fff3b0", "#ffffff", "#ffc2d9", "#d9c2ff"];

function Flower({ position, color }) {
  const petalColor = FLOWER_COLORS[color % FLOWER_COLORS.length];
  return (
    <group position={[position[0], 0.012, position[1]]}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.06, 0, Math.sin(a) * 0.06]}
            rotation={[-Math.PI / 2, 0, a]}
          >
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshStandardMaterial color={petalColor} roughness={0.6} />
          </mesh>
        );
      })}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#ffe37a" roughness={0.5} />
      </mesh>
    </group>
  );
}

function generateFlowerScatter(count, seedOffset) {
  const flowers = [];
  const halfW = PEN_WIDTH / 2 + 0.5;
  const halfD = PEN_DEPTH / 2 + 0.5;
  let seed = seedOffset;
  let attempts = 0;
  while (flowers.length < count && attempts < count * 30) {
    attempts++;
    seed += 1;
    const angle = seededRand(seed * 12.9) * Math.PI * 2;
    const radius = 4.2 + seededRand(seed * 7.7 + 1) * 3.6;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (Math.abs(x) < halfW && Math.abs(z) < halfD) continue;
    const color = Math.floor(seededRand(seed * 3.3 + 2) * FLOWER_COLORS.length);
    flowers.push({ position: [x, z], color });
  }
  return flowers;
}

const FLOWER_PLACEMENTS = generateFlowerScatter(30, 41);

function Flowers() {
  return (
    <>
      {FLOWER_PLACEMENTS.map((f, i) => (
        <Flower key={i} position={f.position} color={f.color} />
      ))}
    </>
  );
}

const MUSHROOM_COLORS = ["#ff9f8f", "#ffc2d9", "#d9a5ff"];

function Mushroom({ position, color, scale = 1, rotation = 0 }) {
  const capColor = MUSHROOM_COLORS[color % MUSHROOM_COLORS.length];
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.032, 0.12, 8]} />
        <meshStandardMaterial color="#fff8ef" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.13, 0]} castShadow>
        <sphereGeometry args={[0.07, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={capColor} roughness={0.6} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.4;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.035, 0.155, Math.sin(a) * 0.035]}>
            <sphereGeometry args={[0.012, 6, 6]} />
            <meshStandardMaterial color="#fff8ef" />
          </mesh>
        );
      })}
    </group>
  );
}

const MUSHROOM_CLUSTER_PLACEMENTS = [
  { position: [-1.6, 4.0], color: 0, scale: 1.1, rotation: 0.4 },
  { position: [-1.85, 4.15], color: 1, scale: 0.75, rotation: 1.2 },
  { position: [2.7, 3.6], color: 2, scale: 1.0, rotation: 2.0 },
  { position: [2.9, 3.4], color: 0, scale: 0.7, rotation: 0.8 },
  { position: [-4.0, -3.0], color: 1, scale: 0.9, rotation: 1.6 },
  { position: [4.0, -2.0], color: 2, scale: 0.85, rotation: 0.5 },
];

function Mushrooms() {
  return (
    <>
      {MUSHROOM_CLUSTER_PLACEMENTS.map((m, i) => (
        <Mushroom key={i} {...m} />
      ))}
    </>
  );
}

const ROCK_PLACEMENTS = [
  { position: [-4.1, -1.0], scale: 0.3, rotation: 0.6 },
  { position: [4.3, 0.6], scale: 0.26, rotation: 2.0 },
];

function Rocks() {
  return (
    <>
      {ROCK_PLACEMENTS.map((r, i) => (
        <mesh
          key={i}
          position={[r.position[0], r.scale * 0.4, r.position[1]]}
          rotation={[0.2, r.rotation, 0.1]}
          scale={r.scale}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#9a9186" roughness={0.9} />
        </mesh>
      ))}
    </>
  );
}

const DANDELION_PLACEMENTS = [
  { position: [-6.2, 2.4] },
  { position: [5.8, -2.8] },
  { position: [-3.0, 6.4] },
  { position: [4.6, 5.6] },
];

function Dandelion({ position }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.008, 0.012, 0.36, 5]} />
        <meshStandardMaterial color="#6a8f4a" />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial color="#fdfdf5" transparent opacity={0.85} roughness={1} />
      </mesh>
    </group>
  );
}

function Dandelions() {
  return (
    <>
      {DANDELION_PLACEMENTS.map((d, i) => (
        <Dandelion key={i} {...d} />
      ))}
    </>
  );
}

function DriftingSeed({ radius, speed, phase }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.getElapsedTime() * speed + phase) % 6;
    const cycle = t / 6;
    ref.current.position.set(
      Math.sin(phase * 3) * radius + Math.sin(t * 0.8) * 0.4,
      0.3 + cycle * 2.2,
      Math.cos(phase * 3) * radius + Math.cos(t * 0.6) * 0.4
    );
    ref.current.material.opacity = Math.sin(cycle * Math.PI) * 0.85;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.018, 6, 6]} />
      <meshStandardMaterial color="#ffffff" transparent opacity={0} />
    </mesh>
  );
}

function DriftingSeeds() {
  const seeds = [
    { radius: 2.5, speed: 0.5, phase: 0 },
    { radius: 3.2, speed: 0.4, phase: 1.7 },
    { radius: 1.8, speed: 0.6, phase: 3.4 },
    { radius: 2.9, speed: 0.45, phase: 5.1 },
  ];
  return (
    <>
      {seeds.map((s, i) => (
        <DriftingSeed key={i} {...s} />
      ))}
    </>
  );
}

const BUTTERFLY_PLACEMENTS = [
  { radius: 2.0, speed: 0.35, height: 1.0, phase: 0, color: "#ffb6d9" },
  { radius: 1.5, speed: 0.5, height: 1.3, phase: 2.1, color: "#fff2a8" },
  { radius: 2.6, speed: 0.28, height: 0.85, phase: 4.2, color: "#c9b8ff" },
];

function Butterfly({ radius, speed, height, phase, color }) {
  const group = useRef();
  const wingL = useRef();
  const wingR = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const a = t * speed + phase;
    if (group.current) {
      group.current.position.set(
        Math.cos(a) * radius,
        height + Math.sin(t * 1.4 + phase) * 0.25,
        Math.sin(a) * radius
      );
      group.current.rotation.y = -a + Math.PI / 2;
    }
    const flap = Math.sin(t * 14 + phase) * 0.9;
    if (wingL.current) wingL.current.rotation.y = flap;
    if (wingR.current) wingR.current.rotation.y = -flap;
  });
  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshStandardMaterial color="#4a3a30" />
      </mesh>
      <group ref={wingL} position={[0.015, 0, 0]}>
        <mesh position={[0.06, 0, 0]}>
          <planeGeometry args={[0.13, 0.09]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.92} />
        </mesh>
      </group>
      <group ref={wingR} position={[-0.015, 0, 0]}>
        <mesh position={[-0.06, 0, 0]}>
          <planeGeometry args={[0.13, 0.09]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.92} />
        </mesh>
      </group>
    </group>
  );
}

function Butterflies() {
  return (
    <>
      {BUTTERFLY_PLACEMENTS.map((b, i) => (
        <Butterfly key={i} {...b} />
      ))}
    </>
  );
}

function PoofRing({ position, onDone }) {
  const ref = useRef();
  const startRef = useRef(null);
  const DURATION = 0.5;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (startRef.current === null) startRef.current = clock.getElapsedTime();
    const elapsed = clock.getElapsedTime() - startRef.current;
    if (elapsed > DURATION) {
      onDone();
      return;
    }
    const t = elapsed / DURATION;
    ref.current.scale.setScalar(0.1 + t * 0.5);
    ref.current.material.opacity = (1 - t) * 0.45;
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.03, position[1]]}>
      <ringGeometry args={[0.1, 0.16, 20]} />
      <meshBasicMaterial color="#fff8ef" transparent opacity={0.45} side={THREE.DoubleSide} />
    </mesh>
  );
}

function PoofManager({ poofs, onPoofDone }) {
  return (
    <>
      {poofs.map((p) => (
        <PoofRing key={p.id} position={p.position} onDone={() => onPoofDone(p.id)} />
      ))}
    </>
  );
}

const BUNNY_BASE_YAW = 0;

function IdleBunny({ modelPath, homePosition, onHop, scale = 1 }) {
  const group = useRef();
  const body = useRef();
  const { scene } = useGLTF(modelPath);
  const object = useMemo(() => scene.clone(), [scene]);
  const offset = useGroundedOffset(object);

  const nextHop = useRef(1.5 + Math.random() * 2);
  const nextGlance = useRef(1 + Math.random() * 2);
  const baseYaw = useRef(BUNNY_BASE_YAW);
  const glanceOffset = useRef(0);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();

    if (t > nextHop.current) {
      nextHop.current = t + 2 + Math.random() * 2.5;
      onHop?.(homePosition);
    }

    const timeSincePlan = nextHop.current - t;
    const justHopped = timeSincePlan > 1.7 && timeSincePlan < 2.0;
    const hopProgress = justHopped ? (2 - timeSincePlan) / 0.3 : 0;
    const hopY = justHopped ? Math.abs(Math.sin(hopProgress * Math.PI)) * 0.16 : Math.sin(t * 2.2) * 0.02;

    if (body.current) {
      const squashStretch = justHopped ? 1 + Math.sin(hopProgress * Math.PI) * 0.08 : 1;
      body.current.scale.set(1 / Math.sqrt(squashStretch), squashStretch, 1 / Math.sqrt(squashStretch));
    }

    if (t > nextGlance.current) {
      nextGlance.current = t + 2 + Math.random() * 2.5;
      glanceOffset.current = (Math.random() - 0.5) * 0.35;
    }
    const targetYaw = baseYaw.current + glanceOffset.current;
    let angleDelta = targetYaw - group.current.rotation.y;
    while (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
    while (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
    group.current.rotation.y += angleDelta * 0.05;
    group.current.position.y = offset[1] + hopY;
  });

  return (
    <group ref={group} position={[homePosition[0], 0, homePosition[1]]} rotation={[0, BUNNY_BASE_YAW, 0]}>
      <group ref={body}>
        <primitive object={object} scale={scale} position={[offset[0], 0, offset[2]]} />
      </group>
    </group>
  );
}

class BunnyErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return <IdleBunny modelPath={DEFAULT_MODEL} homePosition={this.props.position} />;
    }
    return this.props.children;
  }
}

const BUNNY_HOME_POSITION = [0, 0.3];

const BUNNY_SCALE = 0.55;

const ISO_DISTANCE = 7.8;
const ISO_ELEVATION = Math.atan(1 / Math.sqrt(2)) + 0.08;
const ISO_YAW = 0;
const ISO_ZOOM = 74;
const ISO_POSITION = [
  ISO_DISTANCE * Math.cos(ISO_ELEVATION) * Math.sin(ISO_YAW),
  ISO_DISTANCE * Math.sin(ISO_ELEVATION),
  ISO_DISTANCE * Math.cos(ISO_ELEVATION) * Math.cos(ISO_YAW),
];

const BunnyHabitat3D = ({ characterModel }) => {
  const [poofs, setPoofs] = useState([]);

  const addPoof = (position) => {
    setPoofs((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, position }]);
  };
  const removePoof = (id) => {
    setPoofs((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="habitat-canvas-wrap">
      <Canvas
        shadows
        orthographic
        camera={{ position: ISO_POSITION, zoom: ISO_ZOOM, near: 0.1, far: 200 }}
        gl={{ toneMappingExposure: 1.25 }}
      >
        <color attach="background" args={["#fbe9b8"]} />
        <fog attach="fog" args={["#fbe9b8", 60, 150]} />

        <OrbitControls
          target={[0, 0.4, 0]}
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          rotateSpeed={0.5}
          minPolarAngle={0.55}
          maxPolarAngle={1.05}
          minZoom={ISO_ZOOM}
          maxZoom={230}
        />

        <ambientLight intensity={0.85} />
        <directionalLight
          position={[5, 8, 3]}
          intensity={2.3}
          color="#fff7da"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-7}
          shadow-camera-right={7}
          shadow-camera-top={7}
          shadow-camera-bottom={-7}
        />
        <directionalLight position={[-5, 3, -4]} intensity={0.35} color="#ffd9ec" />
        <hemisphereLight args={["#fff2cf", "#5c6b3f", 1.1]} />

        <React.Suspense fallback={null}>
          <Ground />
          <Dandelions />
          <DriftingSeeds />
          <Butterflies />
          <PoofManager poofs={poofs} onPoofDone={removePoof} />

          <DirtPen />
          <Fence />
          <Bunting />
          <HayBale />
          <Hutch />
          <ChimneySmoke />
          <Signpost />

          <CarrotPatchErrorBoundary>
            <React.Suspense fallback={null}>
              <CarrotPatch />
            </React.Suspense>
          </CarrotPatchErrorBoundary>

          <Rocks />
          <Flowers />
          <Mushrooms />

          <BunnyErrorBoundary position={BUNNY_HOME_POSITION}>
            <IdleBunny modelPath={characterModel} homePosition={BUNNY_HOME_POSITION} onHop={addPoof} scale={BUNNY_SCALE} />
          </BunnyErrorBoundary>
        </React.Suspense>
      </Canvas>
    </div>
  );
};

export default BunnyHabitat3D;
