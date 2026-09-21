"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

export function configurePanoramaTexture(
  texture: THREE.Texture,
): THREE.Texture {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

export function useEquirectangularTexture(src: string): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    const loaded = loader.load(
      src,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        configurePanoramaTexture(tex);
        setTexture(tex);
      },
      undefined,
      () => {
        if (!cancelled) setTexture(null);
      },
    );
    configurePanoramaTexture(loaded);

    return () => {
      cancelled = true;
      setTexture(null);
      loaded.dispose();
    };
  }, [src]);

  return texture;
}

type PanoramaSphereProps = {
  texture: THREE.Texture;
  radius?: number;
};

export function PanoramaSphere({ texture, radius = 500 }: PanoramaSphereProps) {
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[radius, 64, 32]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.BackSide}
        toneMapped={false}
      />
    </mesh>
  );
}
