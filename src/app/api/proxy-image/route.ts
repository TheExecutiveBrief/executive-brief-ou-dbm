import { NextResponse } from "next/server";
import dns from "node:dns/promises";
import net from "node:net";

/**
 * SSRF Guard: Checks whether an IP address belongs to a private, loopback, or link-local range.
 */
function isPrivateIp(ip: string): boolean {
  if (!net.isIP(ip)) return true; // Invalid IP is treated as unsafe

  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    // 0.0.0.0/8
    if (parts[0] === 0) return true;
    // 10.0.0.0/8 (Private network)
    if (parts[0] === 10) return true;
    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true;
    // 169.254.0.0/16 (Link-local / Cloud metadata service e.g. 169.254.169.254)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 172.16.0.0/12 (Private network)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16 (Private network)
    if (parts[0] === 192 && parts[1] === 168) return true;
    // Broadcast / Multicast
    if (parts[0] >= 224) return true;
    return false;
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    // Loopback
    if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;
    // Unique local address fc00::/7
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    // Link-local address fe80::/10
    if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
    return false;
  }

  return true;
}

/**
 * Validates that a target URL is safe to fetch (prevents SSRF).
 */
async function validateUrlForSsrf(targetUrl: string): Promise<URL> {
  const parsed = new URL(targetUrl);

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Invalid protocol. Only HTTP and HTTPS are permitted.");
  }

  const hostname = parsed.hostname.toLowerCase();

  // Disallow obvious local/internal hosts
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname === "169.254.169.254" ||
    hostname === "metadata.google.internal"
  ) {
    throw new Error("Target hostname is restricted.");
  }

  // Resolve hostname via DNS to prevent DNS rebinding to internal addresses
  try {
    const lookup = await dns.lookup(hostname);
    if (isPrivateIp(lookup.address)) {
      throw new Error("Destination IP resolves to a private or restricted network.");
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "DNS resolution failed.";
    throw new Error(`SSRF Validation Failed: ${msg}`);
  }

  return parsed;
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get("url");

    if (!rawUrl) {
      return NextResponse.json({ error: "Missing image url parameter." }, { status: 400 });
    }

    const validatedUrl = await validateUrlForSsrf(rawUrl);

    // Fetch the image with timeout and redirect validation
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    let currentUrl = validatedUrl.toString();
    let response: Response | null = null;
    let redirectCount = 0;

    while (redirectCount <= 3) {
      response = await fetch(currentUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
        redirect: "manual",
      });

      // Handle redirects with re-validation
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) break;

        const nextUrl = new URL(location, currentUrl).toString();
        await validateUrlForSsrf(nextUrl);
        currentUrl = nextUrl;
        redirectCount++;
        continue;
      }

      break;
    }

    clearTimeout(timeout);

    if (!response || !response.ok) {
      return NextResponse.json(
        { error: `Upstream returned status ${response?.status || 502}` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      return NextResponse.json(
        { error: `Invalid content type: expected image/*, received ${contentType}` },
        { status: 415 }
      );
    }

    const contentLength = Number(response.headers.get("content-length") || "0");
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (contentLength > MAX_SIZE) {
      return NextResponse.json({ error: "Image exceeds 10MB limit." }, { status: 413 });
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: "Image exceeds 10MB limit." }, { status: 413 });
    }

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to proxy image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
