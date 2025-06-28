const API_KEY = "AIzaSyD0g8wnGwMeYt3chxDjTSRRIjU63Gk-g0s"

export async function askGemini(prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  const data = await response.json();

  if (data.candidates?.length) {
    return data.candidates[0].content.parts[0].text;
  } else {
    return "Gemini had no response.";
  }
}
