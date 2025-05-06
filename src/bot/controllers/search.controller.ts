import axios from "axios";

const searchService = async (ctx: any, query: any) => {
    const chatId = ctx.message.from.id
  try {
    const response = await axios.get(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&utf8=`
    );

    const results = response.data.query.search.slice(0, 5);

    if (results.length === 0) {
      await ctx.telegram.sendMessage(
        chatId,
        `📚 I couldn't find anything useful for that. Try rephrasing your question!`
      );
      return;
    }

    let messageText = `📚 Here's what I found for *${query}*:\n\n`;

    for (const [index, result] of results.entries()) {
      const cleanedSnippet = cleanAndFormatSnippet(result.snippet);
      const emoji = getRandomEmoji();
      messageText += `${emoji} *${result.title}*\n${cleanedSnippet}\n\n`;
    }

    messageText += `🔗 *Explore more directly on Wikipedia:*\n`;
    results.forEach((result: any, index: any) => {
      const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, "_"))}`;
      messageText += `${index + 1}. [${result.title}](${url})\n`;
    });

    messageText += `\n💬 Tip: You can ask follow-up questions for more specific info!`;

    await ctx.telegram.sendMessage(chatId, messageText, {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });
  } catch (error) {
    console.error("Search error:", error);
    await ctx.telegram.sendMessage(
      chatId,
      "⚠️ Something went wrong while searching. Please try again shortly."
    );
  }
};

// 🧼 Clean and improve Wikipedia snippet
const cleanAndFormatSnippet = (snippet: any) => {
  let text = snippet
    .replace(/<\/?[^>]+(>|$)/g, "") // remove HTML tags
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  // Capitalize first letter, ensure it ends with a period
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (!/[.?!]$/.test(text)) text += ".";

  // Optional: truncate overly long snippets
  if (text.length > 250) {
    text = text.slice(0, 240).trim() + "...";
  }

  return text;
};

const getRandomEmoji = () => {
  const emojis = ["🌟", "💡", "🔍", "📚", "🧠", "🌈", "🌞", "🌺", "🍀", "🦋"];
  return emojis[Math.floor(Math.random() * emojis.length)];
};

export default searchService;
