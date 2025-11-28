// ConversationHistory.jsx - Separate component for conversation history
import React from 'react';

const ConversationHistory = ({ 
  databaseReady, 
  conversationMessages, 
  isConversationalMode 
}) => {
  // Debug: Log the messages to see what we're getting
  console.log('ConversationHistory received:', { databaseReady, conversationMessages, messageCount: conversationMessages?.length });

  if (!databaseReady) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-gray-500">
        <div className="text-center">
          <p>Loading database...</p>
          <p className="text-xs mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  if (!conversationMessages || conversationMessages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-gray-400">
        <div className="text-center">
          <div className="bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600">Start a conversation to see messages</p>
          <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto">
            {isConversationalMode
              ? "🎙️ Conversation mode is ON - just start talking!"
              : "Click the microphone or type your message below"
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-3 p-4 bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-100">
        {conversationMessages.map((message, index) => (
          <div
            key={message.id || index}
            className={`p-4 rounded-xl transition-all duration-200 ${
              message.role === 'user'
                ? 'bg-gradient-to-r from-[#DC143C] to-[#C41230] text-white ml-8 shadow-md'
                : 'bg-white text-gray-800 mr-8 border border-gray-200 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-2 mb-2.5 text-xs">
              <span className={`font-semibold uppercase tracking-wider ${
                message.role === 'user' ? 'opacity-90' : 'text-gray-600'
              }`}>
                {message.role === 'user' ? 'You' : 'Dr. Theresa'}
              </span>
              <span className={message.role === 'user' ? 'opacity-70' : 'text-gray-400'}>
                •
              </span>
              <span className={message.role === 'user' ? 'opacity-70' : 'text-gray-400'}>
                {message.created_at ? new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Now'}
              </span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationHistory;