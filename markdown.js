// markdown.js — final version that fixes inline numbered lists
export const marked = {
  parse(text) {
    if (!text) return "";

    // Sanitize HTML
    text = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headings
    text = text
      .replace(/^### (.*)$/gim, "<h4>$1</h4>")
      .replace(/^## (.*)$/gim, "<h3>$1</h3>")
      .replace(/^# (.*)$/gim, "<h2>$1</h2>");

    // Bold / italic
    text = text
      .replace(/\*\*(.*?)\*\*/gim, "<b>$1</b>")
      .replace(/\*(.*?)\*/gim, "<i>$1</i>");

    // ✅ FIX: detect inline "1. ... 2. ... 3." patterns even without newlines
    text = text.replace(/(\d+\.\s+)/g, "\n$1");

    // Numbered lists
    text = text.replace(/^\d+\.\s+(.+)/gim, "<li>$1</li>");
    // Bulleted lists
    text = text.replace(/^[-*•]\s+(.+)/gim, "<li>$1</li>");

    // Wrap consecutive list items in <ol> or <ul>
    text = text
      .replace(/(<li>[\s\S]*?<\/li>)(?!(\s*<li>|[\s\S]*<\/ol>))/gim, "<ol>$1</ol>")
      .replace(/(<li>[\s\S]*?<\/li>)(?!(\s*<li>|[\s\S]*<\/ul>))/gim, "<ul>$1</ul>");

    // Cleanup list markers
    text = text
      .replace(/<li>\d+\.\s+(.*?)<\/li>/g, "<li>$1</li>")
      .replace(/<li>[-*•]\s+(.*?)<\/li>/g, "<li>$1</li>");

    // Paragraphs and line breaks
    text = text.replace(/\n{2,}/g, "</p><p>");
    text = `<p>${text}</p>`;
    text = text.replace(/\n/g, "<br>");

    // Cleanup double wrapping
    text = text.replace(/<\/ol><ol>/g, "").replace(/<\/ul><ul>/g, "");

    return text.trim();
  },
};
