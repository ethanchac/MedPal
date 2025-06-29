// StatusIndicators.jsx - Updated for conversational mode
import React from 'react';


const StatusIndicators = ({
  isListening,
  countdown,
  isThinking,
  isSpeaking,
  isUserSpeaking,
  ttsError,
  getVoiceStatusText,
  stopSpeaking,
  isConversationalMode,
  pendingInput,
  isPaused
}) => {
  // Priority order for status display
  const getStatusDisplay = () => {
    if (isThinking) {
      return {
        text: "🤔 Thinking...",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200"
      };
    }
   
    if (isSpeaking) {
      return {
        text: `🔊 ${getVoiceStatusText()}`,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        action: (
          <button
            onClick={stopSpeaking}
            className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Stop
          </button>
        )
      };
    }
   
    if (isUserSpeaking) {
      return {
        text: "🎙️ You're speaking...",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        pulse: true
      };
    }
   
    if (isListening && isConversationalMode && isPaused) {
      return {
        text: "🔇 Listening paused (AI speaking)",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200"
      };
    }
   
    if (isListening && isConversationalMode) {
      return {
        text: "🎙️ Listening... (Conversation Mode)",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        pulse: true
      };
    }
   
    if (isListening && countdown > 0) {
      return {
        text: `🎙️ Auto-submitting in ${countdown}s...`,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200"
      };
    }
   
    if (isListening) {
      return {
        text: "🎙️ Listening...",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        pulse: true
      };
    }
   
    if (ttsError) {
      return {
        text: `⚠️ ${ttsError}`,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200"
      };
    }
   
    return null;
  };


  const status = getStatusDisplay();
 
  if (!status) return null;


  return (
    <div className="flex justify-center">
      <div
        className={`
          px-4 py-2 rounded-lg border text-sm font-medium
          ${status.color} ${status.bgColor} ${status.borderColor}
          ${status.pulse ? 'animate-pulse' : ''}
          flex items-center justify-center
          transition-all duration-200
        `}
      >
        <span>{status.text}</span>
        {status.action}
       
        {/* Show pending input in conversational mode */}
        {isConversationalMode && pendingInput && (
          <div className="ml-2 text-xs opacity-75">
            "{pendingInput.slice(0, 50)}{pendingInput.length > 50 ? '...' : ''}"
          </div>
        )}
      </div>
    </div>
  );
};


export default StatusIndicators;



