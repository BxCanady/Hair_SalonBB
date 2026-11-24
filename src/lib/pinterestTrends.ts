import "server-only";

export interface PinterestTrendCard {
  id: string;
  title: string;
  description: string;
  pinUrl: string;
  imageUrl: string;
  service: "Micro Locs" | "Custom Braided Perfection" | "Short Hair Gripper";
}

const FALLBACK_CARDS: PinterestTrendCard[] = [
  {
    id: "pin-fallback-1",
    title: "Micro Locs Grid & Parting Inspiration",
    description: "Lightweight loc sizing and neat grid ideas for fresh installs.",
    pinUrl: "https://www.pinterest.com/",
    imageUrl: "/images/styles/micro-locs.jpg",
    service: "Micro Locs",
  },
  {
    id: "pin-fallback-2",
    title: "Boho & Custom Braided Finish",
    description: "Tailored knotless and custom braided patterns with soft movement.",
    pinUrl: "https://www.pinterest.com/",
    imageUrl: "/images/styles/custom-braids.jpg",
    service: "Custom Braided Perfection",
  },
  {
    id: "pin-fallback-3",
    title: "Short Hair Grip & Tapered Braids",
    description: "Clean, low-tension gripping ideas for shorter natural hair.",
    pinUrl: "https://www.pinterest.com/",
    imageUrl: "/images/styles/short-hair.jpg",
    service: "Short Hair Gripper",
  },
];

function inferService(text: string): PinterestTrendCard["service"] {
  const lower = text.toLowerCase();
  if (lower.includes("micro loc") || lower.includes("loc")) return "Micro Locs";
  if (lower.includes("short hair") || lower.includes("taper") || lower.includes("grip")) {
    return "Short Hair Gripper";
  }
  return "Custom Braided Perfection";
}

type PinterestPin = {
  id?: string;
  title?: string;
  description?: string;
  link?: string;
  url?: string;
  media?: {
    images?: {
      "600x"?: { url?: string };
      "400x300"?: { url?: string };
      originals?: { url?: string };
    };
  };
};

export async function getTrendingPinterestStyles(): Promise<PinterestTrendCard[]> {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  const boardId = process.env.PINTEREST_BOARD_ID;

  if (!token || !boardId) return FALLBACK_CARDS;

  try {
    const response = await fetch(
      `https://api.pinterest.com/v5/boards/${encodeURIComponent(boardId)}/pins?page_size=6`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        next: { revalidate: 3600, tags: ["pinterest-trends"] },
      },
    );

    if (!response.ok) {
      console.error(`Pinterest board request failed with status ${response.status}.`);
      return FALLBACK_CARDS;
    }

    const data: unknown = await response.json();
    const items =
      typeof data === "object" && data !== null && "items" in data && Array.isArray(data.items)
        ? (data.items as PinterestPin[])
        : [];

    const cards = items.map((pin) => {
      const title = (pin.title || "Trending Braid & Loc Look").trim();
      const description = (
        pin.description || "Saved look inspiration for your next appointment."
      ).trim();
      const imageUrl =
        pin.media?.images?.["600x"]?.url ||
        pin.media?.images?.originals?.url ||
        pin.media?.images?.["400x300"]?.url ||
        "/images/styles/custom-braids.jpg";
      const id = pin.id ? String(pin.id) : crypto.randomUUID();

      return {
        id,
        title,
        description,
        pinUrl: pin.link || pin.url || (pin.id ? `https://www.pinterest.com/pin/${pin.id}` : "https://www.pinterest.com/"),
        imageUrl,
        service: inferService(`${title} ${description}`),
      } satisfies PinterestTrendCard;
    });

    return cards.length > 0 ? cards : FALLBACK_CARDS;
  } catch (error) {
    console.error("Pinterest board request failed.", error instanceof Error ? error.message : error);
    return FALLBACK_CARDS;
  }
}
