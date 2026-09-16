"use client";

import { useEffect } from "react";

export function ClientScript({ src }: { src: string }) {
  useEffect(() => {
    if (document.querySelector(`script[data-bitcat-src="${src}"]`)) return;

    const script = document.createElement("script");
    script.src = src;
    script.dataset.bitcatSrc = src;
    document.body.appendChild(script);
  }, [src]);

  return null;
}
