import React, { useEffect, useRef } from 'react';
import VoiceControls from './VoiceControls';

const ChatInput = ({
  input,
  setInput,
  isThinking,
  voiceControlsProps,
  onSubmit
}) => {
  const { isConversationalMode, isListening, isSpeaking } = voiceControlsProps;
  const textareaRef = useRef(null);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isThinking) {
        onSubmit();
      }
    }
  };

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Don't render the input in conversational mode
  if (isConversationalMode) {
    return (
      <div className="flex justify-center">
        <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
          <div className="text-green-600 font-medium mb-2">
            🎙️ Conversation Mode Active
          </div>
          <p className="text-sm text-green-700 mb-4">
            Just speak naturally - I'll respond after you pause for 3 seconds.
            <br />
            Click the microphone to exit conversation mode.
          </p>
          <VoiceControls {...voiceControlsProps} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative mb-4">
        <textarea
          ref={textareaRef}
          className={`w-full p-4 border-2 rounded-xl pr-20 resize-none focus:outline-none transition-all text-lg min-h-[60px] max-h-[200px] ${
            isListening && isSpeaking
              ? 'border-green-400 bg-green-50 focus:border-green-500'
              : isListening
              ? 'border-blue-400 bg-blue-50 focus:border-blue-500'
              : 'border-gray-300 focus:border-blue-500'
          }`}
          placeholder={
            isListening 
              ? (isSpeaking ? "Listening... speak now" : "Ready to listen - start speaking")
              : "Describe your symptoms, click the microphone to speak, or use 💬 for conversation mode..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isThinking}
          style={{ overflow: 'hidden' }}
        />
        
        {/* Visual indicator for voice activity */}
        {isListening && (
          <div className="absolute left-4 bottom-2">
            <div className={`flex items-center space-x-2 text-sm ${
              isSpeaking ? 'text-green-600' : 'text-blue-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-blue-500'
              }`}></div>
              <span>{isSpeaking ? 'Speaking...' : 'Listening'}</span>
            </div>
          </div>
        )}
        
        <div className="absolute right-2 top-2">
          <VoiceControls {...voiceControlsProps} />
        </div>
      </div>

      <button
        className="w-full bg-[#B0101C] text-white px-6 py-4 rounded-xl hover:bg-red-800 disabled:bg-gray-400 mb-6 transition-colors font-medium text-xl shadow-lg"
        onClick={onSubmit}
        disabled={!input.trim() || isThinking}
      >
        {isThinking ? "Thinking..." : "Ask"}
      </button>
    </>
  );
};

export default ChatInput;