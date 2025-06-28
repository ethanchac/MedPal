// AvatarModel.jsx - Fixed version with better defaults
import React, { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useLipSync } from "./useLipSync";
import { AvatarAnimations } from "../AvatarAnimation";

function AvatarModel({ 
  isSpeaking = false, 
  currentAudio = null, 
  modelUrl = "https://models.readyplayer.me/685f5fe6ce6b397456e1ae90.glb",
  expressiveness = 1.0,
  showDebugVisuals = false
}) {
  const { scene } = useGLTF(modelUrl);
  const modelRef = useRef();
  const [animations, setAnimations] = useState(null);
  const [debugMode, setDebugMode] = useState(showDebugVisuals);
  
  const lipSyncData = useLipSync(isSpeaking, currentAudio, expressiveness);

  useEffect(() => {
    if (scene && !animations) {
      console.log("Initializing avatar animations...");
      const avatarAnimations = new AvatarAnimations(scene);
      avatarAnimations.setExpressiveness(expressiveness);
      setAnimations(avatarAnimations);
      
      if (process.env.NODE_ENV === 'development' || showDebugVisuals) {
        setDebugMode(true);
        console.log("Animation debug info:", avatarAnimations.getDebugInfo());
      }
    }
  }, [scene, animations, showDebugVisuals]);

  useEffect(() => {
    if (animations) {
      animations.setExpressiveness(expressiveness);
    }
  }, [expressiveness, animations]);

  useFrame(() => {
    if (animations) {
      animations.applyAnimations(lipSyncData, isSpeaking);
    }

    // REDUCED fallback animations to prevent weird looking movements
    if (modelRef.current && isSpeaking) {
      const time = Date.now() * 0.001;
      
      // Much more subtle breathing effect
      const breatheIntensity = (lipSyncData.mouthShapes?.openAmount || lipSyncData.mouthOpenAmount || 0) * 0.5;
      const breathe = 1 + Math.sin(time * 3) * 0.003 * breatheIntensity * expressiveness; // Reduced from 0.008
      
      // Only apply minimal scale changes
      modelRef.current.scale.set(breathe, 1, 1); // Only scale X slightly, keep Y and Z normal
      
      // Much more subtle position changes
      const headMovement = (lipSyncData.facialExpressions?.headNod || lipSyncData.headBob || 0);
      const bob = Math.sin(time * 2) * 0.005 * headMovement * expressiveness; // Reduced from 0.02
      modelRef.current.position.y = -0.5 + bob; // Match the new base position
      
      // Minimal head rotation
      const headTiltValue = (lipSyncData.facialExpressions?.headTilt || lipSyncData.headTilt || 0);
      const sway = Math.sin(time * 1.5) * 0.01 * headTiltValue * expressiveness; // Reduced from 0.03
      modelRef.current.rotation.y = sway;
      
    } else if (modelRef.current && !isSpeaking) {
      // Smooth return to neutral position
      const lerpFactor = 0.05; // Slower lerp for smoother transition
      const currentScale = modelRef.current.scale.x;
      const currentY = modelRef.current.position.y;
      const currentRotY = modelRef.current.rotation.y;
      
      modelRef.current.scale.set(
        currentScale + (1 - currentScale) * lerpFactor, // Return to scale 1
        1,
        1
      );
      modelRef.current.position.y = currentY + (-0.5 - currentY) * lerpFactor; // Return to -0.5
      modelRef.current.rotation.y = currentRotY + (0 - currentRotY) * lerpFactor;
    }
  });

  return (
    <>
      <primitive 
        ref={modelRef}
        object={scene} 
        scale={1.0}                    // Normal scale
        position={[0, -0.5, 0]}        // Higher position to show full head
        rotation={[0, 0, 0]}           // No rotation
      />
      
      {/* Debug visualization with better positioning */}
      {debugMode && (
        <>
          <group position={[1.5, 0, 0]}> {/* Moved closer to avatar */}
            {/* Mouth shapes indicators - made smaller */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.05, Math.max(0.05, (lipSyncData.mouthShapes?.openAmount || lipSyncData.mouthOpenAmount || 0) * 1), 0.05]} />
              <meshBasicMaterial color="red" />
            </mesh>
            
            <mesh position={[0.1, 0, 0]}>
              <boxGeometry args={[0.05, Math.max(0.05, (lipSyncData.mouthShapes?.wideAmount || 0) * 1), 0.05]} />
              <meshBasicMaterial color="green" />
            </mesh>
            
            <mesh position={[0.2, 0, 0]}>
              <boxGeometry args={[0.05, Math.max(0.05, (lipSyncData.mouthShapes?.roundAmount || 0) * 1), 0.05]} />
              <meshBasicMaterial color="blue" />
            </mesh>
          </group>
          
          {/* Status indicator */}
          <mesh position={[0, 1, 0]}>
            <sphereGeometry args={[0.05]} />
            <meshBasicMaterial color={isSpeaking ? "green" : "red"} />
          </mesh>
        </>
      )}
    </>
  );
}

export default AvatarModel;