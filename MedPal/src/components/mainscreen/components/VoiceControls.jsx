import React from 'react';


const VoiceControls = ({
  isListening,
  isSupported,
  startListening,
  stopListening,
  clearInput,
  hasInput,
  isSpeaking,
  isThinking,
  isConversationalMode,
  toggleConversationalMode,
  isUserSpeaking
}) => {
  if (!isSupported) {
    return (
      <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
        Voice not supported
      </div>
    );
  }


  const getMicrophoneState = () => {
    if (isConversationalMode && isListening) {
      if (isUserSpeaking) {
        return {
          style: 'bg-orange-500 text-white animate-pulse shadow-lg ring-4 ring-orange-200',
          title: 'Speaking... (Conversation Mode)',
          emoji: '🎙️'
        };
      }
      return {
        style: 'bg-green-500 text-white shadow-lg ring-4 ring-green-200',
        title: 'Listening... (Conversation Mode ON)',
        emoji: '🎙️'
      };
    }
   
    if (isListening) {
      return {
        style: 'bg-red-500 text-white animate-pulse shadow-lg',
        title: 'Stop listening',
        emoji: '🎤'
      };
    }
   
    return {
      style: 'bg-blue-500 text-white hover:bg-blue-600 shadow-md',
      title: 'Start voice input',
      emoji: '🎤'
    };
  };


  const micState = getMicrophoneState();


  const handleMicClick = () => {
    if (isConversationalMode) {
      // In conversational mode, clicking mic toggles the mode off
      toggleConversationalMode();
    } else {
      // In normal mode, toggle listening
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    }
  };


  return (
    <div className="flex flex-col gap-1">
      {/* Main microphone button */}
      <button
        className={`p-2 rounded-full transition-all duration-200 ${micState.style}`}
        onClick={handleMicClick}
        title={micState.title}
        disabled={isSpeaking || isThinking}
      >
        {micState.emoji}
      </button>
     
      {/* Conversation mode toggle (only show when not in conversation mode) */}
      {!isConversationalMode && (
        <button
          className="p-1 rounded-full bg-gray-300 text-gray-600 hover:bg-gray-400 hover:text-white transition-colors text-xs"
          onClick={toggleConversationalMode}
          title="Enable Conversation Mode"
          disabled={isSpeaking || isThinking}
        >
          💬
        </button>
      )}
     
      {/* Clear button */}
      {hasInput && !isConversationalMode && (
        <button
          className="p-2 rounded-full bg-gray-400 text-white hover:bg-gray-500 transition-colors shadow-md"
          onClick={clearInput}
          title="Clear text"
          disabled={isThinking}
        >
          🗑️
        </button>
      )}
    </div>
  );
};


export default VoiceControls;



