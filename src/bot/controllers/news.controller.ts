// bun-news-service.ts
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';

// Bun-native "env"
const API_URLS = [
  { name: 'BBC', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', type: 'rss' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', type: 'rss' },
  { name: 'CNN', url: 'http://rss.cnn.com/rss/edition_world.rss', type: 'rss' },
  { name: 'Reuters', url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best', type: 'rss' }
] as any;

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['media:thumbnail', 'thumbnail'],
    ],
  },
});

// In-memory cache (Bun is single-threaded by default, safe for this)
const newsCache: { data: any; timestamp: number } = {
  data: null,
  timestamp: 0,
};

let currentSourceIndex = 0;

export async function getNewsUpdate() {
  const currentSource = API_URLS[currentSourceIndex] ;
  try {
    const now = Date.now();
    if (newsCache.data && now - newsCache.timestamp < 24 * 60 * 60 * 1000) {
      return newsCache.data;
    }

    const newsData = await fetchNews(currentSource);
    newsCache.data = newsData;
    newsCache.timestamp = now;
    return newsData;
  } catch (error: any) {
    console.error(`❌ Error fetching from ${currentSource.name}:`, error.message);
  } finally {
    currentSourceIndex = (currentSourceIndex + 1) % API_URLS.length;
  }
}

async function fetchNews(source: any) {
  if (source.type === 'rss') {
    return await fetchRssNews(source);
  }
}

async function fetchRssNews(source: any) {
  const feed = await parser.parseURL(source.url);
  const item = feed.items[0] as any;

  let mediaUrl = item.media?.['$']?.url || item.thumbnail?.['$']?.url || null;
  const mediaType = mediaUrl?.includes('.mp4') ? 'video' : mediaUrl ? 'photo' : null;

  const fullContent = await extractFullArticle(item.link);

  return {
    title: item.title,
    summary: item.contentSnippet || item.content || '',
    fullContent,
    mediaUrl,
    mediaType,
    fullArticleUrl: item.link,
    source: source.name
  };
}

async function extractFullArticle(url: string): Promise<string> {
  try {
    console.log(`🌐 Fetching article from: ${url}`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'BunBot/1.0 (https://bun.sh)'
      }
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    let text = $('article').text().trim()
      || $('.article-body').text().trim()
      || $('main').text().trim()
      || $('body').text().trim();

    return text.length > 300 ? cleanText(text) : '❌ Could not extract a meaningful article.';
  } catch (err: any) {
    console.error('🛑 Article extraction failed:', err.message);
    return '❌ Could not retrieve the full article.';
  }
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/(?:\r\n|\r|\n)/g, ' ')
    .replace(/(\*\*|__|\*|`|_)/g, '') // Remove Markdown
    .trim()
    .slice(0, 600) + '...';
}

export async function sendNewsUpdate(ctx: any, newsData: any) {
    const chatId = ctx.message.from.id
  try {
    const firstLine = newsData.fullContent.split('.').slice(0, 2).join('.') + '.';
    const caption = `📰 *${escapeMarkdown(newsData.title)}*\n\n• ${escapeMarkdown(firstLine)}\n\n[Notifycast+](https://t.me/Notifycast)  |  [${newsData.source}](${newsData.fullArticleUrl})`;

    const inlineKeyboard = {
      inline_keyboard: [[
        { text: 'Read Full News 📰', url: newsData.fullArticleUrl }
      ]]
    };

    if (newsData.mediaType === 'photo' && newsData.mediaUrl) {
      const res = await ctx.telegram.sendPhoto(chatId, newsData.mediaUrl, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: inlineKeyboard
      });
      if (res) {
        return true;
      }
    } else if (newsData.mediaType === 'video' && newsData.mediaUrl) {
      const res = await ctx.telegram.sendVideo(chatId, newsData.mediaUrl, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: inlineKeyboard
      });
      if (res) {
        return true;
      }
    } else {
      const res = await ctx.telegram.sendMessage(chatId, caption, {
        parse_mode: 'Markdown',
        reply_markup: inlineKeyboard
      });
      if (res) {
        return true;
      }
    }

    console.log(`✅ Sent news from ${newsData.source}`);
  } catch (err:  any) {
    console.error('❌ Failed to send news:', err.message);
  }
}

function escapeMarkdown(text: string): string {
  return text.replace(/([_*[\]()~`>#+=|{}.!-])/g, '\\$1');
}
