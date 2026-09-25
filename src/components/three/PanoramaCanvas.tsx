"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { PerspectiveCamera } from "three";

import { PanoramaSphere, useEquirectangularTexture } from "./PanoramaImage";
import type { PanoramaCanvasProps } from "./types";

const MAX_PITCH = Math.PI / 3;
const DRAG_SENSITIVITY = 0.0035;
const AUTO_ROTATE_SPEED = 0.045;
const FOLLOW_DAMPING = 9;
const MIN_FOV = 35;
const MAX_FOV = 88;
const ZOOM_SENSITIVITY = 0.05;

type LookControlsProps = {
  initialYaw: number;
  autoRotate: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function LookControls({ initialYaw, autoRotate }: LookControlsProps) {
  const camera = useThree((state) => state.camera);
  const domElement = useThree((state) => state.gl.domElement);
  const target = useRef({ yaw: initialYaw, pitch: 0 });
  const settled = useRef({ yaw: initialYaw, pitch: 0 });
  const dragging = useRef(false);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    target.current.yaw = initialYaw;
    settled.current.yaw = initialYaw;
    target.current.pitch = 0;
    settled.current.pitch = 0;
  }, [initialYaw]);

  useEffect(() => {
    const element = domElement;

    const onPointerDown = (event: PointerEvent) => {
      dragging.current = true;
      pointer.current = { x: event.clientX, y: event.clientY };
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        // Touch pointers already implicitly capture; ignore the DOMException.
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging.current) return;

      const dx = event.clientX - pointer.current.x;
      const dy = event.clientY - pointer.current.y;
      pointer.current = { x: event.clientX, y: event.clientY };

      target.current.yaw += dx * DRAG_SENSITIVITY;
      target.current.pitch = clamp(
        target.current.pitch + dy * DRAG_SENSITIVITY,
        -MAX_PITCH,
        MAX_PITCH,
      );
    };

    const endDrag = (event: PointerEvent) => {
      dragging.current = false;
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const perspective = camera as PerspectiveCamera;
      perspective.fov = clamp(
        perspective.fov + event.deltaY * ZOOM_SENSITIVITY,
        MIN_FOV,
        MAX_FOV,
      );
      perspective.updateProjectionMatrix();
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", endDrag);
    element.addEventListener("pointercancel", endDrag);
    element.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", endDrag);
      element.removeEventListener("pointercancel", endDrag);
      element.removeEventListener("wheel", onWheel);
    };
  }, [camera, domElement]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    if (autoRotate && !dragging.current) {
      target.current.yaw += delta * AUTO_ROTATE_SPEED;
    }

    const step = Math.min(1, delta * FOLLOW_DAMPING);
    settled.current.yaw += (target.current.yaw - settled.current.yaw) * step;
    settled.current.pitch +=
      (target.current.pitch - settled.current.pitch) * step;

    camera.rotation.set(settled.current.pitch, settled.current.yaw, 0, "YXZ");
  });

  return null;
}

export function PanoramaCanvas({
  src,
  alt,
  autoRotate,
  initialYaw,
  onReady,
}: PanoramaCanvasProps) {
  const texture = useEquirectangularTexture(src);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    if (texture) onReadyRef.current?.();
  }, [texture]);

  return (
    <Canvas
      camera={{ fov: 72, near: 0.1, far: 1200, position: [0, 0, 0] }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      className="cursor-grab touch-none select-none active:cursor-grabbing"
      role="img"
      aria-label={alt}
    >
      <LookControls initialYaw={initialYaw} autoRotate={autoRotate} />
      {texture ? <PanoramaSphere texture={texture} /> : null}
    </Canvas>
  );
}
