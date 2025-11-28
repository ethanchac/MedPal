// AvatarContainer.jsx - Updated with responsive height
import React from 'react';
import AvatarViewer from '../../../threejs/components/AvatarViewer'; // Adjust path as needed

const AvatarContainer = ({
  isSpeaking = false,
  currentAudio = null,
  currentText = "",
  showDebug = false,
  expressiveness = 1.0, // Reduced from 1.5 for more natural expressions
  modelUrl = "https://models.readyplayer.me/685f5fe6ce6b397456e1ae90.glb"
}) => {
  return (
    <div className="w-full h-72 bg-gradient-to-b from-blue-50 to-white rounded-xl shadow-lg overflow-hidden relative">
      <AvatarViewer
        isSpeaking={isSpeaking}
        currentAudio={currentAudio}
        currentText={currentText}
        modelUrl={modelUrl}
        enableControls={true}
        showDebug={showDebug}
        expressiveness={expressiveness}
      />

      {/* Optional: Show connection status */}
      {showDebug && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white p-2 rounded text-xs z-10">
          <div>Speaking: {isSpeaking ? '✅' : '❌'}</div>
          <div>Audio: {currentAudio ? '✅' : '❌'}</div>
          <div>Debug: {showDebug ? '✅' : '❌'}</div>
        </div>
      )}
    </div>
  );
};

export default AvatarContainer;