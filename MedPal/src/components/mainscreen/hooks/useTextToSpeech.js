import { useState, useEffect } from 'react';
import ttsService, { TTS_MODES } from '../../../threejs/TTSService';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsError, setTtsError] = useState(null);
  const [ttsMode, setTtsMode] = useState(TTS_MODES.ELEVENLABS_WITH_FALLBACK);
  const [lastUsedProvider, setLastUsedProvider] = useState(null);

  useEffect(() => {
    ttsService.setMode(ttsMode);
  }, [ttsMode]);

  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, []);

  const speakResponse = async (text) => {
    if (!text) return;

    setTtsError(null);
    setLastUsedProvider(null);

    try {
      const result = await ttsService.speak(
        text,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false),
        (error) => {
          console.error('TTS Error:', error.message);
          setTtsError(`Voice synthesis failed: ${error.message}`);
          setIsSpeaking(false);
        }
      );

      if (result && result.success) {
        setLastUsedProvider(result.provider);
        if (result.fallback) {
          setTtsError(`ElevenLabs failed, using browser voice instead`);
          setTimeout(() => setTtsError(null), 3000);
        }
      } else if (result && !result.success) {
        setTtsError(result.error || 'Voice synthesis failed');
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('Error with TTS:', error);
      setTtsError('All voice synthesis methods failed. Please try again.');
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    ttsService.stop();
    setIsSpeaking(false);
  };

  const testVoice = async () => {
    const testText = "Hello! I'm your AI medical assistant. How can I help you today?";
    await speakResponse(testText);
  };

  const getVoiceStatusText = () => {
    if (!isSpeaking) return '';
    
    if (lastUsedProvider === 'elevenlabs') {
      return 'Rachel (ElevenLabs) is speaking...';
    } else if (lastUsedProvider === 'browser') {
      const browserInfo = ttsService.getBrowserVoicesInfo();
      return `${browserInfo.bestFemale} is speaking...`;
    }
    return 'AI is speaking...';
  };

  return {
    isSpeaking,
    ttsError,
    ttsMode,
    lastUsedProvider,
    setTtsMode,
    speakResponse,
    stopSpeaking,
    testVoice,
    getVoiceStatusText
  };
};