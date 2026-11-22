"use client";

import { useEffect, useState } from "react";

interface Options {
  initial: number;
  min: number;
  max: number;
  /** which edge of the screen the panel is attached to */
  side: "left" | "right";
}

export function useResizablePanel({ initial, min, max, side }: Options) {
  const [width, setWidth] = useState(initial);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (event: MouseEvent) => {
      const raw = side === "left" ? event.clientX : window.innerWidth - event.clientX;
      setWidth(Math.min(max, Math.max(min, raw)));
    };

    const onUp = () => setDragging(false);

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [dragging, min, max, side]);

  return {
    width,
    dragging,
    startDragging: () => setDragging(true),
  };
}
