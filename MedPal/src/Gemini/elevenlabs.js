const ELEVEN_API_KEY = "sk_dd0a69b3fe99e9e4f26ff99a81b7e537a7ee24ac99a30471";
const RACHEL_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel's ElevenLabs voice ID

export async function speakWithRachel(text, onStart, onEnd) {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${RACHEL_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVEN_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
          },
        }),
      }
    );

    if (!response.ok) throw new Error("Failed to synthesize speech");

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    if (onStart) audio.onplay = onStart;
    if (onEnd) audio.onended = onEnd;

    audio.play();
  } catch (error) {
    console.error("TTS Error:", error);
    if (onEnd) onEnd();
  }
}
