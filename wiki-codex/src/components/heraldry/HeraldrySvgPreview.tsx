"use client";

import React, { useMemo } from "react";
import type { HeraldryDesignData } from "@/types/heraldry";
import { renderHeraldryToSvgString } from "@/lib/heraldry/renderer-and-export";

interface HeraldrySvgPreviewProps {
  design: HeraldryDesignData;
  uid: string;
  className?: string;
}

export function HeraldrySvgPreview({
  design,
  uid,
  className = "w-full h-full"
}: HeraldrySvgPreviewProps) {
  const svgMarkup = useMemo(
    () => renderHeraldryToSvgString(design, { uid }),
    [design, uid]
  );

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
