import React, { useState, useEffect } from 'react';
import { Clipboard, AlertCircle, Lightbulb, Heart, Clock } from 'lucide-react';

const KeyParts = ({ response, conversationId, isVisible = true }) => {
  const [allNotes, setAllNotes] = useState([]);
  const [lastConversationId, setLastConversationId] = useState(null);

  // Enhanced extraction focusing on medical jot notes
  const extractKeyParts = (text) => {
    if (!text || text.trim().length === 0) return [];

    const keyParts = [];

    // Extract diagnosis (first sentence starting with "It is likely you have")
    const diagnosisMatch = text.match(/It is likely you have ([^.]+)\./i);
    if (diagnosisMatch) {
      keyParts.push({
        text: diagnosisMatch[0].trim(),
        type: 'symptom'
      });
    }

    // Extract "What to do:" bullet points
    const whatToDoMatch = text.match(/What to do:([\s\S]*?)(?:\n\n|$)/i);
    if (whatToDoMatch) {
      const bullets = whatToDoMatch[1].split('\n').filter(line => line.trim().startsWith('-'));

      bullets.forEach(bullet => {
        const cleanBullet = bullet.replace(/^-\s*/, '').trim();
        if (cleanBullet.length > 15 && cleanBullet.length < 300) {
          keyParts.push({
            text: cleanBullet,
            type: categorizeNote(cleanBullet)
          });
        }
      });
    }

    // Fallback: Extract any bullet points if "What to do:" wasn't found
    if (keyParts.length <= 1) {
      const lines = text.split('\n');
      lines.forEach(line => {
        if (line.trim().startsWith('-')) {
          const cleanLine = line.replace(/^-\s*/, '').trim();
          if (cleanLine.length > 15 && cleanLine.length < 300) {
            keyParts.push({
              text: cleanLine,
              type: categorizeNote(cleanLine)
            });
          }
        }
      });
    }

    return keyParts.slice(0, 6); // Max 6 notes per response (1 diagnosis + 5 actions)
  };

  // Categorize notes by type for better organization
  const categorizeNote = (text) => {
    // Check for warnings/emergencies first (highest priority)
    if (/seek.*medical|emergency|urgent|immediate|doctor|hospital|911|chest pain|severe|persistent|worsen/i.test(text)) {
      return 'warning';
    }
    // Diagnosis/symptom identification
    else if (/It is likely you have|diagnosis|symptoms?|signs?|condition|disease|pain|ache/i.test(text)) {
      return 'symptom';
    }
    // Treatment actions
    else if (/take|apply|use|drink|eat|medication|pill|tablet|cream|ointment|compress|ice|heat/i.test(text)) {
      return 'treatment';
    }
    // Prevention and lifestyle
    else if (/avoid|prevent|reduce|stop|limit|rest|sleep|elevate|position/i.test(text)) {
      return 'prevention';
    }
    // Tips and helpful info
    else if (/try|consider|helps?|effective|beneficial|good.*for|may.*help|can.*help/i.test(text)) {
      return 'tip';
    }
    else {
      return 'treatment'; // Default to treatment for action items
    }
  };

  // Get icon and color based on note type
  const getNoteStyle = (type) => {
    switch (type) {
      case 'symptom':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          borderColor: 'border-l-red-400',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700'
        };
      case 'treatment':
        return {
          icon: <Heart className="w-4 h-4" />,
          borderColor: 'border-l-green-400',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          borderColor: 'border-l-orange-400',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-700'
        };
      case 'prevention':
        return {
          icon: <Lightbulb className="w-4 h-4" />,
          borderColor: 'border-l-purple-400',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-700'
        };
      case 'tip':
        return {
          icon: <Lightbulb className="w-4 h-4" />,
          borderColor: 'border-l-blue-400',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700'
        };
      default:
        return {
          icon: <Clipboard className="w-4 h-4" />,
          borderColor: 'border-l-gray-400',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700'
        };
    }
  };

  // Clear notes when conversation changes
  useEffect(() => {
    if (conversationId !== lastConversationId) {
      setAllNotes([]);
      setLastConversationId(conversationId);
    }
  }, [conversationId, lastConversationId]);

  // Add new notes when response changes
  useEffect(() => {
    if (response) {
      const newParts = extractKeyParts(response);
      if (newParts.length > 0) {
        setAllNotes(prevNotes => [
          ...prevNotes,
          ...newParts.map(note => ({
            id: `note-${Date.now()}-${Math.random()}`,
            text: note.text,
            type: note.type,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }))
        ]);
      }
    }
  }, [response]);

  if (!isVisible) return null;

  return (
    <div className="w-full h-full bg-white rounded-2xl shadow-lg border border-gray-100 p-5 flex flex-col" style={{ minHeight: '400px' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Clipboard className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">Medical Notes</h3>
          <p className="text-xs text-gray-500 mt-0.5">Key insights from your consultation</p>
        </div>
        <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{allNotes.length}</span>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="space-y-3">
        {allNotes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="bg-gray-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Clipboard className="w-10 h-10 opacity-20" />
            </div>
            <p className="text-sm font-medium text-gray-600">Medical notes will appear here</p>
            <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto">Important tips, treatments, and recommendations from your conversation</p>
          </div>
        ) : (
          allNotes.map((note) => {
            const style = getNoteStyle(note.type);
            return (
              <div
                key={note.id}
                className={`p-4 rounded-xl border-l-4 ${style.borderColor} ${style.bgColor} hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${style.textColor} flex-shrink-0`}>
                    {style.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-relaxed">{note.text}</p>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${style.bgColor} ${style.textColor} capitalize font-medium border ${style.borderColor.replace('border-l', 'border')}`}>
                        {note.type}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {note.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
    </div>
  );
};

export default KeyParts;