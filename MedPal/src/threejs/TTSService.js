// TTSService.js - Text-to-Speech service with ElevenLabs and browser backup

// ElevenLabs configuration
const ELEVEN_API_KEY = "sk_3871da300d6800b32af45290ac1cd889a75b425d43bfaa50";
const RACHEL_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

// Voice preference modes
export const TTS_MODES = {
  ELEVENLABS_ONLY: 'elevenlabs_only',
  BROWSER_ONLY: 'browser_only',
  ELEVENLABS_WITH_FALLBACK: 'elevenlabs_with_fallback'
};

class TTSService {
  constructor() {
    this.currentAudio = null;
    this.browserVoices = [];
    this.bestFemaleVoice = null;
    this.mode = TTS_MODES.ELEVENLABS_WITH_FALLBACK;
    this.loadBrowserVoices();
  }

  // Load and cache browser voices
  loadBrowserVoices() {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      if (voices.length > 0) {
        this.browserVoices = voices;
        this.bestFemaleVoice = this.findBestFemaleVoice(voices);
      }
    };

    // Load voices immediately if available
    loadVoices();
    
    // Also listen for voices changed event
    if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  // Find the best female voice from available browser voices
  findBestFemaleVoice(voices) {
    // Priority list of natural-sounding female voices
    const preferredVoices = [
      // iOS/macOS voices (very natural)
      'Samantha', 'Alex', 'Ava (Enhanced)', 'Ava', 'Allison', 'Susan', 'Karen',
      
      // Google voices (good quality)
      'Google US English Female', 'Google English (US) Female', 'Google UK English Female',
      
      // Windows voices
      'Microsoft Zira - English (United States)', 'Microsoft Aria - English (United States)', 
      'Microsoft Jenny - English (United States)', 'Microsoft Eva - English (United States)',
      'Zira', 'Aria', 'Jenny', 'Eva',
      
      // Other common voices
      'Alice', 'Kate', 'Victoria', 'English Female', 'Female'
    ];

    // First, try exact name matches
    for (const preferredName of preferredVoices) {
      const voice = voices.find(v => v.name === preferredName);
      if (voice) return voice;
    }

    // Then try partial matches
    for (const preferredName of preferredVoices) {
      const voice = voices.find(v => 
        v.name.toLowerCase().includes(preferredName.toLowerCase())
      );
      if (voice) return voice;
    }

    // Fallback: find any female-sounding voice
    const femaleVoice = voices.find(voice => {
      const name = voice.name.toLowerCase();
      return (
        name.includes('female') || name.includes('woman') || name.includes('girl') ||
        (voice.lang.startsWith('en') && 
         (name.includes('samantha') || name.includes('allison') || 
          name.includes('ava') || name.includes('kate') || 
          name.includes('victoria') || name.includes('susan') ||
          name.includes('zira') || name.includes('alice')))
      );
    });

    return femaleVoice || voices.find(v => v.lang.startsWith('en')) || voices[0];
  }

  // ElevenLabs TTS
  async speakWithElevenLabs(text, onStart, onEnd) {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${RACHEL_VOICE_ID}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": ELEVEN_API_KEY,
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.8,
              style: 0.0,
              use_speaker_boost: true
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      if (onStart) audio.onplay = onStart;
      if (onEnd) {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          onEnd();
        };
      }

      await audio.play();
      return audio;
    } catch (error) {
      console.error("ElevenLabs TTS Error:", error);
      throw error;
    }
  }

  // Browser TTS with optimized female voice
  async speakWithBrowser(text, onStart, onEnd) {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error("Browser TTS not supported"));
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Use the best female voice we found
        if (this.bestFemaleVoice) {
          utterance.voice = this.bestFemaleVoice;
        }

        // Optimize speech parameters based on voice
        if (this.bestFemaleVoice) {
          const voiceName = this.bestFemaleVoice.name.toLowerCase();
          
          if (voiceName.includes('samantha')) {
            utterance.rate = 0.85;
            utterance.pitch = 1.0;
            utterance.volume = 0.9;
          } else if (voiceName.includes('google')) {
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            utterance.volume = 0.85;
          } else if (voiceName.includes('zira') || voiceName.includes('aria')) {
            utterance.rate = 0.95;
            utterance.pitch = 1.05;
            utterance.volume = 0.9;
          } else {
            // Default optimized female voice settings
            utterance.rate = 0.88;
            utterance.pitch = 1.15;
            utterance.volume = 0.85;
          }
        }

        let hasStarted = false;
        let hasEnded = false;

        utterance.onstart = () => {
          hasStarted = true;
          if (onStart) onStart();
        };

        utterance.onend = () => {
          if (!hasEnded) {
            hasEnded = true;
            if (onEnd) onEnd();
            resolve();
          }
        };

        utterance.onerror = (event) => {
          if (!hasEnded) {
            hasEnded = true;
            // Don't log interrupted errors as they're expected when stopping
            if (event.error !== 'interrupted') {
              console.error('Browser TTS error:', event.error);
            }
            if (onEnd) onEnd();
            // Don't reject on interrupted errors
            if (event.error === 'interrupted') {
              resolve();
            } else {
              reject(new Error(`Browser TTS error: ${event.error}`));
            }
          }
        };

        try {
          window.speechSynthesis.speak(utterance);
          this.currentAudio = { 
            pause: () => window.speechSynthesis.cancel(),
            currentTime: 0 
          };
        } catch (error) {
          if (!hasEnded) {
            hasEnded = true;
            reject(error);
          }
        }
      }, 100);
    });
  }

  // Main speak function with fallback logic
  async speak(text, onStart, onEnd, onError) {
    if (!text) return;

    // Stop any current speech
    this.stop();

    // Clean text for better speech
    const cleanText = this.cleanTextForSpeech(text);

    try {
      if (this.mode === TTS_MODES.BROWSER_ONLY) {
        // Use browser TTS only
        await this.speakWithBrowser(cleanText, onStart, onEnd);
        return { provider: 'browser', success: true };
      }

      if (this.mode === TTS_MODES.ELEVENLABS_ONLY) {
        // Use ElevenLabs only (no fallback)
        this.currentAudio = await this.speakWithElevenLabs(cleanText, onStart, onEnd);
        return { provider: 'elevenlabs', success: true };
      }

      if (this.mode === TTS_MODES.ELEVENLABS_WITH_FALLBACK) {
        // Try ElevenLabs first, fallback to browser
        try {
          this.currentAudio = await this.speakWithElevenLabs(cleanText, onStart, onEnd);
          return { provider: 'elevenlabs', success: true };
        } catch (elevenLabsError) {
          console.warn('ElevenLabs failed, falling back to browser TTS:', elevenLabsError.message);
          
          // Fallback to browser TTS
          await this.speakWithBrowser(cleanText, onStart, onEnd);
          return { provider: 'browser', success: true, fallback: true };
        }
      }

    } catch (error) {
      console.error('All TTS methods failed:', error);
      if (onError) onError(error);
      if (onEnd) onEnd();
      return { success: false, error: error.message };
    }
  }

  // Clean text for better speech synthesis
  cleanTextForSpeech(text) {
    return text
      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      // Convert numbers and abbreviations
      .replace(/(\d+)%/g, '$1 percent')
      .replace(/(\d+)\s*mg/g, '$1 milligrams')
      .replace(/(\d+)\s*ml/g, '$1 milliliters')
      .replace(/\bDr\./g, 'Doctor')
      .replace(/\bMr\./g, 'Mister')
      .replace(/\bMrs\./g, 'Missus')
      .replace(/\bMs\./g, 'Miss');
  }

  // Stop current speech
  stop() {
    // Stop ElevenLabs audio
    if (this.currentAudio && this.currentAudio.pause) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
    
    // Stop browser TTS
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    this.currentAudio = null;
  }

  // Set TTS mode
  setMode(mode) {
    if (Object.values(TTS_MODES).includes(mode)) {
      this.mode = mode;
      console.log(`TTS mode set to: ${mode}`);
    }
  }

  // Get current mode
  getMode() {
    return this.mode;
  }

  // Get available browser voices info
  getBrowserVoicesInfo() {
    return {
      total: this.browserVoices.length,
      bestFemale: this.bestFemaleVoice?.name || 'None found',
      allVoices: this.browserVoices.map(v => ({ name: v.name, lang: v.lang }))
    };
  }

  // Test voice with sample text
  async testVoice(mode = null) {
    const testMode = mode || this.mode;
    const originalMode = this.mode;
    
    if (mode) this.setMode(mode);
    
    const testText = "Hello! I'm your AI medical assistant. This is a voice test.";
    
    try {
      const result = await this.speak(
        testText,
        () => console.log(`Testing ${testMode} voice...`),
        () => console.log(`${testMode} voice test completed`),
        (error) => console.error(`${testMode} voice test failed:`, error)
      );
      
      if (mode) this.setMode(originalMode); // Restore original mode
      return result;
    } catch (error) {
      if (mode) this.setMode(originalMode);
      throw error;
    }
  }
}

// Create and export singleton instance
const ttsService = new TTSService();
export default ttsService;