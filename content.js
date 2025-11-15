let pill, bubble, selText = "";

function ensurePill() {
  if (pill) return pill;
  pill = document.createElement("div");
  pill.id = "capsule-ask";
  pill.textContent = "Ask AI";
  document.documentElement.appendChild(pill);
  pill.addEventListener("click", askAI);
  return pill;
}

function ensureBubble() {
  if (bubble) return bubble;
  bubble = document.createElement("div");
  bubble.id = "capsule-bubble";
  bubble.innerHTML = `<div class="close" title="Close">✕</div><h4>AI Insight</h4><div id="capsule-res"></div>`;
  bubble.querySelector(".close").onclick = () => bubble.style.display = "none";
  document.documentElement.appendChild(bubble);
  return bubble;
}

function positionPill(rect) {
  const p = ensurePill();
  p.style.left = window.scrollX + rect.left + "px";
  p.style.top  = window.scrollY + rect.top - 36 + "px";
  p.style.display = "block";
}

async function askAI() {
  const b = ensureBubble();
  b.style.display = "block";
  const resEl = b.querySelector("#capsule-res");
  resEl.innerHTML = "<p>Thinking…</p>";
  pill.style.display = "none";

  // Try Gemini Prompt API first (local)
  try {
    if ("ai" in self && ai.languageModel) {
      const model = await ai.languageModel.create({ temperature: 0.3, topK: 40 });
      const prompt = [
        `User highlighted: "${selText}"`,
        `Reply in simple English with:`,
        `1) 3–4 sentence explanation/context.`,
        `2) 5–6 sentence near-term prediction (2–12 weeks) with likely ripple effects.`,
        `End with a confidence %. Return HTML paragraphs only.`
      ].join("\n");
      const out = await model.prompt(prompt);
      if (out?.output) {
        resEl.innerHTML = out.output;
        return;
      }
    }
  } catch (e) {
    console.warn("[Gemini Prompt] failed:", e);
  }

  // Fallback: OpenAI (cloud)
  chrome.storage.local.get(["capsule:cfg"], async v => {
    const OPENAI_KEY = v["capsule:cfg"]?.OPENAI_KEY || "";
    if (!OPENAI_KEY) { resEl.innerHTML = "<p>OpenAI key missing.</p>"; return; }
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a careful analyst. Output HTML paragraphs only." },
            { role: "user", content:
              `User highlighted: "${selText}".\n` +
              `Give 3–4 sentence context + 5–6 sentence near-term prediction (2–12 weeks) with ripple effects. End with confidence %.`
            }
          ],
          temperature: 0.4
        })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error?.message || "OpenAI error");
      resEl.innerHTML = j.choices[0].message.content;
    } catch (e) {
      resEl.innerHTML = `<p style="color:#b91c1c">Error: ${e.message}</p>`;
    }
  });
}

document.addEventListener("selectionchange", () => {
  const s = window.getSelection();
  if (!s || s.isCollapsed) { if (pill) pill.style.display = "none"; return; }
  selText = String(s).trim();
  if (selText.length < 6) { if (pill) pill.style.display = "none"; return; }
  const r = s.getRangeAt(0).getBoundingClientRect();
  if (r && r.width >= 0 && r.height >= 0) positionPill(r);
}, { passive: true });
