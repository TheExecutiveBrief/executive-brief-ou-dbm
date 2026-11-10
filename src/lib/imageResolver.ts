/**
 * Universal Image URL Resolver for The Executive Brief.
 * Resolves cloud sharing links (Google Drive, Dropbox, etc.) into direct CDN/image URLs,
 * and handles fallback and proxy generation.
 */

export const FALLBACK_IMAGE = "/images/article-image-unavailable.svg";

/**
 * Resolves cloud sharing URLs (such as Google Drive or Dropbox) to direct, publicly viewable image URLs.
 */
export function resolveImageUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";

  // If it's already an absolute path or relative URL, return as-is
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);

    // 1. Google Drive Sharing Links
    // Matches: https://drive.google.com/file/d/{FILE_ID}/view...
    // or https://drive.google.com/open?id={FILE_ID}
    // or https://drive.google.com/uc?id={FILE_ID}
    if (parsed.hostname === "drive.google.com") {
      let fileId: string | null = null;

      const fileMatch = parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileMatch && fileMatch[1]) {
        fileId = fileMatch[1];
      } else if (parsed.searchParams.get("id")) {
        fileId = parsed.searchParams.get("id");
      }

      if (fileId) {
        // lh3.googleusercontent.com/d/{id} is Google's ultra-fast, direct public image delivery CDN
        return `https://lh3.googleusercontent.com/d/${fileId}`;
      }
    }

    // 2. Google Drive direct export URL (convert to googleusercontent for reliable CDN caching)
    if (parsed.hostname === "drive.google.com" && parsed.pathname === "/uc") {
      const id = parsed.searchParams.get("id");
      if (id) {
        return `https://lh3.googleusercontent.com/d/${id}`;
      }
    }

    // 3. Dropbox Sharing Links: convert to direct raw stream
    if (parsed.hostname === "www.dropbox.com" || parsed.hostname === "dropbox.com") {
      parsed.searchParams.set("raw", "1");
      return parsed.toString();
    }

    // 4. Other valid HTTP / HTTPS image URLs (iStock, Unsplash, Pexels, Supabase Storage, etc.)
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return trimmed;
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

/**
 * Checks if a string is a valid HTTP/HTTPS URL
 */
export function isValidHttpUrl(stringToTest?: string | null): boolean {
  if (!stringToTest) return false;
  try {
    const url = new URL(stringToTest);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
