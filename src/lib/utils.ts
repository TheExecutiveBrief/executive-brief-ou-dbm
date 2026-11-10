export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatAdminDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatAdminDateTime(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  }).format(date);
}

export function getCurrentDateFormatted(): string {
  const now = new Date();
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);
}

/**
 * Checks whether a string contains meaningful non-whitespace text.
 */
export function hasMeaningfulText(value?: string | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Checks whether a pull quote contains actual quote text.
 * Quotation mark components must only render when an actual quotation exists.
 */
export function hasValidPullQuote(
  pullQuote?: { quote?: string | null; attribution?: string | null } | null
): boolean {
  if (!pullQuote || typeof pullQuote !== "object") return false;
  return hasMeaningfulText(pullQuote.quote);
}

/**
 * Checks whether a callout contains at least a title or body content.
 */
export function hasValidCallout(
  callout?: { title?: string | null; content?: string | null } | null
): boolean {
  if (!callout || typeof callout !== "object") return false;
  return hasMeaningfulText(callout.title) || hasMeaningfulText(callout.content);
}

/**
 * Checks whether an article section has meaningful content:
 * heading, at least one non-empty paragraph, bullet points, valid pull quote, or valid callout.
 * Sections with no meaningful content should not be rendered.
 */
export function isMeaningfulSection(section: {
  heading?: string | null;
  paragraphs?: (string | null | undefined)[];
  bulletPoints?: (string | null | undefined)[];
  pullQuote?: { quote?: string | null; attribution?: string | null } | null;
  callout?: { title?: string | null; content?: string | null } | null;
}): boolean {
  if (!section || typeof section !== "object") return false;
  if (hasMeaningfulText(section.heading)) return true;
  if (Array.isArray(section.paragraphs) && section.paragraphs.some(hasMeaningfulText)) return true;
  if (Array.isArray(section.bulletPoints) && section.bulletPoints.some(hasMeaningfulText)) return true;
  if (hasValidPullQuote(section.pullQuote)) return true;
  if (hasValidCallout(section.callout)) return true;
  return false;
}

