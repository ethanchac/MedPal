import React from 'react';
import VoiceControls from './VoiceControls';

const ChatInput = ({ 
  input, 
  setInput, 
  isThinking,
  voiceControlsProps,
  onSubmit
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isThinking) {
        onSubmit();
      }
    }
  };

  return (
    <>
      <div className="relative mb-4">
        <textarea
          className="w-full p-4 border-2 border-gray-300 rounded-xl pr-20 resize-none focus:border-blue-500 focus:outline-none transition-colors text-lg"
          rows={2}
          placeholder="Describe your symptoms or click the microphone to speak..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isThinking}
        />
        
        <div className="absolute right-2 top-2">
          <VoiceControls {...voiceControlsProps} />
        </div>
      </div>

      <button
        className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 mb-6 transition-colors font-medium text-xl shadow-lg"
        onClick={onSubmit}
        disabled={!input.trim() || isThinking}
      >
        {isThinking ? "Thinking..." : "Ask"}
      </button>
    </>
  );
};

export default ChatInput;