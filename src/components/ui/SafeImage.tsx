"use client";

import Image, { type ImageProps } from "next/image";
import { useState, useMemo } from "react";
import { resolveImageUrl, FALLBACK_IMAGE, isValidHttpUrl } from "@/lib/imageResolver";

export { FALLBACK_IMAGE };

export type SafeImageProps = Omit<ImageProps, "src" | "onError"> & {
  src?: string | null;
  onError?: ImageProps["onError"];
  disableProxyFallback?: boolean;
};

export default function SafeImage({
  src,
  onError,
  disableProxyFallback = false,
  ...imageProps
}: SafeImageProps) {
  // 1. Resolve source (converts Google Drive share links, etc. into direct CDN links)
  const resolvedSource = useMemo(() => {
    const raw = src?.trim();
    if (!raw) return FALLBACK_IMAGE;
    if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
    if (isValidHttpUrl(raw)) return resolveImageUrl(raw);
    return FALLBACK_IMAGE;
  }, [src]);

  return (
    <SafeImageCore
      key={resolvedSource}
      originalUrl={src?.trim() || ""}
      initialSource={resolvedSource}
      disableProxyFallback={disableProxyFallback}
      onError={onError}
      {...imageProps}
    />
  );
}

function SafeImageCore({
  originalUrl,
  initialSource,
  alt,
  onError,
  disableProxyFallback,
  unoptimized,
  ...imageProps
}: Omit<SafeImageProps, "src"> & {
  originalUrl: string;
  initialSource: string;
}) {
  // Stage 0: Initial direct URL
  // Stage 1: SSRF-safe proxy (/api/proxy-image?url=...) unoptimized
  // Stage 2: Final fallback SVG (/images/article-image-unavailable.svg)
  const [loadStage, setLoadStage] = useState<0 | 1 | 2>(
    initialSource === FALLBACK_IMAGE ? 2 : 0
  );

  const isExternalHttp = useMemo(() => {
    return isValidHttpUrl(initialSource);
  }, [initialSource]);

  const currentSrc = useMemo(() => {
    if (loadStage === 2) return FALLBACK_IMAGE;
    if (loadStage === 1 && isExternalHttp && !disableProxyFallback) {
      return `/api/proxy-image?url=${encodeURIComponent(initialSource)}`;
    }
    return initialSource;
  }, [loadStage, initialSource, isExternalHttp, disableProxyFallback]);

  const shouldUseUnoptimized = useMemo(() => {
    if (unoptimized) return true;
    if (loadStage === 1) return true; // Proxy images should be rendered directly without double-optimization
    return false;
  }, [unoptimized, loadStage]);

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    onError?.(event);

    if (loadStage === 0) {
      if (isExternalHttp && !disableProxyFallback) {
        // Attempt retrieval via secure server-side proxy
        setLoadStage(1);
      } else {
        setLoadStage(2);
      }
    } else if (loadStage === 1) {
      // Proxy failed as well; fall back to unavailable SVG
      setLoadStage(2);
    }
  };

  return (
    <Image
      {...imageProps}
      alt={alt || "Article illustration"}
      src={currentSrc}
      unoptimized={shouldUseUnoptimized}
      onError={handleError}
    />
  );
}
