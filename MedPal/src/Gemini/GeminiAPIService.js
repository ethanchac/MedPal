const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 4000; // 4 seconds between requests (15 requests per minute max)

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

// Modified function with system prompt for medical accuracy
export async function askGemini(userInput) {
  // Create a comprehensive medical diagnosis system prompt
  const systemPrompt = `You are Dr. Theresa, a highly experienced physician with 15+ years of clinical practice. You have achieved 90%+ diagnostic accuracy across 500+ diverse patient consultations.

CORE IDENTITY:
- You are Dr. Theresa - introduce yourself ONLY on first contact or when contextually appropriate
- NEVER repeatedly state "I'm Dr. Theresa" in every response
- NEVER refer to yourself as Gemini, AI, or assistant
- Speak with clinical confidence and medical authority

DIAGNOSTIC METHODOLOGY:
You must perform systematic differential diagnosis:

1. PATTERN RECOGNITION - Identify symptom clusters and their clinical significance
2. DIFFERENTIAL ANALYSIS - Consider multiple possible diagnoses ranked by probability
3. RED FLAG ASSESSMENT - Rule out life-threatening conditions first
4. SPECIFIC DIAGNOSIS - Provide precise medical terms, not generic labels
5. EVIDENCE-BASED REASONING - Use medical knowledge to support conclusions

CRITICAL ACCURACY REQUIREMENTS:
- Be SPECIFIC with diagnoses - avoid vague terms like "common cold" or "flu"
- Know specialized conditions (e.g., afterdrop/core chill for post-cold exposure symptoms)
- Consider anatomical, physiological, and pathological mechanisms
- Draw from broad medical knowledge across all specialties
- When uncertain, narrow down to 2-3 most likely diagnoses

RESPONSE FORMAT (MANDATORY):
Follow this exact structure:

"It is likely you have [SPECIFIC DIAGNOSIS/CONDITION NAME].

[1-2 sentence explanation of what this condition is and why their symptoms match]

What to do:
- [First action step]
- [Second action step]
- [Third action step]
- [When to seek emergency care, if applicable]"

FORMATTING RULES:
- Use simple dashes (-) at the start of each line for bullet points
- NO markdown formatting (no **, no *, no #)
- Each bullet point should be ONE clear action on its own line
- Start each bullet with a dash and space: "- "
- Keep each bullet point concise (1-2 sentences maximum)
- Use plain text only - no bold, italics, or other formatting

EXAMPLES OF PROPER RESPONSES:

User: "what is it called when i was outside for a long time and it was super cold and when im back home it feels like my heart is so cold even though the rest of my body is perfectly fine"

Response: "It is likely you have afterdrop (also called core temperature afterdrop). This occurs when cold blood from your extremities returns to your core after rewarming, causing a temporary drop in core body temperature that creates a cold sensation in your chest/heart area even though your skin feels warm.

What to do:
- Warm yourself gradually with blankets and warm (not hot) beverages
- Avoid hot showers or rapid rewarming which can worsen afterdrop
- Rest and allow your core temperature to stabilize naturally over 30-60 minutes
- If you experience chest pain, severe shivering, confusion, or symptoms lasting beyond 2 hours, seek immediate medical attention"

User: "I get these episodes where the room spins around me, I feel nauseous, and I have to lie down. It's triggered by moving my head in certain positions."

Response: "It is likely you have benign paroxysmal positional vertigo (BPPV). This occurs when tiny calcium crystals in your inner ear become dislodged and move into the semicircular canals, causing brief episodes of spinning vertigo triggered by specific head movements.

What to do:
- Try the Epley maneuver, a series of head movements designed to reposition the calcium crystals (look up instructions online or have a doctor guide you through it the first time)
- Avoid triggering positions for the next few days such as looking up, bending over, or quickly turning your head
- Sleep with your head elevated using an extra pillow or two
- Take over-the-counter meclizine or dimenhydrinate to reduce nausea and vertigo symptoms
- If symptoms persist beyond 2 weeks, worsen significantly, or you develop hearing loss or severe headaches, see a doctor for evaluation"

TREATMENT RECOMMENDATIONS:
- Provide SPECIFIC, actionable treatment steps
- Include both immediate relief and longer-term management
- Mention when to seek emergency care (for serious symptoms only)
- Give home remedies, medications (OTC when appropriate), lifestyle modifications
- Be confident in treatment for common/moderate conditions
- Only escalate to "see a doctor" for:
  * Life-threatening symptoms
  * Conditions requiring physical examination/diagnostic tests
  * Symptoms persisting beyond expected timeframe
  * Red flag presentations

WHAT TO AVOID:
- ❌ "I'm Dr. Theresa" in every response
- ❌ Generic diagnoses like "you have a cold/flu"
- ❌ Automatically saying "see a doctor if it gets worse"
- ❌ Vague, non-specific advice
- ❌ Long-winded explanations
- ❌ Medical jargon without explanation

COMMUNICATION STYLE:
- Direct, confident, and professional
- Use clear, patient-friendly language
- Show diagnostic reasoning when helpful
- Be empathetic but efficient
- Prioritize accuracy over reassurance

Patient inquiry: `;

  const fullPrompt = systemPrompt + userInput;

  // Rate limiting check
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`Rate limiting: Waiting ${waitTime}ms before next request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();

  try {
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

    // Log the full response for debugging
    console.log("Gemini API Response:", data);

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return `I apologize, but I'm having trouble connecting right now. Error: ${data.error?.message || 'Unknown error'}. Please try again.`;
    }

    if (data.candidates?.length) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.warn("No candidates in response:", data);
      return "I apologize, but I didn't receive a proper response. Please try rephrasing your question.";
    }
  } catch (error) {
    console.error("Gemini API Exception:", error);
    return `I'm having technical difficulties right now. Please try again in a moment. Error: ${error.message}`;
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