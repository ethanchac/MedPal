// TTSService.js - Enhanced version with proper browser TTS audio object for lip sync

// ElevenLabs configuration
const ELEVEN_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
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
    this.currentUtterance = null;
    this.audioContext = null;
    this.browserAudioMock = null;
    this.loadBrowserVoices();
  }

  // Load and cache browser voices
  loadBrowserVoices() {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      if (voices.length > 0) {
        this.browserVoices = voices;
        this.bestFemaleVoice = this.findBestFemaleVoice(voices);
        console.log('Best female voice found:', this.bestFemaleVoice?.name);
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

  // Enhanced mock audio object for browser TTS with better lip sync support
  createBrowserTTSAudioObject(utterance) {
    const mockAudio = {
      // Properties that lip sync checks
      currentTime: 0,
      duration: 0,
      paused: false,
      ended: false,
      
      // Enhanced for lip sync
      _startTime: null,
      _isPlaying: false,
      _speechRate: utterance.rate || 1,
      _speechText: utterance.text,
      
      // Methods
      pause: () => {
        window.speechSynthesis.cancel();
        mockAudio.paused = true;
        mockAudio._isPlaying = false;
      },
      
      play: () => {
        mockAudio.paused = false;
        mockAudio._isPlaying = true;
        return Promise.resolve();
      },
      
      // Event handlers
      onplay: null,
      onended: null,
      onloadstart: null,
      
      // Enhanced properties for lip sync
      _utterance: utterance,
      _isBrowserTTS: true,
      
      // Method to get current playback position (estimated)
      getCurrentPlaybackPosition: () => {
        if (!mockAudio._startTime || !mockAudio._isPlaying) return 0;
        const elapsed = (Date.now() - mockAudio._startTime) / 1000;
        return Math.min(elapsed, mockAudio.duration || elapsed);
      }
    };

    // Estimate duration based on speech rate and text length
    const estimatedDuration = (utterance.text.length * 0.1) / (utterance.rate || 1);
    mockAudio.duration = estimatedDuration;

    return mockAudio;
  }

  // Enhanced browser TTS with better timing and lip sync support
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
        this.currentUtterance = utterance;
        
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

        // Create enhanced mock audio object for lip sync compatibility
        const mockAudio = this.createBrowserTTSAudioObject(utterance);
        this.browserAudioMock = mockAudio;

        utterance.onstart = () => {
          hasStarted = true;
          mockAudio.paused = false;
          mockAudio._isPlaying = true;
          mockAudio._startTime = Date.now();
          
          // Start a timer to update currentTime for smooth lip sync
          mockAudio._timeUpdateInterval = setInterval(() => {
            if (mockAudio._isPlaying) {
              mockAudio.currentTime = mockAudio.getCurrentPlaybackPosition();
            }
          }, 50); // Update every 50ms for smooth lip sync
          
          if (mockAudio.onplay) mockAudio.onplay();
          if (onStart) onStart();
          console.log('Browser TTS started with enhanced mock audio object');
        };

        utterance.onend = () => {
          if (!hasEnded) {
            hasEnded = true;
            mockAudio.ended = true;
            mockAudio.paused = true;
            mockAudio._isPlaying = false;
            
            // Clean up timer
            if (mockAudio._timeUpdateInterval) {
              clearInterval(mockAudio._timeUpdateInterval);
            }
            
            if (mockAudio.onended) mockAudio.onended();
            if (onEnd) onEnd();
            resolve(mockAudio); // Return the mock audio object
          }
        };

        utterance.onerror = (event) => {
          if (!hasEnded) {
            hasEnded = true;
            mockAudio.ended = true;
            mockAudio.paused = true;
            mockAudio._isPlaying = false;
            
            // Clean up timer
            if (mockAudio._timeUpdateInterval) {
              clearInterval(mockAudio._timeUpdateInterval);
            }
            
            // Don't log interrupted errors as they're expected when stopping
            if (event.error !== 'interrupted') {
              console.error('Browser TTS error:', event.error);
            }
            if (onEnd) onEnd();
            // Don't reject on interrupted errors
            if (event.error === 'interrupted') {
              resolve(mockAudio);
            } else {
              reject(new Error(`Browser TTS error: ${event.error}`));
            }
          }
        };

        try {
          window.speechSynthesis.speak(utterance);
          
          // Set this as current audio immediately so lip sync can detect it
          this.currentAudio = mockAudio;
          
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
        // Use browser TTS only - now returns proper audio object
        const audioObject = await this.speakWithBrowser(cleanText, onStart, onEnd);
        this.currentAudio = audioObject;
        return { provider: 'browser', success: true, audioObject };
      }

      if (this.mode === TTS_MODES.ELEVENLABS_ONLY) {
        // Use ElevenLabs only (no fallback)
        this.currentAudio = await this.speakWithElevenLabs(cleanText, onStart, onEnd);
        return { provider: 'elevenlabs', success: true, audioObject: this.currentAudio };
      }

      if (this.mode === TTS_MODES.ELEVENLABS_WITH_FALLBACK) {
        // Try ElevenLabs first, fallback to browser
        try {
          this.currentAudio = await this.speakWithElevenLabs(cleanText, onStart, onEnd);
          return { provider: 'elevenlabs', success: true, audioObject: this.currentAudio };
        } catch (elevenLabsError) {
          console.warn('ElevenLabs failed, falling back to browser TTS:', elevenLabsError.message);
          
          // Fallback to browser TTS
          const audioObject = await this.speakWithBrowser(cleanText, onStart, onEnd);
          this.currentAudio = audioObject;
          return { provider: 'browser', success: true, fallback: true, audioObject };
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

  // Enhanced stop method
  stop() {
    // Stop ElevenLabs audio
    if (this.currentAudio && this.currentAudio.pause) {
      this.currentAudio.pause();
      if (this.currentAudio.currentTime !== undefined) {
        this.currentAudio.currentTime = 0;
      }
    }
    
    // Stop browser TTS
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Clean up browser TTS timers
    if (this.browserAudioMock && this.browserAudioMock._timeUpdateInterval) {
      clearInterval(this.browserAudioMock._timeUpdateInterval);
    }
    
    this.currentAudio = null;
    this.currentUtterance = null;
    this.browserAudioMock = null;
  }

  // Get current audio object (for lip sync)
  getCurrentAudio() {
    return this.currentAudio;
  }

  // Enhanced check if currently speaking
  isSpeaking() {
    if (this.currentAudio) {
      if (this.currentAudio._isBrowserTTS) {
        return window.speechSynthesis.speaking && this.currentAudio._isPlaying;
      } else {
        return !this.currentAudio.paused && !this.currentAudio.ended;
      }
    }
    return false;
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

    const testText = "Hello! I'm Dr. Theresa, your personal medical doctor. This is a voice test.";

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