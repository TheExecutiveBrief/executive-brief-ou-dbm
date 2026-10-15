export function getArticleUrl(slug: string): string {
  return `/articles/${encodeURIComponent(slug)}`;
}

export function getDeskUrl(slug: string): string {
  return `/desks/${encodeURIComponent(slug)}`;
}

export function getArchiveUrl(): string {
  return `/archive`;
}

export function getIssueUrl(slug: string): string {
  return `/archive/${encodeURIComponent(slug)}`;
}

export function getCategoryAnchor(slug: string): string {
  const map: Record<string, string> = {
    "special-report": "/desks/special-report",
    business: "/desks/business",
    campus: "/desks/campus",
    research: "/desks/research",
    voices: "/desks/voices",
    careers: "/desks/careers",
  };
  return map[slug] || `/desks/${encodeURIComponent(slug)}`;
}
