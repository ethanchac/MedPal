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
      <div className="h-full flex items-center justify-center p-8 text-gray-500">
        <div className="text-center">
          <p>Start a conversation to see messages here</p>
          <p className="text-xs mt-2">
            {isConversationalMode
              ? "🎙️ Conversation mode is ON - just start talking!"
              : "Click the microphone or type your message"
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
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
                {message.created_at ? new Date(message.created_at).toLocaleTimeString() : 'Now'}
              </span>
            </div>
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationHistory;