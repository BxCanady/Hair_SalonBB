"use client";

import { useState, type ImgHTMLAttributes } from "react";
import { buildFallbackImageSources } from "@/lib/imageCandidates";

type FallbackImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "onError" | "onLoad" | "src"> & {
  src?: string | null;
  title: string;
  originalThumbnailUrl?: string | null;
  alternativeUrls?: Array<string | null | undefined>;
  localImageUrl?: string | null;
};

export default function FallbackImage(props: FallbackImageProps) {
  const identity = [
    props.src,
    props.originalThumbnailUrl,
    props.title,
    props.localImageUrl,
    ...(props.alternativeUrls ?? []),
  ].join("|");
  return <FallbackImageContent key={identity} {...props} />;
}

function FallbackImageContent({
  src,
  title,
  originalThumbnailUrl,
  alternativeUrls,
  localImageUrl,
  alt = `${title} hairstyle`,
  className,
  loading = "lazy",
  ...props
}: FallbackImageProps) {
  const sources = buildFallbackImageSources({
    primaryUrl: src,
    originalThumbnailUrl,
    alternativeUrls,
    title,
    localImageUrl,
  });
  const [sourceIndex, setSourceIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const source = sources[sourceIndex];
  if (!source) {
    return (
      <div className={className} role="img" aria-label={`${alt}. Image unavailable.`}>
        <span className="flex h-full min-h-24 w-full items-center justify-center bg-white/[0.04] text-sm text-purple-100/60">
          Image unavailable
        </span>
      </div>
    );
  }

  return (
    // Remote image hosts vary, so native loading is required to attempt the unrestricted candidate set.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      src={source}
      alt={alt}
      loading={loading}
      className={`${className ?? ""} ${isLoaded ? "" : "animate-pulse bg-white/10"}`}
      onLoad={() => setIsLoaded(true)}
      onError={() => {
        setIsLoaded(false);
        setSourceIndex((index) => index + 1);
      }}
    />
  );
}
