// rough draft. 
import React, { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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

const GRASS_PX = 64;
function buildGrassTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = GRASS_PX * 4;
  canvas.height = GRASS_PX * 4;
  const ctx = canvas.getContext("2d");

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const x = col * GRASS_PX;
      const y = row * GRASS_PX;

      const hue = 100 + ((row * 4 + col) % 5) * 4;
      ctx.fillStyle = `hsl(${hue}, 42%, 32%)`;
      ctx.fillRect(x, y, GRASS_PX, GRASS_PX);

      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, GRASS_PX - 1, GRASS_PX - 1);

      ctx.fillStyle = `hsl(${hue + 10}, 46%, 42%)`;
      const rng = (row * 4 + col + 1) * 13;
      for (let i = 0; i < 6; i++) {
        const bx = x + ((rng * (i + 1) * 7) % (GRASS_PX - 8)) + 4;
        const by = y + ((rng * (i + 1) * 11) % (GRASS_PX - 10)) + 5;
        ctx.fillRect(bx, by, 2, 5);
        ctx.fillRect(bx + 3, by + 2, 2, 4);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function Ground({ size = 34 }) {
  const tex = useMemo(() => buildGrassTexture(), []);
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
  const { scene } = useGLTF("/models/trees.glb");
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
  const { scene } = useGLTF("/models/house.glb");
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

function Rock({ position, scale = 1 }) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial color="#8a8f94" roughness={0.9} />
    </mesh>
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

function Firefly({ radius, speed, height, phase }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + phase;
    ref.current.position.set(Math.cos(t) * radius, height + Math.sin(t * 2) * 0.15, Math.sin(t) * radius);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.025, 8, 8]} />
      <meshBasicMaterial color="#ffe38a" />
      <pointLight color="#ffe38a" intensity={0.35} distance={0.9} />
    </mesh>
  );
}

// ---------- Wandering character, rotation fixed to wrap at +-PI (matches plazaCanvas.jsx pattern) ----------
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
    const r = Math.random() * 3.2; // stay in the open yard, not into the trees
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
const ISO_ELEVATION = Math.atan(1 / Math.sqrt(2));
const ISO_YAW = Math.PI / 4;
const ISO_POSITION = [
  ISO_DISTANCE * Math.cos(ISO_ELEVATION) * Math.sin(ISO_YAW),
  ISO_DISTANCE * Math.sin(ISO_ELEVATION),
  ISO_DISTANCE * Math.cos(ISO_ELEVATION) * Math.cos(ISO_YAW),
];

const FoxHabitat3D = ({ characterModel }) => {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Canvas
        shadows
        orthographic
        camera={{ position: ISO_POSITION, zoom: 42, near: 0.1, far: 60 }}
        gl={{ toneMappingExposure: 1.15 }}
      >
        <color attach="background" args={["#3f5c3a"]} />
        <fog attach="fog" args={["#3f5c3a", 13, 24]} />

        <OrbitControls
          target={[0, 1, -1]}
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          rotateSpeed={0.5}
          minPolarAngle={0.6}
          maxPolarAngle={1.5}
          minZoom={26}
          maxZoom={64}
        />

        <ambientLight intensity={0.5} />
        <directionalLight
          position={[6, 9, 4]}
          intensity={2.1}
          color="#ffdcab"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-9}
          shadow-camera-right={9}
          shadow-camera-top={9}
          shadow-camera-bottom={-9}
        />
        <directionalLight position={[-6, 3, -5]} intensity={0.35} color="#8aa0d6" />
        <hemisphereLight args={["#ffe9c7", "#2c3a24", 1.0]} />

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

          <Rock position={[1.3, 0.15, -0.3]} scale={0.9} />
          <Rock position={[1.55, 0.1, -0.05]} scale={0.55} />

          <Campfire position={[1.0, 0, -0.4]} />

          <Firefly radius={2.4} speed={0.3} height={0.9} phase={0} />
          <Firefly radius={1.7} speed={0.4} height={1.2} phase={2} />
          <Firefly radius={2.9} speed={0.25} height={0.7} phase={4} />

          <CharacterErrorBoundary position={[0, 1.8]}>
            <WanderingCharacter modelPath={characterModel} homePosition={[0, 1.8]} />
          </CharacterErrorBoundary>
        </React.Suspense>
      </Canvas>
    </div>
  );
};

export default FoxHabitat3D;