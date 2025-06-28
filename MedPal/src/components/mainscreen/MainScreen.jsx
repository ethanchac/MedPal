import { useState } from "react";
import { askGemini } from "../../Gemini/GeminiAPIService";
import ttsService from "../../threejs/TTSService";

// Custom Hooks
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { useTextToSpeech } from "./hooks/useTextToSpeech";
import { useAutoSubmit } from "./hooks/useAutoSubmit";

// Components
import AvatarContainer from "./components/AvatarContainer";
import StatusIndicators from "./components/StatusIndicators";
import ChatInput from "./components/ChatInput";
import ChatResponse from "./components/ChatResponse";
import VoiceSettings from "./components/VoiceSettings";

function MainScreen() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Custom hooks
  const {
    isSpeaking,
    ttsError,
    ttsMode,
    lastUsedProvider,
    setTtsMode,
    speakResponse,
    stopSpeaking,
    testVoice,
    getVoiceStatusText
  } = useTextToSpeech();

  const handleAutoSubmit = async () => {
    stopListening();
    clearAutoSubmitTimers();
    await handleSubmit();
  };

  const { countdown, startAutoSubmitCountdown, clearAutoSubmitTimers } = useAutoSubmit(handleAutoSubmit);

  const handleTranscript = (transcript) => {
    setInput(prevInput => prevInput + transcript);
    startAutoSubmitCountdown();
  };

  const { isListening, isSupported, startListening, stopListening } = useSpeechRecognition(handleTranscript);

  const clearInput = () => {
    setInput("");
    clearAutoSubmitTimers();
  };

  const handleSubmit = async () => {
    clearAutoSubmitTimers();
    if (input.trim()) {
      setIsThinking(true);
      try {
        const res = await askGemini(input);
        setResponse(res);
        setInput("");
        setIsThinking(false);
        await speakResponse(res);
      } catch (error) {
        console.error('Error getting AI response:', error);
        const errorMsg = "Sorry, there was an error getting a response. Please try again.";
        setResponse(errorMsg);
        setIsThinking(false);
        await speakResponse(errorMsg);
      }
    }
  };

  const handleStartListening = () => {
    stopSpeaking();
    startListening();
  };

  // Props for components
  const voiceControlsProps = {
    isListening,
    isSupported,
    startListening: handleStartListening,
    stopListening,
    clearInput,
    hasInput: !!input,
    isSpeaking,
    isThinking
  };

  const statusProps = {
    isListening,
    countdown,
    isThinking,
    isSpeaking,
    ttsError,
    getVoiceStatusText,
    stopSpeaking
  };

  const voiceSettingsProps = {
    ttsMode,
    setTtsMode,
    testVoice,
    isSpeaking,
    isThinking,
    lastUsedProvider,
    showDebug,
    setShowDebug
  };

  return (
    <div className="relative h-screen w-full bg-white">
      {/* Avatar Section */}
      <AvatarContainer 
        isSpeaking={isSpeaking} 
        currentAudio={ttsService.currentAudio}
        showDebug={showDebug}
      />

      {/* Main Content */}
      <div className="w-full h-full p-4 lg:p-6 bg-white overflow-y-auto">
        <div className="max-w-2xl mx-auto pt-56">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">AI Medical Assistant</h1>
          
          {/* Status Indicators */}
          <StatusIndicators {...statusProps} />

          {/* Chat Input */}
          <ChatInput 
            input={input}
            setInput={setInput}
            isThinking={isThinking}
            voiceControlsProps={voiceControlsProps}
            onSubmit={handleSubmit}
          />

          {/* Response Display */}
          <ChatResponse response={response} />

          {/* Voice Settings */}
          <VoiceSettings {...voiceSettingsProps} />
        </div>
      </div>
    </div>
  );
}

export default MainScreen;