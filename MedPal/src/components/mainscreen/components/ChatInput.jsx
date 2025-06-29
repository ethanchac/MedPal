import React from 'react';
import VoiceControls from './VoiceControls';


const ChatInput = ({
  input,
  setInput,
  isThinking,
  voiceControlsProps,
  onSubmit
}) => {
  const { isConversationalMode } = voiceControlsProps;


  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isThinking) {
        onSubmit();
      }
    }
  };


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
          className="w-full p-4 border-2 border-gray-300 rounded-xl pr-20 resize-none focus:border-blue-500 focus:outline-none transition-colors text-lg"
          rows={2}
          placeholder="Describe your symptoms, click the microphone to speak, or use 💬 for conversation mode..."
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



