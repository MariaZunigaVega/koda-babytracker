import React, { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const FOX_HEIGHT = 0.3;
const FOX_POSITION = [0.02, 0.72];
const FOX_MODEL = "/models/characters/fox.glb";
const TREES_MODEL = "/models/habitats/trees.glb";

const PALETTE = {
  background: "#e6a86a",
  fog: "#eab97f",
  sun: "#fff5e0",
  rim: "#ffcf94",
  hemiSky: "#ffeccb",
  hemiGround: "#6b3f28",
  groundBase: "hsl(30, 42%, 52%)",
  log: "#8a5a3b",
  logDark: "#6d452c",
  stone: "#a9998a",
  moss: "#8aa860",
  leaf: ["#f0913f", "#e2653a", "#f6c65a", "#c9542f"],
};

function seededRand(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function drawWrapped(ctx, x, y, size, radius, draw) {
  for (const ox of [-size, 0, size]) {
    for (const oy of [-size, 0, size]) {
      const px = x + ox;
      const py = y + oy;
      if (px < -radius || px > size + radius) continue;
      if (py < -radius || py > size + radius) continue;
      draw(px, py);
    }
  }
}

const TEX = 512;

function buildLeafLitterTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = TEX;
  canvas.height = TEX;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = PALETTE.groundBase;
  ctx.fillRect(0, 0, TEX, TEX);

  for (let i = 0; i < 42; i++) {
    const seed = i * 61 + 3;
    const bx = (seed * 37) % TEX;
    const by = (seed * 53) % TEX;
    const radius = 46 + (seed % 5) * 22;
    const hue = 24 + (seed % 8) * 4;
    const light = 44 + (seed % 6) * 6;
    drawWrapped(ctx, bx, by, TEX, radius, (x, y) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, `hsla(${hue}, 52%, ${light}%, 0.5)`);
      g.addColorStop(1, `hsla(${hue}, 52%, ${light}%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  for (let i = 0; i < 320; i++) {
    const seed = i * 17 + 9;
    const bx = (seed * 31) % TEX;
    const by = (seed * 47) % TEX;
    const hue = 18 + (seed % 8) * 5;
    const light = 46 + (seed % 6) * 6;
    ctx.fillStyle = `hsla(${hue}, 62%, ${light}%, 0.7)`;
    drawWrapped(ctx, bx, by, TEX, 9, (x, y) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((seed % 12) * 0.26);
      ctx.beginPath();
      ctx.ellipse(0, 0, 6.5, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  for (let i = 0; i < 90; i++) {
    const seed = i * 71 + 5;
    const bx = (seed * 17) % TEX;
    const by = (seed * 41) % TEX;
    drawWrapped(ctx, bx, by, TEX, 8, (x, y) => {
      ctx.strokeStyle = i % 3 === 0 ? "rgba(120,150,80,0.55)" : "rgba(96,64,42,0.5)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 6 - (seed % 12), y + 4 - (seed % 8));
      ctx.stroke();
    });
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const GROUND_SIZE = 9;

function Ground() {
  const tex = useMemo(() => buildLeafLitterTexture(), []);
  useEffect(() => {
    tex.repeat.set(GROUND_SIZE / 2.4, GROUND_SIZE / 2.4);
  }, [tex]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
      <meshStandardMaterial map={tex} />
    </mesh>
  );
}

function useNormalizedModel(url, size, axis) {
  const gltf = useGLTF(url);
  return useMemo(() => {
    const clone = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const dim = box.getSize(new THREE.Vector3());
    const source = axis === "x" ? Math.max(dim.x, dim.z) : dim.y;
    const scale = size / (source || 1);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.set(-center.x, -box.min.y, -center.z);
    clone.scale.setScalar(scale);
    clone.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    const wrapper = new THREE.Group();
    wrapper.add(clone);
    return wrapper;
  }, [gltf.scene, size, axis]);
}

function Prop({ url, size, axis = "y", position, rotation = 0, tilt = 0 }) {
  const base = useNormalizedModel(url, size, axis);
  const instance = useMemo(() => base.clone(true), [base]);
  return (
    <group position={position} rotation={[tilt, rotation, 0]}>
      <primitive object={instance} />
    </group>
  );
}

const TREE_CLUSTERS = [
  { position: [-1.6, 0, -1.45], size: 2.0, rotation: 0.5 },
  { position: [1.55, 0, -1.6], size: 2.3, rotation: 2.4 },
  { position: [0.0, 0, -2.1], size: 2.6, rotation: 1.1 },
  { position: [-2.5, 0, -0.6], size: 1.7, rotation: 3.1 },
  { position: [2.5, 0, -0.4], size: 1.8, rotation: 1.0 },
];

function HollowLog() {
  return (
    <group position={[-0.92, 0.13, -0.2]} rotation={[0, 0.42, 0.03]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.14, 0.16, 0.86, 14, 1, true]} />
        <meshStandardMaterial color={PALETTE.log} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.43, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <ringGeometry args={[0.1, 0.14, 18]} />
        <meshStandardMaterial color={PALETTE.logDark} roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.42, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.1, 18]} />
        <meshBasicMaterial color="#2b1a11" />
      </mesh>
      <mesh position={[-0.06, 0.13, 0]} scale={[0.3, 0.05, 0.13]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color={PALETTE.moss} roughness={1} />
      </mesh>
      <mesh position={[0.2, 0.12, 0.06]} scale={[0.1, 0.04, 0.08]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#6f8f4c" roughness={1} />
      </mesh>
    </group>
  );
}

function Mushroom({ position, scale = 1, cap = "#e0603c" }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.035, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.02, 0.07, 8]} />
        <meshStandardMaterial color="#f6e7cf" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.075, 0]} castShadow>
        <sphereGeometry args={[0.042, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={cap} roughness={0.6} />
      </mesh>
    </group>
  );
}

const MUSHROOMS = [
  { position: [0.72, 0, 0.3], scale: 1.1 },
  { position: [0.84, 0, 0.44], scale: 0.8, cap: "#efa64c" },
  { position: [-0.42, 0, 1.12], scale: 1.0, cap: "#d8843c" },
  { position: [-1.35, 0, 0.62], scale: 0.9 },
  { position: [1.25, 0, 0.85], scale: 1.2, cap: "#c9502f" },
];

function Fern({ position, rotation, scale = 1 }) {
  const ref = useRef(null);
  const phase = useMemo(() => Math.random() * 8, []);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.9 + phase) * 0.05;
  });
  return (
    <group ref={ref} position={position} rotation={[0, rotation, 0]} scale={scale}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.05, 0.09, Math.sin(a) * 0.05]} rotation={[0.7, a, 0]} castShadow>
            <coneGeometry args={[0.035, 0.22, 3]} />
            <meshStandardMaterial color={i % 2 ? "#7d9c4e" : "#94b45c"} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
}

const FERNS = (() => {
  const out = [];
  for (let i = 0; i < 14; i++) {
    const seed = i * 23 + 5;
    const x = (seededRand(seed) - 0.5) * 3.2;
    const z = -0.5 + (seededRand(seed * 1.7) - 0.5) * 2.6;
    if (Math.hypot(x - FOX_POSITION[0], z - FOX_POSITION[1]) < 0.45) continue;
    out.push({ position: [x, 0, z], rotation: seededRand(seed * 2.3) * Math.PI, scale: 0.8 + seededRand(seed * 3.1) * 0.6 });
  }
  return out;
})();

const STONES = [
  { position: [1.15, 0.07, 0.15], scale: 0.15, rotation: 0.7 },
  { position: [-1.5, 0.06, 1.0], scale: 0.12, rotation: 2.2 },
  { position: [0.45, 0.05, 1.45], scale: 0.11, rotation: 1.3 },
];

function Stones() {
  return (
    <>
      {STONES.map((s, i) => (
        <group key={i} position={s.position} rotation={[0.1, s.rotation, 0.07]} scale={s.scale}>
          <mesh castShadow receiveShadow>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={PALETTE.stone} roughness={0.9} />
          </mesh>
          <mesh position={[0.03, 0.5, -0.04]} scale={[0.72, 0.2, 0.68]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color={PALETTE.moss} roughness={1} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function FallingLeaf({ radius, speed, phase, color, height }) {
  const ref = useRef(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed + phase;
    const fall = (t % 1);
    ref.current.position.set(
      Math.cos(t * 2.1) * radius,
      height * (1 - fall) + 0.05,
      Math.sin(t * 1.3) * radius * 0.7 - 0.2,
    );
    ref.current.rotation.set(t * 2, t * 1.4, t);
    ref.current.material.opacity = 0.35 + Math.sin(fall * Math.PI) * 0.6;
  });
  return (
    <mesh ref={ref} scale={[1.9, 1, 1]}>
      <circleGeometry args={[0.026, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
    </mesh>
  );
}

function DriftingLeaves() {
  const leaves = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        radius: 0.5 + seededRand(i * 3.3) * 1.4,
        speed: 0.16 + seededRand(i * 5.5) * 0.14,
        phase: seededRand(i * 7.7) * 8,
        height: 1.0 + seededRand(i * 9.1) * 0.7,
        color: PALETTE.leaf[i % PALETTE.leaf.length],
      })),
    [],
  );
  return (
    <>
      {leaves.map((l, i) => (
        <FallingLeaf key={i} {...l} />
      ))}
    </>
  );
}

function Fox({ position = FOX_POSITION }) {
  const group = useRef(null);
  const body = useRef(null);
  const nextGlance = useRef(1 + Math.random() * 2);
  const glance = useRef(0);
  const model = useNormalizedModel(FOX_MODEL, FOX_HEIGHT, "y");

  useLayoutEffect(() => {
    if (group.current) group.current.rotation.y = 0;
  }, [model]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    if (t > nextGlance.current) {
      nextGlance.current = t + 2 + Math.random() * 2.5;
      glance.current = (Math.random() - 0.5) * 0.4;
    }
    group.current.rotation.y += (glance.current - group.current.rotation.y) * 0.04;
    group.current.position.y = Math.sin(t * 1.25) * 0.011;
    if (body.current) {
      const breathe = 1 + Math.sin(t * 2.0) * 0.015;
      body.current.scale.set(1 / Math.sqrt(breathe), breathe, 1 / Math.sqrt(breathe));
    }
  });

  return (
    <group ref={group} position={[position[0], 0, position[1]]}>
      <group ref={body}>
        <primitive object={model} />
      </group>
    </group>
  );
}

class FoxErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error("Fox model failed to load:", error);
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

const ISO_DISTANCE = 4.4;
const ISO_ELEVATION = Math.atan(1 / Math.sqrt(2)) - 0.05;
const ISO_ZOOM = 320;
const ISO_POSITION = [
  0,
  ISO_DISTANCE * Math.sin(ISO_ELEVATION),
  ISO_DISTANCE * Math.cos(ISO_ELEVATION),
];

export function FoxHabitat3D() {
  useEffect(() => {
    useGLTF.preload(FOX_MODEL);
    useGLTF.preload(TREES_MODEL);
  }, []);

  return (
    <Canvas
      shadows
      orthographic
      camera={{ position: ISO_POSITION, zoom: ISO_ZOOM, near: 0.1, far: 60 }}
      gl={{ toneMappingExposure: 1.12 }}
      dpr={[1, 2]}
    >
      <color attach="background" args={[PALETTE.background]} />
      <fog attach="fog" args={[PALETTE.fog, 5, 13]} />

      <ambientLight intensity={1.0} />
      <directionalLight
        position={[5, 8, 3]}
        intensity={1.55}
        color={PALETTE.sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <directionalLight position={[-5, 3, -4]} intensity={0.35} color={PALETTE.rim} />
      <hemisphereLight args={[PALETTE.hemiSky, PALETTE.hemiGround, 1.0]} />

      <Suspense fallback={null}>
        <group position={[0, -0.18, 0]}>
          <Ground />
          {TREE_CLUSTERS.map((t, i) => (
            <Prop key={`t${i}`} url={TREES_MODEL} {...t} />
          ))}
          <HollowLog />
          {MUSHROOMS.map((m, i) => (
            <Mushroom key={`m${i}`} {...m} />
          ))}
          {FERNS.map((f, i) => (
            <Fern key={`f${i}`} {...f} />
          ))}
          <Stones />
          <DriftingLeaves />
          <FoxErrorBoundary position={FOX_POSITION}>
            <Fox position={FOX_POSITION} />
          </FoxErrorBoundary>
        </group>
      </Suspense>
    </Canvas>
  );
}

export default FoxHabitat3D;
