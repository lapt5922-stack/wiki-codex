"use client";

import React, { useMemo } from "react";
import type { HeraldryDesignData } from "@/types/heraldry";
import { renderHeraldryToSvgString } from "@/lib/heraldry/renderer-and-export";

interface HeraldrySvgPreviewProps {
  design: HeraldryDesignData;
  uid: string;
  size?: number;
  className?: string;
}

export function HeraldrySvgPreview({
  design,
  uid,
  size,
  className = "w-full h-full"
}: HeraldrySvgPreviewProps) {
  const svgMarkup = useMemo(
    () => renderHeraldryToSvgString(design, { uid }),
    [design, uid]
  );

  return (
    <div
      className={size ? "shrink-0 [&>svg]:w-full [&>svg]:h-full" : className}
      style={size ? { width: size, height: size } : undefined}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
