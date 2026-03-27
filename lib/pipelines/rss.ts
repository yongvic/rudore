export type RssItem = {
  title: string;
  link: string;
  description?: string;
};

export async function fetchRss(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`RSS fetch failed (${response.status}).`);
  }

  const xml = await response.text();
  const rssItems = parseItems(xml, "item", (entry) => {
    const title = extractTag(entry, "title");
    const link = extractTag(entry, "link");
    const description = extractTag(entry, "description");
    return title && link ? { title, link, description } : null;
  });

  if (rssItems.length > 0) {
    return rssItems;
  }

  const atomItems = parseItems(xml, "entry", (entry) => {
    const title = extractTag(entry, "title");
    const link = extractAttr(entry, "link", "href") || extractTag(entry, "link");
    const description =
      extractTag(entry, "summary") || extractTag(entry, "content");
    return title && link ? { title, link, description } : null;
  });

  return atomItems;
}

function parseItems(
  xml: string,
  tag: string,
  builder: (entry: string) => RssItem | null
) {
  const items: RssItem[] = [];
  const itemRegex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "gi");
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml))) {
    const entry = match[1];
    const item = builder(entry);
    if (item) {
      items.push(item);
    }
  }

  return items;
}

function extractTag(xml: string, tag: string) {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  return match?.[1]?.replace(/<!\\[CDATA\\[|\\]\\]>/g, "").trim() ?? "";
}

function extractAttr(xml: string, tag: string, attr: string) {
  const regex = new RegExp(`<${tag}[^>]*${attr}=\"([^\"]+)\"[^>]*>`, "i");
  const match = xml.match(regex);
  return match?.[1]?.trim() ?? "";
}
