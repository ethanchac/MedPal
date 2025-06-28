import { useState, useRef, useEffect } from "react";
import { askGemini } from "../Gemini/GeminiAPIService";
import AvatarViewer from "../threejs/components/AvatarViewer";
import ttsService, { TTS_MODES } from "../threejs/TTSService";

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
  const [showDebug, setShowDebug] = useState(false);
  
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
    <div className="relative h-screen w-full bg-white">
      {/* Avatar Section - Larger floating window with proper container */}
      <div className="absolute top-4 left-4 w-80 h-64 bg-gradient-to-br from-blue-50 to-purple-50 border border-gray-300 rounded-lg shadow-lg z-10 overflow-hidden">
        <div className="w-full h-full">
          <AvatarViewer 
            isSpeaking={isSpeaking} 
            currentAudio={ttsService.currentAudio}
            enableControls={showDebug}
            showDebug={showDebug}
          />
        </div>
      </div>

      {/* Control Panel - Full screen with avatar floating on top */}
      <div className="w-full h-full p-4 lg:p-6 bg-white overflow-y-auto">
        <div className="max-w-2xl mx-auto pt-56">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">AI Medical Assistant</h1>
          
          <div className="relative mb-4">
            <textarea
              className="w-full p-4 border-2 border-gray-300 rounded-xl pr-20 resize-none focus:border-blue-500 focus:outline-none transition-colors text-lg"
              rows={4}
              placeholder="Describe your symptoms or click the microphone to speak..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isThinking}
            />
            
            {/* Voice controls */}
            <div className="absolute right-2 top-2 flex flex-col gap-1">
              {isSupported ? (
                <>
                  <button
                    className={`p-2 rounded-full transition-all duration-200 ${
                      isListening 
                        ? 'bg-red-500 text-white animate-pulse shadow-lg' 
                        : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md'
                    }`}
                    onClick={isListening ? stopListening : startListening}
                    title={isListening ? "Stop listening" : "Start voice input"}
                    disabled={isSpeaking || isThinking}
                  >
                    🎤
                  </button>
                  {input && (
                    <button
                      className="p-2 rounded-full bg-gray-400 text-white hover:bg-gray-500 transition-colors shadow-md"
                      onClick={clearInput}
                      title="Clear text"
                      disabled={isThinking}
                    >
                      🗑️
                    </button>
                  )}
                </>
              ) : (
                <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
                  Voice not supported
                </div>
              )}
            </div>
          </div>

          {/* Status indicators */}
          {(isListening || countdown > 0) && (
            <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm flex items-center gap-2">
                {isListening && (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-blue-700 font-medium">Listening... Speak now</span>
                  </>
                )}
                {countdown > 0 && (
                  <span className="text-orange-600 font-semibold">
                    Submitting in {countdown}s
                  </span>
                )}
              </div>
            </div>
          )}

          {isThinking && (
            <div className="mb-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-700 flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="font-medium">AI is thinking...</span>
              </div>
            </div>
          )}

          {isSpeaking && (
            <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-700 flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-1 h-3 bg-green-500 rounded animate-pulse"></div>
                  <div className="w-1 h-4 bg-green-500 rounded animate-pulse" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1 h-2 bg-green-500 rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-1 h-4 bg-green-500 rounded animate-pulse" style={{animationDelay: '0.3s'}}></div>
                  <div className="w-1 h-3 bg-green-500 rounded animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
                <span className="font-medium">{getVoiceStatusText()}</span>
                <button
                  className="ml-auto text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded transition-colors"
                  onClick={stopSpeaking}
                >
                  Stop
                </button>
              </div>
            </div>
          )}

          {ttsError && (
            <div className="mb-3 text-sm text-orange-700 bg-orange-50 p-3 rounded-lg border border-orange-200">
              ⚠️ {ttsError}
            </div>
          )}

            <button
              className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 mb-6 transition-colors font-medium text-xl shadow-lg"
              onClick={handleAsk}
              disabled={!input.trim() || isThinking || isSpeaking}
            >
              {isThinking ? "Thinking..." : "Ask"}
            </button>

          {response && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-semibold mb-3 text-gray-800 text-lg">AI Response:</h3>
              <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-700">{response}</p>
            </div>
          )}

          {/* Voice Settings */}
          <div className="p-6 bg-blue-50 rounded-xl border border-blue-200 shadow-sm">
            <h3 className="font-semibold mb-4 text-blue-900 text-lg">Voice Settings</h3>
            
            {/* TTS Mode Selection */}
            <div className="mb-3">
              <label className="text-sm font-medium mb-2 block text-blue-800">Voice Mode:</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="ttsMode"
                    value={TTS_MODES.ELEVENLABS_WITH_FALLBACK}
                    checked={ttsMode === TTS_MODES.ELEVENLABS_WITH_FALLBACK}
                    onChange={(e) => setTtsMode(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">ElevenLabs with Browser Backup (Recommended)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="ttsMode"
                    value={TTS_MODES.ELEVENLABS_ONLY}
                    checked={ttsMode === TTS_MODES.ELEVENLABS_ONLY}
                    onChange={(e) => setTtsMode(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">ElevenLabs Only (Premium Quality)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="ttsMode"
                    value={TTS_MODES.BROWSER_ONLY}
                    checked={ttsMode === TTS_MODES.BROWSER_ONLY}
                    onChange={(e) => setTtsMode(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Browser Voice Only (Token Free)</span>
                </label>
              </div>
            </div>

            {/* Test Buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              <button 
                onClick={testVoice}
                disabled={isSpeaking || isThinking}
                className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
              >
                Test Current Mode
              </button>
              <button 
                onClick={() => ttsService.testVoice(TTS_MODES.BROWSER_ONLY)}
                disabled={isSpeaking || isThinking}
                className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:bg-gray-400 transition-colors"
              >
                Test Browser Voice
              </button>
            </div>

            {/* Debug Toggle */}
            <div className="mb-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showDebug}
                  onChange={(e) => setShowDebug(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Show Debug Info</span>
              </label>
            </div>

            {/* Current Status */}
            <div className="text-xs text-gray-600 space-y-1 bg-white p-2 rounded border">
              <div>Current Mode: {ttsMode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
              {lastUsedProvider && (
                <div>Last Used: {lastUsedProvider === 'elevenlabs' ? 'ElevenLabs (Rachel)' : `Browser (${ttsService.getBrowserVoicesInfo().bestFemale})`}</div>
              )}
              <div>Browser Voice Available: {ttsService.getBrowserVoicesInfo().bestFemale}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainScreen;