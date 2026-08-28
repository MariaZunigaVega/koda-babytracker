import React, { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const KOALA_HEIGHT = 0.3;
const KOALA_POSITION = [0.02, 0.72];
const KOALA_MODEL_PATH = "/models/characters/koala.glb";

const PALETTE = {
  background: "#8fc7c0",
  fog: "#a5d6ce",
  sun: "#fffdf4",
  rim: "#cfeaf0",
  hemiSky: "#e8fbf6",
  hemiGround: "#3d5f52",
  groundBase: "hsl(150, 22%, 56%)",
  bark: "#d9d2c4",
  barkDark: "#b3a998",
  leaf: "#8fc4a4",
  leafDeep: "#5f9c86",
  leafSilver: "#c7e3d6",
  stone: "#a8a89c",
  moss: "#7fb08c",
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

function buildGroundTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = TEX;
  canvas.height = TEX;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = PALETTE.groundBase;
  ctx.fillRect(0, 0, TEX, TEX);

  for (let i = 0; i < 44; i++) {
    const seed = i * 61 + 3;
    const bx = (seed * 37) % TEX;
    const by = (seed * 53) % TEX;
    const radius = 46 + (seed % 5) * 22;
    const hue = 142 + (seed % 8) * 5;
    const light = 50 + (seed % 6) * 5;
    drawWrapped(ctx, bx, by, TEX, radius, (x, y) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, `hsla(${hue}, 32%, ${light}%, 0.5)`);
      g.addColorStop(1, `hsla(${hue}, 32%, ${light}%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  for (let i = 0; i < 480; i++) {
    const seed = i * 17 + 9;
    const bx = (seed * 31) % TEX;
    const by = (seed * 47) % TEX;
    ctx.fillStyle = `hsla(${138 + (seed % 10) * 4}, 30%, ${44 + (seed % 8) * 4}%, 0.5)`;
    drawWrapped(ctx, bx, by, TEX, 6, (x, y) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((seed % 12) * 0.26);
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.2, 5.0, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  for (let i = 0; i < 130; i++) {
    const seed = i * 89 + 13;
    const bx = (seed * 23) % TEX;
    const by = (seed * 41) % TEX;
    drawWrapped(ctx, bx, by, TEX, 10, (x, y) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((seed % 14) * 0.22);
      ctx.fillStyle = i % 3 === 0 ? "rgba(200,232,216,0.7)" : "rgba(126,172,146,0.6)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 7.5, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
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
  const tex = useMemo(() => buildGroundTexture(), []);
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

function buildBarkTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = PALETTE.bark;
  ctx.fillRect(0, 0, 48, 256);
  for (let i = 0; i < 26; i++) {
    const seed = i * 13 + 5;
    ctx.fillStyle = `rgba(150,140,124,${0.15 + (seed % 4) * 0.08})`;
    const x = (seed * 17) % 48;
    ctx.fillRect(x, (seed * 29) % 256, 2 + (seed % 4), 40 + (seed % 60));
  }
  for (let i = 0; i < 12; i++) {
    const seed = i * 31 + 7;
    ctx.fillStyle = "rgba(178,205,190,0.35)";
    ctx.fillRect((seed * 11) % 48, (seed * 37) % 256, 6, 18);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function GumTree({ position, height, lean = 0, seed = 1 }) {
  const bark = useMemo(() => buildBarkTexture(), []);
  const canopy = useRef(null);
  const phase = useMemo(() => seededRand(seed) * 8, [seed]);
  useFrame(({ clock }) => {
    if (canopy.current) {
      canopy.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.45 + phase) * 0.03;
    }
  });
  const clusters = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const a = (i / 7) * Math.PI * 2 + phase;
        const r = 0.22 + seededRand(seed + i * 3) * 0.3;
        return {
          position: [Math.cos(a) * r, height * (0.82 + seededRand(seed + i) * 0.22), Math.sin(a) * r],
          scale: 0.26 + seededRand(seed + i * 7) * 0.2,
          color: i % 3 === 0 ? PALETTE.leafSilver : i % 3 === 1 ? PALETTE.leaf : PALETTE.leafDeep,
        };
      }),
    [height, phase, seed],
  );
  return (
    <group position={position} rotation={[0, 0, lean]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.055, 0.11, height, 10]} />
        <meshStandardMaterial map={bark} roughness={0.9} />
      </mesh>
      <mesh position={[0.16, height * 0.72, 0]} rotation={[0, 0, -0.7]} castShadow>
        <cylinderGeometry args={[0.025, 0.04, 0.5, 8]} />
        <meshStandardMaterial color={PALETTE.barkDark} roughness={0.9} />
      </mesh>
      <mesh position={[-0.15, height * 0.8, 0.05]} rotation={[0, 0, 0.65]} castShadow>
        <cylinderGeometry args={[0.022, 0.035, 0.44, 8]} />
        <meshStandardMaterial color={PALETTE.barkDark} roughness={0.9} />
      </mesh>
      <group ref={canopy}>
        {clusters.map((c, i) => (
          <mesh key={i} position={c.position} scale={[c.scale, c.scale * 0.72, c.scale]} castShadow>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={c.color} roughness={0.85} flatShading />
          </mesh>
        ))}
      </group>
    </group>
  );
}

const TREES = [
  { position: [-1.35, 0, -1.35], height: 2.1, lean: 0.04, seed: 3 },
  { position: [1.4, 0, -1.5], height: 2.4, lean: -0.05, seed: 11 },
  { position: [-0.15, 0, -1.95], height: 2.7, lean: 0.02, seed: 19 },
  { position: [-2.3, 0, -0.45], height: 1.8, lean: 0.06, seed: 27 },
  { position: [2.3, 0, -0.3], height: 1.9, lean: -0.04, seed: 35 },
];

function LeafSprig({ position, rotation, scale = 1 }) {
  const ref = useRef(null);
  const phase = useMemo(() => Math.random() * 8, []);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = rotation + Math.sin(clock.getElapsedTime() + phase) * 0.06;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.006, 0.008, 0.15, 6]} />
        <meshStandardMaterial color="#8fa38c" roughness={0.9} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[i % 2 ? 0.045 : -0.045, 0.06 + i * 0.03, 0]}
          rotation={[0, 0, i % 2 ? -0.8 : 0.8]}
          scale={[1, 2.4, 1]}
          castShadow
        >
          <sphereGeometry args={[0.022, 8, 6]} />
          <meshStandardMaterial color={i % 2 ? PALETTE.leaf : PALETTE.leafDeep} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

const SPRIGS = (() => {
  const out = [];
  for (let i = 0; i < 16; i++) {
    const seed = i * 23 + 5;
    const x = (seededRand(seed) - 0.5) * 3.2;
    const z = -0.4 + (seededRand(seed * 1.7) - 0.5) * 2.6;
    if (Math.hypot(x - KOALA_POSITION[0], z - KOALA_POSITION[1]) < 0.42) continue;
    out.push({ position: [x, 0, z], rotation: (seededRand(seed * 2.3) - 0.5) * 0.4, scale: 0.8 + seededRand(seed * 3.1) * 0.7 });
  }
  return out;
})();

const STONES = [
  { position: [1.1, 0.07, 0.2], scale: 0.14, rotation: 0.8 },
  { position: [-1.35, 0.06, 0.85], scale: 0.12, rotation: 2.0 },
  { position: [0.5, 0.05, 1.4], scale: 0.1, rotation: 1.4 },
  { position: [-0.55, 0.06, 1.05], scale: 0.11, rotation: 0.3 },
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
          <mesh position={[0.03, 0.5, -0.04]} scale={[0.74, 0.2, 0.68]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color={PALETTE.moss} roughness={1} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function WaterDish() {
  const ref = useRef(null);
  useFrame(({ clock }) => {
    const m = ref.current?.material;
    if (m) m.opacity = 0.85 + Math.sin(clock.getElapsedTime() * 0.9) * 0.06;
  });
  return (
    <group position={[-0.85, 0, 0.35]}>
      <mesh position={[0, 0.035, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.18, 0.07, 20]} />
        <meshStandardMaterial color={PALETTE.stone} roughness={0.9} />
      </mesh>
      <mesh ref={ref} position={[0, 0.072, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.18, 24]} />
        <meshBasicMaterial color="#a8e4e0" transparent opacity={0.88} />
      </mesh>
    </group>
  );
}

function MistWisp({ radius, speed, phase, height }) {
  const ref = useRef(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed + phase;
    ref.current.position.set(Math.cos(t) * radius, height, Math.sin(t * 0.8) * radius * 0.6 - 0.4);
    ref.current.material.opacity = 0.1 + Math.abs(Math.sin(t * 0.6)) * 0.14;
  });
  return (
    <mesh ref={ref} scale={[1.7, 0.5, 1]}>
      <sphereGeometry args={[0.4, 12, 8]} />
      <meshBasicMaterial color="#eafbf7" transparent opacity={0.15} depthWrite={false} />
    </mesh>
  );
}

function Mist() {
  const wisps = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        radius: 1.0 + seededRand(i * 3.3) * 1.3,
        speed: 0.1 + seededRand(i * 5.5) * 0.08,
        phase: seededRand(i * 7.7) * 8,
        height: 0.2 + seededRand(i * 9.1) * 0.5,
      })),
    [],
  );
  return (
    <>
      {wisps.map((w, i) => (
        <MistWisp key={i} {...w} />
      ))}
    </>
  );
}

function useNormalizedModel(size) {
  const gltf = useGLTF(KOALA_MODEL_PATH);
  return useMemo(() => {
    const clone = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const dim = box.getSize(new THREE.Vector3());
    const scale = size / (dim.y || 1);
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
  }, [gltf.scene, size]);
}

function Koala({ position = KOALA_POSITION }) {
  const group = useRef(null);
  const body = useRef(null);
  const nextGlance = useRef(1 + Math.random() * 2);
  const glance = useRef(0);
  const model = useNormalizedModel(KOALA_HEIGHT);

  useLayoutEffect(() => {
    if (group.current) group.current.rotation.y = 0;
  }, [model]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    if (t > nextGlance.current) {
      nextGlance.current = t + 2.4 + Math.random() * 2.5;
      glance.current = (Math.random() - 0.5) * 0.35;
    }
    group.current.rotation.y += (glance.current - group.current.rotation.y) * 0.035;
    group.current.position.y = Math.sin(t * 1.0) * 0.012;
    if (body.current) {
      const breathe = 1 + Math.sin(t * 1.6) * 0.018;
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

class KoalaErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error("Koala model failed to load:", error);
  }
  render() {
    if (this.state.failed) return <Koala position={this.props.position} />;
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

export function KoalaHabitat3D() {
  useEffect(() => {
    useGLTF.preload(KOALA_MODEL_PATH);
  }, []);

  return (
    <Canvas
      shadows
      orthographic
      camera={{ position: ISO_POSITION, zoom: ISO_ZOOM, near: 0.1, far: 60 }}
      gl={{ toneMappingExposure: 1.15 }}
      dpr={[1, 2]}
    >
      <color attach="background" args={[PALETTE.background]} />
      <fog attach="fog" args={[PALETTE.fog, 5, 13]} />

      <ambientLight intensity={1.0} />
      <directionalLight
        position={[5, 8, 3]}
        intensity={1.45}
        color={PALETTE.sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <directionalLight position={[-5, 3, -4]} intensity={0.32} color={PALETTE.rim} />
      <hemisphereLight args={[PALETTE.hemiSky, PALETTE.hemiGround, 1.0]} />

      <Suspense fallback={null}>
        <group position={[0, -0.18, 0]}>
          <Ground />
          {TREES.map((t, i) => (
            <GumTree key={`t${i}`} {...t} />
          ))}
          <WaterDish />
          {SPRIGS.map((s, i) => (
            <LeafSprig key={`s${i}`} {...s} />
          ))}
          <Stones />
          <Mist />
          <KoalaErrorBoundary position={KOALA_POSITION}>
            <Koala position={KOALA_POSITION} />
          </KoalaErrorBoundary>
        </group>
      </Suspense>
    </Canvas>
  );
}

export default KoalaHabitat3D;
