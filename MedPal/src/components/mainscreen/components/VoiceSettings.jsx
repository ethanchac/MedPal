import React, { useState } from 'react';
import { Volume2, ChevronDown } from 'lucide-react';
import { TTS_MODES } from '../../../threejs/TTSService';
import ttsService from '../../../threejs/TTSService';

const VoiceSettings = ({ 
  ttsMode, 
  setTtsMode, 
  testVoice, 
  isSpeaking, 
  isThinking
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const voiceModes = [
    {
      value: TTS_MODES.ELEVENLABS_WITH_FALLBACK,
      label: "ElevenLabs + Backup",
      description: "Premium with fallback"
    },
    {
      value: TTS_MODES.ELEVENLABS_ONLY,
      label: "ElevenLabs Only",
      description: "Premium quality"
    },
    {
      value: TTS_MODES.BROWSER_ONLY,
      label: "Browser Voice",
      description: "Free option"
    }
  ];

  const currentMode = voiceModes.find(mode => mode.value === ttsMode);

  return (
    <div className="relative">
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
            Voice Mode Selection
          </div>
          
          {/* Voice Mode Options */}
          <div className="py-2">
            {voiceModes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => {
                  setTtsMode(mode.value);
                }}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                  mode.value === ttsMode ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <div className="text-sm font-medium">{mode.label}</div>
                <div className="text-xs text-gray-500">{mode.description}</div>
              </button>
            ))}
          </div>

          {/* Test Buttons */}
          <div className="border-t border-gray-100 pt-2">
            <button
              onClick={() => {
                testVoice();
              }}
              disabled={isSpeaking || isThinking}
              className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 disabled:text-gray-400 disabled:hover:bg-transparent transition-colors text-left"
            >
              Test Current Mode
            </button>
            <button
              onClick={() => {
                ttsService.testVoice(TTS_MODES.BROWSER_ONLY);
              }}
              disabled={isSpeaking || isThinking}
              className="w-full px-3 py-2 text-sm text-green-600 hover:bg-green-50 disabled:text-gray-400 disabled:hover:bg-transparent transition-colors text-left"
            >
              Test Browser Voice
            </button>
          </div>

          {/* Close button */}
          <div className="border-t border-gray-100 pt-2">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors text-center"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
      >
        <Volume2 className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-700">{currentMode?.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Overlay to close menu when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default VoiceSettings;