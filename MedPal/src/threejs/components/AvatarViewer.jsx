import React, { Suspense, useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

// Simplified AvatarModel component for testing
function AvatarModel({ 
  isSpeaking = false, 
  modelUrl = "https://models.readyplayer.me/685f5fe6ce6b397456e1ae90.glb",
  showDebugVisuals = false
}) {
  const { scene } = useGLTF(modelUrl);
  const modelRef = useRef();

  return (
    <>
      <primitive 
        ref={modelRef}
        object={scene} 
        scale={1.2}                    // Slightly larger scale
        position={[0, -1.8, 0]}        // Much lower position to show full torso
        rotation={[0, 0, 0]}           
      />
      
      {/* Debug helper to show model bounds */}
      {showDebugVisuals && (
        <>
          {/* Ground reference */}
          <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4, 4]} />
            <meshBasicMaterial color="lightgray" transparent opacity={0.3} />
          </mesh>
          
          {/* Height markers */}
          <mesh position={[2, -1, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshBasicMaterial color="red" />
          </mesh>
          <mesh position={[2, 0, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshBasicMaterial color="green" />
          </mesh>
          <mesh position={[2, 1, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshBasicMaterial color="blue" />
          </mesh>
        </>
      )}
    </>
  );
}


// Error Boundary Component
class AvatarErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Avatar Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <div className="text-center p-4">
            <div className="text-red-500 text-lg mb-2">Avatar Loading Error</div>
            <div className="text-sm text-gray-600 mb-4">
              {this.state.error?.message || 'Unable to load 3D avatar'}
            </div>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading fallback component
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 2, 0.5]} />
      <meshStandardMaterial color="lightgray" />
    </mesh>
  );
}

export default function AvatarViewer({ 
  isSpeaking = false, 
  currentAudio = null,
  modelUrl = "https://models.readyplayer.me/685f5fe6ce6b397456e1ae90.glb",
  enableControls = true,
  showDebug = false,
  expressiveness = 1.0
}) {
  const [cameraSettings, setCameraSettings] = useState({
    position: [0, 0.5 , 3],   // Further back and centered
    fov: 7,                 // Wider field of view
    target: [0, 0.1, 0]        // Look at center
  });

  return (
    <div className="h-full w-full bg-gradient-to-b from-blue-50 to-white relative">
      <AvatarErrorBoundary>
        <Canvas 
          camera={{ 
            position: cameraSettings.position,
            fov: cameraSettings.fov,
            near: 0.1,
            far: 1000
          }}
          onCreated={({ camera }) => {
            camera.lookAt(...cameraSettings.target);
            console.log('Camera positioned for full body view');
          }}
        >
          {/* Improved lighting setup */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
          <directionalLight position={[-5, 5, 5]} intensity={0.4} />
          <directionalLight position={[0, 5, -5]} intensity={0.3} />
          <pointLight position={[0, 3, 3]} intensity={0.4} />
          
          {/* Avatar Model */}
          <Suspense fallback={<LoadingFallback />}>
            <AvatarModel 
              isSpeaking={isSpeaking} 
              currentAudio={currentAudio}
              modelUrl={modelUrl}
              showDebugVisuals={showDebug}
            />
          </Suspense>
          
          {/* Camera Controls */}
          {enableControls && (
            <OrbitControls 
              enableZoom={true} 
              enableRotate={true} 
              enablePan={false}
              maxDistance={2.5}    // Closer max distance
              minDistance={1}      // Closer min distance
              maxPolarAngle={Math.PI / 2}  
              minPolarAngle={Math.PI / 6}    
              target={[0, 0.8, 0]} // Higher target point
            />
          )}
        </Canvas>
      </AvatarErrorBoundary>
      
      {/* Debug overlay */}
      {showDebug && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded text-xs max-w-sm">
          <div className="font-bold mb-2">Zoomed Head View</div>
          <div>Camera Position: [0, 0.2, 1.5]</div>
          <div>Camera FOV: 25°</div>
          <div>Look At: [0, 0.8, 0]</div>
          <div>Model Position: [0, -1.8, 0]</div>
          <div>Model Scale: 1.2</div>
          <div className="mt-2 text-green-300">
            ✅ Closer and lower camera angle
          </div>
          <div className="mt-1 text-blue-300">
            🎯 Focused on face and upper neck
          </div>
        </div>
      )}
    </div>
  );
}