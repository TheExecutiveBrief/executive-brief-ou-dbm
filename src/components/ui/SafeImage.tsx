"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const FALLBACK_IMAGE = "/images/article-image-unavailable.svg";
const REMOTE_IMAGE_HOSTS = new Set([
  "images.openai.com",
  "images.unsplash.com",
  "thumbs.dreamstime.com",
]);

type SafeImageProps = Omit<ImageProps, "src" | "onError"> & {
  src?: string | null;
  onError?: ImageProps["onError"];
};

function getSupportedSource(src?: string | null): string {
  const source = src?.trim();
  if (!source) return FALLBACK_IMAGE;
  if (source.startsWith("/") && !source.startsWith("//")) return source;

  try {
    const url = new URL(source);
    if (url.protocol === "https:" && REMOTE_IMAGE_HOSTS.has(url.hostname)) {
      return source;
    }
  } catch {
    return FALLBACK_IMAGE;
  }

  return FALLBACK_IMAGE;
}

export default function SafeImage({ src, onError, ...imageProps }: SafeImageProps) {
  const supportedSource = getSupportedSource(src);

  return (
    <SafeImageWithFallback
      key={supportedSource}
      src={supportedSource}
      onError={onError}
      {...imageProps}
    />
  );
}

function SafeImageWithFallback({
  src,
  alt,
  onError,
  ...imageProps
}: Omit<SafeImageProps, "src"> & { src: string }) {
  const [hasFailed, setHasFailed] = useState(false);

  return (
    <Image
      {...imageProps}
      alt={alt}
      src={hasFailed ? FALLBACK_IMAGE : src}
      onError={(event) => {
        onError?.(event);
        if (!hasFailed) setHasFailed(true);
      }}
    />
  );
}