import { useState, useEffect, useRef, useCallback } from "react";

const THRESHOLD = 80;
const MAX_PULL = 140;

export default function usePullToRefresh(onRefresh: () => void | Promise<void>) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const active = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const scrollEl = e.currentTarget as HTMLElement;
    if (scrollEl.scrollTop > 0 || refreshing) return;
    startY.current = e.touches[0].clientY;
    active.current = true;
  }, [refreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!active.current) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, MAX_PULL));
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (!active.current) return;
    active.current = false;
    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(50);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, onRefresh]);

  useEffect(() => {
    const scrollEl = document.querySelector("main");
    if (!scrollEl) return;
    scrollEl.addEventListener("touchstart", handleTouchStart, { passive: true });
    scrollEl.addEventListener("touchmove", handleTouchMove, { passive: true });
    scrollEl.addEventListener("touchend", handleTouchEnd);
    return () => {
      scrollEl.removeEventListener("touchstart", handleTouchStart);
      scrollEl.removeEventListener("touchmove", handleTouchMove);
      scrollEl.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { pullDistance, refreshing };
}
