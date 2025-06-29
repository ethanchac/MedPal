const API_KEY = "AIzaSyD0g8wnGwMeYt3chxDjTSRRIjU63Gk-g0s";

// Original function - keep for backward compatibility
export async function askGeminiOriginal(prompt) {
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

// Modified function with system prompt for shorter responses
export async function askGemini(userInput) {
  // Create a system prompt that encourages shorter responses
  const systemPrompt = `You are a professional AI medical assistant.  Please provide:
- Brief, clear responses (2-3 sentences maximum)
- Simple language that's easy to understand
- Direct answers without unnecessary details
- If the prompt is listing many different symptoms try to narrow to the most likely reason for it
- If the condition is serious, still recommend seeing a doctor but keep it concise
- Try to avoid suggesting a doctor as much as you can unless they have to see a doctor



User question: `;

  const fullPrompt = systemPrompt + userInput;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: fullPrompt }],
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

// Alternative: Extra short responses (1-2 sentences only)
export async function askGeminiShort(userInput) {
  const shortPrompt = `Answer this medical question in 1-2 sentences only. Be helpful but very concise: ${userInput}`;
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: shortPrompt }],
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

// Response length options
export async function askGeminiWithLength(userInput, length = "short") {
  const prompts = {
    short: `Answer this medical question in 1-2 short sentences. Be helpful but very brief: ${userInput}`,
    medium: `Answer this medical question in 2-3 sentences. Be clear and concise: ${userInput}`,
    detailed: `Answer this medical question with helpful details, but keep it under 100 words: ${userInput}`
  };

  const selectedPrompt = prompts[length] || prompts.short;
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: selectedPrompt }],
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