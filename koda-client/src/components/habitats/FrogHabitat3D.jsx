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
function buildShoreTexture() {
  const canvas = document.createElement("canvas");
  const GRID = 8;
  canvas.width = GRASS_PX * GRID;
  canvas.height = GRASS_PX * GRID;
  const ctx = canvas.getContext("2d");

  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const x = col * GRASS_PX;
      const y = row * GRASS_PX;

      const hue = 102 + ((row * GRID + col) % 7) * 1.5;
      const light = 46 + ((row + col * 3) % 5) * 1.5;
      ctx.fillStyle = `hsl(${hue}, 42%, ${light}%)`;
      ctx.fillRect(x, y, GRASS_PX, GRASS_PX);

      ctx.fillStyle = `hsl(${hue + 6}, 46%, ${light + 8}%)`;
      const rng = (row * GRID + col + 1) * 13;
      for (let i = 0; i < 3; i++) {
        const bx = x + ((rng * (i + 1) * 7) % (GRASS_PX - 6)) + 3;
        const by = y + ((rng * (i + 1) * 11) % (GRASS_PX - 8)) + 4;
        ctx.fillRect(bx, by, 1.5, 4);
        ctx.fillRect(bx + 2, by + 1.5, 1.5, 3);
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
  const tex = useMemo(() => buildShoreTexture(), []);
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

function buildWaterTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
  gradient.addColorStop(0, "#5fd6c4");
  gradient.addColorStop(1, "#2f92b0");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(64, 64, 14 + i * 12, 0, Math.PI * 2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function Pond({ radius = 4.8 }) {
  const tex = useMemo(() => buildWaterTexture(), []);
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.material.opacity = 0.88 + Math.sin(t * 0.6) * 0.03;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
      <circleGeometry args={[radius, 56]} />
      <meshStandardMaterial map={tex} roughness={0.2} metalness={0.15} transparent opacity={0.9} />
    </mesh>
  );
}

function buildMudTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 62);
  grad.addColorStop(0, "rgba(157,120,76,0.95)");
  grad.addColorStop(0.55, "rgba(157,120,76,0.6)");
  grad.addColorStop(0.85, "rgba(157,120,76,0.22)");
  grad.addColorStop(1, "rgba(157,120,76,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(64, 64, 62, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(110,82,50,0.3)";
  for (let i = 0; i < 22; i++) {
    const a = (i * 137) % 360 * (Math.PI / 180);
    const r = (i * 17) % 46;
    ctx.beginPath();
    ctx.ellipse(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 2.5, 1.5, a, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(200,175,140,0.35)";
  for (let i = 0; i < 14; i++) {
    const a = (i * 91) % 360 * (Math.PI / 180);
    const r = (i * 23) % 50;
    ctx.beginPath();
    ctx.arc(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function MudPatch({ position = [0, 5.3], radius = 2.4 }) {
  const tex = useMemo(() => buildMudTexture(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.012, position[1]]}>
      <circleGeometry args={[radius, 40]} />
      <meshStandardMaterial map={tex} transparent roughness={0.95} depthWrite={false} />
    </mesh>
  );
}

const HOME_PAD_POSITION = [0, 2];

const LILYPAD_PLACEMENTS = [
  { size: "small", position: [3.2, 1.45], rotation: 0.4, scale: 1.3 },
  { size: "small", position: [-2.9, 2], rotation: 2.1, scale: 1.15 },
  { size: "large", position: [0.8, -3.2], rotation: 1.0, scale: 1.9 },
  { size: "small", position: [3.5, -1.75], rotation: 3.0, scale: 1.2 },
  { size: "large", position: [-3.7, -1.45], rotation: 0.7, scale: 1.75 },
  { size: "small", position: [-0.5, 3.85], rotation: 1.6, scale: 1.1 },
];

const ROCK_PLACEMENTS = [
  { position: [1.05, 5.0], scale: 0.34, rotation: 0.6 },
  { position: [-0.9, 5.35], scale: 0.24, rotation: 2.0 },
  { position: [3.5, 3.0], scale: 0.28, rotation: 1.1 },
  { position: [-3.45, 2.7], scale: 0.32, rotation: 3.4 },
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

const FLOWER_COLORS = ["#ffd9e8", "#fff3b0", "#ffffff"];
const FLOWER_PLACEMENTS = [
  { position: [1.75, 4.3], color: 0 },
  { position: [-2.25, 3.85], color: 1 },
  { position: [4.15, 1.0], color: 2 },
  { position: [-4.0, -0.65], color: 0 },
  { position: [3.05, -3.05], color: 1 },
  { position: [-1.45, -3.85], color: 2 },
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

function Lilypad({ position, rotation, scale, sourceScene }) {
  const object = useMemo(() => sourceScene.clone(), [sourceScene]);
  const offset = useGroundedOffset(object);
  const ref = useRef();
  const bobPhase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.position.y = 0.02 + Math.sin(t * 0.7 + bobPhase) * 0.018;
  });

  return (
    <group ref={ref} position={[position[0], 0.02, position[1]]} rotation={[0, rotation, 0]}>
      <primitive
        object={object}
        scale={scale}
        position={[offset[0], offset[1], offset[2]]}
      />
    </group>
  );
}

function Lilypads() {
  const { scene: smallScene } = useGLTF("/models/habitats/lilypad.glb");
  const { scene: largeScene } = useGLTF("/models/habitats/largeLilypad.glb");
  return (
    <>
      {LILYPAD_PLACEMENTS.map((p, i) => (
        <Lilypad
          key={i}
          sourceScene={p.size === "large" ? largeScene : smallScene}
          position={p.position}
          rotation={p.rotation}
          scale={p.scale}
        />
      ))}
    </>
  );
}

class LilypadsErrorBoundary extends React.Component {
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

function generateCattailRing(radius = 5.5, count = 18) {
  const placements = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
    const r = radius + Math.random() * 0.7;
    const nearPathGap = Math.abs(((angle + Math.PI / 2) % (Math.PI * 2)) - Math.PI / 2) < 0.35;
    if (nearPathGap) continue;
    placements.push({
      position: [Math.cos(angle) * r, Math.sin(angle) * r],
      rotation: Math.random() * Math.PI * 2,
      scale: 0.8 + Math.random() * 0.5,
    });
  }
  return placements;
}
const CATTAIL_PLACEMENTS = generateCattailRing();

function Cattail({ position, rotation, scale, sourceScene }) {
  const object = useMemo(() => sourceScene.clone(), [sourceScene]);
  const offset = useGroundedOffset(object);
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
      <primitive
        object={object}
        scale={scale}
        position={[offset[0], offset[1], offset[2]]}
      />
    </group>
  );
}

function Cattails() {
  const { scene } = useGLTF("/models/habitats/cattail.glb");
  return (
    <>
      {CATTAIL_PLACEMENTS.map((c, i) => (
        <Cattail key={i} sourceScene={scene} {...c} />
      ))}
    </>
  );
}

class CattailsErrorBoundary extends React.Component {
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

function RippleRing({ position, onDone }) {
  const ref = useRef();
  const startRef = useRef(null);
  const DURATION = 1.1;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (startRef.current === null) startRef.current = clock.getElapsedTime();
    const elapsed = clock.getElapsedTime() - startRef.current;
    if (elapsed > DURATION) {
      onDone();
      return;
    }
    const t = elapsed / DURATION;
    const scale = 0.15 + t * 1.15;
    ref.current.scale.setScalar(scale);
    ref.current.material.opacity = (1 - t) * 0.55;
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.025, position[1]]}>
      <ringGeometry args={[0.55, 0.72, 40]} />
      <meshBasicMaterial color="#eaf7f1" transparent opacity={0.55} side={THREE.DoubleSide} />
    </mesh>
  );
}

function RippleManager({ ripples, onRippleDone }) {
  return (
    <>
      {ripples.map((r) => (
        <RippleRing key={r.id} position={r.position} onDone={() => onRippleDone(r.id)} />
      ))}
    </>
  );
}

function Firefly({ radius, speed, height, phase }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + phase;
    ref.current.position.set(Math.cos(t) * radius, height + Math.sin(t * 2) * 0.15, Math.sin(t) * radius);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.025, 8, 8]} />
      <meshBasicMaterial color="#c8f27a" />
      <pointLight color="#c8f27a" intensity={0.3} distance={0.9} />
    </mesh>
  );
}

const FROG_BASE_YAW = 0;

function IdleCharacter({ modelPath, homePosition, onRipple, scale = 2.1 }) {
  const group = useRef();
  const { scene } = useGLTF(modelPath);
  const object = useMemo(() => scene.clone(), [scene]);
  const offset = useGroundedOffset(object);

  const nextHop = useRef(2 + Math.random() * 2);
  const nextGlance = useRef(1 + Math.random() * 2);
  const baseYaw = useRef(FROG_BASE_YAW);
  const glanceOffset = useRef(0);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();

    if (t > nextHop.current) {
      nextHop.current = t + 3 + Math.random() * 3.5;
      onRipple?.(homePosition);
    }

    const timeSincePlan = nextHop.current - t;
    const justHopped = timeSincePlan > 2.8 && timeSincePlan < 3.2;
    const hopY = justHopped
      ? Math.abs(Math.sin((3 - timeSincePlan) * 10)) * 0.1
      : Math.sin(t * 1.6) * 0.035;

    if (t > nextGlance.current) {
      nextGlance.current = t + 2 + Math.random() * 2.5;
      glanceOffset.current = (Math.random() - 0.5) * 0.35;
    }
    const targetYaw = baseYaw.current + glanceOffset.current;
    let angleDelta = targetYaw - group.current.rotation.y;
    while (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
    while (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
    group.current.rotation.y += angleDelta * 0.04;
    group.current.position.y = offset[1] + hopY;
  });

  return (
    <group ref={group} position={[homePosition[0], 0, homePosition[1]]} rotation={[0, FROG_BASE_YAW, 0]}>
      <primitive
        object={object}
        scale={scale}
        position={[offset[0], 0, offset[2]]}
      />
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
      return <IdleCharacter modelPath={DEFAULT_MODEL} homePosition={this.props.position} />;
    }
    return this.props.children;
  }
}

const ISO_DISTANCE = 7.8;
const ISO_ELEVATION = Math.atan(1 / Math.sqrt(2)) + 0.08;
const ISO_YAW = 0;
const ISO_POSITION = [
  ISO_DISTANCE * Math.cos(ISO_ELEVATION) * Math.sin(ISO_YAW),
  ISO_DISTANCE * Math.sin(ISO_ELEVATION),
  ISO_DISTANCE * Math.cos(ISO_ELEVATION) * Math.cos(ISO_YAW),
];

const FrogHabitat3D = ({ characterModel }) => {
  const [ripples, setRipples] = useState([]);

  const addRipple = (position) => {
    setRipples((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, position }]);
  };
  const removeRipple = (id) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Canvas
        shadows
        orthographic
        camera={{ position: ISO_POSITION, zoom: 108, near: 0.1, far: 200 }}
        gl={{ toneMappingExposure: 1.25 }}
      >
        <color attach="background" args={["#8fd9ae"]} />
        <fog attach="fog" args={["#8fd9ae", 60, 150]} />

        <OrbitControls
          target={[0, 0.4, 0]}
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          rotateSpeed={0.5}
          minPolarAngle={0.55}
          maxPolarAngle={1.05}
          minZoom={108}
          maxZoom={150}
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
          <MudPatch />
          <Pond />
          <RippleManager ripples={ripples} onRippleDone={removeRipple} />

          <LilypadsErrorBoundary>
            <React.Suspense fallback={null}>
              <Lilypads />
            </React.Suspense>
          </LilypadsErrorBoundary>

          <CattailsErrorBoundary>
            <React.Suspense fallback={null}>
              <Cattails />
            </React.Suspense>
          </CattailsErrorBoundary>

          <Firefly radius={1.6} speed={0.3} height={0.8} phase={0} />
          <Firefly radius={1.2} speed={0.4} height={1.0} phase={2} />
          <Firefly radius={1.9} speed={0.25} height={0.65} phase={4} />

          <Rocks />
          <Flowers />

          <CharacterErrorBoundary position={HOME_PAD_POSITION}>
            <IdleCharacter modelPath={characterModel} homePosition={HOME_PAD_POSITION} onRipple={addRipple} scale={2.35} />
          </CharacterErrorBoundary>
        </React.Suspense>
      </Canvas>
    </div>
  );
};

export default FrogHabitat3D;