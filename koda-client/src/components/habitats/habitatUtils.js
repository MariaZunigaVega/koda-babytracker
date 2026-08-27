// Shared, non-visual helper functions used by multiple habitat scenes: grounding an object's offset, a seeded pseudo-random number, and wrap-around canvas texture drawing.

import { useEffect, useState } from "react";
import * as THREE from "three";

export function useGroundedOffset(object) {
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

export function seededRand(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function drawWrapped(ctx, x, y, size, margin, draw) {
  const xs = [x];
  const ys = [y];
  if (x < margin) xs.push(x + size);
  if (x > size - margin) xs.push(x - size);
  if (y < margin) ys.push(y + size);
  if (y > size - margin) ys.push(y - size);
  for (const xx of xs) {
    for (const yy of ys) draw(xx, yy);
  }
}
