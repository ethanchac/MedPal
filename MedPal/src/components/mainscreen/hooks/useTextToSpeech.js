import { useState, useEffect, useRef } from 'react';
import ttsService, { TTS_MODES } from '../../../threejs/TTSService';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [ttsError, setTtsError] = useState(null);
  const [ttsMode, setTtsMode] = useState(TTS_MODES.BROWSER_ONLY); // Default to browser TTS
  const [lastUsedProvider, setLastUsedProvider] = useState(null);

  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    ttsService.setMode(ttsMode);
  }, [ttsMode]);

  useEffect(() => {
    return () => {
      ttsService.stop();
      setCurrentAudio(null);
      stopPolling();
    };
  }, []);

  const startPolling = () => {
    if (pollingIntervalRef.current) return;
    pollingIntervalRef.current = setInterval(() => {
      try {
        const isCurrentlySpeaking = ttsService.isSpeaking();
        setIsSpeaking(isCurrentlySpeaking);

        const audioObj = ttsService.getCurrentAudio();
        setCurrentAudio(audioObj);

        if (!isCurrentlySpeaking) {
          stopPolling();
        }
      } catch (error) {
        console.error('Polling error:', error);
        stopPolling();
      }
    }, 100);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const speakResponse = async (text) => {
    if (!text) return;

    setTtsError(null);
    setLastUsedProvider(null);
    setCurrentAudio(null);

    try {
      const result = await ttsService.speak(
        text,
        () => {
          // onStart callback
          setIsSpeaking(true);
          startPolling();
        },
        () => {
          // onEnd callback
          setIsSpeaking(false);
          setCurrentAudio(null);
          stopPolling();
        },
        (error) => {
          // onError callback
          console.error('TTS Error:', error);
          setTtsError(`Voice synthesis failed: ${error.message}`);
          setIsSpeaking(false);
          setCurrentAudio(null);
          stopPolling();
        }
      );

      // Handle result after the async operation
      if (result?.success) {
        setLastUsedProvider(result.provider);

        // Set audio object for ALL providers (including browser TTS for lip sync)
        const audioObj = ttsService.getCurrentAudio();
        if (audioObj) {
          setCurrentAudio(audioObj);
          console.log('Audio object set for lip sync:', result.provider, audioObj);
        }

        if (result.fallback) {
          setTtsError(`ElevenLabs failed, using browser voice instead`);
          setTimeout(() => setTtsError(null), 3000);
        }
      } else {
        setTtsError(result?.error || 'Voice synthesis failed');
        setIsSpeaking(false);
        setCurrentAudio(null);
        stopPolling();
      }
    } catch (error) {
      console.error('TTS Hook Error:', error);
      setTtsError('All voice synthesis methods failed. Please try again.');
      setIsSpeaking(false);
      setCurrentAudio(null);
      stopPolling();
    }
  };

  const stopSpeaking = () => {
    try {
      ttsService.stop();
      setIsSpeaking(false);
      setCurrentAudio(null);
      stopPolling();
    } catch (error) {
      console.error('Error stopping TTS:', error);
    }
  };

  const testVoice = async () => {
    const testText = "Hello! I'm your AI medical assistant. How can I help you today?";
    await speakResponse(testText);
  };

  const getVoiceStatusText = () => {
    if (!isSpeaking) return '';
    
    try {
      if (lastUsedProvider === 'elevenlabs') return 'Rachel (ElevenLabs) is speaking...';
      if (lastUsedProvider === 'browser') {
        const browserInfo = ttsService.getBrowserVoicesInfo();
        return `${browserInfo?.bestFemale || 'Browser voice'} is speaking...`;
      }
      return 'AI is speaking...';
    } catch (error) {
      console.error('Error getting voice status:', error);
      return 'AI is speaking...';
    }
  };

  return {
    isSpeaking,
    currentAudio,
    ttsError,
    ttsMode,
    lastUsedProvider,
    setTtsMode,
    speakResponse,
    stopSpeaking,
    testVoice,
    getVoiceStatusText,
  };
};