"use client";

import { useEffect, useState } from "react";

const ANIMATION_TIME = 2000;

export const useAnimationConfig = (value: number | undefined) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setIsAnimating(true);
    const timeout = setTimeout(() => {
      setDisplayValue(value);
      setIsAnimating(false);
    }, ANIMATION_TIME);

    return () => clearTimeout(timeout);
  }, [value]);

  return {
    isAnimating,
    displayValue,
  };
};
