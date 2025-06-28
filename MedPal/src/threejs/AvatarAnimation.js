// AvatarAnimations.js - Enhanced animation system with multiple facial expressions
import * as THREE from "three";

export class AvatarAnimations {
  constructor(scene) {
    this.scene = scene;
    this.bones = {
      jaw: null, head: null, neck: null,
      leftEye: null, rightEye: null,
      leftEyebrow: null, rightEyebrow: null,
      nose: null, leftCheek: null, rightCheek: null,
      upperLip: null, lowerLip: null,
    };
    this.meshes = [];
    this.morphTargets = {};
    this.initialized = false;
    this.smoothingFactors = {
      mouth: 0.15,      // Fast response for mouth
      eyes: 0.3,        // Medium response for eyes
      head: 0.08,       // Slow response for head movement
      eyebrows: 0.2,    // Medium response for eyebrows
    };
    
    this.initialize();
  }

  initialize() {
    if (!this.scene) return;

    console.log("=== AVATAR ANIMATION DEBUG ===");
    
    this.scene.traverse((child) => {
      if (child.isBone) {
        this.categorizeBone(child);
      }
      
      if (child.isMesh) {
        this.meshes.push(child);
        this.analyzeMorphTargets(child);
      }
    });

    this.logFindings();
    this.initialized = true;
  }

  categorizeBone(bone) {
    const name = bone.name.toLowerCase();
    
    // Enhanced bone detection patterns
    const bonePatterns = {
      jaw: ['jaw', 'chin', 'mandible', 'mixamorigjaw', 'cc_base_jawroot', 'jawroot'],
      head: ['head', 'mixamorighead', 'cc_base_head', 'skull'],
      neck: ['neck', 'mixamorigneck', 'cc_base_necktwist'],
      leftEye: ['lefteye', 'eye_l', 'eyeball_l', 'left_eye', 'l_eye'],
      rightEye: ['righteye', 'eye_r', 'eyeball_r', 'right_eye', 'r_eye'],
      leftEyebrow: ['lefteyebrow', 'eyebrow_l', 'brow_l', 'left_brow'],
      rightEyebrow: ['righteyebrow', 'eyebrow_r', 'brow_r', 'right_brow'],
      nose: ['nose', 'nasal', 'nostril'],
      leftCheek: ['leftcheek', 'cheek_l', 'left_cheek'],
      rightCheek: ['rightcheek', 'cheek_r', 'right_cheek'],
      upperLip: ['upperlip', 'lip_upper', 'top_lip'],
      lowerLip: ['lowerlip', 'lip_lower', 'bottom_lip'],
    };

    for (const [boneType, patterns] of Object.entries(bonePatterns)) {
      if (patterns.some(pattern => name.includes(pattern))) {
        this.bones[boneType] = bone;
        console.log(`Found ${boneType.toUpperCase()} bone: ${bone.name}`);
        break;
      }
    }
  }

  analyzeMorphTargets(mesh) {
    if (!mesh.morphTargetDictionary) return;

    const targets = Object.keys(mesh.morphTargetDictionary);
    if (targets.length > 0) {
      this.morphTargets[mesh.name] = {
        mesh: mesh,
        targets: mesh.morphTargetDictionary,
        influences: mesh.morphTargetInfluences
      };
      
      console.log(`Mesh ${mesh.name} morph targets:`, targets);
    }
  }

  logFindings() {
    console.log("=== ANIMATION CAPABILITIES ===");
    const foundBones = Object.entries(this.bones)
      .filter(([key, bone]) => bone !== null)
      .map(([key, bone]) => `${key}: ${bone.name}`);
    
    console.log("Bones found:", foundBones);
    console.log("Morphs found:", Object.keys(this.morphTargets));
  }

  // Apply mouth shape animations
  animateMouthShapes(mouthShapes, smoothing = null) {
    const smooth = smoothing || this.smoothingFactors.mouth;
    
    // Jaw animation
    if (this.bones.jaw) {
      const jawRotation = (mouthShapes.openAmount * 0.4 + mouthShapes.jawDrop * 0.3);
      this.bones.jaw.rotation.x = THREE.MathUtils.lerp(
        this.bones.jaw.rotation.x, 
        jawRotation, 
        smooth
      );
    }

    // Lip animations
    if (this.bones.upperLip) {
      this.bones.upperLip.rotation.x = THREE.MathUtils.lerp(
        this.bones.upperLip.rotation.x,
        -mouthShapes.lipPress * 0.2,
        smooth
      );
    }

    if (this.bones.lowerLip) {
      this.bones.lowerLip.rotation.x = THREE.MathUtils.lerp(
        this.bones.lowerLip.rotation.x,
        mouthShapes.lipPucker * 0.3,
        smooth
      );
    }

    // Cheek animations
    if (this.bones.leftCheek) {
      this.bones.leftCheek.scale.x = THREE.MathUtils.lerp(
        this.bones.leftCheek.scale.x,
        1 + mouthShapes.cheekPuff * 0.3,
        smooth
      );
    }

    if (this.bones.rightCheek) {
      this.bones.rightCheek.scale.x = THREE.MathUtils.lerp(
        this.bones.rightCheek.scale.x,
        1 + mouthShapes.cheekPuff * 0.3,
        smooth
      );
    }

    // Apply morph target animations for mouth shapes
    this.animateMouthMorphTargets(mouthShapes, smooth);
  }

  // Apply facial expression animations
  animateFacialExpressions(expressions, smoothing = null) {
    const smooth = smoothing || this.smoothingFactors.eyes;

    // Eyebrow animations
    if (this.bones.leftEyebrow) {
      this.bones.leftEyebrow.rotation.z = THREE.MathUtils.lerp(
        this.bones.leftEyebrow.rotation.z,
        expressions.eyebrowRaise * 0.3,
        this.smoothingFactors.eyebrows
      );
    }

    if (this.bones.rightEyebrow) {
      this.bones.rightEyebrow.rotation.z = THREE.MathUtils.lerp(
        this.bones.rightEyebrow.rotation.z,
        -expressions.eyebrowRaise * 0.3,
        this.smoothingFactors.eyebrows
      );
    }

    // Eye animations
    if (this.bones.leftEye) {
      this.bones.leftEye.rotation.x = THREE.MathUtils.lerp(
        this.bones.leftEye.rotation.x,
        expressions.eyeSquint * 0.2,
        smooth
      );
    }

    if (this.bones.rightEye) {
      this.bones.rightEye.rotation.x = THREE.MathUtils.lerp(
        this.bones.rightEye.rotation.x,
        expressions.eyeSquint * 0.2,
        smooth
      );
    }

    // Apply facial expression morph targets
    this.animateFacialMorphTargets(expressions, smooth);
  }

  // Apply head and neck animations
  animateHeadMovement(expressions, smoothing = null) {
    const smooth = smoothing || this.smoothingFactors.head;

    if (this.bones.head) {
      // Head nodding
      this.bones.head.rotation.x = THREE.MathUtils.lerp(
        this.bones.head.rotation.x,
        expressions.headNod * 0.2,
        smooth
      );

      // Head tilting
      this.bones.head.rotation.z = THREE.MathUtils.lerp(
        this.bones.head.rotation.z,
        expressions.headTilt * 0.3,
        smooth
      );

      // Subtle head bob
      const time = Date.now() * 0.001;
      const bob = Math.sin(time * 2) * 0.01 * Math.abs(expressions.headNod);
      this.bones.head.position.y = THREE.MathUtils.lerp(
        this.bones.head.position.y,
        bob,
        smooth
      );
    }

    if (this.bones.neck) {
      // Neck movement to support head
      this.bones.neck.rotation.y = THREE.MathUtils.lerp(
        this.bones.neck.rotation.y,
        expressions.headTilt * 0.1,
        smooth
      );
    }
  }

  // Apply mouth-related morph targets
  animateMouthMorphTargets(mouthShapes, smoothing) {
    const mouthMorphMaps = {
      // Vowel sounds
      'A': ['mouthopen', 'mouth_open', 'jawopen', 'jaw_open', 'a', 'aa', 'viseme_aa'],
      'E': ['mouthsmile', 'mouth_smile', 'smile', 'e', 'ee', 'viseme_e'],
      'O': ['mouthfunnel', 'mouth_funnel', 'o', 'oo', 'viseme_o', 'mouthround'],
      'U': ['mouthpucker', 'mouth_pucker', 'pucker', 'u', 'uu', 'viseme_u'],
      'I': ['mouthwide', 'mouth_wide', 'wide', 'i', 'ii', 'viseme_i'],
      
      // Consonant sounds
      'M': ['mouthclose', 'mouth_close', 'lipstogether', 'm', 'p', 'b', 'viseme_p'],
      'F': ['mouthpress', 'mouth_press', 'lippress', 'f', 'v', 'viseme_f'],
      
      // Expressions
      'SMILE': ['smile', 'mouthsmile', 'happy', 'grin'],
      'FROWN': ['frown', 'sad', 'mouthfrown'],
    };

    for (const [meshName, data] of Object.entries(this.morphTargets)) {
      const { targets, influences } = data;
      
      // Apply different mouth shapes based on the mouth shape data
      this.applyMorphTarget(targets, influences, mouthMorphMaps['A'], mouthShapes.openAmount, smoothing);
      this.applyMorphTarget(targets, influences, mouthMorphMaps['E'], mouthShapes.wideAmount, smoothing);
      this.applyMorphTarget(targets, influences, mouthMorphMaps['O'], mouthShapes.roundAmount, smoothing);
      this.applyMorphTarget(targets, influences, mouthMorphMaps['SMILE'], mouthShapes.smileAmount, smoothing);
      this.applyMorphTarget(targets, influences, mouthMorphMaps['M'], mouthShapes.lipPucker, smoothing);
      this.applyMorphTarget(targets, influences, mouthMorphMaps['F'], mouthShapes.lipPress, smoothing);
    }
  }

  // Apply facial expression morph targets
  animateFacialMorphTargets(expressions, smoothing) {
    const facialMorphMaps = {
      'BLINK': ['blink', 'eyesblink', 'eyes_blink', 'eyeclosed', 'eyeclose'],
      'EYEBROW_UP': ['browup', 'eyebrow_up', 'browraise', 'surprised'],
      'SQUINT': ['squint', 'eyesquint', 'narrow', 'eyesnarrow'],
    };

    for (const [meshName, data] of Object.entries(this.morphTargets)) {
      const { targets, influences } = data;
      
      this.applyMorphTarget(targets, influences, facialMorphMaps['BLINK'], expressions.eyeBlink, 0.8);
      this.applyMorphTarget(targets, influences, facialMorphMaps['EYEBROW_UP'], expressions.eyebrowRaise, smoothing);
      this.applyMorphTarget(targets, influences, facialMorphMaps['SQUINT'], expressions.eyeSquint, smoothing);
    }
  }

  // Helper function to apply morph targets
  applyMorphTarget(targets, influences, morphNames, value, smoothing) {
    if (!targets || !influences || !morphNames) return;

    for (const morphName of morphNames) {
      // Try exact match
      if (targets[morphName] !== undefined) {
        const index = targets[morphName];
        influences[index] = THREE.MathUtils.lerp(influences[index], value, smoothing);
        return; // Only apply one morph per category
      }

      // Try case-insensitive match
      const matchedKey = Object.keys(targets).find(key => 
        key.toLowerCase() === morphName.toLowerCase()
      );
      
      if (matchedKey) {
        const index = targets[matchedKey];
        influences[index] = THREE.MathUtils.lerp(influences[index], value, smoothing);
        return;
      }
    }
  }

  // Reset all animations to neutral
  resetToNeutral(smoothing = 0.1) {
    // Reset bones
    Object.values(this.bones).forEach(bone => {
      if (bone) {
        bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, 0, smoothing);
        bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, 0, smoothing);
        bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, 0, smoothing);
        bone.position.y = THREE.MathUtils.lerp(bone.position.y, 0, smoothing);
        
        if (bone.scale) {
          bone.scale.x = THREE.MathUtils.lerp(bone.scale.x, 1, smoothing);
          bone.scale.y = THREE.MathUtils.lerp(bone.scale.y, 1, smoothing);
          bone.scale.z = THREE.MathUtils.lerp(bone.scale.z, 1, smoothing);
        }
      }
    });

    // Reset morph targets
    for (const [meshName, data] of Object.entries(this.morphTargets)) {
      const { influences } = data;
      if (influences) {
        influences.forEach((influence, index) => {
          influences[index] = THREE.MathUtils.lerp(influence, 0, smoothing);
        });
      }
    }
  }

  // Apply all animations at once (updated for new lip sync data structure)
  applyAnimations(lipSyncData, isSpeaking) {
    if (!this.initialized) return;

    if (isSpeaking) {
      // Check if using new enhanced lip sync data structure
      if (lipSyncData.mouthShapes && lipSyncData.facialExpressions) {
        // New enhanced structure
        this.animateMouthShapes(lipSyncData.mouthShapes);
        this.animateFacialExpressions(lipSyncData.facialExpressions);
        this.animateHeadMovement(lipSyncData.facialExpressions);
      } else {
        // Backward compatibility with old structure
        const legacyMouthShapes = {
          openAmount: lipSyncData.mouthOpenAmount || 0,
          wideAmount: lipSyncData.mouthOpenAmount * 0.3 || 0,
          roundAmount: lipSyncData.mouthOpenAmount * 0.4 || 0,
          smileAmount: 0,
          jawDrop: lipSyncData.jawMovement || 0,
          lipPucker: 0,
          lipPress: 0,
          cheekPuff: 0,
          tongueOut: 0,
          nostrilFlare: 0,
        };

        const legacyExpressions = {
          eyebrowRaise: 0,
          eyeSquint: 0,
          eyeBlink: lipSyncData.eyeBlink || 0,
          headTilt: lipSyncData.headTilt || 0,
          headNod: lipSyncData.headBob || 0,
        };

        this.animateMouthShapes(legacyMouthShapes);
        this.animateFacialExpressions(legacyExpressions);
        this.animateHeadMovement(legacyExpressions);
      }
    } else {
      this.resetToNeutral();
    }
  }

  // Get debug info
  getDebugInfo() {
    return {
      initialized: this.initialized,
      bonesFound: Object.entries(this.bones)
        .filter(([key, bone]) => bone !== null)
        .map(([key, bone]) => `${key}: ${bone.name}`),
      morphTargetMeshes: Object.keys(this.morphTargets),
      totalMorphTargets: Object.values(this.morphTargets).reduce(
        (total, data) => total + Object.keys(data.targets).length, 0
      ),
      smoothingFactors: this.smoothingFactors,
    };
  }

  // Adjust expressiveness dynamically
  setExpressiveness(level) {
    // Adjust smoothing factors based on expressiveness level
    const baseSmoothness = 0.15;
    const factor = Math.max(0.1, Math.min(2.0, level)); // Clamp between 0.1 and 2.0
    
    this.smoothingFactors = {
      mouth: baseSmoothness / factor,      // More expressive = faster response
      eyes: (baseSmoothness * 2) / factor,
      head: (baseSmoothness * 0.5) / factor,
      eyebrows: (baseSmoothness * 1.3) / factor,
    };
    
    console.log(`Expressiveness set to ${level}, smoothing factors:`, this.smoothingFactors);
  }
}