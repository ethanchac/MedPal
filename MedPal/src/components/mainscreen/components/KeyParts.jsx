import React, { useState, useEffect } from 'react';
import { Clipboard, AlertCircle, Lightbulb, Heart, Clock } from 'lucide-react';

const KeyParts = ({ response, conversationId, isVisible = true }) => {
  const [allNotes, setAllNotes] = useState([]);
  const [lastConversationId, setLastConversationId] = useState(null);

  // Enhanced extraction focusing on medical jot notes
  const extractKeyParts = (text) => {
    if (!text || text.trim().length === 0) return [];

    const keyParts = [];
    
    // Ignore common conversational phrases
    const ignorePatterns = [
      /I understand|I'm here to help|please tell me|can you describe|need more information|important to note that I'm|not a substitute|consult.*doctor|see.*healthcare|medical professional|I cannot|I'm not able|please provide|what.*feel|how.*feel|when.*start|where.*pain/i,
      /sorry|apologize|however|but|although|remember|keep in mind|it's important to note/i,
      /let me know|feel free|if you have|any questions|anything else|is there/i
    ];

    // Split into sentences and clean them
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);

    sentences.forEach((sentence) => {
      const cleanSentence = sentence.trim();
      
      // Skip if it matches ignore patterns
      if (ignorePatterns.some(pattern => pattern.test(cleanSentence))) {
        return;
      }

      // Look for actionable medical advice, symptoms, treatments, and tips
      const medicalPatterns = [
        // Symptoms and conditions
        /symptoms?.*include|signs?.*include|may.*experience|commonly.*causes?|indicates?.*|suggests?.*condition/i,
        
        // Treatments and remedies
        /treatment.*options?|recommended.*treatment|try.*|consider.*|apply.*|take.*medication|use.*cream|drink.*water|rest.*|ice.*|heat.*|compress/i,
        
        // Dosages and instructions
        /\d+.*mg|times?.*daily|twice.*day|every.*hours?|before.*meals?|after.*eating|with.*food|on.*empty.*stomach/i,
        
        // Prevention and lifestyle
        /prevent.*by|avoid.*|reduce.*risk|lifestyle.*changes?|diet.*|exercise.*|sleep.*|stress.*management/i,
        
        // Warning signs and when to seek help
        /seek.*medical|emergency|urgent|immediate|dangerous|concerning|warning.*signs?|red.*flags?|worsen|severe|persistent/i,
        
        // Specific medical advice
        /monitor.*|check.*|track.*|follow.*up|schedule.*appointment|contact.*doctor|call.*if|return.*if/i,
        
        // Common remedies and tips
        /helps?.*with|effective.*for|relieves?|reduces?|improves?|beneficial.*for|good.*for|aid.*in/i,
        
        // Diagnostic information
        /diagnosis.*|test.*results?|blood.*work|x-ray|scan|examination|physical.*exam/i
      ];

      // Check if sentence contains medical advice/information
      if (medicalPatterns.some(pattern => pattern.test(cleanSentence))) {
        // Additional filtering for quality
        if (cleanSentence.length > 20 && cleanSentence.length < 200) {
          keyParts.push({
            text: cleanSentence,
            type: categorizeNote(cleanSentence)
          });
        }
      }
    });

    return keyParts.slice(0, 4); // Max 4 new notes per response
  };

  // Categorize notes by type for better organization
  const categorizeNote = (text) => {
    if (/symptoms?|signs?|pain|ache|experience|feel/i.test(text)) {
      return 'symptom';
    } else if (/treatment|medication|take|apply|use|try/i.test(text)) {
      return 'treatment';
    } else if (/seek|emergency|urgent|warning|dangerous|severe/i.test(text)) {
      return 'warning';
    } else if (/prevent|avoid|lifestyle|diet|exercise|sleep/i.test(text)) {
      return 'prevention';
    } else if (/helps?|effective|beneficial|good.*for/i.test(text)) {
      return 'tip';
    } else {
      return 'general';
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
    <div className="w-full h-full bg-white rounded-lg shadow-md border border-gray-200 p-4 flex flex-col" style={{ minHeight: '400px' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
        <Clipboard className="w-5 h-5 text-gray-600" />
        <h3 className="font-medium text-gray-800">Medical Notes</h3>
        <span className="text-xs text-gray-500 ml-auto">{allNotes.length} items</span>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3">
        {allNotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clipboard className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Medical notes and advice will appear here</p>
            <p className="text-xs text-gray-400 mt-1">Important tips, treatments, and recommendations</p>
          </div>
        ) : (
          allNotes.map((note) => {
            const style = getNoteStyle(note.type);
            return (
              <div
                key={note.id}
                className={`p-3 rounded-lg border-l-4 ${style.borderColor} ${style.bgColor} hover:shadow-sm transition-all duration-200`}
              >
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 ${style.textColor}`}>
                    {style.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 leading-relaxed font-medium">{note.text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${style.bgColor} ${style.textColor} capitalize`}>
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