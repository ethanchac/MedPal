// Enhanced useLipSync.js - More human-like expressions with emotion detection
import { useState, useEffect, useRef } from 'react';

// Advanced phoneme mapping for more realistic lip sync
const VISEME_MAPPING = {
  // Vowels with precise mouth shapes
  'A': { open: 0.8, wide: 0.3, round: 0.1, smile: 0.0, jawDrop: 0.6 },
  'E': { open: 0.4, wide: 0.8, round: 0.0, smile: 0.4, jawDrop: 0.2 },
  'I': { open: 0.2, wide: 0.9, round: 0.0, smile: 0.6, jawDrop: 0.1 },
  'O': { open: 0.7, wide: 0.1, round: 0.9, smile: 0.0, jawDrop: 0.4 },
  'U': { open: 0.3, wide: 0.0, round: 1.0, smile: 0.0, jawDrop: 0.2 },
  
  // Consonants with specific lip/tongue positions
  'M': { open: 0.0, wide: 0.0, round: 0.0, lipPucker: 1.0, lipPress: 0.8 },
  'P': { open: 0.0, wide: 0.0, round: 0.0, lipPucker: 1.0, lipPress: 1.0 },
  'B': { open: 0.0, wide: 0.0, round: 0.0, lipPucker: 0.8, lipPress: 0.9 },
  'F': { open: 0.2, wide: 0.0, round: 0.0, lipPress: 1.0, jawDrop: 0.1 },
  'V': { open: 0.2, wide: 0.0, round: 0.0, lipPress: 0.9, jawDrop: 0.1 },
  'TH': { open: 0.3, wide: 0.2, round: 0.0, tongueOut: 0.6, jawDrop: 0.2 },
  'S': { open: 0.1, wide: 0.4, round: 0.0, lipPress: 0.3, jawDrop: 0.0 },
  'SH': { open: 0.2, wide: 0.1, round: 0.6, lipPucker: 0.4, jawDrop: 0.1 },
  'CH': { open: 0.2, wide: 0.2, round: 0.3, lipPress: 0.5, jawDrop: 0.1 },
  'L': { open: 0.3, wide: 0.3, round: 0.0, tongueOut: 0.4, jawDrop: 0.2 },
  'R': { open: 0.4, wide: 0.2, round: 0.3, jawDrop: 0.3 },
  'N': { open: 0.2, wide: 0.2, round: 0.0, jawDrop: 0.1 },
  'T': { open: 0.1, wide: 0.2, round: 0.0, tongueOut: 0.3, jawDrop: 0.1 },
  'D': { open: 0.2, wide: 0.2, round: 0.0, tongueOut: 0.2, jawDrop: 0.2 },
  'K': { open: 0.3, wide: 0.1, round: 0.0, jawDrop: 0.2 },
  'G': { open: 0.3, wide: 0.1, round: 0.0, jawDrop: 0.3 },
};

// Emotion keywords for contextual expressions
const EMOTION_KEYWORDS = {
  happy: ['happy', 'glad', 'great', 'wonderful', 'excellent', 'amazing', 'fantastic', 'good', 'love', 'enjoy'],
  sad: ['sad', 'sorry', 'unfortunately', 'regret', 'disappointed', 'terrible', 'awful', 'bad', 'worse'],
  surprised: ['wow', 'amazing', 'incredible', 'unbelievable', 'shocking', 'surprising', 'sudden'],
  concerned: ['worried', 'concerned', 'careful', 'warning', 'dangerous', 'risk', 'problem', 'issue'],
  confident: ['sure', 'certain', 'definitely', 'absolutely', 'confident', 'strong', 'powerful'],
  questioning: ['maybe', 'perhaps', 'possibly', 'might', 'could', 'uncertain', 'wonder', '?']
};

export function useLipSync(isPlaying, audioData = null, expressiveness = 1.0, currentText = '') {
  const [mouthShapes, setMouthShapes] = useState({
    openAmount: 0, wideAmount: 0, roundAmount: 0, smileAmount: 0,
    jawDrop: 0, lipPucker: 0, lipPress: 0, cheekPuff: 0,
    tongueOut: 0, nostrilFlare: 0
  });

  const [facialExpressions, setFacialExpressions] = useState({
    eyebrowRaise: 0, eyeSquint: 0, eyeBlink: 0,
    headTilt: 0, headNod: 0, emotionalIntensity: 0
  });

  const animationRef = useRef();
  const audioContextRef = useRef();
  const analyserRef = useRef();
  const dataArrayRef = useRef();
  const textAnalysisRef = useRef({ emotion: 'neutral', intensity: 0 });
  const phoneSequenceRef = useRef([]);
  const currentPhonemeRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);
  const breathingCycleRef = useRef(0);

  // Analyze text for emotional context
  const analyzeTextEmotion = (text) => {
    if (!text) return { emotion: 'neutral', intensity: 0 };

    const words = text.toLowerCase().split(/\s+/);
    const emotions = {};
    
    // Count emotion keywords
    Object.entries(EMOTION_KEYWORDS).forEach(([emotion, keywords]) => {
      emotions[emotion] = keywords.filter(keyword => 
        words.some(word => word.includes(keyword))
      ).length;
    });

    // Find dominant emotion
    const dominantEmotion = Object.entries(emotions)
      .reduce((a, b) => emotions[a[0]] > emotions[b[0]] ? a : b)[0];
    
    const intensity = Math.min(1, emotions[dominantEmotion] / Math.max(1, words.length / 10));
    
    return { emotion: dominantEmotion, intensity };
  };

  // Enhanced phoneme sequence generation with timing
  const generatePhonemeSequence = (text) => {
    if (!text) return [];
    
    const words = text.toLowerCase().match(/[a-z]+/g) || [];
    const sequence = [];
    
    words.forEach((word, wordIndex) => {
      // Simple phoneme mapping (in real app, use a proper phoneme library)
      const phonemes = word.split('').map(char => {
        const vowels = { a: 'A', e: 'E', i: 'I', o: 'O', u: 'U' };
        const consonants = {
          m: 'M', p: 'P', b: 'B', f: 'F', v: 'V',
          s: 'S', z: 'S', t: 'T', d: 'D', n: 'N',
          l: 'L', r: 'R', k: 'K', g: 'G', h: 'A'
        };
        return vowels[char] || consonants[char] || 'A';
      });
      
      phonemes.forEach((phoneme, index) => {
        sequence.push({
          phoneme,
          duration: 0.1 + Math.random() * 0.1, // Variable timing
          emphasis: wordIndex === 0 || index === 0 ? 1.2 : 1.0,
          position: sequence.length
        });
      });
      
      // Add pause between words
      if (wordIndex < words.length - 1) {
        sequence.push({
          phoneme: 'PAUSE',
          duration: 0.15,
          emphasis: 0.5,
          position: sequence.length
        });
      }
    });
    
    return sequence;
  };

  // Enhanced audio analysis with frequency-based phoneme detection
  const analyzeAudioForPhonemes = (analyser, dataArray) => {
    analyser.getByteFrequencyData(dataArray);
    
    // Frequency ranges for phoneme detection
    const lowFreq = getFrequencyRange(dataArray, 80, 300);    // Jaw movement
    const midLowFreq = getFrequencyRange(dataArray, 300, 800);  // Vowel formants
    const midFreq = getFrequencyRange(dataArray, 800, 2000);   // Consonant clarity
    const highFreq = getFrequencyRange(dataArray, 2000, 6000); // Fricatives
    const veryHighFreq = getFrequencyRange(dataArray, 6000, 12000); // Sibilants
    
    // Detect likely phoneme based on frequency distribution
    let detectedPhoneme = 'A';
    if (veryHighFreq > 0.6) detectedPhoneme = 'S';
    else if (highFreq > 0.5) detectedPhoneme = 'F';
    else if (midFreq > 0.4 && lowFreq < 0.3) detectedPhoneme = 'E';
    else if (lowFreq > 0.6) detectedPhoneme = 'A';
    else if (midLowFreq > 0.5 && lowFreq > 0.3) detectedPhoneme = 'O';
    
    return {
      phoneme: detectedPhoneme,
      intensity: (lowFreq + midFreq + highFreq) / 3,
      formantRatio: midLowFreq / Math.max(0.1, lowFreq)
    };
  };

  const getFrequencyRange = (dataArray, startFreq, endFreq) => {
    const nyquist = 22050;
    const startIndex = Math.floor((startFreq / nyquist) * dataArray.length);
    const endIndex = Math.floor((endFreq / nyquist) * dataArray.length);
    
    let sum = 0;
    for (let i = startIndex; i < endIndex; i++) {
      sum += dataArray[i];
    }
    return Math.min(1, (sum / (endIndex - startIndex)) / 128);
  };

  // Apply emotional modulation to base expressions
  const applyEmotionalModulation = (baseShapes, baseExpressions, emotion, intensity) => {
    const modulation = {
      happy: {
        smileAmount: 0.4 * intensity,
        eyebrowRaise: 0.2 * intensity,
        cheekPuff: 0.2 * intensity,
        eyeSquint: 0.1 * intensity
      },
      sad: {
        smileAmount: -0.3 * intensity,
        eyebrowRaise: -0.2 * intensity,
        jawDrop: 0.1 * intensity,
        eyeSquint: 0.2 * intensity
      },
      surprised: {
        eyebrowRaise: 0.6 * intensity,
        openAmount: 0.2 * intensity,
        eyeSquint: -0.2 * intensity,
        jawDrop: 0.3 * intensity
      },
      concerned: {
        eyebrowRaise: 0.3 * intensity,
        eyeSquint: 0.3 * intensity,
        lipPress: 0.2 * intensity,
        headTilt: 0.1 * intensity
      },
      confident: {
        smileAmount: 0.2 * intensity,
        eyebrowRaise: 0.1 * intensity,
        headNod: 0.2 * intensity
      },
      questioning: {
        eyebrowRaise: 0.4 * intensity,
        headTilt: 0.3 * intensity,
        smileAmount: 0.1 * intensity
      }
    };

    const emotionMod = modulation[emotion] || {};
    
    return {
      mouthShapes: {
        ...baseShapes,
        smileAmount: Math.max(0, Math.min(1, baseShapes.smileAmount + (emotionMod.smileAmount || 0))),
        openAmount: Math.max(0, Math.min(1, baseShapes.openAmount + (emotionMod.openAmount || 0))),
        jawDrop: Math.max(0, Math.min(1, baseShapes.jawDrop + (emotionMod.jawDrop || 0))),
        lipPress: Math.max(0, Math.min(1, baseShapes.lipPress + (emotionMod.lipPress || 0))),
        cheekPuff: Math.max(0, Math.min(1, baseShapes.cheekPuff + (emotionMod.cheekPuff || 0)))
      },
      expressions: {
        ...baseExpressions,
        eyebrowRaise: Math.max(0, Math.min(1, baseExpressions.eyebrowRaise + (emotionMod.eyebrowRaise || 0))),
        eyeSquint: Math.max(0, Math.min(1, baseExpressions.eyeSquint + (emotionMod.eyeSquint || 0))),
        headTilt: Math.max(-0.5, Math.min(0.5, baseExpressions.headTilt + (emotionMod.headTilt || 0))),
        headNod: Math.max(-0.5, Math.min(0.5, baseExpressions.headNod + (emotionMod.headNod || 0))),
        emotionalIntensity: intensity
      }
    };
  };

  // Enhanced breathing animation with emotional influence
  const addBreathingAnimation = (expressions, emotion, intensity) => {
    breathingCycleRef.current += 0.02;
    const breathingBase = Math.sin(breathingCycleRef.current) * 0.03;
    
    // Emotional breathing patterns
    const breathingModifiers = {
      happy: 1.2,    // Slightly faster, deeper breathing
      sad: 0.8,      // Slower, shallower breathing
      surprised: 1.5, // Quick, shallow breathing
      concerned: 0.9, // Controlled breathing
      confident: 1.1  // Strong, steady breathing
    };
    
    const modifier = breathingModifiers[emotion] || 1.0;
    const breathingEffect = breathingBase * modifier * (1 + intensity * 0.5);
    
    return {
      ...expressions,
      headNod: expressions.headNod + breathingEffect,
      nostrilFlare: Math.max(0, breathingEffect * 2)
    };
  };

  // Main animation loop with enhanced features
  useEffect(() => {
    if (isPlaying) {
      // Analyze text for emotional context
      textAnalysisRef.current = analyzeTextEmotion(currentText);
      phoneSequenceRef.current = generatePhonemeSequence(currentText);
      
      if (audioData) {
        setupEnhancedAudioAnalysis(audioData);
      } else {
        startEnhancedPhonemeSequence();
      }
    } else {
      stopLipSync();
    }

    return () => stopLipSync();
  }, [isPlaying, audioData, currentText]);

  const setupEnhancedAudioAnalysis = (audio) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(audio);
      
      analyser.fftSize = 1024; // Higher resolution
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      
      startAudioDrivenAnimation();
    } catch (error) {
      console.warn('Enhanced audio analysis failed:', error);
      startEnhancedPhonemeSequence();
    }
  };

  const startAudioDrivenAnimation = () => {
    const animate = () => {
      if (!isPlaying) return;

      const currentTime = Date.now();
      const deltaTime = currentTime - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = currentTime;

      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;
      
      if (analyser && dataArray) {
        // Get audio-based phoneme detection
        const audioPhoneme = analyzeAudioForPhonemes(analyser, dataArray);
        
        // Get base mouth shapes from detected phoneme
        const viseme = VISEME_MAPPING[audioPhoneme.phoneme] || VISEME_MAPPING['A'];
        const intensity = expressiveness * audioPhoneme.intensity;
        
        const baseMouthShapes = {
          openAmount: (viseme.open || 0) * intensity,
          wideAmount: (viseme.wide || 0) * intensity,
          roundAmount: (viseme.round || 0) * intensity,
          smileAmount: (viseme.smile || 0) * intensity,
          jawDrop: (viseme.jawDrop || 0) * intensity,
          lipPucker: (viseme.lipPucker || 0) * intensity,
          lipPress: (viseme.lipPress || 0) * intensity,
          cheekPuff: (viseme.cheekPuff || 0) * intensity,
          tongueOut: (viseme.tongueOut || 0) * intensity,
          nostrilFlare: audioPhoneme.intensity * 0.2 * expressiveness
        };

        const baseExpressions = {
          eyebrowRaise: audioPhoneme.intensity * 0.3 * expressiveness,
          eyeSquint: Math.abs(Math.sin(currentTime * 0.01)) * 0.2 * expressiveness,
          eyeBlink: Math.random() > 0.98 ? 1 : 0,
          headTilt: Math.sin(currentTime * 0.002) * 0.1 * audioPhoneme.intensity * expressiveness,
          headNod: Math.sin(currentTime * 0.003) * 0.15 * audioPhoneme.intensity * expressiveness
        };

        // Apply emotional modulation
        const { emotion, intensity: emotionIntensity } = textAnalysisRef.current;
        const modulated = applyEmotionalModulation(baseMouthShapes, baseExpressions, emotion, emotionIntensity);
        
        // Add breathing animation
        const finalExpressions = addBreathingAnimation(modulated.expressions, emotion, emotionIntensity);

        setMouthShapes(modulated.mouthShapes);
        setFacialExpressions(finalExpressions);
      }

      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };

  const startEnhancedPhonemeSequence = () => {
    let sequenceTime = 0;
    currentPhonemeRef.current = 0;
    
    const animate = () => {
      if (!isPlaying) return;

      const currentTime = Date.now();
      const deltaTime = (currentTime - lastUpdateTimeRef.current) / 1000;
      lastUpdateTimeRef.current = currentTime;
      sequenceTime += deltaTime;

      const sequence = phoneSequenceRef.current;
      if (sequence.length > 0) {
        // Find current phoneme in sequence
        let timeAccumulator = 0;
        let currentPhonemeData = sequence[0];
        
        for (let i = 0; i < sequence.length; i++) {
          if (sequenceTime >= timeAccumulator && sequenceTime < timeAccumulator + sequence[i].duration) {
            currentPhonemeData = sequence[i];
            break;
          }
          timeAccumulator += sequence[i].duration;
        }

        // Reset sequence if completed
        if (sequenceTime > timeAccumulator) {
          sequenceTime = 0;
        }

        const { phoneme, emphasis } = currentPhonemeData;
        const viseme = VISEME_MAPPING[phoneme] || VISEME_MAPPING['A'];
        const intensity = expressiveness * emphasis;

        const baseMouthShapes = {
          openAmount: (viseme.open || 0) * intensity,
          wideAmount: (viseme.wide || 0) * intensity,
          roundAmount: (viseme.round || 0) * intensity,
          smileAmount: (viseme.smile || 0) * intensity,
          jawDrop: (viseme.jawDrop || 0) * intensity,
          lipPucker: (viseme.lipPucker || 0) * intensity,
          lipPress: (viseme.lipPress || 0) * intensity,
          cheekPuff: (viseme.cheekPuff || 0) * intensity,
          tongueOut: (viseme.tongueOut || 0) * intensity,
          nostrilFlare: intensity * 0.15
        };

        const baseExpressions = {
          eyebrowRaise: emphasis * 0.2 * expressiveness,
          eyeSquint: Math.abs(Math.sin(currentTime * 0.008)) * 0.25 * expressiveness,
          eyeBlink: Math.random() > 0.97 ? 1 : 0,
          headTilt: Math.sin(currentTime * 0.002) * 0.08 * expressiveness,
          headNod: Math.sin(currentTime * 0.0025) * 0.12 * emphasis * expressiveness
        };

        // Apply emotional modulation
        const { emotion, intensity: emotionIntensity } = textAnalysisRef.current;
        const modulated = applyEmotionalModulation(baseMouthShapes, baseExpressions, emotion, emotionIntensity);
        
        // Add breathing animation
        const finalExpressions = addBreathingAnimation(modulated.expressions, emotion, emotionIntensity);

        setMouthShapes(modulated.mouthShapes);
        setFacialExpressions(finalExpressions);
      }

      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };

  const stopLipSync = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Smooth transition to neutral
    setMouthShapes({
      openAmount: 0, wideAmount: 0, roundAmount: 0, smileAmount: 0,
      jawDrop: 0, lipPucker: 0, lipPress: 0, cheekPuff: 0,
      tongueOut: 0, nostrilFlare: 0
    });
    
    setFacialExpressions({
      eyebrowRaise: 0, eyeSquint: 0, eyeBlink: 0,
      headTilt: 0, headNod: 0, emotionalIntensity: 0
    });
  };

  return { 
    mouthShapes, 
    facialExpressions,
    // Backward compatibility
    mouthOpenAmount: mouthShapes.openAmount,
    jawMovement: mouthShapes.jawDrop,
    headBob: facialExpressions.headNod,
    eyeBlink: facialExpressions.eyeBlink,
    headTilt: facialExpressions.headTilt,
    // Enhanced data
    currentEmotion: textAnalysisRef.current.emotion,
    emotionalIntensity: textAnalysisRef.current.intensity
  };
}