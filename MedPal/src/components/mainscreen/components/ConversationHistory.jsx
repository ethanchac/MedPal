const ConversationHistory = ({ 
  databaseReady, 
  conversationMessages, 
  isConversationalMode 
}) => {
  if (!databaseReady) {
    return (
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="flex items-center justify-center p-8 text-gray-500 h-full">
          <div className="text-center">
            <p>Loading database...</p>
            <p className="text-xs mt-1">Please wait</p>
          </div>
        </div>
      </div>
    );
  }

  if (conversationMessages.length === 0) {
    return (
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="flex items-center justify-center p-8 text-gray-500 h-full">
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
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
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
                  {new Date(message.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConversationHistory;