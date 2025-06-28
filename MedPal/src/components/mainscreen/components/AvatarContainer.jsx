import React from 'react';
import AvatarViewer from '../../../threejs/components/AvatarViewer';

const AvatarContainer = ({ isSpeaking, currentAudio, showDebug }) => {
  return (
        <div className="mb-4 w-80 h-64 bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
      <div className="w-full h-full">
        <AvatarViewer 
          isSpeaking={isSpeaking} 
          currentAudio={currentAudio}
          enableControls={showDebug}
          showDebug={showDebug}
        />
      </div>
    </div>
  );
};

export default AvatarContainer;