// AvatarViewer.jsx - Main Avatar Canvas Component with Error Handling
import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import AvatarModel from "./AvatarModel";

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

// WebGL Support Check
function WebGLErrorFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <div className="text-center p-4">
        <div className="text-yellow-600 text-lg mb-2">WebGL Not Available</div>
        <div className="text-sm text-gray-600">
          Your browser doesn't support WebGL or it's disabled.
          <br />
          The avatar won't be visible, but voice features will still work.
        </div>
      </div>
    </div>
  );
}

export default function AvatarViewer({ 
  isSpeaking = false, 
  currentAudio = null,
  modelUrl = "https://models.readyplayer.me/685f5fe6ce6b397456e1ae90.glb",
  enableControls = false,
  showDebug = false,
  expressiveness = 1.0
}) {
  const [webglSupported, setWebglSupported] = useState(true);
  const [canvasError, setCanvasError] = useState(false);

  // Check WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
      }
    } catch (error) {
      console.warn('WebGL check failed:', error);
      setWebglSupported(false);
    }
  }, []);

  if (!webglSupported) {
    return <WebGLErrorFallback />;
  }

  if (canvasError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center p-4">
          <div className="text-red-500 text-lg mb-2">3D Rendering Error</div>
          <div className="text-sm text-gray-600 mb-4">
            Unable to initialize 3D graphics. This might be due to:
            <ul className="list-disc list-inside mt-2 text-left">
              <li>Hardware limitations</li>
              <li>Browser WebGL issues</li>
              <li>Graphics driver problems</li>
            </ul>
          </div>
          <button 
            onClick={() => setCanvasError(false)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white relative">
      <AvatarErrorBoundary>
        <Canvas 
          camera={{ position: [0, 1.4, 1.2], fov: 25 }}
          onCreated={({ gl }) => {
            // Canvas created successfully
            console.log('Canvas initialized successfully');
          }}
          onError={(error) => {
            console.error('Canvas error:', error);
            setCanvasError(true);
          }}
        >
          {/* Lighting */}
          <ambientLight intensity={1} />
          <directionalLight position={[10, 10, 5]} intensity={0.5} />
          <pointLight position={[-10, -10, -5]} intensity={0.3} />
          
          {/* Avatar Model */}
          <Suspense fallback={<LoadingFallback />}>
            <AvatarModel 
              isSpeaking={isSpeaking} 
              currentAudio={currentAudio}
              modelUrl={modelUrl}
              expressiveness={expressiveness}
              showDebugVisuals={showDebug}
            />
          </Suspense>
          
          {/* Camera Controls */}
          <OrbitControls 
            enableZoom={enableControls} 
            enableRotate={enableControls} 
            enablePan={enableControls}
            maxDistance={3}
            minDistance={1}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>
      </AvatarErrorBoundary>
      
      {/* Debug overlay */}
      {showDebug && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded text-xs max-w-sm">
          <div className="font-bold mb-2">Avatar Debug Info</div>
          <div>Speaking: {isSpeaking ? '✅ YES' : '❌ NO'}</div>
          <div>Audio: {currentAudio ? '🔊 Active' : '🔇 None'}</div>
          <div>Expressiveness: {expressiveness}x</div>
          <div className="mt-2 text-yellow-300">
            Check browser console for detailed animation info
          </div>
          <div className="mt-1 text-blue-300">
            Color bars show different mouth shapes and expressions
          </div>
        </div>
      )}
      
      {/* Performance overlay */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 right-4 bg-green-900 bg-opacity-75 text-green-300 p-2 rounded text-xs">
          DEV MODE - WebGL: {webglSupported ? '✅' : '❌'}
        </div>
      )}
    </div>
  );
}