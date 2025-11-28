// MainScreen.jsx - Updated with live transcription support
import React, { useState, useEffect, useRef, useCallback } from "react";
import { askGemini } from "../../Gemini/GeminiAPIService";
import ttsService from "../../threejs/TTSService";
import { ConversationService } from "../../data/conversationService";
import { supabase } from "../../data/supabase-client";

// Custom Hooks
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { useTextToSpeech } from "./hooks/useTextToSpeech";

// Components
import AvatarContainer from "./components/AvatarContainer";
import StatusIndicators from "./components/StatusIndicators";
import ChatInput from "./components/ChatInput";
import ChatResponse from "./components/ChatResponse";
import VoiceSettings from "./components/VoiceSettings";
import ConversationSidebar from "./components/ConversationSidebar";
import ConversationHistory from "./components/ConversationHistory";
import Authentication from "../authentication/Authentication";
import Header from "./components/Header";
import KeyParts from "./components/KeyParts";

function MainScreen() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [databaseReady, setDatabaseReady] = useState(false);
 
  // Conversational mode state
  const [isConversationalMode, setIsConversationalMode] = useState(false);
  const [pendingInput, setPendingInput] = useState("");

  // Live transcription state
  const baseInputRef = useRef("");
  const isTranscribingRef = useRef(false);

  const {
    isSpeaking: isTTSSpeaking,
    ttsError,
    ttsMode,
    lastUsedProvider,
    setTtsMode,
    speakResponse: originalSpeakResponse,
    stopSpeaking,
    testVoice,
    getVoiceStatusText
  } = useTextToSpeech();

  // Wrapper for speakResponse that handles conversation mode
  const speakResponse = async (text) => {
    // Pause listening before speaking
    if (isConversationalMode && isListening) {
      pauseListening();
    }
   
    try {
      await originalSpeakResponse(text);
    } finally {
      // Resume listening after speaking is done ONLY in conversation mode
      if (isConversationalMode) {
        console.log("AI finished speaking, restarting listening in conversation mode...");
        setTimeout(() => {
          if (isConversationalMode) { // Double check we're still in conversation mode
            console.log("Attempting to restart listening...");
            // Force stop and restart to ensure clean state
            if (isListening) {
              stopListening();
            }
            setTimeout(() => {
              if (isConversationalMode) {
                console.log("Starting fresh listening session...");
                startListening();
              }
            }, 500);
          }
        }, 1000); // Wait 1 second after AI finishes speaking before listening again
      }
    }
  };

  // Handle interim transcription (live display while speaking)
  const handleInterimTranscript = useCallback((interimText) => {
    if (isConversationalMode) {
      // In conversational mode, don't show interim results in input
      return;
    }

    if (!isTranscribingRef.current) {
      // Store the current input as base when transcription starts
      baseInputRef.current = input;
      isTranscribingRef.current = true;
    }
    
    // Update input field with base + interim transcript
    // The speech hook will send us the full accumulated text, so we can display it with interim
    setInput(baseInputRef.current + " " + interimText);
  }, [input, isConversationalMode]);

  // Handle when user starts speaking (interrupts AI if needed)
  const handleSpeechStart = useCallback(() => {
    if (isTTSSpeaking) {
      console.log("User started speaking - interrupting AI");
      stopSpeaking();
    }
  }, [isTTSSpeaking, stopSpeaking]);

  // Handle when user stops speaking (after silence)
  const handleSpeechEnd = useCallback(() => {
    console.log("User stopped speaking");
    isTranscribingRef.current = false;
  }, []);

  // Handle final transcript from speech recognition
  const handleTranscript = useCallback(async (transcript) => {
    console.log("Received transcript:", transcript);
   
    if (isConversationalMode) {
      // In conversational mode, immediately process the transcript
      setPendingInput(transcript);
      await handleSubmit(transcript);
      // The speakResponse function will handle restarting listening after AI responds
    } else {
      // In normal mode, this transcript is the FULL accumulated text
      // Just set it directly to the input field
      setInput(transcript);
      baseInputRef.current = transcript;
      // Don't reset transcription state - keep building
    }
  }, [isConversationalMode]);

  const {
    isListening,
    isSupported,
    isSpeaking: isUserSpeaking,
    isPaused,
    confidence,
    startListening,
    stopListening,
    forceSubmit,
    pauseListening,
    resumeListening
  } = useSpeechRecognition(
    handleTranscript, 
    handleSpeechStart, 
    handleSpeechEnd,
    handleInterimTranscript,
    isConversationalMode // Pass conversational mode to the hook
  );

  // Auth and database setup
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setAuthLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Set sidebar open by default on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };

    handleResize();
   
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Database check
  useEffect(() => {
    const checkDatabase = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase.from('conversations').select('id').limit(1);
        if (!error) {
          setDatabaseReady(true);
          initializeConversation();
        }
      } catch (error) {
        console.error('Error checking database:', error);
        setDatabaseReady(false);
      }
    };
    checkDatabase();
  }, [user]);

  // Database functions
  const initializeConversation = async () => {
    if (!databaseReady) return;
    try {
      const conversations = await ConversationService.getConversations();
   
      if (conversations.length > 0) {
        setCurrentConversationId(conversations[0].id);
        await loadConversationMessages(conversations[0].id);
      } else {
        await initializeNewConversation();
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
      await initializeNewConversation();
    }
  };

  const initializeNewConversation = async () => {
    try {
      const newConversation = await ConversationService.createConversation();
      setCurrentConversationId(newConversation.id);
      setConversationMessages([]);
      setResponse("");
    } catch (error) {
      console.error('Error creating new conversation:', error);
    }
  };

  const loadConversationMessages = async (conversationId) => {
    if (!conversationId || !databaseReady) return;
 
    try {
      const conversation = await ConversationService.getConversation(conversationId);
      const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
   
      setConversationMessages(messages);
   
      const lastAssistantMessage = messages.filter(msg => msg.role === 'assistant').pop();
      setResponse(lastAssistantMessage?.content || "");
   
    } catch (error) {
      console.error('Error loading conversation:', error);
      setConversationMessages([]);
    }
  };

  const saveMessageToConversation = async (content, role) => {
    if (!currentConversationId || !databaseReady) return;
    try {
      const savedMessage = await ConversationService.addMessage(currentConversationId, content, role);
      return savedMessage;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  };

  const updateConversationTitle = async (firstMessage) => {
    if (!currentConversationId || !databaseReady) return;
    try {
      const title = ConversationService.generateTitleFromMessage(firstMessage);
      await ConversationService.updateConversationTitle(currentConversationId, title);
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  };

  const clearInput = useCallback(() => {
    setInput("");
    setPendingInput("");
    baseInputRef.current = "";
    isTranscribingRef.current = false;
  }, []);

  // Updated handleSubmit function
  const handleSubmit = async (overrideInput = null) => {
    const userMessage = overrideInput || input.trim();
    
    if (!userMessage) return;

    setIsThinking(true);
    
    // Clear inputs and reset transcription state
    setInput("");
    setPendingInput("");
    baseInputRef.current = "";
    isTranscribingRef.current = false;
    
    try {
      // Save user message first
      await saveMessageToConversation(userMessage, 'user');
      
      // Update conversation title if this is the first message
      if (conversationMessages.length === 0) {
        await updateConversationTitle(userMessage);
      }

      // Reload conversation messages to show the user message immediately
      await loadConversationMessages(currentConversationId);

      // Get AI response
      const res = await askGemini(userMessage);
      setResponse(res);
      
      // Save assistant response
      await saveMessageToConversation(res, 'assistant');
      
      // Reload conversation messages to show both user and assistant messages
      await loadConversationMessages(currentConversationId);
      
      setIsThinking(false);
      
      // Speak the response after all state updates
      setTimeout(async () => {
        try {
          await speakResponse(res);
        } catch (ttsError) {
          console.error('TTS Error:', ttsError);
          // If TTS fails in conversation mode, still restart listening
          if (isConversationalMode) {
            setTimeout(() => {
              if (isConversationalMode && !isListening) {
                startListening();
              }
            }, 1000);
          }
        }
      }, 100);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMsg = "Sorry, there was an error getting a response. Please try again.";
      setResponse(errorMsg);
      
      try {
        await saveMessageToConversation(errorMsg, 'assistant');
        await loadConversationMessages(currentConversationId);
      } catch (saveError) {
        console.error('Error saving error message:', saveError);
      }
      
      setIsThinking(false);
      
      setTimeout(async () => {
        try {
          await speakResponse(errorMsg);
        } catch (ttsError) {
          console.error('TTS Error on error message:', ttsError);
          // If TTS fails in conversation mode, still restart listening
          if (isConversationalMode) {
            setTimeout(() => {
              if (isConversationalMode && !isListening) {
                startListening();
              }
            }, 1000);
          }
        }
      }, 100);
    }
  };

  // Toggle conversational mode
  const toggleConversationalMode = () => {
    if (isConversationalMode) {
      // Turning off conversational mode
      stopListening();
      setIsConversationalMode(false);
      console.log("Conversation mode turned OFF");
    } else {
      // Turning on conversational mode
      setIsConversationalMode(true);
      console.log("Conversation mode turned ON - starting to listen...");
      handleStartListening();
    }
  };

  const handleStartListening = () => {
    if (isTTSSpeaking) {
      stopSpeaking();
    }
    // In normal mode, keep existing input as base
    // In conversational mode, start fresh
    if (!isConversationalMode) {
      baseInputRef.current = input;
    } else {
      baseInputRef.current = "";
    }
    isTranscribingRef.current = false;
    
    console.log("handleStartListening called, conversational mode:", isConversationalMode);
    startListening();
  };

  const handleStopListening = () => {
    stopListening();
    // Don't reset base input when stopping in normal mode
    // Only reset in conversational mode
    if (isConversationalMode) {
      baseInputRef.current = "";
      setIsConversationalMode(false);
    }
    isTranscribingRef.current = false;
  };

  // Conversation management
  const handleConversationSelect = async (conversationId) => {
    setCurrentConversationId(conversationId);
    await loadConversationMessages(conversationId);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleNewConversation = async (conversationId) => {
    setCurrentConversationId(conversationId);
    setConversationMessages([]);
    setResponse("");
    setInput("");
    baseInputRef.current = "";
    isTranscribingRef.current = false;
    // Close sidebar on mobile after creating new conversation
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Updated props
  const voiceControlsProps = {
    isListening,
    isSupported,
    startListening: handleStartListening,
    stopListening: handleStopListening,
    clearInput,
    hasInput: !!input,
    isSpeaking: isTTSSpeaking,
    isThinking,
    isConversationalMode,
    toggleConversationalMode,
    isUserSpeaking
  };

  const statusProps = {
    isListening,
    countdown: 0,
    isThinking,
    isSpeaking: isTTSSpeaking,
    isUserSpeaking,
    ttsError,
    getVoiceStatusText,
    stopSpeaking,
    isConversationalMode,
    pendingInput,
    isPaused,
    confidence // Add confidence to status
  };

  const voiceSettingsProps = {
    ttsMode,
    setTtsMode,
    testVoice,
    isSpeaking: isTTSSpeaking,
    isThinking
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Authentication />;
  }

  return (
    <div className="relative h-screen w-full bg-white flex overflow-hidden">
      <ConversationSidebar
        currentConversationId={currentConversationId}
        onConversationSelect={handleConversationSelect}
        onNewConversation={handleNewConversation}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={setSidebarCollapsed}
      />
   
      <Header
        isSidebarOpen={sidebarOpen}
        isSidebarCollapsed={sidebarCollapsed}
        voiceSettingsProps={voiceSettingsProps}
      />
   
      {/* Main content area */}
      <div className={`
        flex-1 flex flex-col relative pt-16 bg-white min-w-0
        transition-all duration-300 ease-in-out
        ${sidebarOpen && !sidebarCollapsed ? 'md:ml-0' : ''}
      `}>
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">MedPal</h1>
          <div className="w-10" />
        </div>

        {/* Compact Header at Top */}
        <div className="flex-shrink-0 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                MedPal
              </h1>

              {/* Conversational Mode Toggle - Compact */}
              <button
                onClick={toggleConversationalMode}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  isConversationalMode
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  {isConversationalMode ? 'Conversation ON' : 'Conversation OFF'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Layout Container */}
        <div className="flex-1 flex flex-col p-3 lg:p-4 overflow-hidden min-h-0">
          <div className="max-w-7xl mx-auto w-full flex flex-col h-full min-h-0">
            {/* Main Content Layout */}
            <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
              {/* Left side - Avatar, Messages, and Input */}
              <div className="flex-1 lg:flex-[3] flex flex-col min-h-0 overflow-hidden">
                {/* Avatar Section - More compact */}
                <div className="flex justify-center flex-shrink-0 mb-2">
                  <AvatarContainer
                    isSpeaking={isTTSSpeaking}
                    currentAudio={ttsService.currentAudio}
                    currentText={response}
                    showDebug={showDebug}
                  />
                </div>

                <div className="flex-shrink-0 mb-2">
                  <StatusIndicators {...statusProps} />
                </div>

                {/* Conversation History - Flexible height */}
                <div className="flex-1 min-h-0 mb-3 overflow-hidden">
                  <ConversationHistory
                    databaseReady={databaseReady}
                    conversationMessages={conversationMessages}
                    isConversationalMode={isConversationalMode}
                  />
                </div>

                {/* Chat Input - Only show if not in conversational mode */}
                {!isConversationalMode && (
                  <div className="flex-shrink-0">
                    <ChatInput
                      input={input}
                      setInput={setInput}
                      isThinking={isThinking}
                      voiceControlsProps={voiceControlsProps}
                      onSubmit={() => handleSubmit()}
                    />
                  </div>
                )}
              </div>

              {/* Right side - KeyParts */}
              <div className="flex-1 lg:flex-[2] min-h-0 overflow-hidden">
                <KeyParts
                  response={response || "Welcome to MedPal! I'm Dr. Theresa, your personal medical doctor. I'm here to help diagnose symptoms, recommend treatments, and answer your health questions with professional medical expertise."}
                  conversationId={currentConversationId}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainScreen;