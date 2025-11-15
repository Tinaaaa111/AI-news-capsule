# AI-news-capsule
# AI News Capsule  
**See today. Understand tomorrow. Build the future.**

AI News Capsule is a next-generation Chrome extension that transforms how people read and understand the news.  
It combines the power of **OpenAI GPT-4o-mini**, **Gemini**, and **Google News RSS** to automatically summarize, analyze, and predict what’s next — all within your browser.

---

## Overview  

Modern news moves faster than ever, but understanding it shouldn’t take hours.  
AI News Capsule was designed to be a **personal AI analyst** inside Chrome — one that reads real headlines, extracts meaning, predicts trends, and provides actionable recommendations.

Unlike typical news apps or aggregators, this extension doesn’t just show articles — it **thinks about them**.

---

## Core Features  

### **1. Real-Time AI Summarization**
- Pulls fresh headlines from Google News RSS across categories such as:
  - Top Stories
  - Business
  - Technology
  - Health
  - Science
  - Sports
  - Entertainment  
- Generates a **clear, concise 4–6 sentence summary** for each article using hybrid Gemini + OpenAI processing.  

---

### **2. Predictive & Analytical Insights**
Each story includes a **Prediction (Effect)** — short- and long-term implications —  
and **Recommendations** — 2–3 actionable takeaways.  
This transforms the extension from a simple reader into an **AI forecaster**, giving you:
- Cause-and-effect reasoning  
- Forecasts on market, policy, or social impact  
- Context-aware advice for decision-making  

---

### **3. Ask AI — Conversational Intelligence**
Highlight any piece of text or click “Ask AI 💬” to open an interactive chat panel.  
- Ask questions about a topic, event, or concept in plain English.  
- The AI answers conversationally, citing real-world context.  
- Works for both general questions and specific article insights.  

This makes the extension double as a **mini AI inside your browser** — but contextually grounded in live news.

---

### **4. Local, Private, and Lightweight**
- Built entirely on **Manifest V3**, meaning all scripts are securely sandboxed.  
- Uses **no remote storage or tracking**.  
- The OpenAI key is stored locally in the user’s configuration file (`config.js`).  
- No login, no cookies, and no analytics.  

Your reading experience remains private — the AI processes only public RSS data and ephemeral session queries.

---

## Technical Architecture  

| Component | Purpose |
|------------|----------|
| **popup.html / popup.js** | Core UI for displaying headlines and AI insights |
| **rss.js** | Fetches and parses live Google News RSS feeds |
| **openai.js** | Hybrid AI engine combining Gemini and GPT-4o-mini |
| **markdown.js** | Custom lightweight Markdown parser for readable formatting |
| **config.js** | Local storage of OpenAI API key (user-side only) |
| **popup.css** | Clean UI styling with orange-accented news cards |
| **manifest.json** | Defines Chrome extension permissions and structure (Manifest V3) |

---

## Tech Stack  

- **Frontend:** HTML, CSS, JavaScript (ES6 Modules)  
- **AI Layer:** OpenAI GPT-4o-mini & Gemini  
- **Data Source:** Google News RSS  
- **Framework:** Chrome Extension (Manifest V3)  
- **Rendering:** Markdown-to-HTML parsing for structured summaries  

---

## Workflow  

1. User selects a **category** (Business, Technology, etc.).  
2. The extension fetches live news via **Google RSS Feed**.  
3. Headlines are passed to the **Hybrid AI Processor**:
   - Gemini first summarizes  
   - OpenAI enhances context, prediction, and recommendations  
4. The extension renders a **three-part insight card**:
   - Summary → Prediction → Recommendation  
5. On clicking **Read More**, AI performs a deeper contextual expansion.  
6. Users can highlight any text to **Ask AI**, triggering conversational reasoning.  

---

## Privacy  

AI News Capsule **does not collect or share personal data.**  
All operations occur locally within the Chrome environment.  
The only external calls are to the **OpenAI** and **Gemini** APIs for text generation — triggered by the user and limited to public content.  

> Your API key stays on your device.  
> No logs, no analytics, no third-party cookies.

---

##  Future Roadmap  

**Stage 1 (Current):** Hybrid summarization, prediction, and Ask-AI chat  
**Stage 2:** Personalized insight feeds based on reading habits  
**Stage 3:** Predictive radar visualizations and trend timelines  
**Stage 4:** Cross-source lens blending Google News, Reddit, and X threads  
**Stage 5:** Voice-based summaries and daily digest mode  

---

##  Inspiration  

The project was inspired by **Google Gemini’s integration into Chrome** —  
but reimagined for real-time news understanding.  
Instead of static articles, AI News Capsule delivers **dynamic insight** that evolves as stories develop — turning daily headlines into a source of learning, foresight, and creativity.

---

##  Developer  

**Tinsae Tesfaye**  

Building tools that turn information overload into intelligent clarity.  
> “News shouldn’t just inform — it should inspire understanding.”

---

##  Keywords  

`AI` `Chrome Extension` `OpenAI` `Gemini` `NewsTech` `Predictive Analytics`  
`RSS Feeds` `AI Summarization` `Generative AI` `Web Automation`

