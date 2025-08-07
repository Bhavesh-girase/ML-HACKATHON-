export async function getGeminiPrediction(prompt: string) {
  const apiKey = "AIzaSyCQZRXd8mRTGueZo7dgpVDIaNzq2iuqbAo"; // Use a working Gemini API Key

  const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  let data;
  try {
    data = await res.json();
  } catch (err) {
    const text = await res.text(); // fallback if not JSON
    console.error("Non-JSON Gemini response:", text);
    throw new Error("Invalid response from Gemini API: " + text);
  }

  if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  } else {
    console.error("Gemini API error:", data.error || data);
    throw new Error(data.error?.message || "Prediction failed");
  }
}
