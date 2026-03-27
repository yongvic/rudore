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
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml))) {
    const itemXml = match[1];
    const title = extractTag(itemXml, "title");
    const link = extractTag(itemXml, "link");
    const description = extractTag(itemXml, "description");
    if (title && link) {
      items.push({ title, link, description });
    }
  }

  return items;
}

function extractTag(xml: string, tag: string) {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  return match?.[1]?.replace(/<!\\[CDATA\\[|\\]\\]>/g, "").trim() ?? "";
}
