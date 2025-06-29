import { useState, useRef, useEffect, useCallback } from 'react';

export const useSpeechRecognition = (onTranscript, onSpeechStart, onSpeechEnd, onInterimTranscript, isConversationalMode = false) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [confidence, setConfidence] = useState(0);

  const recognitionRef = useRef(null);
  const isManuallyStoppedRef = useRef(false);
  const lastSpeechTimeRef = useRef(0);
  const speechTimeoutRef = useRef(null);
  const currentTranscriptRef = useRef('');
  const silenceTimeoutRef = useRef(null);
  const voiceActivityRef = useRef(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const voiceDetectionRef = useRef(null);

  // Voice activity detection using Web Audio API
  const initVoiceActivityDetection = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.3;
      microphoneRef.current.connect(analyserRef.current);
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const detectVoiceActivity = () => {
        if (!analyserRef.current || isPaused) {
          voiceDetectionRef.current = requestAnimationFrame(detectVoiceActivity);
          return;
        }
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate RMS (Root Mean Square) for voice detection
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / bufferLength);
        
        // Focus on speech frequency range (300Hz - 3400Hz)
        const speechStart = Math.floor(300 * bufferLength / (audioContextRef.current.sampleRate / 2));
        const speechEnd = Math.floor(3400 * bufferLength / (audioContextRef.current.sampleRate / 2));
        
        let speechEnergy = 0;
        for (let i = speechStart; i < speechEnd && i < bufferLength; i++) {
          speechEnergy += dataArray[i];
        }
        speechEnergy /= (speechEnd - speechStart);
        
        // Dynamic threshold based on background noise
        const threshold = 25; // Adjust based on testing
        const isVoiceActive = speechEnergy > threshold && rms > 15;
        
        if (isVoiceActive !== voiceActivityRef.current) {
          voiceActivityRef.current = isVoiceActive;
          
          if (isVoiceActive) {
            lastSpeechTimeRef.current = Date.now();
            if (!isSpeaking) {
              setIsSpeaking(true);
              if (onSpeechStart) {
                onSpeechStart();
              }
            }
            
            // Clear silence timeout
            if (silenceTimeoutRef.current) {
              clearTimeout(silenceTimeoutRef.current);
              silenceTimeoutRef.current = null;
            }
          } else {
            // Start silence detection
            if (silenceTimeoutRef.current) {
              clearTimeout(silenceTimeoutRef.current);
            }
            
            silenceTimeoutRef.current = setTimeout(() => {
              if (!voiceActivityRef.current) {
                setIsSpeaking(false);
                // Only submit transcript in conversational mode
                if (isConversationalMode && currentTranscriptRef.current.trim() && onTranscript) {
                  onTranscript(currentTranscriptRef.current.trim());
                  currentTranscriptRef.current = '';
                }
                if (onSpeechEnd) {
                  onSpeechEnd();
                }
              }
            }, isConversationalMode ? 3000 : 500); // Much shorter timeout for normal mode
          }
        }
        
        voiceDetectionRef.current = requestAnimationFrame(detectVoiceActivity);
      };
      
      detectVoiceActivity();
    } catch (error) {
      console.error('Voice activity detection failed:', error);
    }
  }, [isPaused, isSpeaking, onSpeechStart, onSpeechEnd, onTranscript]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      recognitionRef.current = new SpeechRecognition();
      // Optimize recognition settings
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;
      
      recognitionRef.current.onresult = (event) => {
        if (isPaused) return;

        let finalTranscript = '';
        let interimTranscript = '';
        let maxConfidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence || 0;
          
          maxConfidence = Math.max(maxConfidence, confidence);
          
          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setConfidence(maxConfidence);

        // Handle interim results for live display
        if (interimTranscript.trim() && onInterimTranscript) {
          onInterimTranscript(interimTranscript);
        }

        // Only process if we have meaningful content
        const hasContent = finalTranscript.trim().length > 0 || interimTranscript.trim().length > 2;
        
        if (hasContent) {
          lastSpeechTimeRef.current = Date.now();
          
          // Add final transcript to accumulated text
          if (finalTranscript.trim()) {
            // Add space if there's already content
            if (currentTranscriptRef.current.trim()) {
              currentTranscriptRef.current += ' ' + finalTranscript;
            } else {
              currentTranscriptRef.current += finalTranscript;
            }
            
            // In normal mode, immediately send each final transcript to update the UI
            if (!isConversationalMode && onTranscript) {
              onTranscript(currentTranscriptRef.current.trim());
              // Don't clear the transcript - keep accumulating
            }
          }
          
          // Clear existing speech timeout
          if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = null;
          }
          
          // Only set timeout if we're NOT continuously building transcript in normal mode
          if (isConversationalMode) {
            // Set timeout for transcript submission in conversation mode
            speechTimeoutRef.current = setTimeout(() => {
              const timeSinceLastSpeech = Date.now() - lastSpeechTimeRef.current;
              if (timeSinceLastSpeech >= 3000 && currentTranscriptRef.current.trim()) {
                if (onTranscript) {
                  onTranscript(currentTranscriptRef.current.trim());
                  currentTranscriptRef.current = '';
                }
              }
            }, 3000);
          }
        }
      };

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            alert('Microphone access is required for voice input. Please enable microphone permissions.');
            stopListening();
            break;
          case 'aborted':
            if (isListening && !isManuallyStoppedRef.current) {
              // Restart after short delay
              setTimeout(() => {
                if (isListening && !isManuallyStoppedRef.current) {
                  try {
                    recognitionRef.current?.start();
                  } catch (error) {
                    console.error('Restart failed:', error);
                    setIsListening(false);
                  }
                }
              }, 300);
            }
            break;
          case 'network':
            console.error('Network error - speech recognition unavailable');
            stopListening();
            break;
          default:
            console.error('Unknown speech recognition error:', event.error);
            stopListening();
        }
      };

      recognitionRef.current.onend = () => {
        if (isListening && !isManuallyStoppedRef.current) {
          // Auto-restart with shorter delay
          setTimeout(() => {
            if (isListening && !isManuallyStoppedRef.current) {
              try {
                recognitionRef.current?.start();
              } catch (error) {
                console.error('Auto-restart failed:', error);
                setIsListening(false);
              }
            }
          }, 50);
        }
      };
    }

    return () => {
      // Cleanup
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (voiceDetectionRef.current) {
        cancelAnimationFrame(voiceDetectionRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
      }, [onTranscript, onSpeechStart, onSpeechEnd, onInterimTranscript, isListening, isPaused, isConversationalMode]);

  useEffect(() => {
    if (!isListening) {
      isManuallyStoppedRef.current = false;
      setIsSpeaking(false);
      setIsPaused(false);
      setConfidence(0);
      
      // Clear all timeouts
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      
      // Only clear transcript in conversational mode
      if (isConversationalMode) {
        currentTranscriptRef.current = '';
      }
      voiceActivityRef.current = false;
      
      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  }, [isListening, isConversationalMode]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      isManuallyStoppedRef.current = false;
      // DON'T clear the transcript in normal mode!
      if (isConversationalMode) {
        currentTranscriptRef.current = '';
      }
      setIsListening(true);
      setIsSpeaking(false);
      setConfidence(0);
      
      // Initialize voice activity detection
      initVoiceActivityDetection();
      
      setTimeout(() => {
        if (!isManuallyStoppedRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error('Failed to start recognition:', error);
            if (error.name !== 'InvalidStateError') {
              setIsListening(false);
            }
          }
        }
      }, 100);
    }
  }, [isListening, initVoiceActivityDetection, isConversationalMode]);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    
    // Clear all timeouts
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    // Stop voice detection
    if (voiceDetectionRef.current) {
      cancelAnimationFrame(voiceDetectionRef.current);
      voiceDetectionRef.current = null;
    }
    
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    setIsListening(false);
    setIsSpeaking(false);
    setConfidence(0);
    // DON'T clear transcript in normal mode!
    if (isConversationalMode) {
      currentTranscriptRef.current = '';
    }
  }, [isListening, isConversationalMode]);

  const forceSubmit = useCallback(() => {
    if (currentTranscriptRef.current.trim() && onTranscript) {
      onTranscript(currentTranscriptRef.current.trim());
      // Only clear in conversational mode
      if (isConversationalMode) {
        currentTranscriptRef.current = '';
      }
    }
    
    // Clear timeouts
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    setIsSpeaking(false);
  }, [onTranscript, isConversationalMode]);

  const pauseListening = useCallback(() => {
    console.log("Pausing speech recognition");
    setIsPaused(true);
    setIsSpeaking(false);
    
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  const resumeListening = useCallback(() => {
    console.log("Resuming speech recognition");
    setIsPaused(false);
    // DON'T clear transcript in normal mode!
    if (isConversationalMode) {
      currentTranscriptRef.current = '';
    }
    voiceActivityRef.current = false;
  }, [isConversationalMode]);

  return {
    isListening,
    isSupported,
    isSpeaking,
    isPaused,
    confidence, // New: confidence level of recognition
    startListening,
    stopListening,
    forceSubmit,
    pauseListening,
    resumeListening
  };
};