import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

function AvatarModel() {
  const { scene } = useGLTF("https://models.readyplayer.me/685f5fe6ce6b397456e1ae90.glb");
  return <primitive object={scene} scale={1.5} position={[0, -2.2, 0]} />;
}

export default function AvatarViewer() {
  return (
    <div className="h-screen w-screen bg-white">
      <Canvas camera={{ position: [0, 1.4, 1.8], fov: 30 }}>
        <ambientLight intensity={1} />
        <Suspense fallback={null}>
          <AvatarModel />
        </Suspense>
        <OrbitControls enableZoom={false} enableRotate={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
