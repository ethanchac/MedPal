// useLipSync.js - Enhanced lip sync with multiple mouth shapes and expressions
import { useState, useEffect, useRef } from 'react';

export function useLipSync(isPlaying, audioData = null, expressiveness = 1.0) {
  const [mouthShapes, setMouthShapes] = useState({
    // Basic mouth positions
    openAmount: 0,        // General mouth opening (A, E, I, O, U)
    wideAmount: 0,        // Mouth width (E, I sounds)
    roundAmount: 0,       // Mouth rounding (O, U sounds)
    smileAmount: 0,       // Slight smile for certain sounds
    
    // Jaw and lip positions
    jawDrop: 0,           // Lower jaw movement
    lipPucker: 0,         // Lip puckering (P, B, M sounds)
    lipPress: 0,          // Lip compression
    
    // Additional facial expressions
    cheekPuff: 0,         // Cheek inflation
    tongueOut: 0,         // Tongue visibility
    nostrilFlare: 0,      // Nostril movement for breathing
  });

  const [facialExpressions, setFacialExpressions] = useState({
    eyebrowRaise: 0,      // Eyebrow movement for emphasis
    eyeSquint: 0,         // Eye squinting for certain sounds
    eyeBlink: 0,          // Natural blinking
    headTilt: 0,          // Head movement
    headNod: 0,           // Nodding for emphasis
  });

  const animationRef = useRef();
  const audioContextRef = useRef();
  const analyserRef = useRef();
  const dataArrayRef = useRef();
  const vowelCycleRef = useRef(0);
  const expressionIntensityRef = useRef(expressiveness);

  useEffect(() => {
    expressionIntensityRef.current = expressiveness;
  }, [expressiveness]);

  useEffect(() => {
    if (isPlaying && audioData) {
      setupAudioAnalysis(audioData);
    } else if (isPlaying) {
      startExpressiveLipSync();
    } else {
      stopLipSync();
    }

    return () => stopLipSync();
  }, [isPlaying, audioData]);

  const setupAudioAnalysis = (audio) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(audio);
      
      analyser.fftSize = 512; // Higher resolution for better analysis
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      startAudioBasedExpressiveLipSync();
    } catch (error) {
      console.warn('Audio analysis failed, using expressive lip sync:', error);
      startExpressiveLipSync();
    }
  };

  const startAudioBasedExpressiveLipSync = () => {
    const animate = () => {
      if (!isPlaying) return;

      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;
      
      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        
        // Analyze different frequency ranges for different mouth shapes
        const lowFreq = getFrequencyAverage(dataArray, 80, 250);    // Low frequencies (jaw movement)
        const midFreq = getFrequencyAverage(dataArray, 250, 2000);  // Mid frequencies (vowels)
        const highFreq = getFrequencyAverage(dataArray, 2000, 8000); // High frequencies (consonants)
        
        const intensity = expressionIntensityRef.current;
        
        // Map frequencies to mouth shapes
        const newMouthShapes = {
          openAmount: Math.min(1, (lowFreq + midFreq) * 0.8 * intensity),
          wideAmount: Math.min(1, highFreq * 0.6 * intensity),
          roundAmount: Math.min(1, lowFreq * 0.7 * intensity),
          smileAmount: Math.min(0.3, highFreq * 0.2 * intensity),
          
          jawDrop: Math.min(1, lowFreq * 0.5 * intensity),
          lipPucker: Math.min(1, (lowFreq * 0.3) * intensity),
          lipPress: Math.min(1, (highFreq * 0.4) * intensity),
          
          cheekPuff: Math.min(0.5, midFreq * 0.2 * intensity),
          tongueOut: Math.min(0.3, highFreq * 0.1 * intensity),
          nostrilFlare: Math.min(0.4, (lowFreq + midFreq) * 0.1 * intensity),
        };

        // Facial expressions based on audio intensity
        const overallIntensity = (lowFreq + midFreq + highFreq) / 3;
        const newFacialExpressions = {
          eyebrowRaise: Math.min(0.6, overallIntensity * 0.3 * intensity),
          eyeSquint: Math.min(0.4, highFreq * 0.2 * intensity),
          eyeBlink: Math.random() > 0.95 ? 1 : 0, // Random blinking
          headTilt: Math.sin(Date.now() * 0.001) * 0.1 * overallIntensity * intensity,
          headNod: Math.sin(Date.now() * 0.002) * 0.15 * overallIntensity * intensity,
        };

        setMouthShapes(newMouthShapes);
        setFacialExpressions(newFacialExpressions);
      }

      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };

  const startExpressiveLipSync = () => {
    let time = 0;
    const animate = () => {
      if (!isPlaying) return;

      time += 0.08;
      vowelCycleRef.current += 0.05;
      
      const intensity = expressionIntensityRef.current;
      
      // Create varied mouth shapes simulating different phonemes
      const baseIntensity = Math.abs(Math.sin(time * 4)) * 0.8;
      const vowelCycle = Math.sin(vowelCycleRef.current);
      const consonantBurst = Math.abs(Math.sin(time * 12)) * 0.4;
      
      // Simulate different vowel sounds
      const aSound = Math.max(0, Math.sin(time * 3)) * 0.8;        // Open mouth (A)
      const eSound = Math.max(0, Math.sin(time * 5 + 1)) * 0.6;    // Wide mouth (E)
      const oSound = Math.max(0, Math.sin(time * 4 + 2)) * 0.7;    // Round mouth (O)
      const iSound = Math.max(0, Math.sin(time * 6 + 3)) * 0.5;    // Slight smile (I)
      
      // Simulate consonant sounds
      const pSound = Math.abs(Math.sin(time * 15)) > 0.8 ? 1 : 0;  // Lip closure (P, B, M)
      const fSound = Math.abs(Math.sin(time * 18)) > 0.7 ? 1 : 0;  // Lip bite (F, V)
      
      const newMouthShapes = {
        openAmount: (aSound * 0.4 + eSound * 0.2 + oSound * 0.3 + baseIntensity * 0.3) * intensity,
        wideAmount: (eSound * 0.6 + iSound * 0.4 + consonantBurst * 0.2) * intensity,
        roundAmount: (oSound * 0.7 + baseIntensity * 0.2) * intensity,
        smileAmount: (iSound * 0.3 + Math.abs(Math.sin(time * 2)) * 0.1) * intensity,
        
        jawDrop: (aSound * 0.5 + oSound * 0.3 + baseIntensity * 0.2) * intensity,
        lipPucker: (pSound * 0.8 + oSound * 0.3) * intensity,
        lipPress: (fSound * 0.6 + consonantBurst * 0.3) * intensity,
        
        cheekPuff: Math.abs(Math.sin(time * 7)) * 0.2 * intensity,
        tongueOut: Math.abs(Math.sin(time * 20)) > 0.9 ? 0.3 * intensity : 0,
        nostrilFlare: baseIntensity * 0.15 * intensity,
      };

      // More expressive facial animations
      const emotionalIntensity = Math.abs(Math.sin(time * 0.5)) * 0.3;
      const newFacialExpressions = {
        eyebrowRaise: (emotionalIntensity + baseIntensity * 0.2) * intensity,
        eyeSquint: Math.abs(Math.sin(time * 8)) * 0.3 * intensity,
        eyeBlink: Math.random() > 0.97 ? 1 : 0,
        headTilt: Math.sin(time * 1.5) * 0.08 * intensity,
        headNod: Math.sin(time * 2.2) * 0.12 * intensity,
      };

      setMouthShapes(newMouthShapes);
      setFacialExpressions(newFacialExpressions);

      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };

  const getFrequencyAverage = (dataArray, startFreq, endFreq) => {
    const nyquist = 22050; // Assuming 44.1kHz sample rate
    const startIndex = Math.floor((startFreq / nyquist) * dataArray.length);
    const endIndex = Math.floor((endFreq / nyquist) * dataArray.length);
    
    let sum = 0;
    for (let i = startIndex; i < endIndex; i++) {
      sum += dataArray[i];
    }
    
    return Math.min(1, (sum / (endIndex - startIndex)) / 128);
  };

  const stopLipSync = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Smoothly return to neutral
    setMouthShapes({
      openAmount: 0, wideAmount: 0, roundAmount: 0, smileAmount: 0,
      jawDrop: 0, lipPucker: 0, lipPress: 0,
      cheekPuff: 0, tongueOut: 0, nostrilFlare: 0,
    });
    
    setFacialExpressions({
      eyebrowRaise: 0, eyeSquint: 0, eyeBlink: 0,
      headTilt: 0, headNod: 0,
    });
  };

  return { 
    mouthShapes, 
    facialExpressions,
    // Convenience getters for backward compatibility
    mouthOpenAmount: mouthShapes.openAmount,
    jawMovement: mouthShapes.jawDrop,
    headBob: facialExpressions.headNod,
    eyeBlink: facialExpressions.eyeBlink,
    headTilt: facialExpressions.headTilt,
  };
}