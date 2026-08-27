// Panda Habitat **ROUGH draft**
// what needs to be done/is being worked on: 
//1. fix the entire habitat, looks a mess 2. have a better color scheme for the grass maybe?, 
// 3. sizing of the bambo is off, 4.sizing of the Panda is off

import React, { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import "../../styling/habitats.css";
import { DEFAULT_MODEL } from "../../constants/avatars";
import { useGroundedOffset, seededRand, drawWrapped } from "./habitatUtils";

const FLOOR_TEX_SIZE = 512;
function buildMossFloorTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = FLOOR_TEX_SIZE;
  canvas.height = FLOOR_TEX_SIZE;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "hsl(150, 28%, 30%)";
  ctx.fillRect(0, 0, FLOOR_TEX_SIZE, FLOOR_TEX_SIZE);

  for (let i = 0; i < 46; i++) {
    const seed = i * 61 + 3;
    const bx = (seed * 37) % FLOOR_TEX_SIZE;
    const by = (seed * 53) % FLOOR_TEX_SIZE;
    const radius = 42 + (seed % 5) * 20;
    const hue = 142 + (seed % 9) * 3;
    const light = 26 + (seed % 6) * 3;
    drawWrapped(ctx, bx, by, FLOOR_TEX_SIZE, radius, (x, y) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, `hsla(${hue}, 34%, ${light}%, 0.5)`);
      grad.addColorStop(1, `hsla(${hue}, 34%, ${light}%, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  for (let i = 0; i < 260; i++) {
    const seed = i * 17 + 9;
    const bx = (seed * 31) % FLOOR_TEX_SIZE;
    const by = (seed * 47) % FLOOR_TEX_SIZE;
    const hue = 92 + (seed % 10) * 2;
    const light = 46 + (seed % 8) * 3;
    ctx.fillStyle = `hsla(${hue}, 34%, ${light}%, 0.55)`;
    drawWrapped(ctx, bx, by, FLOOR_TEX_SIZE, 6, (x, y) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((seed % 12) * 0.26);
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.1, 5.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  for (let i = 0; i < 34; i++) {
    const seed = i * 71 + 5;
    const dx = (seed * 17) % FLOOR_TEX_SIZE;
    const dy = (seed * 41) % FLOOR_TEX_SIZE;
    drawWrapped(ctx, dx, dy, FLOOR_TEX_SIZE, 4, (x, y) => {
      ctx.fillStyle = "rgba(225,245,235,0.5)";
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

function Ground({ size = 30 }) {
  const tex = useMemo(() => buildMossFloorTexture(), []);
  useEffect(() => {
    tex.repeat.set(size / 2.6, size / 2.6);
  }, [tex, size]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={tex} />
    </mesh>
  );
}

function buildBambooTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#6fae5a";
  ctx.fillRect(0, 0, 32, 256);
  ctx.fillStyle = "rgba(70,120,55,0.6)";
  for (let y = 0; y < 256; y += 34) {
    ctx.fillRect(0, y, 32, 5);
  }
  ctx.fillStyle = "rgba(210,235,190,0.35)";
  ctx.fillRect(6, 0, 3, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function BambooLeaf({ position, rotation, scale }) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} castShadow>
      <coneGeometry args={[0.05, 0.34, 3]} />
      <meshStandardMaterial color="#7fc25f" roughness={0.7} side={THREE.DoubleSide} />
    </mesh>
  );
}

function BambooStalk({ position, height, tilt = 0, leafCount = 4 }) {
  const tex = useMemo(() => buildBambooTexture(), []);
  const ref = useRef();
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.z = tilt + Math.sin(clock.getElapsedTime() * 0.5 + phase) * 0.025;
  });
  const leaves = useMemo(
    () =>
      Array.from({ length: leafCount }).map((_, i) => {
        const a = (i / leafCount) * Math.PI * 2 + phase;
        const h = height * (0.78 + (i % 3) * 0.06);
        return {
          position: [Math.cos(a) * 0.1, h, Math.sin(a) * 0.1],
          rotation: [0.9, a, 0],
          scale: 0.9 + (i % 2) * 0.2,
        };
      }),
    [leafCount, height, phase]
  );
  return (
    <group position={position} ref={ref}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.055, 0.07, height, 8]} />
        <meshStandardMaterial map={tex} roughness={0.75} />
      </mesh>
      {leaves.map((l, i) => (
        <BambooLeaf key={i} {...l} />
      ))}
    </group>
  );
}

function generateBambooGrove() {
  const placements = [];
  const rings = [
    { count: 10, rMin: 4.2, rMax: 5.8, hMin: 3.0, hMax: 4.2 },
    { count: 16, rMin: 6.2, rMax: 8.6, hMin: 3.8, hMax: 5.2 },
    { count: 18, rMin: 9.0, rMax: 12.0, hMin: 4.4, hMax: 6.0 },
  ];
  rings.forEach(({ count, rMin, rMax, hMin, hMax }, ringIdx) => {
    for (let i = 0; i < count; i++) {
      const seed = ringIdx * 97 + i * 13;
      const angle = (i / count) * Math.PI * 2 + (seededRand(seed) - 0.5) * 0.35;
      const radius = rMin + seededRand(seed * 1.7) * (rMax - rMin);
      placements.push({
        position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
        height: hMin + seededRand(seed * 2.3) * (hMax - hMin),
        tilt: (seededRand(seed * 3.1) - 0.5) * 0.12,
        leafCount: 3 + Math.floor(seededRand(seed * 4.5) * 3),
      });
    }
  });
  return placements;
}
const BAMBOO_PLACEMENTS = generateBambooGrove();

function BambooGrove() {
  return (
    <>
      {BAMBOO_PLACEMENTS.map((b, i) => (
        <BambooStalk key={i} {...b} />
      ))}
    </>
  );
}

function buildMoundTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  grad.addColorStop(0, "rgba(70,110,72,0.9)");
  grad.addColorStop(0.6, "rgba(70,110,72,0.6)");
  grad.addColorStop(1, "rgba(70,110,72,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function BambooShoot({ x, z, rotation, height }) {
  const tex = useMemo(() => buildBambooTexture(), []);
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0.06]}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, height, 8]} />
        <meshStandardMaterial map={tex} roughness={0.75} />
      </mesh>
      <mesh position={[0, height, 0]}>
        <circleGeometry args={[0.045, 8]} />
        <meshStandardMaterial color="#d8ecc8" roughness={0.6} />
      </mesh>
    </group>
  );
}

const SHOOT_PLACEMENTS = [
  { x: 1.1, z: 0.5, rotation: 0.3, height: 0.55 },
  { x: 1.35, z: 0.2, rotation: 1.4, height: 0.42 },
  { x: 0.95, z: 0.15, rotation: 2.5, height: 0.65 },
  { x: 1.5, z: 0.65, rotation: 0.8, height: 0.38 },
];

function BambooShootPatch() {
  const tex = useMemo(() => buildMoundTexture(), []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.2, 0.014, 0.35]}>
        <circleGeometry args={[0.75, 24]} />
        <meshStandardMaterial map={tex} transparent depthWrite={false} roughness={1} />
      </mesh>
      {SHOOT_PLACEMENTS.map((s, i) => (
        <BambooShoot key={i} {...s} />
      ))}
    </>
  );
}

const ROCK_PLACEMENTS = [
  { position: [-1.6, 0.16, 0.9], scale: 0.32, rotation: 0.5 },
  { position: [-1.9, 0.12, 0.5], scale: 0.24, rotation: 1.8 },
  { position: [1.9, 0.14, -1.1], scale: 0.28, rotation: 2.6 },
];

function Rocks() {
  return (
    <>
      {ROCK_PLACEMENTS.map((r, i) => (
        <mesh
          key={i}
          position={r.position}
          rotation={[0.15, r.rotation, 0.1]}
          scale={r.scale}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#8a978f" roughness={0.9} />
        </mesh>
      ))}
    </>
  );
}

function MistWisp({ radius, speed, height, phase, scale }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed + phase;
    ref.current.position.set(Math.cos(t) * radius, height, Math.sin(t) * radius);
    ref.current.material.opacity = 0.16 + Math.sin(t * 1.3) * 0.05;
  });
  return (
    <mesh ref={ref} scale={scale}>
      <sphereGeometry args={[0.6, 12, 12]} />
      <meshBasicMaterial color="#eaf7f0" transparent opacity={0.18} depthWrite={false} />
    </mesh>
  );
}

function MistWisps() {
  const wisps = [
    { radius: 2.6, speed: 0.06, height: 0.5, phase: 0, scale: 1 },
    { radius: 3.4, speed: 0.05, height: 0.9, phase: 2.1, scale: 1.4 },
    { radius: 2.1, speed: 0.07, height: 0.3, phase: 4.2, scale: 0.8 },
  ];
  return (
    <>
      {wisps.map((w, i) => (
        <MistWisp key={i} {...w} />
      ))}
    </>
  );
}

const PETAL_COLORS = ["#ffc9dd", "#ffdcea", "#fff0f5"];

function Petal({ radius, speed, phase, colorIndex }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.getElapsedTime() * speed + phase) % 8;
    const cycle = t / 8;
    ref.current.position.set(
      Math.sin(t * 0.8 + phase) * radius,
      2.6 - cycle * 2.6,
      Math.cos(t * 0.6 + phase) * radius
    );
    ref.current.rotation.z = Math.sin(t * 2) * 0.8;
    ref.current.rotation.x = Math.cos(t * 1.6) * 0.6;
  });
  return (
    <mesh ref={ref}>
      <circleGeometry args={[0.05, 5]} />
      <meshStandardMaterial
        color={PETAL_COLORS[colorIndex % PETAL_COLORS.length]}
        side={THREE.DoubleSide}
        roughness={0.6}
      />
    </mesh>
  );
}

function Petals() {
  const petals = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        radius: 1.2 + seededRand(i * 3.3) * 3.2,
        speed: 0.2 + seededRand(i * 5.5) * 0.18,
        phase: seededRand(i * 7.7) * 8,
        colorIndex: i,
      })),
    []
  );
  return (
    <>
      {petals.map((p, i) => (
        <Petal key={i} {...p} />
      ))}
    </>
  );
}

function LeafPuff({ position, onDone }) {
  const ref = useRef();
  const startRef = useRef(null);
  const DURATION = 0.55;
  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (startRef.current === null) startRef.current = clock.getElapsedTime();
    const elapsed = clock.getElapsedTime() - startRef.current;
    if (elapsed > DURATION) {
      onDone();
      return;
    }
    const t = elapsed / DURATION;
    ref.current.scale.setScalar(0.15 + t * 0.6);
    ref.current.material.opacity = (1 - t) * 0.5;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.03, position[1]]}>
      <ringGeometry args={[0.08, 0.14, 5]} />
      <meshBasicMaterial color="#bdeeb0" transparent opacity={0.5} side={THREE.DoubleSide} />
    </mesh>
  );
}

function LeafPuffManager({ puffs, onDone }) {
  return (
    <>
      {puffs.map((p) => (
        <LeafPuff key={p.id} position={p.position} onDone={() => onDone(p.id)} />
      ))}
    </>
  );
}

const PANDA_SCALE = 4.2;
const PANDA_BASE_YAW = 0.3;

function IdlePanda({ modelPath, homePosition, onMunch, scale = PANDA_SCALE }) {
  const group = useRef();
  const body = useRef();
  const { scene } = useGLTF(modelPath);
  const object = useMemo(() => scene.clone(), [scene]);
  const offset = useGroundedOffset(object);

  const nextMunch = useRef(1.5 + Math.random() * 2);
  const nextGlance = useRef(1 + Math.random() * 2);
  const glanceOffset = useRef(0);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();

    if (t > nextMunch.current) {
      nextMunch.current = t + 2.5 + Math.random() * 2.5;
      onMunch?.(homePosition);
    }

    const timeSinceMunch = nextMunch.current - t;
    const munching = timeSinceMunch > 2.2 && timeSinceMunch < 2.5;
    const munchSquash = munching ? 1 + Math.sin((2.5 - timeSinceMunch) * 20) * 0.05 : 1;
    if (body.current) {
      body.current.scale.set(1 / Math.sqrt(munchSquash), munchSquash, 1 / Math.sqrt(munchSquash));
    }

    if (t > nextGlance.current) {
      nextGlance.current = t + 2 + Math.random() * 2.5;
      glanceOffset.current = (Math.random() - 0.5) * 0.3;
    }
    const targetYaw = PANDA_BASE_YAW + glanceOffset.current;
    let angleDelta = targetYaw - group.current.rotation.y;
    while (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
    while (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
    group.current.rotation.y += angleDelta * 0.04;
    group.current.position.y = Math.sin(t * 1.2) * 0.015;
  });

  return (
    <group ref={group} position={[homePosition[0], 0, homePosition[1]]} rotation={[0, PANDA_BASE_YAW, 0]}>
      <group ref={body} scale={scale}>
        <primitive object={object} position={offset} />
      </group>
    </group>
  );
}

class PandaErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return <IdlePanda modelPath={DEFAULT_MODEL} homePosition={this.props.position} />;
    }
    return this.props.children;
  }
}

const PANDA_HOME_POSITION = [0, 0];

const ISO_DISTANCE = 8.2;
const ISO_ELEVATION = Math.atan(1 / Math.sqrt(2)) + 0.08;
const ISO_YAW = 0;
const ISO_ZOOM = 92;
const ISO_POSITION = [
  ISO_DISTANCE * Math.cos(ISO_ELEVATION) * Math.sin(ISO_YAW),
  ISO_DISTANCE * Math.sin(ISO_ELEVATION),
  ISO_DISTANCE * Math.cos(ISO_ELEVATION) * Math.cos(ISO_YAW),
];

const PandaHabitat3D = ({ characterModel }) => {
  const [puffs, setPuffs] = useState([]);

  const addPuff = (position) => {
    setPuffs((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, position }]);
  };
  const removePuff = (id) => {
    setPuffs((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="habitat-canvas-wrap">
      <Canvas
        shadows
        orthographic
        camera={{ position: ISO_POSITION, zoom: ISO_ZOOM, near: 0.1, far: 60 }}
        gl={{ toneMappingExposure: 1.2 }}
      >
        <color attach="background" args={["#bcdccb"]} />
        <fog attach="fog" args={["#bcdccb", 13, 26]} />

        <OrbitControls
          target={[0, 0.6, 0]}
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          rotateSpeed={0.5}
          minPolarAngle={0.55}
          maxPolarAngle={1.05}
          minZoom={ISO_ZOOM}
          maxZoom={180}
        />

        <ambientLight intensity={1.0} />
        <directionalLight
          position={[5, 8, 3]}
          intensity={1.5}
          color="#eaf7f0"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        <directionalLight position={[-5, 3, -4]} intensity={0.3} color="#b8d9e6" />
        <hemisphereLight args={["#dff3e6", "#2e4a3a", 1.0]} />

        <React.Suspense fallback={null}>
          <Ground />
          <BambooGrove />
          <BambooShootPatch />
          <Rocks />
          <MistWisps />
          <Petals />
          <LeafPuffManager puffs={puffs} onDone={removePuff} />

          <PandaErrorBoundary position={PANDA_HOME_POSITION}>
            <IdlePanda modelPath={characterModel} homePosition={PANDA_HOME_POSITION} onMunch={addPuff} />
          </PandaErrorBoundary>
        </React.Suspense>
      </Canvas>
    </div>
  );
};

export default PandaHabitat3D;
