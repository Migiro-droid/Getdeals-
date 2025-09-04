import { useState, useRef, useEffect, useLayoutEffect } from "react";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
  onLoad?: () => void;
  onError?: () => void;
}

export function ImageWithFallback({
  src,
  alt,
  fallbackSrc = "/placeholder.svg",
  className = "",
  loading = "eager",
  decoding = "sync",
  onLoad,
  onError,
}: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasErrored, setHasErrored] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 0; 

  useEffect(() => {
    if (src !== currentSrc) {
      setCurrentSrc(src);
      setHasErrored(false);
      setIsLoaded(false);
      setRetryCount(0);
    }
  }, [src]);

  // If the image is already cached, ensure we mark it as loaded
  useLayoutEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [currentSrc]);

  const handleError = () => {
  if (retryCount < maxRetries && !hasErrored) {
      // retries disabled
    } else if (!hasErrored && currentSrc !== fallbackSrc) {
      setHasErrored(true);
      setCurrentSrc(fallbackSrc);
      onError?.();
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      onError={handleError}
      onLoad={handleLoad}
      style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
    />
  );
}
