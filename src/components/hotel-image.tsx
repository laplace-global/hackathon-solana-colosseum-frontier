'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Building2 } from 'lucide-react';

interface HotelImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function HotelImage({ src, alt, className = '', fallbackClassName = '' }: HotelImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-card ${fallbackClassName}`}>
        <Building2 className="h-16 w-16 text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center bg-card`}>
          <Building2 className="h-16 w-16 animate-pulse text-muted-foreground" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover ${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        onLoad={() => setIsLoading(false)}
      />
    </>
  );
}