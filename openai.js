// openai.js — Robust Hybrid AI: Gemini + OpenAI for Summary, Prediction, and Recommendation
import { geminiSummarize } from "./gemini.js";

export async function summarizeAndRecommend(openaiKey, article) {
  // ✅ FIX: Only treat "Ask AI" or "Quick Ask" as chat
  const isGeneralQuestion = /^(quick ask|user chat|global summary|ai overview)$/i.test(
    (article.title || "").trim()
  );

  let summary = "";
  let prediction = "";
  let recommendation = "";

  // --- Step 1: Gemini first, fallback to OpenAI ---
  const baseText = `${article.title}\n${article.description || ""}`;
  try {
    summary = await geminiSummarize(baseText);
    if (!summary || summary === "No summary." || summary === "Summary unavailable.") {
      console.warn("⚠️ Gemini returned no summary — fallback to OpenAI");
      summary = await summarizeWithOpenAI(openaiKey, baseText);
    }
  } catch (err) {
    console.warn("⚠️ Gemini failed, fallback to OpenAI:", err);
    summary = await summarizeWithOpenAI(openaiKey, baseText);
  }

  summary = cleanText(summary || "Summary unavailable.");

  // --- Step 2: Chat mode for Ask-AI only ---
  if (isGeneralQuestion) {
    try {
      const chatPrompt = `
You are a helpful AI assistant inside a Chrome extension called "AI News Capsule".
Answer the user's question naturally, conversationally, and clearly.
Include relevant context or examples when appropriate.

Question:
"${article.description}"
      `;
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: chatPrompt }],
          temperature: 0.9,
          max_tokens: 600,
        }),
      });
      const data = await res.json();
      const answer = data.choices?.[0]?.message?.content || "No response.";
      return { summary: cleanText(answer), prediction: "", recommendation: "" };
    } catch (err) {
      console.error("⚠️ Chat mode failed:", err);
      return { summary: "⚠️ Chat unavailable.", prediction: "", recommendation: "" };
    }
  }

  // --- Step 3: Analytical 3-part breakdown ---
const predictionPrompt = `
You are a factual and analytical AI assistant for a Chrome Extension called "AI News Capsule."
You will receive a news summary. Your job is to analyze it — but only using the information given.
Do NOT add outside context, background, or any extra knowledge. 
Avoid phrases like “Former President”, “Billionaire”, or “Historical context”.

Given this news summary:
"${summary}"

Write exactly 3 clearly separated sections with headers formatted as:
**Summary**
**Prediction (Effect)**
**Recommendation**

Rules:
- The **Summary** must be factual, 4–6 sentences, and entirely based on the input text — no external facts.
- The **Prediction (Effect)** should forecast short-term and long-term outcomes in 5–8 sentences, still grounded only in the given content.
- The **Recommendation** should include 2–3 numbered suggestions (1., 2., 3.) with each on its own line.
- Do NOT combine the sections, and ensure each header is on its own line with one blank line after it.
- Avoid adding labels like “Detailed Summary” or repeating the word “Recommendation”.
- Keep tone neutral and analytical.
`;



  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: predictionPrompt }],
        temperature: 0.6,
        max_tokens: 1000,
      }),
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const text = cleanText(data.choices?.[0]?.message?.content || "");

    // --- Force-split logic (more tolerant) ---
    const sections = splitIntoSections(text);

    summary = sections.summary || summary;
    prediction = sections.prediction || "⚠️ No prediction generated.";
    recommendation = sections.recommendation || "⚠️ No recommendation provided.";

    return { summary, prediction, recommendation };
  } catch (err) {
    console.error("[OpenAI Error]", err);
    return {
      summary,
      prediction: "⚠️ Prediction failed. Please check API key or network.",
      recommendation: "",
    };
  }
}

// --- Helper: Fallback summarizer ---
async function summarizeWithOpenAI(apiKey, text) {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: `Summarize in 5–7 clear sentences:\n${text}` }],
        temperature: 0.5,
        max_tokens: 400,
      }),
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return cleanText(data.choices?.[0]?.message?.content || "Summary unavailable.");
  } catch (err) {
    console.error("OpenAI summary failed:", err);
    return "Summary unavailable.";
  }
}

// --- Helper: Robust section splitter ---
function splitIntoSections(text) {
  const result = { summary: "", prediction: "", recommendation: "" };

  // Normalize text
  const normalized = text.replace(/\r?\n+/g, "\n").trim();

  // Try labeled matches
  const regex = /1\.\s*Summary[\s\S]*?(?=2\.|$)|2\.\s*Prediction[\s\S]*?(?=3\.|$)|3\.\s*Recommendation[\s\S]*/gi;
  const matches = normalized.match(regex);

  if (matches && matches.length) {
    matches.forEach((m) => {
      if (m.startsWith("1.")) result.summary = cleanText(m.replace(/^1\.\s*Summary[:\-]?\s*/i, ""));
      else if (m.startsWith("2.")) result.prediction = cleanText(m.replace(/^2\.\s*Prediction[:\-]?\s*/i, ""));
      else if (m.startsWith("3.")) result.recommendation = cleanText(m.replace(/^3\.\s*Recommendation[:\-]?\s*/i, ""));
    });
  }

  // Fallback if missing labels
  if (!result.prediction && text.includes("Prediction")) {
    result.prediction = text.split(/Prediction[:\-]?/i)[1]?.split(/Recommendation[:\-]?/i)[0] || "";
  }
  if (!result.recommendation && text.includes("Recommendation")) {
    result.recommendation = text.split(/Recommendation[:\-]?/i)[1] || "";
  }

  // If still empty, try heuristic split by paragraph length
  if (!result.prediction && !result.recommendation) {
    const parts = text.split(/\n{2,}/);
    result.summary = cleanText(parts[0] || "");
    result.prediction = cleanText(parts[1] || "");
    result.recommendation = cleanText(parts[2] || "");
  }

  return result;
}

// --- Clean text helper ---
// --- Clean text helper ---
function cleanText(text) {
  if (!text) return "";
  return String(text)
    // Basic cleanup
    .replace(/\*\*/g, "")
    .replace(/#+\s?/g, "")
    .replace(/`/g, "")
    .replace(/\[object Object\]/g, "")
    .replace(/\s+/g, " ")
    // --- Context-smart cleanup ---
    // ✅ Keep current titles but remove outdated or redundant ones
    .replace(/\bFormer\s+President\s+Donald\s+Trump\b/gi, "President Donald Trump")
    .replace(/\bformer\s+president\b/gi, "President")
    .replace(/\bex\s+president\b/gi, "President")
    .replace(/\bDetailed\s+Summary[:\s]*/gi, "")
    // ✅ Remove repeated "Summary:" labels
    .replace(/\bSummary[:\s]*/gi, "")
    // ✅ Avoid accidental title loss
    .replace(/\s{2,}/g, " ")
    .trim();
}
