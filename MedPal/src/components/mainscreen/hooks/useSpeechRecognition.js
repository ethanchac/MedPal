import { useState, useRef, useEffect } from 'react';


export const useSpeechRecognition = (onTranscript, onSpeechStart, onSpeechEnd) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // New: tracks if user is actively speaking
  const [isPaused, setIsPaused] = useState(false); // New: tracks if listening is paused
 
  const recognitionRef = useRef(null);
  const isManuallyStoppedRef = useRef(false);
  const lastSpeechTimeRef = useRef(0);
  const speechTimeoutRef = useRef(null);
  const currentTranscriptRef = useRef('');


  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
   
    if (SpeechRecognition) {
      setIsSupported(true);
     
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';


      recognitionRef.current.onresult = (event) => {
        // Don't process results if paused (to prevent feedback)
        if (isPaused) {
          return;
        }


        let finalTranscript = '';
        let interimTranscript = '';


        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }


        // User is actively speaking if we have ANY results (interim or final)
        const hasAnyTranscript = finalTranscript.length > 0 || interimTranscript.length > 0;
       
        if (hasAnyTranscript) {
          // Update last speech time on ANY speech activity
          lastSpeechTimeRef.current = Date.now();
         
          // Set speaking state
          if (!isSpeaking) {
            setIsSpeaking(true);
            if (onSpeechStart) {
              onSpeechStart();
            }
          }
         
          // Clear any existing timeout since user is still speaking
          if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = null;
          }
        }


        // Add final transcript to our accumulated text
        if (finalTranscript) {
          currentTranscriptRef.current += finalTranscript;
        }


        // Always set a new timeout when we get results
        // This ensures we wait for TRUE silence, not just between words
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
        }
       
        speechTimeoutRef.current = setTimeout(() => {
          // Double-check that enough time has actually passed
          const timeSinceLastSpeech = Date.now() - lastSpeechTimeRef.current;
          if (timeSinceLastSpeech >= 3000) {
            if (currentTranscriptRef.current.trim() && onTranscript) {
              onTranscript(currentTranscriptRef.current.trim());
              currentTranscriptRef.current = '';
            }
            setIsSpeaking(false);
            if (onSpeechEnd) {
              onSpeechEnd();
            }
          } else {
            // Not enough time has passed, set another timeout for the remaining time
            const remainingTime = 3000 - timeSinceLastSpeech;
            speechTimeoutRef.current = setTimeout(() => {
              if (currentTranscriptRef.current.trim() && onTranscript) {
                onTranscript(currentTranscriptRef.current.trim());
                currentTranscriptRef.current = '';
              }
              setIsSpeaking(false);
              if (onSpeechEnd) {
                onSpeechEnd();
              }
            }, remainingTime);
          }
        }, 3000);
      };


      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
      };


      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
       
        // Handle different error types
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          alert('Microphone access is required for voice input. Please enable microphone permissions.');
          stopListening();
        } else if (event.error === 'aborted') {
          // Aborted is often due to stopping/starting too quickly - try to restart
          console.log('Speech recognition aborted, attempting restart...');
          if (isListening && !isManuallyStoppedRef.current) {
            setTimeout(() => {
              if (isListening && !isManuallyStoppedRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (restartError) {
                  console.error('Error restarting after abort:', restartError);
                  setIsListening(false);
                }
              }
            }, 500);
          }
        } else if (event.error === 'network') {
          console.error('Network error in speech recognition');
          setIsListening(false);
        } else {
          // For other errors, stop listening
          stopListening();
        }
      };


      recognitionRef.current.onend = () => {
        // Auto-restart if we're still supposed to be listening
        if (isListening && !isManuallyStoppedRef.current && recognitionRef.current) {
          try {
            setTimeout(() => {
              if (isListening && !isManuallyStoppedRef.current) {
                recognitionRef.current.start();
              }
            }, 100);
          } catch (error) {
            console.error('Error restarting recognition:', error);
            setIsListening(false);
          }
        }
      };
    }


    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript, onSpeechStart, onSpeechEnd, isListening, isSpeaking]);


  useEffect(() => {
    if (!isListening) {
      isManuallyStoppedRef.current = false;
      setIsSpeaking(false);
      setIsPaused(false);
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }
      currentTranscriptRef.current = '';
    }
  }, [isListening]);


  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      isManuallyStoppedRef.current = false;
      currentTranscriptRef.current = '';
      setIsListening(true);
      setIsSpeaking(false);
     
      // Add a small delay to prevent rapid start/stop issues
      setTimeout(() => {
        if (!isManuallyStoppedRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error('Error starting recognition:', error);
            if (error.name === 'InvalidStateError') {
              // Recognition might already be running, just set state
              console.log('Recognition already running, just updating state');
            } else {
              setIsListening(false);
            }
          }
        }
      }, 100);
    }
  };


  const stopListening = () => {
    isManuallyStoppedRef.current = true;
   
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
   
    if (recognitionRef.current) {
      try {
        // Only stop if it's actually running
        if (isListening) {
          recognitionRef.current.stop();
        }
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
   
    setIsListening(false);
    setIsSpeaking(false);
    currentTranscriptRef.current = '';
  };


  // Force submit any pending transcript
  const forceSubmit = () => {
    if (currentTranscriptRef.current.trim() && onTranscript) {
      onTranscript(currentTranscriptRef.current.trim());
      currentTranscriptRef.current = '';
    }
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    setIsSpeaking(false);
  };


  // Pause listening temporarily (keeps recognition running but ignores results)
  const pauseListening = () => {
    console.log("Pausing speech recognition to prevent feedback");
    setIsPaused(true);
    setIsSpeaking(false);
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
  };


  // Resume listening
  const resumeListening = () => {
    console.log("Resuming speech recognition");
    setIsPaused(false);
    currentTranscriptRef.current = '';
  };


  return {
    isListening,
    isSupported,
    isSpeaking, // New: indicates if user is actively speaking
    isPaused,   // New: indicates if listening is paused
    startListening,
    stopListening,
    forceSubmit, // New: manually trigger transcript submission
    pauseListening, // New: pause to prevent feedback
    resumeListening // New: resume after AI stops speaking
  };
};



