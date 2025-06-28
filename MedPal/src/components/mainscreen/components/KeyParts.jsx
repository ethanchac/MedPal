import React, { useState, useEffect } from 'react';
import { Clipboard } from 'lucide-react';

const KeyParts = ({ response, conversationId, isVisible = true }) => {
  const [allNotes, setAllNotes] = useState([]);
  const [lastConversationId, setLastConversationId] = useState(null);

  // Extract simple key points from AI response
  const extractKeyParts = (text) => {
    if (!text || text.trim().length === 0) return [];

    const keyParts = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);

    sentences.forEach((sentence) => {
      const cleanSentence = sentence.trim();
      if (cleanSentence) {
        // Only keep medical-relevant sentences
        if (/symptom|pain|ache|feel|experience|discomfort|recommend|suggest|should|treatment|therapy|take|dose|medication|pill|tablet|medicine|follow.?up|appointment|visit|check|monitor|diagnose|condition|test|result/i.test(cleanSentence)) {
          keyParts.push(cleanSentence);
        }
      }
    });

    return keyParts.slice(0, 3); // Max 3 new notes per response
  };

  // Clear notes when conversation changes
  useEffect(() => {
    if (conversationId !== lastConversationId) {
      setAllNotes([]);
      setLastConversationId(conversationId);
    }
  }, [conversationId, lastConversationId]);

  // Add new notes when response changes (don't replace, just add)
  useEffect(() => {
    if (response) {
      const newParts = extractKeyParts(response);
      if (newParts.length > 0) {
        setAllNotes(prevNotes => [
          ...prevNotes,
          ...newParts.map(note => ({
            id: `note-${Date.now()}-${Math.random()}`,
            text: note,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }))
        ]);
      }
    }
  }, [response]);

  if (!isVisible) return null;

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-md border border-gray-200 p-4 flex flex-col" style={{ minHeight: '400px' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
        <Clipboard className="w-5 h-5 text-gray-600" />
        <h3 className="font-medium text-gray-800">Notes</h3>
        <span className="text-xs text-gray-500 ml-auto">{allNotes.length} items</span>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
        {allNotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clipboard className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Medical notes will appear here</p>
          </div>
        ) : (
          allNotes.map((note) => (
            <div
              key={note.id}
              className="p-3 bg-gray-50 rounded border-l-3 border-l-blue-400 hover:bg-gray-100 transition-colors"
            >
              <p className="text-sm text-gray-800 leading-relaxed">{note.text}</p>
              <span className="text-xs text-gray-500 mt-1 block">{note.timestamp}</span>
            </div>
          ))
        )}
      </div>
    </div>
    </div>
  );
};

export default KeyParts;