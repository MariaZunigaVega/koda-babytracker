//rough draft
import React, { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { DEFAULT_MODEL } from "../../constants/avatars";

function useGroundedOffset(object) {
  const [offset, setOffset] = useState([0, 0, 0]);
  useEffect(() => {
    if (!object) return;
    const box = new THREE.Box3().setFromObject(object);
    setOffset([
      -(box.min.x + box.max.x) / 2,
      -box.min.y,
      -(box.min.z + box.max.z) / 2,
    ]);
    object.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
  }, [object]);
  return offset;
}

const GRASS_PX = 32;
function buildMeadowTexture() {
  const canvas = document.createElement("canvas");
  const GRID = 8;
  canvas.width = GRASS_PX * GRID;
  canvas.height = GRASS_PX * GRID;
  const ctx = canvas.getContext("2d");

  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const x = col * GRASS_PX;
      const y = row * GRASS_PX;

      const hue = 96 + ((row * GRID + col) % 7) * 2;
      const light = 52 + ((row + col * 3) % 5) * 2;
      ctx.fillStyle = `hsl(${hue}, 46%, ${light}%)`;
      ctx.fillRect(x, y, GRASS_PX, GRASS_PX);

      ctx.fillStyle = `hsl(${hue + 8}, 50%, ${light + 8}%)`;
      const rng = (row * GRID + col + 1) * 13;
      for (let i = 0; i < 3; i++) {
        const bx = x + ((rng * (i + 1) * 7) % (GRASS_PX - 6)) + 3;
        const by = y + ((rng * (i + 1) * 11) % (GRASS_PX - 8)) + 4;
        ctx.fillRect(bx, by, 1.5, 4);
        ctx.fillRect(bx + 2, by + 1.5, 1.5, 3);
      }

      // occasional little clover/daisy fleck
      if ((rng * 3) % 11 === 0) {
        ctx.fillStyle = "#fffdf2";
        const fx = x + GRASS_PX / 2;
        const fy = y + GRASS_PX / 2;
        for (let p = 0; p < 4; p++) {
          const ang = (Math.PI / 2) * p;
          ctx.beginPath();
          ctx.arc(fx + Math.cos(ang) * 2.4, fy + Math.sin(ang) * 2.4, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#f6d34a";
        ctx.beginPath();
        ctx.arc(fx, fy, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
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
  grad.addColorStop(0, "rgba(176,138,92,0.95)");
  grad.addColorStop(0.6, "rgba(176,138,92,0.75)");
  grad.addColorStop(1, "rgba(176,138,92,0.35)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = "rgba(130,98,64,0.3)";
  for (let i = 0; i < 30; i++) {
    const a = (i * 137) % 360 * (Math.PI / 180);
    const r = (i * 13) % 60;
    ctx.beginPath();
    ctx.ellipse(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 2.5, 1.5, a, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(214,187,150,0.35)";
  for (let i = 0; i < 18; i++) {
    const a = (i * 91) % 360 * (Math.PI / 180);
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

function buildMudFadeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 62);
  grad.addColorStop(0, "rgba(176,138,92,0.85)");
  grad.addColorStop(0.45, "rgba(176,138,92,0.55)");
  grad.addColorStop(0.8, "rgba(176,138,92,0.18)");
  grad.addColorStop(1, "rgba(176,138,92,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(64, 64, 62, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(130,98,64,0.22)";
  for (let i = 0; i < 20; i++) {
    const a = ((i * 137) % 360) * (Math.PI / 180);
    const r = (i * 15) % 48;
    ctx.beginPath();
    ctx.ellipse(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 2, 1.3, a, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function MudFadePatch({ position = [0, PEN_DEPTH / 2 + 0.7], radius = 1.9 }) {
  const tex = useMemo(() => buildMudFadeTexture(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.013, position[1]]}>
      <circleGeometry args={[radius, 40]} />
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

  addEdge(-halfW, -halfD, halfW, -halfD, 0); // back
  addEdge(-halfW, halfD, halfW, halfD, 0); // front (has gate gap)
  addEdge(-halfW, -halfD, -halfW, halfD, Math.PI / 2); // left
  addEdge(halfW, -halfD, halfW, halfD, Math.PI / 2); // right

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
    const x = Math.random() * 64;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (Math.random() - 0.5) * 6, 64);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function HayBale({ position = [-1.7, 0, -1.0], rotation = 0.15 }) {
  const tex = useMemo(() => buildHayTexture(), []);
  return (
    <group position={[position[0], 0, position[2] ?? position[1]]} rotation={[0, rotation, 0]}>
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
    </group>
  );
}

function Hutch({ position = [1.9, 0, -1.1], rotation = -0.3 }) {
  return (
    <group position={[position[0], 0, position[2] ?? position[1]]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.56, 0.8]} />
        <meshStandardMaterial color="#c8935f" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.34, 0.401]} castShadow>
        <planeGeometry args={[0.36, 0.4]} />
        <meshStandardMaterial color="#3d2b20" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.78, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.75, 0.5, 4]} />
        <meshStandardMaterial color="#a9714a" roughness={0.85} />
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
  grad.addColorStop(0, "rgba(140,100,62,0.95)");
  grad.addColorStop(0.6, "rgba(140,100,62,0.7)");
  grad.addColorStop(1, "rgba(140,100,62,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const CARROT_ROW_Z = PEN_DEPTH / 2 + 0.85;
const CARROT_PLACEMENTS = [
  { x: -2.15, z: CARROT_ROW_Z, rotation: 0.2 },
  { x: -1.1, z: CARROT_ROW_Z + 0.55, rotation: 1.4 },
  { x: -0.35, z: CARROT_ROW_Z - 0.2, rotation: 2.6 },
  { x: -1.65, z: CARROT_ROW_Z + 1.15, rotation: 0.6 },
  { x: -0.75, z: CARROT_ROW_Z + 1.5, rotation: 3.1 },
];

function Carrot({ x, z, rotation, sourceScene }) {
  const object = useMemo(() => sourceScene.clone(), [sourceScene]);
  const offset = useGroundedOffset(object);
  const scale = 0.6;
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      <primitive object={object} scale={scale} position={[offset[0], offset[1], offset[2]]} />
    </group>
  );
}

function CarrotPatch() {
  const { scene } = useGLTF("/models/habitats/carrot.glb");
  const tex = useMemo(() => buildMoundTexture(), []);
  return (
    <>
      {CARROT_PLACEMENTS.map((c, i) => (
        <mesh
          key={`mound-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[c.x, 0.016, c.z]}
        >
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

const FLOWER_COLORS = ["#ffd9e8", "#fff3b0", "#ffffff", "#ffc2d9"];
const FLOWER_PLACEMENTS = [
  { position: [-3.6, -3.2], color: 0 },
  { position: [3.4, -2.6], color: 1 },
  { position: [-3.8, 2.4], color: 2 },
  { position: [3.9, 2.9], color: 3 },
  { position: [-2.6, 3.9], color: 0 },
  { position: [2.4, -4.0], color: 2 },
];

function Flowers() {
  return (
    <>
      {FLOWER_PLACEMENTS.map((f, i) => (
        <group key={i} position={[f.position[0], 0, f.position[1]]}>
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.24, 5]} />
            <meshStandardMaterial color="#4a7a3f" />
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

const BUNNY_BASE_YAW = 0;

function IdleBunny({ modelPath, homePosition, scale = 1 }) {
  const group = useRef();
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
    }

    const timeSincePlan = nextHop.current - t;
    const justHopped = timeSincePlan > 1.7 && timeSincePlan < 2.0;
    const hopY = justHopped
      ? Math.abs(Math.sin((2 - timeSincePlan) * 14)) * 0.14
      : Math.sin(t * 2.2) * 0.02;

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
      <primitive object={object} scale={scale} position={[offset[0], 0, offset[2]]} />
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

// Environment (fence, pen, props) was tuned around a bunny scale of 1.55.
// Now that the bunny is scale 1 (1/1.55 the size), the whole environment
// group is scaled down by the same factor so proportions match, and zoom
// is boosted to compensate so the framing looks the same as before.
const ENV_SCALE = 1 / 1.55;

const ISO_DISTANCE = 7.8;
const ISO_ELEVATION = Math.atan(1 / Math.sqrt(2)) + 0.08;
const ISO_YAW = 0;
const ISO_ZOOM = 167;
const ISO_POSITION = [
  ISO_DISTANCE * Math.cos(ISO_ELEVATION) * Math.sin(ISO_YAW),
  ISO_DISTANCE * Math.sin(ISO_ELEVATION),
  ISO_DISTANCE * Math.cos(ISO_ELEVATION) * Math.cos(ISO_YAW),
];

const BunnyHabitat3D = ({ characterModel }) => {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Canvas
        shadows
        orthographic
        camera={{ position: ISO_POSITION, zoom: ISO_ZOOM, near: 0.1, far: 200 }}
        gl={{ toneMappingExposure: 1.25 }}
      >
        <color attach="background" args={["#a8e0a0"]} />
        <fog attach="fog" args={["#a8e0a0", 60, 150]} />

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
        <directionalLight position={[-5, 3, -4]} intensity={0.4} color="#a8e0ea" />
        <hemisphereLight args={["#f0ffe6", "#4a6b47", 1.1]} />

        <React.Suspense fallback={null}>
          <Ground />

          <group scale={ENV_SCALE}>
            <DirtPen />
            <MudFadePatch />
            <Fence />
            <HayBale />
            <Hutch />

            <CarrotPatchErrorBoundary>
              <React.Suspense fallback={null}>
                <CarrotPatch />
              </React.Suspense>
            </CarrotPatchErrorBoundary>

            <Rocks />
            <Flowers />
          </group>

          <BunnyErrorBoundary position={BUNNY_HOME_POSITION}>
            <IdleBunny modelPath={characterModel} homePosition={BUNNY_HOME_POSITION} scale={1} />
          </BunnyErrorBoundary>
        </React.Suspense>
      </Canvas>
    </div>
  );
};

export default BunnyHabitat3D;