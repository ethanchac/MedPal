import React, { useState, useRef, useEffect } from "react";
import { askGemini } from "./Gemini/GeminiAPIService";
import ttsService,{ TTS_MODES } from "./threejs/TTSService"; // Import the TTS service

function MainScreen() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [autoSubmitTimer, setAutoSubmitTimer] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsError, setTtsError] = useState(null);
  const [ttsMode, setTtsMode] = useState(TTS_MODES.ELEVENLABS_WITH_FALLBACK);
  const [lastUsedProvider, setLastUsedProvider] = useState(null);
  
  const recognitionRef = useRef(null);
  const autoSubmitTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const isManuallyStoppedRef = useRef(false);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      // Initialize speech recognition
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      // Handle speech recognition results
      recognitionRef.current.onresult = (event) => {
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

        if (finalTranscript) {
          setInput(prevInput => prevInput + finalTranscript);
          startAutoSubmitCountdown();
        }
      };

      // Handle speech recognition errors
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          alert('Microphone access is required for voice input. Please enable microphone permissions.');
        }
        stopListeningAndClearTimers();
      };

      // Handle speech recognition end
      recognitionRef.current.onend = () => {
        // Only restart if we're still supposed to be listening AND not manually stopped
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

    // Set initial TTS mode
    ttsService.setMode(ttsMode);

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      ttsService.stop();
      clearAutoSubmitTimers();
    };
  }, []);

  // Update TTS mode when it changes
  useEffect(() => {
    ttsService.setMode(ttsMode);
  }, [ttsMode]);

  // Update listening dependency
  useEffect(() => {
    if (!isListening) {
      isManuallyStoppedRef.current = false;
    }
  }, [isListening]);

  const clearAutoSubmitTimers = () => {
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(0);
  };

  const startAutoSubmitCountdown = () => {
    // Clear any existing timers
    clearAutoSubmitTimers();
    
    // Start countdown
    setCountdown(3);
    
    // Update countdown every second
    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Set timer to auto-submit after 3 seconds
    autoSubmitTimerRef.current = setTimeout(() => {
      handleAutoSubmit();
    }, 3000);
  };

  const clearInput = () => {
    setInput("");
    clearAutoSubmitTimers();
  };

  const stopListening = () => {
    isManuallyStoppedRef.current = true;
    stopListeningAndClearTimers();
  };

  const testVoice = async () => {
    const testText = "Hello! I'm your AI medical assistant. How can I help you today?";
    await speakResponse(testText);
  };

  const speakResponse = async (text) => {
    if (!text) return;

    setTtsError(null);
    setLastUsedProvider(null);

    try {
      const result = await ttsService.speak(
        text,
        // onStart
        () => {
          setIsSpeaking(true);
        },
        // onEnd
        () => {
          setIsSpeaking(false);
        },
        // onError
        (error) => {
          console.error('TTS Error:', error.message);
          setTtsError(`Voice synthesis failed: ${error.message}`);
          setIsSpeaking(false);
        }
      );

      if (result && result.success) {
        setLastUsedProvider(result.provider);
        if (result.fallback) {
          setTtsError(`ElevenLabs failed, using browser voice instead`);
          // Clear the error after 3 seconds for fallback messages
          setTimeout(() => setTtsError(null), 3000);
        }
      } else if (result && !result.success) {
        setTtsError(result.error || 'Voice synthesis failed');
        setIsSpeaking(false);
      }

    } catch (error) {
      console.error('Error with TTS:', error);
      setTtsError('All voice synthesis methods failed. Please try again.');
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    ttsService.stop();
    setIsSpeaking(false);
  };

  const stopListeningAndClearTimers = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    setIsListening(false);
    clearAutoSubmitTimers();
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      // Stop any ongoing speech before listening
      stopSpeaking();
      isManuallyStoppedRef.current = false;
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        setIsListening(false);
        if (error.name === 'InvalidStateError') {
          // Recognition is already started, this is fine
          setIsListening(true);
        }
      }
    }
  };

  const handleAutoSubmit = async () => {
    stopListeningAndClearTimers();
    if (input.trim()) {
      setIsThinking(true);
      setTtsError(null); // Clear any previous errors
      try {
        const res = await askGemini(input);
        setResponse(res);
        setInput(""); // Clear input after successful submission
        setIsThinking(false); // Stop thinking before speaking
        // Automatically speak the response
        await speakResponse(res);
      } catch (error) {
        console.error('Error getting AI response:', error);
        const errorMsg = "Sorry, there was an error getting a response. Please try again.";
        setResponse(errorMsg);
        setIsThinking(false); // Stop thinking before speaking
        await speakResponse(errorMsg);
      }
    }
  };

  const handleAsk = async () => {
    clearAutoSubmitTimers();
    if (input.trim()) {
      setIsThinking(true);
      setTtsError(null); // Clear any previous errors
      try {
        const res = await askGemini(input);
        setResponse(res);
        setInput(""); // Clear input after successful submission
        setIsThinking(false); // Stop thinking before speaking
        // Automatically speak the response
        await speakResponse(res);
      } catch (error) {
        console.error('Error getting AI response:', error);
        const errorMsg = "Sorry, there was an error getting a response. Please try again.";
        setResponse(errorMsg);
        setIsThinking(false); // Stop thinking before speaking
        await speakResponse(errorMsg);
      }
    }
  };

  const getVoiceStatusText = () => {
    if (!isSpeaking) return '';
    
    if (lastUsedProvider === 'elevenlabs') {
      return 'Rachel (ElevenLabs) is speaking...';
    } else if (lastUsedProvider === 'browser') {
      const browserInfo = ttsService.getBrowserVoicesInfo();
      return `${browserInfo.bestFemale} is speaking...`;
    }
    return 'AI is speaking...';
  };

  return (
    <div className="p-6 max-w-[1000px] mx-auto flex flex-col">
        <h1 className="text-2xl font-bold mb-4">AI Medical Assistant</h1>
        <div className="mt-75"> 
            <div className="h-64 mt-4 p-4 bg-gray-100 rounded overflow-y-auto">
                <p className="whitespace-pre-wrap">{response}</p>
            </div>
            <div className="relative py-3 w=full">
            <textarea
            className="w-full h-25 p-3 border rounded pr-20 overflow-y-auto"
            rows={4}
            placeholder="Describe your symptoms or click the microphone to speak..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e)=> {if (e.key=='Enter' && !e.shiftKey){
                e.preventDefault();
                handleAsk();
            }}}
            disabled={isThinking}
            />
             {/* Voice controls */}
        <div className="absolute right-2 top-2 flex flex-col gap-1 py-3">
          {isSupported ? (
            <>
              <button
                className={`p-2 rounded-full ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
                onClick={isListening ? stopListening : startListening}
                title={isListening ? "Stop listening" : "Start voice input"}
                disabled={isSpeaking || isThinking}
              >
                🎤
              </button>
              {input && (
                <button
                  className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
                  onClick={clearInput}
                  title="Clear text"
                  disabled={isThinking}
                >
                  🗑️
                </button>
              )}
            </>
          ) : (
            <div className="text-xs text-gray-500 p-2">
              Voice not supported
            </div>
          )}
        </div>
      </div>
      {(isListening || countdown > 0) && (
        <div className="mb-2 text-sm flex items-center gap-2">
          {isListening && (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-blue-600">Listening... Speak now</span>
            </>
          )}
          {countdown > 0 && (
            <span className="text-orange-600 font-semibold">
              Submitting in {countdown}s
            </span>
          )}
        </div>
      )}
            
        </div>
        <button
        className="w-40 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        onClick={handleAsk}
        disabled={!input.trim() || isThinking || isSpeaking}
      >
        {isThinking ? "Thinking..." : "Ask"}
      </button>
        
       

      {isThinking && (
        <div className="mb-2 text-sm text-purple-600 flex items-center gap-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
          AI is thinking...
        </div>
      )}

      {isSpeaking && (
        <div className="mb-2 text-sm text-green-600 flex items-center gap-2">
          <div className="flex space-x-1">
            <div className="w-1 h-3 bg-green-500 rounded animate-pulse"></div>
            <div className="w-1 h-4 bg-green-500 rounded animate-pulse" style={{animationDelay: '0.1s'}}></div>
            <div className="w-1 h-2 bg-green-500 rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-1 h-4 bg-green-500 rounded animate-pulse" style={{animationDelay: '0.3s'}}></div>
            <div className="w-1 h-3 bg-green-500 rounded animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
          {getVoiceStatusText()}
          <button
            className="ml-2 text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
            onClick={stopSpeaking}
          >
            Stop
          </button>
        </div>
      )}

      {ttsError && (
        <div className="mb-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
          ⚠️ {ttsError}
        </div>
      )}
      </div>
  );
}

export default MainScreen;