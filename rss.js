export async function fetchRssHeadlines(category, dayOffset = 0, limit = 10) {
  const categoryFeeds = {
    top: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
    business: "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en",
    technology: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en",
    health: "https://news.google.com/rss/headlines/section/topic/HEALTH?hl=en-US&gl=US&ceid=US:en",
    science: "https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-US&gl=US&ceid=US:en",
    sports: "https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-US&gl=US&ceid=US:en",
    entertainment: "https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-US&gl=US&ceid=US:en",
  };

  const feedUrl = categoryFeeds[category] || categoryFeeds.top;
  const rss2json = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;

  try {
    const res = await fetch(rss2json);
    if (!res.ok) throw new Error(`RSS2JSON failed with status ${res.status}`);

    const data = await res.json();
    if (!data.items) throw new Error("No items found in RSS feed.");

    const articles = data.items.slice(0, limit).map((item) => ({
      title: item.title || "Untitled",
      description: clean(item.description || ""),
      publishedAt: item.pubDate || "",
      url: item.link || "",
      source: item.source || data.feed?.title || "Google News",
    }));

    const shifted = articles.map((a) => ({
      ...a,
      publishedAt: new Date(
        new Date(a.publishedAt || Date.now()).getTime() - dayOffset * 86400000
      ).toISOString(),
    }));

    console.log(`🗞️ Loaded ${shifted.length} headlines for ${category} (offset ${dayOffset})`);
    return shifted;
  } catch (err) {
    console.error("⚠️ RSS fetch failed:", err);
    return [];
  }
}

// Helper
function clean(str) {
  if (!str) return "";
  return str
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}
