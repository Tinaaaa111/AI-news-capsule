// gemini.js
async function avail(getter) {
  try {
    if (!("ai" in self)) return "no";
    const obj = getter?.();
    if (!obj?.capabilities) return "no";
    const caps = await obj.capabilities();
    return caps?.available ?? "no";
  } catch {
    return "no";
  }
}

export async function geminiSummarize(text, opts = {}) {
  const status = await avail(() => ai?.summarizer);
  if (status === "no") {
    console.warn("⚠️ Gemini summarizer not available — returning null.");
    return null;
  }

  try {
    const summarizer = await ai.summarizer.create({
      type: opts.type || "key-points",
      format: opts.format || "plain-text",
      length: opts.length || "medium",
    });

    const result = await summarizer.summarize(text);
    return typeof result === "string" ? result : result?.summary ?? "No summary.";
  } catch (e) {
    console.warn("[Gemini Summarizer] Error:", e);
    return "Summary unavailable.";
  }
}
