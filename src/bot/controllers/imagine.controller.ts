const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "your_pexels_api_key";
const PEXELS_BASE_URL = "https://api.pexels.com/v1";
const PEXELS_VIDEO_URL = "https://api.pexels.com/videos";

async function fetchPexels(query: string, type: "image" | "video" = "image"): Promise<string | null> {
  const endpoint =
    type === "image"
      ? `${PEXELS_BASE_URL}/search?query=${encodeURIComponent(query)}&per_page=1`
      : `${PEXELS_VIDEO_URL}/search?query=${encodeURIComponent(query)}&per_page=1`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!res.ok) {
      console.error(`❌ Pexels ${type} API failed with status ${res.status}`);
      return null;
    }

    const data = await res.json() as any;

    if (type === "image" && data.photos?.length > 0) {
      return data.photos[0].src.large2x || data.photos[0].src.original;
    }

    if (type === "video" && data.videos?.length > 0) {
      return data.videos[0].video_files?.find((f: { quality: string; }) => f.quality === "hd")?.link || data.videos[0].video_files[0]?.link;
    }

    return null;
  } catch (err) {
    console.error(`❌ Error fetching ${type} from Pexels:`, err);
    return null;
  }
}

export { fetchPexels };
