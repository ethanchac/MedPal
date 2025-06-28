import { useState, useRef, useEffect } from 'react';

export const useSpeechRecognition = (onTranscript) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef(null);
  const isManuallyStoppedRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }

        if (finalTranscript && onTranscript) {
          onTranscript(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          alert('Microphone access is required for voice input. Please enable microphone permissions.');
        }
        stopListening();
      };

      recognitionRef.current.onend = () => {
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
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  useEffect(() => {
    if (!isListening) {
      isManuallyStoppedRef.current = false;
    }
  }, [isListening]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      isManuallyStoppedRef.current = false;
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        setIsListening(false);
        if (error.name === 'InvalidStateError') {
          setIsListening(true);
        }
      }
    }
  };

  const stopListening = () => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    setIsListening(false);
  };

  return {
    isListening,
    isSupported,
    startListening,
    stopListening
  };
};