import React from 'react';

const ChatResponse = ({ response }) => {
  if (!response) return null;

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="font-semibold mb-3 text-gray-800 text-lg">AI Response:</h3>
      <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-700">
        {response}
      </p>
    </div>
  );
};

export default ChatResponse;