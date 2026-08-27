// Renders a 3D model of the avatar in a canvas
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

function FramedModel({ modelUrl, onFit }) {
  const { scene } = useGLTF(modelUrl);
  const object = useMemo(() => scene.clone(), [scene]);

  const info = useMemo(() => {
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    return { size, center };
  }, [object]);

  useEffect(() => {
    onFit(info);
  }, [info, onFit]);

  return (
    <primitive
      object={object}
      position={[-info.center.x, -info.center.y, -info.center.z]}
    />
  );
}

function CameraRig({ fitInfo }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!fitInfo) return;
    const maxDim = Math.max(fitInfo.size.x, fitInfo.size.y, fitInfo.size.z) || 1;
    const distance = maxDim * 1.7;
    camera.position.set(0, maxDim * 0.1, distance);
    camera.near = Math.max(distance / 100, 0.01);
    camera.far = distance * 10;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [fitInfo, camera]);

  return null;
}

const AvatarPortrait3D = ({ modelUrl, width = "100%", height = "100%" }) => {
  const [fitInfo, setFitInfo] = useState(null);

  if (!modelUrl) return null;

  return (
    <Canvas
      style={{ width, height }}
      camera={{ position: [0, 0, 3], fov: 32 }}
      gl={{ preserveDrawingBuffer: true }}
    >
      <ambientLight intensity={1} />
      <directionalLight position={[2, 3, 2]} intensity={0.7} />
      <directionalLight position={[-2, 1, -1]} intensity={0.3} />
      <Suspense fallback={null}>
        <FramedModel modelUrl={modelUrl} onFit={setFitInfo} />
      </Suspense>
      <CameraRig fitInfo={fitInfo} />
    </Canvas>
  );
};

export default AvatarPortrait3D;
