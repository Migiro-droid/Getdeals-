import { useState, useRef, useEffect } from "react";

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
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const maxRetries = 2;

  // Reset state when src changes
  useEffect(() => {
    if (src !== currentSrc) {
      setCurrentSrc(src);
      setHasErrored(false);
      setIsLoaded(false);
      setRetryCount(0);
    }
  }, [src]);

  const handleError = () => {
    if (retryCount < maxRetries && !hasErrored) {
      // First retry with a slight delay
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setCurrentSrc(src + (src.includes('?') ? '&' : '?') + 't=' + Date.now());
      }, 100 * (retryCount + 1));
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
    <div className={`relative ${className}`} style={{ minHeight: '100%', minWidth: '100%' }}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-contain transition-opacity duration-300 ${!isLoaded ? 'opacity-0' : 'opacity-100'}`}
        loading={loading}
        decoding={decoding}
        onError={handleError}
        onLoad={handleLoad}
        style={{ 
          display: 'block',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      />
    </div>
  );
}
