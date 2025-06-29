// ✅ useTextToSpeech.js - updated to distinguish browser voice
import { useState, useEffect, useRef } from 'react';
import ttsService, { TTS_MODES } from '../../../threejs/TTSService';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [ttsError, setTtsError] = useState(null);
  const [ttsMode, setTtsMode] = useState(TTS_MODES.ELEVENLABS_WITH_FALLBACK);
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
      const isCurrentlySpeaking = ttsService.isSpeaking();
      setIsSpeaking(isCurrentlySpeaking);

      const audioObj = ttsService.getCurrentAudio();
      setCurrentAudio(audioObj);

      if (!isCurrentlySpeaking) {
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
          setIsSpeaking(true);
          const isBrowser = result?.provider === 'browser';
          setCurrentAudio(isBrowser ? null : ttsService.getCurrentAudio());
          startPolling();
        },
        () => {
          setIsSpeaking(false);
          setCurrentAudio(null);
          stopPolling();
        },
        (error) => {
          setTtsError(`Voice synthesis failed: ${error.message}`);
          setIsSpeaking(false);
          setCurrentAudio(null);
          stopPolling();
        }
      );

      if (result?.success) {
        setLastUsedProvider(result.provider);
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
      setTtsError('All voice synthesis methods failed. Please try again.');
      setIsSpeaking(false);
      setCurrentAudio(null);
      stopPolling();
    }
  };

  const stopSpeaking = () => {
    ttsService.stop();
    setIsSpeaking(false);
    setCurrentAudio(null);
    stopPolling();
  };

  const testVoice = async () => {
    const testText = "Hello! I'm your AI medical assistant. How can I help you today?";
    await speakResponse(testText);
  };

  const getVoiceStatusText = () => {
    if (!isSpeaking) return '';
    if (lastUsedProvider === 'elevenlabs') return 'Rachel (ElevenLabs) is speaking...';
    if (lastUsedProvider === 'browser') {
      const browserInfo = ttsService.getBrowserVoicesInfo();
      return `${browserInfo.bestFemale} is speaking...`;
    }
    return 'AI is speaking...';
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
