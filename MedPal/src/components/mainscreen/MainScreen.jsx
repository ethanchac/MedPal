// MainScreen.jsx - Clean version without debugging
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
 const [sidebarOpen, setSidebarOpen] = useState(true);
 const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
 const [databaseReady, setDatabaseReady] = useState(false);




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




 useEffect(() => {
   const checkDatabase = async () => {
     if (!user) return;
     try {
       const { data, error } = await supabase.from('conversations').select('id').limit(1);
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
       try {
         await saveMessageToConversation(errorMsg, 'assistant');
         await loadConversationMessages(currentConversationId);
       } catch (saveError) {
         console.error('Error saving error message:', saveError);
       }
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
   setSidebarOpen(true);
 };




 const handleNewConversation = async (conversationId) => {
   setCurrentConversationId(conversationId);
   setConversationMessages([]);
   setResponse("");
   setInput("");
   setSidebarOpen(true);
 };




 const toggleSidebar = () => {
   setSidebarOpen(!sidebarOpen);
 };




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
   <div className="relative h-screen w-full bg-white flex">
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
   
     <div className="flex-1 flex flex-col relative pt-16 bg-white">
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




       {/* Layout Container */}
       <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto">
         <div className="max-w-7xl mx-auto flex flex-col space-y-4">
           {/* Header with Title */}
           <div className="flex-shrink-0">
             <h1 className="text-3xl md:text-4xl font-bold text-center text-black">
               MedPal
             </h1>
           </div>




           {/* Main Content Layout */}
           <div className="flex gap-6">
             {/* Left side - Avatar, Messages, and Input (60% width) */}
             <div className="w-3/5 flex flex-col space-y-4">
               {/* Avatar Section */}
               <div className="flex justify-center">
                 <AvatarContainer
                   isSpeaking={isSpeaking}
                   currentAudio={ttsService.currentAudio}
                   showDebug={showDebug}
                 />
               </div>




               <StatusIndicators {...statusProps} />




               {/* Conversation History */}
               <div className="max-h-80 overflow-y-auto">
                 {!databaseReady ? (
                   <div className="flex items-center justify-center p-8 text-gray-500">
                     <div className="text-center">
                       <p>Loading database...</p>
                       <p className="text-xs mt-1">Please wait</p>
                     </div>
                   </div>
                 ) : conversationMessages.length > 0 ? (
                   <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                     {conversationMessages.map((message, index) => (
                       <div
                         key={message.id || index}
                         className={`p-4 rounded-xl ${
                           message.role === 'user'
                             ? 'bg-[#ED1C24] text-white ml-8'
                             : 'bg-white text-gray-800 mr-8 border border-gray-200'
                         }`}
                       >
                         <div className="flex items-start gap-2 mb-2 text-xs">
                           <span className="font-semibold uppercase tracking-wide opacity-75">
                             {message.role === 'user' ? 'You' : 'Assistant'}
                           </span>
                           <span className="opacity-50">
                             {new Date(message.created_at).toLocaleTimeString()}
                           </span>
                         </div>
                         <p className="text-sm leading-relaxed">{message.content}</p>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="flex items-center justify-center p-8 text-gray-500">
                     <div className="text-center">
                       <p>Start a conversation to see messages here</p>
                     </div>
                   </div>
                 )}
               </div>




               {/* Chat Input */}
               <ChatInput
                 input={input}
                 setInput={setInput}
                 isThinking={isThinking}
                 voiceControlsProps={voiceControlsProps}
                 onSubmit={handleSubmit}
               />
             </div>
           
             {/* Right side - KeyParts (40% width) */}
             <div className="w-2/5">
               <KeyParts
                 response={response || "Welcome to MedPal! I'm here to help with your medical questions. Feel free to ask about symptoms, treatments, or general health advice."}
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

