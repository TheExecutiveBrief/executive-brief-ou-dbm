export function getArticleUrl(slug: string): string {
  return `/articles/${encodeURIComponent(slug)}`;
}

export function getCategoryAnchor(slug: string): string {
  const map: Record<string, string> = {
    "special-report": "/#cover-story",
    business: "/#business-desk",
    campus: "/#campus-desk",
    research: "/#research-desk",
    voices: "/#voices-desk",
    careers: "/#campus-desk",
  };
  return map[slug] || "/#cover-story";
}
