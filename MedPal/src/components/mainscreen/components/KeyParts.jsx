import React, { useState, useEffect } from 'react';
import { BookOpen, Heart, AlertTriangle, Pill, Calendar } from 'lucide-react';

const KeyParts = ({ response, isVisible = true }) => {
  const [keyPoints, setKeyPoints] = useState([]);

  // Extract key medical information from AI response
  const extractKeyParts = (text) => {
    if (!text || text.trim().length === 0) return [];

    const keyParts = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);

    sentences.forEach((sentence, index) => {
      const cleanSentence = sentence.trim();
      if (cleanSentence) {
        // Categorize based on medical keywords
        let icon = BookOpen;
        let color = 'bg-blue-50 border-blue-200 text-blue-800';

        if (/symptom|pain|ache|feel|experience|discomfort/i.test(cleanSentence)) {
          icon = AlertTriangle;
          color = 'bg-orange-50 border-orange-200 text-orange-800';
        } else if (/recommend|suggest|should|treatment|therapy/i.test(cleanSentence)) {
          icon = Heart;
          color = 'bg-green-50 border-green-200 text-green-800';
        } else if (/take|dose|medication|pill|tablet|medicine/i.test(cleanSentence)) {
          icon = Pill;
          color = 'bg-purple-50 border-purple-200 text-purple-800';
        } else if (/follow.?up|appointment|visit|check|monitor/i.test(cleanSentence)) {
          icon = Calendar;
          color = 'bg-indigo-50 border-indigo-200 text-indigo-800';
        }

        keyParts.push({
          id: `key-${index}`,
          text: cleanSentence,
          icon,
          color
        });
      }
    });

    // Limit to most important points (max 4)
    return keyParts.slice(0, 4);
  };

  // Update key parts when response changes
  useEffect(() => {
    if (response) {
      const parts = extractKeyParts(response);
      setKeyPoints(parts);
    }
  }, [response]);

  if (!isVisible || keyPoints.length === 0) return null;

  return (
    <div className="w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-800">Key Notes</h3>
      </div>

      {/* Key Points */}
      <div className="space-y-3">
        {keyPoints.map((point) => {
          const IconComponent = point.icon;
          return (
            <div
              key={point.id}
              className={`p-3 rounded-lg border ${point.color}`}
            >
              <div className="flex items-start gap-2">
                <IconComponent className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm leading-relaxed">{point.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KeyParts;