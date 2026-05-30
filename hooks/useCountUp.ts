"use client";

import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number, duration = 1100): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const fromRef = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    fromRef.current = 0;
    startRef.current = 0;

    if (target === 0) { setValue(0); return; }

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(fromRef.current + (target - fromRef.current) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
      else setValue(target);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}
