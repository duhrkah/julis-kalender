'use client';

import Image from 'next/image';

interface JuLisLogoProps {
  className?: string;
  size?: number;
}

export default function JuLisLogo({ className = '', size = 40 }: JuLisLogoProps) {
  return (
    <Image
      src="/logo.svg"
      alt="JuLis Logo"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
