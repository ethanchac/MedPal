import React from 'react';

const StatusIndicators = ({ 
  isListening, 
  countdown, 
  isThinking, 
  isSpeaking, 
  ttsError,
  getVoiceStatusText,
  stopSpeaking
}) => {
  return (
    <>
      {/* Listening/Countdown Status */}
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

      {/* Thinking Status */}
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

      {/* Speaking Status */}
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

      {/* TTS Error */}
      {ttsError && (
        <div className="mb-3 text-sm text-orange-700 bg-orange-50 p-3 rounded-lg border border-orange-200">
          ⚠️ {ttsError}
        </div>
      )}
    </>
  );
};

export default StatusIndicators;