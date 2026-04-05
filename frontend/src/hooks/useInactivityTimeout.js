import { useEffect, useRef } from "react";

export function useInactivityTimeout(timeoutMs, onTimeout) {
  const timer = useRef(null);
  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(onTimeout, timeoutMs);
  };
  useEffect(() => {
    const events = ["mousedown","mousemove","keydown","scroll","touchstart","click"];
    events.forEach(e => window.addEventListener(e, reset, true));
    reset();
    return () => {
      events.forEach(e => window.removeEventListener(e, reset, true));
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
}
