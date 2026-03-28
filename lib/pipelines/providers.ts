export type SourceProvider = "generic" | "rss";

export const sourceProviderMap: Record<string, SourceProvider> = {
  Regulatory: "rss",
  Media: "rss",
  Trends: "rss",
  Research: "generic",
};
