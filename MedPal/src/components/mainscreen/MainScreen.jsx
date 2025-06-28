import React, { useState, useEffect } from "react";
import { askGemini } from "../../Gemini/GeminiAPIService";
import ttsService from "../../threejs/TTSService";
import { ConversationService } from "../../data/conversationService";
import { supabase } from "../../data/supabase-client";

// Custom Hooks
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { useTextToSpeech } from "./hooks/useTextToSpeech";
import { useAutoSubmit } from "./hooks/useAutoSubmit";

// Components
import AvatarContainer from "./components/AvatarContainer";
import StatusIndicators from "./components/StatusIndicators";
import ChatInput from "./components/ChatInput";
import ChatResponse from "./components/ChatResponse";
import VoiceSettings from "./components/VoiceSettings";
import ConversationSidebar from "./components/ConversationSidebar";
import Authentication from "../authentication/Authentication";

function MainScreen() {
  // Authentication state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Chat state
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Conversation state
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Start open on desktop
  const [databaseReady, setDatabaseReady] = useState(false);

  // Custom hooks
  const {
    isSpeaking,
    ttsError,
    ttsMode,
    lastUsedProvider,
    setTtsMode,
    speakResponse,
    stopSpeaking,
    testVoice,
    getVoiceStatusText
  } = useTextToSpeech();

  const handleAutoSubmit = async () => {
    stopListening();
    clearAutoSubmitTimers();
    await handleSubmit();
  };

  const { countdown, startAutoSubmitCountdown, clearAutoSubmitTimers } = useAutoSubmit(handleAutoSubmit);

  const handleTranscript = (transcript) => {
    setInput(prevInput => prevInput + transcript);
    startAutoSubmitCountdown();
  };

  const { isListening, isSupported, startListening, stopListening } = useSpeechRecognition(handleTranscript);

  // Authentication effect
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

  // Check if database tables exist and initialize
  useEffect(() => {
    const checkDatabase = async () => {
      if (!user) return;

      try {
        // Try to fetch conversations to see if table exists
        const { data, error } = await supabase
          .from('conversations')
          .select('id')
          .limit(1);

        if (!error) {
          setDatabaseReady(true);
          initializeConversation();
        } else {
          console.warn('Database tables not ready:', error.message);
          setDatabaseReady(false);
        }
      } catch (error) {
        console.error('Error checking database:', error);
        setDatabaseReady(false);
      }
    };

    checkDatabase();
  }, [user]);

  // Initialize conversation when ready
  const initializeConversation = async () => {
    if (!databaseReady) return;

    try {
      // Load existing conversations
      const conversations = await ConversationService.getConversations();
      
      if (conversations.length > 0) {
        // Use the most recent conversation
        setCurrentConversationId(conversations[0].id);
        await loadConversationMessages(conversations[0].id);
      } else {
        // Create a new conversation
        await initializeNewConversation();
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
      // Fallback: create a new conversation
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
      setConversationMessages(conversation.messages);
      
      // Set the last assistant message as the current response
      const lastAssistantMessage = conversation.messages
        .filter(msg => msg.role === 'assistant')
        .pop();
      
      setResponse(lastAssistantMessage?.content || "");
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const saveMessageToConversation = async (content, role) => {
    if (!currentConversationId || !databaseReady) return;

    try {
      await ConversationService.addMessage(currentConversationId, content, role);
    } catch (error) {
      console.error('Error saving message:', error);
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

  const clearInput = () => {
    setInput("");
    clearAutoSubmitTimers();
  };

  const handleSubmit = async () => {
    clearAutoSubmitTimers();
    if (input.trim()) {
      const userMessage = input.trim();
      
      setIsThinking(true);
      
      try {
        // Save user message
        await saveMessageToConversation(userMessage, 'user');
        
        // Update conversation title if this is the first message
        if (conversationMessages.length === 0) {
          await updateConversationTitle(userMessage);
        }

        // Get AI response
        const res = await askGemini(userMessage);
        setResponse(res);
        setInput("");
        
        // Save assistant response
        await saveMessageToConversation(res, 'assistant');
        
        // Reload conversation messages to show the new ones
        await loadConversationMessages(currentConversationId);
        
        setIsThinking(false);
        await speakResponse(res);
      } catch (error) {
        console.error('Error getting AI response:', error);
        const errorMsg = "Sorry, there was an error getting a response. Please try again.";
        setResponse(errorMsg);
        await saveMessageToConversation(errorMsg, 'assistant');
        setIsThinking(false);
        await speakResponse(errorMsg);
      }
    }
  };

  const handleStartListening = () => {
    stopSpeaking();
    startListening();
  };

  const handleConversationSelect = async (conversationId) => {
    setCurrentConversationId(conversationId);
    await loadConversationMessages(conversationId);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleNewConversation = async (conversationId) => {
    setCurrentConversationId(conversationId);
    setConversationMessages([]);
    setResponse("");
    setInput("");
    setSidebarOpen(false); // Close sidebar on mobile after creation
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Props for components
  const voiceControlsProps = {
    isListening,
    isSupported,
    startListening: handleStartListening,
    stopListening,
    clearInput,
    hasInput: !!input,
    isSpeaking,
    isThinking
  };

  const statusProps = {
    isListening,
    countdown,
    isThinking,
    isSpeaking,
    ttsError,
    getVoiceStatusText,
    stopSpeaking
  };

  const voiceSettingsProps = {
    ttsMode,
    setTtsMode,
    testVoice,
    isSpeaking,
    isThinking,
    lastUsedProvider,
    showDebug,
    setShowDebug
  };

  // Show loading screen while checking authentication
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

  // Show authentication screen if user is not logged in
  if (!user) {
    return <Authentication />;
  }

  return (
    <div className="relative h-screen w-full bg-gray-50 flex">
      {/* Conversation Sidebar */}
      <ConversationSidebar
        currentConversationId={currentConversationId}
        onConversationSelect={handleConversationSelect}
        onNewConversation={handleNewConversation}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">AI Medical Assistant</h1>
          <div className="w-10" />
        </div>



        {/* Chat Content */}
        <div className="flex-1 w-full p-4 lg:p-6 bg-white overflow-y-auto">
          <div className="max-w-3xl mx-auto pt-4 md:pt-20">
            {/* Desktop Title */}
            <h1 className="hidden md:block text-3xl font-bold mb-6 text-gray-800 text-center">
              AI Medical Assistant
            </h1>
                    {/* Avatar Section */}
            <div className="relative bg-white">
            <AvatarContainer 
            isSpeaking={isSpeaking} 
            currentAudio={ttsService.currentAudio}
            showDebug={showDebug}
          />
        </div>
            {/* Status Indicators */}
            <StatusIndicators {...statusProps} />

            {/* Conversation History */}
            {conversationMessages.length > 0 && (
              <div className="mb-6 space-y-4">
                <div className="max-h-60 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-xl border">
                  {conversationMessages.map((message, index) => (
                    <div
                      key={message.id || index}
                      className={`p-4 rounded-xl ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white ml-8'
                          : 'bg-white text-gray-800 mr-8 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <span className="font-semibold text-xs uppercase tracking-wide opacity-75">
                          {message.role === 'user' ? 'You' : 'Assistant'}
                        </span>
                        <span className="text-xs opacity-50">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input */}
            <ChatInput 
              input={input}
              setInput={setInput}
              isThinking={isThinking}
              voiceControlsProps={voiceControlsProps}
              onSubmit={handleSubmit}
            />

            {/* Response Display */}
            <ChatResponse response={response} />

            {/* Voice Settings */}
            <VoiceSettings {...voiceSettingsProps} />

            {/* User Info Display */}
            <div className="mt-8 p-4 bg-gray-100 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Logged in as:</p>
                  <p className="font-semibold text-gray-800">{user.email}</p>
                </div>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainScreen;