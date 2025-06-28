import React from 'react';

const VoiceControls = ({ 
  isListening, 
  isSupported, 
  startListening, 
  stopListening, 
  clearInput,
  hasInput,
  isSpeaking,
  isThinking 
}) => {
  if (!isSupported) {
    return (
      <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
        Voice not supported
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
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
      {hasInput && (
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