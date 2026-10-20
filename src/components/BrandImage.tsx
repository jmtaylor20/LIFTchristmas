"use client";

import { useEffect, useRef, useState } from "react";

/** Shows a logo image, falling back to a star if the file hasn't been added yet. */
export function BrandImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // The image may fail before React hydrates, in which case onError never fires.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    return (
      <svg viewBox="0 0 24 24" aria-label={alt} className={`${className} text-copper-500`} fill="currentColor">
        <path d="M12 1.5l2.6 7.1 7.4.3-5.8 4.6 2.1 7.2L12 16.6l-6.3 4.1 2.1-7.2L2 8.9l7.4-.3z" />
      </svg>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt={alt} className={`object-contain ${className}`} onError={() => setFailed(true)} />;
}
