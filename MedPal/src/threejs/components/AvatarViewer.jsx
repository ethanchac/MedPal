// Enhanced AvatarViewer.jsx - Updated to support emotion-aware expressions
import React, { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Box } from "@react-three/drei";
import AvatarModel from "./AvatarModel";


function CameraController() {
  const { camera } = useThree();


  useEffect(() => {
    // Focus on the face for better expression visibility
    camera.position.set(0, 1, 1);
    camera.lookAt(0, 0.8, 0);
  }, [camera]);


  return null;
}


function LoadingFallback() {
  return (
    <Box args={[1, 1, 1]} position={[0, 0, 0]}>
      <meshBasicMaterial color="gray" />
    </Box>
  );
}


export default function AvatarViewer({
  isSpeaking = false,
  currentAudio = null,
  modelUrl = "https://models.readyplayer.me/6860857a08372d74e879eadc.glb",
  showDebug = false,
  expressiveness = 1.0,
  currentText = "", // New: text being spoken for emotion analysis
  enableMicroExpressions = true, // New: subtle micro-expressions
  emotionalRange = 1.0, // New: how much emotion affects expressions
  showEmotionControls = false // New: show emotion control panel
}) {
  const canvasRef = useRef();
  const [debugExpressiveness, setDebugExpressiveness] = useState(expressiveness);
  const [debugEmotionalRange, setDebugEmotionalRange] = useState(emotionalRange);
  const [debugMicroExpressions, setDebugMicroExpressions] = useState(enableMicroExpressions);


  // Test different emotions for debugging
  const [testEmotion, setTestEmotion] = useState('');
  const [testTexts] = useState({
    happy: "I'm so excited to help you today! This is wonderful news and I'm absolutely thrilled!",
    sad: "I'm sorry to hear about your troubles. Unfortunately, this is quite disappointing.",
    surprised: "Wow! That's absolutely incredible! I can't believe this amazing discovery!",
    concerned: "I'm worried about this situation. We need to be careful and consider the risks.",
    confident: "I'm absolutely certain this will work perfectly. We have strong evidence.",
    questioning: "Are you sure about this? Maybe we should consider other options?"
  });


  const currentDisplayText = testEmotion && testTexts[testEmotion] ? testTexts[testEmotion] : currentText;


  return (
    <div className="w-full h-96 relative">
      {/* Main Canvas */}
      <div className="w-full h-full pointer-events-none bg-gradient-to-b from-blue-50 to-white rounded-xl shadow-lg overflow-hidden">
        <Canvas
          ref={canvasRef}
          camera={{
            position: [0, 1.2, 0.7],
            fov: 50,
            near: 0.1,
            far: 1000,
          }}
          onCreated={(state) => {
            console.log("Enhanced Canvas created, camera at:", state.camera.position);
          }}
        >
          <CameraController />


          {/* Enhanced Lighting for better facial detail */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <directionalLight position={[-5, 3, 2]} intensity={0.4} />
          <pointLight position={[0, 2, 2]} intensity={0.5} />
          {/* Additional face lighting */}
          <pointLight position={[0.5, 1.5, 1]} intensity={0.3} color="#fff8dc" />
          <pointLight position={[-0.5, 1.5, 1]} intensity={0.3} color="#fff8dc" />


          {/* Enhanced Avatar Model */}
          <Suspense fallback={<LoadingFallback />}>
            <AvatarModel
              isSpeaking={isSpeaking}
              currentAudio={currentAudio}
              modelUrl={modelUrl}
              expressiveness={debugExpressiveness}
              showDebugVisuals={showDebug}
              currentText={currentDisplayText}
              enableMicroExpressions={debugMicroExpressions}
              emotionalRange={debugEmotionalRange}
            />
          </Suspense>
        </Canvas>
      </div>


      {/* Enhanced Debug Panel */}
      {showDebug && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-90 text-white p-3 rounded text-xs max-w-sm pointer-events-auto">
          <div className="font-bold mb-2">🎭 Enhanced Expression Debug</div>
         
          {/* Expressiveness Control */}
          <div className="mb-2">
            <label className="block text-xs mb-1">Expressiveness: {debugExpressiveness.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={debugExpressiveness}
              onChange={(e) => setDebugExpressiveness(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>


          {/* Emotional Range Control */}
          <div className="mb-2">
            <label className="block text-xs mb-1">Emotional Range: {debugEmotionalRange.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={debugEmotionalRange}
              onChange={(e) => setDebugEmotionalRange(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>


          {/* Micro-expressions Toggle */}
          <div className="mb-2">
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={debugMicroExpressions}
                onChange={(e) => setDebugMicroExpressions(e.target.checked)}
                className="mr-2"
              />
              Micro-expressions
            </label>
          </div>


          {/* Current State Display */}
          <div className="text-xs mt-2 space-y-1 border-t pt-2">
            <div>🗣️ Speaking: {isSpeaking ? "🟢" : "🔴"}</div>
            <div>🔊 Audio: {currentAudio ? "🟢" : "🔴"}</div>
            <div>🎭 Micro-expr: {debugMicroExpressions ? "🟢" : "🔴"}</div>
            <div>📝 Text: {currentDisplayText ? "🟢" : "🔴"}</div>
          </div>
        </div>
      )}


      {/* Emotion Testing Panel */}
      {showEmotionControls && (
        <div className="absolute top-2 right-2 bg-white bg-opacity-95 p-3 rounded shadow-lg text-sm max-w-xs pointer-events-auto">
          <div className="font-bold mb-2">🎭 Emotion Testing</div>
         
          <div className="mb-2">
            <label className="block text-xs mb-1">Test Emotion:</label>
            <select
              value={testEmotion}
              onChange={(e) => setTestEmotion(e.target.value)}
              className="w-full p-1 border rounded text-xs"
            >
              <option value="">Use Current Text</option>
              <option value="happy">😊 Happy</option>
              <option value="sad">😢 Sad</option>
              <option value="surprised">😲 Surprised</option>
              <option value="concerned">😟 Concerned</option>
              <option value="confident">😤 Confident</option>
              <option value="questioning">🤔 Questioning</option>
            </select>
          </div>


          {testEmotion && (
            <div className="text-xs bg-gray-100 p-2 rounded">
              <strong>Test Text:</strong> {testTexts[testEmotion]?.substring(0, 60)}...
            </div>
          )}
        </div>
      )}


      {/* Status Indicator */}
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
        <div>Speaking: {isSpeaking ? "🟢" : "🔴"}</div>
        <div>Audio: {currentAudio ? "🟢" : "🔴"}</div>
        {currentDisplayText && (
          <div>Emotion: {currentDisplayText ? "🎭" : "➖"}</div>
        )}
      </div>
    </div>
  );
}


// Usage example component
export function ExampleUsage() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState("");


  const testSpeak = (text) => {
    setCurrentText(text);
    setIsSpeaking(true);
   
    // Simulate speaking duration
    setTimeout(() => {
      setIsSpeaking(false);
      setCurrentText("");
    }, 5000);
  };


  return (
    <div className="p-4">
      <AvatarViewer
        isSpeaking={isSpeaking}
        currentText={currentText}
        expressiveness={1.2}
        enableMicroExpressions={true}
        emotionalRange={1.5}
        showDebug={true}
        showEmotionControls={true}
      />
     
      <div className="mt-4 space-x-2">
        <button
          onClick={() => testSpeak("Hello! I'm so happy to meet you today!")}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm"
        >
          Test Happy
        </button>
        <button
          onClick={() => testSpeak("I'm sorry, but I'm concerned about this situation.")}
          className="px-3 py-1 bg-orange-500 text-white rounded text-sm"
        >
          Test Concerned
        </button>
        <button
          onClick={() => testSpeak("Wow! That's absolutely amazing and surprising!")}
          className="px-3 py-1 bg-purple-500 text-white rounded text-sm"
        >
          Test Surprised
        </button>
      </div>
    </div>
  );
}

