// config.js
export async function getConfig() {
  const OPENAI_KEY = "OPENAIKEY";
if (!OPENAI_KEY.startsWith("sk-")) {
    console.warn("⚠️ Missing or invalid OpenAI key in config.js");
  }

  return {
    OPENAI_KEY,
    NEWS_FEED_URL: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
  };
}
