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

  const handleKeyDown = (e) => {
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
    <div className="relative group">
      <textarea
        ref={textareaRef}
        className={`w-full px-5 py-4 border-2 rounded-2xl pr-32 resize-none focus:outline-none transition-all duration-200 text-base min-h-[68px] max-h-[150px] font-normal ${
          isListening && isSpeaking
            ? 'border-green-500 bg-green-50 focus:border-green-600 shadow-green-100'
            : isListening
            ? 'border-blue-500 bg-blue-50 focus:border-blue-600 shadow-blue-100'
            : 'border-gray-200 bg-white focus:border-[#DC143C] hover:border-gray-300 shadow-sm hover:shadow-md'
        } focus:shadow-lg`}
        placeholder={
          isListening
            ? (isSpeaking ? "Listening... speak now" : "Ready to listen - start speaking")
            : "Describe your symptoms or ask a medical question..."
        }
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isThinking}
        style={{ overflow: 'hidden' }}
      />

      {/* Visual indicator for voice activity */}
      {isListening && (
        <div className="absolute left-5 bottom-4">
          <div className={`flex items-center space-x-2 text-sm font-medium ${
            isSpeaking ? 'text-green-600' : 'text-blue-600'
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full ${
              isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-blue-500 animate-pulse'
            }`}></div>
            <span>{isSpeaking ? 'Listening...' : 'Ready'}</span>
          </div>
        </div>
      )}

      {/* Right side controls: Voice button + Send button */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
        <VoiceControls {...voiceControlsProps} />

        {/* Send button */}
        <button
          onClick={onSubmit}
          disabled={!input.trim() || isThinking}
          className={`p-3.5 rounded-xl transition-all duration-200 ${
            !input.trim() || isThinking
              ? 'bg-gray-200 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-[#DC143C] to-[#B0101C] hover:from-[#C41230] hover:to-[#9D0E19] shadow-md hover:shadow-xl active:scale-95 transform'
          }`}
          title={isThinking ? "Thinking..." : "Send message (Enter)"}
        >
          {isThinking ? (
            <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;