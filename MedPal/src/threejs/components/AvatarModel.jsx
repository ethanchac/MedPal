// Enhanced AvatarModel.jsx - Complete version with emotion-aware expressions
import React, { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useLipSync } from "./useLipSync";
import { AvatarAnimations } from "../AvatarAnimation";
import * as THREE from "three";

function AvatarModel({ 
  isSpeaking = false, 
  currentAudio = null, 
  modelUrl = "https://models.readyplayer.me/6860857a08372d74e879eadc.glb",
  expressiveness = 1.0,
  showDebugVisuals = false,
  currentText = "", // New prop for emotion analysis
  enableMicroExpressions = true, // New prop for subtle expressions
  emotionalRange = 1.0 // New prop to control emotional intensity
}) {
  const { scene } = useGLTF(modelUrl);
  const modelRef = useRef();
  const [animations, setAnimations] = useState(null);
  const [debugMode, setDebugMode] = useState(showDebugVisuals);
  
  // Micro-expression timers
  const blinkTimerRef = useRef(0);
  const microExpressionTimerRef = useRef(0);
  const lastEmotionRef = useRef('neutral');
  const emotionTransitionRef = useRef(0);
  const previousMorphValues = useRef({});

  const lipSyncData = useLipSync(isSpeaking, currentAudio, expressiveness, currentText);

  useEffect(() => {
    if (scene && !animations) {
      const avatarAnimations = new AvatarAnimations(scene);
      avatarAnimations.setExpressiveness(expressiveness);
      setAnimations(avatarAnimations);

      if (showDebugVisuals) {
        setDebugMode(true);
        console.log("Enhanced animation debug info:", avatarAnimations.getDebugInfo());
      } else {
        setDebugMode(false);
      }
    }
  }, [scene, animations, showDebugVisuals, expressiveness]);

  useEffect(() => {
    if (animations) {
      animations.setExpressiveness(expressiveness);
    }
  }, [expressiveness, animations]);

  // Enhanced morph target application with smooth transitions
  const applyMorphWithTransition = (dict, influences, morphNames, targetValue, smoothFactor) => {
    if (!dict || !influences || !morphNames) return;

    for (const morphName of morphNames) {
      // Try exact match first
      if (dict[morphName] !== undefined) {
        const index = dict[morphName];
        const currentValue = influences[index];
        const smoothedValue = THREE.MathUtils.lerp(currentValue, targetValue, smoothFactor);
        influences[index] = Math.max(0, Math.min(1, smoothedValue));
        
        // Store for debugging
        if (debugMode) {
          previousMorphValues.current[morphName] = smoothedValue;
        }
        return;
      }

      // Try case-insensitive match
      const matchedKey = Object.keys(dict).find(key => 
        key.toLowerCase() === morphName.toLowerCase()
      );
      
      if (matchedKey) {
        const index = dict[matchedKey];
        const currentValue = influences[index];
        const smoothedValue = THREE.MathUtils.lerp(currentValue, targetValue, smoothFactor);
        influences[index] = Math.max(0, Math.min(1, smoothedValue));
        
        if (debugMode) {
          previousMorphValues.current[matchedKey] = smoothedValue;
        }
        return;
      }
    }
  };

  // Generate micro-expressions based on emotion
  const generateMicroExpressions = (currentEmotion, emotionalIntensity, deltaTime) => {
    microExpressionTimerRef.current += deltaTime;
    
    // Check if emotion has changed
    if (lastEmotionRef.current !== currentEmotion) {
      emotionTransitionRef.current = 0;
      lastEmotionRef.current = currentEmotion;
    } else {
      emotionTransitionRef.current = Math.min(1, emotionTransitionRef.current + deltaTime * 2);
    }

    const microExpressions = {
      subtle_smile: 0,
      slight_frown: 0,
      eyebrow_flash: 0,
      nostril_subtle: 0,
      cheek_lift: 0
    };

    // Emotion-specific micro-expressions (reduced for more natural look)
    switch (currentEmotion) {
      case 'happy':
        microExpressions.subtle_smile = emotionalIntensity * 0.15 * emotionTransitionRef.current; // Reduced from 0.3
        microExpressions.cheek_lift = emotionalIntensity * 0.1; // Reduced from 0.2
        break;

      case 'sad':
        microExpressions.slight_frown = emotionalIntensity * 0.2 * emotionTransitionRef.current; // Reduced from 0.4
        break;

      case 'surprised':
        if (microExpressionTimerRef.current < 0.5) {
          microExpressions.eyebrow_flash = emotionalIntensity * 0.4; // Reduced from 0.8
        }
        break;

      case 'concerned':
        microExpressions.slight_frown = emotionalIntensity * 0.1; // Reduced from 0.2
        microExpressions.eyebrow_flash = Math.sin(microExpressionTimerRef.current * 3) * 0.05 * emotionalIntensity; // Reduced from 0.1
        break;
    }

    return microExpressions;
  };

  // Enhanced frame update with all new features
  useFrame((state, deltaTime) => {
    if (!scene) return;

    // Only apply animations when actually speaking and have lip sync data
    if (!isSpeaking || !lipSyncData || !lipSyncData.mouthShapes) {
      return;
    }

    const EXPRESSIVENESS_BOOST = expressiveness * emotionalRange * 1.5; // Reduced for more natural expressions
    const SMOOTH_FACTOR = 0.15; // Original smooth factor for better control

    // Get current emotion data
    const currentEmotion = lipSyncData.currentEmotion || 'neutral';
    const emotionalIntensity = lipSyncData.emotionalIntensity || 0;

    // Generate micro-expressions if enabled
    const microExpressions = enableMicroExpressions ?
      generateMicroExpressions(currentEmotion, emotionalIntensity, deltaTime) : {};

    // Log for debugging
    if (Math.random() < 0.1) { // Log 10% of frames
      console.log('Lip sync active:', {
        isSpeaking,
        mouthShapes: lipSyncData.mouthShapes,
        openAmount: lipSyncData.mouthShapes?.openAmount,
        expressiveness: EXPRESSIVENESS_BOOST
      });
    }

    scene.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        const dict = child.morphTargetDictionary;
        const influences = child.morphTargetInfluences;
        const mouthShapes = lipSyncData.mouthShapes;
        const expressions = lipSyncData.facialExpressions || {};

        // === MOUTH ANIMATIONS ===
        
        // Primary mouth opening (A, O sounds)
        applyMorphWithTransition(dict, influences, 
          ['mouthOpen', 'mouth_open', 'jawOpen', 'viseme_aa', 'viseme_A'], 
          mouthShapes.openAmount * EXPRESSIVENESS_BOOST, SMOOTH_FACTOR);
        
        // Mouth width (E, I sounds)
        applyMorphWithTransition(dict, influences, 
          ['mouthWide', 'mouth_wide', 'viseme_e', 'viseme_E', 'viseme_I'], 
          mouthShapes.wideAmount * EXPRESSIVENESS_BOOST, SMOOTH_FACTOR);
        
        // Mouth rounding (O, U sounds)
        applyMorphWithTransition(dict, influences, 
          ['mouthFunnel', 'mouth_funnel', 'mouthRound', 'viseme_o', 'viseme_O', 'viseme_U'], 
          mouthShapes.roundAmount * EXPRESSIVENESS_BOOST, SMOOTH_FACTOR);
        
        // Smile (with emotion enhancement)
        let smileIntensity = mouthShapes.smileAmount;
        if (currentEmotion === 'happy') {
          smileIntensity += emotionalIntensity * 0.2; // Reduced from 0.4 for subtlety
        }
        smileIntensity += microExpressions.subtle_smile || 0;
        
        applyMorphWithTransition(dict, influences, 
          ['mouthSmile', 'mouth_smile', 'smile', 'happy'], 
          smileIntensity * EXPRESSIVENESS_BOOST, SMOOTH_FACTOR);

        // Lip pucker (P, B, M sounds)
        applyMorphWithTransition(dict, influences, 
          ['mouthPucker', 'mouth_pucker', 'viseme_p', 'viseme_P', 'viseme_B', 'viseme_M'], 
          mouthShapes.lipPucker * EXPRESSIVENESS_BOOST, SMOOTH_FACTOR);
        
        // Lip press (F, V sounds)
        applyMorphWithTransition(dict, influences, 
          ['mouthPress', 'mouth_press', 'viseme_f', 'viseme_F', 'viseme_V'], 
          mouthShapes.lipPress * EXPRESSIVENESS_BOOST, SMOOTH_FACTOR);

        // Frown (with emotion enhancement)
        let frownIntensity = 0;
        if (currentEmotion === 'sad' || currentEmotion === 'concerned') {
          frownIntensity = emotionalIntensity * 0.15; // Reduced from 0.3 for subtlety
        }
        frownIntensity += microExpressions.slight_frown || 0;
        
        applyMorphWithTransition(dict, influences, 
          ['mouthFrown', 'mouth_frown', 'frown', 'sad'], 
          frownIntensity * EXPRESSIVENESS_BOOST, SMOOTH_FACTOR);

        // === JAW ANIMATIONS ===
        applyMorphWithTransition(dict, influences, 
          ['jawDrop', 'jaw_drop', 'jawOpen', 'jaw_open'], 
          mouthShapes.jawDrop * EXPRESSIVENESS_BOOST, SMOOTH_FACTOR);

        // === EYE AND EYEBROW ANIMATIONS ===
        
        // Eyebrow raise (with emotion and micro-expression enhancement)
        let eyebrowIntensity = expressions.eyebrowRaise;
        if (currentEmotion === 'surprised') {
          eyebrowIntensity += emotionalIntensity * 0.3; // Reduced from 0.6 for subtlety
        } else if (currentEmotion === 'concerned' || currentEmotion === 'questioning') {
          eyebrowIntensity += emotionalIntensity * 0.15; // Reduced from 0.3 for subtlety
        }
        eyebrowIntensity += microExpressions.eyebrow_flash || 0;

        applyMorphWithTransition(dict, influences,
          ['browUp', 'eyebrow_up', 'browRaise', 'surprised', 'browUp_L', 'browUp_R'],
          eyebrowIntensity * EXPRESSIVENESS_BOOST, SMOOTH_FACTOR * 0.8);

        // Eye squint
        applyMorphWithTransition(dict, influences, 
          ['eyeSquint', 'eyes_squint', 'squint', 'eyeSquint_L', 'eyeSquint_R'], 
          expressions.eyeSquint * EXPRESSIVENESS_BOOST, SMOOTH_FACTOR);

        // Enhanced natural blinking
        blinkTimerRef.current += deltaTime;
        let blinkValue = expressions.eyeBlink;
        
        if (enableMicroExpressions) {
          // Natural blink every 3-6 seconds
          const nextBlinkTime = 3 + Math.random() * 3;
          if (blinkTimerRef.current > nextBlinkTime) {
            blinkValue = 1;
            if (blinkTimerRef.current > nextBlinkTime + 0.15) { // Blink duration
              blinkTimerRef.current = 0;
              blinkValue = 0;
            }
          }
          
          // More frequent blinking when nervous/concerned
          if (currentEmotion === 'concerned' && Math.random() > 0.98) {
            blinkValue = 1;
          }
        }
        
        applyMorphWithTransition(dict, influences, 
          ['blink', 'eyesBlink', 'eyeBlink', 'eyeClose', 'blink_L', 'blink_R'], 
          blinkValue, 0.8); // Faster blink response

        // === CHEEK ANIMATIONS ===
        let cheekPuffValue = mouthShapes.cheekPuff || 0;
        cheekPuffValue += microExpressions.cheek_lift || 0;
        
        applyMorphWithTransition(dict, influences, 
          ['cheekPuff', 'cheek_puff', 'cheekBlow', 'cheek_blow'], 
          cheekPuffValue * EXPRESSIVENESS_BOOST, SMOOTH_FACTOR);

        // === NOSTRIL ANIMATIONS ===
        let nostrilValue = mouthShapes.nostrilFlare || 0;
        nostrilValue += microExpressions.nostril_subtle || 0;
        
        applyMorphWithTransition(dict, influences, 
          ['nostrilFlare', 'nostril_flare', 'noseSneer', 'nose_sneer'], 
          nostrilValue * EXPRESSIVENESS_BOOST, SMOOTH_FACTOR);

        // === TONGUE ANIMATIONS ===
        applyMorphWithTransition(dict, influences, 
          ['tongueOut', 'tongue_out', 'viseme_L', 'viseme_T'], 
          (mouthShapes.tongueOut || 0) * EXPRESSIVENESS_BOOST, SMOOTH_FACTOR);

        // === EMOTIONAL OVERLAY MORPHS ===

        // Apply general emotional states if available (reduced for more natural look)
        if (currentEmotion !== 'neutral' && emotionalIntensity > 0.1) {
          const emotionMorphs = {
            'happy': ['happy', 'joy', 'pleased'],
            'sad': ['sad', 'sorrow', 'disappointed'],
            'surprised': ['surprised', 'shock', 'amazed'],
            'concerned': ['worried', 'concerned', 'anxious'],
            'confident': ['confident', 'determined'],
            'questioning': ['confused', 'puzzled', 'curious']
          };

          const morphsForEmotion = emotionMorphs[currentEmotion] || [];
          morphsForEmotion.forEach(morphName => {
            applyMorphWithTransition(dict, influences, [morphName],
              emotionalIntensity * 0.2 * EXPRESSIVENESS_BOOST, SMOOTH_FACTOR * 0.5); // Reduced from 0.4 to 0.2
          });
        }
      }
    });

    // Apply bone-based animations using the existing AvatarAnimations system
    if (animations) {
      animations.applyAnimations(lipSyncData, isSpeaking);
    }
  });



  return (
    <>
      <primitive
        ref={modelRef}
        object={scene}
        scale={1.0}
        position={[0, -0.5, 0]}
        rotation={[0, 0, 0]}
      />

      {/* Enhanced Debug Visualizations */}
      {debugMode && (
        <>
          {/* Mouth shape indicators */}
          <group position={[1.5, 0, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.05, Math.max(0.05, (lipSyncData.mouthShapes?.openAmount || 0) * 1), 0.05]} />
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
            <mesh position={[0.3, 0, 0]}>
              <boxGeometry args={[0.05, Math.max(0.05, (lipSyncData.mouthShapes?.smileAmount || 0) * 1), 0.05]} />
              <meshBasicMaterial color="yellow" />
            </mesh>
            <mesh position={[0.4, 0, 0]}>
              <boxGeometry args={[0.05, Math.max(0.05, (lipSyncData.mouthShapes?.jawDrop || 0) * 1), 0.05]} />
              <meshBasicMaterial color="orange" />
            </mesh>
          </group>

          {/* Emotion indicator */}
          <group position={[-1.5, 0, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.1, Math.max(0.05, (lipSyncData.emotionalIntensity || 0) * 2), 0.05]} />
              <meshBasicMaterial color={
                lipSyncData.currentEmotion === 'happy' ? 'yellow' :
                lipSyncData.currentEmotion === 'sad' ? 'blue' :
                lipSyncData.currentEmotion === 'surprised' ? 'orange' :
                lipSyncData.currentEmotion === 'concerned' ? 'red' :
                'gray'
              } />
            </mesh>
          </group>

          {/* Status indicators */}
          <mesh position={[0, 1, 0]}>
            <sphereGeometry args={[0.05]} />
            <meshBasicMaterial color={isSpeaking ? "green" : "red"} />
          </mesh>

          <mesh position={[0.2, 1, 0]}>
            <sphereGeometry args={[0.05]} />
            <meshBasicMaterial color={currentAudio ? "blue" : "gray"} />
          </mesh>

          <mesh position={[0.4, 1, 0]}>
            <sphereGeometry args={[0.05]} />
            <meshBasicMaterial color={enableMicroExpressions ? "purple" : "gray"} />
          </mesh>
        </>
      )}
    </>
  );
}

export default AvatarModel;