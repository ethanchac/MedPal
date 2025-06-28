import React from 'react';
import { TTS_MODES } from '../../../threejs/TTSService';
import ttsService from '../../../threejs/TTSService';

const VoiceSettings = ({ 
  ttsMode, 
  setTtsMode, 
  testVoice, 
  isSpeaking, 
  isThinking,
  lastUsedProvider,
  showDebug,
  setShowDebug
}) => {
  return (
    <div className="p-6 bg-blue-50 rounded-xl border border-blue-200 shadow-sm">
      <h3 className="font-semibold mb-4 text-blue-900 text-lg">Voice Settings</h3>
      
      {/* TTS Mode Selection */}
      <div className="mb-3">
        <label className="text-sm font-medium mb-2 block text-blue-800">Voice Mode:</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="ttsMode"
              value={TTS_MODES.ELEVENLABS_WITH_FALLBACK}
              checked={ttsMode === TTS_MODES.ELEVENLABS_WITH_FALLBACK}
              onChange={(e) => setTtsMode(e.target.value)}
              className="mr-2"
            />
            <span className="text-sm">ElevenLabs with Browser Backup (Recommended)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="ttsMode"
              value={TTS_MODES.ELEVENLABS_ONLY}
              checked={ttsMode === TTS_MODES.ELEVENLABS_ONLY}
              onChange={(e) => setTtsMode(e.target.value)}
              className="mr-2"
            />
            <span className="text-sm">ElevenLabs Only (Premium Quality)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="ttsMode"
              value={TTS_MODES.BROWSER_ONLY}
              checked={ttsMode === TTS_MODES.BROWSER_ONLY}
              onChange={(e) => setTtsMode(e.target.value)}
              className="mr-2"
            />
            <span className="text-sm">Browser Voice Only (Token Free)</span>
          </label>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button 
          onClick={testVoice}
          disabled={isSpeaking || isThinking}
          className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
        >
          Test Current Mode
        </button>
        <button 
          onClick={() => ttsService.testVoice(TTS_MODES.BROWSER_ONLY)}
          disabled={isSpeaking || isThinking}
          className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:bg-gray-400 transition-colors"
        >
          Test Browser Voice
        </button>
      </div>

      {/* Debug Toggle */}
      <div className="mb-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showDebug}
            onChange={(e) => setShowDebug(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm">Show Debug Info</span>
        </label>
      </div>

      {/* Current Status */}
      <div className="text-xs text-gray-600 space-y-1 bg-white p-2 rounded border">
        <div>Current Mode: {ttsMode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
        {lastUsedProvider && (
          <div>Last Used: {lastUsedProvider === 'elevenlabs' ? 'ElevenLabs (Rachel)' : `Browser (${ttsService.getBrowserVoicesInfo().bestFemale})`}</div>
        )}
        <div>Browser Voice Available: {ttsService.getBrowserVoicesInfo().bestFemale}</div>
      </div>
    </div>
  );
};

export default VoiceSettings;