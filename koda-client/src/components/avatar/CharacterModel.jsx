// Idle-bobbing 3D character model renderer plus an error boundary that silently hides a character if its model fails to load.

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

export function IdleCharacterModel({ modelPath }) {
  const { scene } = useGLTF(modelPath);
  const ref = useRef();

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y = Math.sin(t * 0.5) * 0.25;
    ref.current.position.y = -0.6 + Math.sin(t * 1.6) * 0.06;
  });

  return <primitive ref={ref} object={scene} scale={1.4} position={[0, -0.6, 0]} />;
}

export class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error(`Character model failed to load (${this.props.modelPath}):`, error);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
