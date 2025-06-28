// AvatarModel.jsx - Enhanced 3D Avatar Component with expressive lip sync
import React, { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useLipSync } from "./useLipSync";
import { AvatarAnimations } from "../AvatarAnimation";

function AvatarModel({ 
  isSpeaking = false, 
  currentAudio = null, 
  modelUrl = "https://models.readyplayer.me/685f5fe6ce6b397456e1ae90.glb",
  expressiveness = 1.0,  // 0.1 = subtle, 1.0 = normal, 2.0 = very expressive
  showDebugVisuals = false
}) {
  const { scene } = useGLTF(modelUrl);
  const modelRef = useRef();
  const [animations, setAnimations] = useState(null);
  const [debugMode, setDebugMode] = useState(showDebugVisuals);
  
  // Get enhanced lip sync data with expressiveness control
  const lipSyncData = useLipSync(isSpeaking, currentAudio, expressiveness);

  // Initialize animations when scene loads
  useEffect(() => {
    if (scene && !animations) {
      console.log("Initializing enhanced avatar animations...");
      const avatarAnimations = new AvatarAnimations(scene);
      avatarAnimations.setExpressiveness(expressiveness);
      setAnimations(avatarAnimations);
      
      // Enable debug mode in development
      if (process.env.NODE_ENV === 'development' || showDebugVisuals) {
        setDebugMode(true);
        console.log("Enhanced animation debug info:", avatarAnimations.getDebugInfo());
      }
    }
  }, [scene, animations, showDebugVisuals]);

  // Update expressiveness when it changes
  useEffect(() => {
    if (animations) {
      animations.setExpressiveness(expressiveness);
    }
  }, [expressiveness, animations]);

  // Apply animations on each frame
  useFrame(() => {
    if (animations) {
      animations.applyAnimations(lipSyncData, isSpeaking);
    }

    // Enhanced fallback visual animation if bones/morphs don't work
    if (modelRef.current && isSpeaking) {
      // More dynamic breathing effect based on multiple mouth shapes
      const time = Date.now() * 0.001;
      const breatheIntensity = (
        (lipSyncData.mouthShapes?.openAmount || 0) * 0.4 + 
        (lipSyncData.mouthShapes?.wideAmount || 0) * 0.2 + 
        (lipSyncData.mouthShapes?.roundAmount || 0) * 0.3
      ) || lipSyncData.mouthOpenAmount || 0;
      
      const breathe = 1 + Math.sin(time * 4) * 0.008 * breatheIntensity * expressiveness;
      modelRef.current.scale.set(1.8 * breathe, 1.8, 1.8);
      
      // More expressive position bob
      const headMovement = (lipSyncData.facialExpressions?.headNod || 0) || lipSyncData.headBob || 0;
      const bob = Math.sin(time * 3) * 0.02 * headMovement * expressiveness;
      modelRef.current.position.y = -3.6 + bob;
      
      // More dynamic head rotation
      const headTiltValue = (lipSyncData.facialExpressions?.headTilt || 0) || lipSyncData.headTilt || 0;
      const sway = Math.sin(time * 2) * 0.03 * headTiltValue * expressiveness;
      modelRef.current.rotation.y = sway;

      // Add subtle z-axis rotation for more life-like movement
      const roll = Math.sin(time * 1.5) * 0.015 * breatheIntensity * expressiveness;
      modelRef.current.rotation.z = roll;
      
    } else if (modelRef.current && !isSpeaking) {
      // Return to neutral position smoothly
      const lerpFactor = 0.08;
      const currentScale = modelRef.current.scale.x;
      const currentY = modelRef.current.position.y;
      const currentRotY = modelRef.current.rotation.y;
      const currentRotZ = modelRef.current.rotation.z;
      
      modelRef.current.scale.set(
        currentScale + (1.8 - currentScale) * lerpFactor,
        1.8,
        1.8
      );
      modelRef.current.position.y = currentY + (-3.6 - currentY) * lerpFactor;
      modelRef.current.rotation.y = currentRotY + (0 - currentRotY) * lerpFactor;
      modelRef.current.rotation.z = currentRotZ + (0 - currentRotZ) * lerpFactor;
    }
  });

  return (
    <>
      <primitive 
        ref={modelRef}
        object={scene} 
        scale={1.8} 
        position={[0, -3.6, 0]} 
        rotation={[-0.5, 0, 0]} 
      />
      
      {/* Enhanced debug visualization */}
      {debugMode && (
        <>
          {/* Mouth shapes indicators */}
          <group position={[2, 0, 0]}>
            {/* Open amount (red) */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.08, Math.max(0.1, (lipSyncData.mouthShapes?.openAmount || lipSyncData.mouthOpenAmount || 0) * 2), 0.08]} />
              <meshBasicMaterial color="red" />
            </mesh>
            
            {/* Wide amount (green) */}
            <mesh position={[0.15, 0, 0]}>
              <boxGeometry args={[0.08, Math.max(0.1, (lipSyncData.mouthShapes?.wideAmount || 0) * 2), 0.08]} />
              <meshBasicMaterial color="green" />
            </mesh>
            
            {/* Round amount (blue) */}
            <mesh position={[0.3, 0, 0]}>
              <boxGeometry args={[0.08, Math.max(0.1, (lipSyncData.mouthShapes?.roundAmount || 0) * 2), 0.08]} />
              <meshBasicMaterial color="blue" />
            </mesh>
            
            {/* Smile amount (yellow) */}
            <mesh position={[0.45, 0, 0]}>
              <boxGeometry args={[0.08, Math.max(0.1, (lipSyncData.mouthShapes?.smileAmount || 0) * 3), 0.08]} />
              <meshBasicMaterial color="yellow" />
            </mesh>
            
            {/* Lip pucker (magenta) */}
            <mesh position={[0.6, 0, 0]}>
              <boxGeometry args={[0.08, Math.max(0.1, (lipSyncData.mouthShapes?.lipPucker || 0) * 2), 0.08]} />
              <meshBasicMaterial color="magenta" />
            </mesh>
          </group>
          
          {/* Facial expressions indicators */}
          <group position={[2.8, 0, 0]}>
            {/* Eyebrow raise (purple) */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.06, Math.max(0.1, (lipSyncData.facialExpressions?.eyebrowRaise || 0) * 3), 0.06]} />
              <meshBasicMaterial color="purple" />
            </mesh>
            
            {/* Eye squint (orange) */}
            <mesh position={[0.12, 0, 0]}>
              <boxGeometry args={[0.06, Math.max(0.1, (lipSyncData.facialExpressions?.eyeSquint || 0) * 3), 0.06]} />
              <meshBasicMaterial color="orange" />
            </mesh>
            
            {/* Eye blink (white) */}
            <mesh position={[0.24, 0, 0]}>
              <boxGeometry args={[0.06, Math.max(0.1, (lipSyncData.facialExpressions?.eyeBlink || lipSyncData.eyeBlink || 0) * 2), 0.06]} />
              <meshBasicMaterial color="white" />
            </mesh>
          </group>
          
          {/* Head movement indicators */}
          <group position={[3.5, 0, 0]}>
            {/* Head nod (cyan) - moves up and down */}
            <mesh position={[0, (lipSyncData.facialExpressions?.headNod || lipSyncData.headBob || 0) * 5, 0]}>
              <sphereGeometry args={[0.04]} />
              <meshBasicMaterial color="cyan" />
            </mesh>
            
            {/* Head tilt (lime) - moves left and right */}
            <mesh position={[(lipSyncData.facialExpressions?.headTilt || lipSyncData.headTilt || 0) * 5, -0.2, 0]}>
              <sphereGeometry args={[0.04]} />
              <meshBasicMaterial color="lime" />
            </mesh>
          </group>
          
          {/* Expressiveness level indicator */}
          <mesh position={[2, -1.2, 0]}>
            <boxGeometry args={[Math.max(0.1, expressiveness * 0.5), 0.08, 0.08]} />
            <meshBasicMaterial color="gold" />
          </mesh>
          
          {/* Debug labels (text would require additional setup, so using colored indicators) */}
          <group position={[1.5, 0.8, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.02, 0.02, 0.02]} />
              <meshBasicMaterial color="red" />
            </mesh>
            <mesh position={[0.15, 0, 0]}>
              <boxGeometry args={[0.02, 0.02, 0.02]} />
              <meshBasicMaterial color="green" />
            </mesh>
            <mesh position={[0.3, 0, 0]}>
              <boxGeometry args={[0.02, 0.02, 0.02]} />
              <meshBasicMaterial color="blue" />
            </mesh>
            <mesh position={[0.45, 0, 0]}>
              <boxGeometry args={[0.02, 0.02, 0.02]} />
              <meshBasicMaterial color="yellow" />
            </mesh>
            <mesh position={[0.6, 0, 0]}>
              <boxGeometry args={[0.02, 0.02, 0.02]} />
              <meshBasicMaterial color="magenta" />
            </mesh>
          </group>
          
          {/* Animation intensity visualization */}
          <mesh position={[1.5, -0.5, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.02, Math.max(0.1, ((
              (lipSyncData.mouthShapes?.openAmount || 0) * 0.4 + 
              (lipSyncData.mouthShapes?.wideAmount || 0) * 0.2 + 
              (lipSyncData.mouthShapes?.roundAmount || 0) * 0.3
            ) || lipSyncData.mouthOpenAmount || 0) * 2), 0.02]} />
            <meshBasicMaterial color="lightblue" />
          </mesh>
        </>
      )}
    </>
  );
}

export default AvatarModel;