import React from "react";
import Image from "next/image";

interface GmfLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function GmfLogo({
  className = "",
  width = 180,
  height = 48,
}: GmfLogoProps) {
  return (
    <Image
      src="/gmflogo.svg"
      alt="GMF AeroAsia"
      className={className}
      width={width}
      height={height}
      priority
    />
  );
}
