const GEMINI_ENDPOINT =
  process.env.GEMINI_ENDPOINT ??
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-proxy-001:generateText";

export async function callGemini(prompt: string, temperature = 0.3) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
      temperature,
      maxOutputTokens: 400,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini error: ${response.status} ${body}`);
  }

  const payload = await response.json();
  return payload.candidates?.[0]?.content ?? "";
}
