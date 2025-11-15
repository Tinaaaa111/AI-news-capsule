// popup.js — AI News Capsule Main Logic
// -------------------------------------------------------
import { getConfig } from "./config.js";
import { fetchRssHeadlines } from "./rss.js";
import { summarizeAndRecommend } from "./openai.js";
import { marked } from "./markdown.js";

const categorySelect = document.getElementById("category");
const loadBtn = document.getElementById("loadNews");
const newsContainer = document.getElementById("newsContainer");
const askAIButton = document.getElementById("askAI");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");
const quickAsk = document.getElementById("quickAsk");
const status = document.getElementById("status");

let config;
let loading = false;
let reachedEnd = false;
let dayOffset = 0;
let seenTitles = new Set();

async function init() {
  config = await getConfig();
  console.log("✅ Config loaded");
}

function dayLabel(offset) {
  if (offset === 0) return "Today — Top Stories";
  if (offset === 1) return "Yesterday";
  return `${offset} days ago`;
}

// -------------------- Load News --------------------
async function loadNews(reset = true) {
  if (loading) return;
  if (reset) reachedEnd = false;
  if (reachedEnd) return;

  loading = true;
  loadBtn.disabled = true;
  loadBtn.textContent = "⏳ Loading...";
  status.style.display = "block";
  status.textContent = `📰 Loading ${categorySelect.value}...`;
  askAIButton.style.display = "none";

  if (reset) {
    newsContainer.innerHTML = "";
    seenTitles.clear();
    dayOffset = 0;
  }

  try {
    const articles = await fetchRssHeadlines(categorySelect.value, dayOffset, 10);
    status.style.display = "none";

    const header = document.createElement("h4");
    header.textContent = dayLabel(dayOffset);
    header.className = "day-header";
    newsContainer.appendChild(header);

    for (const a of articles) {
      if (seenTitles.has(a.title)) continue;
      seenTitles.add(a.title);

      const ai = await summarizeAndRecommend(config.OPENAI_KEY, a);
      const card = document.createElement("div");
      card.className = "news-card";

      const totalTextLength = (ai.summary + ai.prediction + ai.recommendation).length;
      const showReadMore = totalTextLength > 400;

      card.innerHTML = `
        <h3>${a.title}</h3>
        <p><b>Source:</b> ${a.source || "Unknown"} — 
        <b>Published:</b> ${new Date(a.publishedAt).toLocaleString()}</p>

        <div class="summary">
          <b>Summary:</b>
          <div class="ai-text">${ai.summary}</div>
        </div>

        <div class="summary">
          <b>Prediction (Effect):</b>
          <div class="ai-text">${marked.parse(ai.prediction || "")}</div>
        </div>

        <div class="summary">
          <b>Recommendation:</b>
          <div class="ai-text">${marked.parse(ai.recommendation || "")}</div>
        </div>

        ${showReadMore ? '<button class="read-more">Read More</button>' : ""}
      `;

      newsContainer.appendChild(card);

      const readMoreBtn = card.querySelector(".read-more");
      if (readMoreBtn) {
        readMoreBtn.addEventListener("click", async () => {
          readMoreBtn.textContent = "Analyzing deeper...";
          readMoreBtn.disabled = true;

          try {
            const deepPrompt = `
Perform a deeper analytical breakdown of this news article.

Title: ${a.title}
Description: ${a.description}

Write THREE clearly labeled sections:
1. Detailed Summary — 6–8 sentences that expand on background, context, and key details.
2. Future Outlook — predict the medium- to long-term consequences or ripple effects.
3. Recommendations — 3 actionable insights, lessons, or strategies for readers, policymakers, or organizations.
            `;

            const deeperAI = await summarizeAndRecommend(config.OPENAI_KEY, {
              title: a.title,
              description: deepPrompt,
            });

            openModal(a, {
              summary: deeperAI.summary || ai.summary,
              prediction: deeperAI.prediction || ai.prediction,
              recommendation: deeperAI.recommendation || ai.recommendation,
            });
          } catch (err) {
            console.error("⚠️ Deep ReadMore failed:", err);
            alert("⚠️ Failed to generate deeper analysis. Try again.");
          }

          readMoreBtn.textContent = "Read More";
          readMoreBtn.disabled = false;
        });
      }
    }

    dayOffset++;
    if (dayOffset > 2) {
      reachedEnd = true;
      const endMsg = document.createElement("p");
      endMsg.textContent = "🕰️ That’s all — only up to 2 days back.";
      newsContainer.appendChild(endMsg);
    }

    askAIButton.style.display = "block";
  } catch (err) {
    console.error(err);
    status.textContent = "⚠️ Failed to load news. Please try again.";
  }

  loadBtn.disabled = false;
  loadBtn.textContent = "Load News";
  loading = false;
}

// -------------------- Modal --------------------
function openModal(article, ai) {
  modalBody.innerHTML = `
    <div class="modal-header">
      <h3>${article.title}</h3>
      <button id="closeModalBtn" class="modal-close">×</button>
    </div>
    <p><b>Source:</b> ${article.source || "Unknown"} —
    <b>Published:</b> ${new Date(article.publishedAt).toLocaleString()}</p>

    <hr/>

    <div class="modal-section">
      <h4>Summary</h4>
      <div class="ai-text">${marked.parse(ai.summary || "Summary unavailable.")}</div>
    </div>

    <div class="modal-section">
      <h4>Prediction & Analysis</h4>
      <div class="ai-text">${marked.parse(ai.prediction || "Prediction unavailable.")}</div>
    </div>

    <div class="modal-section">
      <h4>Recommendation</h4>
      <div class="ai-text">${marked.parse(ai.recommendation || "Recommendation unavailable.")}</div>
    </div>

    <p><a href="${article.url}" target="_blank" style="color:#e35d00;">Open full article ↗</a></p>
  `;
  modal.classList.remove("hidden");
  document.getElementById("closeModalBtn").addEventListener("click", () => modal.classList.add("hidden"));
}

closeModal.addEventListener("click", () => modal.classList.add("hidden"));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") modal.classList.add("hidden");
});

// -------------------- Ask AI --------------------
askAIButton.addEventListener("click", async () => {
  askAIButton.textContent = "🤖 Analyzing...";
  askAIButton.disabled = true;

  try {
    const allText = Array.from(newsContainer.querySelectorAll("h3"))
      .map((h) => h.textContent)
      .join("\n");

    const prompt = `
Summarize today's major headlines below.
"${allText}"

Provide three sections clearly labeled:
1. Overall Themes — summarize in 3–4 sentences.
2. Emerging Trends — identify what patterns or changes are appearing.
3. Global Outlook (Prediction) — predict possible next developments.
    `;

    const ai = await summarizeAndRecommend(config.OPENAI_KEY, {
      title: "Global Summary",
      description: prompt,
    });

    const globalCard = document.createElement("div");
    globalCard.className = "news-card";
    globalCard.innerHTML = `
      <h3>🌎 AI Overview</h3>
      <div class="summary">
        <b>Overall Themes:</b>
        <div class="ai-text">${ai.summary || "Summary unavailable."}</div>
      </div>
      <div class="summary">
        <b>Emerging Trends:</b>
        <div class="ai-text">${marked.parse(ai.prediction || "").split("Prediction")[0]}</div>
      </div>
      <div class="summary">
        <b>Global Outlook (Prediction):</b>
        <div class="ai-text">${marked.parse(ai.prediction || "")}</div>
      </div>
    `;
    newsContainer.prepend(globalCard);
  } catch (err) {
    console.error(err);
    alert("⚠️ Failed to fetch AI insights. Check your API key or network.");
  }

  askAIButton.textContent = "Ask AI 💬";
  askAIButton.disabled = false;
});

// -------------------- Infinite Scroll --------------------
newsContainer.addEventListener("scroll", () => {
  if (reachedEnd || loading) return;
  const nearBottom =
    newsContainer.scrollTop + newsContainer.clientHeight >=
    newsContainer.scrollHeight - 25;
  if (nearBottom) loadNews(false);
});

// -------------------- Quick Ask --------------------
document.addEventListener("mouseup", (e) => {
  const selection = window.getSelection()?.toString().trim();
  if (selection) {
    quickAsk.style.top = `${e.pageY - 30}px`;
    quickAsk.style.left = `${e.pageX + 10}px`;
    quickAsk.style.display = "flex";
    quickAsk.dataset.text = selection;
  } else {
    quickAsk.style.display = "none";
  }
});

quickAsk.addEventListener("click", () => {
  const selected = quickAsk.dataset.text || "";
  quickAsk.style.display = "none";
  openChatPanel(selected);
});

function openChatPanel(prefill = "") {
  document.querySelector(".chat-panel")?.remove();

  const panel = document.createElement("div");
  panel.className = "chat-panel";
  panel.innerHTML = `
    <div class="chat-header">
      <span>Ask AI</span>
      <button class="chat-close" aria-label="Close">×</button>
    </div>
    <div class="chat-body">
      ${
        prefill
          ? `<div class="message user"><b>Selected:</b> ${prefill}</div>`
          : `<div class="message user"><b>Tip:</b> Highlight any text and click “Ask AI”.</div>`
      }
    </div>
    <div class="chat-input">
      <textarea placeholder="Ask a question or say what you want to understand better..."></textarea>
      <button class="chat-send">Send</button>
    </div>
  `;

  document.body.appendChild(panel);

  const closeBtn = panel.querySelector(".chat-close");
  const sendBtn = panel.querySelector(".chat-send");
  const textarea = panel.querySelector("textarea");
  const bodyDiv = panel.querySelector(".chat-body");

  closeBtn.addEventListener("click", () => panel.remove());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") panel.remove();
  });

  sendBtn.addEventListener("click", async () => {
    const q = textarea.value.trim();
    if (!q) return;

    appendMsg(bodyDiv, "user", q);
    textarea.value = "";
    sendBtn.disabled = true;
    sendBtn.textContent = "Thinking…";

    try {
      const prompt = `
The user selected this excerpt (may be empty):
"${prefill}"

The user asks:
"${q}"

Please answer conversationally in 3–6 sentences. Be clear and specific.
If helpful, add one short example or implication.
      `.trim();

      const ai = await summarizeAndRecommend(config.OPENAI_KEY, {
        title: "Quick Ask",
        description: prompt,
      });

      const text = ai?.prediction || ai?.summary || "No response.";
      appendMsg(bodyDiv, "ai", text);
      bodyDiv.scrollTop = bodyDiv.scrollHeight;
    } catch (err) {
      appendMsg(bodyDiv, "ai", `⚠️ Error: ${err.message || "Failed to reply."}`);
    }

    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
  });
}

function appendMsg(container, role, htmlText) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  try {
    div.innerHTML = role === "ai" ? marked.parse(htmlText) : htmlText;
  } catch {
    div.innerHTML = htmlText;
  }
  container.appendChild(div);
}

// -------------------- Event Bindings --------------------
loadBtn.addEventListener("click", () => loadNews(true));
categorySelect.addEventListener("change", () => {
  console.log("🗂 Category changed:", categorySelect.value);
  loadNews(true);
});

init();
